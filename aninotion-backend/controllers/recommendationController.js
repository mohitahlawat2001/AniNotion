/**
 * Recommendation Controller
 * 
 * Handles API requests for post recommendations and similar content discovery
 */

const Post = require('../models/Post');
const recommendationService = require('../utils/recommendationService');
const NodeCache = require('node-cache');
const logger = require('../config/logger');

// Cache recommendations for 1 hour (3600 seconds)
const recommendationCache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 600,
  maxKeys: 1000
});

/**
 * Get similar posts for a specific post
 * GET /api/recommendations/similar/:postId
 */
exports.getSimilarPosts = async (req, res) => {
  try {
    const { postId } = req.params;
    const {
      limit = 10,
      minScore = 0.1,
      includeBreakdown = false
    } = req.query;

    // Check cache first
    const cacheKey = `similar:${postId}:${limit}:${minScore}`;
    const cached = recommendationCache.get(cacheKey);
    
    if (cached) {
      logger.info(`Cache hit for similar posts: ${postId}`);
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    // Find target post
    const targetPost = await Post.findById(postId)
      .populate('category', 'name slug');
    
    if (!targetPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (targetPost.status !== 'published' || targetPost.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post is not available'
      });
    }

    // Get all published posts for comparison
    const allPosts = await Post.find({
      status: 'published',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    // Calculate engagement scores if needed
    for (const post of allPosts) {
      if (!post.engagementScore) {
        const viewsScore = (post.views || 0) * 0.3;
        const likesScore = (post.likesCount || 0) * 0.5;
        const bookmarksScore = (post.bookmarksCount || 0) * 0.2;
        post.engagementScore = viewsScore + likesScore + bookmarksScore;
      }
    }

    // Find similar posts
    const similarPosts = recommendationService.findSimilarPosts(
      targetPost,
      allPosts,
      {
        limit: parseInt(limit),
        minScore: parseFloat(minScore)
      }
    );

    // Format response
    const recommendations = similarPosts.map(({ post, score, breakdown }) => {
      const result = {
        ...post,
        similarityScore: parseFloat(score.toFixed(3))
      };

      if (includeBreakdown === 'true') {
        result.scoreBreakdown = {
          content: parseFloat(breakdown.content.toFixed(3)),
          tags: parseFloat(breakdown.tags.toFixed(3)),
          category: parseFloat(breakdown.category.toFixed(3)),
          anime: parseFloat(breakdown.anime.toFixed(3))
        };
      }

      return result;
    });

    // Cache the result
    recommendationCache.set(cacheKey, recommendations);

    logger.info(`Generated ${recommendations.length} recommendations for post ${postId}`);

    res.json({
      success: true,
      cached: false,
      count: recommendations.length,
      data: recommendations
    });

  } catch (error) {
    logger.error('Error getting similar posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get personalized recommendations based on user interaction history
 * POST /api/recommendations/personalized
 */
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const {
      postIds = [],
      limit = 10,
      diversityFactor = 0.3
    } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'postIds array is required and cannot be empty'
      });
    }

    // Check cache
    const cacheKey = `personalized:${postIds.sort().join(',')}:${limit}`;
    const cached = recommendationCache.get(cacheKey);
    
    if (cached) {
      logger.info(`Cache hit for personalized recommendations`);
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    // Get seed posts
    const seedPosts = await Post.find({
      _id: { $in: postIds },
      status: 'published',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    if (seedPosts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid posts found'
      });
    }

    // Get all published posts
    const allPosts = await Post.find({
      status: 'published',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    // Calculate engagement scores if needed
    for (const post of allPosts) {
      if (!post.engagementScore) {
        const viewsScore = (post.views || 0) * 0.3;
        const likesScore = (post.likesCount || 0) * 0.5;
        const bookmarksScore = (post.bookmarksCount || 0) * 0.2;
        post.engagementScore = viewsScore + likesScore + bookmarksScore;
      }
    }

    // Get recommendations
    const recommendations = recommendationService.getRecommendationsFromHistory(
      seedPosts,
      allPosts,
      {
        limit: parseInt(limit),
        diversityFactor: parseFloat(diversityFactor)
      }
    );

    // Format response
    const formattedRecommendations = recommendations.map(({ post, score }) => ({
      ...post,
      recommendationScore: parseFloat(score.toFixed(3))
    }));

    // Cache the result
    recommendationCache.set(cacheKey, formattedRecommendations);

    logger.info(`Generated ${formattedRecommendations.length} personalized recommendations`);

    res.json({
      success: true,
      cached: false,
      count: formattedRecommendations.length,
      data: formattedRecommendations
    });

  } catch (error) {
    logger.error('Error getting personalized recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating personalized recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get recommendations by anime series
 * GET /api/recommendations/anime/:animeName
 */
exports.getAnimeRecommendations = async (req, res) => {
  try {
    const { animeName } = req.params;
    const { limit = 10 } = req.query;

    if (!animeName) {
      return res.status(400).json({
        success: false,
        message: 'Anime name is required'
      });
    }

    // Check cache
    const cacheKey = `anime:${animeName.toLowerCase()}:${limit}`;
    const cached = recommendationCache.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    // Find posts from this anime series
    const animePosts = await Post.find({
      animeName: new RegExp(animeName, 'i'),
      status: 'published',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ seasonNumber: 1, episodeNumber: 1 })
      .limit(parseInt(limit))
      .lean();

    if (animePosts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No posts found for this anime'
      });
    }

    // Cache the result
    recommendationCache.set(cacheKey, animePosts);

    res.json({
      success: true,
      cached: false,
      count: animePosts.length,
      data: animePosts
    });

  } catch (error) {
    logger.error('Error getting anime recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting anime recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get recommendations by tag
 * GET /api/recommendations/tag/:tag
 */
exports.getTagRecommendations = async (req, res) => {
  try {
    const { tag } = req.params;
    const { limit = 10 } = req.query;

    if (!tag) {
      return res.status(400).json({
        success: false,
        message: 'Tag is required'
      });
    }

    // Check cache
    const cacheKey = `tag:${tag.toLowerCase()}:${limit}`;
    const cached = recommendationCache.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    // Find posts with this tag
    const tagPosts = await Post.find({
      tags: { $in: [tag.toLowerCase()] },
      status: 'published',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ views: -1, likesCount: -1 })
      .limit(parseInt(limit))
      .lean();

    if (tagPosts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No posts found with this tag'
      });
    }

    // Cache the result
    recommendationCache.set(cacheKey, tagPosts);

    res.json({
      success: true,
      cached: false,
      count: tagPosts.length,
      data: tagPosts
    });

  } catch (error) {
    logger.error('Error getting tag recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting tag recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get trending/popular posts
 * GET /api/recommendations/trending
 */
exports.getTrendingPosts = async (req, res) => {
  try {
    const { limit = 10, timeframe = 7 } = req.query;

    // Validate inputs
    const parsedLimit = parseInt(limit);
    const parsedTimeframe = parseInt(timeframe);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter'
      });
    }

    if (isNaN(parsedTimeframe) || parsedTimeframe < 1 || parsedTimeframe > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timeframe parameter'
      });
    }

    // Count total published posts for debugging
    const totalPublished = await Post.countDocuments({
      status: 'published',
      isDeleted: false
    });

    if (totalPublished === 0) {
      return res.json({
        success: true,
        cached: false,
        count: 0,
        data: []
      });
    }

    // Get all published posts to calculate trending scores
    const allPosts = await Post.find({
      status: 'published',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    // Simple trending: sort by views + likes + bookmarks
    const postsWithScores = allPosts.map(post => {
      const engagementScore = (post.views || 0) + (post.likesCount || 0) + (post.bookmarksCount || 0);
      return {
        ...post,
        engagementScore
      };
    });

    postsWithScores.sort((a, b) => b.engagementScore - a.engagementScore);

    const trending = postsWithScores.slice(0, parsedLimit);

    return res.json({
      success: true,
      cached: false,
      count: trending.length,
      data: trending
    });

  } catch (error) {
    logger.error('Error getting trending posts:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Error getting trending posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get trending posts by category
 * GET /api/recommendations/trending/category/:categoryId
 */
exports.getTrendingByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 10, timeframe = 7 } = req.query;

    // Validate category
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Validate inputs
    const parsedLimit = parseInt(limit);
    const parsedTimeframe = parseInt(timeframe);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter'
      });
    }

    if (isNaN(parsedTimeframe) || parsedTimeframe < 1 || parsedTimeframe > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timeframe parameter'
      });
    }

    // Check cache
    const cacheKey = `trending:category:${categoryId}:${parsedLimit}:${parsedTimeframe}`;
    const cached = recommendationCache.get(cacheKey);
    
    if (cached) {
      logger.info(`Cache hit for trending posts in category ${categoryId}`);
      return res.json({
        success: true,
        cached: true,
        count: cached.length,
        data: cached
      });
    }

    // Count total published posts in this category
    const totalInCategory = await Post.countDocuments({
      category: categoryId,
      status: 'published',
      isDeleted: false
    });

    if (totalInCategory === 0) {
      return res.json({
        success: true,
        cached: false,
        count: 0,
        data: []
      });
    }

    // Get all published posts in this category
    const categoryPosts = await Post.find({
      category: categoryId,
      status: 'published',
      isDeleted: false
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    // Calculate trending scores
    const postsWithScores = categoryPosts.map(post => {
      const engagementScore = (post.views || 0) + (post.likesCount || 0) + (post.bookmarksCount || 0);
      return {
        ...post,
        engagementScore
      };
    });

    // Sort by engagement score
    postsWithScores.sort((a, b) => b.engagementScore - a.engagementScore);

    const trending = postsWithScores.slice(0, parsedLimit);

    // Cache the result
    recommendationCache.set(cacheKey, trending);

    logger.info(`Generated ${trending.length} trending posts for category ${categoryId}`);

    return res.json({
      success: true,
      cached: false,
      count: trending.length,
      data: trending
    });

  } catch (error) {
    logger.error('Error getting trending posts by category:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Error getting trending posts by category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Clear recommendation cache (admin only)
 * DELETE /api/recommendations/cache
 */
exports.clearCache = async (req, res) => {
  try {
    recommendationCache.flushAll();
    logger.info('Recommendation cache cleared');
    
    res.json({
      success: true,
      message: 'Recommendation cache cleared successfully'
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache'
    });
  }
};

/**
 * Get cache statistics (admin only)
 * GET /api/recommendations/cache/stats
 */
exports.getCacheStats = async (req, res) => {
  try {
    const stats = recommendationCache.getStats();
    
    res.json({
      success: true,
      data: {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits / (stats.hits + stats.misses) || 0,
        ksize: stats.ksize,
        vsize: stats.vsize
      }
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting cache statistics'
    });
  }
};

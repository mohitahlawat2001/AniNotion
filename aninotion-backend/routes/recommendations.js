/**
 * Recommendation Routes
 * 
 * API endpoints for post recommendations and content discovery
 */

const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');

/**
 * @route   GET /api/recommendations/similar/:postId
 * @desc    Get similar posts for a specific post
 * @access  Public
 * @params  postId - ID of the post to find similar content for
 * @query   limit - Number of recommendations (default: 10)
 * @query   minScore - Minimum similarity score (default: 0.1)
 * @query   includeBreakdown - Include similarity score breakdown (default: false)
 */
router.get('/similar/:postId', recommendationController.getSimilarPosts);

/**
 * @route   POST /api/recommendations/personalized
 * @desc    Get personalized recommendations based on user interaction history
 * @access  Public
 * @body    postIds - Array of post IDs the user has interacted with
 * @body    limit - Number of recommendations (default: 10)
 * @body    diversityFactor - Diversity factor 0-1 (default: 0.3)
 */
router.post('/personalized', recommendationController.getPersonalizedRecommendations);

/**
 * @route   GET /api/recommendations/anime/:animeName
 * @desc    Get posts from a specific anime series
 * @access  Public
 * @params  animeName - Name of the anime
 * @query   limit - Number of posts to return (default: 10)
 */
router.get('/anime/:animeName', recommendationController.getAnimeRecommendations);

/**
 * @route   GET /api/recommendations/tag/:tag
 * @desc    Get posts with a specific tag
 * @access  Public
 * @params  tag - Tag name
 * @query   limit - Number of posts to return (default: 10)
 */
router.get('/tag/:tag', recommendationController.getTagRecommendations);

/**
 * @route   GET /api/recommendations/trending
 * @desc    Get trending/popular posts
 * @access  Public
 * @query   limit - Number of posts to return (default: 10)
 * @query   timeframe - Number of days to look back (default: 7)
 */
router.get('/trending', recommendationController.getTrendingPosts);

/**
 * @route   GET /api/recommendations/trending/category/:categoryId
 * @desc    Get trending/popular posts by category
 * @access  Public
 * @params  categoryId - ID of the category
 * @query   limit - Number of posts to return (default: 10)
 * @query   timeframe - Number of days to look back (default: 7)
 */
router.get('/trending/category/:categoryId', recommendationController.getTrendingByCategory);

// Admin routes commented out temporarily - can be enabled later
// router.delete('/cache', authenticateToken, requireAdmin, recommendationController.clearCache);
// router.get('/cache/stats', authenticateToken, requireAdmin, recommendationController.getCacheStats);

module.exports = router;

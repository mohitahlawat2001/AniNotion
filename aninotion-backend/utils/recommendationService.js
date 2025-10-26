/**
 * Recommendation Service for Post Similarity
 * 
 * Implements a hybrid recommendation engine combining:
 * - Content-based filtering using TF-IDF and cosine similarity
 * - Tag-based filtering using Jaccard similarity
 * - Engagement-based ranking
 */

const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const logger = require('../config/logger');

class RecommendationService {
  constructor() {
    this.tfidf = new TfIdf();
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
      'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
      'this', 'that', 'these', 'those', 'it', 'its', 'i', 'you', 'he',
      'she', 'they', 'we', 'him', 'her', 'them', 'us', 'anime', 'episode'
    ]);
  }

  /**
   * Preprocess text for better similarity matching
   * @param {string} text - Text to preprocess
   * @returns {string} - Cleaned and preprocessed text
   */
  preprocessText(text) {
    if (!text) return '';
    
    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, ' ');
    
    // Convert to lowercase
    cleaned = cleaned.toLowerCase();
    
    // Remove special characters but keep alphanumeric and spaces
    cleaned = cleaned.replace(/[^a-z0-9\s]/g, ' ');
    
    // Tokenize and remove stop words
    const tokens = tokenizer.tokenize(cleaned) || [];
    const filtered = tokens.filter(token => 
      token.length > 2 && !this.stopWords.has(token)
    );
    
    return filtered.join(' ');
  }

  /**
   * Create combined text representation of a post
   * @param {Object} post - Post document
   * @returns {string} - Combined text with weighted components
   */
  createPostText(post) {
    const parts = [];
    
    // Title gets 3x weight (most important)
    if (post.title) {
      const titleText = this.preprocessText(post.title);
      parts.push(titleText, titleText, titleText);
    }
    
    // Anime name gets 2x weight
    if (post.animeName) {
      const animeText = this.preprocessText(post.animeName);
      parts.push(animeText, animeText);
    }
    
    // Tags get 2x weight
    if (post.tags && post.tags.length > 0) {
      const tagsText = post.tags.join(' ');
      const processedTags = this.preprocessText(tagsText);
      parts.push(processedTags, processedTags);
    }
    
    // Excerpt or content (1x weight)
    const contentText = post.excerpt || post.content || '';
    const processed = this.preprocessText(contentText);
    // Limit content length to prevent overwhelming the model
    const limitedContent = processed.split(' ').slice(0, 200).join(' ');
    parts.push(limitedContent);
    
    return parts.join(' ');
  }

  /**
   * Build TF-IDF model from posts
   * @param {Array} posts - Array of post documents
   */
  buildTfIdfModel(posts) {
    this.tfidf = new TfIdf();
    
    posts.forEach(post => {
      const text = this.createPostText(post);
      this.tfidf.addDocument(text);
    });
    
    logger.info(`TF-IDF model built with ${posts.length} documents`);
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Object} vecA - First vector as object {term: weight}
   * @param {Object} vecB - Second vector as object {term: weight}
   * @returns {number} - Cosine similarity score (0-1)
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB) return 0;
    
    const keysA = Object.keys(vecA);
    const keysB = Object.keys(vecB);
    
    if (keysA.length === 0 || keysB.length === 0) return 0;
    
    // Calculate dot product
    let dotProduct = 0;
    keysA.forEach(term => {
      if (vecB[term]) {
        dotProduct += vecA[term] * vecB[term];
      }
    });
    
    // Calculate magnitudes
    const magA = Math.sqrt(keysA.reduce((sum, term) => sum + vecA[term] ** 2, 0));
    const magB = Math.sqrt(keysB.reduce((sum, term) => sum + vecB[term] ** 2, 0));
    
    if (magA === 0 || magB === 0) return 0;
    
    return dotProduct / (magA * magB);
  }

  /**
   * Get TF-IDF vector for a document
   * @param {number} docIndex - Document index in TF-IDF model
   * @returns {Object} - Vector as object {term: weight}
   */
  getTfIdfVector(docIndex) {
    const vector = {};
    const measures = this.tfidf.listTerms(docIndex);
    
    measures.forEach(measure => {
      vector[measure.term] = measure.tfidf;
    });
    
    return vector;
  }

  /**
   * Calculate Jaccard similarity between two tag sets
   * @param {Array} tagsA - First set of tags
   * @param {Array} tagsB - Second set of tags
   * @returns {number} - Jaccard similarity score (0-1)
   */
  jaccardSimilarity(tagsA, tagsB) {
    if (!tagsA || !tagsB || tagsA.length === 0 || tagsB.length === 0) {
      return 0;
    }
    
    const setA = new Set(tagsA.map(t => t.toLowerCase()));
    const setB = new Set(tagsB.map(t => t.toLowerCase()));
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate category similarity
   * @param {String} catA - First category ID
   * @param {String} catB - Second category ID
   * @returns {number} - 1 if same, 0 if different
   */
  categorySimilarity(catA, catB) {
    if (!catA || !catB) return 0;
    return catA.toString() === catB.toString() ? 1 : 0;
  }

  /**
   * Calculate anime series similarity
   * @param {String} animeA - First anime name
   * @param {String} animeB - Second anime name
   * @param {Number} seasonA - First season number
   * @param {Number} seasonB - Second season number
   * @returns {number} - Similarity score (0-1)
   */
  animeSimilarity(animeA, animeB, seasonA, seasonB) {
    if (!animeA || !animeB) return 0;
    
    const nameMatch = animeA.toLowerCase() === animeB.toLowerCase();
    
    if (nameMatch) {
      // Same anime - check season
      if (seasonA && seasonB) {
        // Same season = 1.0, adjacent seasons = 0.7, different seasons = 0.5
        if (seasonA === seasonB) return 1.0;
        if (Math.abs(seasonA - seasonB) === 1) return 0.7;
        return 0.5;
      }
      return 0.8; // Same anime, no season info
    }
    
    return 0;
  }

  /**
   * Calculate hybrid similarity score
   * @param {Object} targetPost - The post to find recommendations for
   * @param {Object} candidatePost - A candidate similar post
   * @param {number} targetIndex - Target post index in TF-IDF model
   * @param {number} candidateIndex - Candidate post index in TF-IDF model
   * @param {Object} weights - Similarity weights
   * @returns {number} - Hybrid similarity score (0-1)
   */
  calculateHybridSimilarity(targetPost, candidatePost, targetIndex, candidateIndex, weights = {}) {
    const defaultWeights = {
      content: 0.4,
      tags: 0.2,
      category: 0.15,
      anime: 0.15,
      engagement: 0.1
    };
    
    const w = { ...defaultWeights, ...weights };
    
    // Content similarity (TF-IDF + Cosine)
    const targetVec = this.getTfIdfVector(targetIndex);
    const candidateVec = this.getTfIdfVector(candidateIndex);
    const contentSim = this.cosineSimilarity(targetVec, candidateVec);
    
    // Tag similarity (Jaccard)
    const tagSim = this.jaccardSimilarity(targetPost.tags, candidatePost.tags);
    
    // Category similarity
    const categorySim = this.categorySimilarity(targetPost.category, candidatePost.category);
    
    // Anime series similarity
    const animeSim = this.animeSimilarity(
      targetPost.animeName,
      candidatePost.animeName,
      targetPost.seasonNumber,
      candidatePost.seasonNumber
    );
    
    // Engagement score normalization (0-1 range)
    const maxEngagement = Math.max(
      targetPost.engagementScore || 0,
      candidatePost.engagementScore || 0,
      1
    );
    const engagementSim = (candidatePost.engagementScore || 0) / maxEngagement;
    
    // Calculate weighted hybrid score
    const hybridScore = 
      (w.content * contentSim) +
      (w.tags * tagSim) +
      (w.category * categorySim) +
      (w.anime * animeSim) +
      (w.engagement * engagementSim);
    
    return hybridScore;
  }

  /**
   * Find similar posts for a given post
   * @param {Object} targetPost - The post to find recommendations for
   * @param {Array} allPosts - All posts to compare against
   * @param {Object} options - Configuration options
   * @returns {Array} - Array of similar posts with scores
   */
  findSimilarPosts(targetPost, allPosts, options = {}) {
    const {
      limit = 10,
      minScore = 0.1,
      excludeIds = [],
      weights = {}
    } = options;
    
    try {
      // Build TF-IDF model
      this.buildTfIdfModel(allPosts);
      
      // Find target post index
      const targetIndex = allPosts.findIndex(
        post => post._id.toString() === targetPost._id.toString()
      );
      
      if (targetIndex === -1) {
        logger.warn('Target post not found in allPosts array');
        return [];
      }
      
      const similarities = [];
      
      // Calculate similarities with all other posts
      allPosts.forEach((candidatePost, candidateIndex) => {
        // Skip same post and excluded posts
        if (candidateIndex === targetIndex) return;
        if (excludeIds.includes(candidatePost._id.toString())) return;
        
        const score = this.calculateHybridSimilarity(
          targetPost,
          candidatePost,
          targetIndex,
          candidateIndex,
          weights
        );
        
        if (score >= minScore) {
          similarities.push({
            post: candidatePost,
            score: score,
            breakdown: {
              content: this.cosineSimilarity(
                this.getTfIdfVector(targetIndex),
                this.getTfIdfVector(candidateIndex)
              ),
              tags: this.jaccardSimilarity(targetPost.tags, candidatePost.tags),
              category: this.categorySimilarity(targetPost.category, candidatePost.category),
              anime: this.animeSimilarity(
                targetPost.animeName,
                candidatePost.animeName,
                targetPost.seasonNumber,
                candidatePost.seasonNumber
              )
            }
          });
        }
      });
      
      // Sort by score (descending) and limit results
      similarities.sort((a, b) => b.score - a.score);
      
      logger.info(`Found ${similarities.length} similar posts for post ${targetPost._id}`);
      
      return similarities.slice(0, limit);
      
    } catch (error) {
      logger.error('Error finding similar posts:', error);
      throw error;
    }
  }

  /**
   * Get recommendations based on multiple posts (for user history)
   * @param {Array} seedPosts - Array of posts the user has interacted with
   * @param {Array} allPosts - All posts to recommend from
   * @param {Object} options - Configuration options
   * @returns {Array} - Array of recommended posts with scores
   */
  getRecommendationsFromHistory(seedPosts, allPosts, options = {}) {
    const {
      limit = 10,
      diversityFactor = 0.3
    } = options;
    
    const recommendationScores = new Map();
    const excludeIds = seedPosts.map(post => post._id.toString());
    
    // Get recommendations for each seed post
    seedPosts.forEach((seedPost, index) => {
      const weight = 1 / (index + 1); // Decay weight for older interactions
      
      const similar = this.findSimilarPosts(seedPost, allPosts, {
        limit: limit * 2,
        excludeIds: excludeIds
      });
      
      similar.forEach(({ post, score }) => {
        const postId = post._id.toString();
        const currentScore = recommendationScores.get(postId) || 0;
        recommendationScores.set(postId, currentScore + (score * weight));
      });
    });
    
    // Convert to array and sort
    const recommendations = Array.from(recommendationScores.entries())
      .map(([postId, score]) => ({
        post: allPosts.find(p => p._id.toString() === postId),
        score: score
      }))
      .filter(rec => rec.post !== undefined)
      .sort((a, b) => b.score - a.score);
    
    // Apply diversity filter if needed
    if (diversityFactor > 0) {
      return this.diversifyRecommendations(recommendations, diversityFactor, limit);
    }
    
    return recommendations.slice(0, limit);
  }

  /**
   * Diversify recommendations to avoid over-clustering
   * @param {Array} recommendations - Sorted recommendations
   * @param {number} diversityFactor - How much diversity to enforce (0-1)
   * @param {number} limit - Number of recommendations to return
   * @returns {Array} - Diversified recommendations
   */
  diversifyRecommendations(recommendations, diversityFactor, limit) {
    const diversified = [];
    const seenCategories = new Set();
    const seenAnime = new Set();
    
    for (const rec of recommendations) {
      if (diversified.length >= limit) break;
      
      const categoryId = rec.post.category.toString();
      const animeName = rec.post.animeName.toLowerCase();
      
      // Calculate diversity penalty
      let penalty = 1;
      if (seenCategories.has(categoryId)) penalty *= (1 - diversityFactor * 0.5);
      if (seenAnime.has(animeName)) penalty *= (1 - diversityFactor * 0.7);
      
      rec.score *= penalty;
      
      diversified.push(rec);
      seenCategories.add(categoryId);
      seenAnime.add(animeName);
    }
    
    // Re-sort after applying diversity
    diversified.sort((a, b) => b.score - a.score);
    
    return diversified.slice(0, limit);
  }
}

module.exports = new RecommendationService();

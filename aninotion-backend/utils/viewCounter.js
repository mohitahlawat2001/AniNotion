const { Redis } = require('@upstash/redis');
const environment = require('../config/environment');

class ViewCounter {
  constructor() {
    const redisConfig = environment.getRedis();
    if (redisConfig.enabled) {
      this.redis = new Redis({
        url: redisConfig.url,
        token: redisConfig.token
      });
    } else {
      this.redis = null;
    }
  }

  /**
   * Check if Redis is enabled
   */
  isEnabled() {
    return this.redis !== null;
  }

  /**
   * Increment view count for a post with session tracking
   * @param {string} postId - Post ID
   * @param {string} sessionId - Unique session identifier
   * @returns {boolean} - True if view was counted, false if already viewed
   */
  async incrementView(postId, sessionId) {
    if (!this.isEnabled()) {
      return false;
    }

    const startTime = Date.now();
    
    try {
      const viewKey = `post:views:${postId}`;
      const sessionKey = `post:viewed:${postId}:${sessionId}`;

      // Check if this session has already viewed this post
      const alreadyViewed = await this.redis.exists(sessionKey);

      if (alreadyViewed) {
        console.log(`⚡ Redis operation (incrementView check) took ${Date.now() - startTime}ms`);
        return false; // Already viewed, don't count again
      }

      // Mark as viewed for this session (expire in 24 hours)
      await this.redis.setex(sessionKey, 24 * 60 * 60, '1');

      // Increment the view counter
      await this.redis.incr(viewKey);
      
      const duration = Date.now() - startTime;
      console.log(`⚡ Redis operations (incrementView) took ${duration}ms`);
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Redis incrementView error after ${duration}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Get current view count for a post
   * @param {string} postId - Post ID
   * @returns {number} - View count
   */
  async getViewCount(postId) {
    if (!this.isEnabled()) {
      return 0;
    }

    try {
      const viewKey = `post:views:${postId}`;
      const count = await this.redis.get(viewKey);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Error getting view count:', error);
      return 0;
    }
  }

  /**
   * Get view counts for multiple posts
   * @param {string[]} postIds - Array of post IDs
   * @returns {Object} - Object with postId: count mapping
   */
  async getViewCounts(postIds) {
    if (!this.isEnabled() || !postIds.length) {
      return {};
    }

    try {
      const keys = postIds.map(id => `post:views:${id}`);
      const counts = await this.redis.mget(...keys);

      const result = {};
      postIds.forEach((id, index) => {
        result[id] = counts[index] ? parseInt(counts[index], 10) : 0;
      });

      return result;
    } catch (error) {
      console.error('Error getting view counts:', error);
      return {};
    }
  }

  /**
   * Sync view counts and likes from Redis to MongoDB
   * @param {Model} PostModel - Mongoose Post model
   * @returns {Object} - { viewsSynced: number, likesSynced: number }
   */
  async syncToDatabase(PostModel) {
    if (!this.isEnabled()) {
      return { viewsSynced: 0, likesSynced: 0 };
    }

    try {
      // Get all view keys
      const viewKeys = await this.redis.keys('post:views:*');
      // Get all like keys
      const likeKeys = await this.redis.keys('post:likes:*');

      const allKeys = [...new Set([...viewKeys, ...likeKeys])];
      const postIds = allKeys.map(key => {
        if (key.startsWith('post:views:')) {
          return key.replace('post:views:', '');
        } else if (key.startsWith('post:likes:')) {
          return key.replace('post:likes:', '');
        }
        return null;
      }).filter(id => id);

      const uniquePostIds = [...new Set(postIds)];

      let viewsSynced = 0;
      let likesSynced = 0;

      for (const postId of uniquePostIds) {
        const updateData = {};

        // Sync views
        const viewKey = `post:views:${postId}`;
        const redisViews = await this.redis.get(viewKey);
        if (redisViews) {
          updateData.views = parseInt(redisViews, 10);
          viewsSynced++;
        }

        // Sync likes
        const likeKey = `post:likes:${postId}`;
        const redisLikes = await this.redis.get(likeKey);
        if (redisLikes) {
          updateData.likesCount = parseInt(redisLikes, 10);
          likesSynced++;
        }

        if (Object.keys(updateData).length > 0) {
          await PostModel.findByIdAndUpdate(postId, updateData);
        }
      }

      return { viewsSynced, likesSynced };
    } catch (error) {
      console.error('Error syncing to database:', error);
      return { viewsSynced: 0, likesSynced: 0 };
    }
  }

  /**
   * Toggle like for a post by a user
   * @param {string} postId - Post ID
   * @param {string} userId - User ID (required for likes)
   * @returns {Object} - { liked: boolean, likesCount: number }
   */
  async toggleLike(postId, userId) {
    if (!this.isEnabled() || !userId) {
      return { liked: false, likesCount: 0 };
    }

    try {
      const likeKey = `post:likes:${postId}`;
      const userLikeKey = `user:liked:${userId}:${postId}`;

      // Check if user already liked this post
      const alreadyLiked = await this.redis.exists(userLikeKey);

      let liked;
      if (alreadyLiked) {
        // Unlike: remove from set and decrement
        await this.redis.del(userLikeKey);
        await this.redis.decr(likeKey);
        liked = false;
      } else {
        // Like: add to set and increment
        await this.redis.set(userLikeKey, '1');
        await this.redis.incr(likeKey);
        liked = true;
      }

      // Get updated count
      const likesCount = await this.getLikesCount(postId);

      return { liked, likesCount };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { liked: false, likesCount: 0 };
    }
  }

  /**
   * Check if a user has liked a post
   * @param {string} postId - Post ID
   * @param {string} userId - User ID
   * @returns {boolean} - True if liked
   */
  async hasLiked(postId, userId) {
    if (!this.isEnabled() || !userId) {
      return false;
    }

    try {
      const userLikeKey = `user:liked:${userId}:${postId}`;
      return await this.redis.exists(userLikeKey);
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }

  /**
   * Get likes count for a post
   * @param {string} postId - Post ID
   * @returns {number} - Likes count
   */
  async getLikesCount(postId) {
    if (!this.isEnabled()) {
      return 0;
    }

    try {
      const likeKey = `post:likes:${postId}`;
      const count = await this.redis.get(likeKey);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Error getting likes count:', error);
      return 0;
    }
  }

  /**
   * Get likes counts for multiple posts
   * @param {string[]} postIds - Array of post IDs
   * @returns {Object} - Object with postId: count mapping
   */
  async getLikesCounts(postIds) {
    if (!this.isEnabled() || !postIds.length) {
      return {};
    }

    try {
      const keys = postIds.map(id => `post:likes:${id}`);
      const counts = await this.redis.mget(...keys);

      const result = {};
      postIds.forEach((id, index) => {
        result[id] = counts[index] ? parseInt(counts[index], 10) : 0;
      });

      return result;
    } catch (error) {
      console.error('Error getting likes counts:', error);
      return {};
    }
  }

  /**
   * Get like status for multiple posts for a user
   * @param {string[]} postIds - Array of post IDs
   * @param {string} userId - User ID
   * @returns {Object} - Object with postId: boolean mapping
   */
  async getLikeStatuses(postIds, userId) {
    if (!this.isEnabled() || !userId || !postIds.length) {
      return {};
    }

    try {
      const keys = postIds.map(id => `user:liked:${userId}:${id}`);
      const statuses = await this.redis.mexists(...keys);

      const result = {};
      postIds.forEach((id, index) => {
        result[id] = statuses[index];
      });

      return result;
    } catch (error) {
      console.error('Error getting like statuses:', error);
      return {};
    }
  }
}

module.exports = new ViewCounter();
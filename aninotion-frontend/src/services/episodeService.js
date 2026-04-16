import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SCRAPING_API_URL || 'http://localhost:5001/api';

/**
 * Episode Service
 * API client for episode-related endpoints (normalized schema)
 */
const episodeService = {
  /**
   * Get all episodes with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - { success, data, pagination }
   */
  getAllEpisodes: async (params = {}) => {
    try {
      const { page = 1, limit = 12, animeId, isNew, source } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(animeId && { animeId }),
        ...(isNew !== undefined && { isNew: isNew.toString() }),
        ...(source && { source })
      });

      const response = await axios.get(`${API_BASE_URL}/episodes?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching episodes:', error);
      throw error;
    }
  },

  /**
   * Get single episode by ID
   * @param {string} id - Episode ID
   * @returns {Promise<Object>} - { success, data }
   */
  getEpisodeById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/episodes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching episode:', error);
      throw error;
    }
  },

  /**
   * Get episodes for specific anime
   * @param {string} animeId - Anime ID
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} - { success, data, pagination }
   */
  getEpisodesByAnime: async (animeId, params = {}) => {
    try {
      return await episodeService.getAllEpisodes({
        ...params,
        animeId
      });
    } catch (error) {
      console.error('Error fetching anime episodes:', error);
      throw error;
    }
  },

  /**
   * Get episodes for specific anime by name
   * Handles both old and new schema automatically
   * @param {string} animeName - Anime name (will be URL encoded)
   * @returns {Promise<Object>} - { success, data, count, schema }
   */
  getEpisodesByAnimeName: async (animeName) => {
    try {
      // Encode the anime name for the URL path
      const encodedName = encodeURIComponent(animeName);
      const response = await axios.get(`${API_BASE_URL}/anime/${encodedName}/episodes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching episodes by anime name:', error);
      throw error;
    }
  },

  /**
   * Get unseen episodes for user
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - { success, data, pagination }
   */
  getUnseenEpisodes: async (userId, params = {}) => {
    try {
      const { page = 1, limit = 12 } = params;
      const queryParams = new URLSearchParams({
        userId,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await axios.get(`${API_BASE_URL}/episodes/unseen?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unseen episodes:', error);
      throw error;
    }
  },

  /**
   * Mark episode as seen
   * @param {string} episodeId - Episode ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, message }
   */
  markAsSeen: async (episodeId, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/episodes/${episodeId}/seen`, {
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking episode as seen:', error);
      throw error;
    }
  },

  /**
   * Get episodes ready for post generation
   * @param {number} limit - Max episodes to fetch
   * @returns {Promise<Object>} - { success, data, count }
   */
  getEpisodesForPosts: async (limit = 10) => {
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await axios.get(`${API_BASE_URL}/episodes/for-posts?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching episodes for posts:', error);
      throw error;
    }
  }
};

export default episodeService;

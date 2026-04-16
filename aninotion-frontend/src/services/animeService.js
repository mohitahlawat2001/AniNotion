import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SCRAPING_API_URL || 'http://localhost:5001/api';

/**
 * Anime Service
 * API client for anime-related endpoints (normalized schema)
 */
const animeService = {
  /**
   * Get all anime with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - { success, data, pagination }
   */
  getAllAnime: async (params = {}) => {
    try {
      const { page = 1, limit = 20, status, search } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(search && { search })
      });

      const response = await axios.get(`${API_BASE_URL}/anime?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anime:', error);
      throw error;
    }
  },

  /**
   * Get single anime with all episodes
   * @param {string} id - Anime ID
   * @returns {Promise<Object>} - { success, data: { anime, episodes } }
   */
  getAnimeById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/anime/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anime:', error);
      throw error;
    }
  },

  /**
   * Search anime by name
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Object>} - { success, data }
   */
  searchAnime: async (query, limit = 10) => {
    try {
      const queryParams = new URLSearchParams({
        q: query,
        limit: limit.toString()
      });

      const response = await axios.get(`${API_BASE_URL}/anime/search?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error searching anime:', error);
      throw error;
    }
  },

  /**
   * Get statistics
   * @param {string} userId - Optional user ID for personalized stats
   * @returns {Promise<Object>} - { success, data }
   */
  getStats: async (userId) => {
    try {
      const queryParams = userId ? `?userId=${userId}` : '';
      const response = await axios.get(`${API_BASE_URL}/stats${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

export default animeService;

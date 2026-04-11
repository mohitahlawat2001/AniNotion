import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SCRAPING_API_URL || 'http://localhost:5001/api';

const animeReleaseService = {
  // Get all anime releases with pagination
  getAnimeReleases: async (params = {}) => {
    try {
      const { page = 1, limit = 12, isNew, animeName } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(isNew !== undefined && { isNew: isNew.toString() }),
        ...(animeName && { animeName })
      });

      const response = await axios.get(`${API_BASE_URL}/anime-releases?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anime releases:', error);
      throw error;
    }
  },

  // Get unseen releases for a user
  getUnseenReleases: async (userId, params = {}) => {
    try {
      const { page = 1, limit = 12 } = params;
      const queryParams = new URLSearchParams({
        userId,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await axios.get(`${API_BASE_URL}/anime-releases/unseen?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unseen releases:', error);
      throw error;
    }
  },

  // Get statistics
  getStats: async (userId) => {
    try {
      const queryParams = userId ? `?userId=${userId}` : '';
      const response = await axios.get(`${API_BASE_URL}/anime-releases/stats${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // Get single anime release
  getAnimeReleaseById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/anime-releases/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anime release:', error);
      throw error;
    }
  },

  // Mark releases as seen
  markAsSeen: async (releaseIds, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/anime-releases/mark-seen`, {
        releaseIds,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking releases as seen:', error);
      throw error;
    }
  },

  // Trigger manual scrape (admin only)
  triggerScrape: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/anime-releases/scrape`);
      return response.data;
    } catch (error) {
      console.error('Error triggering scrape:', error);
      throw error;
    }
  }
};

export default animeReleaseService;

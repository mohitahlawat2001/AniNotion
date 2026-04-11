import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SCRAPING_API_URL || 'http://localhost:5001/api';

const scrapingConfigService = {
  // Get all scraping configurations
  getAllConfigs: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scraping-config`);
      return response.data;
    } catch (error) {
      console.error('Error fetching configs:', error);
      throw error;
    }
  },

  // Get single configuration
  getConfigById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scraping-config/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  // Create new configuration
  createConfig: async (configData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/scraping-config`, configData);
      return response.data;
    } catch (error) {
      console.error('Error creating config:', error);
      throw error;
    }
  },

  // Update configuration
  updateConfig: async (id, configData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/scraping-config/${id}`, configData);
      return response.data;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  },

  // Delete configuration
  deleteConfig: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/scraping-config/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting config:', error);
      throw error;
    }
  },

  // Test configuration
  testConfig: async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/scraping-config/${id}/test`);
      return response.data;
    } catch (error) {
      console.error('Error testing config:', error);
      throw error;
    }
  },

  // Trigger scrape for configuration
  triggerScrape: async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/scraping-config/${id}/scrape`);
      return response.data;
    } catch (error) {
      console.error('Error triggering scrape:', error);
      throw error;
    }
  },

  // Toggle configuration status
  toggleStatus: async (id) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/scraping-config/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling status:', error);
      throw error;
    }
  },

  // Get scraping statistics
  getStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scraping-config/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

export default scrapingConfigService;

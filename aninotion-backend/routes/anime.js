const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../config/logger');

// MyAnimeList API base URL
const MAL_BASE_URL = 'https://api.myanimelist.net/v2';

// Helper function to create axios instance with MAL headers
const createMALRequest = () => {
  return axios.create({
    baseURL: MAL_BASE_URL,
    headers: {
      'X-MAL-CLIENT-ID': process.env.MYANIME_LIST_CLIENT_ID
    }
  });
};

// Get anime list by search query
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 100, offset = 0, fields } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    const malClient = createMALRequest();
    const params = {
      q,
      limit: Math.min(parseInt(limit), 100), // Maximum 100 as per MAL API
      offset: parseInt(offset) || 0
    };

    if (fields) {
      params.fields = fields;
    }

    logger.info('Searching anime on MyAnimeList', { query: q, limit: params.limit, offset: params.offset });

    const response = await malClient.get('/anime', { params });

    logger.info('MyAnimeList search successful', { 
      query: q, 
      resultsCount: response.data.data?.length || 0 
    });

    res.json({
      success: true,
      data: response.data.data || [],
      paging: response.data.paging || {},
      query: {
        q,
        limit: params.limit,
        offset: params.offset
      }
    });

  } catch (error) {
    logger.error('Error searching anime on MyAnimeList', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to search anime',
      message: error.response?.data?.message || error.message
    });
  }
});

// Get anime details by ID
router.get('/details/:anime_id', async (req, res) => {
  try {
    const { anime_id } = req.params;
    const { fields } = req.query;

    if (!anime_id || isNaN(anime_id)) {
      return res.status(400).json({
        error: 'Invalid anime ID',
        message: 'Please provide a valid numeric anime ID'
      });
    }

    const malClient = createMALRequest();
    const params = {};

    if (fields) {
      params.fields = fields;
    } else {
      // Default fields for comprehensive anime details
      params.fields = 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics';
    }

    logger.info('Fetching anime details from MyAnimeList', { animeId: anime_id });

    const response = await malClient.get(`/anime/${anime_id}`, { params });

    logger.info('MyAnimeList anime details fetch successful', { animeId: anime_id });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    logger.error('Error fetching anime details from MyAnimeList', {
      animeId: req.params.anime_id,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Anime not found',
        message: 'The requested anime ID does not exist'
      });
    }

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch anime details',
      message: error.response?.data?.message || error.message
    });
  }
});

// Get anime ranking
router.get('/ranking', async (req, res) => {
  try {
    const { ranking_type = 'all', limit = 100, offset = 0, fields } = req.query;

    const validRankingTypes = [
      'all', 'airing', 'upcoming', 'tv', 'ova', 'movie', 
      'special', 'bypopularity', 'favorite'
    ];

    if (!validRankingTypes.includes(ranking_type)) {
      return res.status(400).json({
        error: 'Invalid ranking type',
        message: `Valid ranking types: ${validRankingTypes.join(', ')}`
      });
    }

    const malClient = createMALRequest();
    const params = {
      ranking_type,
      limit: Math.min(parseInt(limit), 500), // Maximum 500 as per MAL API
      offset: parseInt(offset) || 0
    };

    if (fields) {
      params.fields = fields;
    }

    logger.info('Fetching anime ranking from MyAnimeList', { 
      rankingType: ranking_type, 
      limit: params.limit, 
      offset: params.offset 
    });

    const response = await malClient.get('/anime/ranking', { params });

    logger.info('MyAnimeList ranking fetch successful', { 
      rankingType: ranking_type, 
      resultsCount: response.data.data?.length || 0 
    });

    res.json({
      success: true,
      data: response.data.data || [],
      paging: response.data.paging || {},
      ranking_type
    });

  } catch (error) {
    logger.error('Error fetching anime ranking from MyAnimeList', {
      rankingType: req.query.ranking_type,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch anime ranking',
      message: error.response?.data?.message || error.message
    });
  }
});

// Get seasonal anime
router.get('/season/:year/:season', async (req, res) => {
  try {
    const { year, season } = req.params;
    const { sort, limit = 100, offset = 0, fields } = req.query;

    const validSeasons = ['winter', 'spring', 'summer', 'fall'];
    const validSorts = ['anime_score', 'anime_num_list_users'];

    if (!validSeasons.includes(season.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid season',
        message: `Valid seasons: ${validSeasons.join(', ')}`
      });
    }

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      return res.status(400).json({
        error: 'Invalid year',
        message: 'Please provide a valid year'
      });
    }

    const malClient = createMALRequest();
    const params = {
      limit: Math.min(parseInt(limit), 500), // Maximum 500 as per MAL API
      offset: parseInt(offset) || 0
    };

    if (sort && validSorts.includes(sort)) {
      params.sort = sort;
    }

    if (fields) {
      params.fields = fields;
    }

    logger.info('Fetching seasonal anime from MyAnimeList', { 
      year, 
      season: season.toLowerCase(), 
      limit: params.limit, 
      offset: params.offset 
    });

    const response = await malClient.get(`/anime/season/${year}/${season.toLowerCase()}`, { params });

    logger.info('MyAnimeList seasonal anime fetch successful', { 
      year, 
      season: season.toLowerCase(), 
      resultsCount: response.data.data?.length || 0 
    });

    res.json({
      success: true,
      data: response.data.data || [],
      paging: response.data.paging || {},
      season: {
        year: parseInt(year),
        season: season.toLowerCase()
      }
    });

  } catch (error) {
    logger.error('Error fetching seasonal anime from MyAnimeList', {
      year: req.params.year,
      season: req.params.season,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch seasonal anime',
      message: error.response?.data?.message || error.message
    });
  }
});

// Health check for MyAnimeList API connection
router.get('/health', async (req, res) => {
  try {
    if (!process.env.MYANIME_LIST_CLIENT_ID) {
      return res.status(500).json({
        error: 'MyAnimeList configuration missing',
        message: 'MYANIME_LIST_CLIENT_ID is not configured'
      });
    }

    // Test the connection with a simple search
    const malClient = createMALRequest();
    await malClient.get('/anime', { params: { q: 'test', limit: 1 } });

    res.json({
      success: true,
      message: 'MyAnimeList API connection is healthy',
      clientIdConfigured: !!process.env.MYANIME_LIST_CLIENT_ID
    });

  } catch (error) {
    logger.error('MyAnimeList API health check failed', {
      error: error.message,
      status: error.response?.status
    });

    res.status(500).json({
      error: 'MyAnimeList API connection failed',
      message: error.response?.data?.message || error.message,
      clientIdConfigured: !!process.env.MYANIME_LIST_CLIENT_ID
    });
  }
});

module.exports = router;

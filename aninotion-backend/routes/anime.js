const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../config/logger');
const cache = require('../utils/cache');
const { getJson, setJson, buildCacheKey, shouldBypassCache } = require('../utils/cache');

// MyAnimeList API base URL
const MAL_BASE_URL = 'https://api.myanimelist.net/v2';

// Cache TTLs (Time-To-Live) in seconds
const TTL_SEARCH = parseInt(process.env.ANINOTION_CACHE_TTL_SEARCH || '600');
const TTL_DETAILS = parseInt(process.env.ANINOTION_CACHE_TTL_DETAILS || '86400');
const TTL_RANKING = parseInt(process.env.ANINOTION_CACHE_TTL_RANKING || '1800');
const TTL_SEASON = parseInt(process.env.ANINOTION_CACHE_TTL_SEASON || '3600');

// Helper function to create axios instance with MAL headers
const createMALRequest = () => {
  return axios.create({
    baseURL: MAL_BASE_URL,
    headers: {
      'X-MAL-CLIENT-ID': process.env.MYANIME_LIST_CLIENT_ID
    }
  });
};

// Helper: safely parse integers with defaults and caps
function parsePositiveInt(value, defaultValue) {
  const v = parseInt(value, 10);
  if (Number.isNaN(v) || v < 0) return defaultValue;
  return v;
}

// Get anime list by search query
router.get('/search', async (req, res) => {
  // Validate and sanitize input
  const q = (req.query.q || '').trim();
  if (!q) {
    logger.warn('Search request missing q parameter');
    return res.status(400).json({
      error: 'Search query is required',
      message: 'Please provide a search query using the "q" parameter'
    });
  }

  const limitRequested = parsePositiveInt(req.query.limit, 100);
  const limit = Math.min(limitRequested, 100); // MAL API max 100
  const offset = parsePositiveInt(req.query.offset, 0);
  const fields = req.query.fields;

  const params = { q, limit, offset };
  if (fields) params.fields = fields;

  const cacheKey = buildCacheKey('search', params);

  // Try cache unless explicitly bypassed
  if (!shouldBypassCache(req)) {
    try {
      const cachedData = await getJson(cacheKey);
      if (cachedData) {
        logger.info('Cache HIT', { cacheKey });
        cachedData.cached = true;
        return res.json(cachedData);
      }
      logger.info('Cache MISS', { cacheKey });
    } catch (err) {
      logger.error({ err, cacheKey }, 'Error reading from cache (search)');
      // continue to fetch from MAL
    }
  }

  const malClient = createMALRequest();
  logger.info('Searching anime on MyAnimeList', { query: q, limit, offset });

  try {
    const response = await malClient.get('/anime', { params });

    logger.info('MyAnimeList search successful', {
      query: q,
      resultsCount: response.data.data?.length || 0
    });

    const responsePayload = {
      success: true,
      cached: false,
      data: response.data.data || [],
      paging: response.data.paging || {},
      query: { q, limit, offset }
    };

    // Store in cache (best-effort)
    if (!shouldBypassCache(req)) {
      try {
        await setJson(cacheKey, responsePayload, TTL_SEARCH);
      } catch (err) {
        logger.error({ err, cacheKey }, 'Failed to set search result in cache');
      }
    }

    return res.json(responsePayload);
  } catch (error) {
    logger.error('Error searching anime on MyAnimeList', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      query: q
    });

    return res.status(error.response?.status || 500).json({
      error: 'Failed to search anime',
      message: error.response?.data?.message || error.message
    });
  }
});

// Get anime details by ID
router.get('/details/:anime_id', async (req, res) => {
  const animeId = parseInt(req.params.anime_id, 10);
  if (Number.isNaN(animeId) || animeId <= 0) {
    logger.warn({ animeId: req.params.anime_id }, 'Invalid anime_id param');
    return res.status(400).json({
      error: 'Invalid anime ID',
      message: 'Please provide a valid numeric anime ID'
    });
  }

  const fields = req.query.fields;
  const params = {};
  if (fields) params.fields = fields;
  else params.fields = 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics';

  const cacheKey = buildCacheKey(`details:${animeId}`, { fields: params.fields });

  if (!shouldBypassCache(req)) {
    try {
      const cachedData = await getJson(cacheKey);
      if (cachedData) {
        logger.info('Cache HIT', { cacheKey });
        cachedData.cached = true;
        return res.json(cachedData);
      }
      logger.info('Cache MISS', { cacheKey });
    } catch (err) {
      logger.error({ err, cacheKey }, 'Error reading from cache (details)');
    }
  }

  logger.info('Fetching anime details from MyAnimeList', { animeId });
  const malClient = createMALRequest();

  try {
    const response = await malClient.get(`/anime/${animeId}`, { params });

    logger.info('MyAnimeList anime details fetch successful', { animeId });

    const responsePayload = { success: true, cached: false, data: response.data };

    if (!shouldBypassCache(req)) {
      try {
        await setJson(cacheKey, responsePayload, TTL_DETAILS);
      } catch (err) {
        logger.error({ err, cacheKey }, 'Failed to set details in cache');
      }
    }

    return res.json(responsePayload);
  } catch (error) {
    logger.error('Error fetching anime details from MyAnimeList', {
      animeId,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Anime not found', message: 'The requested anime ID does not exist' });
    }

    return res.status(error.response?.status || 500).json({
      error: 'Failed to fetch anime details',
      message: error.response?.data?.message || error.message
    });
  }
});

// Get anime ranking
router.get('/ranking', async (req, res) => {
  const ranking_type = (req.query.ranking_type || 'all');
  const validRankingTypes = ['all', 'airing', 'upcoming', 'tv', 'ova', 'movie', 'special', 'bypopularity', 'favorite'];

  if (!validRankingTypes.includes(ranking_type)) {
    logger.warn({ ranking_type }, 'Invalid ranking_type param');
    return res.status(400).json({ error: 'Invalid ranking type', message: `Valid ranking types: ${validRankingTypes.join(', ')}` });
  }

  const limitRequested = parsePositiveInt(req.query.limit, 100);
  const limit = Math.min(limitRequested, 500); // MAL API max 500
  const offset = parsePositiveInt(req.query.offset, 0);
  const fields = req.query.fields;

  const params = { ranking_type, limit, offset };
  if (fields) params.fields = fields;

  const cacheKey = buildCacheKey('ranking', params);

  if (!shouldBypassCache(req)) {
    try {
      const cachedData = await getJson(cacheKey);
      if (cachedData) {
        logger.info('Cache HIT', { cacheKey });
        cachedData.cached = true;
        return res.json(cachedData);
      }
      logger.info('Cache MISS', { cacheKey });
    } catch (err) {
      logger.error({ err, cacheKey }, 'Error reading from cache (ranking)');
    }
  }

  logger.info('Fetching anime ranking from MyAnimeList', { rankingType: ranking_type, limit, offset });

  const malClient = createMALRequest();
  try {
    const response = await malClient.get('/anime/ranking', { params });

    logger.info('MyAnimeList ranking fetch successful', { rankingType: ranking_type, resultsCount: response.data.data?.length || 0 });

    const responsePayload = { success: true, cached: false, data: response.data.data || [], paging: response.data.paging || {}, ranking_type };

    if (!shouldBypassCache(req)) {
      try {
        await setJson(cacheKey, responsePayload, TTL_RANKING);
      } catch (err) {
        logger.error({ err, cacheKey }, 'Failed to set ranking in cache');
      }
    }

    return res.json(responsePayload);
  } catch (error) {
    logger.error('Error fetching anime ranking from MyAnimeList', { rankingType: ranking_type, error: error.message, status: error.response?.status, data: error.response?.data });
    return res.status(error.response?.status || 500).json({ error: 'Failed to fetch anime ranking', message: error.response?.data?.message || error.message });
  }
});

// Get seasonal anime
router.get('/season/:year/:season', async (req, res) => {
  const { year: yearParam, season: seasonParam } = req.params;
  const year = parseInt(yearParam, 10);
  const season = String(seasonParam || '').toLowerCase();

  const validSeasons = ['winter', 'spring', 'summer', 'fall'];
  if (!validSeasons.includes(season)) {
    logger.warn({ season: seasonParam }, 'Invalid season param');
    return res.status(400).json({ error: 'Invalid season', message: `Valid seasons: ${validSeasons.join(', ')}` });
  }

  const thisYear = new Date().getFullYear();
  if (Number.isNaN(year) || year < 1900 || year > thisYear + 2) {
    logger.warn({ year: yearParam }, 'Invalid year param');
    return res.status(400).json({ error: 'Invalid year', message: 'Please provide a valid year' });
  }

  const sort = req.query.sort;
  const limitRequested = parsePositiveInt(req.query.limit, 100);
  const limit = Math.min(limitRequested, 500);
  const offset = parsePositiveInt(req.query.offset, 0);
  const fields = req.query.fields;

  const validSorts = ['anime_score', 'anime_num_list_users'];
  const params = { limit, offset };
  if (sort && validSorts.includes(sort)) params.sort = sort;
  if (fields) params.fields = fields;

  const cacheKey = buildCacheKey(`season:${year}:${season}`, params);

  if (!shouldBypassCache(req)) {
    try {
      const cachedData = await getJson(cacheKey);
      if (cachedData) {
        logger.info('Cache HIT', { cacheKey });
        cachedData.cached = true;
        return res.json(cachedData);
      }
      logger.info('Cache MISS', { cacheKey });
    } catch (err) {
      logger.error({ err, cacheKey }, 'Error reading from cache (season)');
    }
  }

  logger.info('Fetching seasonal anime from MyAnimeList', { year, season, limit, offset });
  const malClient = createMALRequest();

  try {
    const response = await malClient.get(`/anime/season/${year}/${season}`, { params });

    logger.info('MyAnimeList seasonal anime fetch successful', { year, season, resultsCount: response.data.data?.length || 0 });

    const responsePayload = {
      success: true,
      cached: false,
      data: response.data.data || [],
      paging: response.data.paging || {},
      season: { year: parseInt(year, 10), season }
    };

    if (!shouldBypassCache(req)) {
      try {
        await setJson(cacheKey, responsePayload, TTL_SEASON);
      } catch (err) {
        logger.error({ err, cacheKey }, 'Failed to set season in cache');
      }
    }

    return res.json(responsePayload);
  } catch (error) {
    logger.error('Error fetching seasonal anime from MyAnimeList', { year, season, error: error.message, status: error.response?.status, data: error.response?.data });
    return res.status(error.response?.status || 500).json({ error: 'Failed to fetch seasonal anime', message: error.response?.data?.message || error.message });
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
    try {
      await malClient.get('/anime', { params: { q: 'test', limit: 1 } });
    } catch (err) {
      logger.error('MyAnimeList health check call failed', { err: err.message, status: err.response?.status });
      return res.status(502).json({ error: 'MyAnimeList API request failed', message: err.message });
    }

    return res.json({ success: true, message: 'MyAnimeList API connection is healthy', clientIdConfigured: !!process.env.MYANIME_LIST_CLIENT_ID });

  } catch (error) {
    logger.error('MyAnimeList API health check failed', {
      error: error.message,
      status: error.response?.status
    });
    return res.status(500).json({ error: 'MyAnimeList API connection failed', message: error.response?.data?.message || error.message, clientIdConfigured: !!process.env.MYANIME_LIST_CLIENT_ID });
  }
});

module.exports = router;

// Mock the database connection *before* importing the app
jest.mock('../config/database', () => {
  // Export a function that resolves immediately to prevent real DB connections during tests
  const connectDB = jest.fn(() => Promise.resolve());
  return connectDB;
});
// Mock the logging middleware so it does nothing. We mock the middleware
// instead of the logger to avoid side-effects from logger transports and to
// keep request logging inert during tests.

// 1. Mock the logger to fix "open handle" error
jest.mock('../config/logger', () => {
  const mLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => mLogger), // For pino-http
  };
  return mLogger;
});

// 2. Mock the logging middleware to fix the TypeError
jest.mock('../middleware/logging', () => ({
  requestLogger: () => (req, res, next) => next(),
  performanceMonitor: () => (req, res, next) => next(), // Add the missing function
}));

const request = require('supertest');
const nock = require('nock');
const app = require('../app'); // Import the express app (no DB connect / no listen)
const cache = require('../utils/cache');

// --- Mock the Cache ---
// We will mock the cache module to use a simple in-memory object
let mockRedisStore = {};

jest.mock('../utils/cache', () => {
  const originalCache = jest.requireActual('../utils/cache');
  return {
    ...originalCache, // Keep original buildCacheKey, shouldBypassCache
    getJson: jest.fn(async (key) => {
      return mockRedisStore[key] ? JSON.parse(mockRedisStore[key]) : null;
    }),
    setJson: jest.fn(async (key, value, ttl) => {
      mockRedisStore[key] = JSON.stringify(value);
    }),
  };
});

// Define MAL API for nock
const MAL_API = 'https://api.myanimelist.net';

describe('Anime Routes with Caching', () => {

  // Before each test, clear mocks and the fake cache
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
    mockRedisStore = {};
    process.env.MYANIME_LIST_CLIENT_ID = 'test-client-id';
    // Prevent real network calls by default; allow localhost for supertest
    nock.disableNetConnect();
    // ADD THIS LINE: Tell nock to allow supertest's localhost requests
    nock.enableNetConnect('127.0.0.1'); 
  });

  afterAll(() => {
    nock.restore();
    nock.enableNetConnect();
  });

  test('GET /api/anime/health returns success', async () => {
    // Mock MyAnimeList search used by the /api/anime/health endpoint
    nock(MAL_API)
      .get('/v2/anime')
      .query(true)
      .reply(200, { data: [] });

    const res = await request(app).get('/api/anime/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  // Additional cache-related tests can be added here
  describe('GET /api/anime/search', () => {
    it('should fetch from MAL and cache on a cache MISS', async () => {
      const query = 'naruto';
      const mockMalResponse = { data: [{ node: { id: 1, title: 'Naruto' } }] };

      // 1. Mock the external MAL API call
      const malScope = nock(MAL_API)
        .get('/v2/anime')
        .query((actual) => actual.q === query && Number(actual.limit) === 100 && Number(actual.offset) === 0)
        .reply(200, mockMalResponse);

      // 2. Make the request to our app
      const res = await request(app).get(`/api/anime/search?q=${query}`);

      // 3. Assertions
      expect(res.status).toBe(200);
      expect(res.body.cached).toBe(false); // First call is not from cache
      expect(res.body.data[0].node.title).toBe('Naruto');

      // Check that MAL API was actually called
      expect(malScope.isDone()).toBe(true);
      // Check that our mock cache.setJson function was called
      expect(cache.setJson).toHaveBeenCalledTimes(1);
    });

    it('should return cached result on cache HIT and not call MAL', async () => {
      const query = 'naruto';
      // Build the cache key the same way the route does
      const cacheKey = cache.buildCacheKey('search', { q: query, limit: 100, offset: 0 });

      const mockCachedPayload = {
        success: true,
        cached: false,
        data: [{ node: { id: 1, title: 'Cached Naruto' } }],
        paging: {},
        query: { q: query, limit: 100, offset: 0 }
      };

      // 1. "Prime" the cache
      mockRedisStore[cacheKey] = JSON.stringify(mockCachedPayload);
      
      // 2. Mock the external API (nock)
      // This scope should *not* be hit
      const malScope = nock(MAL_API)
        .get('/v2/anime')
        .query(true)
        .reply(200, { data: [{ node: { id: 99, title: 'Live API' } }] });

      // 3. Make the request
      const res = await request(app).get(`/api/anime/search?q=${query}`);

      // 4. Assertions
      expect(res.status).toBe(200);
      expect(res.body.cached).toBe(true); // This time it *is* from cache
      expect(res.body.data[0].node.title).toBe('Cached Naruto'); // Matches cache

      // Check that MAL API was *NOT* called
      expect(malScope.isDone()).toBe(false);
      
      // Check that cache.getJson was called, but cache.setJson was not
      expect(cache.getJson).toHaveBeenCalledWith(cacheKey);
      expect(cache.setJson).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/anime/details/:anime_id', () => {
    it('should fetch details from MAL and cache on cache MISS', async () => {
      const animeId = '12345';
      const fields = 'id,title';
      const mockMalResponse = { id: 12345, title: 'Test Anime' };

      const malScope = nock(MAL_API)
        .get(`/v2/anime/${animeId}`)
        .query((actual) => actual.fields === fields)
        .reply(200, mockMalResponse);

      const res = await request(app).get(`/api/anime/details/${animeId}?fields=${encodeURIComponent(fields)}`);

      expect(res.status).toBe(200);
      expect(res.body.cached).toBe(false);
      expect(res.body.data.id).toBe(12345);

      expect(malScope.isDone()).toBe(true);
      expect(cache.setJson).toHaveBeenCalledTimes(1);
    });

    it('should return cached details on cache HIT and not call MAL', async () => {
      const animeId = '12345';
      const fields = 'id,title';
      const cacheKey = cache.buildCacheKey(`details:${animeId}`, { fields });

      const mockCachedPayload = {
        success: true,
        cached: false,
        data: { id: 12345, title: 'Cached Anime' }
      };

      mockRedisStore[cacheKey] = JSON.stringify(mockCachedPayload);

      const malScope = nock(MAL_API)
        .get(`/v2/anime/${animeId}`)
        .query(true)
        .reply(200, { id: 999, title: 'Live API' });

      const res = await request(app).get(`/api/anime/details/${animeId}?fields=${encodeURIComponent(fields)}`);

      expect(res.status).toBe(200);
      expect(res.body.cached).toBe(true);
      expect(res.body.data.title).toBe('Cached Anime');

      expect(malScope.isDone()).toBe(false);
      expect(cache.getJson).toHaveBeenCalledWith(cacheKey);
      expect(cache.setJson).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/anime/ranking', () => {
    it('should fetch ranking from MAL and cache on cache MISS', async () => {
      const rankingType = 'all';
      const mockMalResponse = { data: [{ node: { id: 10, title: 'Top Anime' } }] };

      const malScope = nock(MAL_API)
        .get('/v2/anime/ranking')
        .query((actual) => actual.ranking_type === rankingType && Number(actual.limit) === 100)
        .reply(200, mockMalResponse);

      const res = await request(app).get('/api/anime/ranking');

      expect(res.status).toBe(200);
      expect(res.body.cached).toBe(false);
      expect(res.body.data[0].node.title).toBe('Top Anime');

      expect(malScope.isDone()).toBe(true);
      expect(cache.setJson).toHaveBeenCalledTimes(1);
    });

    it('should return cached ranking on cache HIT and not call MAL', async () => {
      const cacheParams = { ranking_type: 'all', limit: 100, offset: 0 };
      const cacheKey = cache.buildCacheKey('ranking', cacheParams);

      const mockCachedPayload = {
        success: true,
        cached: false,
        data: [{ node: { id: 20, title: 'Cached Top' } }],
        paging: {}
      };

      mockRedisStore[cacheKey] = JSON.stringify(mockCachedPayload);

      const malScope = nock(MAL_API)
        .get('/v2/anime/ranking')
        .query(true)
        .reply(200, { data: [{ node: { id: 999, title: 'Live API' } }] });

      const res = await request(app).get('/api/anime/ranking');

      expect(res.status).toBe(200);
      expect(res.body.cached).toBe(true);
      expect(res.body.data[0].node.title).toBe('Cached Top');

      expect(malScope.isDone()).toBe(false);
      expect(cache.getJson).toHaveBeenCalledWith(cacheKey);
      expect(cache.setJson).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/anime/season/:year/:season', () => {
    it('should fetch season list from MAL and cache on cache MISS', async () => {
      const year = 2025;
      const season = 'summer';
      const mockMalResponse = { data: [{ node: { id: 30, title: 'Season Anime' } }] };

      const malScope = nock(MAL_API)
        .get(`/v2/anime/season/${year}/${season}`)
        .query((actual) => Number(actual.limit) === 100 && Number(actual.offset) === 0)
        .reply(200, mockMalResponse);

      const res = await request(app).get(`/api/anime/season/${year}/${season}`);

      expect(res.status).toBe(200);
      expect(res.body.cached).toBe(false);
      expect(res.body.data[0].node.title).toBe('Season Anime');

      expect(malScope.isDone()).toBe(true);
      expect(cache.setJson).toHaveBeenCalledTimes(1);
    });

    it('should return cached season list on cache HIT and not call MAL', async () => {
      const year = 2025;
      const season = 'summer';
      const cacheParams = { limit: 100, offset: 0 };
      const cacheKey = cache.buildCacheKey(`season:${year}:${season}`, cacheParams);

      const mockCachedPayload = {
        success: true,
        cached: false,
        data: [{ node: { id: 30, title: 'Cached Season' } }],
        paging: {},
        season: { year: year, season }
      };

      mockRedisStore[cacheKey] = JSON.stringify(mockCachedPayload);

      const malScope = nock(MAL_API)
        .get(`/v2/anime/season/${year}/${season}`)
        .query(true)
        .reply(200, { data: [{ node: { id: 999, title: 'Live API' } }] });

      const res = await request(app).get(`/api/anime/season/${year}/${season}`);

      expect(res.status).toBe(200);
      expect(res.body.cached).toBe(true);
      expect(res.body.data[0].node.title).toBe('Cached Season');

      expect(malScope.isDone()).toBe(false);
      expect(cache.getJson).toHaveBeenCalledWith(cacheKey);
      expect(cache.setJson).not.toHaveBeenCalled();
    });
  });
});

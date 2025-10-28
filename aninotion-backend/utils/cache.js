const { get, set } = require('./redisClient');
const logger = require('../config/logger');

async function getJson(key) {
  if (!key) {
    logger.warn({ key }, 'getJson called without a key');
    return null;
  }

  try {
    const raw = await get(key);
    if (!raw) {
      logger.debug({ key }, 'Cache GET returned empty');
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (err) {
      // Corrupted JSON in cache should be treated as a miss
      logger.warn({ err, key }, 'Invalid JSON in cache');
      return null;
    }
  } catch (err) {
    // get() already logs errors for Redis failures, but log here for context
    logger.error({ err, key }, 'getJson: failed to read from cache');
    return null;
  }
}

async function setJson(key, object, ttl) {
  if (!key) {
    logger.warn('setJson called without a key');
    return;
  }

  if (object === undefined) {
    logger.warn({ key }, 'setJson called with undefined value; skipping cache set');
    return;
  }

  try {
    const str = JSON.stringify(object);
    await set(key, str, ttl);
    logger.debug({ key, ttl }, 'Cache SET successful');
  } catch (err) {
    logger.error({ err, key, ttl }, 'Failed to set JSON in cache');
  }
}

function buildCacheKey(prefix, params = {}) {
  const safePrefix = String(prefix || '');
  let key = `anime:${safePrefix}`;
  const keys = Object.keys(params).sort();
  for (const k of keys) {
    const v = params[k] === undefined || params[k] === null ? '' : String(params[k]);
    key += `:${k}=${v}`;
  }
  return key;
}

function shouldBypassCache(req) {
  try {
    if (process.env.ANINOTION_CACHE_ENABLED === 'false') return true;
    if (req && req.query && String(req.query.cache).toLowerCase() === 'false') return true;
    return false;
  } catch (err) {
    logger.error({ err }, 'shouldBypassCache: error reading request/cache flag');
    // Fallback: do not bypass on unexpected errors
    return false;
  }
}

module.exports = {
  getJson,
  setJson,
  buildCacheKey,
  shouldBypassCache,
};

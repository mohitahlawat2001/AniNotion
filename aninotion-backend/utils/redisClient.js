const { Redis } = require("@upstash/redis");
const logger = require("../config/logger");

let redis = null;
let connected = false;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Initialize client from environment (Upstash)
    redis = Redis.fromEnv();
    connected = true;
    logger.info("Upstash Redis client initialized; cache enabled");
  } else {
    logger.warn(
      "UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN not set; Redis cache disabled"
    );
  }
} catch (err) {
  // If initialization fails, disable cache but don't crash the app
  logger.error({ err }, "Redis initialization failed");
  connected = false;
  redis = null;
}

function isAvailable() {
  return connected && !!redis && process.env.ANINOTION_CACHE_ENABLED !== "false";
}

async function get(key) {
  if (!isAvailable()) return null;

  try {
    return await redis.get(key);
  } catch (err) {
    logger.error({ err, key }, "Redis GET failed");
    return null;
  }
}

async function set(key, value, ttlSeconds) {
  if (!isAvailable()) return;

  try {
    // Upstash supports the 'ex' option for expiry in seconds
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    logger.error({ err, key }, "Redis SET failed");
  }
}

module.exports = {
  isAvailable,
  get,
  set,
};

// Pino custom transport: append JSON logs to a Redis list keyed by UTC day.
// Requires @upstash/redis and pino-abstract-transport.
const { build } = require("pino-abstract-transport");
const { Redis } = require("@upstash/redis");

module.exports = async function (opts = {}) {
  const redis = new Redis({ url: opts.upstashUrl, token: opts.upstashToken });
  const label = String(opts.label || "app");
  const maxPerDay = Number(opts.maxPerDay || 5000);
  const pickFields = Array.isArray(opts.pickFields) ? opts.pickFields : null;

  function dayKey(ts) {
    const d = new Date(typeof ts === "number" ? ts : Date.now());
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `logs:${label}:${yyyy}-${mm}-${dd}`;
  }

  function shape(entry) {
    if (!pickFields) return entry;
    const out = {};
    for (const k of pickFields) {
      if (entry[k] !== undefined) out[k] = entry[k];
    }
    return out;
  }

  return build(async function (source) {
    for await (const obj of source) {
      try {
        const key = dayKey(obj.time || Date.now());
        const shaped = shape(obj);
        await redis.rpush(key, JSON.stringify(shaped));
        // Keep only the last maxPerDay entries (last N lines)
        await redis.ltrim(key, -1 * maxPerDay, -1);
        // Auto-expire in 7 days as a safety net
        await redis.expire(key, 7 * 24 * 3600);
      } catch {
        // Never crash on log shipping issues
      }
    }
  });
};

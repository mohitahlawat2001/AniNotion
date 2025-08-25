const pino = require("pino");
const path = require("path");

const isProd = process.env.NODE_ENV === "production";

const targets = [];

// In production, emit JSON to stdout; in dev, pretty print
if (isProd) {
  targets.push({
    target: "pino/file",
    options: { destination: 1 }, // stdout
    level: process.env.LOG_LEVEL || "info",
  });
} else {
  targets.push({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      singleLine: true,
    },
    level: "debug",
  });
}

// Optional: also stream to Upstash Redis for daily email
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  targets.push({
    // Use absolute path to ensure proper resolution in all environments
    target: path.join(__dirname, "..", "utils", "pino-redis-transport.js"),
    options: {
      upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
      upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      label: process.env.APP_NAME || "mern-app",
      maxPerDay: Number(process.env.LOGS_MAX_PER_DAY) || 5000, // cap entries/day
      pickFields: ["level", "time", "msg", "requestId", "req", "res", "err", "context"],
    },
    level: process.env.LOG_TO_REDIS_LEVEL || "info",
  });
}

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "authorization",
      "password",
      "creditCard",
      "user.ssn",
    ],
    censor: "[REDACTED]",
  },
  transport: { targets },
});

module.exports = logger;

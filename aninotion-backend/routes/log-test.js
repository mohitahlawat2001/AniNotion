const express = require("express");
const logger = require("../config/logger");

const router = express.Router();

router.get("/log-test", (req, res) => {
  logger.info("🧪 Log test endpoint accessed", {
    module: "log-test",
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Global logger (no request context)
  logger.info({ module: "log-test" }, "Global logger works");

  // Request-scoped logger (has request info)
  req.log.debug({ query: req.query }, "Handling /log-test");
  req.log.warn({ note: "warn sample" }, "Warn example");
  req.log.error({ err: new Error("Boom!") }, "Error example");

  // Test different log levels
  logger.trace("🔍 Trace level log");
  logger.debug("🐛 Debug level log");
  logger.info("ℹ️ Info level log");
  logger.warn("⚠️ Warning level log");
  logger.error("❌ Error level log");

  logger.info("✅ Log test completed successfully", {
    totalLogsSent: 8,
    levels: ['trace', 'debug', 'info', 'warn', 'error']
  });

  res.json({ 
    ok: true, 
    message: "Check your logs and Redis buffer",
    timestamp: new Date().toISOString(),
    logLevels: ['trace', 'debug', 'info', 'warn', 'error'],
    totalLogsSent: 8
  });
});

module.exports = router;

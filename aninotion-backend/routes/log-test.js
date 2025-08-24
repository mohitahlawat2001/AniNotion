const express = require("express");
const logger = require("../config/logger");

const router = express.Router();

router.get("/log-test", (req, res) => {
  // Global logger (no request context)
  logger.info({ module: "log-test" }, "Global logger works");

  // Request-scoped logger (has request info)
  req.log.debug({ query: req.query }, "Handling /log-test");
  req.log.warn({ note: "warn sample" }, "Warn example");
  req.log.error({ err: new Error("Boom!") }, "Error example");

  res.json({ ok: true, message: "Check your logs and Redis buffer" });
});

module.exports = router;

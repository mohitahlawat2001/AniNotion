const express = require("express");
const { sendDailyLogs } = require("../scripts/sendDailyLogs");

const router = express.Router();

/**
 * GET /cron/send-daily-logs?date=YYYY-MM-DD&secret=...
 * Use an external scheduler to hit this daily.
 */
router.get("/send-daily-logs", async (req, res) => {
  try {
    const secret = req.query.secret || req.headers["x-cron-secret"];
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const date = req.query.date; // optional
    const result = await sendDailyLogs({
      date,
      label: process.env.APP_NAME || "mern-app",
      upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
      upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      emailTo: process.env.DAILY_LOG_EMAIL_TO,
      emailFrom: process.env.EMAIL_FROM,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to send daily logs", details: String(err?.message || err) });
  }
});

module.exports = router;

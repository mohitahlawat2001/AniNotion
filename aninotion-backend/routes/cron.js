const express = require("express");
const { sendDailyLogs } = require("../scripts/sendDailyLogs");

const router = express.Router();

/**
 * GET /cron/send-daily-logs?date=YYYY-MM-DD&secret=...
 * Use an external scheduler to hit this daily.
 */
router.get("/send-daily-logs", async (req, res) => {
  console.log("🚀 Cron endpoint hit:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      "user-agent": req.headers["user-agent"],
      "x-cron-secret": req.headers["x-cron-secret"] ? "***PROVIDED***" : "***MISSING***"
    },
    query: req.query
  });

  try {
    const secret = req.query.secret || req.headers["x-cron-secret"];
    
    console.log("🔑 Authentication check:", {
      cronSecretSet: !!process.env.CRON_SECRET,
      secretProvided: !!secret,
      secretMatch: process.env.CRON_SECRET && secret === process.env.CRON_SECRET
    });

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      console.log("❌ Authentication failed");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("✅ Authentication successful");

    console.log("✅ Authentication successful");

    const date = req.query.date; // optional
    
    console.log("📧 Environment variables check:", {
      APP_NAME: process.env.APP_NAME || "not set",
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? "***SET***" : "***MISSING***",
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? "***SET***" : "***MISSING***",
      DAILY_LOG_EMAIL_TO: process.env.DAILY_LOG_EMAIL_TO || "***MISSING***",
      EMAIL_FROM: process.env.EMAIL_FROM || "***MISSING***",
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "***SET***" : "***MISSING***"
    });

    console.log("📅 Sending daily logs with params:", {
      date: date || "yesterday (auto)",
      label: process.env.APP_NAME || "mern-app"
    });

    const result = await sendDailyLogs({
      date,
      label: process.env.APP_NAME || "mern-app",
      upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
      upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      emailTo: process.env.DAILY_LOG_EMAIL_TO,
      emailFrom: process.env.EMAIL_FROM,
    });

    console.log("🎉 Daily logs sent successfully:", result);

    console.log("🎉 Daily logs sent successfully:", result);

    res.json(result);
  } catch (err) {
    console.error("💥 Error in cron endpoint:", {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      error: "Failed to send daily logs", 
      details: String(err?.message || err),
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

const express = require("express");
const { sendDailyLogs } = require("../scripts/sendDailyLogs");
const viewCounter = require("../utils/viewCounter");
const Post = require("../models/Post");
const analyticsService = require("../services/analyticsService");
const { isAnalyticsEnabled } = require("../config/analyticsDatabase");

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

/**
 * GET /cron/sync-engagement?secret=...
 * Sync Redis engagement data (views, likes) to MongoDB
 */
router.get("/sync-engagement", async (req, res) => {
  console.log("🔄 Sync engagement endpoint hit:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      "user-agent": req.headers["user-agent"],
      "x-cron-secret": req.headers["x-cron-secret"] ? "***PROVIDED***" : "***MISSING***"
    }
  });

  try {
    const secret = req.query.secret || req.headers["x-cron-secret"];

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      console.log("❌ Authentication failed");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("✅ Authentication successful");

    console.log("📊 Starting engagement data sync from Redis to MongoDB...");

    const { viewsSynced, likesSynced } = await viewCounter.syncToDatabase(Post);

    console.log("✅ Engagement sync completed:", {
      viewsSynced,
      likesSynced,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      viewsSynced,
      likesSynced,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("💥 Error in sync engagement endpoint:", {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Failed to sync engagement data",
      details: String(err?.message || err),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /cron/aggregate-analytics?secret=...
 * Aggregate daily analytics data - run at end of day
 */
router.get("/aggregate-analytics", async (req, res) => {
  console.log("📊 Analytics aggregation cron hit:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });

  try {
    const secret = req.query.secret || req.headers["x-cron-secret"];

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      console.log("❌ Authentication failed");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isAnalyticsEnabled()) {
      return res.status(503).json({
        error: "Analytics not enabled",
        message: "ANALYTICS_DATABASE_URL is not configured"
      });
    }

    console.log("✅ Authentication successful, starting analytics aggregation...");

    // Aggregate yesterday's data (or specified date)
    const date = req.query.date || (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    })();

    const success = await analyticsService.aggregateDailyAnalytics(date);

    if (!success) {
      return res.status(500).json({
        error: "Failed to aggregate analytics",
        timestamp: new Date().toISOString()
      });
    }

    console.log("✅ Analytics aggregation completed for date:", date);

    res.json({
      success: true,
      date,
      message: "Daily analytics aggregated successfully",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("💥 Error in analytics aggregation:", {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Failed to aggregate analytics",
      details: String(err?.message || err),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /cron/cleanup-analytics?secret=...&retentionDays=90
 * Clean up old analytics data based on retention policy
 */
router.get("/cleanup-analytics", async (req, res) => {
  console.log("🧹 Analytics cleanup cron hit:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });

  try {
    const secret = req.query.secret || req.headers["x-cron-secret"];

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      console.log("❌ Authentication failed");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isAnalyticsEnabled()) {
      return res.status(503).json({
        error: "Analytics not enabled",
        message: "ANALYTICS_DATABASE_URL is not configured"
      });
    }

    console.log("✅ Authentication successful, starting analytics cleanup...");

    const retentionDays = parseInt(req.query.retentionDays) || 90;
    const deletedCount = await analyticsService.cleanupOldData(retentionDays);

    if (deletedCount === null) {
      return res.status(500).json({
        error: "Failed to cleanup analytics",
        timestamp: new Date().toISOString()
      });
    }

    console.log("✅ Analytics cleanup completed:", {
      deletedRecords: deletedCount,
      retentionDays
    });

    res.json({
      success: true,
      deletedRecords: deletedCount,
      retentionDays,
      message: `Cleaned up ${deletedCount} old analytics records`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("💥 Error in analytics cleanup:", {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      error: "Failed to cleanup analytics",
      details: String(err?.message || err),
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

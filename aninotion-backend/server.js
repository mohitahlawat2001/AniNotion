// Load environment variables FIRST, before any other imports
require('dotenv').config();

const express = require('express');
const logTestRouter = require("./routes/log-test");
const cronRouter = require("./routes/cron");
const requestLogger = require("./middleware/logging");
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('./config/passport');

const connectDB = require('./config/database');
const { initializeAnalyticsDB, isAnalyticsEnabled } = require('./config/analyticsDatabase');
const categoryRoutes = require('./routes/categories');
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const animeRoutes = require('./routes/anime');
const sitemapRoutes = require('./routes/sitemap');
const recommendationRoutes = require('./routes/recommendations');
const analyticsRoutes = require('./routes/analytics');
const commentRoutes = require('./routes/comments');
const logger = require('./config/logger');
const BackupScheduler = require('./utils/backupScheduler');

// Analytics middleware
const { analyticsMiddleware, sessionMiddleware } = require('./middleware/analytics');

const app = express();

// Apply performance monitoring first, then logging
app.use(requestLogger.performanceMonitor());
app.use(requestLogger.requestLogger());

const PORT = process.env.PORT || 5000;

// Log server startup
logger.info("🚀 Server initializing...", {
  nodeEnv: process.env.NODE_ENV,
  port: PORT,
  appName: process.env.APP_NAME || "aninotion",
  logLevel: process.env.LOG_LEVEL || "info"
});

// Connect to MongoDB
connectDB();

// Initialize Analytics Database (PostgreSQL)
initializeAnalyticsDB().then(success => {
  if (success) {
    logger.info('✅ Analytics database initialized');
  } else {
    logger.warn('⚠️ Analytics database not initialized (check ANALYTICS_DATABASE_URL)');
  }
}).catch(err => {
  logger.error('❌ Analytics database initialization failed', { error: err.message });
});

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb',extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Analytics middleware - AFTER passport so req.user is available
// Session middleware tracks analytics sessions
app.use(sessionMiddleware());
app.use(analyticsMiddleware());

logger.info("✅ Middleware configured successfully");

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api', sitemapRoutes); // Sitemap and RSS routes

// Root route
app.get('/', (req, res) => {
  logger.info("Root endpoint accessed", { ip: req.ip, userAgent: req.get('User-Agent') });
  res.json({ message: 'AniNotion API is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info("Health check requested", { ip: req.ip });
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use("/", logTestRouter);
app.use("/cron", cronRouter);

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent")
  });

  res.status(err.status || 500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn("404 - Route not found:", {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent")
  });

  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

let server;

// Start the server only when this file is run directly. This allows importing
// the `app` instance in tests without starting the HTTP server.
if (require.main === module) {
  server = app.listen(PORT, async () => {
    logger.info("🎉 Server started successfully", {
      port: PORT,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    });
    console.log(`Server is running on port ${PORT}`);
    
    // // Initialize automatic backup scheduler
    // try {
    //   const backupScheduler = new BackupScheduler();
    //   await backupScheduler.start();
    //   logger.info("🔄 Automatic backup scheduler initialized");
    // } catch (error) {
    //   // logger.error("❌ Failed to initialize backup scheduler:", error);
    //   // Don't stop server if backup scheduler fails
    // }
  });
}

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  if (server) {
    server.close(() => {
      logger.info("Server closed successfully");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  if (server) {
    server.close(() => {
      logger.info("Server closed successfully");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Export the app for testing and importing without starting the server
module.exports = app;
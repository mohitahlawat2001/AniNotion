// Build and export the Express app without starting the HTTP server
// This file is intended for tests and other consumers that need the app
// without side-effects like connecting to the DB or starting listeners.
require('dotenv').config();

const express = require('express');
const logTestRouter = require("./routes/log-test");
const cronRouter = require("./routes/cron");
const requestLogger = require("./middleware/logging");
const cors = require('cors');
const passport = require('./config/passport');

const categoryRoutes = require('./routes/categories');
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const animeRoutes = require('./routes/anime');
const sitemapRoutes = require('./routes/sitemap');
const recommendationRoutes = require('./routes/recommendations');
const logger = require('./config/logger');

const app = express();

// Apply performance monitoring first, then logging
app.use(requestLogger.performanceMonitor());
app.use(requestLogger.requestLogger());

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/recommendations', recommendationRoutes);
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

module.exports = app;

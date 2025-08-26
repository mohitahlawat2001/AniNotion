const express = require('express');
const logTestRouter = require("./routes/log-test");
const cronRouter = require("./routes/cron");
const requestLogger = require("./middleware/logging");
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const categoryRoutes = require('./routes/categories');
const postRoutes = require('./routes/posts');
const logger = require('./config/logger');

const app = express();
app.use(requestLogger());
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

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb',extended: true }));

logger.info("✅ Middleware configured successfully");

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);

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

const server = app.listen(PORT, () => {
  logger.info("🎉 Server started successfully", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed successfully");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed successfully");
    process.exit(0);
  });
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { startScheduler } = require('./config/scheduler');
const animeReleasesRoutes = require('./routes/animeReleases');
const scrapingConfigRoutes = require('./routes/scrapingConfig');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.MAIN_BACKEND_URL || 'http://localhost:5000',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Anime Scraping & Notification Service API',
    version: '1.0.0',
    database: 'Shared with aninotion-backend',
    features: [
      'Automated web scraping with bot protection',
      'Admin-configurable scraping sources',
      'User-specific notifications',
      'Multi-source support'
    ],
    endpoints: {
      releases: '/api/anime-releases',
      configs: '/api/scraping-config (Admin)',
      stats: '/api/anime-releases/stats',
      unseen: '/api/anime-releases/unseen',
      markSeen: 'POST /api/anime-releases/mark-seen',
      scrape: 'POST /api/anime-releases/scrape'
    }
  });
});

app.use('/api/anime-releases', animeReleasesRoutes);
app.use('/api/scraping-config', scrapingConfigRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start the cron scheduler
    startScheduler();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Scraping Service running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}`);
      console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing server');
  process.exit(0);
});

startServer();

module.exports = app;

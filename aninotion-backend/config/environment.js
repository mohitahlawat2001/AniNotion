const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Environment configuration with validation
 * Supports development, staging, and production environments
 */
class EnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.validateRequired();
    this.setDefaults();
  }

  /**
   * Validate required environment variables
   */
  validateRequired() {
    const required = [
      'MONGODB_URI',
      'JWT_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT_SECRET strength in production
    if (this.isProduction() && process.env.JWT_SECRET.length < 10) {
      throw new Error('JWT_SECRET must be at least 10 characters in production');
    }
  }

  /**
   * Set default values for optional variables
   */
  setDefaults() {
    this.port = process.env.PORT || 5000;
    this.logLevel = process.env.LOG_LEVEL || (this.isDevelopment() ? 'debug' : 'info');
    this.corsOrigin = process.env.CORS_ORIGIN || (this.isDevelopment() ? 'http://localhost:3000' : null);
    this.maxRequestSize = process.env.MAX_REQUEST_SIZE || '10mb';
    this.rateLimitWindow = process.env.RATE_LIMIT_WINDOW || 900000; // 15 minutes
    this.rateLimitMax = process.env.RATE_LIMIT_MAX || 100;
  }

  /**
   * Environment checks
   */
  isDevelopment() {
    return this.env === 'development';
  }

  isStaging() {
    return this.env === 'staging';
  }

  isProduction() {
    return this.env === 'production';
  }

  isTest() {
    return this.env === 'test';
  }

  /**
   * Database configuration
   */
  getDatabase() {
    const baseUri = process.env.MONGODB_URI;
    
    // Add staging suffix for staging environment
    if (this.isStaging()) {
      return baseUri.replace(/\/([^\/]+)$/, '/staging_$1');
    }
    
    return baseUri;
  }

  /**
   * Redis configuration
   */
  getRedis() {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      enabled: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    };
  }

  /**
   * Cloudinary configuration
   */
  getCloudinary() {
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      folder: this.isStaging() ? 'staging' : 'production'
    };
  }

  /**
   * Email configuration
   */
  getEmail() {
    return {
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || 'noreply@aninotion.com',
      dailyLogEmail: process.env.DAILY_LOG_EMAIL_TO,
      enabled: !!process.env.RESEND_API_KEY
    };
  }

  /**
   * Security configuration
   */
  getSecurity() {
    return {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiry: process.env.JWT_EXPIRY || '7d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
      cronSecret: process.env.CRON_SECRET
    };
  }

  /**
   * Feature flags
   */
  getFeatures() {
    return {
      enableRecommendations: process.env.ENABLE_RECOMMENDATIONS !== 'false',
      enableAnimeIntegration: process.env.ENABLE_ANIME_INTEGRATION !== 'false',
      enableSEO: process.env.ENABLE_SEO !== 'false',
      enableWatchLinks: process.env.ENABLE_WATCH_LINKS !== 'false',
      enableRelations: process.env.ENABLE_RELATIONS !== 'false',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
    };
  }

  /**
   * API configuration
   */
  getAPI() {
    return {
      baseUrl: process.env.API_BASE_URL || `http://localhost:${this.port}`,
      version: process.env.API_VERSION || 'v1',
      timeout: parseInt(process.env.API_TIMEOUT) || 30000
    };
  }

  /**
   * Get all configuration
   */
  getAll() {
    return {
      env: this.env,
      port: this.port,
      database: this.getDatabase(),
      redis: this.getRedis(),
      cloudinary: this.getCloudinary(),
      email: this.getEmail(),
      security: this.getSecurity(),
      features: this.getFeatures(),
      api: this.getAPI(),
      cors: {
        origin: this.corsOrigin,
        credentials: true
      },
      logging: {
        level: this.logLevel,
        maxPerDay: parseInt(process.env.LOGS_MAX_PER_DAY) || 5000,
        redisLevel: process.env.LOG_TO_REDIS_LEVEL
      },
      rateLimit: {
        windowMs: this.rateLimitWindow,
        max: this.rateLimitMax
      }
    };
  }

  /**
   * Print configuration summary (excluding secrets)
   */
  printSummary() {
    const config = this.getAll();
    const safe = {
      env: config.env,
      port: config.port,
      database: config.database ? '[CONFIGURED]' : '[NOT CONFIGURED]',
      redis: config.redis.enabled ? '[ENABLED]' : '[DISABLED]',
      cloudinary: config.cloudinary.cloud_name ? '[CONFIGURED]' : '[NOT CONFIGURED]',
      email: config.email.enabled ? '[ENABLED]' : '[DISABLED]',
      features: config.features,
      api: config.api
    };

    console.log('🔧 Environment Configuration:');
    console.log(JSON.stringify(safe, null, 2));
  }
}

module.exports = new EnvironmentConfig();

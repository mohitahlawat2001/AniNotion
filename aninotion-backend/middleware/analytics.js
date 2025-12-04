/**
 * Analytics Middleware (Redesigned)
 * Tracks page views using normalized PostgreSQL schema
 * Designed for dashboard-ready, meaningful analytics data
 */

const analyticsService = require('../services/analyticsService');
const { isAnalyticsEnabled } = require('../config/analyticsDatabase');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');

// Paths to exclude from analytics tracking
const EXCLUDED_PATHS = [
  '/health',
  '/favicon.ico',
  '/robots.txt',
  '/api/analytics', // Don't track analytics endpoints themselves
  '/api/v1/analytics'
];

// Methods to exclude from tracking
const EXCLUDED_METHODS = ['OPTIONS', 'HEAD'];

/**
 * Extract content information from request path
 * Returns { type, mongoId, title } if content is being accessed
 */
const extractContentFromRequest = (req, responseBody) => {
  const path = req.path.toLowerCase();
  const params = req.params || {};

  // Post access: /api/posts/:id or /api/v1/posts/:id
  if (path.match(/\/posts\/[a-f0-9]{24}$/i)) {
    const postId = params.id || path.split('/').pop();
    return {
      type: 'post',
      mongoId: postId,
      title: responseBody?.title || responseBody?.post?.title || null
    };
  }

  // Category access: /api/categories/:id or by slug
  if (path.match(/\/categories\/[a-f0-9]{24}$/i) || 
      (path.includes('/categories/') && params.slug)) {
    const categoryId = params.id || params.slug || path.split('/').pop();
    return {
      type: 'category',
      mongoId: categoryId,
      title: responseBody?.name || responseBody?.category?.name || null
    };
  }

  // Posts by category: /api/posts/category/:categoryId
  if (path.includes('/posts/category/')) {
    const categoryId = params.categoryId || path.split('/').pop();
    return {
      type: 'category',
      mongoId: categoryId,
      title: null
    };
  }

  return null;
};

/**
 * Determine page type from request
 */
const determinePageType = (req) => {
  const path = req.path.toLowerCase();

  if (path.includes('/auth/login') || path.includes('/login')) return 'login';
  if (path.includes('/auth/register') || path.includes('/signup')) return 'register';
  if (path.includes('/auth/')) return 'auth';
  if (path.match(/\/posts\/[a-f0-9]{24}/i)) return 'post_detail';
  if (path.includes('/posts')) return 'posts_list';
  if (path.match(/\/categories\/[a-f0-9]+/i)) return 'category_detail';
  if (path.includes('/categories')) return 'categories_list';
  if (path.includes('/anime/search')) return 'anime_search';
  if (path.includes('/anime/trending')) return 'anime_trending';
  if (path.includes('/anime')) return 'anime';
  if (path.includes('/recommendations')) return 'recommendations';
  if (path.includes('/profile') || path.includes('/users/me')) return 'profile';
  if (path.includes('/search')) return 'search';
  if (path === '/' || path === '/api' || path === '/api/v1') return 'home';

  return 'other';
};

/**
 * Try to extract user info from JWT token without requiring authentication
 */
const extractUserFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    
    // Decode without verifying - we just want user info for analytics
    // The actual auth verification happens in requireAuth middleware
    const decoded = jwt.decode(token);
    if (decoded && decoded.id) {
      return {
        id: decoded.id,
        username: decoded.username || null,
        email: decoded.email || null
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Main analytics middleware
 * Tracks page views with normalized data
 */
const analyticsMiddleware = () => {
  return async (req, res, next) => {
    // Skip if analytics is not enabled
    if (!isAnalyticsEnabled()) {
      return next();
    }

    // Skip excluded paths
    if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip excluded methods
    if (EXCLUDED_METHODS.includes(req.method)) {
      return next();
    }

    // Only track GET requests for page views (POST/PUT/DELETE are actions, not views)
    // But we still want to track auth events
    const isAuthRequest = req.path.toLowerCase().includes('/auth/');
    if (req.method !== 'GET' && !isAuthRequest) {
      return next();
    }

    // Try to extract user info from JWT token
    const tokenUser = extractUserFromToken(req);
    if (tokenUser) {
      // Attach to req for later use in tracking
      req.analyticsUser = tokenUser;
    }

    const startTime = Date.now();

    // Capture original res.json to intercept response
    const originalJson = res.json.bind(res);
    let responseBody = null;

    res.json = function(body) {
      responseBody = body;
      return originalJson(body);
    };

    // Track response when finished
    res.on('finish', async () => {
      try {
        // Only track successful responses (2xx, 3xx)
        if (res.statusCode >= 400) {
          return;
        }

        const latencyMs = Date.now() - startTime;
        // Try multiple sources for user info: req.user (from auth middleware), req.analyticsUser (from JWT decode), or null
        const authUser = req.user || req.analyticsUser;
        const userId = authUser?.id || authUser?._id?.toString() || null;
        const userAgent = req.get('User-Agent') || '';
        const referer = req.get('Referer') || '';
        const pageType = determinePageType(req);

        // Extract content if viewing specific content
        const contentInfo = extractContentFromRequest(req, responseBody);

        // Prepare content data if present
        let contentData = null;
        if (contentInfo) {
          contentData = {
            type: contentInfo.type,
            mongoId: contentInfo.mongoId,
            title: contentInfo.title
          };
        }

        // Attach user info for the service to use
        if (authUser && !req.user) {
          req.user = authUser;
        }

        // Track the page view
        await analyticsService.trackPageView(req, {
          userId,
          userAgent,
          referer,
          path: req.path,
          pageType,
          content: contentData,
          latencyMs
        });

      } catch (error) {
        // Log error but don't affect the response
        logger.error('Failed to track analytics', { 
          error: error.message,
          path: req.path 
        });
      }
    });

    next();
  };
};

/**
 * Middleware to track specific content views
 * Use this for frontend SPA tracking via API call
 */
const trackContentView = () => {
  return async (req, res, next) => {
    if (!isAnalyticsEnabled()) {
      return next();
    }

    // This middleware expects POST /api/analytics/track with body:
    // { contentType: 'post'|'category', contentId: 'mongoId', title: 'optional' }
    if (req.method !== 'POST' || !req.body) {
      return next();
    }

    try {
      const { contentType, contentId, title } = req.body;
      const userId = req.user?.id || req.user?._id?.toString() || null;
      const userAgent = req.get('User-Agent') || '';
      const referer = req.get('Referer') || '';

      // Register content if not exists
      if (contentType && contentId) {
        await analyticsService.registerContent(contentType, contentId, title);
      }

      // Track page view with content reference
      await analyticsService.trackPageView(req, {
        userId,
        userAgent,
        referer,
        path: req.path,
        pageType: contentType === 'post' ? 'post_detail' : 'category_detail',
        content: contentType && contentId ? { type: contentType, mongoId: contentId, title } : null
      });

      req.analyticsTracked = true;
    } catch (error) {
      logger.error('Failed to track content view', { error: error.message });
    }

    next();
  };
};

/**
 * Session tracking middleware
 * Generates and maintains session tokens
 */
const sessionMiddleware = () => {
  return (req, res, next) => {
    // Get existing session token from cookie or header
    let sessionToken = req.cookies?.analytics_session || 
                       req.headers['x-analytics-session'];

    // Store on request for later use
    req.analyticsSessionToken = sessionToken || null;

    next();
  };
};

/**
 * Error tracking middleware
 * Track errors for analytics (separate from page views)
 */
const errorTrackingMiddleware = () => {
  return (err, req, res, next) => {
    if (!isAnalyticsEnabled()) {
      return next(err);
    }

    // Log error to analytics asynchronously
    const userId = req.user?.id || req.user?._id?.toString() || null;
    
    // We could add error tracking table later
    logger.error('Request error', {
      path: req.path,
      method: req.method,
      userId,
      error: err.message,
      stack: err.stack
    });

    next(err);
  };
};

module.exports = {
  analyticsMiddleware,
  trackContentView,
  sessionMiddleware,
  errorTrackingMiddleware
};

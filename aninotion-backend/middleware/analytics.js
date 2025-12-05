/**
 * Analytics Middleware (Redesigned)
 * Tracks page views using normalized PostgreSQL schema
 * Designed for dashboard-ready, meaningful analytics data
 * 
 * IMPORTANT: Only tracks meaningful "page views":
 * - Viewing a specific post (GET /api/posts/:id)
 * - Viewing a specific category page (GET /api/posts/category/:id)
 * - Auth events (login, register)
 * 
 * Does NOT track:
 * - List fetches (GET /api/posts, GET /api/categories)
 * - Search/filter requests
 * - API utility endpoints
 */

const analyticsService = require('../services/analyticsService');
const { isAnalyticsEnabled } = require('../config/analyticsDatabase');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');

// Paths to completely exclude from analytics tracking
const EXCLUDED_PATHS = [
  '/health',
  '/favicon.ico',
  '/robots.txt',
  '/api/analytics',
  '/api/v1/analytics',
  '/api/auth/me',        // Auth check - not a page view
  '/api/auth/verify',    // Token verification
  '/api/users/me',       // User profile fetch
  '/api/sitemap',
  '/api/rss'
];

// Page tracking patterns - these track as PAGE views (not content)
const PAGE_PATTERNS = {
  'home': /^\/api\/posts\/?$/i,                              // Home/All posts
  'trending': /^\/api\/recommendations\/trending/i,          // Trending page
  'recommendations': /^\/api\/recommendations\/personalized/i, // Personalized recommendations
  'similar_posts': /^\/api\/recommendations\/similar/i,      // Similar posts page
  'saved_posts': /^\/api\/posts\/saved/i,                    // Saved posts
  'my_posts': /^\/api\/posts\/my-posts/i,                    // My posts
  'anime_search': /^\/api\/anime\/search/i,                  // Anime search
  'anime_trending': /^\/api\/anime\/trending/i,              // Anime trending
};

// Content tracking patterns - these track specific content
const CONTENT_PATTERNS = {
  'post': /^\/api\/posts\/([a-f0-9]{24})$/i,                 // Single post view
  'category': /^\/api\/posts\/category\/([a-f0-9]{24})/i,    // Category page view
};

// Methods to exclude from tracking
const EXCLUDED_METHODS = ['OPTIONS', 'HEAD', 'PUT', 'DELETE', 'PATCH'];

/**
 * Determine what type of tracking this request needs
 * Returns: { type: 'page'|'post'|'category'|'none', name: string, id?: string }
 */
const getTrackingType = (req) => {
  const path = req.path;
  const method = req.method;
  
  // Skip excluded methods (except POST for auth)
  if (EXCLUDED_METHODS.includes(method)) {
    return { type: 'none' };
  }
  
  // Handle POST requests - only track auth events
  if (method === 'POST') {
    if (path.includes('/auth/login') || path.includes('/auth/google')) {
      return { type: 'page', name: 'login', displayName: 'Login' };
    }
    if (path.includes('/auth/register')) {
      return { type: 'page', name: 'register', displayName: 'Register' };
    }
    return { type: 'none' };
  }
  
  // Check for content patterns (post, category)
  for (const [type, pattern] of Object.entries(CONTENT_PATTERNS)) {
    const match = path.match(pattern);
    if (match) {
      return { type, id: match[1] };
    }
  }
  
  // Check for page patterns
  for (const [name, pattern] of Object.entries(PAGE_PATTERNS)) {
    if (pattern.test(path)) {
      const displayName = name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { type: 'page', name, displayName };
    }
  }
  
  return { type: 'none' };
};

/**
 * Check if this request should be tracked
 */
const shouldTrack = (req) => {
  const path = req.path;
  
  // Skip excluded paths
  for (const excluded of EXCLUDED_PATHS) {
    if (path === excluded || path.startsWith(excluded + '/')) {
      return false;
    }
  }
  
  const trackingType = getTrackingType(req);
  return trackingType.type !== 'none';
};

/**
 * Extract content information from request path
 * Returns { type, mongoId, title } if content is being accessed
 */
const extractContentFromRequest = (req, responseBody) => {
  const path = req.path.toLowerCase();

  // Single post view: /api/posts/:id
  const postMatch = path.match(/\/posts\/([a-f0-9]{24})$/i);
  if (postMatch) {
    return {
      type: 'post',
      mongoId: postMatch[1],
      title: responseBody?.title || responseBody?.post?.title || null
    };
  }

  // Category page view: /api/posts/category/:categoryId
  const categoryMatch = path.match(/\/posts\/category\/([a-f0-9]{24})/i);
  if (categoryMatch) {
    return {
      type: 'category',
      mongoId: categoryMatch[1],
      title: null // Category name not available here
    };
  }

  return null;
};

/**
 * Determine page type from request
 */
const determinePageType = (req) => {
  const path = req.path.toLowerCase();

  if (path.includes('/auth/login') || path.includes('/auth/google')) return 'login';
  if (path.includes('/auth/register')) return 'register';
  if (path.match(/\/posts\/[a-f0-9]{24}$/i)) return 'post_detail';
  if (path.match(/\/posts\/category\/[a-f0-9]{24}/i)) return 'category_page';

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
 * Tracks page views, category views, and post views
 */
const analyticsMiddleware = () => {
  return async (req, res, next) => {
    // Skip if analytics is not enabled
    if (!isAnalyticsEnabled()) {
      return next();
    }

    // Check if we should track this request
    if (!shouldTrack(req)) {
      return next();
    }

    // Try to extract user info from JWT token
    const tokenUser = extractUserFromToken(req);
    if (tokenUser) {
      req.analyticsUser = tokenUser;
    }

    const startTime = Date.now();
    const trackingInfo = getTrackingType(req);

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

        // Track based on type
        switch (trackingInfo.type) {
          case 'page':
            // Track page view (home, trending, recommendations, etc.)
            await analyticsService.trackPageStats(trackingInfo.name, trackingInfo.displayName);
            logger.debug('Tracked page view', { page: trackingInfo.name });
            break;

          case 'category':
            // Track category view - extract category name from response if available
            const categoryName = responseBody?.posts?.[0]?.category?.name || 
                                 responseBody?.category?.name || 
                                 null;
            await analyticsService.trackCategoryStats(trackingInfo.id, categoryName);
            logger.debug('Tracked category view', { categoryId: trackingInfo.id, categoryName });
            break;

          case 'post':
            // Track post view - extract post info from response
            const postTitle = responseBody?.title || responseBody?.post?.title || null;
            const postCategoryId = responseBody?.category?._id || responseBody?.post?.category?._id || null;
            const postCategoryName = responseBody?.category?.name || responseBody?.post?.category?.name || null;
            await analyticsService.trackPostStats(trackingInfo.id, postTitle, postCategoryId, postCategoryName);
            logger.debug('Tracked post view', { postId: trackingInfo.id, postTitle });
            break;
        }

        // Also track in realtime activity for live dashboard
        const authUser = req.user || req.analyticsUser;
        const userId = authUser?.id || authUser?._id?.toString() || null;
        const userAgent = req.get('User-Agent') || '';
        const referer = req.get('Referer') || '';
        const deviceInfo = analyticsService.parseUserAgent(userAgent);
        
        // Get or create visitor for realtime tracking
        const visitorId = await analyticsService.getOrCreateVisitor({
          userId,
          username: authUser?.username,
          email: authUser?.email,
          ipAddress: analyticsService.extractClientIP(req),
          userAgent
        });

        if (visitorId) {
          const contentTitle = trackingInfo.type === 'post' ? (responseBody?.title || responseBody?.post?.title) :
                               trackingInfo.type === 'category' ? (responseBody?.posts?.[0]?.category?.name) :
                               trackingInfo.displayName || trackingInfo.name;
          
          // Log realtime activity for live dashboard
          await analyticsService.logRealtimeActivity({
            visitorId,
            activityType: 'pageview',
            pageType: trackingInfo.type,
            path: req.path,
            contentTitle,
            visitorName: authUser?.username || 'Anonymous',
            isAuthenticated: !!userId,
            deviceType: deviceInfo.deviceType
          });

          // Also track to visits table for Top Content, Traffic Sources, Device Breakdown
          const contentInfo = trackingInfo.type === 'post' || trackingInfo.type === 'category' 
            ? { type: trackingInfo.type, mongoId: trackingInfo.id, title: contentTitle }
            : null;
          
          await analyticsService.trackPageView(req, {
            userId,
            userAgent,
            referer,
            path: req.path,
            pageType: trackingInfo.type === 'page' ? trackingInfo.name : 
                      trackingInfo.type === 'post' ? 'post_detail' : 
                      trackingInfo.type === 'category' ? 'category_page' : 'other',
            content: contentInfo,
            latencyMs
          });
        }

      } catch (error) {
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

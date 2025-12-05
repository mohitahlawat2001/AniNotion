/**
 * Analytics Service
 * Redesigned for meaningful analytics with normalized tables
 */

const { query, getClient, isAnalyticsEnabled } = require('../config/analyticsDatabase');
const logger = require('../config/logger');
const crypto = require('crypto');

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse User-Agent string to extract device info
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };

  const result = { deviceType: 'desktop', browser: 'unknown', os: 'unknown' };

  // Device type
  if (/mobile/i.test(userAgent)) result.deviceType = 'mobile';
  else if (/tablet|ipad/i.test(userAgent)) result.deviceType = 'tablet';
  else if (/bot|crawler|spider/i.test(userAgent)) result.deviceType = 'bot';

  // Browser
  if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) result.browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) result.browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) result.browser = 'Safari';
  else if (/edge|edg/i.test(userAgent)) result.browser = 'Edge';

  // OS
  if (/windows/i.test(userAgent)) result.os = 'Windows';
  else if (/macintosh|mac os/i.test(userAgent)) result.os = 'MacOS';
  else if (/linux/i.test(userAgent)) result.os = 'Linux';
  else if (/android/i.test(userAgent)) result.os = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) result.os = 'iOS';

  return result;
};

/**
 * Generate hash for anonymous visitor identification
 */
const generateVisitorHash = (ipAddress, userAgent) => {
  return crypto.createHash('sha256')
    .update(`${ipAddress}:${userAgent}`)
    .digest('hex')
    .substring(0, 32);
};

/**
 * Generate session token
 */
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Extract client IP from request
 */
const extractClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

// ============================================
// VISITOR MANAGEMENT
// ============================================

/**
 * Get or create a visitor record
 */
const getOrCreateVisitor = async (data) => {
  if (!isAnalyticsEnabled()) return null;

  const { userId, username, email, ipAddress, userAgent } = data;
  const deviceInfo = parseUserAgent(userAgent);
  const userAgentHash = crypto.createHash('md5').update(userAgent || '').digest('hex');

  try {
    // If authenticated user
    if (userId) {
      const result = await query(`
        INSERT INTO visitors (user_id, is_authenticated, username, email, ip_address, user_agent_hash, device_type, browser, os, last_seen)
        VALUES ($1, true, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          username = COALESCE($2, visitors.username),
          email = COALESCE($3, visitors.email),
          ip_address = $4,
          last_seen = NOW(),
          total_visits = visitors.total_visits + 1
        RETURNING id
      `, [userId, username, email, ipAddress, userAgentHash, deviceInfo.deviceType, deviceInfo.browser, deviceInfo.os]);
      
      return result.rows[0]?.id;
    }

    // Anonymous visitor
    const visitorHash = generateVisitorHash(ipAddress, userAgent);
    const result = await query(`
      INSERT INTO visitors (visitor_hash, is_authenticated, ip_address, user_agent_hash, device_type, browser, os, last_seen)
      VALUES ($1, false, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (visitor_hash) DO UPDATE SET
        last_seen = NOW(),
        total_visits = visitors.total_visits + 1
      RETURNING id
    `, [visitorHash, ipAddress, userAgentHash, deviceInfo.deviceType, deviceInfo.browser, deviceInfo.os]);

    return result.rows[0]?.id;
  } catch (error) {
    logger.error('Failed to get/create visitor', { error: error.message });
    return null;
  }
};

// ============================================
// CONTENT REGISTRY
// ============================================

/**
 * Register content (post or category) for tracking
 */
const registerContent = async (contentType, mongoId, title = null) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      INSERT INTO content_registry (content_type, mongo_id, title)
      VALUES ($1, $2, $3)
      ON CONFLICT (content_type, mongo_id) DO UPDATE SET
        title = COALESCE($3, content_registry.title),
        last_viewed_at = NOW()
      RETURNING id
    `, [contentType, mongoId, title]);

    return result.rows[0]?.id;
  } catch (error) {
    logger.error('Failed to register content', { error: error.message });
    return null;
  }
};

/**
 * Get content registry ID by content type and MongoDB ID
 */
const getContentId = async (contentType, mongoId) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      SELECT id FROM content_registry WHERE content_type = $1 AND mongo_id = $2
    `, [contentType, mongoId]);

    return result.rows[0]?.id;
  } catch (error) {
    logger.error('Failed to get content ID', { error: error.message });
    return null;
  }
};

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Create or update a session
 */
const getOrCreateSession = async (sessionToken, visitorId, entryPage = null) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    // Try to find existing active session
    const existing = await query(`
      SELECT id, page_views FROM sessions 
      WHERE session_token = $1 
      AND last_activity_at > NOW() - INTERVAL '30 minutes'
    `, [sessionToken]);

    if (existing.rows.length > 0) {
      // Update existing session
      const currentPageViews = existing.rows[0].page_views;
      await query(`
        UPDATE sessions SET 
          last_activity_at = NOW(),
          duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
          page_views = page_views + 1,
          exit_page = $1,
          is_bounce = CASE WHEN $2 > 0 THEN false ELSE is_bounce END
        WHERE id = $3
      `, [entryPage, currentPageViews, existing.rows[0].id]);
      
      return existing.rows[0].id;
    }

    // Create new session
    const result = await query(`
      INSERT INTO sessions (visitor_id, session_token, entry_page, exit_page)
      VALUES ($1, $2, $3, $3)
      RETURNING id
    `, [visitorId, sessionToken, entryPage]);

    // Update visitor session count
    await query(`
      UPDATE visitors SET total_sessions = total_sessions + 1 WHERE id = $1
    `, [visitorId]);

    return result.rows[0]?.id;
  } catch (error) {
    logger.error('Failed to get/create session', { error: error.message });
    return null;
  }
};

// ============================================
// VISIT TRACKING
// ============================================

/**
 * Track a content visit
 */
const trackVisit = async (data) => {
  if (!isAnalyticsEnabled()) return null;

  const { visitorId, contentId, sessionId, path, pageType, referrerType, latencyMs } = data;

  try {
    const result = await query(`
      INSERT INTO visits (visitor_id, content_id, session_id, path, page_type, referrer_type, latency_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [visitorId, contentId, sessionId, path, pageType, referrerType, latencyMs]);

    // Update content stats
    if (contentId) {
      await query(`
        UPDATE content_registry SET 
          total_views = total_views + 1,
          last_viewed_at = NOW()
        WHERE id = $1
      `, [contentId]);
    }

    return result.rows[0]?.id;
  } catch (error) {
    logger.error('Failed to track visit', { error: error.message });
    return null;
  }
};

// ============================================
// REAL-TIME ACTIVITY
// ============================================

/**
 * Log real-time activity for dashboard
 */
const logRealtimeActivity = async (data) => {
  if (!isAnalyticsEnabled()) return null;

  const { visitorId, activityType, pageType, path, isAuthenticated, deviceType, contentTitle, visitorName } = data;

  try {
    await query(`
      INSERT INTO realtime_activity (visitor_id, activity_type, page_type, path, content_title, visitor_name, is_authenticated, device_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [visitorId, activityType, pageType, path, contentTitle || null, visitorName || null, isAuthenticated, deviceType]);

    return true;
  } catch (error) {
    logger.error('Failed to log realtime activity', { error: error.message });
    return false;
  }
};

// ============================================
// PAGE/CATEGORY/POST STATS TRACKING
// ============================================

/**
 * Track a page view (home, trending, recommendations, similar posts, etc.)
 */
const trackPageStats = async (pageName, displayName = null) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      INSERT INTO page_stats (page_name, display_name, total_views, last_viewed_at)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (page_name) DO UPDATE SET
        display_name = COALESCE($2, page_stats.display_name),
        total_views = page_stats.total_views + 1,
        last_viewed_at = NOW()
      RETURNING id, total_views
    `, [pageName, displayName || pageName]);

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to track page stats', { error: error.message, pageName });
    return null;
  }
};

/**
 * Track a category view
 */
const trackCategoryStats = async (categoryId, categoryName = null) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      INSERT INTO category_stats (category_id, category_name, total_views, last_viewed_at)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (category_id) DO UPDATE SET
        category_name = COALESCE($2, category_stats.category_name),
        total_views = category_stats.total_views + 1,
        last_viewed_at = NOW()
      RETURNING id, total_views
    `, [categoryId, categoryName]);

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to track category stats', { error: error.message, categoryId });
    return null;
  }
};

/**
 * Track a post view
 */
const trackPostStats = async (postId, postTitle = null, categoryId = null, categoryName = null) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      INSERT INTO post_stats (post_id, post_title, category_id, category_name, total_views, last_viewed_at)
      VALUES ($1, $2, $3, $4, 1, NOW())
      ON CONFLICT (post_id) DO UPDATE SET
        post_title = COALESCE($2, post_stats.post_title),
        category_id = COALESCE($3, post_stats.category_id),
        category_name = COALESCE($4, post_stats.category_name),
        total_views = post_stats.total_views + 1,
        last_viewed_at = NOW()
      RETURNING id, total_views
    `, [postId, postTitle, categoryId, categoryName]);

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to track post stats', { error: error.message, postId });
    return null;
  }
};

/**
 * Get page stats for dashboard
 */
const getPageStats = async (limit = 20) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      SELECT 
        page_name,
        display_name,
        total_views,
        first_viewed_at,
        last_viewed_at
      FROM page_stats
      ORDER BY total_views DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get page stats', { error: error.message });
    return null;
  }
};

/**
 * Get category stats for dashboard
 */
const getCategoryStats = async (limit = 20) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      SELECT 
        category_id,
        category_name,
        total_views,
        first_viewed_at,
        last_viewed_at
      FROM category_stats
      ORDER BY total_views DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get category stats', { error: error.message });
    return null;
  }
};

/**
 * Get post stats for dashboard
 */
const getPostStats = async (limit = 20) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      SELECT 
        post_id,
        post_title,
        category_id,
        category_name,
        total_views,
        first_viewed_at,
        last_viewed_at
      FROM post_stats
      ORDER BY total_views DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get post stats', { error: error.message });
    return null;
  }
};

// ============================================
// HIGH-LEVEL TRACKING FUNCTION
// ============================================

/**
 * Main tracking function - call this from middleware
 */
const trackPageView = async (req, data = {}) => {
  if (!isAnalyticsEnabled()) {
    logger.debug('Analytics not enabled, skipping tracking');
    return null;
  }

  try {
    const { userId, userAgent, referer, path, pageType, content, latencyMs } = data;
    const ipAddress = extractClientIP(req);

    logger.debug('Tracking page view', { path, pageType, userId: userId || 'anonymous', ip: ipAddress });

    // 1. Get or create visitor
    const visitorId = await getOrCreateVisitor({
      userId,
      username: req.user?.username,
      email: req.user?.email,
      ipAddress,
      userAgent
    });

    if (!visitorId) {
      logger.warn('Failed to get/create visitor, skipping tracking');
      return null;
    }

    logger.debug('Visitor ID obtained', { visitorId });

    // 2. Register content if provided
    let contentId = null;
    if (content && content.mongoId) {
      contentId = await registerContent(content.type, content.mongoId, content.title);
      logger.debug('Content registered', { contentId, type: content.type });
    }

    // 3. Get or create session
    const sessionToken = req.analyticsSessionToken || generateSessionToken();
    const sessionId = await getOrCreateSession(sessionToken, visitorId, path);

    logger.debug('Session obtained', { sessionId });

    // 4. Track the visit
    const referrerType = determineReferrerType(referer);
    await trackVisit({
      visitorId,
      contentId,
      sessionId,
      path,
      pageType,
      referrerType,
      latencyMs
    });

    // 5. Log real-time activity
    const deviceInfo = parseUserAgent(userAgent);
    const visitorName = req.user?.username || 'Anonymous';
    await logRealtimeActivity({
      visitorId,
      activityType: 'pageview',
      pageType,
      path,
      contentTitle: content?.title || null,
      visitorName,
      isAuthenticated: !!userId,
      deviceType: deviceInfo.deviceType
    });

    logger.debug('Page view tracked successfully', { visitorId, sessionId, path });
    return { visitorId, contentId, sessionId };
  } catch (error) {
    logger.error('Failed to track page view', { error: error.message, stack: error.stack });
    return null;
  }
};

/**
 * Determine referrer type from URL
 */
const determineReferrerType = (referer) => {
  if (!referer) return 'direct';
  
  const host = process.env.FRONTEND_URL || 'localhost';
  if (referer.includes(host)) return 'internal';
  if (/google|bing|yahoo|duckduckgo/i.test(referer)) return 'search';
  if (/facebook|twitter|linkedin|instagram|reddit/i.test(referer)) return 'social';
  return 'external';
};

// ============================================
// DASHBOARD QUERIES
// ============================================

/**
 * Get real-time active visitors
 */
const getRealtimeVisitors = async (minutes = 5) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    // First, cleanup old realtime activity (older than 30 minutes)
    await cleanupRealtimeData(30);
    
    // Also expire old sessions (inactive for more than 30 minutes)
    await expireInactiveSessions(30);

    const result = await query(`
      SELECT 
        ra.activity_type,
        ra.content_title,
        ra.visitor_name,
        ra.device_type,
        ra.activity_at,
        v.is_authenticated
      FROM realtime_activity ra
      LEFT JOIN visitors v ON ra.visitor_id = v.id
      WHERE ra.activity_at > NOW() - INTERVAL '${minutes} minutes'
      ORDER BY ra.activity_at DESC
      LIMIT 50
    `);

    const countResult = await query(`
      SELECT 
        COUNT(DISTINCT visitor_id) as active_visitors,
        COUNT(*) as total_activities
      FROM realtime_activity
      WHERE activity_at > NOW() - INTERVAL '${minutes} minutes'
    `);

    return {
      activities: result.rows,
      counts: countResult.rows[0]
    };
  } catch (error) {
    logger.error('Failed to get realtime visitors', { error: error.message });
    return null;
  }
};

/**
 * Get today's summary for dashboard
 */
const getTodaySummary = async () => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if we have pre-aggregated data
    const cached = await query(`SELECT * FROM daily_stats WHERE date = $1`, [today]);
    
    if (cached.rows.length > 0) {
      return cached.rows[0];
    }

    // Calculate live
    const visitorStats = await query(`
      SELECT 
        COUNT(DISTINCT v.id) as total_visitors,
        COUNT(DISTINCT CASE WHEN v.is_authenticated THEN v.id END) as authenticated_visitors,
        COUNT(DISTINCT CASE WHEN NOT v.is_authenticated THEN v.id END) as anonymous_visitors
      FROM visits vt
      JOIN visitors v ON vt.visitor_id = v.id
      WHERE DATE(vt.visited_at) = $1
    `, [today]);

    const sessionStats = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(duration_seconds) as avg_session_duration,
        COUNT(CASE WHEN is_bounce THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as bounce_rate
      FROM sessions
      WHERE DATE(started_at) = $1
    `, [today]);

    const visitStats = await query(`
      SELECT COUNT(*) as total_page_views
      FROM visits
      WHERE DATE(visited_at) = $1
    `, [today]);

    return {
      stat_date: today,
      ...visitorStats.rows[0],
      ...sessionStats.rows[0],
      ...visitStats.rows[0]
    };
  } catch (error) {
    logger.error('Failed to get today summary', { error: error.message });
    return null;
  }
};

/**
 * Get top content for dashboard
 */
const getTopContent = async (limit = 10, contentType = null) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    let sql = `
      SELECT 
        cr.content_type,
        cr.mongo_id,
        cr.title,
        cr.total_views as views,
        COUNT(DISTINCT v.visitor_id) as unique_visitors
      FROM content_registry cr
      LEFT JOIN visits v ON cr.id = v.content_id
        AND v.visited_at > NOW() - INTERVAL '7 days'
    `;
    
    const params = [limit];
    if (contentType) {
      sql += ` WHERE cr.content_type = $2`;
      params.push(contentType);
    }
    
    sql += ` GROUP BY cr.id ORDER BY views DESC LIMIT $1`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    logger.error('Failed to get top content', { error: error.message });
    return null;
  }
};

/**
 * Get visitor activity history
 */
const getVisitorActivity = async (visitorId, limit = 50) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      SELECT 
        v.visited_at,
        v.path,
        v.page_type,
        cr.content_type,
        cr.title,
        cr.mongo_id
      FROM visits v
      LEFT JOIN content_registry cr ON v.content_id = cr.id
      WHERE v.visitor_id = $1
      ORDER BY v.visited_at DESC
      LIMIT $2
    `, [visitorId, limit]);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get visitor activity', { error: error.message });
    return null;
  }
};

/**
 * Get traffic sources breakdown
 */
const getTrafficSources = async (days = 7) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      SELECT 
        referrer_type,
        COUNT(*) as visits
      FROM visits
      WHERE visited_at > NOW() - INTERVAL '${days} days'
      GROUP BY referrer_type
      ORDER BY visits DESC
    `);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get traffic sources', { error: error.message });
    return null;
  }
};

/**
 * Get device breakdown
 */
const getDeviceBreakdown = async (days = 7) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      SELECT 
        v.device_type,
        COUNT(DISTINCT vt.id) as visits,
        COUNT(DISTINCT v.id) as visitors
      FROM visits vt
      JOIN visitors v ON vt.visitor_id = v.id
      WHERE vt.visited_at > NOW() - INTERVAL '${days} days'
      GROUP BY v.device_type
      ORDER BY visits DESC
    `);

    return result.rows;
  } catch (error) {
    logger.error('Failed to get device breakdown', { error: error.message });
    return null;
  }
};

/**
 * Get hourly breakdown for charts
 */
const getHourlyBreakdown = async (date = null) => {
  if (!isAnalyticsEnabled()) return null;

  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const result = await query(`
      SELECT 
        EXTRACT(HOUR FROM visited_at) as hour,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM visits
      WHERE DATE(visited_at) = $1
      GROUP BY EXTRACT(HOUR FROM visited_at)
      ORDER BY hour
    `, [targetDate]);

    // Fill in missing hours
    const hourly = Array(24).fill(0).map((_, i) => ({ hour: i, visits: 0, visitors: 0 }));
    result.rows.forEach(row => {
      hourly[row.hour] = { hour: row.hour, visits: parseInt(row.visits), visitors: parseInt(row.visitors) };
    });

    return hourly;
  } catch (error) {
    logger.error('Failed to get hourly breakdown', { error: error.message });
    return null;
  }
};

// ============================================
// AGGREGATION (for cron jobs)
// ============================================

/**
 * Aggregate daily stats
 */
const aggregateDailyStats = async (date = null) => {
  if (!isAnalyticsEnabled()) return false;

  const targetDate = date || new Date(Date.now() - 86400000).toISOString().split('T')[0];

  try {
    const client = await getClient();
    await client.query('BEGIN');

    // Get visitor stats
    const visitors = await client.query(`
      SELECT 
        COUNT(DISTINCT v.id) as total_visitors,
        COUNT(DISTINCT CASE WHEN v.first_seen::DATE = $1 THEN v.id END) as new_visitors,
        COUNT(DISTINCT CASE WHEN v.is_authenticated THEN v.id END) as authenticated_visitors,
        COUNT(DISTINCT CASE WHEN NOT v.is_authenticated THEN v.id END) as anonymous_visitors
      FROM visits vt
      JOIN visitors v ON vt.visitor_id = v.id
      WHERE DATE(vt.visited_at) = $1
    `, [targetDate]);

    // Get session stats
    const sessions = await client.query(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(duration_seconds) as avg_duration,
        COUNT(CASE WHEN is_bounce THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as bounce_rate
      FROM sessions WHERE DATE(started_at) = $1
    `, [targetDate]);

    // Get visit count
    const visits = await client.query(`
      SELECT COUNT(*) as total FROM visits WHERE DATE(visited_at) = $1
    `, [targetDate]);

    // Get traffic sources
    const traffic = await client.query(`
      SELECT referrer_type, COUNT(*) as count
      FROM visits WHERE DATE(visited_at) = $1
      GROUP BY referrer_type
    `, [targetDate]);

    // Get device breakdown
    const devices = await client.query(`
      SELECT v.device_type, COUNT(*) as count
      FROM visits vt JOIN visitors v ON vt.visitor_id = v.id
      WHERE DATE(vt.visited_at) = $1
      GROUP BY v.device_type
    `, [targetDate]);

    // Get hourly breakdown
    const hourly = await client.query(`
      SELECT EXTRACT(HOUR FROM visited_at) as hour, COUNT(*) as visits
      FROM visits WHERE DATE(visited_at) = $1
      GROUP BY hour ORDER BY hour
    `, [targetDate]);

    // Insert or update daily stats
    await client.query(`
      INSERT INTO daily_stats (
        date, unique_visitors, new_visitors, authenticated_visitors, anonymous_visitors,
        total_sessions, avg_session_duration_seconds, bounce_rate, total_page_views,
        traffic_sources, device_breakdown, hourly_pageviews
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (date) DO UPDATE SET
        unique_visitors = $2, new_visitors = $3, authenticated_visitors = $4, anonymous_visitors = $5,
        total_sessions = $6, avg_session_duration_seconds = $7, bounce_rate = $8, total_page_views = $9,
        traffic_sources = $10, device_breakdown = $11, 
        hourly_pageviews = $12, updated_at = NOW()
    `, [
      targetDate,
      visitors.rows[0]?.total_visitors || 0,
      visitors.rows[0]?.new_visitors || 0,
      visitors.rows[0]?.authenticated_visitors || 0,
      visitors.rows[0]?.anonymous_visitors || 0,
      sessions.rows[0]?.total_sessions || 0,
      sessions.rows[0]?.avg_duration || 0,
      sessions.rows[0]?.bounce_rate || 0,
      visits.rows[0]?.total || 0,
      JSON.stringify(Object.fromEntries(traffic.rows.map(r => [r.referrer_type || 'unknown', parseInt(r.count)]))),
      JSON.stringify(Object.fromEntries(devices.rows.map(r => [r.device_type || 'unknown', parseInt(r.count)]))),
      JSON.stringify(hourly.rows.map(r => parseInt(r.visits)))
    ]);

    await client.query('COMMIT');
    client.release();

    logger.info('Daily stats aggregated', { date: targetDate });
    return true;
  } catch (error) {
    logger.error('Failed to aggregate daily stats', { error: error.message });
    return false;
  }
};

/**
 * Cleanup old realtime data
 */
const cleanupRealtimeData = async (minutes = 30) => {
  if (!isAnalyticsEnabled()) return;

  try {
    const result = await query(`DELETE FROM realtime_activity WHERE activity_at < NOW() - INTERVAL '${minutes} minutes'`);
    if (result.rowCount > 0) {
      logger.debug('Cleaned up old realtime activity', { deletedRows: result.rowCount });
    }
  } catch (error) {
    logger.error('Failed to cleanup realtime data', { error: error.message });
  }
};

/**
 * Expire inactive sessions (mark as ended)
 */
const expireInactiveSessions = async (inactivityMinutes = 30) => {
  if (!isAnalyticsEnabled()) return;

  try {
    const result = await query(`
      UPDATE sessions 
      SET 
        ended_at = last_activity_at,
        duration_seconds = EXTRACT(EPOCH FROM (last_activity_at - started_at))::INTEGER
      WHERE 
        ended_at IS NULL 
        AND last_activity_at < NOW() - INTERVAL '${inactivityMinutes} minutes'
    `);
    if (result.rowCount > 0) {
      logger.debug('Expired inactive sessions', { expiredCount: result.rowCount });
    }
  } catch (error) {
    logger.error('Failed to expire inactive sessions', { error: error.message });
  }
};

/**
 * Cleanup old visit data (retention policy)
 */
const cleanupOldData = async (retentionDays = 90) => {
  if (!isAnalyticsEnabled()) return null;

  try {
    const result = await query(`
      DELETE FROM visits WHERE visited_at < NOW() - INTERVAL '${retentionDays} days'
    `);

    logger.info('Cleaned up old analytics data', { deletedRows: result.rowCount, retentionDays });
    return result.rowCount;
  } catch (error) {
    logger.error('Failed to cleanup old data', { error: error.message });
    return null;
  }
};

module.exports = {
  // Utilities
  parseUserAgent,
  generateSessionToken,
  extractClientIP,
  generateVisitorHash,
  
  // Core tracking
  getOrCreateVisitor,
  registerContent,
  getContentId,
  getOrCreateSession,
  trackVisit,
  trackPageView,
  logRealtimeActivity,
  
  // Page/Category/Post stats tracking
  trackPageStats,
  trackCategoryStats,
  trackPostStats,
  getPageStats,
  getCategoryStats,
  getPostStats,
  
  // Dashboard queries
  getRealtimeVisitors,
  getTodaySummary,
  getTopContent,
  getVisitorActivity,
  getTrafficSources,
  getDeviceBreakdown,
  getHourlyBreakdown,
  
  // Aggregation & Cleanup
  aggregateDailyStats,
  cleanupRealtimeData,
  cleanupOldData,
  expireInactiveSessions
};
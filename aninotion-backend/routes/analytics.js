/**
 * Analytics API Routes (Redesigned)
 * Endpoints for dashboard-ready analytics data
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const { isAnalyticsEnabled } = require('../config/analyticsDatabase');
const { requireAuth, requireRole } = require('../middleware/auth');
const { trackContentView } = require('../middleware/analytics');
const logger = require('../config/logger');

/**
 * Check if analytics is enabled middleware
 */
const checkAnalyticsEnabled = (req, res, next) => {
  if (!isAnalyticsEnabled()) {
    return res.status(503).json({
      error: 'Analytics service unavailable',
      message: 'Analytics database is not configured'
    });
  }
  next();
};

/**
 * @route   GET /api/analytics/status
 * @desc    Check analytics service status
 * @access  Admin
 */
router.get('/status', requireAuth, requireRole('admin'), (req, res) => {
  res.json({
    enabled: isAnalyticsEnabled(),
    message: isAnalyticsEnabled() 
      ? 'Analytics service is running with normalized schema'
      : 'Analytics service is not configured (ANALYTICS_DATABASE_URL missing)'
  });
});

/**
 * @route   GET /api/analytics/debug
 * @desc    Debug endpoint to check database tables
 * @access  Admin
 */
router.get('/debug', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { query } = require('../config/analyticsDatabase');
    
    // Check all tables
    const tables = ['visitors', 'content_registry', 'sessions', 'visits', 'daily_stats', 'content_daily_stats', 'realtime_activity'];
    const counts = {};
    
    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count);
      } catch (e) {
        counts[table] = `ERROR: ${e.message}`;
      }
    }
    
    // Get sample recent data
    let recentVisitors = [];
    let recentVisits = [];
    let recentActivity = [];
    
    try {
      const visitorsResult = await query(`SELECT id, user_id, visitor_hash, is_authenticated, device_type, last_seen FROM visitors ORDER BY last_seen DESC LIMIT 5`);
      recentVisitors = visitorsResult.rows;
    } catch (e) {
      recentVisitors = [`ERROR: ${e.message}`];
    }
    
    try {
      const visitsResult = await query(`SELECT id, visitor_id, path, page_type, visited_at FROM visits ORDER BY visited_at DESC LIMIT 5`);
      recentVisits = visitsResult.rows;
    } catch (e) {
      recentVisits = [`ERROR: ${e.message}`];
    }
    
    try {
      const activityResult = await query(`SELECT id, visitor_id, activity_type, page_type, path, activity_at FROM realtime_activity ORDER BY activity_at DESC LIMIT 5`);
      recentActivity = activityResult.rows;
    } catch (e) {
      recentActivity = [`ERROR: ${e.message}`];
    }
    
    res.json({
      status: 'connected',
      tableCounts: counts,
      recentVisitors,
      recentVisits,
      recentActivity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Analytics debug error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/analytics/reset
 * @desc    Reset analytics tables (drop and recreate)
 * @access  Admin
 */
router.post('/reset', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { query } = require('../config/analyticsDatabase');
    const { initializeAnalyticsDB } = require('../config/analyticsDatabase');
    
    logger.warn('Resetting analytics tables...');
    
    // Drop all tables
    await query(`DROP TABLE IF EXISTS realtime_activity CASCADE`);
    await query(`DROP TABLE IF EXISTS content_daily_stats CASCADE`);
    await query(`DROP TABLE IF EXISTS daily_stats CASCADE`);
    await query(`DROP TABLE IF EXISTS visits CASCADE`);
    await query(`DROP TABLE IF EXISTS sessions CASCADE`);
    await query(`DROP TABLE IF EXISTS content_registry CASCADE`);
    await query(`DROP TABLE IF EXISTS visitors CASCADE`);
    
    // Reinitialize
    const success = await initializeAnalyticsDB();
    
    if (success) {
      logger.info('Analytics tables reset successfully');
      res.json({ success: true, message: 'Analytics tables reset and recreated' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to reinitialize tables' });
    }
  } catch (error) {
    logger.error('Analytics reset error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ====================================
// DASHBOARD ENDPOINTS
// ====================================

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get complete dashboard data
 * @access  Admin
 */
router.get('/dashboard', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const [
      realtime,
      todaySummary,
      topContent,
      trafficSources,
      devices,
      hourlyBreakdown
    ] = await Promise.all([
      analyticsService.getRealtimeVisitors(),
      analyticsService.getTodaySummary(),
      analyticsService.getTopContent(10),
      analyticsService.getTrafficSources(),
      analyticsService.getDeviceBreakdown(),
      analyticsService.getHourlyBreakdown()
    ]);

    res.json({
      realtime,
      today: todaySummary,
      topContent,
      trafficSources,
      devices,
      hourlyBreakdown,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching dashboard data', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/analytics/realtime
 * @desc    Get real-time active visitors
 * @access  Admin
 */
router.get('/realtime', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { minutes = 5 } = req.query;
    const data = await analyticsService.getRealtimeVisitors(parseInt(minutes));
    res.json(data);
  } catch (error) {
    logger.error('Error fetching realtime data', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/analytics/today
 * @desc    Get today's summary statistics
 * @access  Admin
 */
router.get('/today', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const summary = await analyticsService.getTodaySummary();
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching today summary', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/analytics/top-content
 * @desc    Get top viewed content
 * @access  Admin
 */
router.get('/top-content', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { limit = 20, type } = req.query;
    const content = await analyticsService.getTopContent(parseInt(limit), type);
    res.json({ content });
  } catch (error) {
    logger.error('Error fetching top content', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/analytics/traffic-sources
 * @desc    Get traffic source breakdown
 * @access  Admin
 */
router.get('/traffic-sources', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const sources = await analyticsService.getTrafficSources(parseInt(days));
    res.json({ sources });
  } catch (error) {
    logger.error('Error fetching traffic sources', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/analytics/devices
 * @desc    Get device/browser breakdown
 * @access  Admin
 */
router.get('/devices', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const devices = await analyticsService.getDeviceBreakdown(parseInt(days));
    res.json({ devices });
  } catch (error) {
    logger.error('Error fetching device breakdown', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/analytics/hourly
 * @desc    Get hourly activity breakdown
 * @access  Admin
 */
router.get('/hourly', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const hourly = await analyticsService.getHourlyBreakdown(parseInt(days));
    res.json({ hourly });
  } catch (error) {
    logger.error('Error fetching hourly breakdown', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====================================
// HISTORICAL DATA ENDPOINTS  
// ====================================

/**
 * @route   GET /api/analytics/history/daily
 * @desc    Get daily aggregated stats
 * @access  Admin
 */
router.get('/history/daily', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { query } = require('../config/analyticsDatabase');
    
    const result = await query(`
      SELECT 
        date,
        unique_visitors,
        authenticated_visitors,
        anonymous_visitors,
        total_page_views,
        avg_session_duration_seconds,
        bounce_rate
      FROM daily_stats
      WHERE date >= CURRENT_DATE - $1
      ORDER BY date DESC
    `, [parseInt(days)]);

    res.json({ 
      stats: result.rows,
      count: result.rowCount 
    });
  } catch (error) {
    logger.error('Error fetching daily history', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/analytics/history/content
 * @desc    Get content performance over time
 * @access  Admin
 */
router.get('/history/content', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { days = 7, contentId } = req.query;
    const { query } = require('../config/analyticsDatabase');
    
    let sql = `
      SELECT 
        cds.date,
        cr.content_type,
        cr.mongo_id,
        cr.title,
        cds.views,
        cds.unique_visitors
      FROM content_daily_stats cds
      JOIN content_registry cr ON cds.content_id = cr.id
      WHERE cds.date >= CURRENT_DATE - $1
    `;
    const params = [parseInt(days)];

    if (contentId) {
      params.push(contentId);
      sql += ` AND cr.mongo_id = $2`;
    }

    sql += ` ORDER BY cds.date DESC, cds.views DESC LIMIT 500`;

    const result = await query(sql, params);

    res.json({ 
      stats: result.rows,
      count: result.rowCount 
    });
  } catch (error) {
    logger.error('Error fetching content history', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====================================
// VISITOR INSIGHTS
// ====================================

/**
 * @route   GET /api/analytics/visitors
 * @desc    Get visitor list with activity summary
 * @access  Admin
 */
router.get('/visitors', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { limit = 50, authenticated } = req.query;
    const { query } = require('../config/analyticsDatabase');
    
    let sql = `
      SELECT 
        v.id,
        v.mongo_user_id,
        v.is_authenticated,
        v.first_seen,
        v.last_seen,
        v.total_visits,
        v.total_sessions,
        v.device_type,
        v.browser,
        v.os,
        v.country
      FROM visitors v
    `;
    const params = [];

    if (authenticated !== undefined) {
      params.push(authenticated === 'true');
      sql += ` WHERE v.is_authenticated = $1`;
    }

    sql += ` ORDER BY v.last_seen DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);

    res.json({ 
      visitors: result.rows,
      count: result.rowCount 
    });
  } catch (error) {
    logger.error('Error fetching visitors', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/analytics/visitors/:visitorId/activity
 * @desc    Get detailed activity for a visitor
 * @access  Admin
 */
router.get('/visitors/:visitorId/activity', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { limit = 50 } = req.query;
    const { query } = require('../config/analyticsDatabase');
    
    // Get visitor info
    const visitorResult = await query(`
      SELECT * FROM visitors WHERE id = $1
    `, [visitorId]);

    if (visitorResult.rowCount === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Get recent visits
    const visitsResult = await query(`
      SELECT 
        v.id,
        v.visited_at,
        v.path,
        v.page_type,
        v.referrer_type,
        v.latency_ms,
        cr.content_type,
        cr.title as content_title
      FROM visits v
      LEFT JOIN content_registry cr ON v.content_id = cr.id
      WHERE v.visitor_id = $1
      ORDER BY v.visited_at DESC
      LIMIT $2
    `, [visitorId, parseInt(limit)]);

    // Get sessions
    const sessionsResult = await query(`
      SELECT 
        id,
        started_at,
        last_activity_at,
        ended_at,
        page_views,
        duration_seconds,
        entry_page,
        exit_page,
        is_bounce
      FROM sessions
      WHERE visitor_id = $1
      ORDER BY started_at DESC
      LIMIT 10
    `, [visitorId]);

    res.json({
      visitor: visitorResult.rows[0],
      recentVisits: visitsResult.rows,
      sessions: sessionsResult.rows
    });
  } catch (error) {
    logger.error('Error fetching visitor activity', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====================================
// TRACKING ENDPOINTS (for frontend)
// ====================================

/**
 * @route   POST /api/analytics/track
 * @desc    Track a page view (for SPA frontend)
 * @access  Public
 */
router.post('/track', checkAnalyticsEnabled, trackContentView(), async (req, res) => {
  try {
    if (req.analyticsTracked) {
      return res.json({ success: true, tracked: true });
    }

    const userId = req.user?.id || req.user?._id?.toString() || null;
    const { path, pageType, contentType, contentId, title } = req.body;

    await analyticsService.trackPageView(req, {
      userId,
      userAgent: req.get('User-Agent') || '',
      referer: req.get('Referer') || '',
      path: path || req.path,
      pageType: pageType || 'other',
      content: contentType && contentId ? { type: contentType, mongoId: contentId, title } : null
    });

    res.json({ success: true, tracked: true });
  } catch (error) {
    logger.error('Error tracking page view', { error: error.message });
    res.status(500).json({ error: 'Failed to track' });
  }
});

// ====================================
// MAINTENANCE ENDPOINTS
// ====================================

/**
 * @route   POST /api/analytics/aggregate
 * @desc    Trigger daily aggregation
 * @access  Admin or Cron
 */
router.post('/aggregate', checkAnalyticsEnabled, async (req, res) => {
  try {
    // Verify cron secret or admin authentication
    const cronSecret = req.headers['x-cron-secret'];
    const isValidCron = cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!isValidCron && (!req.user || req.user.role !== 'admin')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { date } = req.body;
    await analyticsService.aggregateDailyStats(date ? new Date(date) : new Date());

    res.json({ 
      success: true, 
      message: 'Daily stats aggregated successfully',
      date: date || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    logger.error('Error aggregating analytics', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/analytics/cleanup
 * @desc    Cleanup old analytics data
 * @access  Admin
 */
router.post('/cleanup', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { retentionDays = 90 } = req.body;
    const deletedCount = await analyticsService.cleanupOldData(parseInt(retentionDays));

    res.json({
      success: true,
      message: `Cleaned up data older than ${retentionDays} days`,
      deletedCount
    });
  } catch (error) {
    logger.error('Error cleaning up analytics', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/analytics/cleanup-realtime
 * @desc    Cleanup realtime activity table
 * @access  Admin
 */
router.post('/cleanup-realtime', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { minutes = 30 } = req.body;
    await analyticsService.cleanupRealtimeData(parseInt(minutes));

    res.json({
      success: true,
      message: `Cleaned up realtime data older than ${minutes} minutes`
    });
  } catch (error) {
    logger.error('Error cleaning up realtime data', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====================================
// CONTENT REGISTRY
// ====================================

/**
 * @route   GET /api/analytics/content
 * @desc    Get all registered content
 * @access  Admin
 */
router.get('/content', requireAuth, requireRole('admin'), checkAnalyticsEnabled, async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    const { query } = require('../config/analyticsDatabase');
    
    let sql = `
      SELECT 
        id,
        content_type,
        mongo_id,
        title,
        total_views,
        first_viewed_at,
        last_viewed_at
      FROM content_registry
    `;
    const params = [];

    if (type) {
      params.push(type);
      sql += ` WHERE content_type = $1`;
    }

    sql += ` ORDER BY total_views DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);

    res.json({ 
      content: result.rows,
      count: result.rowCount 
    });
  } catch (error) {
    logger.error('Error fetching content registry', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

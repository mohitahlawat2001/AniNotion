/**
 * PostgreSQL Analytics Database Configuration
 * Redesigned for meaningful analytics and dashboard visualization
 */

const { Pool } = require('pg');
const logger = require('./logger');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.ANALYTICS_DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Neon
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  logger.debug('Analytics DB: New client connected');
});

pool.on('error', (err) => {
  logger.error('Analytics DB: Unexpected error on idle client', { error: err.message });
});

/**
 * Initialize the analytics database schema
 */
const initializeAnalyticsDB = async () => {
  if (!process.env.ANALYTICS_DATABASE_URL) {
    logger.warn('Analytics DB: ANALYTICS_DATABASE_URL not set, analytics will be disabled');
    return false;
  }

  let client;
  try {
    client = await pool.connect();
    logger.info('Analytics DB: Connected, initializing tables...');

    // Drop ALL tables to ensure clean schema (handles any old schema)
    const dropQueries = [
      'DROP TABLE IF EXISTS analytics_events CASCADE',
      'DROP TABLE IF EXISTS user_sessions CASCADE', 
      'DROP TABLE IF EXISTS daily_aggregates CASCADE',
      'DROP TABLE IF EXISTS realtime_activity CASCADE',
      'DROP TABLE IF EXISTS content_daily_stats CASCADE',
      'DROP TABLE IF EXISTS daily_stats CASCADE',
      'DROP TABLE IF EXISTS visits CASCADE',
      'DROP TABLE IF EXISTS sessions CASCADE',
      'DROP TABLE IF EXISTS content_registry CASCADE',
      'DROP TABLE IF EXISTS visitors CASCADE',
      'DROP TABLE IF EXISTS page_stats CASCADE',
      'DROP TABLE IF EXISTS category_stats CASCADE',
      'DROP TABLE IF EXISTS post_stats CASCADE'
    ];
    
    for (const q of dropQueries) {
      await client.query(q);
    }
    
    logger.info('Analytics DB: Old tables dropped, creating new schema...');

    // TABLE 1: visitors
    await client.query(`
      CREATE TABLE visitors (
        id BIGSERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE,
        visitor_hash VARCHAR(64) UNIQUE,
        is_authenticated BOOLEAN DEFAULT FALSE,
        username VARCHAR(255),
        email VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent_hash VARCHAR(64),
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        country VARCHAR(100),
        first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        total_visits INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0
      )
    `);
    await client.query(`CREATE INDEX idx_visitors_user_id ON visitors(user_id) WHERE user_id IS NOT NULL`);
    await client.query(`CREATE INDEX idx_visitors_hash ON visitors(visitor_hash) WHERE visitor_hash IS NOT NULL`);
    await client.query(`CREATE INDEX idx_visitors_last_seen ON visitors(last_seen)`);
    await client.query(`CREATE INDEX idx_visitors_authenticated ON visitors(is_authenticated)`);
    logger.info('Analytics DB: Created visitors table');

    // TABLE 2: content_registry
    await client.query(`
      CREATE TABLE content_registry (
        id BIGSERIAL PRIMARY KEY,
        content_type VARCHAR(20) NOT NULL,
        mongo_id VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        slug VARCHAR(500),
        total_views INTEGER DEFAULT 0,
        first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_viewed_at TIMESTAMPTZ,
        UNIQUE(content_type, mongo_id)
      )
    `);
    await client.query(`CREATE INDEX idx_content_type ON content_registry(content_type)`);
    await client.query(`CREATE INDEX idx_content_mongo_id ON content_registry(mongo_id)`);
    await client.query(`CREATE INDEX idx_content_views ON content_registry(total_views DESC)`);
    logger.info('Analytics DB: Created content_registry table');

    // TABLE 3: sessions
    await client.query(`
      CREATE TABLE sessions (
        id BIGSERIAL PRIMARY KEY,
        visitor_id BIGINT REFERENCES visitors(id) ON DELETE CASCADE,
        session_token VARCHAR(64) UNIQUE NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        duration_seconds INTEGER DEFAULT 0,
        page_views INTEGER DEFAULT 0,
        entry_page VARCHAR(500),
        exit_page VARCHAR(500),
        is_bounce BOOLEAN DEFAULT TRUE
      )
    `);
    await client.query(`CREATE INDEX idx_sessions_visitor ON sessions(visitor_id)`);
    await client.query(`CREATE INDEX idx_sessions_token ON sessions(session_token)`);
    await client.query(`CREATE INDEX idx_sessions_started ON sessions(started_at)`);
    logger.info('Analytics DB: Created sessions table');

    // TABLE 4: visits
    await client.query(`
      CREATE TABLE visits (
        id BIGSERIAL PRIMARY KEY,
        visitor_id BIGINT REFERENCES visitors(id) ON DELETE CASCADE,
        content_id BIGINT REFERENCES content_registry(id) ON DELETE CASCADE,
        session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
        visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        path VARCHAR(500),
        page_type VARCHAR(50),
        referrer_type VARCHAR(50),
        latency_ms INTEGER
      )
    `);
    await client.query(`CREATE INDEX idx_visits_visitor ON visits(visitor_id)`);
    await client.query(`CREATE INDEX idx_visits_content ON visits(content_id)`);
    await client.query(`CREATE INDEX idx_visits_time ON visits(visited_at)`);
    logger.info('Analytics DB: Created visits table');

    // TABLE 5: daily_stats
    await client.query(`
      CREATE TABLE daily_stats (
        id BIGSERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        unique_visitors INTEGER DEFAULT 0,
        authenticated_visitors INTEGER DEFAULT 0,
        anonymous_visitors INTEGER DEFAULT 0,
        new_visitors INTEGER DEFAULT 0,
        returning_visitors INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0,
        avg_session_duration_seconds NUMERIC(10,2) DEFAULT 0,
        bounce_rate NUMERIC(5,2) DEFAULT 0,
        total_page_views INTEGER DEFAULT 0,
        traffic_sources JSONB,
        device_breakdown JSONB,
        hourly_visitors JSONB,
        hourly_pageviews JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX idx_daily_stats_date ON daily_stats(date)`);
    logger.info('Analytics DB: Created daily_stats table');

    // TABLE 6: content_daily_stats
    await client.query(`
      CREATE TABLE content_daily_stats (
        id BIGSERIAL PRIMARY KEY,
        content_id BIGINT REFERENCES content_registry(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        views INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(content_id, date)
      )
    `);
    await client.query(`CREATE INDEX idx_content_daily_content ON content_daily_stats(content_id)`);
    await client.query(`CREATE INDEX idx_content_daily_date ON content_daily_stats(date)`);
    logger.info('Analytics DB: Created content_daily_stats table');

    // TABLE 7: realtime_activity
    await client.query(`
      CREATE TABLE realtime_activity (
        id BIGSERIAL PRIMARY KEY,
        visitor_id BIGINT REFERENCES visitors(id) ON DELETE CASCADE,
        activity_type VARCHAR(30),
        page_type VARCHAR(50),
        path VARCHAR(500),
        content_title VARCHAR(500),
        visitor_name VARCHAR(255),
        activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_authenticated BOOLEAN DEFAULT FALSE,
        device_type VARCHAR(20)
      )
    `);
    await client.query(`CREATE INDEX idx_realtime_time ON realtime_activity(activity_at)`);
    logger.info('Analytics DB: Created realtime_activity table');

    // TABLE 8: page_stats - Track views for pages like home, trending, recommendations
    await client.query(`
      CREATE TABLE page_stats (
        id BIGSERIAL PRIMARY KEY,
        page_name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(255),
        total_views INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_viewed_at TIMESTAMPTZ
      )
    `);
    await client.query(`CREATE INDEX idx_page_stats_name ON page_stats(page_name)`);
    await client.query(`CREATE INDEX idx_page_stats_views ON page_stats(total_views DESC)`);
    logger.info('Analytics DB: Created page_stats table');

    // TABLE 9: category_stats - Track category views with names
    await client.query(`
      CREATE TABLE category_stats (
        id BIGSERIAL PRIMARY KEY,
        category_id VARCHAR(255) NOT NULL UNIQUE,
        category_name VARCHAR(255),
        total_views INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_viewed_at TIMESTAMPTZ
      )
    `);
    await client.query(`CREATE INDEX idx_category_stats_id ON category_stats(category_id)`);
    await client.query(`CREATE INDEX idx_category_stats_views ON category_stats(total_views DESC)`);
    logger.info('Analytics DB: Created category_stats table');

    // TABLE 10: post_stats - Track post views with titles
    await client.query(`
      CREATE TABLE post_stats (
        id BIGSERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL UNIQUE,
        post_title VARCHAR(500),
        category_id VARCHAR(255),
        category_name VARCHAR(255),
        total_views INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_viewed_at TIMESTAMPTZ
      )
    `);
    await client.query(`CREATE INDEX idx_post_stats_id ON post_stats(post_id)`);
    await client.query(`CREATE INDEX idx_post_stats_views ON post_stats(total_views DESC)`);
    await client.query(`CREATE INDEX idx_post_stats_category ON post_stats(category_id)`);
    logger.info('Analytics DB: Created post_stats table');

    logger.info('✅ Analytics database initialized with new schema (10 tables)');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize analytics database', { 
      error: error.message,
      stack: error.stack 
    });
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Query helper with error handling
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Analytics DB query executed', { query: text.substring(0, 100), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Analytics DB query error', { query: text.substring(0, 100), error: error.message });
    throw error;
  }
};

const getClient = async () => await pool.connect();
const isAnalyticsEnabled = () => !!process.env.ANALYTICS_DATABASE_URL;
const closePool = async () => { await pool.end(); logger.info('Analytics DB: Connection pool closed'); };

module.exports = { pool, query, getClient, initializeAnalyticsDB, isAnalyticsEnabled, closePool };

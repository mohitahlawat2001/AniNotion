/**
 * Test script for Analytics Service
 * Run with: node scripts/test-analytics.js
 */

require('dotenv').config();
const { initializeAnalyticsDB, isAnalyticsEnabled, query, closePool } = require('../config/analyticsDatabase');
const analyticsService = require('../services/analyticsService');

async function testAnalytics() {
  console.log('🧪 Testing Analytics Service\n');
  console.log('================================');

  // Check if analytics is enabled
  console.log('\n1. Checking analytics status...');
  const enabled = isAnalyticsEnabled();
  console.log(`   Analytics enabled: ${enabled}`);

  if (!enabled) {
    console.log('\n⚠️  ANALYTICS_DATABASE_URL is not set in .env');
    console.log('   Set it to a PostgreSQL connection string to enable analytics.');
    console.log('\n   Example:');
    console.log('   ANALYTICS_DATABASE_URL=postgresql://user:pass@localhost:5432/aninotion_analytics\n');
    process.exit(0);
  }

  try {
    // Initialize database
    console.log('\n2. Initializing analytics database...');
    const initSuccess = await initializeAnalyticsDB();
    console.log(`   Database initialized: ${initSuccess}`);

    if (!initSuccess) {
      console.log('   ❌ Failed to initialize database');
      process.exit(1);
    }

    // Test logging an event
    console.log('\n3. Testing event logging...');
    const eventId = await analyticsService.logEvent({
      userId: 'test-user-123',
      sessionId: analyticsService.generateSessionId(),
      method: 'GET',
      path: '/api/test',
      route: '/api/test',
      latencyMs: 45,
      responseStatus: 200,
      userAgent: 'Mozilla/5.0 (Test; Analytics Test)',
      ipAddress: '127.0.0.1',
      actionType: 'test',
      actionName: 'test_event',
      actionCategory: 'testing',
      metadata: { test: true },
      tags: ['test', 'automated']
    });
    console.log(`   Event logged with ID: ${eventId}`);

    // Test session tracking
    console.log('\n4. Testing session tracking...');
    const sessionId = analyticsService.generateSessionId();
    const sessionResult = await analyticsService.trackSession({
      sessionId,
      userId: 'test-user-123',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test; Analytics Test)',
      entryPage: '/test',
      incrementPageViews: true,
      incrementApiCalls: true
    });
    console.log(`   Session tracked with ID: ${sessionResult}`);

    // Test getting analytics summary
    console.log('\n5. Testing analytics summary...');
    const summary = await analyticsService.getAnalyticsSummary();
    console.log(`   Total requests: ${summary?.summary?.total_requests || 0}`);
    console.log(`   Unique users: ${summary?.summary?.unique_users || 0}`);
    console.log(`   Unique sessions: ${summary?.summary?.unique_sessions || 0}`);

    // Test user activity
    console.log('\n6. Testing user activity...');
    const activity = await analyticsService.getUserActivity('test-user-123');
    console.log(`   Activity records: ${activity?.length || 0}`);

    // Test active users
    console.log('\n7. Testing active users...');
    const activeUsers = await analyticsService.getActiveUsers(60); // Last 60 minutes
    console.log(`   Logged in users: ${activeUsers?.counts?.logged_in_users || 0}`);
    console.log(`   Total sessions: ${activeUsers?.counts?.total_sessions || 0}`);

    // Verify tables exist
    console.log('\n8. Verifying database tables...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('analytics_events', 'user_sessions', 'daily_aggregates', 'page_analytics')
    `);
    console.log(`   Tables found: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);

    // Clean up test data
    console.log('\n9. Cleaning up test data...');
    await query("DELETE FROM analytics_events WHERE user_id = 'test-user-123'");
    await query(`DELETE FROM user_sessions WHERE session_id = $1`, [sessionId]);
    console.log('   Test data cleaned up');

    console.log('\n================================');
    console.log('✅ All tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await closePool();
  }
}

testAnalytics();

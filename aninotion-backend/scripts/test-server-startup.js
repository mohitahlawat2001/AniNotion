#!/usr/bin/env node

/**
 * Quick server startup test
 * Run with: node scripts/test-server-startup.js
 */

console.log('🔍 Testing server startup...\n');

try {
  // Test environment variables
  require('dotenv').config();
  console.log('✅ dotenv loaded');

  // Test passport import
  const passport = require('../config/passport');
  console.log('✅ passport config loaded');

  // Test routes import
  const authRoutes = require('../routes/auth');
  console.log('✅ auth routes loaded');

  // Test User model
  const User = require('../models/User');
  console.log('✅ User model loaded');

  console.log('\n✅ All imports successful! Server should start without errors.');
  console.log('\nIf you still see errors, please share the exact error message.');

} catch (error) {
  console.error('\n❌ Error detected:\n');
  console.error('Error:', error.message);
  console.error('\nStack:', error.stack);
  
  if (error.message.includes('passport')) {
    console.error('\n💡 Suggestion: Install passport packages:');
    console.error('   npm install passport passport-google-oauth20');
  }
}

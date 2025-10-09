#!/usr/bin/env node

/**
 * OAuth2 API Testing Script
 * 
 * This script tests the Google OAuth2 endpoints
 * Run with: npm run test:oauth
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testEndpoint(name, method, url, expectedStatus = 200) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    log(`   ${method} ${url}`, 'yellow');
    
    const response = await axios({
      method,
      url,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 500
    });

    if (response.status === expectedStatus || 
        (expectedStatus === 302 && response.status >= 300 && response.status < 400)) {
      log(`   ✅ Success: ${response.status}`, 'green');
      if (response.data) {
        console.log('   Response:', JSON.stringify(response.data, null, 2));
      }
      if (response.headers.location) {
        log(`   Redirect to: ${response.headers.location}`, 'yellow');
      }
      return true;
    } else {
      log(`   ❌ Failed: Expected ${expectedStatus}, got ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 302) {
      log(`   ✅ Redirect: ${error.response.status}`, 'green');
      if (error.response.headers.location) {
        log(`   Location: ${error.response.headers.location}`, 'yellow');
      }
      return true;
    }
    
    log(`   ❌ Error: ${error.message}`, 'red');
    if (error.response) {
      console.log('   Response:', error.response.data);
    }
    return false;
  }
}

async function checkEnvironment() {
  logSection('Environment Check');
  
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'FRONTEND_URL'
  ];

  let allSet = true;
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`✅ ${varName} is set`, 'green');
    } else {
      log(`❌ ${varName} is NOT set`, 'red');
      allSet = false;
    }
  }

  return allSet;
}

async function runTests() {
  log('\n🚀 Starting OAuth2 Endpoint Tests\n', 'cyan');
  
  const envOk = await checkEnvironment();
  if (!envOk) {
    log('\n⚠️  Some environment variables are missing!', 'yellow');
    log('Please check your .env file\n', 'yellow');
  }

  logSection('API Endpoint Tests');
  
  const results = [];

  results.push(await testEndpoint(
    'Get OAuth URL',
    'GET',
    `${API_BASE}/api/auth/google/url`,
    200
  ));

  results.push(await testEndpoint(
    'Initiate OAuth Flow',
    'GET',
    `${API_BASE}/api/auth/google`,
    302
  ));

  results.push(await testEndpoint(
    'Health Check',
    'GET',
    `${API_BASE}/health`,
    200
  ));

  logSection('Test Summary');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log(`\nTests Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n✅ All tests passed! OAuth is configured correctly.', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Open browser: http://localhost:5000/api/auth/google');
    log('2. Complete Google sign-in');
    log('3. Check if redirected to frontend with token\n');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.\n', 'yellow');
  }
}

async function showManualInstructions() {
  logSection('Manual Testing Instructions');
  
  log('\n📋 To test the complete OAuth flow:', 'cyan');
  log('\n1. Ensure your backend server is running:');
  log('   npm start\n');
  log('2. Open your browser and visit:');
  log(`   ${colors.green}${API_BASE}/api/auth/google${colors.reset}\n`);
  log('3. Sign in with your Google account\n');
  log('4. You should be redirected to:');
  log(`   ${colors.green}${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=...${colors.reset}\n`);
  log('5. Check your browser URL for the JWT token\n');
  log('6. Verify user created in MongoDB database\n');
}

(async () => {
  require('dotenv').config();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--manual') || args.includes('-m')) {
    showManualInstructions();
  } else {
    await runTests();
    showManualInstructions();
  }
})();

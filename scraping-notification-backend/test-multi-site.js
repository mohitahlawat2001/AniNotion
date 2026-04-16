#!/usr/bin/env node

/**
 * Multi-Site Scraper Test Script
 * Tests the new multi-site scraping functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/scraping-config';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGetAdapters() {
  log('cyan', '\n=== Test 1: Get Available Adapters ===');
  try {
    const response = await axios.get(`${BASE_URL}/adapters/available`);
    
    if (response.data.success) {
      log('green', `✓ Found ${response.data.data.length} adapters`);
      response.data.data.forEach(adapter => {
        console.log(`  - ${adapter.name} (${adapter.key})`);
        console.log(`    Domains: ${adapter.domains.join(', ')}`);
        console.log(`    Puppeteer: ${adapter.usesPuppeteer ? 'Yes' : 'No'}`);
      });
      return true;
    }
  } catch (error) {
    log('red', `✗ Failed: ${error.message}`);
    return false;
  }
}

async function testScrapeUrl(url, siteName) {
  log('cyan', `\n=== Test 2: Test Scraping ${siteName} ===`);
  log('yellow', `Testing URL: ${url}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/test-url`, {
      url: url,
      maxReleases: 5,
      enablePagination: false
    });
    
    if (response.data.success && response.data.data.success) {
      const result = response.data.data;
      log('green', `✓ Scraping successful!`);
      console.log(`  Adapter: ${result.adapter} (${result.adapterKey})`);
      console.log(`  Releases found: ${result.releaseCount}`);
      console.log(`  Duration: ${result.duration}`);
      
      if (result.sampleReleases && result.sampleReleases.length > 0) {
        console.log(`\n  Sample Release:`);
        const sample = result.sampleReleases[0];
        console.log(`    Title: ${sample.title}`);
        console.log(`    Anime: ${sample.animeName}`);
        console.log(`    Episode: ${sample.episodeNumber || 'N/A'}`);
        console.log(`    Watch URL: ${sample.watchUrl}`);
      }
      
      return true;
    } else {
      log('red', `✗ Scraping failed`);
      if (response.data.data.error) {
        console.log(`  Error: ${response.data.data.error}`);
      }
      return false;
    }
  } catch (error) {
    log('red', `✗ Request failed: ${error.message}`);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testCreateConfigFromUrl(url, siteName) {
  log('cyan', `\n=== Test 3: Create Config for ${siteName} ===`);
  
  try {
    const response = await axios.post(`${BASE_URL}/from-url`, {
      url: url,
      configName: `Test Config - ${siteName}`
    });
    
    if (response.data.success) {
      const config = response.data.data;
      log('green', `✓ Config created successfully!`);
      console.log(`  ID: ${config._id}`);
      console.log(`  Name: ${config.name}`);
      console.log(`  Source: ${config.sourceWebsite}`);
      console.log(`  Active: ${config.isActive}`);
      
      // Clean up: delete the test config
      try {
        await axios.delete(`${BASE_URL}/${config._id}`);
        log('yellow', `  ℹ Test config deleted`);
      } catch (e) {
        log('yellow', `  ℹ Could not delete test config (${e.message})`);
      }
      
      return true;
    }
  } catch (error) {
    log('red', `✗ Failed: ${error.message}`);
    if (error.response) {
      console.log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function runTests() {
  log('blue', '\n╔════════════════════════════════════════════════╗');
  log('blue', '║   Multi-Site Anime Scraper Test Suite         ║');
  log('blue', '╚════════════════════════════════════════════════╝');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Test 1: Get available adapters
  const test1 = await testGetAdapters();
  test1 ? results.passed++ : results.failed++;
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Test scraping AnimePahe (known good site)
  // Note: We're using a real URL but limiting to 5 releases to be fast and respectful
  const test2 = await testScrapeUrl('https://animepahe.com', 'AnimePahe');
  test2 ? results.passed++ : results.failed++;
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Create config from URL
  const test3 = await testCreateConfigFromUrl('https://animepahe.com', 'AnimePahe');
  test3 ? results.passed++ : results.failed++;
  
  // Summary
  log('blue', '\n╔════════════════════════════════════════════════╗');
  log('blue', '║               Test Results                     ║');
  log('blue', '╚════════════════════════════════════════════════╝');
  log('green', `✓ Passed: ${results.passed}`);
  log('red', `✗ Failed: ${results.failed}`);
  
  if (results.failed === 0) {
    log('green', '\n🎉 All tests passed! Multi-site scraper is working correctly.');
  } else {
    log('yellow', '\n⚠️  Some tests failed. Check the output above for details.');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
log('yellow', 'Starting tests... Please wait.\n');
runTests().catch(error => {
  log('red', `\n✗ Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

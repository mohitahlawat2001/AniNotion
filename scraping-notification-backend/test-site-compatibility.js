#!/usr/bin/env node

/**
 * Site Compatibility Tester
 * Tests multiple anime sites to find which ones are accessible
 */

const CloudflareBypass = require('./services/cloudflareBypass');

const ANIME_SITES = [
  'https://animepahe.com',
  'https://www.animepahe.ru',
  'https://gogoanime.vc',
  'https://gogoanime3.co',
  'https://anitaku.to',
  'https://aniwave.to',
  'https://hianime.to',
  'https://anix.to'
];

async function testSite(url) {
  const bypass = new CloudflareBypass();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${url}`);
  console.log('='.repeat(60));
  
  try {
    const result = await bypass.testProtection(url);
    
    console.log(`Status: ${result.status}`);
    console.log(`Protected: ${result.isProtected ? '❌ YES' : '✅ NO'}`);
    console.log(`Has Content: ${result.hasContent ? '✅ YES' : '❌ NO'}`);
    console.log(`HTML Length: ${result.htmlLength} chars`);
    
    if (result.status === 'ACCESSIBLE') {
      console.log('\n🎉 THIS SITE LOOKS ACCESSIBLE!');
      console.log('Next step: Run selector discovery');
      console.log(`  node discover-selectors.js ${url}`);
    } else if (result.isProtected) {
      console.log('\n🚫 This site is Cloudflare-protected');
      
      // Check what kind of protection
      if (result.html && result.html.includes('1015')) {
        console.log('   Protection type: Rate limiting (Error 1015)');
      } else if (result.html && result.html.includes('1020')) {
        console.log('   Protection type: Access denied (Error 1020)');
      } else {
        console.log('   Protection type: Cloudflare challenge');
      }
    } else {
      console.log('\n⚠️  Status unknown - manual inspection needed');
    }
    
    return result;
    
  } catch (error) {
    console.log(`Status: ERROR`);
    console.log(`Error: ${error.message}`);
    return { url, status: 'ERROR', error: error.message };
  }
}

async function testAll() {
  console.log('\n🔍 ANIME SITE COMPATIBILITY TEST');
  console.log('Testing multiple anime sites for accessibility...\n');
  
  const results = [];
  
  for (const url of ANIME_SITES) {
    const result = await testSite(url);
    results.push(result);
    
    // Wait between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const accessible = results.filter(r => r.status === 'ACCESSIBLE');
  const protected = results.filter(r => r.isProtected);
  const errors = results.filter(r => r.status === 'ERROR');
  
  console.log(`\n✅ Accessible: ${accessible.length}`);
  accessible.forEach(r => console.log(`   - ${r.url}`));
  
  console.log(`\n🚫 Protected: ${protected.length}`);
  protected.forEach(r => console.log(`   - ${r.url}`));
  
  console.log(`\n❌ Errors: ${errors.length}`);
  errors.forEach(r => console.log(`   - ${r.url} (${r.error})`));
  
  if (accessible.length > 0) {
    console.log('\n\n🎉 SUCCESS! Found accessible sites:');
    console.log('\nNext steps:');
    accessible.forEach(r => {
      console.log(`\n  1. Inspect: node inspect-html.js ${r.url}`);
      console.log(`  2. Discover: node discover-selectors.js ${r.url}`);
    });
  } else {
    console.log('\n\n⚠️  No accessible sites found.');
    console.log('Consider:');
    console.log('  - Using FlareSolverr for Cloudflare bypass');
    console.log('  - Finding alternative anime sites');
    console.log('  - Using RSS feeds or APIs instead');
    console.log('  - Testing with user-provided cookies');
  }
  
  console.log('\n');
}

// Run if called directly
if (require.main === module) {
  testAll().catch(console.error);
}

module.exports = { testSite, testAll };

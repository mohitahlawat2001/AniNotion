#!/usr/bin/env node

/**
 * Selector Discovery CLI Tool
 * Automatically finds correct selectors for anime sites
 * 
 * Usage:
 *   node discover-selectors.js <url>
 *   node discover-selectors.js https://animekai.to/home
 */

const SelectorDiscovery = require('./services/selectorDiscovery');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
╔════════════════════════════════════════════════╗
║      Anime Site Selector Discovery Tool       ║
╚════════════════════════════════════════════════╝

Automatically discovers the correct CSS selectors for
scraping anime episodes from any anime website.

USAGE:
  node discover-selectors.js <url>

EXAMPLES:
  node discover-selectors.js https://animekai.to/home
  node discover-selectors.js https://gogoanime.com
  node discover-selectors.js https://9anime.to

WHAT IT DOES:
  1. Fetches the page using Puppeteer
  2. Analyzes the HTML structure
  3. Finds patterns for anime/episode containers
  4. Suggests optimal CSS selectors
  5. Provides sample data for verification

OUTPUT:
  - Suggested selectors for episodeWrap, thumbnail, etc.
  - Top container candidates
  - Analysis of page structure
  - Next steps for implementation
  `);
  process.exit(0);
}

const url = args[0];

if (!url.startsWith('http')) {
  console.error('❌ Error: URL must start with http:// or https://');
  console.error(`   You provided: ${url}`);
  process.exit(1);
}

// Run discovery
const discovery = new SelectorDiscovery();

console.log('🔍 Starting selector discovery...\n');
console.log(`Target: ${url}\n`);

discovery.discoverSelectors(url)
  .then(report => {
    console.log('✅ Discovery complete!');
    console.log('\n📄 Full report saved to memory');
    
    // Print code snippet for adapter
    if (report.suggestions.episodeWrap) {
      console.log('\n📝 ADAPTER CODE SNIPPET:\n');
      console.log('```javascript');
      console.log(`selectors: {`);
      console.log(`  episodeWrap: '${report.suggestions.episodeWrap}',`);
      console.log(`  thumbnail: '${report.suggestions.thumbnail || 'img'}',`);
      console.log(`  animeName: '${report.suggestions.animeName || '.title'}',`);
      console.log(`  watchLink: '${report.suggestions.watchLink || 'a'}',`);
      console.log(`  episodeNumber: '${report.suggestions.episodeNumber || '.episode'}',`);
      console.log(`  animePageUrl: '${report.suggestions.animeName || '.title'} a',`);
      console.log(`  dataId: 'data-id',`);
      console.log(`  isComplete: '.complete, .status-complete'`);
      console.log(`}`);
      console.log('```\n');
      
      // Suggest test command
      console.log('🧪 TO TEST THESE SELECTORS:\n');
      console.log(`   curl -X POST http://localhost:5001/api/scraping-config/test-url \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"url": "${url}", "maxReleases": 5}'\n`);
    } else {
      console.log('\n⚠️  Could not auto-discover selectors');
      console.log('   Please inspect the page manually and update the adapter');
      console.log('   Use browser DevTools to find the correct selectors\n');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Discovery failed:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  });

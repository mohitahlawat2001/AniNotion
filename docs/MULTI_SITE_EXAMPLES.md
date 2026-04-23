# Multi-Site Scraper Usage Examples

This document provides practical examples of using the multi-site anime scraper.

## Table of Contents
- [Quick Examples](#quick-examples)
- [API Usage](#api-usage)
- [Programmatic Usage](#programmatic-usage)
- [Real-World Scenarios](#real-world-scenarios)

## Quick Examples

### Example 1: Test Any Anime Site

Test scraping without saving to database:

```bash
# Test AnimePahe
curl -X POST http://localhost:5001/api/scraping-config/test-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://animepahe.com",
    "maxReleases": 10
  }'

# Test AnimeKai
curl -X POST http://localhost:5001/api/scraping-config/test-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://animekai.to",
    "maxReleases": 10
  }'

# Test GogoAnime
curl -X POST http://localhost:5001/api/scraping-config/test-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://gogoanime.com",
    "maxReleases": 10
  }'
```

### Example 2: Quick Scrape & Save

Scrape and immediately save to database:

```bash
# Scrape AnimePahe - first 50 releases
curl -X POST http://localhost:5001/api/scraping-config/quick-scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://animepahe.com",
    "maxReleases": 50,
    "enablePagination": false
  }'

# Scrape multiple pages from GogoAnime
curl -X POST http://localhost:5001/api/scraping-config/quick-scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://gogoanime.com",
    "maxReleases": 30,
    "enablePagination": true,
    "maxPages": 3
  }'
```

### Example 3: Create Persistent Config

Create a configuration that can be reused and scheduled:

```bash
# Create config for AnimePahe
curl -X POST http://localhost:5001/api/scraping-config/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://animepahe.com",
    "configName": "AnimePahe Hourly Scraper"
  }'

# Create config for custom anime site
curl -X POST http://localhost:5001/api/scraping-config/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://custom-anime-site.com/latest",
    "configName": "Custom Site Daily"
  }'
```

## API Usage

### Using Postman or Insomnia

#### 1. Get Available Adapters

```
GET http://localhost:5001/api/scraping-config/adapters/available
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "animepahe",
      "name": "AnimePahe Default",
      "domains": ["animepahe.com", "animepahe.ru"],
      "supportsPagination": true,
      "usesPuppeteer": true
    }
  ]
}
```

#### 2. Test Scraping

```
POST http://localhost:5001/api/scraping-config/test-url
Content-Type: application/json

{
  "url": "https://animepahe.com",
  "maxReleases": 20,
  "enablePagination": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "adapter": "AnimePahe Default",
    "adapterKey": "animepahe",
    "releaseCount": 20,
    "duration": "3245ms",
    "sampleReleases": [
      {
        "title": "One Piece - 1100",
        "animeName": "One Piece",
        "episodeNumber": 1100,
        "thumbnailUrl": "https://...",
        "watchUrl": "https://animepahe.com/play/..."
      }
    ]
  }
}
```

#### 3. Quick Scrape & Save

```
POST http://localhost:5001/api/scraping-config/quick-scrape
Content-Type: application/json

{
  "url": "https://animepahe.com",
  "maxReleases": 50,
  "enablePagination": true,
  "maxPages": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scraped and saved 45 new releases (5 duplicates skipped)",
  "data": {
    "savedCount": 45,
    "duplicateCount": 5
  }
}
```

## Programmatic Usage

### Node.js Examples

#### Example 1: Test Multiple Sites

```javascript
const scrapingService = require('./services/scrapingService');

async function testMultipleSites() {
  const sites = [
    'https://animepahe.com',
    'https://gogoanime.com',
    'https://animekai.to'
  ];
  
  for (const url of sites) {
    console.log(`Testing ${url}...`);
    
    try {
      const result = await scrapingService.testScrape(url, {
        maxReleases: 5
      });
      
      if (result.success) {
        console.log(`✓ ${result.adapter}: ${result.releaseCount} releases found`);
      } else {
        console.log(`✗ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testMultipleSites();
```

#### Example 2: Auto-Detect and Process

```javascript
const scrapingService = require('./services/scrapingService');

async function scrapeAndFilter(url) {
  // Scrape without saving
  const releases = await scrapingService.scrapeAnyUrl(url, {
    maxReleases: 100,
    enablePagination: true,
    maxPages: 5
  });
  
  // Filter for specific anime
  const onePieceEpisodes = releases.filter(r => 
    r.animeName.toLowerCase().includes('one piece')
  );
  
  // Filter for complete episodes only
  const completeEpisodes = releases.filter(r => r.isComplete);
  
  console.log(`Total: ${releases.length}`);
  console.log(`One Piece: ${onePieceEpisodes.length}`);
  console.log(`Complete: ${completeEpisodes.length}`);
  
  // Save filtered results
  await scrapingService.saveReleases(completeEpisodes);
}

scrapeAndFilter('https://animepahe.com');
```

#### Example 3: Create Configs for Multiple Sites

```javascript
const scrapingService = require('./services/scrapingService');

async function setupMultiSiteConfigs() {
  const sites = [
    { url: 'https://animepahe.com', name: 'AnimePahe Daily' },
    { url: 'https://gogoanime.com', name: 'GogoAnime Hourly' },
    { url: 'https://9anime.to', name: '9Anime Daily' }
  ];
  
  const configs = [];
  
  for (const site of sites) {
    try {
      const config = await scrapingService.createConfigFromUrl(
        site.url,
        site.name
      );
      
      console.log(`✓ Created: ${config.name} (ID: ${config._id})`);
      configs.push(config);
      
    } catch (error) {
      console.log(`✗ Failed for ${site.name}: ${error.message}`);
    }
  }
  
  return configs;
}

setupMultiSiteConfigs();
```

#### Example 4: Batch Scraping with Error Handling

```javascript
const scrapingService = require('./services/scrapingService');

async function batchScrape(urls, options = {}) {
  const results = {
    successful: [],
    failed: []
  };
  
  for (const url of urls) {
    try {
      console.log(`Scraping ${url}...`);
      
      const result = await scrapingService.quickScrapeAndSave(url, {
        maxReleases: options.maxReleases || 50,
        enablePagination: options.enablePagination || false,
        maxPages: options.maxPages || 1
      });
      
      results.successful.push({
        url,
        ...result
      });
      
      console.log(`✓ Saved ${result.savedCount} releases`);
      
    } catch (error) {
      results.failed.push({
        url,
        error: error.message
      });
      
      console.log(`✗ Failed: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Summary
  console.log('\n=== Batch Scrape Summary ===');
  console.log(`Successful: ${results.successful.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  return results;
}

// Usage
const urls = [
  'https://animepahe.com',
  'https://gogoanime.com',
  'https://animekai.to'
];

batchScrape(urls, {
  maxReleases: 30,
  enablePagination: false
});
```

## Real-World Scenarios

### Scenario 1: Daily Multi-Site Scraping

Set up scheduled scraping from multiple anime sites:

```javascript
const cron = require('node-cron');
const scrapingService = require('./services/scrapingService');

// Schedule: Every day at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Starting daily anime scrape...');
  
  const sites = [
    'https://animepahe.com',
    'https://gogoanime.com',
    'https://9anime.to'
  ];
  
  let totalSaved = 0;
  
  for (const url of sites) {
    try {
      const result = await scrapingService.quickScrapeAndSave(url, {
        maxReleases: 100,
        enablePagination: true,
        maxPages: 5
      });
      
      totalSaved += result.savedCount;
      console.log(`✓ ${url}: ${result.savedCount} new releases`);
      
      // Wait between sites
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`✗ Failed to scrape ${url}:`, error.message);
    }
  }
  
  console.log(`Daily scrape complete. Total: ${totalSaved} new releases`);
});
```

### Scenario 2: Adding a New Anime Site

When you discover a new anime site:

```bash
# Step 1: Test if it works
curl -X POST http://localhost:5001/api/scraping-config/test-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://new-anime-site.com",
    "maxReleases": 5
  }'

# Step 2: If successful, create a config
curl -X POST http://localhost:5001/api/scraping-config/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://new-anime-site.com",
    "configName": "New Site Daily Scraper"
  }'

# Step 3: Enable it
curl -X PATCH http://localhost:5001/api/scraping-config/{config_id}/toggle
```

### Scenario 3: Monitoring Specific Anime

Monitor for new episodes of specific anime:

```javascript
const scrapingService = require('./services/scrapingService');

async function monitorAnime(url, animeList) {
  // Scrape the site
  const releases = await scrapingService.scrapeAnyUrl(url, {
    maxReleases: 100,
    enablePagination: true,
    maxPages: 3
  });
  
  // Filter for monitored anime
  const monitored = releases.filter(release =>
    animeList.some(anime =>
      release.animeName.toLowerCase().includes(anime.toLowerCase())
    )
  );
  
  if (monitored.length > 0) {
    console.log(`Found ${monitored.length} new episodes!`);
    
    // Send notifications (implement your notification logic)
    for (const release of monitored) {
      console.log(`  - ${release.title}`);
      // await sendNotification(release);
    }
    
    // Save to database
    await scrapingService.saveReleases(monitored);
  }
  
  return monitored;
}

// Monitor specific anime
const myWatchlist = [
  'One Piece',
  'Naruto',
  'Attack on Titan',
  'My Hero Academia'
];

monitorAnime('https://animepahe.com', myWatchlist);
```

### Scenario 4: Site Comparison

Compare which site has the most recent updates:

```javascript
const scrapingService = require('./services/scrapingService');

async function compareS

ites() {
  const sites = [
    'https://animepahe.com',
    'https://gogoanime.com',
    'https://animekai.to'
  ];
  
  const results = await Promise.all(
    sites.map(async url => {
      try {
        const result = await scrapingService.testScrape(url, {
          maxReleases: 50
        });
        
        return {
          url,
          adapter: result.adapter,
          count: result.releaseCount,
          duration: result.duration
        };
      } catch (error) {
        return {
          url,
          error: error.message
        };
      }
    })
  );
  
  console.log('\n=== Site Comparison ===');
  results.forEach(result => {
    if (result.error) {
      console.log(`${result.url}: ERROR - ${result.error}`);
    } else {
      console.log(`${result.url}: ${result.count} releases (${result.duration})`);
    }
  });
}

compareSites();
```

## Tips & Best Practices

1. **Always test first**: Use `/test-url` before saving to database
2. **Respect rate limits**: Add delays between requests (2-5 seconds)
3. **Start small**: Test with 5-10 releases before scaling up
4. **Monitor success rates**: Check logs and stats regularly
5. **Handle errors**: Wrap API calls in try-catch blocks
6. **Use pagination wisely**: Limit to 5 pages max per session
7. **Cache results**: Avoid re-scraping the same data

## Troubleshooting

### Issue: No releases found

```javascript
// Try with different options
const result = await scrapingService.testScrape(url, {
  maxReleases: 50,  // Increase limit
  enablePagination: false  // Disable pagination
});

// Check the adapter being used
console.log('Adapter:', result.adapter);
console.log('Selectors:', result.selectors);
```

### Issue: Wrong site detected

```javascript
// Check which adapter is being used
const { detectSiteAdapter } = require('./config/siteAdapters');

const adapter = detectSiteAdapter('https://your-site.com');
console.log('Detected:', adapter.name);

// If wrong, add the site to the correct adapter's domains array
// in /config/siteAdapters.js
```

### Issue: Scraping too slow

```javascript
// Disable Puppeteer if the site doesn't need it
const result = await scrapingService.scrapeAnyUrl(url, {
  maxReleases: 30,
  enablePagination: false,  // Disable multi-page
  // Note: Can't override usePuppeteer from API, need to modify adapter
});
```

---

For more information, see the [Multi-Site Scraper Guide](./MULTI_SITE_SCRAPER_GUIDE.md).

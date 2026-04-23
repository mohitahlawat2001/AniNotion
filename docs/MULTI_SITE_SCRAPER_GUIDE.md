# Multi-Site Anime Scraper Guide

## Overview

The AniNotion scraping service now supports **automatic multi-site scraping** with intelligent site detection and pre-configured adapters for popular anime websites. You can scrape any anime site with just a URL - no manual configuration needed!

## ✨ Key Features

- **Automatic Site Detection**: Just provide a URL, the system detects which anime site it is
- **Pre-configured Adapters**: Built-in support for AnimePahe, AnimeKai, GogoAnime, 9Anime, and more
- **Generic Fallback**: Works with unknown sites using common HTML patterns
- **Zero Configuration**: Test scraping without creating configs
- **Quick Scrape & Save**: One-click scraping and database insertion
- **Test Mode**: Preview scraping results before committing

## 🎯 Supported Sites

The scraper comes with pre-configured adapters for:

| Site | Domains | DDoS Protection | Pagination |
|------|---------|----------------|------------|
| **AnimePahe** | animepahe.com, animepahe.ru | ✅ Yes (DDoS-Guard) | ✅ Yes |
| **AnimeKai** | animekai.to, animekai.com | ❌ No | ✅ Yes |
| **GogoAnime** | gogoanime.com, gogoanime.pe | ❌ No | ✅ Yes |
| **9Anime** | 9anime.to, 9anime.id | ✅ Yes (Cloudflare) | ✅ Yes |
| **Generic** | Any anime site | ⚠️ Auto-detect | ⚠️ Auto-detect |

## 🚀 Quick Start

### Method 1: Test Scraping (No Save)

Test any anime site URL without saving to database:

```bash
POST http://localhost:5001/api/scraping-config/test-url
Content-Type: application/json

{
  "url": "https://animekai.to",
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
    "adapter": "AnimeKai.to",
    "adapterKey": "animekai",
    "url": "https://animekai.to",
    "releaseCount": 20,
    "duration": "3245ms",
    "sampleReleases": [...],
    "selectors": {...},
    "timestamp": "2025-03-15T10:30:00.000Z"
  }
}
```

### Method 2: Quick Scrape & Save

Scrape and immediately save to database:

```bash
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

### Method 3: Create Persistent Config

Create a reusable scraping configuration:

```bash
POST http://localhost:5001/api/scraping-config/from-url
Content-Type: application/json

{
  "url": "https://gogoanime.com",
  "configName": "GogoAnime Daily Scraper"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scraping configuration created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "GogoAnime Daily Scraper",
    "sourceWebsite": "gogoanime",
    "sourceUrl": "https://gogoanime.com",
    "selectors": {...},
    "isActive": true
  }
}
```

## 📋 API Endpoints

### GET `/api/scraping-config/adapters/available`

Get list of all available site adapters.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "animepahe",
      "name": "AnimePahe Default",
      "sourceWebsite": "animepahe",
      "domains": ["animepahe.com", "animepahe.ru"],
      "defaultUrl": "https://animepahe.com",
      "supportsPagination": true,
      "usesPuppeteer": true
    },
    ...
  ]
}
```

### POST `/api/scraping-config/test-url`

Test scraping a URL without saving results.

**Request Body:**
```json
{
  "url": "https://anime-site.com",
  "maxReleases": 20,           // Optional (default: 20)
  "enablePagination": false,   // Optional (default: false)
  "maxPages": 1                // Optional (default: 1)
}
```

**Response:** Returns test results with adapter info and sample releases.

### POST `/api/scraping-config/quick-scrape`

Scrape and immediately save releases to database.

**Request Body:**
```json
{
  "url": "https://anime-site.com",
  "maxReleases": 50,           // Optional (default: 50)
  "enablePagination": true,    // Optional (default: false)
  "maxPages": 5                // Optional (default: 1)
}
```

**Response:** Returns count of saved and duplicate releases.

### POST `/api/scraping-config/from-url`

Create a persistent scraping configuration from URL.

**Request Body:**
```json
{
  "url": "https://anime-site.com",
  "configName": "My Config"    // Optional (auto-generated if not provided)
}
```

**Response:** Returns the created configuration document.

## 🔧 Using the Scraping Service Programmatically

### Import the Service

```javascript
const scrapingService = require('./services/scrapingService');
```

### Test Scraping

```javascript
// Test scrape any URL
const result = await scrapingService.testScrape('https://animekai.to', {
  maxReleases: 20,
  enablePagination: false
});

console.log(`Found ${result.releaseCount} releases using ${result.adapter}`);
console.log('Sample:', result.sampleReleases[0]);
```

### Quick Scrape & Save

```javascript
// Scrape and save in one call
const result = await scrapingService.quickScrapeAndSave('https://animepahe.com', {
  maxReleases: 50,
  enablePagination: true,
  maxPages: 3
});

console.log(`Saved: ${result.savedCount}, Duplicates: ${result.duplicateCount}`);
```

### Auto-Detect and Scrape

```javascript
// Just scrape, don't save yet
const releases = await scrapingService.scrapeAnyUrl('https://gogoanime.com', {
  maxReleases: 30,
  enablePagination: false
});

console.log(`Scraped ${releases.length} releases`);

// Process or filter releases as needed
const newReleases = releases.filter(r => r.isComplete);

// Save manually
await scrapingService.saveReleases(newReleases);
```

### Create Config from URL

```javascript
// Create persistent config
const config = await scrapingService.createConfigFromUrl(
  'https://9anime.to',
  'My 9Anime Config'
);

console.log(`Created config: ${config.name} (ID: ${config._id})`);

// Later, scrape using this config
const releases = await scrapingService.scrapeWithConfig(config);
```

## 🎨 Site Adapter Architecture

### Adapter Structure

Each site adapter contains:

```javascript
{
  name: 'Site Name',
  sourceWebsite: 'site_key',
  domains: ['site.com', 'site.to'],  // For auto-detection
  defaultUrl: 'https://site.com',
  
  selectors: {
    episodeWrap: '.episode-container',    // Main container
    dataId: 'data-id',                    // Unique identifier attribute
    thumbnail: 'img.poster',              // Episode thumbnail
    watchLink: 'a.watch',                 // Watch/play link
    animeName: '.title',                  // Anime name element
    animePageUrl: 'a.anime-link',         // Link to anime page
    episodeNumber: '.episode',            // Episode number element
    isComplete: '.status-complete'        // Complete status indicator
  },
  
  paginationConfig: {
    autoDetect: true,
    urlPattern: '?page={page}',           // URL pattern for pages
    nextLinkSelectors: [                  // CSS selectors for next button
      'a.next',
      'a[rel="next"]'
    ],
    pageAttributeSelector: '[data-page]',
    containerSelector: '.pagination'
  },
  
  settings: {
    maxReleasesToScrape: 50,
    requestDelayMs: 2000,
    enablePagination: true,
    maxPagesToScrape: 5,
    usePuppeteer: true,                   // Use browser automation
    waitForSelector: '.episode-container'  // Wait for this element
  }
}
```

### How Site Detection Works

1. **URL Parsing**: Extract hostname from provided URL
2. **Domain Matching**: Check against each adapter's domain list
3. **Adapter Selection**: Use matched adapter or fallback to generic
4. **Configuration**: Apply adapter's selectors and settings
5. **Scraping**: Execute with appropriate method (Puppeteer/Axios)

### Adding New Site Adapters

To add support for a new anime site:

1. Open `/config/siteAdapters.js`
2. Add a new entry to `siteAdapters` object:

```javascript
'mysite': {
  name: 'My Anime Site',
  sourceWebsite: 'mysite',
  domains: ['mysite.com'],
  defaultUrl: 'https://mysite.com',
  
  selectors: {
    // Inspect the site HTML and find the correct selectors
    episodeWrap: '.anime-card',
    thumbnail: '.thumbnail img',
    watchLink: '.watch-button',
    animeName: '.anime-title',
    episodeNumber: '.ep-num'
    // ... add all required selectors
  },
  
  paginationConfig: {
    autoDetect: true,
    urlPattern: '/page/{page}',
    nextLinkSelectors: ['a.next-page']
  },
  
  settings: {
    maxReleasesToScrape: 50,
    requestDelayMs: 2000,
    usePuppeteer: false  // true if site has bot protection
  }
}
```

3. Test the adapter:

```bash
POST /api/scraping-config/test-url
{
  "url": "https://mysite.com"
}
```

## 🛠️ Advanced Usage

### Custom Selector Override

You can override selectors even with auto-detection:

```javascript
const { detectSiteAdapter } = require('./config/siteAdapters');

// Get detected adapter
const adapter = detectSiteAdapter('https://animepahe.com');

// Override specific selectors
const customConfig = {
  ...adapter,
  selectors: {
    ...adapter.selectors,
    episodeWrap: '.custom-episode-class'  // Override
  }
};

// Scrape with custom config
const releases = await scrapingService.scrapeWithConfig(customConfig);
```

### Multi-Site Batch Scraping

```javascript
const sites = [
  'https://animepahe.com',
  'https://gogoanime.com',
  'https://9anime.to'
];

const results = await Promise.all(
  sites.map(url => scrapingService.testScrape(url, { maxReleases: 10 }))
);

results.forEach(result => {
  console.log(`${result.adapter}: ${result.releaseCount} releases`);
});
```

### Pagination Control

```javascript
// Scrape first 5 pages
const releases = await scrapingService.scrapeAnyUrl('https://animepahe.com', {
  enablePagination: true,
  maxPages: 5,
  maxReleases: 100  // Max per page
});

// Will scrape up to 500 releases (100 per page × 5 pages)
```

## 🔍 Troubleshooting

### Site Not Detected

If auto-detection fails:
1. Check if the domain is listed in an adapter
2. Try the generic adapter manually
3. Create a custom adapter for the site

### Selectors Not Working

If scraping returns empty results:
1. Use test mode to see what's being scraped
2. Inspect the site's HTML structure
3. Update selectors in the adapter
4. Check if the site uses dynamic JavaScript loading

### DDoS Protection

If you get blocked:
1. Set `usePuppeteer: true` in adapter settings
2. Increase `requestDelayMs` to 3000-5000ms
3. Enable pagination to reduce load per request
4. Consider using proxies (add to config)

### Invalid Releases

If scraped data is malformed:
1. Check selector accuracy with browser DevTools
2. Verify the site's HTML structure hasn't changed
3. Update the adapter's selector configuration

## 📊 Monitoring

### Check Adapter Status

```bash
GET /api/scraping-config/adapters/available
```

### Test Before Production

Always test new sites before adding to production:

```bash
# Test first
POST /api/scraping-config/test-url
{ "url": "https://new-site.com" }

# If successful, create config
POST /api/scraping-config/from-url
{ "url": "https://new-site.com" }

# Enable for scheduled scraping
PATCH /api/scraping-config/:id/toggle
```

## 🎯 Best Practices

1. **Always Test First**: Use `/test-url` before committing to database
2. **Respect Rate Limits**: Use appropriate `requestDelayMs` (2000ms minimum)
3. **Start with Single Page**: Test with pagination disabled first
4. **Monitor Success Rates**: Check `/stats` endpoint regularly
5. **Update Adapters**: Sites change structure - keep adapters updated
6. **Use Puppeteer Wisely**: Only enable for sites with bot protection (slower)
7. **Limit Page Count**: Don't scrape more than 10 pages per session

## 🚦 Next Steps

1. **Try the test endpoint** with your target anime site
2. **Create configs** for sites you want to scrape regularly
3. **Set up scheduled scraping** using existing cron jobs
4. **Monitor and adjust** adapter configurations as needed
5. **Contribute adapters** for new sites you add

## 🤝 Contributing

Found a site that doesn't work? Want to add a new adapter?

1. Test the site with generic adapter
2. Identify correct selectors using browser DevTools
3. Create adapter configuration
4. Test thoroughly
5. Submit your adapter configuration

---

**Need Help?** Check the logs for detailed scraping information:
- `[ScrapingService]` - Service operations
- `[SiteAdapter]` - Site detection
- `[Pagination]` - Multi-page scraping

Happy Scraping! 🎉

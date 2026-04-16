# Multi-Site Scraper - Quick Reference

## 🚀 Quick Start

### Test Any URL (No Save)
```bash
curl -X POST http://localhost:5001/api/scraping-config/test-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://anime-site.com", "maxReleases": 10}'
```

### Quick Scrape & Save
```bash
curl -X POST http://localhost:5001/api/scraping-config/quick-scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://anime-site.com", "maxReleases": 50}'
```

### Create Config
```bash
curl -X POST http://localhost:5001/api/scraping-config/from-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://anime-site.com", "configName": "My Config"}'
```

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/scraping-config/adapters/available` | List adapters |
| POST | `/api/scraping-config/test-url` | Test scraping |
| POST | `/api/scraping-config/quick-scrape` | Scrape & save |
| POST | `/api/scraping-config/from-url` | Create config |

## 🔧 Service Methods

```javascript
const scrapingService = require('./services/scrapingService');

// Test scraping (no save)
await scrapingService.testScrape(url, options);

// Quick scrape and save
await scrapingService.quickScrapeAndSave(url, options);

// Auto-detect and scrape
await scrapingService.scrapeAnyUrl(url, options);

// Create config from URL
await scrapingService.createConfigFromUrl(url, name);
```

## 🌐 Supported Sites

- ✅ AnimePahe (animepahe.com)
- ✅ AnimeKai (animekai.to)
- ✅ GogoAnime (gogoanime.com)
- ✅ 9Anime (9anime.to)
- ✅ Generic (any anime site)

## ⚙️ Options

```javascript
{
  url: "https://...",           // Required
  maxReleases: 50,              // Default: 50
  enablePagination: false,      // Default: false
  maxPages: 1                   // Default: 1
}
```

## 📊 Response Format

### Test Scrape
```json
{
  "success": true,
  "data": {
    "adapter": "AnimePahe Default",
    "adapterKey": "animepahe",
    "releaseCount": 20,
    "duration": "3245ms",
    "sampleReleases": [...]
  }
}
```

### Quick Scrape
```json
{
  "success": true,
  "message": "Scraped and saved 45 new releases",
  "data": {
    "savedCount": 45,
    "duplicateCount": 5
  }
}
```

## 🧪 Testing

```bash
cd scraping-notification-backend
node test-multi-site.js
```

## 📚 Documentation

- [Full Guide](./MULTI_SITE_SCRAPER_GUIDE.md)
- [Examples](./MULTI_SITE_EXAMPLES.md)
- [Implementation](./MULTI_SITE_IMPLEMENTATION_SUMMARY.md)

## 🔥 Common Commands

### Test Multiple Sites
```bash
# AnimePahe
curl -X POST localhost:5001/api/scraping-config/test-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://animepahe.com", "maxReleases": 10}'

# GogoAnime
curl -X POST localhost:5001/api/scraping-config/test-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://gogoanime.com", "maxReleases": 10}'
```

### Scrape with Pagination
```bash
curl -X POST localhost:5001/api/scraping-config/quick-scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://animepahe.com",
    "maxReleases": 30,
    "enablePagination": true,
    "maxPages": 5
  }'
```

### Get Available Adapters
```bash
curl http://localhost:5001/api/scraping-config/adapters/available
```

## 💡 Tips

1. **Always test first** with `/test-url`
2. **Start small** (5-10 releases)
3. **Use pagination** carefully (max 5 pages)
4. **Add delays** between requests (2-5 sec)
5. **Monitor logs** for issues

## 🐛 Troubleshooting

### No releases found
- Check if URL is correct
- Try with generic adapter
- Inspect site HTML structure

### Slow scraping
- Disable pagination
- Reduce maxReleases
- Check if site has bot protection

### Wrong site detected
- Check adapter domains
- Add site to correct adapter

## 🎯 Files to Know

```
/config/siteAdapters.js          # Adapter configurations
/services/scrapingService.js      # Scraping logic
/controllers/scrapingConfigController.js  # API handlers
/routes/scrapingConfig.js         # Route definitions
```

## 🚦 Quick Decision Tree

```
Want to scrape a site?
  ├─ Just testing? → Use /test-url
  ├─ One-time scrape? → Use /quick-scrape
  ├─ Regular scraping? → Use /from-url
  └─ Unknown site? → Generic adapter handles it
```

---

**More Help?**
- [Multi-Site Guide](./MULTI_SITE_SCRAPER_GUIDE.md) - Full documentation
- [Examples](./MULTI_SITE_EXAMPLES.md) - Code samples
- [Summary](./MULTI_SITE_IMPLEMENTATION_SUMMARY.md) - Implementation details

# Anime Scraping & Notification Backend

A microservice for scraping anime releases from external sources and providing a notification system API.

## Features

- 🕷️ Web scraping of anime release data with Puppeteer (bot protection bypass)
- 📄 **Multi-page scraping with intelligent pagination detection**
- ⏰ Scheduled automatic scraping (configurable interval)
- 📊 RESTful API for anime releases
- 🔔 User-specific notification tracking
- 🎯 Duplicate prevention
- 🔍 Filter by anime name, new releases, etc.
- 🛠️ Admin dashboard for scraping configuration
- 🔄 Manual scrape triggers per configuration

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- **Puppeteer** (Browser automation & bot bypass)
- Cheerio (HTML parsing)
- Node-cron (scheduling)
- Axios (HTTP requests)

## Installation

```bash
cd scraping-notification-backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update environment variables:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/anime-scraping
SCRAPE_INTERVAL_HOURS=6
ANIME_SOURCE_URL=https://animepahe.com
MAX_RELEASES_TO_SCRAPE=50
FRONTEND_URL=http://localhost:5173
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Manual Scrape
```bash
npm run scrape
```

## API Endpoints

### Get All Releases
```
GET /api/anime-releases?page=1&limit=12&isNew=true
```

### Get Unseen Releases
```
GET /api/anime-releases/unseen?userId=USER_ID&page=1&limit=12
```

### Get Statistics
```
GET /api/anime-releases/stats?userId=USER_ID
```

### Get Single Release
```
GET /api/anime-releases/:id
```

### Mark as Seen
```
POST /api/anime-releases/mark-seen
Body: {
  "releaseIds": ["id1", "id2"],
  "userId": "USER_ID"
}
```

### Trigger Manual Scrape
```
POST /api/anime-releases/scrape
```

## Data Model

```javascript
{
  title: String,          // "Anime Name - Episode 12"
  animeName: String,      // "Anime Name"
  episodeNumber: Number,  // 12
  thumbnailUrl: String,   // Image URL
  watchUrl: String,       // Watch link
  animePageUrl: String,   // Anime info page
  sourceWebsite: String,  // "animepahe"
  dataId: String,         // External ID
  releaseDate: Date,
  scrapedAt: Date,
  isNew: Boolean,
  isComplete: Boolean,
  seenBy: [ObjectId]      // Array of user IDs
}
```

## Scheduler

The service automatically scrapes anime releases at the configured interval (default: 6 hours). The scheduler:
- Runs on server startup (after 5 seconds)
- Executes periodically based on `SCRAPE_INTERVAL_HOURS`
- Marks releases older than 24 hours as not new

## Multi-Page Scraping

This service supports intelligent multi-page scraping with automatic pagination detection:

### Features
- ✅ **Auto-detect pagination**: Automatically finds next page links
- ✅ **Configurable page limits**: Set max pages per scrape (1-100)
- ✅ **Multiple detection strategies**: URL patterns, CSS selectors, data attributes
- ✅ **Duplicate prevention**: Skips already-scraped releases across pages
- ✅ **Rate limiting**: Respects delays between page requests

### Configuration

Enable pagination in your scraping configuration:

```json
{
  "enablePagination": true,
  "maxPagesToScrape": 5,
  "paginationConfig": {
    "autoDetect": true,
    "urlPattern": "?page={page}",
    "nextLinkSelectors": ["a.next-page", "a[rel=\"next\"]"],
    "containerSelector": ".pagination"
  }
}
```

### Detection Strategies (in order of priority)

1. **Next Link Selectors**: Finds "Next" button/link using CSS selectors
2. **URL Pattern**: Constructs URLs using pattern (e.g., `?page={page}`)
3. **Data Attributes**: Extracts pagination from `data-page` attributes
4. **Auto-Detection**: Analyzes HTML to discover pagination automatically

### Documentation

- 📖 [Pagination Guide](./PAGINATION_GUIDE.md) - Comprehensive pagination documentation
- 🎯 [Admin UI Guide](./ADMIN_UI_PAGINATION_GUIDE.md) - How to configure in admin panel
- ✅ [Test Results](./MULTI_PAGE_SCRAPING_TEST.md) - Verified test results

### Example: Scraping 3 Pages

```bash
# Enable pagination
curl -X PUT http://localhost:5001/api/scraping-config/{configId} \
  -H "Content-Type: application/json" \
  -d '{"enablePagination": true, "maxPagesToScrape": 3}'

# Trigger scrape
curl -X POST http://localhost:5001/api/scraping-config/{configId}/scrape

# Result: Scrapes 3 pages (e.g., 3 pages × 12 items = 36 total releases)
```

## Notes

- Respects rate limiting with configurable delays
- Prevents duplicate entries using compound indexes
- Tracks per-user viewing status
- Supports multiple anime sources (extensible)
- **Uses Puppeteer to bypass bot protection** (DDoS-Guard, Cloudflare, etc.)

## License

MIT

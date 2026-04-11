# Enhanced Scraping Service - Admin Configuration & Bot Protection

## 🔄 Updates (v1.1.0)

### ✅ Shared Database
- Now uses same MongoDB as `aninotion-backend` (database: `aninotion`)
- Access to User model for admin authentication
- Single source of truth for all data

### ✅ Admin Configuration System
- **ScrapingConfig model**: Admins can configure which sites to scrape
- **Multiple sources**: Support for multiple anime sites simultaneously
- **Custom selectors**: Configure CSS selectors for each site
- **Active/Inactive toggle**: Enable/disable scrapers without deleting them

### ✅ Enhanced Bot Protection
- **User-Agent Rotation**: 5+ different user agents
- **Request Delays**: Configurable delays between requests
- **Exponential Backoff**: Automatic retry with increasing delays
- **Realistic Headers**: Browser-like HTTP headers
- **Rate Limiting**: Tracks and limits request frequency
- **Error Recovery**: Graceful handling of failures

---

## 📋 Admin Configuration Management

### API Endpoints (Admin Only)

#### 1. Get All Scraping Configs
```bash
GET /api/scraping-config
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "config-id",
      "name": "AnimePahe Latest Releases",
      "sourceWebsite": "animepahe",
      "sourceUrl": "https://animepahe.com",
      "isActive": true,
      "lastScrapedAt": "2026-03-29T06:00:00.000Z",
      "lastScrapeStatus": "success",
      "totalReleasesFetched": 1250
    }
  ]
}
```

#### 2. Create New Scraping Config
```bash
POST /api/scraping-config
Content-Type: application/json

{
  "name": "GogoAnime Latest",
  "sourceWebsite": "gogoanime",
  "sourceUrl": "https://gogoanime3.co",
  "selectors": {
    "episodeWrap": ".anime-item",
    "dataId": "data-id",
    "thumbnail": ".anime-img img",
    "watchLink": ".play-btn",
    "animeName": ".anime-title a",
    "episodeNumber": ".episode-num"
  },
  "maxReleasesToScrape": 30,
  "requestDelayMs": 3000,
  "scrapeIntervalHours": 4,
  "isActive": true,
  "createdBy": "admin-user-id"
}
```

#### 3. Update Config
```bash
PUT /api/scraping-config/:id
Content-Type: application/json

{
  "maxReleasesToScrape": 100,
  "requestDelayMs": 1500,
  "isActive": true
}
```

#### 4. Test Config (Without Saving)
```bash
POST /api/scraping-config/:id/test
```

Returns sample of scraped data without saving to database.

#### 5. Trigger Manual Scrape
```bash
POST /api/scraping-config/:id/scrape
```

Immediately runs scraper for specific config.

#### 6. Toggle Active Status
```bash
PATCH /api/scraping-config/:id/toggle
```

Enable/disable a scraping configuration.

#### 7. Get Scraping Statistics
```bash
GET /api/scraping-config/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalConfigs": 3,
    "activeConfigs": 2,
    "inactiveConfigs": 1,
    "successfulScrapes": 150,
    "failedScrapes": 5,
    "totalReleasesFetched": 5430,
    "recentScrapes": [...]
  }
}
```

#### 8. Delete Config
```bash
DELETE /api/scraping-config/:id
```

---

## 🤖 Bot Protection Features

### 1. User-Agent Rotation
```javascript
userAgents: [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  'Mozilla/5.0 (X11; Linux x86_64)...',
  // Rotates randomly for each request
]
```

### 2. Realistic Headers
```javascript
{
  'User-Agent': '<random-from-pool>',
  'Accept': 'text/html,application/xhtml+xml,...',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
}
```

### 3. Request Delays & Rate Limiting
- Configurable delay between requests (default: 2000ms)
- Tracks request timestamps
- Enforces minimum delay
- Per-config delay settings

### 4. Exponential Backoff Retry
```javascript
async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  // Attempt 1: immediate
  // Attempt 2: wait 1000ms
  // Attempt 3: wait 2000ms
  // Attempt 4: wait 4000ms
}
```

### 5. Error Recovery
- Graceful failure handling
- Logs errors without crashing
- Updates config status on failure
- Continues with next config if one fails

---

## 🎯 Use Cases

### Scenario 1: Admin Adds New Source
```bash
# Admin creates config via API or admin panel
POST /api/scraping-config
{
  "name": "New Anime Site",
  "sourceUrl": "https://newsite.com",
  "selectors": { ... },
  "createdBy": "admin-id"
}

# System automatically includes it in scheduled scrapes
```

### Scenario 2: A Source Goes Down
```bash
# Admin disables problematic source
PATCH /api/scraping-config/config-id/toggle

# System skips it until re-enabled
```

### Scenario 3: Testing New Selectors
```bash
# Admin tests config without affecting production data
POST /api/scraping-config/config-id/test

# Returns sample without saving
# Admin adjusts selectors
# Tests again until working correctly
```

### Scenario 4: Manual Refresh
```bash
# Admin triggers immediate scrape for specific source
POST /api/scraping-config/config-id/scrape

# New releases appear immediately
```

---

## 🔧 Configuration Options

### ScrapingConfig Model Fields

```javascript
{
  // Basic Info
  name: "AnimePahe Latest",
  sourceWebsite: "animepahe",  // enum: animepahe, gogoanime, custom
  sourceUrl: "https://animepahe.com",
  
  // CSS Selectors (jQuery-style)
  selectors: {
    episodeWrap: ".episode-wrap",      // Container for each release
    dataId: "data-id",                  // Attribute name for unique ID
    thumbnail: ".episode-snapshot img", // Image selector
    watchLink: "a.play",                // Watch link selector
    animeName: ".episode-title a",      // Anime name selector
    animePageUrl: ".episode-title a",   // Anime page link
    episodeNumber: ".episode-number",   // Episode number selector
    isComplete: ".text-success"         // Complete marker selector
  },
  
  // Scraping Settings
  maxReleasesToScrape: 50,       // Limit per scrape
  requestDelayMs: 2000,          // Delay between requests
  scrapeIntervalHours: 6,        // How often to scrape
  
  // Status
  isActive: true,                // Enable/disable
  
  // Bot Protection
  userAgents: [...],             // Array of user agents
  customHeaders: {},             // Additional headers
  useProxy: false,               // Proxy support
  proxyUrl: "",                  // Proxy URL if enabled
  
  // Admin Tracking
  createdBy: ObjectId,           // Admin who created
  updatedBy: ObjectId,           // Last admin to update
  
  // Statistics
  lastScrapedAt: Date,
  lastScrapeStatus: "success",   // success, failed, partial, never
  lastScrapeError: "",
  totalReleasesFetched: 1250
}
```

---

## 📖 Admin Integration Examples

### React Admin Panel Component

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function ScrapingConfigPanel() {
  const [configs, setConfigs] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchConfigs();
    fetchStats();
  }, []);

  const fetchConfigs = async () => {
    const res = await axios.get('http://localhost:5001/api/scraping-config');
    setConfigs(res.data.data);
  };

  const fetchStats = async () => {
    const res = await axios.get('http://localhost:5001/api/scraping-config/stats');
    setStats(res.data.data);
  };

  const toggleConfig = async (id) => {
    await axios.patch(`http://localhost:5001/api/scraping-config/${id}/toggle`);
    fetchConfigs();
  };

  const triggerScrape = async (id) => {
    await axios.post(`http://localhost:5001/api/scraping-config/${id}/scrape`);
    fetchConfigs();
  };

  return (
    <div>
      <h2>Scraping Configurations</h2>
      <div>Total Releases: {stats.totalReleasesFetched}</div>
      
      {configs.map(config => (
        <div key={config._id}>
          <h3>{config.name}</h3>
          <p>Status: {config.isActive ? 'Active' : 'Inactive'}</p>
          <p>Last Scraped: {config.lastScrapedAt}</p>
          <p>Total Fetched: {config.totalReleasesFetched}</p>
          
          <button onClick={() => toggleConfig(config._id)}>
            {config.isActive ? 'Disable' : 'Enable'}
          </button>
          <button onClick={() => triggerScrape(config._id)}>
            Scrape Now
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 Getting Started

### 1. Seed Default Configuration
```bash
cd scraping-notification-backend
npm run seed
# Or with admin user ID:
npm run seed YOUR_ADMIN_USER_ID
```

### 2. Start Service
```bash
npm run dev
```

### 3. Verify Configuration
```bash
curl http://localhost:5001/api/scraping-config
```

### 4. Test a Config
```bash
curl -X POST http://localhost:5001/api/scraping-config/CONFIG_ID/test
```

---

## 🔒 Security Notes

1. **Admin-Only**: All config endpoints should be behind admin auth middleware
2. **Input Validation**: Validate all config inputs server-side
3. **Rate Limiting**: Add rate limiting to API endpoints
4. **Audit Logging**: Track who creates/modifies configs
5. **Proxy Support**: Use proxies for production to avoid IP bans

---

## 📝 Adding Custom Anime Sources

### Example: Adding GogoAnime

```javascript
{
  "name": "GogoAnime Recent",
  "sourceWebsite": "custom",
  "sourceUrl": "https://gogoanime3.co/home.html",
  "selectors": {
    "episodeWrap": ".items .item",
    "dataId": "data-id",
    "thumbnail": ".img img",
    "watchLink": "a",
    "animeName": ".name",
    "episodeNumber": ".episode",
    "isComplete": ".complete-tag"
  },
  "maxReleasesToScrape": 40,
  "requestDelayMs": 3000
}
```

### Steps:
1. Inspect target site HTML
2. Find CSS selectors for each field
3. Create config via API
4. Test with `/test` endpoint
5. Adjust selectors if needed
6. Activate config

---

## 🎉 Summary

✅ **Shared Database**: Single MongoDB instance with aninotion-backend
✅ **Admin Controls**: Full CRUD API for scraping configurations
✅ **Multi-Source**: Scrape from multiple anime sites simultaneously
✅ **Bot Protection**: User-Agent rotation, delays, retries, realistic headers
✅ **Monitoring**: Track success/failure, view stats, audit changes
✅ **Flexible**: Add new sources without code changes

The scraping service is now production-ready with enterprise-level features!

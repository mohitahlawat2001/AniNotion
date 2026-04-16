# Multi-Site Scraper Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User / Client                              │
│                     (Browser, cURL, Script)                         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTP Request
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Express API Server                          │
│                      (Port 5001 - Backend)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │             API Routes (/routes/scrapingConfig.js)           │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  GET  /adapters/available    → getAvailableAdapters()       │ │
│  │  POST /test-url               → testScrapeUrl()             │ │
│  │  POST /quick-scrape           → quickScrapeUrl()            │ │
│  │  POST /from-url               → createConfigFromUrl()       │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                         │
│                          ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │      Controller (scrapingConfigController.js)                │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  - Validate request parameters                               │ │
│  │  - Call scraping service methods                             │ │
│  │  - Format and return responses                               │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                         │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Scraping Service Layer                             │
│                   (scrapingService.js)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Core Methods:                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ testScrape(url, options)                                   │   │
│  │  - Auto-detects site                                       │   │
│  │  - Scrapes without saving                                  │   │
│  │  - Returns test results                                    │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ scrapeAnyUrl(url, options)                                 │   │
│  │  - Auto-detects site adapter                               │   │
│  │  - Creates temporary config                                │   │
│  │  - Scrapes using detected adapter                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ quickScrapeAndSave(url, options)                           │   │
│  │  - Calls scrapeAnyUrl()                                    │   │
│  │  - Saves releases to database                              │   │
│  │  - Returns save statistics                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ createConfigFromUrl(url, name)                             │   │
│  │  - Auto-detects site adapter                               │   │
│  │  - Creates persistent ScrapingConfig                       │   │
│  │  - Saves to database                                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Site Adapter System                                │
│                  (/config/siteAdapters.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ detectSiteAdapter(url)                                     │   │
│  │  1. Parse URL hostname                                     │   │
│  │  2. Match against adapter domains                          │   │
│  │  3. Return matched adapter or generic fallback             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Adapters Registry:                                                 │
│  ┌─────────────┬──────────────────────────────────────────────┐   │
│  │ animepahe   │ AnimePahe.com (DDoS-Guard, Pagination)      │   │
│  ├─────────────┼──────────────────────────────────────────────┤   │
│  │ animekai    │ AnimeKai.to (No protection, Pagination)     │   │
│  ├─────────────┼──────────────────────────────────────────────┤   │
│  │ gogoanime   │ GogoAnime.com (No protection, Pagination)   │   │
│  ├─────────────┼──────────────────────────────────────────────┤   │
│  │ 9anime      │ 9Anime.to (Cloudflare, Pagination)          │   │
│  ├─────────────┼──────────────────────────────────────────────┤   │
│  │ generic     │ Fallback for unknown sites                  │   │
│  └─────────────┴──────────────────────────────────────────────┘   │
│                                                                     │
│  Adapter Structure:                                                 │
│  {                                                                  │
│    name: string,                                                    │
│    domains: [string],                                               │
│    selectors: {                                                     │
│      episodeWrap, thumbnail, watchLink, animeName, etc.             │
│    },                                                               │
│    paginationConfig: {...},                                         │
│    settings: {...}                                                  │
│  }                                                                  │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Scraping Engine                                   │
│            (Puppeteer + Cheerio + Axios)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ fetchWithPuppeteer(url, selector)                           │  │
│  │  - Launches headless browser                                │  │
│  │  - Bypasses bot protection (DDoS-Guard, Cloudflare)         │  │
│  │  - Waits for dynamic content                                │  │
│  │  - Returns rendered HTML                                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ extractReleasesFromHtml(html, config)                       │  │
│  │  - Loads HTML with Cheerio                                  │  │
│  │  - Uses adapter selectors to find elements                  │  │
│  │  - Extracts: title, episode, thumbnail, links               │  │
│  │  - Returns array of release objects                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ scrapeMultiplePages(config)  (if pagination enabled)        │  │
│  │  - Detects next page URL                                    │  │
│  │  - Scrapes each page sequentially                           │  │
│  │  - Combines all releases                                    │  │
│  │  - Respects rate limits                                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Database Layer                                 │
│                    (MongoDB Atlas)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Collections:                                                       │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ AnimeRelease                                               │   │
│  │  - title, animeName, episodeNumber                         │   │
│  │  - thumbnailUrl, watchUrl, animePageUrl                    │   │
│  │  - sourceWebsite, dataId                                   │   │
│  │  - isNew, isComplete, scrapedAt                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ ScrapingConfig                                             │   │
│  │  - name, sourceUrl, sourceWebsite                          │   │
│  │  - selectors, paginationConfig                             │   │
│  │  - isActive, maxReleasesToScrape                           │   │
│  │  - lastScrapedAt, lastScrapeStatus                         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Anime (Normalized)                                         │   │
│  │  - name, slug, coverImage                                  │   │
│  │  - genres, status, releaseYear                             │   │
│  │  - episodeCount, sources                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Episode (Normalized)                                       │   │
│  │  - anime (ref), episodeNumber                              │   │
│  │  - title, thumbnail, sources                               │   │
│  │  - scrapedAt, watchCount                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

## Data Flow Example

### Example: Scraping AnimeKai.to

1. **Request**
   ```
   POST /api/scraping-config/test-url
   { "url": "https://animekai.to", "maxReleases": 10 }
   ```

2. **Site Detection**
   ```
   detectSiteAdapter("https://animekai.to")
   → Matches domain "animekai.to"
   → Returns "animekai" adapter
   ```

3. **Adapter Configuration**
   ```javascript
   {
     name: 'AnimeKai.to',
     selectors: {
       episodeWrap: '.aitem',
       thumbnail: '.thumb img',
       watchLink: 'a.play',
       animeName: '.title',
       episodeNumber: '.episode-number'
     },
     settings: {
       usePuppeteer: false,  // No bot protection
       maxReleasesToScrape: 50
     }
   }
   ```

4. **Scraping Process**
   ```
   fetchWithPuppeteer("https://animekai.to", ".aitem")
   → Browser loads page
   → Waits for .aitem elements
   → Returns HTML
   
   extractReleasesFromHtml(html, config)
   → Finds all .aitem elements
   → For each item:
       - Extract thumbnail from .thumb img
       - Extract title from .title
       - Extract watch link from a.play
       - Extract episode number from .episode-number
   → Returns array of 10 releases
   ```

5. **Response**
   ```json
   {
     "success": true,
     "data": {
       "adapter": "AnimeKai.to",
       "adapterKey": "animekai",
       "releaseCount": 10,
       "duration": "2341ms",
       "sampleReleases": [...]
     }
   }
   ```

## Key Components

### 1. Site Adapters (`siteAdapters.js`)
- **Purpose**: Configuration for each anime site
- **Contains**: Selectors, pagination rules, bot protection settings
- **Extensible**: Easy to add new sites

### 2. Scraping Service (`scrapingService.js`)
- **Purpose**: Core scraping logic
- **Features**: Auto-detection, multi-page, bot protection bypass
- **Methods**: testScrape, scrapeAnyUrl, quickScrapeAndSave

### 3. API Layer (`scrapingConfigController.js` + routes)
- **Purpose**: HTTP interface for scraping operations
- **Endpoints**: test-url, quick-scrape, from-url, adapters
- **Returns**: JSON responses with results

### 4. Scraping Engine (Puppeteer + Cheerio)
- **Puppeteer**: Browser automation for bot-protected sites
- **Cheerio**: Fast HTML parsing and selector extraction
- **Rate Limiting**: Delays between requests to respect sites

### 5. Database (MongoDB)
- **AnimeRelease**: Scraped episode data
- **ScrapingConfig**: Persistent scraping configurations
- **Anime + Episode**: Normalized schema for clean data

## Advantages of This Architecture

✅ **Modularity**: Each component has single responsibility  
✅ **Extensibility**: Add new sites without touching core code  
✅ **Testability**: Each layer can be tested independently  
✅ **Maintainability**: Clear separation of concerns  
✅ **Scalability**: Easy to add more adapters and sites  
✅ **Flexibility**: Multiple ways to use (API, programmatic, CLI)  

## Future Enhancements

🔮 **Planned Features**:
- [ ] Web UI for adapter management
- [ ] Real-time scraping dashboard
- [ ] Webhook notifications on new releases
- [ ] Custom selector testing tool
- [ ] Adapter marketplace/sharing
- [ ] Automated adapter updates
- [ ] ML-based selector detection

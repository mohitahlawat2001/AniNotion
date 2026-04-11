# Anime Site Pagination - Complete Guide

## 🎯 Pagination Discovery

### Site: animepahe.com

**Total Pages:** 518 pages  
**Items per page:** 12 episodes  
**Total possible results:** ~6,216 episodes

---

## 📊 Pagination Structure

### HTML Structure:
```html
<ul class="pagination">
  <li class="page-item disabled">
    <a class="page-link" data-page="1">« First</a>
  </li>
  <li class="page-item disabled">
    <a class="page-link prev-page" data-page="1">‹ Prev</a>
  </li>
  <li class="page-item active">
    <span class="page-link">1 (current)</span>
  </li>
  <li class="page-item">
    <a class="page-link next-page" data-page="2">Next ›</a>
  </li>
  <li class="page-item">
    <a class="page-link" data-page="518">Last »</a>
  </li>
</ul>
```

### Key Selectors:
- **Next page link:** `.page-link.next-page`
- **Next page number:** `[data-page]` attribute
- **Current page:** `.page-item.active .page-link`
- **Last page:** Last `.page-link[data-page]` value

---

## 🔗 URL Pattern

### Working URL Format:
```
https://animepahe.com/              → Page 1 (default)
https://animepahe.com/?page=2       → Page 2
https://animepahe.com/?page=3       → Page 3
https://animepahe.com/?page=518     → Page 518 (last)
```

### Verification:
✅ Direct URL navigation works  
✅ Query parameter: `?page=N`  
✅ No authentication required  
✅ Same DDoS-Guard protection applies

---

## 💡 Implementation Strategy

### Option 1: URL-Based Pagination (Recommended)
```javascript
const baseUrl = 'https://animepahe.com/';
const maxPages = 5; // Scrape first 5 pages

for (let page = 1; page <= maxPages; page++) {
  const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
  const html = await fetchWithPuppeteer(url);
  const releases = await parseReleases(html);
  await saveReleases(releases);
}
```

### Option 2: Extract Next Page from HTML
```javascript
const $ = cheerio.load(html);
const nextPageNumber = $('.page-link.next-page').attr('data-page');
const lastPageNumber = $('.page-link[data-page]').last().attr('data-page');

if (nextPageNumber) {
  const nextUrl = `${baseUrl}?page=${nextPageNumber}`;
  // Scrape next page...
}
```

---

## 🚀 Recommended Scraping Configuration

### Conservative Approach (Fast, Reliable):
```javascript
{
  maxPages: 3,               // First 3 pages = 36 episodes
  requestDelayMs: 5000,      // 5 seconds between pages
  totalTime: ~45 seconds     // Including DDoS bypass
}
```

### Moderate Approach (Balanced):
```javascript
{
  maxPages: 10,              // First 10 pages = 120 episodes
  requestDelayMs: 8000,      // 8 seconds between pages
  totalTime: ~3 minutes
}
```

### Aggressive Approach (Maximum Data):
```javascript
{
  maxPages: 50,              // First 50 pages = 600 episodes
  requestDelayMs: 10000,     // 10 seconds between pages
  totalTime: ~15 minutes
}
```

⚠️ **Warning:** Scraping too many pages too fast may:
- Trigger stricter bot protection
- Consume significant server resources
- Get your IP temporarily blocked

---

## 📝 Scraping Config Model Updates

### Add to ScrapingConfig Schema:
```javascript
{
  // Pagination settings
  enablePagination: {
    type: Boolean,
    default: false
  },
  
  maxPagesToScrape: {
    type: Number,
    default: 1,
    min: 1,
    max: 100  // Safety limit
  },
  
  paginationUrlPattern: {
    type: String,
    default: '?page={page}'  // {page} will be replaced
  },
  
  paginationSelector: {
    type: String,
    default: '.page-link.next-page'
  }
}
```

---

## 🎮 Admin UI Updates

### Add to ScrapingConfigForm:

```jsx
{/* Pagination Section */}
<div className="form-section">
  <h3>Pagination Settings</h3>
  
  <label>
    <input 
      type="checkbox" 
      checked={enablePagination}
      onChange={e => setEnablePagination(e.target.checked)}
    />
    Enable Multi-Page Scraping
  </label>
  
  {enablePagination && (
    <>
      <label>
        Max Pages to Scrape:
        <input 
          type="number" 
          min="1" 
          max="100"
          value={maxPages}
          onChange={e => setMaxPages(e.target.value)}
        />
        <small>Pages × 12 episodes = {maxPages * 12} total</small>
      </label>
      
      <label>
        URL Pattern:
        <input 
          type="text"
          value={paginationPattern}
          placeholder="?page={page}"
        />
        <small>Use {'{page}'} as placeholder</small>
      </label>
    </>
  )}
</div>
```

---

## 🔄 Updated Scraping Service

### New Method: `scrapeMultiplePages()`

```javascript
async scrapeMultiplePages(config) {
  const allReleases = [];
  const maxPages = config.maxPagesToScrape || 1;
  
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    try {
      console.log(`[Scraping] Page ${pageNum}/${maxPages}`);
      
      // Build URL
      const url = pageNum === 1 
        ? config.sourceUrl 
        : config.sourceUrl + config.paginationUrlPattern.replace('{page}', pageNum);
      
      // Fetch and parse
      const html = await this.fetchWithPuppeteer(url, config.selectors.episodeWrap);
      const $ = cheerio.load(html);
      const releases = this.extractReleases($, config);
      
      allReleases.push(...releases);
      
      // Check if we reached the end
      const hasNextPage = $('.page-link.next-page').length > 0 && 
                          !$('.page-link.next-page').parent().hasClass('disabled');
      
      if (!hasNextPage) {
        console.log(`[Scraping] Reached last page at page ${pageNum}`);
        break;
      }
      
      // Delay between pages (respecting rate limits)
      if (pageNum < maxPages) {
        await this.delay(config.requestDelayMs);
      }
      
    } catch (error) {
      console.error(`[Scraping] Error on page ${pageNum}:`, error.message);
      // Continue with next page or stop depending on error handling strategy
    }
  }
  
  console.log(`[Scraping] Total releases from ${maxPages} pages: ${allReleases.length}`);
  return allReleases;
}
```

---

## 📈 Expected Results

### Single Page (Current):
- **Time:** ~10-15 seconds
- **Results:** 12 episodes
- **Database:** 12 new records

### 5 Pages (Recommended):
- **Time:** ~1 minute
- **Results:** ~60 episodes
- **Database:** 60 new records

### 10 Pages:
- **Time:** ~2 minutes
- **Results:** ~120 episodes
- **Database:** 120 new records

---

## 🛡️ Best Practices

1. **Start Small:** Test with 2-3 pages first
2. **Respect Delays:** Use 5-10 second delays between pages
3. **Monitor Performance:** Check scrape duration and success rate
4. **Handle Errors:** Skip failed pages, don't stop entire scrape
5. **Track Progress:** Log which page you're on
6. **Browser Cleanup:** Close browser after all pages scraped
7. **Database Batch:** Save releases in batches, not one-by-one

---

## 🎯 Quick Start

### To enable pagination for existing config:

1. **Update database:**
```javascript
db.scrapingconfigs.updateOne(
  { name: "test anime pahe" },
  {
    $set: {
      enablePagination: true,
      maxPagesToScrape: 5,
      paginationUrlPattern: "?page={page}"
    }
  }
)
```

2. **Test scrape:**
```bash
curl -X POST http://localhost:5001/api/scraping-config/:id/scrape
```

3. **Check results:**
```bash
curl http://localhost:5001/api/anime-releases?limit=60
```

---

## 📊 Pagination Summary

| Feature | Status | Details |
|---------|--------|---------|
| **Pattern Found** | ✅ | `?page=N` |
| **Total Pages** | ✅ | 518 pages available |
| **Selector** | ✅ | `.page-link.next-page[data-page]` |
| **Direct URLs** | ✅ | Work without clicking |
| **DDoS Protection** | ⚠️ | Applies to all pages |
| **Rate Limiting** | ⚠️ | Required (5-10s delay) |

---

**Ready to scrape multiple pages!** 🚀

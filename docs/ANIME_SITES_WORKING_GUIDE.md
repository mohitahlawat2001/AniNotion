# Working with Anime Sites - Complete Guide

## Quick Summary

**Current Status:**
- ✅ Multi-site scraper architecture implemented
- ✅ Automatic selector discovery tool created
- ✅ Cloudflare bypass with puppeteer-extra stealth plugin installed
- ⚠️ AnimeKai.to is Cloudflare-protected (Error 1015 - Rate Limited)
- ⚠️ Most major anime sites use Cloudflare protection

## The Challenge: Cloudflare Protection

### What We Found

When testing AnimeKai.to, we encountered:
```
Error 1015: You are being rate limited
The owner of this website has banned you temporarily
```

This is Cloudflare's bot protection system. Even with stealth mode, some sites have very aggressive protection.

### Why Stealth Plugin Isn't Enough

The `puppeteer-extra-plugin-stealth` helps with:
- ✅ Basic bot detection
- ✅ Headless browser detection
- ✅ WebDriver detection

But Cloudflare also checks:
- ❌ IP reputation (datacenter IPs get blocked)
- ❌ Browser fingerprinting (TLS, canvas, WebGL)
- ❌ Behavioral patterns (mouse movements, timing)
- ❌ Rate limiting (requests per minute)

## Recommended Solutions

### Option 1: Find Non-Protected Sites (Best for Now)

Test different anime sites to find ones without aggressive protection:

```bash
# Test a site
node inspect-html.js https://example-anime-site.com

# Check the output
# - If title contains "Cloudflare" or "Access denied" → Skip this site
# - If you see actual anime content → Good to use!
```

**Sites to Test:**
- Mirror sites of major anime platforms
- Smaller/newer anime aggregator sites
- RSS feeds from anime sites (often not protected)
- Official anime platform APIs (Crunchyroll, Funimation with auth)

### Option 2: Use API Endpoints Instead

Many anime sites have unofficial APIs that are less protected:

```bash
# Example: Some sites have JSON endpoints
curl https://example.com/api/recent
```

These often return structured data (JSON) that's easier to parse than HTML.

### Option 3: Advanced Cloudflare Bypass (Complex)

For sites you really need:

**A. Use Residential Proxies**
```bash
npm install proxy-chain
```

Services: Bright Data, Smartproxy, Oxylabs (paid)

**B. Use FlareSolverr**
```bash
docker run -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest
```

FlareSolverr is a proxy server that solves Cloudflare challenges.

**C. Use undetected-chromedriver (Python)**
```python
pip install undetected-chromedriver
```

More successful than Puppeteer for Cloudflare.

### Option 4: User-Provided Cookies

If YOU can access the site in your browser:

1. Visit the site in your browser
2. Pass Cloudflare check
3. Export cookies (use browser extension)
4. Load cookies into Puppeteer

```javascript
// Load cookies
const cookies = JSON.parse(fs.readFileSync('cookies.json'));
await page.setCookie(...cookies);
```

## Working Examples

### Example 1: Test a Site

```bash
cd scraping-notification-backend

# Test if site is accessible
node inspect-html.js https://targetsite.com

# If accessible, discover selectors
node discover-selectors.js https://targetsite.com

# Test scraping
curl -X POST http://localhost:5001/api/scraping-config/test-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://targetsite.com", "maxReleases": 5}'
```

### Example 2: Create New Site Adapter

If you find a working site:

```javascript
// config/siteAdapters.js

{
  name: 'NewAnimeSite',
  domains: ['newanimesite.com'],
  selectors: {
    episodeWrap: '.anime-card',  // From discover-selectors
    thumbnail: 'img.thumbnail',
    animeName: '.title',
    watchLink: 'a.watch-btn',
    episodeNumber: '.episode-num',
    animePageUrl: '.title a',
  },
  settings: {
    requestDelayMs: 2000,  // Be respectful!
    maxReleasesToScrape: 50,
    enablePagination: true
  }
}
```

## Tools We Built

### 1. inspect-html.js
**Purpose:** Save page HTML and take screenshot for manual inspection

**Usage:**
```bash
node inspect-html.js https://site.com
```

**Output:**
- `page-inspection.html` - Full HTML
- `page-screenshot.png` - Visual screenshot
- Console analysis of page structure

**When to use:** First step for any new site

### 2. discover-selectors.js
**Purpose:** Automatically find CSS selectors for anime episodes

**Usage:**
```bash
node discover-selectors.js https://site.com
```

**Output:**
- Suggested selectors for episodeWrap, thumbnail, etc.
- Code snippet ready to paste into adapter
- Test command to verify selectors

**When to use:** After confirming site is accessible

### 3. cloudflareBypass.js
**Purpose:** Service for fetching Cloudflare-protected pages

**Usage:**
```javascript
const CloudflareBypass = require('./services/cloudflareBypass');
const bypass = new CloudflareBypass();

const html = await bypass.fetchPage('https://site.com');
```

**Limitations:** Only works for basic Cloudflare protection

## Current Site Adapters

### AnimePahe (animepahe.si)
- **Status:** Originally working, domain may have changed
- **Protection:** None when working
- **Selectors:** `.episode-wrap`, `.episode-snapshot img`, etc.

### AnimeKai (animekai.to)  
- **Status:** ❌ Blocked (Cloudflare Error 1015)
- **Protection:** Aggressive Cloudflare
- **Selectors:** Placeholder (need to find working domain/bypass)

### GogoAnime
- **Status:** ⚠️ Not tested
- **Protection:** Likely protected
- **Selectors:** Placeholder

### 9Anime
- **Status:** ⚠️ Not tested
- **Protection:** Likely protected
- **Selectors:** Placeholder

### Generic Fallback
- **Status:** ✅ Works for simple sites
- **Protection:** None
- **Selectors:** Common patterns (`.episode`, `.anime-card`, etc.)

## Next Steps

### Immediate Actions

1. **Find working anime sites**
   ```bash
   # Test multiple sites
   node inspect-html.js https://site1.com
   node inspect-html.js https://site2.com
   node inspect-html.js https://site3.com
   ```

2. **Document which sites work**
   Create a compatibility list in README

3. **Update adapters with correct selectors**
   Use discover-selectors.js on working sites

### Future Enhancements

1. **Implement FlareSolverr integration**
   ```javascript
   // services/flareSolverr.js
   async function solveCloudflare(url) {
     const response = await axios.post('http://localhost:8191/v1', {
       cmd: 'request.get',
       url: url,
       maxTimeout: 60000
     });
     return response.data.solution.html;
   }
   ```

2. **Add proxy support**
   ```javascript
   settings: {
     useProxy: true,
     proxyUrl: 'http://user:pass@proxy.com:8080'
   }
   ```

3. **Implement rate limiting**
   ```javascript
   // Automatic backoff when blocked
   if (response.includes('rate limited')) {
     await sleep(60000); // Wait 1 minute
     retry();
   }
   ```

4. **Add RSS feed scraping**
   Many sites offer RSS feeds that are easier to parse

## Testing Checklist

When adding a new anime site:

- [ ] Test with inspect-html.js
- [ ] Verify no Cloudflare blocking
- [ ] Run discover-selectors.js
- [ ] Create adapter configuration
- [ ] Test with API endpoint
- [ ] Verify episode data is correct
- [ ] Check pagination works
- [ ] Add to site compatibility list
- [ ] Document any special requirements

## Resources

**Cloudflare Bypass:**
- FlareSolverr: https://github.com/FlareSolverr/FlareSolverr
- undetected-chromedriver: https://github.com/ultrafunkamsterdam/undetected-chromedriver
- puppeteer-extra-plugin-stealth: https://github.com/berstend/puppeteer-extra

**Anime Site Lists:**
- Search Reddit: r/animepiracy wiki
- Check anime aggregator sites
- Look for sites without Cloudflare

**Legal Considerations:**
- Always respect robots.txt
- Don't overload servers
- Follow site terms of service
- Consider official APIs first

## Conclusion

**What Works:**
- ✅ Multi-site architecture
- ✅ Automatic selector discovery
- ✅ Basic Cloudflare bypass (stealth plugin)
- ✅ Testing and inspection tools

**What Needs Work:**
- ⚠️ Finding anime sites without aggressive protection
- ⚠️ Advanced Cloudflare bypass (FlareSolverr/proxies)
- ⚠️ Testing current adapters with working sites

**Recommended Path Forward:**
1. Focus on finding 2-3 working anime sites
2. Perfect the scraping for those sites
3. Only tackle Cloudflare bypass if absolutely needed
4. Consider RSS feeds or APIs as alternatives

The infrastructure is built and ready. We just need to find compatible anime sites or implement more advanced bypass techniques.

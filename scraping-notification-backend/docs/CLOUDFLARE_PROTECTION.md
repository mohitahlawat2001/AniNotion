# Cloudflare Protection Guide

## Problem

Many anime sites (including animekai.to) use Cloudflare protection to block automated scrapers. When you try to scrape these sites, you get:

```
Error 1015: You are being rate limited
The owner of this website has banned you temporarily from accessing this website.
```

## Why This Happens

Cloudflare detects:
- Automated browser patterns (Puppeteer/Selenium)
- Missing browser fingerprints
- Suspicious request patterns
- Rapid consecutive requests

## Solutions

### Option 1: Use Alternative Sites (Recommended)

Use anime sites that don't have aggressive Cloudflare protection:

**Working Sites:**
- animepahe.si ✅ (currently working)
- Some mirror sites without Cloudflare

**Protected Sites:**
- animekai.to ❌ (Cloudflare error 1015)
- 9anime.to ❌ (likely protected)
- gogoanime ❌ (may be protected)

### Option 2: Bypass Cloudflare (Advanced)

Use specialized tools:

#### A. puppeteer-extra with stealth plugin

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

```javascript
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage'
  ]
});
```

#### B. playwright with stealth mode

```bash
npm install playwright playwright-extra playwright-extra-plugin-stealth
```

#### C. Use a third-party service

- ScraperAPI
- Bright Data
- Crawlera

These services handle Cloudflare bypass for you (paid).

### Option 3: Manual Site Configuration

If you have legitimate access to a Cloudflare-protected site:

1. **Get cookies from browser**: Log in with your real browser, export cookies
2. **Use in scraper**: Add cookies to Puppeteer requests
3. **Respect rate limits**: Add longer delays between requests

```javascript
// Add cookies
await page.setCookie(...cookiesFromBrowser);

// Longer delays
settings: {
  requestDelayMs: 5000, // 5 seconds between requests
  maxReleasesToScrape: 10 // Limit to 10 items
}
```

## Current Status

**animepahe.si** works reliably without Cloudflare issues. Other sites will need:

1. Implementation of puppeteer-extra with stealth plugin
2. OR finding alternative sites without protection
3. OR manual cookie injection with rate limiting

## Recommended Approach

**For now**: Focus on sites that work (animepahe.si)

**For future**: 
1. Test other anime sites to find which ones don't use Cloudflare
2. Implement puppeteer-extra stealth plugin if needed
3. Create a "site compatibility list" documenting which sites work

## Testing Site Compatibility

Use our HTML inspector:

```bash
node inspect-html.js https://example-anime-site.com
```

Check the saved HTML file:
- If it contains "Cloudflare" or "rate limited" → Protected ❌
- If it contains anime content → Working ✅

## Example: Testing a New Site

```bash
# Test if site is accessible
node inspect-html.js https://newanimesite.com

# Check the title in output
# Title should be the actual site title, not "Access denied"

# If working, create adapter
node discover-selectors.js https://newanimesite.com
```

## Next Steps

1. **Document working sites**: Maintain a list of sites that work
2. **Implement stealth mode**: Add puppeteer-extra for protected sites
3. **Add retry logic**: Exponential backoff when rate limited
4. **Rotate user agents**: Use different browser signatures
5. **Use proxies**: For high-volume scraping

## Code Example: Stealth Mode Implementation

```javascript
// services/cloudflareBypass.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class CloudflareBypass {
  async fetchWithBypass(url) {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Navigate
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Wait for Cloudflare check
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const html = await page.content();
    
    await browser.close();
    
    return html;
  }
}

module.exports = CloudflareBypass;
```

## Prevention Tips

To avoid being blocked:

1. **Respect robots.txt**: Don't scrape disallowed paths
2. **Add delays**: Wait 2-5 seconds between requests
3. **Limit volume**: Don't scrape thousands of pages
4. **Cache results**: Store data to reduce repeated requests
5. **Use cron wisely**: Schedule scraping during off-peak hours
6. **Identify yourself**: Use a custom User-Agent with contact info

## Legal & Ethical Considerations

- ✅ Scraping for personal use (watching anime)
- ✅ Scraping public data (release lists)
- ❌ Bypassing paywalls
- ❌ Scraping private/member content
- ❌ High-volume scraping that impacts site performance
- ❌ Ignoring cease & desist requests

Always respect the website's terms of service and robots.txt file.

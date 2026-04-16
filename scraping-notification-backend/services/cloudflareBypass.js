/**
 * Cloudflare Bypass Service
 * Uses puppeteer-extra with stealth plugin to bypass Cloudflare protection
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Add stealth plugin
puppeteer.use(StealthPlugin());

class CloudflareBypass {
  constructor() {
    this.browser = null;
  }

  /**
   * Fetch a Cloudflare-protected page
   * @param {string} url - The URL to fetch
   * @param {object} options - Additional options
   * @returns {Promise<string>} HTML content
   */
  async fetchPage(url, options = {}) {
    const {
      waitTime = 5000,        // Time to wait for Cloudflare check
      timeout = 60000,        // Navigation timeout
      waitUntil = 'networkidle2'
    } = options;

    console.log(`[CloudflareBypass] Fetching ${url} with stealth mode...`);

    try {
      // Launch browser with stealth
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // Set realistic viewport
      await page.setViewport({ 
        width: 1920, 
        height: 1080,
        deviceScaleFactor: 1
      });

      // Set realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set additional headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      // Navigate to page
      console.log(`[CloudflareBypass] Navigating to ${url}...`);
      await page.goto(url, { 
        waitUntil,
        timeout 
      });

      // Wait for Cloudflare check to complete
      console.log(`[CloudflareBypass] Waiting ${waitTime}ms for Cloudflare check...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Check if we're still on Cloudflare page
      const title = await page.title();
      if (title.includes('Cloudflare') || title.includes('Access denied')) {
        console.log('[CloudflareBypass] Warning: Still on Cloudflare page');
        console.log(`[CloudflareBypass] Title: ${title}`);
        
        // Wait a bit longer
        console.log('[CloudflareBypass] Waiting additional 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Get HTML content
      const html = await page.content();
      console.log(`[CloudflareBypass] Page fetched: ${html.length} characters`);

      await browser.close();

      return html;

    } catch (error) {
      console.error(`[CloudflareBypass] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test if a URL is Cloudflare-protected
   * @param {string} url - The URL to test
   * @returns {Promise<object>} Test results
   */
  async testProtection(url) {
    try {
      const html = await this.fetchPage(url, { waitTime: 10000 });
      
      const isProtected = html.includes('Cloudflare') && 
                         (html.includes('Access denied') || 
                          html.includes('rate limited') ||
                          html.includes('checking your browser'));

      const hasContent = html.length > 10000; // Rough check for actual content

      return {
        url,
        isProtected,
        hasContent,
        htmlLength: html.length,
        status: isProtected ? 'BLOCKED' : (hasContent ? 'ACCESSIBLE' : 'UNKNOWN'),
        html: html.substring(0, 500) // First 500 chars for inspection
      };

    } catch (error) {
      return {
        url,
        isProtected: true,
        hasContent: false,
        status: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * Scrape with Cloudflare bypass
   * Wrapper for scraping service
   */
  async scrapeWithBypass(url, selectors) {
    const html = await this.fetchPage(url);
    
    // Now parse with cheerio as usual
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    const results = [];
    
    $(selectors.episodeWrap).each((i, element) => {
      const $el = $(element);
      
      const thumbnail = $el.find(selectors.thumbnail).attr('src') || 
                       $el.find(selectors.thumbnail).attr('data-src');
      const animeName = $el.find(selectors.animeName).text().trim();
      const watchLink = $el.find(selectors.watchLink).attr('href');
      const episodeNumber = $el.find(selectors.episodeNumber).text().trim();
      
      if (animeName && watchLink) {
        results.push({
          animeName,
          episodeNumber,
          thumbnail,
          watchLink,
          dataId: $el.attr('data-id')
        });
      }
    });
    
    return results;
  }
}

module.exports = CloudflareBypass;

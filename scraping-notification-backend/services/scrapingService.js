const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const AnimeRelease = require('../models/AnimeRelease');
const ScrapingConfig = require('../models/ScrapingConfig');

class ScrapingService {
  constructor() {
    this.baseUrl = process.env.ANIME_SOURCE_URL || 'https://animepahe.com';
    this.maxReleases = parseInt(process.env.MAX_RELEASES_TO_SCRAPE) || 50;
    this.requestDelay = parseInt(process.env.SCRAPE_DELAY_MS) || 2000;
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT_MS) || 30000;
    
    // Bot protection: User-Agent rotation
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    
    // Track request count for rate limiting
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
    
    // Browser instance (reusable)
    this.browser = null;
  }

  // Helper to add delay between requests
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get random User-Agent for bot protection
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  // Launch or get existing browser
  async getBrowser() {
    if (!this.browser || !this.browser.isConnected()) {
      console.log('[ScrapingService] Launching Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
          '--disable-blink-features=AutomationControlled'
        ]
      });
    }
    return this.browser;
  }

  // Close browser when done
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('[ScrapingService] Browser closed');
    }
  }

  // Fetch page content using Puppeteer (bypasses DDoS-Guard, Cloudflare, etc.)
  async fetchWithPuppeteer(url, waitForSelector = null) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      // Set user agent
      await page.setUserAgent(this.getRandomUserAgent());
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Enable JavaScript
      await page.setJavaScriptEnabled(true);
      
      console.log(`[ScrapingService] Navigating to ${url}...`);
      
      // Navigate and wait for network to be idle
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.timeout 
      });
      
      // Check if we hit a challenge page
      let pageContent = await page.content();
      if (pageContent.includes('DDoS-Guard') || pageContent.includes('Checking your browser')) {
        console.log('[ScrapingService] DDoS protection detected, waiting for bypass...');
        
        // Wait for the challenge to complete (up to 15 seconds)
        await this.delay(5000);
        
        // Wait for actual content to load
        if (waitForSelector) {
          try {
            await page.waitForSelector(waitForSelector, { timeout: 15000 });
            console.log(`[ScrapingService] Selector ${waitForSelector} found after DDoS bypass`);
          } catch (e) {
            console.log('[ScrapingService] Selector not found after DDoS check, waiting more...');
            await this.delay(5000);
          }
        } else {
          // Default: wait for body content to change
          await page.waitForFunction(
            () => !document.body.innerHTML.includes('DDoS-Guard'),
            { timeout: 15000 }
          ).catch(() => console.log('[ScrapingService] Still on challenge page'));
        }
      } else if (waitForSelector) {
        // No DDoS challenge, but still wait for the selector
        try {
          await page.waitForSelector(waitForSelector, { timeout: 10000 });
          console.log(`[ScrapingService] Selector ${waitForSelector} found`);
        } catch (e) {
          console.log(`[ScrapingService] Warning: Selector ${waitForSelector} not found`);
        }
      }
      
      // Get final page content
      const html = await page.content();
      console.log(`[ScrapingService] Page loaded, content length: ${html.length}`);
      
      return html;
      
    } finally {
      await page.close();
    }
  }

  // Exponential backoff retry logic
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, i);
        console.log(`[ScrapingService] Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await this.delay(delay);
      }
    }
  }

  // Make request - tries Puppeteer first for sites with protection
  async makeRequest(url, config = null, usePuppeteer = true) {
    // Rate limiting: ensure minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await this.delay(this.requestDelay - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    // Use Puppeteer for sites known to have bot protection
    if (usePuppeteer) {
      const html = await this.fetchWithPuppeteer(url, '.episode-wrap');
      return { data: html };
    }

    // Fallback to axios for simple sites
    const requestConfig = config || {};
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
      ...requestConfig.headers
    };

    return await this.retryWithBackoff(async () => {
      return await axios.get(url, {
        timeout: this.timeout,
        headers,
        ...requestConfig
      });
    });
  }

  // Auto-detect next page URL from HTML
  detectNextPageUrl(html, baseUrl, currentPage, config) {
    const $ = cheerio.load(html);
    let nextUrl = null;

    // Default next link selectors to try
    const defaultNextSelectors = [
      'a.next-page',
      'a.page-link.next-page',
      'a[rel="next"]',
      'a:contains("Next")',
      'a:contains("›")',
      'a:contains(">")',
      '.pagination a:contains("Next")',
      '.pager a:contains("Next")'
    ];

    // Combine custom selectors with defaults
    const nextLinkSelectors = config.paginationConfig?.nextLinkSelectors?.length > 0
      ? config.paginationConfig.nextLinkSelectors
      : defaultNextSelectors;

    // Method 1: Try next link selectors
    for (const selector of nextLinkSelectors) {
      try {
        const $nextLink = $(selector).first();
        if ($nextLink.length > 0 && !$nextLink.parent().hasClass('disabled')) {
          // Check for href attribute
          const href = $nextLink.attr('href');
          if (href && href !== '#' && href !== 'javascript:void(0)') {
            nextUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
            console.log(`[Pagination] Found next URL via selector "${selector}": ${nextUrl}`);
            break;
          }
          
          // Check for data-page attribute
          const dataPage = $nextLink.attr('data-page');
          if (dataPage) {
            const pattern = config.paginationConfig?.urlPattern || '?page={page}';
            nextUrl = baseUrl + pattern.replace('{page}', dataPage);
            console.log(`[Pagination] Found next page via data-page: ${nextUrl}`);
            break;
          }
        }
      } catch (e) {
        // Skip invalid selector
      }
    }

    // Method 2: Try URL pattern if configured
    if (!nextUrl && config.paginationConfig?.urlPattern) {
      const nextPageNum = currentPage + 1;
      const pattern = config.paginationConfig.urlPattern;
      nextUrl = baseUrl + pattern.replace('{page}', nextPageNum);
      console.log(`[Pagination] Using URL pattern for page ${nextPageNum}: ${nextUrl}`);
    }

    // Method 3: Look for page number links and find next one
    if (!nextUrl && config.paginationConfig?.pageAttributeSelector) {
      const selector = config.paginationConfig.pageAttributeSelector;
      const $pages = $(selector);
      
      $pages.each((i, el) => {
        const pageNum = parseInt($(el).attr('data-page') || $(el).text());
        if (pageNum === currentPage + 1) {
          const href = $(el).attr('href');
          if (href) {
            nextUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
            console.log(`[Pagination] Found next page via page numbers: ${nextUrl}`);
            return false; // break
          }
        }
      });
    }

    return nextUrl;
  }

  // Check if there are more pages available
  hasMorePages(html, config) {
    const $ = cheerio.load(html);
    
    // Check if next button is disabled
    const nextButton = $('.next-page, a[rel="next"], a:contains("Next")').first();
    if (nextButton.length > 0) {
      const isDisabled = nextButton.parent().hasClass('disabled') || 
                        nextButton.hasClass('disabled') ||
                        nextButton.attr('disabled') === 'disabled';
      return !isDisabled;
    }
    
    return false;
  }

  // Extract releases from HTML (extracted to reusable method)
  extractReleasesFromHtml(html, config) {
    const $ = cheerio.load(html);
    const releases = [];
    const selectors = config.selectors;
    const maxReleases = config.maxReleasesToScrape || this.maxReleases;

    $(selectors.episodeWrap).each((index, element) => {
      if (index >= maxReleases) return false; // Limit releases per page

      const $elem = $(element);
      
      // Extract data using config selectors
      const dataId = $elem.attr(selectors.dataId);
      const $thumbnail = $elem.find(selectors.thumbnail);
      const thumbnailUrl = $thumbnail.attr('src') || $thumbnail.attr('data-src');
      const watchLink = $elem.find(selectors.watchLink).attr('href');
      const $animeName = $elem.find(selectors.animeName);
      const animeName = $animeName.attr('title') || $animeName.text().trim();
      const animePageUrl = $elem.find(selectors.animePageUrl).attr('href');
      
      // Extract episode number
      const episodeText = $elem.find(selectors.episodeNumber).text().trim();
      const episodeMatch = episodeText.match(/\d+/);
      const episodeNumber = episodeMatch ? parseInt(episodeMatch[0]) : null;
      
      // Check if episode is complete
      const isComplete = $elem.find(selectors.isComplete).length > 0;

      // Construct full title
      const title = episodeNumber 
        ? `${animeName} - ${episodeNumber}`
        : animeName;

      if (animeName && thumbnailUrl && watchLink) {
        releases.push({
          title,
          animeName,
          episodeNumber,
          thumbnailUrl,
          watchUrl: watchLink.startsWith('http') ? watchLink : `${config.sourceUrl}${watchLink}`,
          animePageUrl: animePageUrl && animePageUrl.startsWith('http') 
            ? animePageUrl 
            : animePageUrl ? `${config.sourceUrl}${animePageUrl}` : null,
          sourceWebsite: config.sourceWebsite,
          dataId,
          isComplete,
          isNew: true,
          scrapedAt: new Date()
        });
      }
    });

    return releases;
  }

  // Scrape multiple pages with auto-detection
  async scrapeMultiplePages(config) {
    try {
      const allReleases = [];
      const maxPages = config.enablePagination ? (config.maxPagesToScrape || 1) : 1;
      let currentPage = 1;
      let currentUrl = config.sourceUrl;

      console.log(`[ScrapingService] Multi-page scraping enabled: ${maxPages} pages max`);

      while (currentPage <= maxPages) {
        try {
          console.log(`[ScrapingService] Scraping page ${currentPage}/${maxPages} from ${currentUrl}`);
          
          // Fetch page with Puppeteer (bypasses DDoS-Guard)
          const html = await this.fetchWithPuppeteer(currentUrl, config.selectors.episodeWrap);
          
          // Extract releases from this page
          const pageReleases = this.extractReleasesFromHtml(html, config);
          console.log(`[ScrapingService] Found ${pageReleases.length} releases on page ${currentPage}`);
          
          allReleases.push(...pageReleases);

          // Check if there are more pages
          if (currentPage < maxPages) {
            // Auto-detect next page URL
            const nextUrl = this.detectNextPageUrl(html, config.sourceUrl, currentPage, config);
            
            if (!nextUrl) {
              console.log(`[ScrapingService] No next page found, stopping at page ${currentPage}`);
              break;
            }

            // Check if next button is disabled (reached end)
            if (!this.hasMorePages(html, config)) {
              console.log(`[ScrapingService] Reached last page at page ${currentPage}`);
              break;
            }

            currentUrl = nextUrl;
            currentPage++;

            // Delay between pages (important for bot protection)
            const delay = config.requestDelayMs || this.requestDelay;
            console.log(`[ScrapingService] Waiting ${delay}ms before next page...`);
            await this.delay(delay);
          } else {
            break;
          }

        } catch (error) {
          console.error(`[ScrapingService] Error scraping page ${currentPage}:`, error.message);
          
          // Decide whether to continue or stop
          // For now, we'll stop on error to be safe
          break;
        }
      }

      console.log(`[ScrapingService] Multi-page scrape complete: ${allReleases.length} total releases from ${currentPage} pages`);
      return allReleases;

    } catch (error) {
      console.error(`[ScrapingService] Error in multi-page scraping:`, error.message);
      throw error;
    }
  }

  // Scrape using a specific config (updated to support pagination)
  async scrapeWithConfig(config) {
    try {
      console.log(`[ScrapingService] Starting scrape from ${config.sourceUrl} using config: ${config.name}`);
      
      // Check if pagination is enabled
      if (config.enablePagination && config.maxPagesToScrape > 1) {
        return await this.scrapeMultiplePages(config);
      }
      
      // Single page scrape (original behavior)
      const html = await this.fetchWithPuppeteer(config.sourceUrl, config.selectors.episodeWrap);
      const releases = this.extractReleasesFromHtml(html, config);
      
      console.log(`[ScrapingService] Scraped ${releases.length} releases from ${config.name}`);
      return releases;

    } catch (error) {
      console.error(`[ScrapingService] Error scraping ${config.name}:`, error.message);
      throw error;
    }
  }

  // Scrape anime releases from default source (backward compatibility)
  async scrapeLatestReleases() {
    try {
      console.log(`[ScrapingService] Starting default scrape from ${this.baseUrl}`);
      
      // Use Puppeteer to bypass DDoS protection
      const html = await this.fetchWithPuppeteer(this.baseUrl, '.episode-wrap');

      const $ = cheerio.load(html);
      const releases = [];

      // Default selectors for animepahe
      $('.episode-wrap').each((index, element) => {
        if (index >= this.maxReleases) return false;

        const $elem = $(element);
        const dataId = $elem.attr('data-id');
        const thumbnailUrl = $elem.find('.episode-snapshot img').attr('src') || 
                            $elem.find('.episode-snapshot img').attr('data-src');
        const watchLink = $elem.find('a.play').attr('href');
        const animeName = $elem.find('.episode-title a').attr('title') || 
                         $elem.find('.episode-title a').text().trim();
        const animePageUrl = $elem.find('.episode-title a').attr('href');
        
        const episodeText = $elem.find('.episode-number').text().trim();
        const episodeMatch = episodeText.match(/\d+/);
        const episodeNumber = episodeMatch ? parseInt(episodeMatch[0]) : null;
        const isComplete = $elem.find('.episode-number.text-success').length > 0;

        const title = episodeNumber 
          ? `${animeName} - ${episodeNumber}`
          : animeName;

        if (animeName && thumbnailUrl && watchLink) {
          releases.push({
            title,
            animeName,
            episodeNumber,
            thumbnailUrl,
            watchUrl: watchLink.startsWith('http') ? watchLink : `${this.baseUrl}${watchLink}`,
            animePageUrl: animePageUrl && animePageUrl.startsWith('http') 
              ? animePageUrl 
              : animePageUrl ? `${this.baseUrl}${animePageUrl}` : null,
            sourceWebsite: 'animepahe',
            dataId,
            isComplete,
            isNew: true,
            scrapedAt: new Date()
          });
        }
      });

      console.log(`[ScrapingService] Scraped ${releases.length} releases`);
      return releases;

    } catch (error) {
      console.error('[ScrapingService] Error scraping:', error.message);
      throw error;
    }
  }

  // Scrape from all active configs
  async scrapeAllActiveConfigs() {
    try {
      const configs = await ScrapingConfig.find({ isActive: true });
      
      if (configs.length === 0) {
        console.log('[ScrapingService] No active scraping configs found, using default');
        const result = await this.scrapeAndSave();
        await this.closeBrowser(); // Clean up browser
        return result;
      }

      let totalSaved = 0;
      let totalDuplicates = 0;

      for (const config of configs) {
        try {
          console.log(`[ScrapingService] Processing config: ${config.name}`);
          const releases = await this.scrapeWithConfig(config);
          const result = await this.saveReleases(releases);
          
          totalSaved += result.savedCount;
          totalDuplicates += result.duplicateCount;

          // Update config
          config.lastScrapedAt = new Date();
          config.lastScrapeStatus = 'success';
          config.totalReleasesFetched += result.savedCount;
          await config.save();

          // Delay between configs
          if (config.requestDelayMs) {
            await this.delay(config.requestDelayMs);
          }

        } catch (error) {
          console.error(`[ScrapingService] Failed to scrape ${config.name}:`, error.message);
          
          // Update config with error
          config.lastScrapedAt = new Date();
          config.lastScrapeStatus = 'failed';
          config.lastScrapeError = error.message;
          await config.save();
        }
      }

      // Clean up browser after all scraping
      await this.closeBrowser();

      console.log(`[ScrapingService] Total: ${totalSaved} saved, ${totalDuplicates} duplicates`);
      return { savedCount: totalSaved, duplicateCount: totalDuplicates };

    } catch (error) {
      await this.closeBrowser(); // Clean up on error too
      console.error('[ScrapingService] Error in scrapeAllActiveConfigs:', error.message);
      throw error;
    }
  }

  // Save scraped releases to database (avoid duplicates)
  async saveReleases(releases) {
    try {
      let savedCount = 0;
      let duplicateCount = 0;

      for (const releaseData of releases) {
        try {
          // Check if release already exists
          const existing = await AnimeRelease.findOne({
            dataId: releaseData.dataId,
            episodeNumber: releaseData.episodeNumber
          });

          if (!existing) {
            await AnimeRelease.create(releaseData);
            savedCount++;
          } else {
            duplicateCount++;
          }
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error
            duplicateCount++;
          } else {
            console.error('[ScrapingService] Error saving release:', error.message);
          }
        }

        // Add delay to avoid overwhelming the database
        await this.delay(100);
      }

      console.log(`[ScrapingService] Saved ${savedCount} new releases, ${duplicateCount} duplicates skipped`);
      return { savedCount, duplicateCount };

    } catch (error) {
      console.error('[ScrapingService] Error saving releases:', error.message);
      throw error;
    }
  }

  // Main scraping workflow
  async scrapeAndSave() {
    try {
      console.log('[ScrapingService] Starting scrape and save workflow...');
      const releases = await this.scrapeLatestReleases();
      const result = await this.saveReleases(releases);
      console.log('[ScrapingService] Workflow completed successfully');
      return result;
    } catch (error) {
      console.error('[ScrapingService] Workflow failed:', error.message);
      throw error;
    }
  }

  // Mark old releases as not new (older than 24 hours)
  async markOldReleasesAsNotNew() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await AnimeRelease.updateMany(
        { 
          isNew: true,
          releaseDate: { $lt: oneDayAgo }
        },
        { isNew: false }
      );
      
      console.log(`[ScrapingService] Marked ${result.modifiedCount} old releases as not new`);
      return result;
    } catch (error) {
      console.error('[ScrapingService] Error marking old releases:', error.message);
      throw error;
    }
  }
}

module.exports = new ScrapingService();

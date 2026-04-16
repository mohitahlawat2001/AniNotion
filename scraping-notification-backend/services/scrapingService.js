const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const AnimeRelease = require('../models/AnimeRelease');
const ScrapingConfig = require('../models/ScrapingConfig');
const enhancedScrapingService = require('./enhancedScrapingService');
const { detectSiteAdapter, getAdapter, createConfigFromAdapter } = require('../config/siteAdapters');
const SCRAPER_BUILD_MARKER = 'anime-fallback-v4-anchor-discovery';

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

    console.log(`[ScrapingService] Build marker: ${SCRAPER_BUILD_MARKER} (${__filename})`);
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
      const getContentWithRetry = async (attempts = 3) => {
        let lastError = null;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            return await page.content();
          } catch (error) {
            lastError = error;
            const isNavigationRace = error.message?.includes('Execution context was destroyed');
            if (!isNavigationRace || attempt === attempts) {
              throw error;
            }
            console.log(`[ScrapingService] Page was navigating (attempt ${attempt}/${attempts}), retrying content read...`);
            await this.delay(1500);
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => null);
          }
        }
        throw lastError;
      };

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
      let pageContent = await getContentWithRetry();
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
            if (e.message?.includes('Execution context was destroyed')) {
              console.log('[ScrapingService] Navigation happened during selector wait, retrying...');
              await this.delay(1500);
              await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => null);
              await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => null);
            }
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
          if (e.message?.includes('Execution context was destroyed')) {
            console.log('[ScrapingService] Navigation happened during selector wait, retrying once...');
            await this.delay(1500);
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => null);
            await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => null);
          }
          console.log(`[ScrapingService] Warning: Selector ${waitForSelector} not found`);
        }
      }
      
      // Get final page content
      const html = await getContentWithRetry();
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
    const selectors = config.selectors;
    const maxReleases = config.maxReleasesToScrape || this.maxReleases;
    const sourceWebsite = this.getNormalizedSourceWebsite(config);
    const baseUrl = this.getBaseUrl(config?.sourceUrl);
    const looksLikeAnimekai = $('#latest-updates .aitem-wrapper .aitem').length > 0 || $('#featured .swiper-slide').length > 0;

    if (sourceWebsite === 'animekai' || looksLikeAnimekai) {
      const animekaiReleases = this.extractAnimekaiReleases($, config, maxReleases, baseUrl);
      if (animekaiReleases.length > 0) {
        return animekaiReleases;
      }
      console.log('[ScrapingService] AnimeKai-specific extraction found 0, trying generic DOM drill fallback...');
      const genericReleases = this.extractGenericReleases($, config, maxReleases, baseUrl);
      if (genericReleases.length > 0) {
        return genericReleases;
      }
      console.log('[ScrapingService] Generic DOM drill found 0, trying raw HTML link fallback...');
      return this.extractRawLinkReleases(html, config, maxReleases, baseUrl);
    }

    const releases = [];

    const episodeWrapCandidates = [selectors.episodeWrap];

    let selectedWrap = selectors.episodeWrap;
    for (const candidate of episodeWrapCandidates) {
      if (!candidate) continue;
      if ($(candidate).length > 0) {
        selectedWrap = candidate;
        break;
      }
    }

    if (selectedWrap !== selectors.episodeWrap) {
      console.log(
        `[ScrapingService] Using fallback episodeWrap selector "${selectedWrap}" for ${config.name}`
      );
    }

    $(selectedWrap).each((index, element) => {
      if (index >= maxReleases) return false; // Limit releases per page

      const $elem = $(element);
      const pickAttr = (selectorList, attrs) => {
        for (const selector of selectorList) {
          if (!selector) continue;
          const $found = selector === '__self__' ? $elem : $elem.find(selector);
          if (!$found.length) continue;
          for (const attr of attrs) {
            const value = $found.first().attr(attr);
            if (value) return value;
          }
        }
        return null;
      };

      const pickText = (selectorList) => {
        for (const selector of selectorList) {
          if (!selector) continue;
          const text = (selector === '__self__' ? $elem : $elem.find(selector)).first().text().trim();
          if (text) return text;
        }
        return '';
      };

      const thumbnailSelectors = sourceWebsite === 'animekai'
        ? [selectors.thumbnail, 'a.poster img', '.thumb img']
        : [selectors.thumbnail];
      const watchLinkSelectors = sourceWebsite === 'animekai'
        ? [selectors.watchLink, 'a.poster', 'a.title']
        : [selectors.watchLink];
      const animeNameSelectors = sourceWebsite === 'animekai'
        ? [selectors.animeName, 'a.title', '.title']
        : [selectors.animeName];
      const animePageUrlSelectors = sourceWebsite === 'animekai'
        ? [selectors.animePageUrl, 'a.poster', 'a.title']
        : [selectors.animePageUrl];
      
      // Extract data using config selectors
      const dataId = $elem.attr(selectors.dataId);
      const thumbnailUrl = pickAttr(thumbnailSelectors, ['src', 'data-src']);
      const watchLink = pickAttr(watchLinkSelectors, ['href']);
      const animeName = pickAttr(animeNameSelectors, ['title']) || pickText(animeNameSelectors);
      const animePageUrl = pickAttr(animePageUrlSelectors, ['href']);
      
      // Extract episode number
      let episodeText = $elem.find(selectors.episodeNumber).text().trim();
      if (!episodeText && sourceWebsite === 'animekai') {
        episodeText = $elem.find('.info').text().trim();
      }
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
          watchUrl: this.resolveUrl(watchLink, baseUrl),
          animePageUrl: this.resolveUrl(animePageUrl, baseUrl),
          sourceWebsite: config.sourceWebsite,
          dataId,
          isComplete,
          isNew: true,
          scrapedAt: new Date()
        });
      }
    });

    if (releases.length === 0) {
      console.log('[ScrapingService] Configured selectors found 0, trying generic DOM drill fallback...');
      const genericReleases = this.extractGenericReleases($, config, maxReleases, baseUrl);
      if (genericReleases.length > 0) {
        return genericReleases;
      }
      console.log('[ScrapingService] Generic DOM drill found 0, trying raw HTML link fallback...');
      return this.extractRawLinkReleases(html, config, maxReleases, baseUrl);
    }

    return releases;
  }

  extractAnimekaiReleases($, config, maxReleases, baseUrl) {
    const releases = [];
    const seen = new Set();
    const sourceWebsite = (config.sourceWebsite || 'animekai').toLowerCase();

    const parseBackgroundImage = (style) => {
      if (!style) return null;
      const match = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/i);
      return match ? match[2] : null;
    };

    const addRelease = (release) => {
      if (!release?.animeName || !release?.thumbnailUrl || !release?.watchUrl) return;
      const key = `${release.watchUrl}|${release.animeName}|${release.episodeNumber || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      releases.push({
        ...release,
        sourceWebsite,
        isNew: true,
        scrapedAt: new Date()
      });
    };

    // 1) Latest Updates cards
    $('#latest-updates .aitem-wrapper.regular .aitem').each((index, element) => {
      if (releases.length >= maxReleases) return false;
      const $elem = $(element);
      const watchLink = $elem.find('a.poster').attr('href');
      const animeName = $elem.find('a.title').attr('title') || $elem.find('a.title').text().trim();
      const thumbnailUrl = $elem.find('a.poster img').attr('src') || $elem.find('a.poster img').attr('data-src');
      const animePageUrl = (watchLink || '').split('#')[0] || null;
      const infoText = $elem.find('.info').text().trim();
      const episodeMatch = infoText.match(/\d+/);
      const episodeNumber = episodeMatch ? parseInt(episodeMatch[0], 10) : null;
      const dataId = $elem.find('.ttip-btn').attr('data-tip') || null;

      addRelease({
        title: episodeNumber ? `${animeName} - ${episodeNumber}` : animeName,
        animeName,
        episodeNumber,
        thumbnailUrl,
        watchUrl: this.resolveUrl(watchLink, baseUrl),
        animePageUrl: this.resolveUrl(animePageUrl, baseUrl),
        dataId,
        isComplete: $elem.find('.dub').length > 0
      });
    });

    // 2) Featured slider fallback
    if (releases.length < maxReleases) {
      $('#featured .swiper-slide').each((index, element) => {
        if (releases.length >= maxReleases) return false;
        const $elem = $(element);
        const animeName = $elem.find('.detail .title').first().text().trim();
        const watchLink = $elem.find('.watch-btn').attr('href');
        const infoText = $elem.find('.detail .info').first().text().trim();
        const episodeMatch = infoText.match(/\d+/);
        const episodeNumber = episodeMatch ? parseInt(episodeMatch[0], 10) : null;
        const thumbnailUrl = parseBackgroundImage($elem.attr('style'));

        addRelease({
          title: episodeNumber ? `${animeName} - ${episodeNumber}` : animeName,
          animeName,
          episodeNumber,
          thumbnailUrl,
          watchUrl: this.resolveUrl(watchLink, baseUrl),
          animePageUrl: this.resolveUrl(watchLink, baseUrl),
          dataId: $elem.find('[data-alid]').attr('data-alid') || null,
          isComplete: false
        });
      });
    }

    console.log(`[ScrapingService] AnimeKai extraction collected ${releases.length} releases`);
    return releases.slice(0, maxReleases);
  }

  extractGenericReleases($, config, maxReleases, baseUrl) {
    const releases = [];
    const seen = new Set();
    const sourceWebsite = this.getNormalizedSourceWebsite(config) || config.sourceWebsite || 'custom';

    const cardSelectors = [
      '#latest-updates .aitem',
      '#featured .swiper-slide',
      '.aitem',
      '.episode-wrap',
      '.episode',
      '.item',
      '.card',
      'article'
    ];

    const addRelease = (release) => {
      if (!release?.animeName || !release?.watchUrl) return;
      const thumbnailUrl = release.thumbnailUrl || `${baseUrl}/favicon.ico`;
      const key = `${release.watchUrl}|${release.animeName}|${release.episodeNumber || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      releases.push({
        ...release,
        thumbnailUrl,
        sourceWebsite,
        isNew: true,
        scrapedAt: new Date()
      });
    };

    const parseEpisodeNumber = (text = '') => {
      const match = String(text).match(/(?:ep(?:isode)?\s*[:#-]?\s*)?(\d{1,4})/i);
      return match ? parseInt(match[1], 10) : null;
    };

    const parseBackgroundImage = (style) => {
      if (!style) return null;
      const match = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/i);
      return match ? match[2] : null;
    };

    const inferNameFromWatchPath = (watchLink) => {
      if (!watchLink) return '';
      const path = watchLink.split('#')[0].split('?')[0];
      const slug = path.split('/').filter(Boolean).pop() || '';
      if (!slug) return '';
      const namePart = slug.replace(/-[a-z0-9]{3,8}$/i, '').replace(/-/g, ' ').trim();
      return namePart
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    for (const selector of cardSelectors) {
      if (releases.length >= maxReleases) break;
      const $nodes = $(selector);
      if (!$nodes.length) continue;

      $nodes.each((index, element) => {
        if (releases.length >= maxReleases) return false;
        const $elem = $(element);

        const $watch = $elem.find('a.poster[href], a.watch-btn[href], a.play[href], a[href*="/watch/"], a[href*="#ep="], a[href*="/play/"]').first();
        const watchLink = $watch.attr('href');
        if (!watchLink) return;

        const animeName =
          $elem.find('a.title').attr('title') ||
          $elem.find('a.title').first().text().trim() ||
          $elem.find('.title').first().text().trim() ||
          $elem.find('h6.title').first().text().trim() ||
          $elem.find('h3, h4, h5, h6').first().text().trim() ||
          $watch.attr('title') ||
          '';

        const thumbnailUrl =
          $elem.find('img').first().attr('src') ||
          $elem.find('img').first().attr('data-src') ||
          parseBackgroundImage($elem.attr('style'));

        const infoText = $elem.find('.info').text().trim() || $elem.text().trim();
        const episodeFromHref = parseEpisodeNumber((watchLink.match(/#ep=(\d+)/i) || [])[1]);
        const episodeNumber = episodeFromHref || parseEpisodeNumber(infoText);

        const animePageUrl = (watchLink || '').split('#')[0];

        addRelease({
          title: episodeNumber ? `${animeName} - ${episodeNumber}` : animeName,
          animeName,
          episodeNumber,
          thumbnailUrl: this.resolveUrl(thumbnailUrl, baseUrl),
          watchUrl: this.resolveUrl(watchLink, baseUrl),
          animePageUrl: this.resolveUrl(animePageUrl, baseUrl),
          dataId: $elem.attr('data-id') || $elem.find('[data-tip]').attr('data-tip') || null,
          isComplete: $elem.find('.dub').length > 0
        });
      });
    }

    // Final pass: scan all anchors for anime-associated links
    if (releases.length < maxReleases) {
      const anchorSelector = 'a[href*="/watch/"], a[href*="#ep="], a[href*="/play/"]';
      $(anchorSelector).each((index, element) => {
        if (releases.length >= maxReleases) return false;
        const $a = $(element);
        const watchLink = $a.attr('href');
        if (!watchLink) return;

        const $container = $a.closest('.aitem, .swiper-slide, .item, .card, article, li, div');
        const animeName =
          $container.find('a.title').attr('title') ||
          $container.find('a.title').first().text().trim() ||
          $container.find('.title').first().text().trim() ||
          $container.find('h3, h4, h5, h6').first().text().trim() ||
          $a.attr('title') ||
          $a.text().trim() ||
          inferNameFromWatchPath(watchLink);

        const thumbnailUrl =
          $container.find('img').first().attr('src') ||
          $container.find('img').first().attr('data-src') ||
          parseBackgroundImage($container.attr('style'));

        const infoText = $container.find('.info').text().trim() || $container.text().trim() || watchLink;
        const episodeFromHash = parseEpisodeNumber((watchLink.match(/#ep=(\d+)/i) || [])[1]);
        const episodeFromText = parseEpisodeNumber(infoText);
        const episodeNumber = episodeFromHash || episodeFromText;

        const animePageUrl = (watchLink || '').split('#')[0];

        addRelease({
          title: episodeNumber ? `${animeName} - ${episodeNumber}` : animeName,
          animeName,
          episodeNumber,
          thumbnailUrl: this.resolveUrl(thumbnailUrl, baseUrl),
          watchUrl: this.resolveUrl(watchLink, baseUrl),
          animePageUrl: this.resolveUrl(animePageUrl, baseUrl),
          dataId: $container.attr('data-id') || $container.find('[data-tip]').attr('data-tip') || null,
          isComplete: /dub/i.test(infoText)
        });
      });
    }

    console.log(`[ScrapingService] Generic DOM drill extracted ${releases.length} releases`);
    return releases.slice(0, maxReleases);
  }

  extractRawLinkReleases(html, config, maxReleases, baseUrl) {
    const releases = [];
    const seen = new Set();
    const sourceWebsite = this.getNormalizedSourceWebsite(config) || config.sourceWebsite || 'custom';

    const linkRegex = /href=["']([^"']*(?:\/watch\/|\/play\/)[^"']*)["']/gi;

    const inferNameFromWatchPath = (watchLink) => {
      const path = String(watchLink).split('#')[0].split('?')[0];
      const slug = path.split('/').filter(Boolean).pop() || '';
      const clean = slug.replace(/-[a-z0-9]{3,8}$/i, '').replace(/-/g, ' ').trim();
      return clean
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const parseEpisodeFromLink = (watchLink) => {
      const epFromHash = String(watchLink).match(/#ep=(\d{1,4})/i);
      if (epFromHash) return parseInt(epFromHash[1], 10);
      const epFromPath = String(watchLink).match(/(?:episode|ep)[-\/_]?(\d{1,4})/i);
      return epFromPath ? parseInt(epFromPath[1], 10) : null;
    };

    let match;
    while ((match = linkRegex.exec(html)) !== null && releases.length < maxReleases) {
      const watchLink = match[1];
      const watchUrl = this.resolveUrl(watchLink, baseUrl);
      if (!watchUrl || seen.has(watchUrl)) continue;
      seen.add(watchUrl);

      const episodeNumber = parseEpisodeFromLink(watchLink);
      const animeName = inferNameFromWatchPath(watchLink) || 'Unknown Anime';
      const animePageUrl = this.resolveUrl(String(watchLink).split('#')[0], baseUrl);

      releases.push({
        title: episodeNumber ? `${animeName} - ${episodeNumber}` : animeName,
        animeName,
        episodeNumber,
        thumbnailUrl: `${baseUrl}/favicon.ico`,
        watchUrl,
        animePageUrl,
        sourceWebsite,
        dataId: null,
        isComplete: false,
        isNew: true,
        scrapedAt: new Date()
      });
    }

    console.log(`[ScrapingService] Raw HTML link fallback extracted ${releases.length} releases`);
    return releases;
  }

  getNormalizedSourceWebsite(config) {
    const sourceWebsite = (config?.sourceWebsite || '').toLowerCase().trim();
    if (sourceWebsite && sourceWebsite !== 'custom') return sourceWebsite;

    let hostname = '';
    try {
      hostname = new URL(config?.sourceUrl || '').hostname.toLowerCase();
    } catch (error) {
      hostname = String(config?.sourceUrl || '').toLowerCase();
    }

    if (hostname.includes('animekai.')) return 'animekai';
    if (hostname.includes('animepahe.')) return 'animepahe';
    if (hostname.includes('gogoanime.')) return 'gogoanime';
    if (hostname.includes('9anime.')) return '9anime';

    const configName = String(config?.name || '').toLowerCase();
    if (configName.includes('animekai')) return 'animekai';
    if (configName.includes('animepahe')) return 'animepahe';
    if (configName.includes('gogoanime')) return 'gogoanime';
    if (configName.includes('9anime')) return '9anime';

    return '';
  }

  getEffectiveWaitSelector(config) {
    const sourceWebsite = this.getNormalizedSourceWebsite(config);
    if (sourceWebsite === 'animekai') {
      return '#latest-updates .aitem-wrapper .aitem';
    }
    return config?.selectors?.episodeWrap || null;
  }

  getBaseUrl(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch (error) {
      return url || '';
    }
  }

  resolveUrl(value, baseUrl) {
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    try {
      return new URL(value, `${baseUrl}/`).toString();
    } catch (error) {
      return value;
    }
  }

  // Scrape multiple pages with auto-detection
  async scrapeMultiplePages(config) {
    try {
      const allReleases = [];
      const maxPages = config.enablePagination ? (config.maxPagesToScrape || 1) : 1;
      let currentPage = 1;
      let currentUrl = config.sourceUrl;

      console.log(`[ScrapingService] Multi-page scraping enabled: ${maxPages} pages max`);
      const effectiveWaitSelector = this.getEffectiveWaitSelector(config);

      while (currentPage <= maxPages) {
        try {
          console.log(`[ScrapingService] Scraping page ${currentPage}/${maxPages} from ${currentUrl}`);
          
          // Fetch page with Puppeteer (bypasses DDoS-Guard)
          const html = await this.fetchWithPuppeteer(currentUrl, effectiveWaitSelector);
          
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
      console.log(`[ScrapingService] sourceWebsite="${config.sourceWebsite || ''}", sourceUrl="${config.sourceUrl || ''}"`);
      const sourceWebsite = this.getNormalizedSourceWebsite(config);
      const effectiveWaitSelector = this.getEffectiveWaitSelector(config);
      console.log(`[ScrapingService] Effective wait selector: ${effectiveWaitSelector || 'none'}`);
      
      // Check if pagination is enabled
      if (config.enablePagination && config.maxPagesToScrape > 1) {
        return await this.scrapeMultiplePages(config);
      }
      
      // Single page scrape (original behavior)
      const html = await this.fetchWithPuppeteer(config.sourceUrl, effectiveWaitSelector);
      let releases = this.extractReleasesFromHtml(html, config);

      if (releases.length === 0 && sourceWebsite === 'animekai') {
        console.log('[ScrapingService] HTML extraction returned 0 for animekai, trying live DOM evaluation fallback...');
        releases = await this.scrapeAnimekaiFromLiveDom(
          config.sourceUrl,
          config.maxReleasesToScrape || this.maxReleases
        );
      }
      
      console.log(`[ScrapingService] Scraped ${releases.length} releases from ${config.name}`);
      return releases;

    } catch (error) {
      console.error(`[ScrapingService] Error scraping ${config.name}:`, error.message);
      throw error;
    }
  }

  async scrapeAnimekaiFromLiveDom(url, maxReleases = 50) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    const baseUrl = this.getBaseUrl(url);

    try {
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setJavaScriptEnabled(true);

      console.log(`[ScrapingService] [DOM Fallback] Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.timeout });
      await this.delay(4000);

      await page.waitForSelector('a[href*="/watch/"]', { timeout: 10000 }).catch(() => {
        console.log('[ScrapingService] [DOM Fallback] Watch links selector not found in wait window');
      });

      const extracted = await page.evaluate((limit) => {
        const items = [];
        const seen = new Set();

        const parseEpisode = (text = '') => {
          const hashMatch = String(text).match(/#ep=(\d{1,4})/i);
          if (hashMatch) return parseInt(hashMatch[1], 10);
          const epMatch = String(text).match(/(?:ep(?:isode)?\s*[:#-]?\s*)?(\d{1,4})/i);
          return epMatch ? parseInt(epMatch[1], 10) : null;
        };

        const parseBg = (style = '') => {
          const m = String(style).match(/background-image:\s*url\((['"]?)(.*?)\1\)/i);
          return m ? m[2] : null;
        };

        const anchors = Array.from(document.querySelectorAll('a[href*="/watch/"], a[href*="#ep="], a.watch-btn'));

        for (const a of anchors) {
          if (items.length >= limit) break;
          const href = a.getAttribute('href');
          if (!href || seen.has(href)) continue;
          seen.add(href);

          const container =
            a.closest('.aitem, .swiper-slide, .inner, article, li, div') || a.parentElement || a;

          const titleEl = container.querySelector('a.title, .title, h3, h4, h5, h6');
          const animeName =
            titleEl?.getAttribute('title') ||
            titleEl?.textContent?.trim() ||
            a.getAttribute('title') ||
            a.textContent?.trim() ||
            '';
          if (!animeName) continue;

          const img = container.querySelector('img');
          const thumbnailUrl =
            img?.getAttribute('src') ||
            img?.getAttribute('data-src') ||
            parseBg(container.getAttribute('style') || '');

          const infoText = (container.querySelector('.info')?.textContent || container.textContent || '').trim();
          const episodeNumber = parseEpisode(href) || parseEpisode(infoText);

          items.push({
            animeName,
            episodeNumber,
            watchUrl: a.href || href,
            animePageUrl: (a.href || href).split('#')[0],
            thumbnailUrl: thumbnailUrl || null,
            dataId: container.querySelector('[data-tip]')?.getAttribute('data-tip') || null
          });
        }

        return items;
      }, maxReleases);

      const releases = extracted.map((item) => ({
        title: item.episodeNumber ? `${item.animeName} - ${item.episodeNumber}` : item.animeName,
        animeName: item.animeName,
        episodeNumber: item.episodeNumber,
        thumbnailUrl: item.thumbnailUrl || `${baseUrl}/favicon.ico`,
        watchUrl: this.resolveUrl(item.watchUrl, baseUrl),
        animePageUrl: this.resolveUrl(item.animePageUrl, baseUrl),
        sourceWebsite: 'animekai',
        dataId: item.dataId,
        isComplete: false,
        isNew: true,
        scrapedAt: new Date()
      }));

      console.log(`[ScrapingService] [DOM Fallback] Extracted ${releases.length} releases`);
      return releases;
    } finally {
      await page.close();
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
      const normalizedConfig = {
        sourceWebsite: releases[0]?.sourceWebsite || 'custom',
        maintainLegacySchema: true
      };

      const normalizedResult = await enhancedScrapingService.saveEpisodes(releases, normalizedConfig);
      const savedCount = (normalizedResult.saved || 0) + (normalizedResult.updated || 0);
      const duplicateCount = normalizedResult.duplicates || 0;

      console.log(
        `[ScrapingService] Normalized save complete: ${savedCount} processed (${normalizedResult.saved || 0} new, ${normalizedResult.updated || 0} updated), ${duplicateCount} duplicates`
      );
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

  /**
   * NEW: Scrape any anime site URL with automatic adapter detection
   * @param {string} url - The URL to scrape
   * @param {object} options - Optional scraping options
   * @returns {array} - Array of scraped releases
   */
  async scrapeAnyUrl(url, options = {}) {
    try {
      console.log(`[ScrapingService] Auto-detecting site for URL: ${url}`);
      
      // Detect which site this is
      const adapter = detectSiteAdapter(url);
      console.log(`[ScrapingService] Using adapter: ${adapter.name}`);
      
      // Create a temporary config from the adapter
      const config = {
        name: `Auto-detected: ${adapter.name}`,
        sourceWebsite: adapter.sourceWebsite,
        sourceUrl: url,
        selectors: adapter.selectors,
        paginationConfig: adapter.paginationConfig,
        maxReleasesToScrape: options.maxReleases || adapter.settings.maxReleasesToScrape,
        requestDelayMs: options.delayMs || adapter.settings.requestDelayMs,
        enablePagination: options.enablePagination !== undefined 
          ? options.enablePagination 
          : adapter.settings.enablePagination,
        maxPagesToScrape: options.maxPages || adapter.settings.maxPagesToScrape
      };
      
      // Scrape using the detected configuration
      const releases = await this.scrapeWithConfig(config);
      
      console.log(`[ScrapingService] Auto-scrape complete: ${releases.length} releases found`);
      return releases;
      
    } catch (error) {
      console.error(`[ScrapingService] Error in auto-scrape:`, error.message);
      throw error;
    }
  }

  /**
   * NEW: Create a persistent config from any URL
   * @param {string} url - The URL to create config for
   * @param {string} configName - Optional name for the config
   * @returns {object} - The created ScrapingConfig document
   */
  async createConfigFromUrl(url, configName = null) {
    try {
      console.log(`[ScrapingService] Creating config for URL: ${url}`);
      
      // Detect site adapter
      const adapter = detectSiteAdapter(url);
      
      // Create config object
      const configData = createConfigFromAdapter(adapter.key, url);
      
      // Override name if provided
      if (configName) {
        configData.name = configName;
      } else {
        configData.name = `${adapter.name} - ${new Date().toISOString().split('T')[0]}`;
      }
      
      // Save to database
      const config = await ScrapingConfig.create(configData);
      
      console.log(`[ScrapingService] Config created: ${config.name} (ID: ${config._id})`);
      return config;
      
    } catch (error) {
      console.error(`[ScrapingService] Error creating config:`, error.message);
      throw error;
    }
  }

  /**
   * NEW: Quick scrape and save from any URL
   * @param {string} url - The URL to scrape
   * @param {object} options - Optional scraping options
   * @returns {object} - Result with savedCount and duplicateCount
   */
  async quickScrapeAndSave(url, options = {}) {
    try {
      console.log(`[ScrapingService] Quick scrape and save from: ${url}`);
      
      // Scrape the URL
      const releases = await this.scrapeAnyUrl(url, options);
      
      // Save releases
      const result = await this.saveReleases(releases);
      
      // Clean up browser
      await this.closeBrowser();
      
      console.log(`[ScrapingService] Quick scrape complete: ${result.savedCount} saved, ${result.duplicateCount} duplicates`);
      return result;
      
    } catch (error) {
      await this.closeBrowser();
      console.error(`[ScrapingService] Error in quick scrape:`, error.message);
      throw error;
    }
  }

  /**
   * NEW: Test scraping a URL without saving (for testing adapters)
   * @param {string} url - The URL to test
   * @param {object} options - Optional scraping options
   * @returns {object} - Test results with releases and metadata
   */
  async testScrape(url, options = {}) {
    try {
      console.log(`[ScrapingService] Testing scrape for URL: ${url}`);
      
      const startTime = Date.now();
      
      // Detect adapter
      const adapter = detectSiteAdapter(url);
      
      // Scrape
      const releases = await this.scrapeAnyUrl(url, { ...options, maxPages: 1 });
      
      const duration = Date.now() - startTime;
      
      // Clean up
      await this.closeBrowser();
      
      // Return test results
      const result = {
        success: true,
        adapter: adapter.name,
        adapterKey: adapter.key,
        url,
        releaseCount: releases.length,
        duration: `${duration}ms`,
        sampleReleases: releases.slice(0, 3), // First 3 as samples
        selectors: adapter.selectors,
        timestamp: new Date()
      };
      
      console.log(`[ScrapingService] Test complete: ${result.releaseCount} releases found in ${result.duration}`);
      return result;
      
    } catch (error) {
      await this.closeBrowser();
      console.error(`[ScrapingService] Test failed:`, error.message);
      return {
        success: false,
        error: error.message,
        url,
        timestamp: new Date()
      };
    }
  }
}

module.exports = new ScrapingService();

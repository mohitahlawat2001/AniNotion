/**
 * Site Adapters Configuration
 * Pre-configured selectors and settings for popular anime sites
 * Each adapter can be used to automatically scrape that site
 */

const siteAdapters = {
  // AnimePahe.com - Original supported site
  'animepahe': {
    name: 'AnimePahe Default',
    sourceWebsite: 'animepahe',
    domains: ['animepahe.com', 'animepahe.ru', 'animepahe.org'],
    defaultUrl: 'https://animepahe.com',
    
    selectors: {
      episodeWrap: '.episode-wrap',
      dataId: 'data-id',
      thumbnail: '.episode-snapshot img',
      watchLink: 'a.play',
      animeName: '.episode-title a',
      animePageUrl: '.episode-title a',
      episodeNumber: '.episode-number',
      isComplete: '.episode-number.text-success'
    },
    
    paginationConfig: {
      autoDetect: true,
      urlPattern: '?page={page}',
      nextLinkSelectors: [
        'a.next-page',
        'a[rel="next"]',
        '.pagination a:contains("Next")'
      ],
      pageAttributeSelector: '[data-page]',
      containerSelector: '.pagination, nav[role="navigation"]'
    },
    
    settings: {
      maxReleasesToScrape: 50,
      requestDelayMs: 2000,
      enablePagination: true,
      maxPagesToScrape: 5,
      usePuppeteer: true, // AnimePahe has DDoS-Guard protection
      waitForSelector: '.episode-wrap'
    }
  },

  // AnimeKai.to - New site with different structure
  'animekai': {
    name: 'AnimeKai.to',
    sourceWebsite: 'animekai',
    domains: ['animekai.to', 'animekai.com'],
    defaultUrl: 'https://animekai.to',
    
    selectors: {
      episodeWrap: '#latest-updates .aitem-wrapper .aitem',
      dataId: 'data-id',
      thumbnail: 'a.poster img',
      watchLink: 'a.poster',
      animeName: 'a.title',
      animePageUrl: 'a.poster',
      episodeNumber: '.info',
      isComplete: '.episode-number.text-success, .badge-success, .fa-check'
    },
    
    paginationConfig: {
      autoDetect: true,
      urlPattern: '/page/{page}',
      nextLinkSelectors: [
        'a.next',
        'a[rel="next"]',
        '.pagination a:contains("Next")',
        '.pagination a:contains("›")'
      ],
      pageAttributeSelector: '[data-page]',
      containerSelector: '.pagination, .pager'
    },
    
    settings: {
      maxReleasesToScrape: 50,
      requestDelayMs: 2000,
      enablePagination: true,
      maxPagesToScrape: 5,
      usePuppeteer: true,
      waitForSelector: '#latest-updates .aitem-wrapper .aitem'
    }
  },

  // GogoAnime - Popular anime site
  'gogoanime': {
    name: 'GogoAnime',
    sourceWebsite: 'gogoanime',
    domains: ['gogoanime.com', 'gogoanime.pe', 'gogoanime3.net', 'gogoanime.vc'],
    defaultUrl: 'https://gogoanime3.net',
    
    selectors: {
      episodeWrap: '.items li',
      dataId: 'data-id',
      thumbnail: '.img img',
      watchLink: 'a',
      animeName: '.name',
      animePageUrl: 'a',
      episodeNumber: '.episode',
      isComplete: '.status.complete'
    },
    
    paginationConfig: {
      autoDetect: true,
      urlPattern: '?page={page}',
      nextLinkSelectors: [
        '.pagination a.next',
        'a[rel="next"]'
      ],
      pageAttributeSelector: '.pagination a[data-page]',
      containerSelector: '.pagination'
    },
    
    settings: {
      maxReleasesToScrape: 50,
      requestDelayMs: 2000,
      enablePagination: true,
      maxPagesToScrape: 5,
      usePuppeteer: false,
      waitForSelector: '.items li'
    }
  },

  // 9Anime - Another popular site
  '9anime': {
    name: '9Anime',
    sourceWebsite: '9anime',
    domains: ['9anime.to', '9anime.id', '9anime.vc'],
    defaultUrl: 'https://9anime.to',
    
    selectors: {
      episodeWrap: '.film_list-wrap .flw-item',
      dataId: 'data-id',
      thumbnail: '.film-poster img',
      watchLink: '.film-poster a',
      animeName: '.film-name',
      animePageUrl: '.film-name a',
      episodeNumber: '.tick-item.tick-eps',
      isComplete: '.tick-item.tick-dub'
    },
    
    paginationConfig: {
      autoDetect: true,
      urlPattern: '?page={page}',
      nextLinkSelectors: [
        '.pagination a.next',
        'a[rel="next"]',
        '.pagination a:contains("Next")'
      ],
      pageAttributeSelector: '[data-page]',
      containerSelector: '.pagination'
    },
    
    settings: {
      maxReleasesToScrape: 50,
      requestDelayMs: 2000,
      enablePagination: true,
      maxPagesToScrape: 5,
      usePuppeteer: true, // 9Anime has Cloudflare protection
      waitForSelector: '.flw-item'
    }
  },

  // Generic fallback adapter - tries common patterns
  'generic': {
    name: 'Generic Anime Site',
    sourceWebsite: 'custom',
    domains: [],
    defaultUrl: '',
    
    selectors: {
      // Try multiple common selectors
      episodeWrap: '.episode, .item, .card, .release, .anime-item, article',
      dataId: 'data-id',
      thumbnail: 'img, .thumbnail img, .poster img, .image img',
      watchLink: 'a.watch, a.play, a[href*="watch"], a[href*="play"]',
      animeName: '.title, .name, h3, h4, .anime-title',
      animePageUrl: 'a[href*="anime"]',
      episodeNumber: '.episode, .ep, .number',
      isComplete: '.complete, .finished, .badge-success'
    },
    
    paginationConfig: {
      autoDetect: true,
      urlPattern: '?page={page}',
      nextLinkSelectors: [
        'a.next',
        'a.next-page',
        'a[rel="next"]',
        '.pagination a:contains("Next")',
        '.pagination a:contains("›")',
        '.pagination a:contains(">")',
        'a:contains("Next")'
      ],
      pageAttributeSelector: '[data-page]',
      containerSelector: '.pagination, .pager, nav'
    },
    
    settings: {
      maxReleasesToScrape: 30,
      requestDelayMs: 3000, // More conservative for unknown sites
      enablePagination: false, // Disabled by default for safety
      maxPagesToScrape: 1,
      usePuppeteer: true, // Use Puppeteer by default for unknown sites
      waitForSelector: null
    }
  }
};

/**
 * Detect which site adapter to use based on URL
 * @param {string} url - The URL to scrape
 * @returns {object} - Site adapter configuration
 */
function detectSiteAdapter(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check each adapter's domains
    for (const [key, adapter] of Object.entries(siteAdapters)) {
      if (key === 'generic') continue; // Skip generic for now
      
      for (const domain of adapter.domains) {
        if (hostname.includes(domain)) {
          console.log(`[SiteAdapter] Detected site: ${adapter.name} (${key})`);
          return { key, ...adapter };
        }
      }
    }
    
    // No match found, return generic
    console.log(`[SiteAdapter] No specific adapter found for ${hostname}, using generic`);
    return { key: 'generic', ...siteAdapters.generic };
    
  } catch (error) {
    console.error('[SiteAdapter] Error detecting site:', error.message);
    return { key: 'generic', ...siteAdapters.generic };
  }
}

/**
 * Get adapter by key
 * @param {string} key - Adapter key (e.g., 'animepahe', 'animekai')
 * @returns {object} - Site adapter configuration
 */
function getAdapter(key) {
  const adapter = siteAdapters[key];
  if (!adapter) {
    console.warn(`[SiteAdapter] Adapter '${key}' not found, using generic`);
    return { key: 'generic', ...siteAdapters.generic };
  }
  return { key, ...adapter };
}

/**
 * Get all available adapters
 * @returns {object} - All site adapters
 */
function getAllAdapters() {
  return siteAdapters;
}

/**
 * Create a scraping config from site adapter
 * @param {string} adapterKey - The adapter to use
 * @param {string} url - The URL to scrape (optional, uses default if not provided)
 * @returns {object} - Configuration object for ScrapingConfig model
 */
function createConfigFromAdapter(adapterKey, url = null) {
  const adapter = getAdapter(adapterKey);
  
  return {
    name: `${adapter.name} - ${new Date().toISOString()}`,
    sourceWebsite: adapter.sourceWebsite,
    sourceUrl: url || adapter.defaultUrl,
    selectors: adapter.selectors,
    paginationConfig: adapter.paginationConfig,
    ...adapter.settings
  };
}

module.exports = {
  siteAdapters,
  detectSiteAdapter,
  getAdapter,
  getAllAdapters,
  createConfigFromAdapter
};

const mongoose = require('mongoose');

const scrapingConfigSchema = new mongoose.Schema({
  // Configuration name
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Source website details
  sourceWebsite: {
    type: String,
    required: true,
    enum: ['animepahe', 'gogoanime', 'custom'],
    default: 'animepahe'
  },
  
  // URL to scrape
  sourceUrl: {
    type: String,
    required: true
  },
  
  // Scraping rules/selectors (flexible JSON structure)
  selectors: {
    episodeWrap: { type: String, default: '.episode-wrap' },
    dataId: { type: String, default: 'data-id' },
    thumbnail: { type: String, default: '.episode-snapshot img' },
    watchLink: { type: String, default: 'a.play' },
    animeName: { type: String, default: '.episode-title a' },
    animePageUrl: { type: String, default: '.episode-title a' },
    episodeNumber: { type: String, default: '.episode-number' },
    isComplete: { type: String, default: '.episode-number.text-success' }
  },
  
  // Scraping configuration
  maxReleasesToScrape: {
    type: Number,
    default: 50
  },
  
  // Rate limiting
  requestDelayMs: {
    type: Number,
    default: 2000
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Schedule configuration
  scrapeIntervalHours: {
    type: Number,
    default: 6
  },
  
  // Admin who created/manages this config (stored as string ID to avoid User model dependency)
  createdBy: {
    type: String,
    required: false
  },
  
  updatedBy: {
    type: String
  },
  
  // Last scrape info
  lastScrapedAt: {
    type: Date
  },
  
  lastScrapeStatus: {
    type: String,
    enum: ['success', 'failed', 'partial', 'never'],
    default: 'never'
  },
  
  lastScrapeError: {
    type: String
  },
  
  totalReleasesFetched: {
    type: Number,
    default: 0
  },
  
  // User-Agent rotation (array of user agents)
  userAgents: [{
    type: String
  }],
  
  // Headers to use
  customHeaders: {
    type: Map,
    of: String
  },
  
  // Proxy settings (optional)
  useProxy: {
    type: Boolean,
    default: false
  },
  
  proxyUrl: {
    type: String
  },
  
  // Pagination settings
  enablePagination: {
    type: Boolean,
    default: false
  },
  
  maxPagesToScrape: {
    type: Number,
    default: 1,
    min: 1,
    max: 100  // Safety limit to prevent excessive scraping
  },
  
  // Pagination detection strategies (multiple methods)
  paginationConfig: {
    // Auto-detect: let scraper find next page automatically
    autoDetect: {
      type: Boolean,
      default: true
    },
    
    // Method 1: URL pattern (e.g., ?page={page})
    urlPattern: {
      type: String,
      default: '?page={page}'  // {page} will be replaced with page number
    },
    
    // Method 2: Next link selectors (CSS selectors to find next page)
    nextLinkSelectors: [{
      type: String
    }],
    
    // Method 3: Page number attribute selector
    pageAttributeSelector: {
      type: String,
      default: '[data-page]'
    },
    
    // Pagination container selector (helps narrow search)
    containerSelector: {
      type: String,
      default: '.pagination, .pager, nav[role="navigation"]'
    }
  }
}, {
  timestamps: true
});

// Index for active configs
scrapingConfigSchema.index({ isActive: 1, sourceWebsite: 1 });

module.exports = mongoose.model('ScrapingConfig', scrapingConfigSchema);

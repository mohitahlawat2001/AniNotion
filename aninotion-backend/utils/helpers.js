const crypto = require('crypto');

/**
 * Utility Functions for AniNotion
 * Provides common utilities for slugification, validation, and batch processing
 */

/**
 * Slugify text for URLs
 * @param {string} text - Text to slugify
 * @param {Object} options - Slugify options
 * @returns {string} Slugified text
 */
function slugify(text, options = {}) {
  const {
    separator = '-',
    lowercase = true,
    trim = true,
    maxLength = 100,
    replacement = ''
  } = options;

  if (!text || typeof text !== 'string') {
    return '';
  }

  let slug = text;

  // Remove HTML tags
  slug = slug.replace(/<[^>]*>/g, '');

  // Convert to lowercase if requested
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Replace special characters and spaces
  slug = slug
    .replace(/[^\w\s-]/g, replacement) // Remove special chars
    .replace(/\s+/g, separator) // Replace spaces with separator
    .replace(new RegExp(`${separator}+`, 'g'), separator); // Remove duplicate separators

  // Trim separators from start and end
  if (trim) {
    const separatorRegex = new RegExp(`^${separator}+|${separator}+$`, 'g');
    slug = slug.replace(separatorRegex, '');
  }

  // Limit length
  if (maxLength && slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing separator if it was cut
    if (trim) {
      const separatorRegex = new RegExp(`${separator}+$`, 'g');
      slug = slug.replace(separatorRegex, '');
    }
  }

  return slug;
}

/**
 * Generate unique slug
 * @param {string} text - Text to slugify
 * @param {Function} checkExists - Function to check if slug exists
 * @param {Object} options - Slugify options
 * @returns {Promise<string>} Unique slug
 */
async function generateUniqueSlug(text, checkExists, options = {}) {
  const baseSlug = slugify(text, options);
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    // Prevent infinite loops
    if (counter > 1000) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Validation utilities
 */
const validators = {
  /**
   * Validate email format
   */
  email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   */
  url(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate MongoDB ObjectId
   */
  objectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  /**
   * Validate slug format
   */
  slug(slug) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  },

  /**
   * Validate anime title
   */
  animeTitle(title) {
    return typeof title === 'string' && 
           title.trim().length >= 1 && 
           title.trim().length <= 200;
  },

  /**
   * Validate year
   */
  year(year) {
    const currentYear = new Date().getFullYear();
    return Number.isInteger(year) && 
           year >= 1900 && 
           year <= currentYear + 5;
  },

  /**
   * Validate rating (1-10)
   */
  rating(rating) {
    return typeof rating === 'number' && 
           rating >= 1 && 
           rating <= 10;
  },

  /**
   * Validate episode number
   */
  episode(episode) {
    return Number.isInteger(episode) && episode >= 1 && episode <= 10000;
  },

  /**
   * Validate status
   */
  status(status, allowedStatuses = ['watching', 'completed', 'on-hold', 'dropped', 'plan-to-watch']) {
    return allowedStatuses.includes(status);
  },

  /**
   * Validate watch link
   */
  watchLink(link) {
    if (!this.url(link)) return false;
    
    // Check for common anime streaming domains
    const allowedDomains = [
      'crunchyroll.com',
      'funimation.com',
      'netflix.com',
      'hulu.com',
      'amazon.com',
      'youtube.com',
      'gogoanime',
      '9anime',
      'animixplay'
    ];
    
    try {
      const url = new URL(link);
      return allowedDomains.some(domain => 
        url.hostname.includes(domain.toLowerCase())
      );
    } catch {
      return false;
    }
  }
};

/**
 * Sanitization utilities
 */
const sanitizers = {
  /**
   * Sanitize HTML content
   */
  html(html) {
    if (!html || typeof html !== 'string') return '';
    
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  },

  /**
   * Sanitize text input
   */
  text(text, options = {}) {
    const { maxLength = 1000, allowNewlines = true } = options;
    
    if (!text || typeof text !== 'string') return '';
    
    let sanitized = text.trim();
    
    if (!allowNewlines) {
      sanitized = sanitized.replace(/\n/g, ' ');
    }
    
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  },

  /**
   * Sanitize search query
   */
  searchQuery(query) {
    if (!query || typeof query !== 'string') return '';
    
    return query
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/['"]/g, '') // Remove quotes that could break queries
      .substring(0, 100); // Limit length
  }
};

/**
 * Batch processing utilities
 */
class BatchProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.delay = options.delay || 0;
    this.onProgress = options.onProgress || (() => {});
    this.onError = options.onError || (() => {});
  }

  /**
   * Process items in batches
   */
  async process(items, processor) {
    const results = [];
    const errors = [];
    let processed = 0;

    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      
      try {
        const batchResults = await this.processBatch(batch, processor);
        results.push(...batchResults);
        processed += batch.length;
        
        this.onProgress({
          processed,
          total: items.length,
          percentage: Math.round((processed / items.length) * 100),
          batchNumber: Math.floor(i / this.batchSize) + 1,
          totalBatches: Math.ceil(items.length / this.batchSize)
        });
        
        // Add delay between batches if specified
        if (this.delay > 0 && i + this.batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        
      } catch (error) {
        errors.push({
          batch: Math.floor(i / this.batchSize) + 1,
          startIndex: i,
          endIndex: Math.min(i + this.batchSize - 1, items.length - 1),
          error: error.message
        });
        
        this.onError(error, batch);
      }
    }

    return {
      results,
      errors,
      totalProcessed: processed,
      totalErrors: errors.length
    };
  }

  /**
   * Process a single batch
   */
  async processBatch(batch, processor) {
    if (Array.isArray(processor)) {
      // Multiple processors - run in parallel
      return Promise.all(batch.map((item, index) => 
        processor[index % processor.length](item)
      ));
    } else {
      // Single processor
      return Promise.all(batch.map(processor));
    }
  }
}

/**
 * Text utilities
 */
const textUtils = {
  /**
   * Truncate text with ellipsis
   */
  truncate(text, length = 100, suffix = '...') {
    if (!text || typeof text !== 'string') return '';
    
    if (text.length <= length) return text;
    
    return text.substring(0, length - suffix.length) + suffix;
  },

  /**
   * Extract excerpt from text
   */
  excerpt(text, length = 200) {
    if (!text || typeof text !== 'string') return '';
    
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    // Truncate at word boundary
    if (cleanText.length <= length) return cleanText;
    
    const truncated = cleanText.substring(0, length);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > length * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  },

  /**
   * Count words in text
   */
  wordCount(text) {
    if (!text || typeof text !== 'string') return 0;
    
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return 0;
    
    return cleanText.split(/\s+/).length;
  },

  /**
   * Generate reading time estimate
   */
  readingTime(text, wordsPerMinute = 200) {
    const words = this.wordCount(text);
    const minutes = Math.ceil(words / wordsPerMinute);
    
    if (minutes < 1) return 'Less than 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }
};

/**
 * Array utilities
 */
const arrayUtils = {
  /**
   * Remove duplicates from array
   */
  unique(array, key = null) {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = typeof key === 'function' ? key(item) : item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(array)];
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk(array, size) {
    if (!Array.isArray(array) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Shuffle array
   */
  shuffle(array) {
    if (!Array.isArray(array)) return [];
    
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
};

/**
 * Date utilities
 */
const dateUtils = {
  /**
   * Format date for display
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'readable':
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      default:
        return d.toISOString();
    }
  },

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  timeAgo(date) {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    
    if (diffMs < 0) return 'in the future';
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
};

/**
 * Generate random ID
 */
function generateId(length = 8) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate hash for data
 */
function generateHash(data, algorithm = 'md5') {
  return crypto.createHash(algorithm).update(JSON.stringify(data)).digest('hex');
}

/**
 * Deep clone object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

module.exports = {
  slugify,
  generateUniqueSlug,
  validators,
  sanitizers,
  BatchProcessor,
  textUtils,
  arrayUtils,
  dateUtils,
  generateId,
  generateHash,
  deepClone,
  debounce
};

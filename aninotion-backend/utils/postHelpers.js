const crypto = require('crypto');
const Post = require('../models/Post');

/**
 * Generate a unique slug from title
 * @param {string} title - The post title
 * @param {string} excludeId - Post ID to exclude from uniqueness check
 * @returns {Promise<string>} - Unique slug
 */
const generateUniqueSlug = async (title, excludeId = null) => {
  // Create base slug from title
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  let slug = baseSlug;
  let counter = 0;
  
  // Check for uniqueness
  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingPost = await Post.findOne(query);
    
    if (!existingPost) {
      return slug;
    }
    
    // If slug exists, append a counter or random string
    counter++;
    if (counter < 10) {
      slug = `${baseSlug}-${counter}`;
    } else {
      // After 10 attempts, use random string
      const randomStr = crypto.randomBytes(4).toString('hex');
      slug = `${baseSlug}-${randomStr}`;
      break;
    }
  }
  
  return slug;
};

/**
 * Generate excerpt from content
 * @param {string} content - The post content
 * @param {number} length - Maximum length (default: 160)
 * @returns {string} - Generated excerpt
 */
const generateExcerpt = (content, length = 160) => {
  if (!content) return '';
  
  // Remove HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  
  if (plainText.length <= length) {
    return plainText;
  }
  
  // Find the last complete word within the limit
  const truncated = plainText.substring(0, length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

/**
 * Calculate reading time in minutes
 * @param {string} content - The post content
 * @param {number} wordsPerMinute - Reading speed (default: 200)
 * @returns {number} - Reading time in minutes
 */
const calculateReadingTime = (content, wordsPerMinute = 200) => {
  if (!content) return 0;
  
  // Remove HTML tags and count words
  const plainText = content.replace(/<[^>]*>/g, '');
  const words = plainText.split(/\s+/).filter(word => word.length > 0).length;
  
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

/**
 * Process tags - normalize and deduplicate
 * @param {string[]|string} tags - Tags array or comma-separated string
 * @returns {string[]} - Processed tags array
 */
const processTags = (tags) => {
  if (!tags) return [];
  
  let tagArray = [];
  
  if (typeof tags === 'string') {
    tagArray = tags.split(',').map(tag => tag.trim());
  } else if (Array.isArray(tags)) {
    tagArray = tags;
  }
  
  return [...new Set(
    tagArray
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0 && tag.length <= 50)
  )];
};

/**
 * Validate post status transition
 * @param {string} currentStatus - Current post status
 * @param {string} newStatus - New status to transition to
 * @param {string} userRole - User role making the change
 * @returns {boolean} - Whether transition is allowed
 */
const isValidStatusTransition = (currentStatus, newStatus, userRole) => {
  const allowedTransitions = {
    'draft': ['published', 'scheduled'],
    'published': ['draft'],
    'scheduled': ['draft', 'published']
  };
  
  // Admins can do any transition
  if (userRole === 'admin') {
    return true;
  }
  
  // Editors can do most transitions
  if (userRole === 'editor') {
    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }
  
  // Viewers cannot change status
  return false;
};

/**
 * Build post query based on user permissions
 * @param {Object} user - User object (null for anonymous)
 * @param {Object} baseQuery - Base query object
 * @returns {Object} - Enhanced query with permission filters
 */
const buildPostQuery = (user, baseQuery = {}) => {
  const query = { ...baseQuery, isDeleted: false };
  
  // Anonymous users or viewers can only see published posts
  if (!user || user.role === 'viewer') {
    query.status = 'published';
  }
  // Admins and editors can see all posts (unless specifically filtered)
  else if (user.role === 'admin' || user.role === 'editor') {
    // Allow status filtering via query parameters
    // The route handler should add status filter if needed
  }
  
  return query;
};

module.exports = {
  generateUniqueSlug,
  generateExcerpt,
  calculateReadingTime,
  processTags,
  isValidStatusTransition,
  buildPostQuery
};

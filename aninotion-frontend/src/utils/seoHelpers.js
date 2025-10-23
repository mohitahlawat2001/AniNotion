/**
 * SEO Helper Functions
 * Utilities for generating SEO-friendly content
 */

/**
 * Generate a clean excerpt from HTML content
 * @param {string} html - HTML content
 * @param {number} maxLength - Maximum length of excerpt
 * @returns {string} - Plain text excerpt
 */
export const generateExcerpt = (html, maxLength = 160) => {
  if (!html) return '';
  
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  
  // Remove extra whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Truncate to maxLength
  if (cleaned.length <= maxLength) return cleaned;
  
  // Find last complete word within limit
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
};

/**
 * Generate SEO-friendly URL slug
 * @param {string} title - Post title
 * @returns {string} - URL slug
 */
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Get the best image for SEO from post images
 * @param {Array} images - Array of image URLs
 * @returns {string} - Best image URL
 */
export const getBestSEOImage = (images) => {
  if (!images || images.length === 0) return null;
  
  // Prefer the first image (usually the featured/main image)
  return images[0];
};

/**
 * Generate keywords from tags and content
 * @param {Array} tags - Post tags
 * @param {string} animeName - Anime name
 * @param {string} category - Category name
 * @returns {Array} - Array of keywords
 */
export const generateKeywords = (tags = [], animeName = '', category = '') => {
  const keywords = [...tags];
  
  if (animeName) keywords.push(animeName);
  if (category) keywords.push(category);
  
  // Add generic anime keywords
  keywords.push('anime', 'anime review', 'anime guide');
  
  // Remove duplicates and return
  return [...new Set(keywords)];
};

/**
 * Format date for structured data (ISO 8601)
 * @param {string|Date} date - Date to format
 * @returns {string} - ISO formatted date
 */
export const formatDateForSEO = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Generate breadcrumb structured data
 * @param {Array} breadcrumbs - Array of {name, url} objects
 * @returns {Object} - Structured data for breadcrumbs
 */
export const generateBreadcrumbData = (breadcrumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

/**
 * Validate and clean URL
 * @param {string} url - URL to validate
 * @returns {string} - Clean URL
 */
export const cleanUrl = (url) => {
  if (!url) return '';
  
  // Remove trailing slashes
  return url.replace(/\/+$/, '');
};

/**
 * Check if image URL is absolute
 * @param {string} url - Image URL
 * @returns {boolean} - True if absolute URL
 */
export const isAbsoluteUrl = (url) => {
  return /^https?:\/\//i.test(url);
};

/**
 * Make image URL absolute
 * @param {string} url - Image URL
 * @param {string} baseUrl - Base URL of site
 * @returns {string} - Absolute image URL
 */
export const makeAbsoluteUrl = (url, baseUrl) => {
  if (!url) return '';
  if (isAbsoluteUrl(url)) return url;
  
  const cleanBase = cleanUrl(baseUrl);
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBase}${cleanPath}`;
};

/**
 * Generate post meta data for SEO
 * @param {Object} post - Post object
 * @returns {Object} - SEO meta data
 */
export const generatePostSEO = (post) => {
  if (!post) return {};
  
  return {
    title: post.title,
    description: generateExcerpt(post.content, 160),
    image: getBestSEOImage(post.images),
    url: `/post/${post.slug || post._id}`,
    type: 'article',
    article: true,
    author: post.createdBy?.username || 'AniNotion Team',
    tags: generateKeywords(
      post.tags || [], 
      post.animeName || '', 
      post.category?.name || ''
    ),
    publishedTime: formatDateForSEO(post.publishedAt || post.createdAt),
    modifiedTime: formatDateForSEO(post.updatedAt)
  };
};

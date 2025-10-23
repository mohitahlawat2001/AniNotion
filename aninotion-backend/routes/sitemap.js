const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Category = require('../models/Category');
const logger = require('../config/logger');

/**
 * Generate XML sitemap
 * GET /api/sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    logger.info('🗺️ Generating sitemap');

    const baseUrl = process.env.FRONTEND_URL || 'https://aninotion.com';
    
    // Fetch all published posts
    const posts = await Post.find({ status: 'published' })
      .select('slug _id updatedAt publishedAt animeName')
      .sort('-publishedAt')
      .lean();

    // Fetch all categories
    const categories = await Category.find()
      .select('slug name')
      .lean();

    // Start XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Categories
    categories.forEach(category => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/category/${category.slug || category._id}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Posts
    posts.forEach(post => {
      const lastmod = post.updatedAt || post.publishedAt || new Date();
      const postUrl = post.slug || post._id;
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/post/${postUrl}</loc>\n`;
      xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';

      // If post has anime name, add anime page
      if (post.animeName) {
        const animeSlug = encodeURIComponent(post.animeName);
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/anime/${animeSlug}</loc>\n`;
        xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      }
    });

    // Static pages
    const staticPages = [
      { url: '/raw', priority: '0.6', changefreq: 'weekly' }
    ];

    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Close XML
    xml += '</urlset>';

    // Set headers and send
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(xml);

    logger.info('✅ Sitemap generated successfully', {
      postsCount: posts.length,
      categoriesCount: categories.length
    });

  } catch (error) {
    logger.error('❌ Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

/**
 * Generate RSS feed
 * GET /api/rss.xml
 */
router.get('/rss.xml', async (req, res) => {
  try {
    logger.info('📰 Generating RSS feed');

    const baseUrl = process.env.FRONTEND_URL || 'https://aninotion.com';
    const limit = 50; // Last 50 posts
    
    // Fetch recent published posts
    const posts = await Post.find({ status: 'published' })
      .select('title content slug _id publishedAt createdBy animeName category images')
      .populate('createdBy', 'username')
      .populate('category', 'name')
      .sort('-publishedAt')
      .limit(limit)
      .lean();

    // Start RSS XML
    let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n';
    rss += '  <channel>\n';
    rss += '    <title>AniNotion - Anime Reviews and Guides</title>\n';
    rss += `    <link>${baseUrl}</link>\n`;
    rss += '    <description>Discover and explore detailed anime reviews, guides, and insights</description>\n';
    rss += '    <language>en-us</language>\n';
    rss += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    rss += `    <atom:link href="${baseUrl}/api/rss.xml" rel="self" type="application/rss+xml" />\n`;

    // Add posts
    posts.forEach(post => {
      const postUrl = `${baseUrl}/post/${post.slug || post._id}`;
      const pubDate = new Date(post.publishedAt || post.createdAt).toUTCString();
      const author = post.createdBy?.username || 'AniNotion Team';
      
      // Clean content (remove HTML tags for description)
      const description = post.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500) + '...';

      rss += '    <item>\n';
      rss += `      <title><![CDATA[${post.title}]]></title>\n`;
      rss += `      <link>${postUrl}</link>\n`;
      rss += `      <guid isPermaLink="true">${postUrl}</guid>\n`;
      rss += `      <description><![CDATA[${description}]]></description>\n`;
      rss += `      <pubDate>${pubDate}</pubDate>\n`;
      rss += `      <dc:creator>${author}</dc:creator>\n`;
      
      if (post.category) {
        rss += `      <category>${post.category.name}</category>\n`;
      }
      
      if (post.animeName) {
        rss += `      <category>${post.animeName}</category>\n`;
      }

      if (post.images && post.images.length > 0) {
        rss += `      <enclosure url="${post.images[0]}" type="image/jpeg" />\n`;
      }

      rss += '    </item>\n';
    });

    rss += '  </channel>\n';
    rss += '</rss>';

    // Set headers and send
    res.header('Content-Type', 'application/rss+xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(rss);

    logger.info('✅ RSS feed generated successfully', {
      postsCount: posts.length
    });

  } catch (error) {
    logger.error('❌ Error generating RSS feed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
});

module.exports = router;

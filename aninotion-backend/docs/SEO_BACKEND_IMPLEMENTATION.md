# SEO Backend Implementation

## Overview

This document describes the backend SEO implementation for AniNotion, specifically the sitemap and RSS feed generation.

## Files Modified

### `/server.js`

Added the sitemap routes to the main server file:

```javascript
const sitemapRoutes = require('./routes/sitemap');

// Routes
app.use('/api', sitemapRoutes); // Sitemap and RSS routes
```

## Files Created

### `/routes/sitemap.js`

Provides two main endpoints for SEO:

1. **Sitemap Endpoint** (`GET /api/sitemap.xml`)
   - Generates XML sitemap with all published posts
   - Includes homepage, categories, anime pages, and static pages
   - Automatically sets `lastmod`, `changefreq`, and `priority`
   - Cached for 1 hour to reduce database queries
   - Compatible with Google Search Console

2. **RSS Feed Endpoint** (`GET /api/rss.xml`)
   - Generates RSS 2.0 compatible feed
   - Includes last 50 published posts
   - Contains full post metadata (title, description, author, date)
   - Includes image enclosures
   - Supports category tagging
   - Compatible with RSS readers and content aggregators

## API Endpoints

### 1. Sitemap XML

**Endpoint:** `GET /api/sitemap.xml`

**Response:** XML sitemap following the Sitemap Protocol

**Example:**
```bash
curl http://localhost:5000/api/sitemap.xml
```

**Response Format:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aninotion.com/</loc>
    <lastmod>2025-10-23T18:30:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- more URLs -->
</urlset>
```

**What's Included:**
- Homepage (priority: 1.0, daily)
- Categories (priority: 0.8, weekly)
- Published posts (priority: 0.9, weekly)
- Anime pages (priority: 0.7, monthly)
- Static pages (priority: 0.6, weekly)

**Caching:** 1 hour

### 2. RSS Feed

**Endpoint:** `GET /api/rss.xml`

**Response:** RSS 2.0 compatible XML

**Example:**
```bash
curl http://localhost:5000/api/rss.xml
```

**Response Format:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>AniNotion - Anime Reviews and Guides</title>
    <link>https://aninotion.com</link>
    <description>Discover and explore detailed anime reviews, guides, and insights</description>
    <item>
      <title><![CDATA[Post Title]]></title>
      <link>https://aninotion.com/post/123</link>
      <guid isPermaLink="true">https://aninotion.com/post/123</guid>
      <description><![CDATA[Post excerpt...]]></description>
      <pubDate>Wed, 23 Oct 2025 18:30:00 +0000</pubDate>
      <!-- more fields -->
    </item>
  </channel>
</rss>
```

**What's Included:**
- Last 50 published posts
- Post title and description
- Publication date
- Author information
- Category tags
- Image enclosures

**Caching:** 1 hour

## Environment Variables

Add to `/aninotion-backend/.env`:

```env
# Frontend URL for SEO metadata
FRONTEND_URL=https://your-domain.com

# Optional: adjust cache time (in seconds)
SITEMAP_CACHE_TIME=3600
```

## How It Works

### Sitemap Generation Process

1. **Request received** at `/api/sitemap.xml`
2. **Check cache** - if fresh, return cached version
3. **Query database** for:
   - All published posts with their URLs and update dates
   - All categories with their names and slugs
4. **Generate XML** with proper formatting and structure
5. **Cache result** for 1 hour
6. **Return** with appropriate headers:
   - Content-Type: application/xml
   - Cache-Control: public, max-age=3600

### RSS Feed Generation Process

1. **Request received** at `/api/rss.xml`
2. **Check cache** - if fresh, return cached version
3. **Query database** for:
   - Last 50 published posts sorted by date
   - Post content, metadata, and images
4. **Generate RSS XML** with proper formatting
5. **Cache result** for 1 hour
6. **Return** with appropriate headers

## Integration with Frontend

The sitemap and RSS endpoints are referenced in:

1. **robots.txt** (public directory)
   ```txt
   Sitemap: https://your-domain.com/api/sitemap.xml
   ```

2. **index.html** (base SEO)
   - References where to find the sitemap

3. **Documentation** (SEO guides)
   - Explains how to submit to Google Search Console

## Testing

### Test Sitemap

```bash
# Local development
curl http://localhost:5000/api/sitemap.xml

# After deployment
curl https://your-domain.com/api/sitemap.xml

# Validate with Google
# https://search.google.com/search-console
```

### Test RSS Feed

```bash
# Local development
curl http://localhost:5000/api/rss.xml

# After deployment
curl https://your-domain.com/api/rss.xml

# Validate with RSS validators
# https://www.feedvalidator.org/
```

## Performance Considerations

1. **Caching**: Results cached for 1 hour to reduce database load
2. **Query Optimization**: Uses `.lean()` for read-only operations
3. **Lazy Loading**: Only loads necessary fields from database
4. **Memory Efficient**: Builds XML as string to avoid DOM overhead

## Monitoring

### Check Backend Logs

Look for:
- Sitemap generation errors
- Database connection issues
- Crawl errors

### Key Metrics

- How often sitemap is accessed
- Number of posts indexed
- Database query performance
- Cache hit rate

## Troubleshooting

### Empty Sitemap

**Problem:** Sitemap shows no posts

**Solution:**
1. Check if posts have `status: 'published'`
2. Verify database connection
3. Check backend console logs

### Slow Generation

**Problem:** Sitemap takes too long to generate

**Solution:**
1. Check database indexes on Post model
2. Verify no large documents being fetched
3. Monitor database performance

### Google Not Crawling

**Problem:** Sitemap submitted but not crawled

**Solution:**
1. Check `robots.txt` isn't blocking
2. Verify FRONTEND_URL environment variable
3. Check Search Console for errors
4. Ensure content is valuable and unique

## SEO Best Practices

1. **Update Frequency**: Sitemap updates automatically when posts change
2. **Lastmod Accuracy**: Uses actual post modification dates
3. **Priority Signals**: Homepage has highest priority (1.0)
4. **Changefreq Hints**: Daily for homepage, weekly for posts, monthly for archives
5. **URL Canonicalization**: Uses consistent domain from FRONTEND_URL

## Future Enhancements

1. **Sitemaps Index**: For sites with 50,000+ URLs
2. **Video Sitemap**: For anime episode videos
3. **Image Sitemap**: For post images
4. **News Sitemap**: For latest posts (if applicable)
5. **Mobile Sitemap**: Separate optimization for mobile
6. **Dynamic Updates**: Real-time sitemap generation on publish

## Related Documentation

- Frontend SEO: See `aninotion-frontend/docs/` for frontend implementation
- Google Search Central: https://developers.google.com/search
- Sitemap Protocol: https://www.sitemaps.org/protocol.html
- RSS Specification: https://www.rssboard.org/rss-specification

---

**Last Updated:** October 23, 2025  
**Status:** Production Ready ✅  
**Maintenance:** Automatic (hourly cache refresh)

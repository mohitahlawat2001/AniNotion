# Quick Start: Installing SEO Dependencies

## Frontend Dependencies

Run this command in the `aninotion-frontend` directory:

```bash
npm install react-helmet-async --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is needed because you're using React 19, and `react-helmet-async` currently lists peer dependencies up to React 18. This is safe to use.

## Backend Dependencies

No additional dependencies needed! The sitemap is generated using native Node.js XML string building.

## Environment Variables

### Frontend (.env)

Create or update `/workspaces/AniNotion/aninotion-frontend/.env`:

```env
VITE_APP_URL=https://aninotion.com
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (.env)

Add to `/workspaces/AniNotion/aninotion-backend/.env`:

```env
FRONTEND_URL=https://aninotion.com
```

## Testing the Implementation

### 1. Test Sitemap Generation

Start your backend server and visit:
```
http://localhost:5000/api/sitemap.xml
```

You should see an XML sitemap with all your published posts.

### 2. Test RSS Feed

Visit:
```
http://localhost:5000/api/rss.xml
```

### 3. Test Meta Tags on Post Page

1. Open your frontend (usually http://localhost:3000)
2. Navigate to any post
3. Right-click → "View Page Source"
4. Search for `<meta property="og:title"` or `<script type="application/ld+json"`

### 4. Test with Google's Tools

Once deployed:

- **Rich Results Test**: https://search.google.com/test/rich-results
- **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
- **PageSpeed Insights**: https://pagespeed.web.dev/

## Deployment Checklist

- [ ] Update `VITE_APP_URL` to your production domain
- [ ] Update `FRONTEND_URL` in backend to your production domain
- [ ] Update robots.txt sitemap URL to match your domain
- [ ] Submit sitemap to Google Search Console
- [ ] Verify site ownership in Google Search Console
- [ ] Create and upload `/public/og-image.jpg` (recommended 1200x630px)
- [ ] Test all meta tags after deployment
- [ ] Monitor indexing in Google Search Console

## Google Search Console Setup

1. Go to https://search.google.com/search-console
2. Add your property (domain or URL prefix)
3. Verify ownership (use HTML file method or DNS)
4. Submit your sitemap: `https://yourdomain.com/api/sitemap.xml`
5. Request indexing for key pages
6. Monitor performance after 1-2 weeks

## Expected Timeline

- **Immediate**: Meta tags work, social sharing previews work
- **1-3 days**: Google starts crawling your sitemap
- **1-2 weeks**: Posts start appearing in search results
- **2-4 weeks**: Full indexing of most content
- **1-3 months**: Improved rankings as Google understands your content

## Troubleshooting

### Meta tags not updating
- Clear browser cache
- Check if HelmetProvider is wrapping your app
- Verify SEO component is rendering

### Sitemap not generating
- Check backend logs for errors
- Verify database connection
- Ensure posts have 'published' status

### Posts not appearing in Google
- Check robots.txt is not blocking
- Verify sitemap is submitted in Search Console
- Check for crawl errors in Search Console
- Ensure content is unique and valuable

## Next Steps for Better SEO

1. **Add Server-Side Rendering (SSR)**
   - Consider migrating to Next.js or implementing Vite SSR
   - Pre-render content for search engines

2. **Improve Performance**
   - Optimize images (use WebP, lazy loading)
   - Minimize JavaScript bundle size
   - Enable compression and caching

3. **Content Optimization**
   - Write descriptive, keyword-rich titles
   - Create compelling meta descriptions
   - Use proper heading hierarchy (H1, H2, H3)
   - Add alt text to images
   - Internal linking between related posts

4. **Technical SEO**
   - Implement breadcrumb navigation
   - Add FAQ schema for posts
   - Create category/tag pages
   - Implement pagination properly

5. **Monitoring**
   - Set up Google Analytics
   - Monitor Core Web Vitals
   - Track keyword rankings
   - Analyze user behavior

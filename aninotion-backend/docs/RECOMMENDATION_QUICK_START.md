# Recommendation Engine - Quick Start Guide

## 🚀 Quick Start

The recommendation engine is now fully integrated into your AniNotion backend. Follow these steps to start using it.

## Prerequisites

✅ MongoDB running and connected
✅ At least a few published posts in the database
✅ Backend server running

## Installation

The required dependencies are already installed:
- `natural` - NLP library for TF-IDF vectorization
- `node-cache` - In-memory caching

## API Endpoints Quick Reference

### 1. Get Similar Posts
```bash
GET /api/recommendations/similar/:postId
```

**Example:**
```bash
curl http://localhost:5000/api/recommendations/similar/YOUR_POST_ID?limit=5
```

### 2. Get Personalized Recommendations
```bash
POST /api/recommendations/personalized
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{
    "postIds": ["POST_ID_1", "POST_ID_2", "POST_ID_3"],
    "limit": 10,
    "diversityFactor": 0.3
  }'
```

### 3. Get Trending Posts
```bash
GET /api/recommendations/trending?timeframe=7&limit=10
```

### 4. Get Posts by Anime
```bash
GET /api/recommendations/anime/Demon%20Slayer?limit=10
```

### 5. Get Posts by Tag
```bash
GET /api/recommendations/tag/action?limit=10
```

## Testing the Implementation

Run the test script to verify everything works:

```bash
cd /workspaces/AniNotion/aninotion-backend
node scripts/test-recommendations.js
```

This will:
- Test similarity calculations
- Show sample recommendations
- Display performance metrics
- Verify all algorithms are working

## Frontend Integration Examples

### React/Next.js Component

```jsx
import { useState, useEffect } from 'react';

function SimilarPosts({ currentPostId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const res = await fetch(
          `/api/recommendations/similar/${currentPostId}?limit=6`
        );
        const data = await res.json();
        setRecommendations(data.data);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentPostId) {
      fetchSimilar();
    }
  }, [currentPostId]);

  if (loading) return <div>Loading recommendations...</div>;

  return (
    <div className="similar-posts">
      <h3>You Might Also Like</h3>
      <div className="posts-grid">
        {recommendations.map(post => (
          <div key={post._id} className="post-card">
            <h4>{post.title}</h4>
            <p>{post.excerpt}</p>
            <span className="similarity">
              {(post.similarityScore * 100).toFixed(0)}% match
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Trending Posts Component

```jsx
function TrendingPosts() {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    async function fetchTrending() {
      const res = await fetch('/api/recommendations/trending?timeframe=7&limit=10');
      const data = await res.json();
      setTrending(data.data);
    }
    fetchTrending();
  }, []);

  return (
    <div className="trending-section">
      <h2>🔥 Trending This Week</h2>
      {trending.map(post => (
        <TrendingPostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
```

### User Personalized Feed

```jsx
function PersonalizedFeed({ userHistory }) {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    async function loadFeed() {
      // Get last 10 posts user interacted with
      const recentPosts = userHistory.slice(-10).map(h => h.postId);
      
      const res = await fetch('/api/recommendations/personalized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postIds: recentPosts,
          limit: 20,
          diversityFactor: 0.4
        })
      });
      
      const data = await res.json();
      setFeed(data.data);
    }
    
    if (userHistory.length > 0) {
      loadFeed();
    }
  }, [userHistory]);

  return (
    <div className="personalized-feed">
      <h2>Recommended For You</h2>
      {feed.map(post => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
```

## Configuration

### Adjust Similarity Weights

You can customize how different factors contribute to recommendations:

```javascript
const weights = {
  content: 0.4,    // TF-IDF content similarity
  tags: 0.2,       // Tag overlap
  category: 0.15,  // Same category boost
  anime: 0.15,     // Same anime series
  engagement: 0.1  // Popularity factor
};
```

### Cache Settings

Cache is configured in `controllers/recommendationController.js`:

```javascript
const recommendationCache = new NodeCache({ 
  stdTTL: 3600,      // 1 hour TTL
  checkperiod: 600,   // Check every 10 minutes
  maxKeys: 1000       // Max 1000 cached entries
});
```

## Performance Tips

### For Small Sites (<1,000 posts)
- Default configuration works great
- Real-time calculations are fast
- Cache provides excellent performance

### For Medium Sites (1,000-10,000 posts)
- Enable caching (already configured)
- Consider pre-computing for top posts
- Monitor response times

### For Large Sites (>10,000 posts)
- Pre-compute similarities in background jobs
- Use vector databases for similarity search
- Implement pagination for recommendation results

## Monitoring

### Check Cache Performance

```bash
curl http://localhost:5000/api/recommendations/cache/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Good Cache Performance:**
- Hit rate > 70%
- Average response time < 200ms for cached requests

### Clear Cache When Needed

```bash
curl -X DELETE http://localhost:5000/api/recommendations/cache \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**When to clear cache:**
- After bulk post updates
- When changing recommendation algorithms
- If seeing stale recommendations

## Common Use Cases

### 1. "Related Posts" Section
Show at the bottom of each post:
```
GET /api/recommendations/similar/:postId?limit=6
```

### 2. "You Might Like" Homepage Widget
Based on user's recent activity:
```
POST /api/recommendations/personalized
```

### 3. "Trending Now" Section
Show popular recent posts:
```
GET /api/recommendations/trending?timeframe=7
```

### 4. "More from this Anime" Section
Show other episodes/seasons:
```
GET /api/recommendations/anime/:animeName
```

### 5. Tag-Based Discovery
Browse by tags:
```
GET /api/recommendations/tag/:tagName
```

## Troubleshooting

### No recommendations returned?
- Check if you have enough published posts (minimum 2)
- Verify posts have content and tags
- Lower `minScore` threshold

### Recommendations are too similar?
- Increase `diversityFactor` (0.5-0.7)
- Adjust weights to reduce anime/category importance

### Slow response times?
- Verify cache is working
- Check number of posts being processed
- Consider limiting posts to recent ones only

### Cache not working?
- Verify `node-cache` is installed
- Check logs for cache errors
- Ensure server has enough memory

## Next Steps

1. **Test the API** - Use the test script or curl commands
2. **Integrate Frontend** - Add recommendation widgets to your UI
3. **Monitor Performance** - Check cache stats and response times
4. **Optimize** - Adjust weights and parameters based on user engagement
5. **Scale** - Consider background processing if dataset grows

## Support

- 📖 Full Documentation: `docs/RECOMMENDATION_ENGINE.md`
- 🧪 Test Script: `scripts/test-recommendations.js`
- 🔍 Check logs in `/logs` directory

## Example Response

```json
{
  "success": true,
  "cached": false,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "title": "Demon Slayer Season 2 Episode 5 Review",
      "slug": "demon-slayer-s2e5-review",
      "animeName": "Demon Slayer",
      "seasonNumber": 2,
      "episodeNumber": 5,
      "excerpt": "An intense episode...",
      "tags": ["action", "supernatural", "shounen"],
      "category": { "name": "Reviews", "slug": "reviews" },
      "views": 1250,
      "likesCount": 89,
      "similarityScore": 0.847
    }
  ]
}
```

---

**Ready to use!** The recommendation engine is fully functional and integrated into your backend. Start testing with your existing posts! 🚀

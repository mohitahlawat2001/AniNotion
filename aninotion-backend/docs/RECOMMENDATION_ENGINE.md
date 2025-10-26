# Recommendation Engine - Complete Documentation

## Overview

The AniNotion Recommendation Engine is a sophisticated content discovery system that helps users find similar anime posts based on multiple factors including content similarity, tags, categories, and anime series relationships.

## Features

### 🎯 Core Capabilities

1. **Content-Based Filtering**
   - TF-IDF (Term Frequency-Inverse Document Frequency) vectorization
   - Cosine similarity for semantic content matching
   - Intelligent text preprocessing with stop word removal

2. **Tag-Based Filtering**
   - Jaccard similarity for tag overlap detection
   - Weighted tag importance
   - Tag co-occurrence analysis

3. **Hybrid Scoring System**
   - Combines multiple similarity metrics
   - Configurable weights for different factors
   - Engagement-based ranking

4. **Performance Optimization**
   - In-memory caching with node-cache (1-hour TTL)
   - Pre-computed similarity scores
   - Efficient batch processing

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                  API Endpoints                       │
│           (routes/recommendations.js)                │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Controller Layer                        │
│      (controllers/recommendationController.js)       │
│  • Request handling                                  │
│  • Caching logic                                     │
│  • Response formatting                               │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│            Recommendation Service                    │
│       (utils/recommendationService.js)               │
│  • TF-IDF vectorization                             │
│  • Similarity calculations                           │
│  • Hybrid scoring                                    │
│  • Diversification algorithms                        │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│               Post Model                             │
│           (models/Post.js)                           │
│  • Content storage                                   │
│  • Engagement metrics                                │
│  • Recommendation metadata                           │
└─────────────────────────────────────────────────────┘
```

## Database Schema Enhancements

### Post Model Fields

New fields added to support recommendations:

```javascript
{
  // Existing fields...
  
  // Recommendation engine fields
  contentHash: String,           // Hash for content deduplication
  contentLength: Number,          // Character count
  tfidfFeatures: Map,            // TF-IDF feature vectors (computed on-demand)
  engagementScore: Number,       // Calculated engagement metric
  lastSimilarityUpdate: Date     // Cache invalidation timestamp
}
```

### Engagement Score Calculation

```javascript
engagementScore = (views × 0.3 + likes × 0.5 + bookmarks × 0.2) × timeFactor

timeFactor = e^(-daysSincePublish / 365)
```

## API Endpoints

### 1. Get Similar Posts

Find posts similar to a specific post based on content and metadata.

**Endpoint:** `GET /api/recommendations/similar/:postId`

**Parameters:**
- `postId` (path) - ID of the target post
- `limit` (query) - Number of recommendations (default: 10)
- `minScore` (query) - Minimum similarity threshold (default: 0.1)
- `includeBreakdown` (query) - Include score breakdown (default: false)

**Example Request:**
```bash
curl http://localhost:5000/api/recommendations/similar/507f1f77bcf86cd799439011?limit=5&includeBreakdown=true
```

**Example Response:**
```json
{
  "success": true,
  "cached": false,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Demon Slayer Season 2 Episode 5 Review",
      "slug": "demon-slayer-s2e5-review",
      "animeName": "Demon Slayer",
      "seasonNumber": 2,
      "episodeNumber": 5,
      "excerpt": "An intense episode with amazing animation...",
      "tags": ["action", "supernatural", "shounen"],
      "category": {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Reviews",
        "slug": "reviews"
      },
      "views": 1250,
      "likesCount": 89,
      "similarityScore": 0.847,
      "scoreBreakdown": {
        "content": 0.723,
        "tags": 0.667,
        "category": 1.0,
        "anime": 0.7
      }
    }
  ]
}
```

### 2. Get Personalized Recommendations

Get recommendations based on user interaction history.

**Endpoint:** `POST /api/recommendations/personalized`

**Body:**
```json
{
  "postIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "limit": 10,
  "diversityFactor": 0.3
}
```

**Parameters:**
- `postIds` (required) - Array of post IDs user has interacted with
- `limit` - Number of recommendations (default: 10)
- `diversityFactor` - Diversity factor 0-1 (default: 0.3, higher = more diverse)

**Example Response:**
```json
{
  "success": true,
  "cached": false,
  "count": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "title": "Attack on Titan Final Season Analysis",
      "recommendationScore": 0.762,
      // ... other fields
    }
  ]
}
```

### 3. Get Anime Series Recommendations

Get all posts from a specific anime series.

**Endpoint:** `GET /api/recommendations/anime/:animeName`

**Parameters:**
- `animeName` (path) - Name of the anime
- `limit` (query) - Number of posts (default: 10)

**Example Request:**
```bash
curl http://localhost:5000/api/recommendations/anime/Demon%20Slayer?limit=20
```

### 4. Get Tag-Based Recommendations

Get posts with a specific tag.

**Endpoint:** `GET /api/recommendations/tag/:tag`

**Parameters:**
- `tag` (path) - Tag name
- `limit` (query) - Number of posts (default: 10)

**Example Request:**
```bash
curl http://localhost:5000/api/recommendations/tag/action?limit=15
```

### 5. Get Trending Posts

Get trending posts based on recent engagement.

**Endpoint:** `GET /api/recommendations/trending`

**Parameters:**
- `limit` (query) - Number of posts (default: 10)
- `timeframe` (query) - Days to look back (default: 7)

**Example Request:**
```bash
curl http://localhost:5000/api/recommendations/trending?timeframe=7&limit=10
```

### 6. Clear Cache (Admin Only)

Clear the recommendation cache.

**Endpoint:** `DELETE /api/recommendations/cache`

**Authentication:** Required (Admin role)

**Example Request:**
```bash
curl -X DELETE http://localhost:5000/api/recommendations/cache \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 7. Get Cache Statistics (Admin Only)

Get cache performance statistics.

**Endpoint:** `GET /api/recommendations/cache/stats`

**Authentication:** Required (Admin role)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "keys": 42,
    "hits": 156,
    "misses": 38,
    "hitRate": 0.804,
    "ksize": 2048,
    "vsize": 153600
  }
}
```

## Similarity Algorithms

### 1. TF-IDF + Cosine Similarity (Content-Based)

**Purpose:** Measure semantic similarity between post contents.

**Process:**
1. Preprocess text (lowercase, remove HTML, tokenize)
2. Remove stop words
3. Build TF-IDF vectors for all posts
4. Calculate cosine similarity between vectors

**Formula:**
```
cosine_similarity = (A · B) / (||A|| × ||B||)
```

**Weight in Hybrid Score:** 40% (default)

### 2. Jaccard Similarity (Tag-Based)

**Purpose:** Measure tag overlap between posts.

**Formula:**
```
jaccard_similarity = |A ∩ B| / |A ∪ B|
```

**Example:**
- Post A tags: ["action", "shounen", "supernatural"]
- Post B tags: ["action", "shounen", "adventure"]
- Intersection: {"action", "shounen"} = 2
- Union: {"action", "shounen", "supernatural", "adventure"} = 4
- Jaccard: 2/4 = 0.5

**Weight in Hybrid Score:** 20% (default)

### 3. Category Similarity

**Purpose:** Boost posts from the same category.

**Formula:**
```
category_similarity = category_A == category_B ? 1.0 : 0.0
```

**Weight in Hybrid Score:** 15% (default)

### 4. Anime Series Similarity

**Purpose:** Identify related episodes and seasons.

**Logic:**
- Same anime, same season: 1.0
- Same anime, adjacent seasons: 0.7
- Same anime, different seasons: 0.5
- Different anime: 0.0

**Weight in Hybrid Score:** 15% (default)

### 5. Engagement Similarity

**Purpose:** Favor popular content in recommendations.

**Formula:**
```
engagement_similarity = candidate_engagement_score / max_engagement_score
```

**Weight in Hybrid Score:** 10% (default)

## Hybrid Scoring Formula

```javascript
hybrid_score = 
  (0.40 × content_similarity) +
  (0.20 × tag_similarity) +
  (0.15 × category_similarity) +
  (0.15 × anime_similarity) +
  (0.10 × engagement_similarity)
```

### Customizing Weights

You can customize weights when calling the recommendation service:

```javascript
const weights = {
  content: 0.5,    // Increase content importance
  tags: 0.3,       // Increase tag importance
  category: 0.1,
  anime: 0.05,
  engagement: 0.05
};

recommendationService.findSimilarPosts(post, allPosts, { weights });
```

## Text Preprocessing

### Stop Words

The service removes common words that don't contribute to similarity:

```javascript
['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
 'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
 'this', 'that', 'these', 'those', 'it', 'its', 'i', 'you', 'he',
 'she', 'they', 'we', 'him', 'her', 'them', 'us', 'anime', 'episode']
```

### Weighted Text Components

When creating text representation for similarity:

1. **Title**: 3× weight (most important)
2. **Anime Name**: 2× weight
3. **Tags**: 2× weight
4. **Content/Excerpt**: 1× weight (limited to 200 words)

## Caching Strategy

### Cache Configuration

- **TTL (Time To Live):** 3600 seconds (1 hour)
- **Check Period:** 600 seconds (10 minutes)
- **Max Keys:** 1000 entries

### Cache Keys

```javascript
// Similar posts
`similar:${postId}:${limit}:${minScore}`

// Personalized
`personalized:${sortedPostIds}:${limit}`

// Anime series
`anime:${animeName.toLowerCase()}:${limit}`

// Tags
`tag:${tag.toLowerCase()}:${limit}`

// Trending
`trending:${timeframe}:${limit}`
```

### Cache Invalidation

- **Automatic:** Entries expire after 1 hour
- **Manual:** Admin can clear cache via API
- **Recommended:** Clear cache when posts are updated/published

## Performance Considerations

### Optimization Strategies

1. **Caching:** 1-hour cache reduces database queries by ~80%
2. **Selective Fields:** Only load necessary fields for similarity calculation
3. **Limit Post Count:** Recommendation calculation is O(n²), limit to active posts
4. **Async Processing:** Consider background jobs for pre-computing similarities
5. **Index Strategy:** Ensure indexes on: `status`, `isDeleted`, `tags`, `category`, `publishedAt`

### Scalability Guidelines

| Post Count | Performance | Recommendation |
|------------|-------------|----------------|
| < 1,000    | Excellent   | Real-time calculation |
| 1,000-5,000 | Good       | Real-time with caching |
| 5,000-10,000 | Moderate  | Pre-compute popular posts |
| > 10,000   | Heavy      | Background processing + caching |

### For Large Scale (>10,000 posts)

Consider implementing:
- Pre-computed similarity matrices
- Vector databases (Pinecone, Weaviate, Qdrant)
- Approximate nearest neighbor search (FAISS, Annoy)
- Background workers (Bull, Agenda) for batch processing

## Usage Examples

### Frontend Integration

```javascript
// Get similar posts for current post
async function loadSimilarPosts(postId) {
  const response = await fetch(
    `/api/recommendations/similar/${postId}?limit=6&includeBreakdown=false`
  );
  const data = await response.json();
  return data.data;
}

// Get personalized recommendations based on user history
async function loadPersonalizedFeed(userReadHistory) {
  const response = await fetch('/api/recommendations/personalized', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postIds: userReadHistory.slice(-10), // Last 10 read posts
      limit: 20,
      diversityFactor: 0.4
    })
  });
  const data = await response.json();
  return data.data;
}

// Get trending posts for homepage
async function loadTrendingPosts() {
  const response = await fetch('/api/recommendations/trending?limit=10&timeframe=7');
  const data = await response.json();
  return data.data;
}
```

### Backend Service Integration

```javascript
const recommendationService = require('./utils/recommendationService');
const Post = require('./models/Post');

// Find similar posts programmatically
async function findRelatedContent(postId) {
  const targetPost = await Post.findById(postId);
  const allPosts = await Post.find({ status: 'published', isDeleted: false });
  
  const similar = recommendationService.findSimilarPosts(
    targetPost,
    allPosts,
    {
      limit: 10,
      minScore: 0.3,
      weights: {
        content: 0.5,
        tags: 0.3,
        category: 0.1,
        anime: 0.05,
        engagement: 0.05
      }
    }
  );
  
  return similar;
}
```

## Testing

### Manual Testing

```bash
# 1. Get similar posts
curl http://localhost:5000/api/recommendations/similar/YOUR_POST_ID?limit=5

# 2. Get personalized recommendations
curl -X POST http://localhost:5000/api/recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{"postIds": ["POST_ID_1", "POST_ID_2"], "limit": 10}'

# 3. Get trending posts
curl http://localhost:5000/api/recommendations/trending?timeframe=7

# 4. Get cache stats (admin)
curl http://localhost:5000/api/recommendations/cache/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Unit Testing Recommendations

```javascript
// Test TF-IDF similarity
describe('RecommendationService', () => {
  test('should calculate cosine similarity correctly', () => {
    const vecA = { 'action': 0.5, 'anime': 0.3 };
    const vecB = { 'action': 0.4, 'anime': 0.6 };
    const similarity = recommendationService.cosineSimilarity(vecA, vecB);
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  test('should calculate Jaccard similarity for tags', () => {
    const tagsA = ['action', 'shounen', 'supernatural'];
    const tagsB = ['action', 'shounen', 'adventure'];
    const similarity = recommendationService.jaccardSimilarity(tagsA, tagsB);
    expect(similarity).toBe(0.5); // 2 common / 4 total
  });
});
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Cache Hit Rate:** Should be > 70% for optimal performance
2. **Average Response Time:** < 200ms for cached, < 2s for uncached
3. **Recommendation Click-Through Rate:** Track user engagement
4. **Diversity Score:** Ensure recommendations aren't too homogeneous
5. **Coverage:** Percentage of posts that receive recommendations

### Logging

The system logs important events:

```javascript
// Building TF-IDF model
logger.info(`TF-IDF model built with ${posts.length} documents`);

// Finding similar posts
logger.info(`Found ${similarities.length} similar posts for post ${targetPost._id}`);

// Cache hits
logger.info(`Cache hit for similar posts: ${postId}`);

// Errors
logger.error('Error finding similar posts:', error);
```

## Future Enhancements

### Planned Features

1. **Collaborative Filtering**
   - User-based similarity
   - Item-based similarity
   - Matrix factorization

2. **Neural Embeddings**
   - BERT/Sentence-BERT for semantic understanding
   - Word2Vec for tag relationships
   - Document embeddings for better content matching

3. **A/B Testing Framework**
   - Test different weight configurations
   - Compare algorithm performance
   - User engagement tracking

4. **Real-time Updates**
   - WebSocket notifications for new recommendations
   - Incremental model updates
   - Live trending calculations

5. **Advanced Diversity**
   - Category balancing
   - Temporal diversity (mix old and new)
   - Author diversity

6. **User Preferences**
   - Explicit preference settings
   - Implicit feedback learning
   - Personalized weights

## Troubleshooting

### Common Issues

**Problem:** Recommendations are all from the same category

**Solution:** Increase `diversityFactor` in personalized recommendations or adjust category weight lower.

---

**Problem:** Similar posts endpoint is slow (>2s)

**Solution:** 
- Check if cache is working
- Reduce the total number of posts being compared
- Consider pre-computing for popular posts

---

**Problem:** No similar posts found

**Solution:**
- Lower `minScore` threshold
- Check if target post has enough content/tags
- Verify posts are published and not deleted

---

**Problem:** Cache not working

**Solution:**
- Check node-cache is installed
- Verify TTL configuration
- Look for cache clear operations

## References

- **TF-IDF Algorithm:** [Wikipedia](https://en.wikipedia.org/wiki/Tf%E2%80%93idf)
- **Cosine Similarity:** [Wikipedia](https://en.wikipedia.org/wiki/Cosine_similarity)
- **Jaccard Similarity:** [Wikipedia](https://en.wikipedia.org/wiki/Jaccard_index)
- **Natural Library:** [GitHub](https://github.com/NaturalNode/natural)
- **Node-Cache:** [npm](https://www.npmjs.com/package/node-cache)

## Support

For issues or questions:
- Check the logs in `/logs` directory
- Review cache statistics via admin endpoint
- Open an issue in the repository

---

**Last Updated:** October 25, 2025
**Version:** 1.0.0
**Author:** AniNotion Development Team

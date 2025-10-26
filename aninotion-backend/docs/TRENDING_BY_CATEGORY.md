# Trending Posts by Category API

## Overview
The trending by category endpoint allows you to retrieve trending posts filtered by a specific category. Posts are ranked based on their engagement score (views + likes + bookmarks).

## Endpoint

```
GET /api/recommendations/trending/category/:categoryId
```

## Parameters

### Path Parameters
- **categoryId** (required): The MongoDB ObjectId of the category to filter by

### Query Parameters
- **limit** (optional): Number of posts to return
  - Default: `10`
  - Min: `1`
  - Max: `100`
  
- **timeframe** (optional): Number of days to look back for trending calculation
  - Default: `7`
  - Min: `1`
  - Max: `365`

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "cached": false,
  "count": 5,
  "data": [
    {
      "_id": "68befe40f4374a0f2987de00",
      "title": "Post Title",
      "slug": "post-slug",
      "animeName": "Anime Name",
      "category": {
        "_id": "683b36c714ff13f3f7fdb68e",
        "name": "Anime",
        "slug": "anime"
      },
      "content": "Post content...",
      "status": "published",
      "views": 70,
      "likesCount": 0,
      "engagementScore": 70,
      "excerpt": "Post excerpt...",
      "readingTimeMinutes": 1,
      "images": [],
      "createdAt": "2025-09-08T16:03:12.224Z",
      "updatedAt": "2025-10-09T11:24:20.448Z"
    }
  ]
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Category ID is required"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Error getting trending posts by category"
}
```

## Engagement Score Calculation

The engagement score is calculated as:
```
engagementScore = views + likesCount + bookmarksCount
```

Posts are sorted by this score in descending order (highest engagement first).

## Caching

- Results are cached for 1 hour (3600 seconds)
- Cache key format: `trending:category:{categoryId}:{limit}:{timeframe}`
- Subsequent requests with the same parameters will return cached results
- Cache can be cleared via the admin endpoint: `DELETE /api/recommendations/cache`

## Examples

### Get top 5 trending posts in Anime category
```bash
curl "http://localhost:5000/api/recommendations/trending/category/683b36c714ff13f3f7fdb68e?limit=5"
```

### Get top 10 trending posts in Music category from last 30 days
```bash
curl "http://localhost:5000/api/recommendations/trending/category/68fbcc97204dc78f40680ec4?limit=10&timeframe=30"
```

### Using in Frontend
```javascript
const fetchTrendingByCategory = async (categoryId, limit = 10) => {
  try {
    const response = await fetch(
      `${API_URL}/api/recommendations/trending/category/${categoryId}?limit=${limit}`
    );
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return [];
  }
};
```

## Notes

- Only published posts are included in results
- Deleted posts are excluded
- Posts must belong to the specified category
- If no posts are found in the category, an empty array is returned with `success: true`
- The `cached` field indicates whether the response came from cache

# Trending by Category - Frontend Integration

## Overview
The trending by category feature allows users to see trending posts filtered by specific categories. This is integrated into the CategoryPage with a dedicated sidebar showing the most popular posts within that category.

## Components Modified

### 1. API Service (`src/services/api.js`)

Added new method to `recommendationsAPI`:

```javascript
getTrendingByCategory: async (categoryId, options = {}) => {
  const { limit = 10, timeframe = 7 } = options;
  
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    timeframe: timeframe.toString()
  });

  const url = `${API_BASE_URL}/recommendations/trending/category/${categoryId}?${queryParams}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch trending posts by category');
  }

  return response.json();
}
```

**Usage:**
```javascript
import { recommendationsAPI } from '../services/api';

// Get top 5 trending posts in a specific category
const response = await recommendationsAPI.getTrendingByCategory(
  'categoryId123',
  { limit: 5, timeframe: 7 }
);
```

### 2. TrendingSidebar Component (`src/components/TrendingSidebar.jsx`)

**Enhanced to support category filtering:**

```jsx
<TrendingSidebar 
  categoryId={category._id}  // Optional: filter by category
  limit={5}                   // Number of posts
  timeframe={7}               // Days to look back
/>
```

**Props:**
- `categoryId` (optional): MongoDB ObjectId of the category to filter by
- `limit` (default: 5): Number of trending posts to display
- `timeframe` (default: 7): Number of days for trending calculation
- `className` (optional): Additional CSS classes

**Behavior:**
- If `categoryId` is provided → Shows category-specific trending posts
- If `categoryId` is null/undefined → Shows global trending posts
- Automatically fetches data when `categoryId`, `limit`, or `timeframe` changes

### 3. CategoryPage Component (`src/pages/CategoryPage.jsx`)

**Added sidebar layout with trending posts:**

```jsx
<div className="flex gap-6">
  {/* Main Content */}
  <div className="flex-1 min-w-0">
    {/* Posts, header, etc. */}
  </div>

  {/* Right Sidebar - Trending in Category */}
  <div className="hidden lg:block w-80 flex-shrink-0">
    <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <TrendingSidebar 
        categoryId={category._id}
        limit={5} 
        timeframe={7}
      />
    </div>
  </div>
</div>
```

**Layout Features:**
- Sidebar hidden on mobile (`hidden lg:block`)
- Sticky positioning keeps sidebar visible while scrolling
- 320px width (w-80) for optimal readability
- Scrollable if content exceeds viewport height
- Flexbox layout with gap for clean separation

## User Experience

### Desktop View
- **Category Page**: Shows category-specific trending posts in right sidebar
- **Posts are ranked** by engagement score (views + likes + bookmarks)
- **Sidebar is sticky**: Remains visible while scrolling through posts
- **Top 3 posts** have special badge styling (gold, silver, bronze)

### Mobile View
- **Sidebar is hidden** to maximize content space
- Users see full-width post listings
- Maintains responsive design principles

## Engagement Score

Posts are ranked by their engagement score:
```
engagementScore = views + likesCount + bookmarksCount
```

Higher engagement = higher ranking in trending sidebar.

## Caching

- Results cached for **1 hour** on the backend
- Cache key includes: `categoryId`, `limit`, and `timeframe`
- Improves performance and reduces database load
- Cache automatically expires or can be manually cleared by admins

## Visual Design

The sidebar uses the same styling as the global trending sidebar:
- **Icon**: 🔥 Flame icon (orange)
- **Title**: "Trending"
- **Rankings**: Numbered badges (1-5)
- **Special styling** for top 3:
  - #1: Gold/yellow badge with flame icon
  - #2: Silver/gray badge with flame icon
  - #3: Bronze/orange badge with flame icon
  - #4-5: Plain numbered badges

## Example Usage

### In CategoryPage:
```jsx
// Show top 10 trending posts from last 30 days
<TrendingSidebar 
  categoryId={category._id}
  limit={10} 
  timeframe={30}
/>
```

### In Home (Global Trending):
```jsx
// Show global trending (no category filter)
<TrendingSidebar 
  limit={5} 
  timeframe={7}
/>
```

### With Custom Styling:
```jsx
<TrendingSidebar 
  categoryId={category._id}
  limit={5} 
  timeframe={7}
  className="shadow-lg"
/>
```

## API Response Format

```json
{
  "success": true,
  "cached": false,
  "count": 5,
  "data": [
    {
      "_id": "postId",
      "title": "Post Title",
      "slug": "post-slug",
      "animeName": "Anime Name",
      "category": {
        "_id": "categoryId",
        "name": "Category Name",
        "slug": "category-slug"
      },
      "views": 70,
      "likesCount": 5,
      "bookmarksCount": 3,
      "engagementScore": 78,
      "excerpt": "Post excerpt...",
      "images": [],
      "createdAt": "2025-09-08T16:03:12.224Z"
    }
  ]
}
```

## Error Handling

The component handles errors gracefully:
- **Network errors**: Shows "Failed to load trending posts"
- **Empty results**: Shows "No trending posts yet"
- **Invalid category**: Backend returns appropriate error

## Testing

### Manual Testing:
1. Navigate to any category page (e.g., `/category/anime`)
2. Verify sidebar appears on desktop (screen width > 1024px)
3. Verify sidebar hidden on mobile (screen width < 1024px)
4. Check that only posts from that category appear in trending
5. Verify engagement scores are calculated correctly
6. Test scrolling behavior (sidebar should remain sticky)

### API Testing:
```bash
# Test category-specific trending
curl "http://localhost:5000/api/recommendations/trending/category/CATEGORY_ID?limit=5"

# Verify caching
curl "http://localhost:5000/api/recommendations/trending/category/CATEGORY_ID?limit=5"
# Second call should return cached: true
```

## Performance Considerations

- **Backend caching** reduces database queries
- **Component memoization** prevents unnecessary re-renders
- **Lazy loading** only fetches when component mounts
- **Responsive images** optimize bandwidth usage
- **Sticky positioning** uses CSS (no JavaScript)

## Future Enhancements

Potential improvements:
- [ ] Add time-based filtering UI (7 days, 30 days, all time)
- [ ] Show engagement metrics on hover
- [ ] Add "View all trending" link to dedicated page
- [ ] Implement real-time updates with WebSocket
- [ ] Add animated transitions for ranking changes
- [ ] Support multiple timeframe views in same sidebar

## Related Documentation

- [Backend: Trending by Category API](/workspaces/AniNotion/aninotion-backend/docs/TRENDING_BY_CATEGORY.md)
- [Sidebar Templates Guide](./SIDEBAR_TEMPLATES_GUIDE.md)
- [Recommendation Frontend Integration](./RECOMMENDATION_FRONTEND_INTEGRATION.md)

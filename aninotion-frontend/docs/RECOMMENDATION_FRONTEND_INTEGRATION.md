# Recommendation Engine - Frontend Integration Guide

## Overview

This guide covers the frontend integration of the AniNotion recommendation engine, including API service methods, React components, and usage examples.

## 📦 Components Created

### 1. API Service (`src/services/api.js`)

Added `recommendationsAPI` with the following methods:

```javascript
// Get similar posts for a specific post
recommendationsAPI.getSimilarPosts(postId, options)

// Get personalized recommendations
recommendationsAPI.getPersonalized(postIds, options)

// Get anime-based recommendations
recommendationsAPI.getAnimeRecommendations(animeName, options)

// Get tag-based recommendations
recommendationsAPI.getTagRecommendations(tag, options)

// Get trending posts
recommendationsAPI.getTrending(options)

// Admin: Clear cache
recommendationsAPI.clearCache()

// Admin: Get cache stats
recommendationsAPI.getCacheStats()
```

### 2. RecommendedPosts Component (`src/components/RecommendedPosts.jsx`)

A versatile component for displaying recommendations in a sidebar or section.

**Features:**
- ✅ Supports multiple recommendation types (similar, trending, personalized)
- ✅ Responsive grid/list layout
- ✅ Loading states with shimmer effects
- ✅ Error handling
- ✅ Click to navigate to post
- ✅ Shows similarity scores
- ✅ Displays engagement metrics
- ✅ Tag display

**Props:**
```javascript
{
  postId: string,           // Required for 'similar' type
  type: string,             // 'similar' | 'trending' | 'personalized'
  limit: number,            // Number of recommendations (default: 6)
  postIds: array,           // Required for 'personalized' type
  className: string         // Additional CSS classes
}
```

### 3. TrendingPosts Component (`src/components/TrendingPosts.jsx`)

A full-width component for displaying trending posts in a grid layout.

**Features:**
- ✅ Responsive grid layout (1-4 columns)
- ✅ Trending badges for top 3 posts
- ✅ Engagement scores
- ✅ Hover effects and animations
- ✅ Configurable timeframe

**Props:**
```javascript
{
  limit: number,            // Number of posts (default: 10)
  timeframe: number,        // Days to look back (default: 7)
  showTitle: boolean,       // Show section title (default: true)
  className: string         // Additional CSS classes
}
```

## 🚀 Usage Examples

### Example 1: Similar Posts Sidebar (PostPage)

Already integrated in `PostPage.jsx`:

```jsx
import RecommendedPosts from '../components/RecommendedPosts';

const PostPage = () => {
  const { id } = useParams();
  
  return (
    <div className="flex gap-8">
      {/* Main Content */}
      <div className="flex-1">
        {/* Post content */}
      </div>
      
      {/* Recommendations Sidebar */}
      <div className="w-80">
        <RecommendedPosts 
          postId={id}
          type="similar"
          limit={6}
        />
      </div>
    </div>
  );
};
```

### Example 2: Trending Posts on Homepage

```jsx
import TrendingPosts from '../components/TrendingPosts';

const HomePage = () => {
  return (
    <div>
      {/* Hero section */}
      
      {/* Trending Posts Section */}
      <TrendingPosts 
        limit={8}
        timeframe={7}
        showTitle={true}
        className="my-8"
      />
      
      {/* Other sections */}
    </div>
  );
};
```

### Example 3: Personalized Recommendations

```jsx
import { useState, useEffect } from 'react';
import RecommendedPosts from '../components/RecommendedPosts';

const PersonalizedFeed = () => {
  const [userHistory, setUserHistory] = useState([]);
  
  useEffect(() => {
    // Get user's reading history from localStorage or API
    const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
    setUserHistory(history);
  }, []);
  
  return (
    <div>
      <h2>Recommended For You</h2>
      <RecommendedPosts 
        type="personalized"
        postIds={userHistory.map(item => item.postId)}
        limit={10}
      />
    </div>
  );
};
```

### Example 4: Anime-Based Recommendations

```jsx
import { recommendationsAPI } from '../services/api';

const AnimeSeriesPage = ({ animeName }) => {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    const fetchAnimePosts = async () => {
      const response = await recommendationsAPI.getAnimeRecommendations(
        animeName, 
        { limit: 12 }
      );
      
      if (response.success) {
        setPosts(response.data);
      }
    };
    
    fetchAnimePosts();
  }, [animeName]);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {posts.map(post => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};
```

### Example 5: Tag-Based Discovery

```jsx
import { useParams } from 'react-router-dom';
import { recommendationsAPI } from '../services/api';

const TagPage = () => {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    const fetchTagPosts = async () => {
      const response = await recommendationsAPI.getTagRecommendations(
        tag, 
        { limit: 20 }
      );
      
      if (response.success) {
        setPosts(response.data);
      }
    };
    
    fetchTagPosts();
  }, [tag]);
  
  return (
    <div>
      <h1>Posts tagged with "{tag}"</h1>
      {/* Display posts */}
    </div>
  );
};
```

## 🎨 Styling & Customization

### Custom Styling

Both components accept a `className` prop for custom styling:

```jsx
<RecommendedPosts 
  postId={id}
  type="similar"
  className="mt-8 lg:sticky lg:top-4"
/>

<TrendingPosts 
  limit={8}
  className="container mx-auto px-4 my-12"
/>
```

### Tailwind Classes Used

The components use Tailwind CSS classes. Key classes:

- **Layout**: `flex`, `grid`, `space-x-*`, `gap-*`
- **Responsive**: `sm:`, `md:`, `lg:`, `xl:`
- **Hover Effects**: `hover:shadow-xl`, `group-hover:scale-110`
- **Animations**: `transition-*`, `duration-*`, `animate-pulse`

## 📱 Responsive Design

### RecommendedPosts

- **Mobile**: Vertical list with compact cards
- **Tablet**: Same as mobile
- **Desktop**: Sidebar width with optimized spacing

### TrendingPosts

- **Mobile**: 1 column grid
- **Tablet**: 2 column grid
- **Desktop**: 3 column grid
- **Large Desktop**: 4 column grid

## 🔄 State Management

### Loading States

Both components include loading shimmer effects:

```jsx
if (loading) {
  return (
    <div className="animate-pulse">
      {/* Skeleton UI */}
    </div>
  );
}
```

### Error Handling

Graceful error handling with fallback UI:

```jsx
if (error) {
  return (
    <div className="text-center py-8">
      <p>Unable to load recommendations</p>
    </div>
  );
}
```

### Empty States

Clear messaging when no data is available:

```jsx
if (!recommendations.length) {
  return (
    <div className="text-center py-8">
      <p>No recommendations available</p>
    </div>
  );
}
```

## 🎯 User Experience Features

### 1. Similarity Score Display

Shows how similar a post is to the current one:

```jsx
{post.similarityScore && (
  <span className="text-purple-600 font-medium">
    {(post.similarityScore * 100).toFixed(0)}% match
  </span>
)}
```

### 2. Trending Badges

Top 3 trending posts get special badges:

```jsx
{index < 3 && (
  <div className="bg-gradient-to-r from-orange-500 to-red-500">
    <TrendingUp size={12} />
    <span>#{index + 1}</span>
  </div>
)}
```

### 3. Engagement Metrics

Display views, likes, and engagement scores:

```jsx
<div className="flex items-center space-x-3">
  <Eye size={14} />
  <span>{post.views.toLocaleString()}</span>
  
  <ThumbsUp size={14} />
  <span>{post.likesCount.toLocaleString()}</span>
</div>
```

### 4. Click to Navigate

All recommendations are clickable:

```jsx
onClick={() => navigate(`/posts/${post._id}`)}
```

## 🔧 Advanced Customization

### Custom Recommendation Logic

Create a custom hook for specific use cases:

```jsx
// hooks/useCustomRecommendations.js
import { useState, useEffect } from 'react';
import { recommendationsAPI } from '../services/api';

export const useCustomRecommendations = (postId, filters) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetch = async () => {
      const response = await recommendationsAPI.getSimilarPosts(postId, {
        limit: filters.limit,
        minScore: filters.minScore
      });
      
      // Apply custom filtering
      let filtered = response.data;
      
      if (filters.category) {
        filtered = filtered.filter(p => p.category._id === filters.category);
      }
      
      if (filters.excludeTags) {
        filtered = filtered.filter(p => 
          !p.tags.some(tag => filters.excludeTags.includes(tag))
        );
      }
      
      setRecommendations(filtered);
      setLoading(false);
    };
    
    fetch();
  }, [postId, filters]);
  
  return { recommendations, loading };
};
```

### Tracking User Interactions

Track which recommendations users click:

```jsx
const handlePostClick = (post) => {
  // Track analytics
  if (window.gtag) {
    window.gtag('event', 'recommendation_click', {
      post_id: post._id,
      recommendation_type: type,
      similarity_score: post.similarityScore
    });
  }
  
  // Update user history
  const history = JSON.parse(localStorage.getItem('readHistory') || '[]');
  history.push({
    postId: post._id,
    timestamp: Date.now()
  });
  localStorage.setItem('readHistory', JSON.stringify(history.slice(-20)));
  
  // Navigate
  navigate(`/posts/${post._id}`);
};
```

## 🧪 Testing Integration

### Manual Testing Checklist

- [ ] Similar posts load on PostPage
- [ ] Trending posts display correctly
- [ ] Click navigation works
- [ ] Loading states appear properly
- [ ] Error states handle gracefully
- [ ] Responsive on mobile/tablet/desktop
- [ ] Images load with correct referrer policy
- [ ] Similarity scores display for similar posts
- [ ] Trending badges show for top posts
- [ ] View counts format correctly

### Test with Different Data

```javascript
// Test with no recommendations
<RecommendedPosts postId="nonexistent-id" type="similar" />

// Test with many recommendations
<TrendingPosts limit={20} />

// Test with empty history
<RecommendedPosts type="personalized" postIds={[]} />
```

## 🚀 Performance Optimization

### 1. Caching

The backend caches results for 1 hour. No additional frontend caching needed.

### 2. Lazy Loading

For large lists, implement infinite scroll:

```jsx
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const InfiniteTrending = () => {
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  
  const loadMore = async () => {
    const response = await recommendationsAPI.getTrending({
      limit: 10,
      offset: page * 10
    });
    setPosts([...posts, ...response.data]);
    setPage(page + 1);
  };
  
  useInfiniteScroll(loadMore);
  
  return <div>{/* Render posts */}</div>;
};
```

### 3. Image Optimization

Images use `referrerPolicy="no-referrer"` for external sources.

## 📊 Analytics Integration

Track recommendation performance:

```jsx
useEffect(() => {
  if (recommendations.length > 0) {
    // Track impression
    if (window.gtag) {
      window.gtag('event', 'recommendations_viewed', {
        type: type,
        count: recommendations.length,
        post_id: postId
      });
    }
  }
}, [recommendations]);
```

## 🔒 Admin Features

### Cache Management

For admin users, add cache controls:

```jsx
import { recommendationsAPI } from '../services/api';

const AdminPanel = () => {
  const [cacheStats, setCacheStats] = useState(null);
  
  const loadStats = async () => {
    const stats = await recommendationsAPI.getCacheStats();
    setCacheStats(stats.data);
  };
  
  const clearCache = async () => {
    await recommendationsAPI.clearCache();
    alert('Cache cleared successfully');
  };
  
  return (
    <div>
      <h2>Cache Statistics</h2>
      <p>Hit Rate: {(cacheStats?.hitRate * 100).toFixed(1)}%</p>
      <p>Keys: {cacheStats?.keys}</p>
      <button onClick={clearCache}>Clear Cache</button>
    </div>
  );
};
```

## 🎯 Next Steps

1. **Add to More Pages**
   - Homepage trending section
   - Category pages with category-specific recommendations
   - User profile with personalized feed

2. **Enhanced Features**
   - Bookmark/save recommendations
   - Share recommendations
   - Dismiss/hide recommendations
   - Rate recommendations (thumbs up/down)

3. **Analytics**
   - Track click-through rates
   - Measure engagement with recommendations
   - A/B test different layouts

4. **Customization**
   - User preference settings
   - Custom recommendation weights
   - Filter options

## 📚 Related Documentation

- **Backend API**: `aninotion-backend/docs/RECOMMENDATION_ENGINE.md`
- **Quick Start**: `aninotion-backend/docs/RECOMMENDATION_QUICK_START.md`
- **API Reference**: `aninotion-backend/docs/RECOMMENDATION_ENGINE.md#api-endpoints`

---

**Last Updated**: October 25, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready

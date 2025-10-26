# Example: Adding Trending Posts to HomePage

## Quick Integration Example

Here's how to add a trending posts section to your homepage:

### Step 1: Import the Component

```jsx
// src/pages/Home.jsx
import TrendingPosts from '../components/TrendingPosts';
```

### Step 2: Add to JSX (After SEO, Before Main Posts)

```jsx
const Home = () => {
  // ... existing state and functions ...

  return (
    <div className="max-w-7xl mx-auto">
      <SEO 
        title="AniNotion - Anime Reviews & News"
        description="Your source for anime reviews, news, and discussions"
      />

      {/* Header with Create Post Button */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Latest Posts</h1>
        {/* ... existing buttons ... */}
      </div>

      {/* NEW: Trending Posts Section */}
      <TrendingPosts 
        limit={8}
        timeframe={7}
        showTitle={true}
        className="mb-12"
      />

      {/* Existing Posts Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <PostsContainer posts={posts} />
      )}

      {/* ... rest of the component ... */}
    </div>
  );
};
```

## Full Example with Conditional Rendering

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import PostFormWithToggle from '../components/PostFormWithToggle';
import PostsContainer from '../components/PostsContainer';
import TrendingPosts from '../components/TrendingPosts';
import LoadingSpinner from '../components/LoadingSpinner';
import SEO from '../components/SEO';
import { postsAPI } from '../services/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrending, setShowTrending] = useState(true);

  // ... existing state and functions ...

  return (
    <div className="max-w-7xl mx-auto px-4">
      <SEO 
        title="AniNotion - Anime Reviews & News"
        description="Your source for anime reviews, news, and discussions"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Discover Amazing Anime Content
        </h1>
        <p className="text-gray-600">
          Read the latest reviews, news, and discussions
        </p>
      </div>

      {/* Trending Section (only show when not loading) */}
      {!isLoading && showTrending && (
        <div className="mb-12">
          <TrendingPosts 
            limit={8}
            timeframe={7}
            showTitle={true}
          />
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* All Posts Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">All Posts</h2>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <PostsContainer posts={posts} />
      )}

      {/* ... rest of component ... */}
    </div>
  );
};

export default Home;
```

## Advanced: Tabbed Interface

```jsx
const Home = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'trending'
  const [posts, setPosts] = useState([]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <SEO />

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'trending'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔥 Trending
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'all' ? (
        <PostsContainer posts={posts} />
      ) : (
        <TrendingPosts 
          limit={12}
          timeframe={7}
          showTitle={false}
        />
      )}
    </div>
  );
};
```

## Different Layouts

### Horizontal Scroll on Mobile

```jsx
<div className="mb-12">
  <h2 className="text-2xl font-bold mb-4">🔥 Trending This Week</h2>
  
  {/* Desktop: Grid, Mobile: Horizontal Scroll */}
  <div className="overflow-x-auto lg:overflow-visible">
    <div className="flex lg:grid lg:grid-cols-4 gap-4 pb-4 lg:pb-0">
      <TrendingPosts 
        limit={8}
        showTitle={false}
        className="flex-shrink-0 w-64 lg:w-auto"
      />
    </div>
  </div>
</div>
```

### Sidebar Layout

```jsx
<div className="flex gap-8">
  {/* Main Content */}
  <div className="flex-1">
    <PostsContainer posts={posts} />
  </div>

  {/* Sidebar with Trending */}
  <aside className="w-80 space-y-6">
    <TrendingPosts 
      limit={5}
      timeframe={7}
      showTitle={true}
    />
    
    {/* Other sidebar widgets */}
  </aside>
</div>
```

## Configuration Options

### Show Different Timeframes

```jsx
// Last 24 hours
<TrendingPosts timeframe={1} limit={5} />

// Last 3 days
<TrendingPosts timeframe={3} limit={8} />

// Last 30 days
<TrendingPosts timeframe={30} limit={10} />
```

### Custom Styling

```jsx
<TrendingPosts 
  limit={8}
  timeframe={7}
  showTitle={true}
  className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl"
/>
```

### Conditional Display

```jsx
const Home = () => {
  const [hasTrending, setHasTrending] = useState(false);

  return (
    <div>
      {/* Only show if there are trending posts */}
      {hasTrending && (
        <TrendingPosts 
          limit={8}
          onLoad={(data) => setHasTrending(data.length > 0)}
        />
      )}
    </div>
  );
};
```

## Performance Tips

### Lazy Load Trending

```jsx
import { lazy, Suspense } from 'react';

const TrendingPosts = lazy(() => import('../components/TrendingPosts'));

const Home = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading trending...</div>}>
        <TrendingPosts limit={8} />
      </Suspense>
      
      <PostsContainer posts={posts} />
    </div>
  );
};
```

### Only Load on Viewport

```jsx
import { useInView } from 'react-intersection-observer';

const Home = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div>
      <div ref={ref}>
        {inView && <TrendingPosts limit={8} />}
      </div>
    </div>
  );
};
```

## Testing

### 1. Check Display
- Visit homepage
- Look for "🔥 Trending This Week" section
- Should show 8 posts in grid

### 2. Verify Responsiveness
- Desktop: 4 columns
- Tablet: 2 columns
- Mobile: 1 column

### 3. Test Loading
- Should show shimmer effect first
- Then display posts
- Handle errors gracefully

### 4. Click Navigation
- Click any trending post
- Should navigate to post page
- Then show similar posts there

## Result

Your homepage will now have:
1. **Hero/Header** - Title and description
2. **Trending Section** - Hot posts from last 7 days
3. **All Posts** - Your existing infinite scroll grid

Users can discover popular content before scrolling through all posts!

---

**Ready to implement?** Just add the import and component to your Home.jsx! 🚀

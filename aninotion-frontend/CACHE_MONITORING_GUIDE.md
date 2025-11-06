# RTK Query Cache Monitoring Guide

This guide explains how to monitor and verify that RTK Query caching is working properly in your AniNotion application.

## 🚀 Quick Start

### 1. Enable Debug Logging

Add the cache debugger component to your app:

```jsx
import { RTKQueryCacheDebugger } from './components/RTKQueryCacheDebugger';

// Add to your main App component
function App() {
  return (
    <div>
      <RTKQueryCacheDebugger /> {/* Add this for debugging */}
      {/* Your existing app content */}
    </div>
  );
}
```

### 2. Enable RTK Query Debugging

Call the debug function in your app:

```jsx
import { enableRTKQueryDebugging } from './hooks/useRTKQuery';

// In your main component or store setup
useEffect(() => {
  enableRTKQueryDebugging();
}, []);
```

## 🔍 How to Check Cache Performance

### Method 1: Browser Console Logs

The custom hooks now log cache behavior:

- 🚀 **FETCHING** - Data is being loaded from API (cache miss)
- 💾 **USING CACHED** - Data is served from cache (cache hit)
- 🔄 **REFETCHING** - Background update from API
- 👍👎 **MUTATIONS** - Cache invalidation after mutations

**Example console output:**
```
🚀 [RTK Query] FETCHING posts from API (first load) {page: 1, filters: {}}
💾 [RTK Query] USING CACHED posts data {page: 1, postCount: 20, totalCount: 150}
🔄 [RTK Query] REFETCHING posts from API (background update) {page: 1, filters: {}}
```

### Method 2: Network Tab Monitoring

1. Open Browser DevTools → Network tab
2. Filter by "XHR" or "Fetch"
3. **Cache Hit**: No network request appears for cached data
4. **Cache Miss**: You'll see the API call in network tab

### Method 3: Redux DevTools

1. Install Redux DevTools browser extension
2. Open DevTools → Redux tab
3. Watch the `api` slice state changes
4. See cache invalidation when mutations occur

### Method 4: Cache Statistics Component

Use the `useRTKQueryCacheMonitor` hook:

```jsx
import { useRTKQueryCacheMonitor } from './hooks/useRTKQuery';

function MyComponent() {
  const { apiCalls, cacheHits, mutations, cacheHitRate, resetStats } = useRTKQueryCacheMonitor();

  return (
    <div>
      <p>API Calls: {apiCalls}</p>
      <p>Cache Hits: {cacheHits}</p>
      <p>Cache Hit Rate: {cacheHitRate}</p>
      <p>Mutations: {mutations}</p>
      <button onClick={resetStats}>Reset Stats</button>
    </div>
  );
}
```

## 📊 Understanding Cache Behavior

### Cache Hit Scenarios

- **Page refresh**: Data loads instantly from cache
- **Component remount**: Cached data is reused
- **Same query parameters**: Identical requests use cache

### Cache Miss Scenarios

- **First load**: Initial data fetch from API
- **Parameter change**: Different query parameters
- **Cache expiration**: Data older than cache time
- **Manual invalidation**: After mutations

### Cache Invalidation

Mutations automatically invalidate related caches:

```javascript
// When liking a post, these caches are invalidated:
// - Post details
// - User's liked posts
// - Post statistics
// - Feed/posts list (if post appears there)
```

## 🛠️ Cache Configuration

Current cache settings in `apiSlice.js`:

```javascript
// Posts: 5 minutes
// Categories: 10 minutes
// Anime details: 1 hour
// User data: 5 minutes
```

## 🔧 Troubleshooting

### Cache Not Working?

1. Check console for error messages
2. Verify query parameters are identical
3. Check if cache was invalidated by mutations
4. Ensure component isn't remounting unnecessarily

### Too Many API Calls?

1. Check if queries have different parameters
2. Verify cache invalidation isn't too aggressive
3. Consider increasing cache time for stable data

### Performance Issues?

1. Monitor cache hit rate (aim for 70-90%)
2. Check for unnecessary re-renders
3. Use `skip` option for conditional queries

## 📈 Expected Performance

With proper caching, you should see:
- **70-90% cache hit rate** for normal usage
- **Instant loading** for cached data
- **Reduced server load** by 70-90%
- **Better user experience** with optimistic updates

## 🎯 Testing Cache Behavior

1. **Load a page** → See API calls in console
2. **Refresh the page** → See cache hits in console
3. **Perform an action** (like/unlike) → See cache invalidation
4. **Load same data again** → Should use cache

The cache debugger component provides real-time statistics to help you monitor performance!</content>
<parameter name="filePath">/workspaces/AniNotion/aninotion-frontend/CACHE_MONITORING_GUIDE.md
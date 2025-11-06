# RTK Query: When API Calls Are Made vs Cache Hits

## 🎯 Core Decision Logic

RTK Query decides whether to make an API call or serve from cache based on these factors:

### 1. **Cache Status** - Does the data exist?
### 2. **Cache Validity** - Has the cache expired?
### 3. **Query Arguments** - Are the parameters the same?
### 4. **Cache Tags** - Has related data been invalidated?
### 5. **Manual Triggers** - Refetch, polling, etc.

---

## 📊 Detailed Flow Chart

```
Component calls useGetPostsQuery({ page: 1, limit: 20 })
         │
         ▼
    Check Cache Key
    (endpoint + arguments)
         │
    ┌────┴────┐
    │         │
Cache MISS   Cache HIT
    │         │
    ▼         ▼
Make API     Check Validity
Call         │
    │    ┌────┴────┐
    ▼    │         │
Response     Expired     Valid
    │         │         │
    ▼         ▼         ▼
Store in      Make API   Return Cached
Cache         Call       Data (0ms)
              │         │
              ▼         ▼
           Update       Component
           Cache        Renders
              │
              ▼
           Component
           Renders
```

---

## 🔍 Specific Scenarios

### Scenario 1: **First Time Query** → API Call
```javascript
// Component mounts for the first time
const { data } = useGetPostsQuery({ page: 1, limit: 20 });

// Result: API call made (cache miss)
```

### Scenario 2: **Same Query Again** → Cache Hit
```javascript
// Same component or different component with same query
const { data } = useGetPostsQuery({ page: 1, limit: 20 });

// Result: Cache hit (0ms response)
```

### Scenario 3: **Different Query Parameters** → API Call
```javascript
// Different page number
const { data } = useGetPostsQuery({ page: 2, limit: 20 });

// Result: API call made (different cache key)
```

### Scenario 4: **Cache Expired** → API Call
```javascript
// After 5 minutes (keepUnusedDataFor: 300)
const { data } = useGetPostsQuery({ page: 1, limit: 20 });

// Result: API call made (cache expired)
```

### Scenario 5: **After Mutation** → API Call
```javascript
// User creates a new post
const [createPost] = useCreatePostMutation();
await createPost(newPostData);

// Then viewing posts list
const { data } = useGetPostsQuery({ page: 1, limit: 20 });

// Result: API call made (cache invalidated by mutation)
```

### Scenario 6: **Background Refetch** → API Call
```javascript
// User returns to tab after 30+ seconds
const { data } = useGetPostsQuery({ page: 1, limit: 20 });

// Result: API call made (refetchOnFocus)
```

### Scenario 7: **Manual Refetch** → API Call
```javascript
const { data, refetch } = useGetPostsQuery({ page: 1, limit: 20 });

// User clicks refresh button
refetch();

// Result: API call made (manual trigger)
```

### Scenario 8: **Polling** → API Call
```javascript
const { data } = useGetTrendingQuery(
  { limit: 10 },
  { pollingInterval: 60000 } // Every 60 seconds
);

// Result: API call made every 60 seconds
```

---

## 🏷️ Cache Keys & Tags

### Cache Keys
Each query creates a unique cache key:
```
getPosts({"page":1,"limit":20})     → Cache Key A
getPosts({"page":2,"limit":20})     → Cache Key B
getPosts({"page":1,"limit":10})     → Cache Key C
getCategories()                     → Cache Key D
```

### Cache Tags
Mutations invalidate related cache tags:
```javascript
// Creating a post invalidates these tags:
invalidatesTags: [{ type: 'Post', id: 'LIST' }]

// Which clears cache for:
getPosts(...)     ← Cache cleared
getPostsByCategory(...) ← Cache cleared
// But NOT getCategories() or getAnimeDetails()
```

---

## ⏰ Cache Expiration Times

| Endpoint Type | Cache Duration | When Expired |
|---------------|----------------|--------------|
| Posts | 5 minutes | After 300 seconds |
| Categories | 10 minutes | After 600 seconds |
| Anime Details | 1 hour | After 3600 seconds |
| Anime Rankings | 30 minutes | After 1800 seconds |
| Recommendations | 10 minutes | After 600 seconds |
| Trending | 5 minutes | After 300 seconds |

**Expired cache = Next query makes API call**

---

## 🔄 Automatic Refetch Triggers

### 1. **refetchOnMount** (default: false)
```javascript
// When component mounts
const { data } = useGetPostsQuery(args, {
  refetchOnMount: true // Always fetch on mount
});
```

### 2. **refetchOnFocus** (default: false, but enabled globally)
```javascript
// When user returns to browser tab
// Automatically refetches stale queries
```

### 3. **refetchOnReconnect** (default: false, but enabled globally)
```javascript
// When internet connection restored
// Automatically refetches failed queries
```

---

## 🎯 Real-World Examples

### Example 1: Posts List Page
```javascript
function PostsList() {
  const { data, isLoading, isFetching } = useGetPostsQuery({
    page: 1, limit: 20
  });

  // First visit: API call (isLoading: true, isFetching: true)
  // Second visit: Cache hit (isLoading: false, isFetching: false)
  // After 5 min: API call (isLoading: false, isFetching: true)
}
```

### Example 2: Post Detail Page
```javascript
function PostDetail({ slug }) {
  const { data } = useGetPostBySlugQuery({ slug });

  // First visit to post: API call
  // Visit same post again: Cache hit
  // Visit different post: API call (different cache key)
}
```

### Example 3: After Creating Post
```javascript
function CreatePost() {
  const [createPost] = useCreatePostMutation();
  const { data: posts } = useGetPostsQuery({ page: 1 });

  const handleSubmit = async (data) => {
    await createPost(data);
    // Posts query automatically refetches (cache invalidated)
  };
}
```

### Example 4: Multiple Components
```javascript
// Component A (Header)
const { data: categories } = useGetCategoriesQuery();

// Component B (Sidebar) - Same query
const { data: categories } = useGetCategoriesQuery();

// Result: Only 1 API call, both components get cached data
```

---

## 🔧 Manual Cache Control

### Force Fresh Data
```javascript
const { data, refetch } = useGetPostsQuery(args);

// Always fetch fresh
const { data } = useGetPostsQuery(args, {
  refetchOnMount: true
});

// Manual refresh
<button onClick={refetch}>Refresh</button>
```

### Skip Query
```javascript
const { data } = useGetPostByIdQuery(
  { id: postId },
  { skip: !postId } // Don't fetch if no ID
);
```

### Clear All Cache
```javascript
import { apiSlice } from '../store/slices/apiSlice';
import { useDispatch } from 'react-redux';

const dispatch = useDispatch();
dispatch(apiSlice.util.resetApiState()); // Clear all cache
```

---

## 📊 Performance Monitoring

### Check Cache Status
```javascript
import { useCacheInfo } from '../hooks/useRTKQuery';

const cacheInfo = useCacheInfo('getPosts', { page: 1 });
console.log('Status:', cacheInfo?.status); // 'fulfilled', 'pending', 'uninitialized'
console.log('Age:', Date.now() - cacheInfo?.fulfilledTimeStamp);
```

### Redux DevTools
Install Redux DevTools to see:
- Cache hits vs API calls
- Cache invalidation events
- Query lifecycle

---

## 🎯 Summary: When API Calls Happen

### ✅ **API Call Made When:**
1. **First time** querying specific endpoint + arguments
2. **Cache expired** (based on `keepUnusedDataFor`)
3. **Different arguments** (different cache key)
4. **Cache invalidated** by mutation
5. **Manual refetch** triggered
6. **Polling interval** reached
7. **Focus/reconnect** events (if enabled)
8. **Component mount** (if `refetchOnMount: true`)

### ✅ **Cache Hit When:**
1. **Same query** called again within cache lifetime
2. **Multiple components** request same data
3. **Data still valid** and not invalidated

### 🎯 **Result: 70-90% fewer API calls!**

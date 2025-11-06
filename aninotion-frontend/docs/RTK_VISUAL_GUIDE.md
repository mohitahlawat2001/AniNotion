# RTK Query Visual Implementation Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     React Application                    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          Components (Your Pages)                │    │
│  │                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐           │    │
│  │  │  PostsList   │  │  PostDetail  │           │    │
│  │  │              │  │              │           │    │
│  │  │ useGetPosts  │  │ useGetPost   │           │    │
│  │  │ Query()      │  │ BySlug()     │           │    │
│  │  └──────┬───────┘  └──────┬───────┘           │    │
│  │         │                  │                    │    │
│  └─────────┼──────────────────┼────────────────────┘    │
│            │                  │                          │
│  ┌─────────▼──────────────────▼────────────────────┐    │
│  │         Redux Toolkit Query                      │    │
│  │                                                  │    │
│  │  ┌────────────────────────────────────────┐    │    │
│  │  │         Cache Layer                     │    │    │
│  │  │                                         │    │    │
│  │  │  Posts List (Page 1) ──► Cached 5min  │    │    │
│  │  │  Post Detail (ID:123) ─► Cached 5min  │    │    │
│  │  │  Categories ───────────► Cached 10min │    │    │
│  │  │  Anime Rankings ───────► Cached 30min │    │    │
│  │  └────────────────────────────────────────┘    │    │
│  │                                                  │    │
│  │  ┌────────────────────────────────────────┐    │    │
│  │  │     Cache Invalidation Logic           │    │    │
│  │  │                                         │    │    │
│  │  │  Create Post ──► Invalidate Posts List │    │    │
│  │  │  Update Post ──► Invalidate That Post  │    │    │
│  │  │  Like Post ────► Invalidate That Post  │    │    │
│  │  └────────────────────────────────────────┘    │    │
│  │                                                  │    │
│  └──────────────────────┬───────────────────────────┘    │
│                         │                                 │
│  ┌──────────────────────▼───────────────────────────┐    │
│  │         API Layer (Fetch)                        │    │
│  │                                                  │    │
│  │  Request Deduplication → Multiple components    │    │
│  │  requesting same data = Only 1 API call        │    │
│  └──────────────────────┬───────────────────────────┘    │
│                         │                                 │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │  Backend API    │
                │  (Your Server)  │
                └─────────────────┘
```

## 📊 Data Flow

### Query (GET Request)
```
Component renders
    │
    ▼
Check cache
    │
    ├─► Cache HIT ──► Return data (0ms) ──► Component renders
    │
    └─► Cache MISS ──► API request ──► Cache result ──► Component renders
```

### Mutation (POST/PUT/DELETE)
```
User action (e.g., create post)
    │
    ▼
useMutation hook
    │
    ▼
API request
    │
    ▼
Success/Error
    │
    ▼
Invalidate related cache tags
    │
    ▼
Auto-refetch affected queries
    │
    ▼
UI updates automatically
```

## 🎯 Cache Strategy

```
┌──────────────────────────────────────────────────────┐
│                   Cache Duration                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Frequently changing data:                           │
│  ├─ Posts ────────────────────── 5 minutes          │
│  ├─ Trending ─────────────────── 5 minutes          │
│  └─ Recommendations ──────────── 10 minutes         │
│                                                       │
│  Semi-static data:                                   │
│  ├─ Categories ───────────────── 10 minutes         │
│  ├─ User Profile ─────────────── 10 minutes         │
│  └─ Anime Rankings ───────────── 30 minutes         │
│                                                       │
│  Static data:                                        │
│  ├─ Anime Details ────────────── 1 hour             │
│  └─ Seasonal Anime ───────────── 1 hour             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## 🔄 Request Deduplication

```
Time: 0ms
Component A renders ──► useGetPostsQuery({ page: 1 })
                        │
                        ├─► API Request initiated
                        │
Time: 50ms              │
Component B renders ──► useGetPostsQuery({ page: 1 })
                        │
                        ├─► Joins existing request (no new API call)
                        │
Time: 200ms             │
API response ───────────┤
                        ├─► Component A receives data
                        └─► Component B receives data

Result: 1 API call instead of 2!
```

## 📈 Performance Comparison

### Before RTK Query
```
User Journey:
1. Visit Homepage ──────────► API Call (500ms) ──► Show Posts
2. Click Category ──────────► API Call (500ms) ──► Show Posts
3. Back to Homepage ────────► API Call (500ms) ──► Show Posts
4. Click Post ──────────────► API Call (400ms) ──► Show Post
5. Back to Homepage ────────► API Call (500ms) ──► Show Posts

Total Time: 2,400ms
Total API Calls: 5
```

### After RTK Query
```
User Journey:
1. Visit Homepage ──────────► API Call (500ms) ──► Show Posts [CACHED]
2. Click Category ──────────► API Call (500ms) ──► Show Posts [CACHED]
3. Back to Homepage ────────► Cache Hit (0ms) ──► Show Posts
4. Click Post ──────────────► API Call (400ms) ──► Show Post [CACHED]
5. Back to Homepage ────────► Cache Hit (0ms) ──► Show Posts

Total Time: 1,400ms (42% faster!)
Total API Calls: 2 (60% reduction!)
```

## 🎨 Hook Usage Pattern

### Query Hook Pattern
```
┌─────────────────────────────────────┐
│  const { data, isLoading, error }   │
│    = useGetPostsQuery({ page: 1 }) │
└────────────┬────────────────────────┘
             │
             ├─► data: API response data
             ├─► isLoading: true on first load
             ├─► isFetching: true when refetching
             ├─► error: error object if failed
             ├─► refetch: manual refetch function
             └─► isSuccess: true if successful
```

### Mutation Hook Pattern
```
┌────────────────────────────────────────┐
│  const [createPost, { isLoading }]     │
│    = useCreatePostMutation()           │
└────────────┬───────────────────────────┘
             │
             ├─► createPost(): trigger function
             ├─► isLoading: true while mutating
             ├─► error: error object if failed
             ├─► isSuccess: true if successful
             └─► reset(): reset mutation state
```

## 🔧 Common Patterns

### Pattern 1: List + Detail
```
┌────────────────────┐     ┌────────────────────┐
│   Posts List Page  │     │  Post Detail Page  │
│                    │     │                    │
│ useGetPostsQuery() │────►│ useGetPostBySlug() │
│                    │     │                    │
│ [Cached 5 min]     │     │ [Cached 5 min]     │
└────────────────────┘     └────────────────────┘
         │                           │
         │     Both share cache      │
         └───────────────────────────┘
```

### Pattern 2: Create + List
```
┌─────────────────────┐     ┌────────────────────┐
│  Create Post Form   │     │   Posts List       │
│                     │     │                    │
│ useCreatePost       │     │ useGetPostsQuery() │
│ Mutation()          │────►│                    │
│                     │     │ [Auto-refreshes]   │
│ [On success,        │     │                    │
│  invalidates cache] │     │                    │
└─────────────────────┘     └────────────────────┘
```

### Pattern 3: Optimistic Update
```
User clicks "Like" button
         │
         ▼
Update UI immediately (optimistic)
         │
         ▼
Send API request
         │
    ┌────┴────┐
    │         │
Success     Error
    │         │
    │         └──► Revert UI change
    │
    └──► Keep UI change
```

## 📦 File Organization

```
src/
├── store/
│   ├── store.js                 ◄── Redux store config
│   └── slices/
│       └── apiSlice.js          ◄── All API endpoints (RTK Query)
│
├── hooks/
│   ├── useRTKQuery.js           ◄── Custom helper hooks
│   ├── useAuth.js               ◄── Auth hooks (can migrate)
│   └── useLoadingState.js       ◄── Loading hooks (can remove)
│
├── services/
│   └── api.js                   ◄── Old API (keep for now)
│
└── components/
    ├── PostsList.jsx            ◄── Use: useGetPostsQuery()
    ├── PostDetail.jsx           ◄── Use: useGetPostBySlugQuery()
    ├── PostForm.jsx             ◄── Use: useCreatePostMutation()
    └── CategoryFilter.jsx       ◄── Use: useGetCategoriesQuery()
```

## 🎯 Migration Checklist

```
Step 1: Setup (✅ DONE)
├─ Install dependencies
├─ Create store.js
├─ Create apiSlice.js
└─ Add Redux Provider

Step 2: Migrate Components (🔜 YOUR TURN)
├─ Find components using old API
├─ Replace with RTK Query hooks
├─ Remove manual state management
└─ Test thoroughly

Step 3: Cleanup
├─ Remove unused old API calls
├─ Remove manual loading states
├─ Update documentation
└─ Celebrate! 🎉
```

## 💡 Pro Tips

### Tip 1: Prefetch on Hover
```javascript
<Link 
  to={`/post/${post.slug}`}
  onMouseEnter={() => prefetch(post.slug)}
>
  {post.title}
</Link>

// Data loads before user clicks! ⚡
```

### Tip 2: Polling for Real-time Data
```javascript
useGetTrendingQuery(
  { limit: 10 },
  { pollingInterval: 60000 } // Auto-refresh every 60s
);
```

### Tip 3: Conditional Queries
```javascript
useGetPostByIdQuery(
  { id: postId },
  { skip: !postId } // Don't fetch if no ID
);
```

### Tip 4: Manual Cache Clear
```javascript
import { useClearCache } from '../hooks/useRTKQuery';

const clearCache = useClearCache();
<button onClick={clearCache}>Clear All Cache</button>
```

## 🐛 Debugging

### Redux DevTools View
```
┌─────────────────────────────────────────┐
│  Redux DevTools                         │
├─────────────────────────────────────────┤
│                                         │
│  State                                  │
│  ├─ api                                 │
│  │  ├─ queries                          │
│  │  │  ├─ getPosts({"page":1})         │
│  │  │  │  ├─ status: "fulfilled"       │
│  │  │  │  ├─ data: [...]               │
│  │  │  │  └─ requestId: "abc123"       │
│  │  │  └─ getPostBySlug({"slug":"..."})│
│  │  ├─ mutations                        │
│  │  └─ subscriptions                    │
│  └─ ...                                 │
│                                         │
│  Actions                                │
│  ├─ api/executeQuery/pending           │
│  ├─ api/executeQuery/fulfilled         │
│  └─ api/executeMutation/fulfilled       │
│                                         │
└─────────────────────────────────────────┘
```

## 🎉 Success Metrics

Track these to measure success:
- ✅ API calls reduced by 70-90%
- ✅ Page load times improved
- ✅ User experience smoother
- ✅ Server load decreased
- ✅ Code is cleaner and simpler

---

**You're all set! Start migrating your components and enjoy the benefits! 🚀**

# RTK Query Migration Guide

## Overview
This project now uses **Redux Toolkit (RTK) Query** for API caching and state management. This significantly reduces server calls and improves performance through intelligent caching.

## What Changed?

### Before (Old API)
```javascript
import { postsAPI } from '../services/api';

// In component
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postsAPI.getAll({ page: 1, limit: 20 });
      setPosts(data.posts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchPosts();
}, []);
```

### After (RTK Query)
```javascript
import { useGetPostsQuery } from '../store/slices/apiSlice';

// In component - automatic caching, loading states, and refetching
const { data, isLoading, error, refetch } = useGetPostsQuery({ 
  page: 1, 
  limit: 20 
});

const posts = data?.posts || [];
```

## Benefits

1. **Automatic Caching**: Results are cached automatically - no repeated API calls
2. **Smart Invalidation**: Cache updates when data changes
3. **Loading States**: Built-in loading, error, and success states
4. **Refetch Control**: Automatic refetching on focus/reconnect (configurable)
5. **Less Code**: No manual state management needed
6. **Performance**: Reduced server load and faster page loads

## Available Hooks

### Query Hooks (GET requests)
- `useGetPostsQuery({ page, limit, status, category, tags, sortBy, sortOrder })`
- `useGetPostsByCategoryQuery({ categoryId, page, limit, ... })`
- `useGetPostByIdQuery({ id, incrementViews })`
- `useGetPostBySlugQuery({ slug, incrementViews })`
- `useGetCategoriesQuery()`
- `useGetProfileQuery()`
- `useSearchAnimeQuery({ query, limit, offset, fields })`
- `useGetAnimeDetailsQuery({ animeId, fields })`
- `useGetAnimeRankingQuery({ rankingType, limit, offset, fields })`
- `useGetTrendingQuery({ limit, timeframe })`
- `useGetSimilarPostsQuery({ postId, limit, minScore, includeBreakdown })`

### Mutation Hooks (POST/PUT/DELETE requests)
- `useCreatePostMutation()`
- `useUpdatePostMutation()`
- `useDeletePostMutation()`
- `useLikePostMutation()`
- `useLoginMutation()`
- `useSignupMutation()`
- `useSavePostMutation()`
- `useUnsavePostMutation()`

## Migration Examples

### Example 1: Fetching Posts
```javascript
// OLD WAY
import { postsAPI } from '../services/api';

function PostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await postsAPI.getAll({ page: 1, limit: 20 });
        setPosts(data.posts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* render posts */}</div>;
}

// NEW WAY (RTK Query)
import { useGetPostsQuery } from '../store/slices/apiSlice';

function PostsList() {
  const { data, isLoading, error } = useGetPostsQuery({ 
    page: 1, 
    limit: 20 
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;
  
  const posts = data?.posts || [];
  
  return <div>{/* render posts */}</div>;
}
```

### Example 2: Creating/Updating Posts
```javascript
// OLD WAY
import { postsAPI } from '../services/api';

function CreatePost() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (postData) => {
    try {
      setSubmitting(true);
      await postsAPI.create(postData);
      // Manually refetch posts list
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}

// NEW WAY (RTK Query)
import { useCreatePostMutation } from '../store/slices/apiSlice';

function CreatePost() {
  const [createPost, { isLoading }] = useCreatePostMutation();

  const handleSubmit = async (postData) => {
    try {
      await createPost(postData).unwrap();
      // Cache automatically invalidated - posts list will refetch!
    } catch (err) {
      console.error(err);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### Example 3: Conditional Fetching
```javascript
// Skip query if not ready
const { data } = useGetPostByIdQuery(
  { id: postId },
  { skip: !postId } // Won't fetch if postId is null/undefined
);

// Refetch on interval
const { data } = useGetTrendingQuery(
  { limit: 10 },
  { pollingInterval: 60000 } // Refetch every 60 seconds
);

// Manual refetch
const { data, refetch } = useGetPostsQuery({ page: 1 });
<button onClick={refetch}>Refresh</button>
```

### Example 4: Optimistic Updates
```javascript
import { useLikePostMutation } from '../store/slices/apiSlice';

function LikeButton({ postId }) {
  const [likePost, { isLoading }] = useLikePostMutation();

  const handleLike = async () => {
    try {
      await likePost(postId).unwrap();
      // Post cache automatically invalidated and refetched
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  return (
    <button onClick={handleLike} disabled={isLoading}>
      {isLoading ? 'Liking...' : 'Like'}
    </button>
  );
}
```

### Example 5: Accessing Cached Data
```javascript
import { apiSlice } from '../store/slices/apiSlice';
import { useSelector } from 'react-redux';

function CachedDataExample() {
  // Access cached data without triggering a request
  const cachedPosts = useSelector(
    (state) => apiSlice.endpoints.getPosts.select({ page: 1, limit: 20 })(state)
  );

  return <div>{cachedPosts.data?.posts.length || 0} posts cached</div>;
}
```

## Cache Configuration

### Default Cache Times
- **Posts**: 5 minutes (300s)
- **Categories**: 10 minutes (600s)
- **Anime Details**: 1 hour (3600s)
- **Anime Rankings**: 30 minutes (1800s)
- **Recommendations**: 10 minutes (600s)
- **Trending**: 5 minutes (300s)

### Custom Cache Time
```javascript
const { data } = useGetPostsQuery(
  { page: 1 },
  { 
    keepUnusedDataFor: 600 // Override default - cache for 10 minutes
  }
);
```

## Advanced Features

### 1. Prefetching
```javascript
import { useGetPostsQuery, apiSlice } from '../store/slices/apiSlice';
import { useDispatch } from 'react-redux';

function PostsPage() {
  const dispatch = useDispatch();
  
  // Prefetch next page on hover
  const handleMouseEnter = () => {
    dispatch(
      apiSlice.util.prefetch('getPosts', { page: 2, limit: 20 }, { force: false })
    );
  };

  return <button onMouseEnter={handleMouseEnter}>Next Page</button>;
}
```

### 2. Manual Cache Invalidation
```javascript
import { apiSlice } from '../store/slices/apiSlice';
import { useDispatch } from 'react-redux';

function AdminPanel() {
  const dispatch = useDispatch();

  const handleClearCache = () => {
    // Invalidate all posts
    dispatch(apiSlice.util.invalidateTags([{ type: 'Post', id: 'LIST' }]));
    
    // Or reset entire API state
    dispatch(apiSlice.util.resetApiState());
  };

  return <button onClick={handleClearCache}>Clear Cache</button>;
}
```

### 3. Combining Multiple Queries
```javascript
function Dashboard() {
  const { data: posts } = useGetPostsQuery({ page: 1, limit: 5 });
  const { data: categories } = useGetCategoriesQuery();
  const { data: trending } = useGetTrendingQuery({ limit: 10 });

  // All queries run in parallel and cached independently
  // If any data is already cached, it returns immediately!

  return (
    <div>
      <PostsList posts={posts?.posts} />
      <Categories categories={categories} />
      <Trending posts={trending} />
    </div>
  );
}
```

## Keeping Old API (Optional)

The old `api.js` file is still available if you need it for special cases:
```javascript
import { postsAPI } from '../services/api';

// Still works, but won't benefit from caching
const data = await postsAPI.getAll();
```

## Best Practices

1. **Use Queries for GET**: Always use query hooks for fetching data
2. **Use Mutations for Changes**: Use mutation hooks for POST/PUT/DELETE
3. **Let RTK Handle State**: Don't store API data in component state
4. **Tag for Invalidation**: Mutations automatically invalidate related queries
5. **Skip When Needed**: Use `skip` option to prevent unnecessary requests
6. **Handle Errors**: Always check for `error` in query results

## Performance Tips

1. **Selective Rendering**: Use `selectFromResult` to subscribe to specific data
```javascript
const { post } = useGetPostsQuery({ page: 1 }, {
  selectFromResult: ({ data }) => ({
    post: data?.posts.find(p => p.id === specificId)
  })
});
```

2. **Normalized Data**: RTK Query automatically normalizes data by tags
3. **Background Refetching**: Enabled by default (refetchOnFocus, refetchOnReconnect)
4. **Request Deduplication**: Multiple components requesting same data = 1 API call

## Troubleshooting

### Cache Not Updating?
- Check that mutation hooks have correct `invalidatesTags`
- Use Redux DevTools to inspect cache state

### Too Many Requests?
- Increase `keepUnusedDataFor` duration
- Use `skip` option when data isn't needed
- Disable `refetchOnFocus` if not needed

### Need Fresh Data?
- Use `refetch()` method from query hook
- Set `pollingInterval` for automatic updates
- Use `{ force: true }` in prefetch

## Redux DevTools

Install Redux DevTools extension to:
- Inspect cached data
- See cache invalidations
- Monitor API requests
- Time-travel debug

## Questions?

Check the [RTK Query documentation](https://redux-toolkit.js.org/rtk-query/overview) for more details.

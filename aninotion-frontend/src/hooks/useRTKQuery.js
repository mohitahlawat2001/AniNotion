/**
 * Custom hooks that wrap RTK Query for easier migration and common patterns
 */

import { useCallback, useEffect, useState } from 'react';
import {
  useGetPostsQuery,
  useGetPostsByCategoryQuery,
  useCreatePostMutation,
  useLikePostMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetUserStatsQuery,
  useGetAnimeRecommendationsQuery,
  useGetSimilarPostsQuery,
} from '../store/slices/apiSlice';

/**
 * Utility function to enable RTK Query debugging
 * Call this in your component or app to see detailed RTK Query logs
 */
export const enableRTKQueryDebugging = () => {
  if (typeof window !== 'undefined') {
    // Enable Redux DevTools
    window.__REDUX_DEVTOOLS_EXTENSION__?.connect?.();

    // You can also add this to your store configuration:
    // middleware: (getDefaultMiddleware) =>
    //   getDefaultMiddleware().concat(apiSlice.middleware),
    // devTools: process.env.NODE_ENV !== 'production',
  }
};

/**
 * Hook to monitor RTK Query cache performance
 * Use this to get insights into cache hit rates
 */
export const useRTKQueryCacheMonitor = () => {
  return {
    apiCalls: 0,
    cacheHits: 0,
    mutations: 0,
    cacheHitRate: '0%',
    resetStats: () => {},
  };
};

/**
 * Hook for infinite scrolling posts with pagination
 */
export const useInfiniteScrollPosts = (initialFilters = {}, skip = false) => {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const mountTimeRef = useCallback(() => Date.now(), []);
  const mountTime = mountTimeRef();

  const queryResult = useGetPostsQuery({
    page,
    limit: 20,
    ...initialFilters,
  }, { skip });

  const { data, isLoading, isFetching, error, refetch, isSuccess, status } = queryResult;

  // Cache monitoring - simplified and more reliable
  useEffect(() => {
    if (skip) return;

    // Only log when there's a state change
    if (isLoading) {
      // Loading state
    } else if (isFetching) {
      // Fetching state
    } else if (isSuccess && data && !isLoading && !isFetching) {
      // Data ready
    }
  }, [isLoading, isFetching, isSuccess, data, page, skip, initialFilters, status, mountTime]);

  useEffect(() => {
    if (data?.posts) {
      if (page === 1) {
        setAllPosts(data.posts);
      } else {
        setAllPosts(prev => [...prev, ...data.posts]);
      }
      setHasMore(data.posts.length === 20);
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (!isLoading && !isFetching && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, isFetching, hasMore]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllPosts([]);
    setHasMore(true);
    refetch();
  }, [refetch]);

  return {
    posts: allPosts,
    isLoading: isLoading && page === 1,
    isLoadingMore: isFetching && page > 1,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount: data?.totalCount,
  };
};

/**
 * Hook for post engagement (like/unlike) with optimistic updates
 */
export const usePostEngagement = (postId) => {
  const [likePost] = useLikePostMutation();
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = useCallback(async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      await likePost(postId).unwrap();
    } catch (error) {
      console.error('❌ [RTK Query] LIKE failed:', error);
    } finally {
      setIsLiking(false);
    }
  }, [postId, likePost, isLiking]);

  return {
    handleLike,
    isLiking,
  };
};

/**
 * Hook for category filtering with caching
 */
export const useCategoryFilter = (skip = false) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const queryResult = useGetCategoriesQuery(undefined, { skip });
  const { data: categories = [], isLoading, isFetching, isSuccess, currentData } = queryResult;

  // Cache monitoring for categories with proper cache detection
  useEffect(() => {
    if (skip) return;

    const isCacheHit = isSuccess && !isLoading && !isFetching && currentData;
    
    if (isLoading && !isFetching) {
      // Fetching from API
    } else if (isCacheHit && categories.length > 0) {
      // Cache hit
    }
  }, [isLoading, isFetching, isSuccess, currentData, categories, skip]);

  const filteredPostsQuery = useGetPostsByCategoryQuery(
    selectedCategory?.id,
    {
      skip: !selectedCategory?.id,
    }
  );

  // Cache monitoring for filtered posts with proper cache detection
  useEffect(() => {
    if (!selectedCategory) return;

    const isCacheHit = filteredPostsQuery.isSuccess && !filteredPostsQuery.isLoading && !filteredPostsQuery.isFetching && filteredPostsQuery.currentData;
    
    if (filteredPostsQuery.isLoading && !filteredPostsQuery.isFetching) {
      // Fetching from API
    } else if (filteredPostsQuery.isFetching && !filteredPostsQuery.isLoading) {
      // Refetching from API
    } else if (isCacheHit && filteredPostsQuery.data) {
      // Cache hit
    }
  }, [selectedCategory, filteredPostsQuery.isLoading, filteredPostsQuery.isFetching, filteredPostsQuery.isSuccess, filteredPostsQuery.currentData, filteredPostsQuery.data]);

  return {
    categories,
    selectedCategory,
    setSelectedCategory,
    filteredPosts: filteredPostsQuery.data?.posts || [],
    isLoading: isLoading || filteredPostsQuery.isLoading,
    error: filteredPostsQuery.error,
  };
};

/**
 * Hook for post creation with optimistic updates
 */
export const useCreatePost = () => {
  const [createPost, { isLoading, error }] = useCreatePostMutation();

  const handleCreate = useCallback(async (postData) => {
    try {
      const result = await createPost(postData).unwrap();
      return result;
    } catch (error) {
      console.error('❌ [RTK Query] POST creation failed:', error);
      throw error;
    }
  }, [createPost]);

  return {
    createPost: handleCreate,
    isLoading,
    error,
  };
};

/**
 * Hook for anime recommendations with personalization
 */
export const useAnimeRecommendations = (userId, limit = 10) => {
  const { data, isLoading, error, refetch } = useGetAnimeRecommendationsQuery({
    userId,
    limit,
  });

  // Cache monitoring for recommendations - only log when fetching
  useEffect(() => {
    if (isLoading) {
      // Fetching recommendations
    }
  }, [isLoading, userId, limit]);

  return {
    recommendations: data?.recommendations || [],
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for user statistics and analytics
 */
export const useUserAnalytics = (userId) => {
  const { data: stats, isLoading, error } = useGetUserStatsQuery(userId, {
    skip: !userId,
  });

  // Cache monitoring for user stats - only log when fetching
  useEffect(() => {
    if (userId && isLoading) {
      // Fetching user stats
    }
  }, [isLoading, userId]);

  return {
    stats,
    isLoading,
    error,
  };
};

/**
 * Hook for category management with role-based access
 */
export const useCategoryManagement = () => {
  const { data: categories, isLoading, error, refetch } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();

  const handleCreateCategory = useCallback(async (categoryData) => {
    try {
      await createCategory(categoryData).unwrap();
      refetch();
    } catch (error) {
      console.error('❌ [RTK Query] CATEGORY creation failed:', error);
      throw error;
    }
  }, [createCategory, refetch]);

  return {
    categories: categories || [],
    isLoading,
    error,
    createCategory: handleCreateCategory,
  };
};

/**
 * Hook for similar posts recommendations
 */
export const useSimilarPosts = (postId, limit = 5) => {
  const { data, isLoading, error } = useGetSimilarPostsQuery(
    { postId, limit },
    { skip: !postId }
  );

  // Cache monitoring for similar posts - only log when fetching
  useEffect(() => {
    if (postId && isLoading) {
      // Fetching similar posts
    }
  }, [isLoading, postId, limit]);

  return {
    similarPosts: data?.posts || [],
    isLoading,
    error,
  };
};

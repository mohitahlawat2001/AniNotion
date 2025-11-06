/**

 * Custom hooks that wrap RTK Query for easier migration and common patterns

 */

import { useCallback, useEffect, useState } from 'react';
import {
  useGetPostsQuery,
  useCreatePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAnimeRecommendationsQuery,
  useGetTrendingAnimeQuery,
  useGetAnimeByCategoryQuery,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useGetUserPostsQuery,
  useGetUserLikedPostsQuery,
  useGetUserDraftPostsQuery,
  useGetSimilarPostsQuery,
  useGetTrendingPostsQuery,
  useGetPostsByCategoryQuery,
  useGetPostsByTagQuery,
  useSearchPostsQuery,
  useGetPostCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetPostLikesQuery,
  useGetUserStatsQuery,
  useGetAnimeStatsQuery,
  useGetCategoryStatsQuery,
  useGetPostStatsQuery,
  useGetAnimeSeasonsQuery,
  useGetAnimeEpisodesQuery,
  useCreateAnimeSeasonMutation,
  useUpdateAnimeSeasonMutation,
  useDeleteAnimeSeasonMutation,
  useCreateAnimeEpisodeMutation,
  useUpdateAnimeEpisodeMutation,
  useDeleteAnimeEpisodeMutation,
  useGetAnimeEpisodeCommentsQuery,
  useCreateAnimeEpisodeCommentMutation,
  useGetAnimeEpisodeLikesQuery,
  useLikeAnimeEpisodeMutation,
  useUnlikeAnimeEpisodeMutation,
  useGetSystemStatsQuery as useGetSystemStatsQueryRTK,
} from '../store/slices/apiSlice';

/**
 * Hook for infinite scrolling posts with pagination
 */
export const useInfiniteScrollPosts = (initialFilters = {}) => {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, isFetching, error, refetch } = useGetPostsQuery({
    page,
    limit: 20,
    ...initialFilters,
  });

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
  const [unlikePost] = useUnlikePostMutation();
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = useCallback(async (isLiked) => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await unlikePost(postId).unwrap();
      } else {
        await likePost(postId).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  }, [postId, likePost, unlikePost, isLiking]);

  return {
    handleLike,
    isLiking,
  };
};

/**
 * Hook for category filtering with caching
 */
export const useCategoryFilter = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { data: categories = [], isLoading } = useGetCategoriesQuery();

  const filteredPostsQuery = useGetPostsByCategoryQuery(
    selectedCategory?.id,
    {
      skip: !selectedCategory?.id,
    }
  );

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
 * Hook for search functionality with debouncing
 */
export const useSearchPosts = (debounceMs = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  const { data, isLoading, error } = useSearchPostsQuery(
    debouncedTerm,
    {
      skip: !debouncedTerm.trim(),
    }
  );

  return {
    searchTerm,
    setSearchTerm,
    results: data?.posts || [],
    isLoading,
    error,
    hasResults: data?.posts?.length > 0,
  };
};

/**
 * Hook for user authentication state
 */
export const useAuth = () => {
  const { data: user, isLoading, error } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();

  const handleLogout = useCallback(async () => {
    try {
      await logout().unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout: handleLogout,
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
      console.error('Failed to create post:', error);
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

  return {
    recommendations: data?.recommendations || [],
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for trending content across different types
 */
export const useTrendingContent = (type = 'posts', timeRange = 'week') => {
  const postsQuery = useGetTrendingPostsQuery(
    { timeRange },
    { skip: type !== 'posts' }
  );

  const animeQuery = useGetTrendingAnimeQuery(
    { timeRange },
    { skip: type !== 'anime' }
  );

  const isLoading = postsQuery.isLoading || animeQuery.isLoading;
  const error = postsQuery.error || animeQuery.error;

  return {
    trending: type === 'posts' ? postsQuery.data?.posts : animeQuery.data?.anime,
    isLoading,
    error,
    refetch: type === 'posts' ? postsQuery.refetch : animeQuery.refetch,
  };
};

/**
 * Hook for comment management on posts
 */
export const usePostComments = (postId) => {
  const { data, isLoading, error } = useGetPostCommentsQuery(postId, {
    skip: !postId,
  });

  const [createComment] = useCreateCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const handleCreateComment = useCallback(async (content) => {
    try {
      await createComment({ postId, content }).unwrap();
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }, [postId, createComment]);

  const handleUpdateComment = useCallback(async (commentId, content) => {
    try {
      await updateComment({ commentId, content }).unwrap();
    } catch (error) {
      console.error('Failed to update comment:', error);
      throw error;
    }
  }, [updateComment]);

  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      await deleteComment(commentId).unwrap();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  }, [deleteComment]);

  return {
    comments: data?.comments || [],
    isLoading,
    error,
    createComment: handleCreateComment,
    updateComment: handleUpdateComment,
    deleteComment: handleDeleteComment,
  };
};

/**
 * Hook for user statistics and analytics
 */
export const useUserAnalytics = (userId) => {
  const { data: stats, isLoading, error } = useGetUserStatsQuery(userId, {
    skip: !userId,
  });

  const { data: posts } = useGetUserPostsQuery(userId, {
    skip: !userId,
  });

  const { data: likedPosts } = useGetUserLikedPostsQuery(userId, {
    skip: !userId,
  });

  return {
    stats,
    posts: posts?.posts || [],
    likedPosts: likedPosts?.posts || [],
    isLoading,
    error,
  };
};

/**
 * Hook for anime season and episode management
 */
export const useAnimeSeasons = (animeId) => {
  const { data: seasons, isLoading, error } = useGetAnimeSeasonsQuery(animeId, {
    skip: !animeId,
  });

  const [createSeason] = useCreateAnimeSeasonMutation();
  const [updateSeason] = useUpdateAnimeSeasonMutation();
  const [deleteSeason] = useDeleteAnimeSeasonMutation();

  const handleCreateSeason = useCallback(async (seasonData) => {
    try {
      await createSeason({ animeId, ...seasonData }).unwrap();
    } catch (error) {
      console.error('Failed to create season:', error);
      throw error;
    }
  }, [animeId, createSeason]);

  return {
    seasons: seasons?.seasons || [],
    isLoading,
    error,
    createSeason: handleCreateSeason,
    updateSeason,
    deleteSeason,
  };
};

/**
 * Hook for anime episode management
 */
export const useAnimeEpisodes = (seasonId) => {
  const { data: episodes, isLoading, error } = useGetAnimeEpisodesQuery(seasonId, {
    skip: !seasonId,
  });

  const [createEpisode] = useCreateAnimeEpisodeMutation();
  const [updateEpisode] = useUpdateAnimeEpisodeMutation();
  const [deleteEpisode] = useDeleteAnimeEpisodeMutation();

  const handleCreateEpisode = useCallback(async (episodeData) => {
    try {
      await createEpisode({ seasonId, ...episodeData }).unwrap();
    } catch (error) {
      console.error('Failed to create episode:', error);
      throw error;
    }
  }, [seasonId, createEpisode]);

  return {
    episodes: episodes?.episodes || [],
    isLoading,
    error,
    createEpisode: handleCreateEpisode,
    updateEpisode,
    deleteEpisode,
  };
};

/**
 * Hook for episode comments and engagement
 */
export const useEpisodeComments = (episodeId) => {
  const { data, isLoading, error } = useGetAnimeEpisodeCommentsQuery(episodeId, {
    skip: !episodeId,
  });

  const [createComment] = useCreateAnimeEpisodeCommentMutation();
  const [likeEpisode] = useLikeAnimeEpisodeMutation();
  const [unlikeEpisode] = useUnlikeAnimeEpisodeMutation();

  const handleCreateComment = useCallback(async (content) => {
    try {
      await createComment({ episodeId, content }).unwrap();
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }, [episodeId, createComment]);

  const handleLike = useCallback(async (isLiked) => {
    try {
      if (isLiked) {
        await unlikeEpisode(episodeId).unwrap();
      } else {
        await likeEpisode(episodeId).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle episode like:', error);
      throw error;
    }
  }, [episodeId, likeEpisode, unlikeEpisode]);

  return {
    comments: data?.comments || [],
    isLoading,
    error,
    createComment: handleCreateComment,
    handleLike,
  };
};

/**
 * Hook for comprehensive system statistics
 */
export const useSystemStats = () => {
  const { data, isLoading, error } = useGetSystemStatsQueryRTK();

  return {
    stats: data,
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
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const handleCreateCategory = useCallback(async (categoryData) => {
    try {
      await createCategory(categoryData).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }, [createCategory, refetch]);

  const handleUpdateCategory = useCallback(async (categoryId, categoryData) => {
    try {
      await updateCategory({ id: categoryId, ...categoryData }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }, [updateCategory, refetch]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    try {
      await deleteCategory(categoryId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }, [deleteCategory, refetch]);

  return {
    categories: categories || [],
    isLoading,
    error,
    createCategory: handleCreateCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
  };
};

/**
 * Hook for draft posts management
 */
export const useDraftPosts = (userId) => {
  const { data, isLoading, error } = useGetUserDraftPostsQuery(userId, {
    skip: !userId,
  });

  return {
    drafts: data?.posts || [],
    isLoading,
    error,
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

  return {
    similarPosts: data?.posts || [],
    isLoading,
    error,
  };
};

/**
 * Hook for posts by tag filtering
 */
export const usePostsByTag = (tag) => {
  const { data, isLoading, error } = useGetPostsByTagQuery(tag, {
    skip: !tag,
  });

  return {
    posts: data?.posts || [],
    isLoading,
    error,
  };
};

/**
 * Hook for anime by category filtering
 */
export const useAnimeByCategory = (categoryId) => {
  const { data, isLoading, error } = useGetAnimeByCategoryQuery(categoryId, {
    skip: !categoryId,
  });

  return {
    anime: data?.anime || [],
    isLoading,
    error,
  };
};

/**
 * Hook for post likes management
 */
export const usePostLikes = (postId) => {
  const { data, isLoading, error } = useGetPostLikesQuery(postId, {
    skip: !postId,
  });

  return {
    likes: data?.likes || [],
    likeCount: data?.count || 0,
    isLoading,
    error,
  };
};

/**
 * Hook for anime episode likes
 */
export const useEpisodeLikes = (episodeId) => {
  const { data, isLoading, error } = useGetAnimeEpisodeLikesQuery(episodeId, {
    skip: !episodeId,
  });

  return {
    likes: data?.likes || [],
    likeCount: data?.count || 0,
    isLoading,
    error,
  };
};

/**
 * Hook for comprehensive analytics across all entities
 */
export const useAnalytics = () => {
  const userStats = useGetUserStatsQuery();
  const animeStats = useGetAnimeStatsQuery();
  const categoryStats = useGetCategoryStatsQuery();
  const postStats = useGetPostStatsQuery();
  const systemStats = useGetSystemStatsQueryRTK();

  const isLoading = userStats.isLoading || animeStats.isLoading ||
                   categoryStats.isLoading || postStats.isLoading || systemStats.isLoading;

  const error = userStats.error || animeStats.error ||
               categoryStats.error || postStats.error || systemStats.error;

  return {
    userStats: userStats.data,
    animeStats: animeStats.data,
    categoryStats: categoryStats.data,
    postStats: postStats.data,
    systemStats: systemStats.data,
    isLoading,
    error,
  };
};

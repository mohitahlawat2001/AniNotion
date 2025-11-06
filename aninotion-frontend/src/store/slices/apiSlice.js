import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Base query with auth token
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Base query with automatic token refresh on 401
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Handle 401 responses (unauthorized)
  if (result.error && result.error.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.reload();
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Cache time in seconds (default is 60s, we'll set longer for static content)
  keepUnusedDataFor: 300, // 5 minutes
  // Prevent automatic refetching on component mount/arg change
  refetchOnMountOrArgChange: false,
  // Refetch on window focus (can be disabled if too aggressive)
  refetchOnFocus: false,
  // Refetch on network reconnect
  refetchOnReconnect: true,
  // Tag types for cache invalidation
  tagTypes: ['Post', 'Category', 'User', 'Anime', 'Recommendations', 'Auth'],
  endpoints: (builder) => ({
    // ============= POSTS API =============
    getPosts: builder.query({
      query: ({ page = 1, limit = 20, status, category, tags, sortBy = 'publishedAt', sortOrder = 'desc' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (tags) params.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
        
        const url = `/posts?${params}`;
        return url;
      },
      providesTags: (result) =>
        result?.posts
          ? [
              ...result.posts.map(({ _id }) => ({ type: 'Post', id: _id })),
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
      transformResponse: (response) => {
        // Handle both old and new format
        if (response && typeof response === 'object' && Array.isArray(response.posts)) {
          return response;
        }
        return { posts: response || [], pagination: null };
      },
    }),

    getPostsByCategory: builder.query({
      query: ({ categoryId, page = 1, limit = 20, status, tags, sortBy = 'publishedAt', sortOrder = 'desc' }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (status) params.append('status', status);
        if (tags) params.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
        
        return `/posts/category/${categoryId}?${params}`;
      },
      providesTags: (result, error, { categoryId }) => [
        { type: 'Post', id: `CATEGORY-${categoryId}` },
      ],
      transformResponse: (response) => {
        if (response && typeof response === 'object' && Array.isArray(response.posts)) {
          return response;
        }
        return { posts: response || [], pagination: null };
      },
    }),

    getPostById: builder.query({
      query: ({ id, incrementViews = true }) => {
        const params = new URLSearchParams();
        if (!incrementViews) params.append('incrementViews', 'false');
        return `/posts/${id}${params.toString() ? `?${params}` : ''}`;
      },
      providesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),

    getPostBySlug: builder.query({
      query: ({ slug, incrementViews = true }) => {
        const params = new URLSearchParams();
        if (!incrementViews) params.append('incrementViews', 'false');
        return `/posts/${slug}${params.toString() ? `?${params}` : ''}`;
      },
      providesTags: (result) => 
        result ? [{ type: 'Post', id: result._id }] : [],
    }),

    createPost: builder.mutation({
      query: (postData) => ({
        url: '/posts',
        method: 'POST',
        body: postData,
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    updatePost: builder.mutation({
      query: ({ id, ...postData }) => ({
        url: `/posts/${id}`,
        method: 'PUT',
        body: postData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),

    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    publishPost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/publish`,
        method: 'PUT',
        body: { action: 'publish' },
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),

    unpublishPost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/publish`,
        method: 'PUT',
        body: { action: 'unpublish' },
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),

    likePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/like`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    checkLikedStatus: builder.query({
      query: (id) => `/posts/${id}/liked`,
      providesTags: (result, error, id) => [{ type: 'Post', id: `LIKED-${id}` }],
    }),

    incrementPostView: builder.mutation({
      query: ({ id, sessionId }) => ({
        url: `/posts/${id}/view`,
        method: 'POST',
        body: { sessionId },
      }),
      // Don't invalidate on view increment to avoid refetching
    }),

    getPostEngagement: builder.query({
      query: ({ id, sessionId }) => {
        const params = new URLSearchParams();
        if (sessionId) params.append('sessionId', sessionId);
        return `/posts/${id}/engagement${params.toString() ? `?${params}` : ''}`;
      },
      providesTags: (result, error, { id }) => [{ type: 'Post', id: `ENGAGEMENT-${id}` }],
    }),

    getSavedPosts: builder.query({
      query: () => '/posts/users/me/saved',
      providesTags: [{ type: 'Post', id: 'SAVED' }],
      transformResponse: (response) => response.savedPosts || [],
    }),

    getLikedPosts: builder.query({
      query: () => '/posts/users/me/liked',
      providesTags: [{ type: 'Post', id: 'LIKED' }],
      transformResponse: (response) => response.likedPosts || [],
    }),

    getMyPosts: builder.query({
      query: () => '/posts/users/me/posts',
      providesTags: [{ type: 'Post', id: 'MYPOSTS' }],
      transformResponse: (response) => response.posts || [],
    }),

    savePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}/save`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Post', id: 'SAVED' }],
    }),

    unsavePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}/save`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Post', id: 'SAVED' }],
    }),

    // ============= CATEGORIES API =============
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: [{ type: 'Category', id: 'LIST' }],
      // Cache categories for 10 minutes (they don't change often)
      keepUnusedDataFor: 600,
    }),

    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    // ============= AUTH API =============
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: { email, password },
      }),
      transformResponse: (response) => {
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      },
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT' }],
    }),

    signup: builder.mutation({
      query: ({ email, name, password }) => ({
        url: '/auth/signup',
        method: 'POST',
        body: { email, name, password },
      }),
      transformResponse: (response) => {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      },
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT' }],
    }),

    getProfile: builder.query({
      query: () => '/auth/me',
      providesTags: [{ type: 'Auth', id: 'CURRENT' }],
    }),

    updateProfile: builder.mutation({
      query: (userData) => ({
        url: '/auth/me',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT' }],
    }),

    changePassword: builder.mutation({
      query: ({ currentPassword, newPassword }) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: { currentPassword, newPassword },
      }),
    }),

    getGoogleAuthUrl: builder.query({
      query: () => '/auth/google/url',
    }),

    getAllUsers: builder.query({
      query: () => '/users',
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    createUser: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUserStatus: builder.mutation({
      query: ({ userId, status }) => ({
        url: `/auth/users/${userId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    getUserStats: builder.query({
      query: () => '/users/stats',
      providesTags: [{ type: 'User', id: 'STATS' }],
    }),

    // ============= ANIME API =============
    checkAnimeHealth: builder.query({
      query: () => '/anime/health',
      providesTags: [{ type: 'Anime', id: 'HEALTH' }],
    }),

    searchAnime: builder.query({
      query: ({ query, limit = 20, offset = 0, fields }) => {
        const params = new URLSearchParams();
        params.append('q', query.trim());
        params.append('limit', Math.min(limit, 100).toString());
        params.append('offset', offset.toString());
        if (fields) {
          params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
        }
        return `/anime/search?${params}`;
      },
      providesTags: (result, error, { query }) => [
        { type: 'Anime', id: `SEARCH-${query}` },
      ],
      // Cache search results for 15 minutes
      keepUnusedDataFor: 900,
    }),

    getAnimeDetails: builder.query({
      query: ({ animeId, fields }) => {
        const params = new URLSearchParams();
        if (fields) {
          params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
        }
        return `/anime/details/${animeId}${params.toString() ? `?${params}` : ''}`;
      },
      providesTags: (result, error, { animeId }) => [
        { type: 'Anime', id: animeId },
      ],
      // Cache anime details for 1 hour (static data)
      keepUnusedDataFor: 3600,
    }),

    getAnimeRanking: builder.query({
      query: ({ rankingType = 'all', limit = 50, offset = 0, fields }) => {
        const params = new URLSearchParams();
        params.append('ranking_type', rankingType);
        params.append('limit', Math.min(limit, 500).toString());
        params.append('offset', offset.toString());
        if (fields) {
          params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
        }
        return `/anime/ranking?${params}`;
      },
      providesTags: (result, error, { rankingType }) => [
        { type: 'Anime', id: `RANKING-${rankingType}` },
      ],
      // Cache rankings for 30 minutes
      keepUnusedDataFor: 1800,
    }),

    getSeasonalAnime: builder.query({
      query: ({ year, season, sort, limit = 50, offset = 0, fields }) => {
        const params = new URLSearchParams();
        params.append('limit', Math.min(limit, 500).toString());
        params.append('offset', offset.toString());
        if (sort) params.append('sort', sort);
        if (fields) {
          params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
        }
        return `/anime/season/${year}/${season.toLowerCase()}${params.toString() ? `?${params}` : ''}`;
      },
      providesTags: (result, error, { year, season }) => [
        { type: 'Anime', id: `SEASON-${year}-${season}` },
      ],
      // Cache seasonal data for 1 hour
      keepUnusedDataFor: 3600,
    }),

    // ============= RECOMMENDATIONS API =============
    getSimilarPosts: builder.query({
      query: ({ postId, limit = 6, minScore = 0.1, includeBreakdown = false }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          minScore: minScore.toString(),
          includeBreakdown: includeBreakdown.toString(),
        });
        return `/recommendations/similar/${postId}?${params}`;
      },
      providesTags: (result, error, { postId }) => [
        { type: 'Recommendations', id: `SIMILAR-${postId}` },
      ],
      // Cache recommendations for 10 minutes
      keepUnusedDataFor: 600,
    }),

    getPersonalizedRecommendations: builder.mutation({
      query: ({ postIds, limit = 10, diversityFactor = 0.3 }) => ({
        url: '/recommendations/personalized',
        method: 'POST',
        body: { postIds, limit, diversityFactor },
      }),
    }),

    getAnimeRecommendations: builder.query({
      query: ({ animeName, limit = 10 }) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        return `/recommendations/anime/${encodeURIComponent(animeName)}?${params}`;
      },
      providesTags: (result, error, { animeName }) => [
        { type: 'Recommendations', id: `ANIME-${animeName}` },
      ],
      keepUnusedDataFor: 600,
    }),

    getTagRecommendations: builder.query({
      query: ({ tag, limit = 10 }) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        return `/recommendations/tag/${encodeURIComponent(tag)}?${params}`;
      },
      providesTags: (result, error, { tag }) => [
        { type: 'Recommendations', id: `TAG-${tag}` },
      ],
      keepUnusedDataFor: 600,
    }),

    getTrending: builder.query({
      query: ({ limit = 10, timeframe = 7 } = {}) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          timeframe: timeframe.toString(),
        });
        return `/recommendations/trending?${params}`;
      },
      providesTags: [{ type: 'Recommendations', id: 'TRENDING' }],
      // Refresh trending every 5 minutes
      keepUnusedDataFor: 300,
    }),

    getTrendingByCategory: builder.query({
      query: ({ categoryId, limit = 10, timeframe = 7 }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          timeframe: timeframe.toString(),
        });
        return `/recommendations/trending/category/${categoryId}?${params}`;
      },
      providesTags: (result, error, { categoryId }) => [
        { type: 'Recommendations', id: `TRENDING-CATEGORY-${categoryId}` },
      ],
      keepUnusedDataFor: 300,
    }),

    clearRecommendationsCache: builder.mutation({
      query: () => ({
        url: '/recommendations/cache',
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Recommendations' }],
    }),

    getRecommendationsCacheStats: builder.query({
      query: () => '/recommendations/cache/stats',
      providesTags: [{ type: 'Recommendations', id: 'CACHE-STATS' }],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Posts
  useGetPostsQuery,
  useGetPostsByCategoryQuery,
  useGetPostByIdQuery,
  useGetPostBySlugQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  usePublishPostMutation,
  useUnpublishPostMutation,
  useLikePostMutation,
  useCheckLikedStatusQuery,
  useIncrementPostViewMutation,
  useGetPostEngagementQuery,
  useGetSavedPostsQuery,
  useGetLikedPostsQuery,
  useGetMyPostsQuery,
  useSavePostMutation,
  useUnsavePostMutation,
  
  // Categories
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  
  // Auth
  useLoginMutation,
  useSignupMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetGoogleAuthUrlQuery,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useGetUserStatsQuery,
  
  // Anime
  useCheckAnimeHealthQuery,
  useSearchAnimeQuery,
  useGetAnimeDetailsQuery,
  useGetAnimeRankingQuery,
  useGetSeasonalAnimeQuery,
  
  // Recommendations
  useGetSimilarPostsQuery,
  useGetPersonalizedRecommendationsMutation,
  useGetAnimeRecommendationsQuery,
  useGetTagRecommendationsQuery,
  useGetTrendingQuery,
  useGetTrendingByCategoryQuery,
  useClearRecommendationsCacheMutation,
  useGetRecommendationsCacheStatsQuery,
} = apiSlice;

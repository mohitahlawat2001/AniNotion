/**/**

 * Custom hooks that wrap RTK Query for easier migration and common patterns * Custom hooks that wrap RTK Query for easier migration and common patterns

 */ */



import { useCallback, useEffect, useState } from 'react';import { useCallback, useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';import { useDispatch, useSelector } from 'react-redux';

import { import { 

  useGetPostsQuery,  useGetPostsQuery,

  useGetPostsByCategoryQuery,  useGetPostsByCategoryQuery,

  useGetTrendingQuery,  useGetTrendingQuery,

  useGetTrendingByCategoryQuery,  useGetTrendingByCategoryQuery,

  useGetSimilarPostsQuery,  useGetSimilarPostsQuery,

  useLikePostMutation,  useLikePostMutation,

  useSavePostMutation,  useSavePostMutation,

  useUnsavePostMutation,  useUnsavePostMutation,

  useGetSavedPostsQuery,  useGetSavedPostsQuery,

  useCheckLikedStatusQuery,  useCheckLikedStatusQuery,

  useSearchAnimeQuery,  useSearchAnimeQuery,

  apiSlice,  apiSlice,

} from '../store/slices/apiSlice';} from '../store/slices/apiSlice';



/**/**

 * Hook for infinite scroll pagination * Hook for infinite scroll pagination

 *  * 

 * Usage: * Usage:

 * const { posts, loadMore, hasMore, isLoading, isFetchingMore } = useInfiniteScrollPosts(); * const { posts, loadMore, hasMore, isLoading, isFetchingMore } = useInfiniteScrollPosts();

 */ */

export function useInfiniteScrollPosts(initialOptions = {}) {export function useInfiniteScrollPosts(initialOptions = {}) {

  const [page, setPage] = useState(1);  const [page, setPage] = useState(1);

  const [allPosts, setAllPosts] = useState([]);  const [allPosts, setAllPosts] = useState([]);

    

  const { data, isLoading, isFetching } = useGetPostsQuery({  const { data, isLoading, isFetching } = useGetPostsQuery({

    ...initialOptions,    ...initialOptions,

    page,    page,

  });  });



  useEffect(() => {  useEffect(() => {

    if (data?.posts) {    if (data?.posts) {

      setAllPosts(prev => {      setAllPosts(prev => {

        // Avoid duplicates        // Avoid duplicates

        const newPosts = data.posts.filter(        const newPosts = data.posts.filter(

          post => !prev.some(p => p._id === post._id)          post => !prev.some(p => p._id === post._id)

        );        );

        return [...prev, ...newPosts];        return [...prev, ...newPosts];

      });      });

    }    }

  }, [data]);  }, [data]);



  const loadMore = useCallback(() => {  const loadMore = useCallback(() => {

    if (data?.pagination?.hasNextPage && !isFetching) {    if (data?.pagination?.hasNextPage && !isFetching) {

      setPage(p => p + 1);      setPage(p => p + 1);

    }    }

  }, [data?.pagination?.hasNextPage, isFetching]);  }, [data?.pagination?.hasNextPage, isFetching]);



  const reset = useCallback(() => {  const reset = useCallback(() => {

    setPage(1);    setPage(1);

    setAllPosts([]);    setAllPosts([]);

  }, []);  }, []);



  return {  return {

    posts: allPosts,    posts: allPosts,

    loadMore,    loadMore,

    reset,    reset,

    hasMore: data?.pagination?.hasNextPage || false,    hasMore: data?.pagination?.hasNextPage || false,

    isLoading: isLoading && page === 1,    isLoading: isLoading && page === 1,

    isFetchingMore: isFetching && page > 1,    isFetchingMore: isFetching && page > 1,

    totalPages: data?.pagination?.totalPages || 0,    totalPages: data?.pagination?.totalPages || 0,

    currentPage: page,    currentPage: page,

  };  };

}}



/**/**

 * Hook for posts with category filter * Hook for posts with category filter and search

 *  * 

 * Usage: * Usage:

 * const { posts, setCategory, isLoading } = useFilteredPosts(); * const { posts, setCategory, setSearch, isLoading } = useFilteredPosts();

 */ */

export function useFilteredPosts(initialCategory = null) {export function useFilteredPosts(initialCategory = null) {

  const [category, setCategory] = useState(initialCategory);  const [category, setCategory] = useState(initialCategory);

  const [page, setPage] = useState(1);  const [page, setPage] = useState(1);



  // Call both hooks, skip one based on category  // Fetch posts by category or all posts (call both hooks, skip one)

  const allPostsQuery = useGetPostsQuery(  const allPostsQuery = useGetPostsQuery(

    { page, limit: 20 },    { page, limit: 20 },

    { skip: !!category }    { skip: !!category }

  );  );

  const categoryPostsQuery = useGetPostsByCategoryQuery(  const categoryPostsQuery = useGetPostsByCategoryQuery(

    { categoryId: category, page, limit: 20 },    { categoryId: category, page, limit: 20 },

    { skip: !category }    { skip: !category }

  );  );



  const { data, isLoading, isFetching } = category ? categoryPostsQuery : allPostsQuery;  const { data, isLoading, isFetching } = category ? categoryPostsQuery : allPostsQuery;



  // Reset page when category changes  // Reset page when category changes

  useEffect(() => {  useEffect(() => {

    setPage(1);    setPage(1);

  }, [category]);  }, [category]);



  return {  return {

    posts: data?.posts || [],    posts: data?.posts || [],

    pagination: data?.pagination,    pagination: data?.pagination,

    category,    category,

    setCategory,    setCategory,

    page,    page,

    setPage,    setPage,

    isLoading,    isLoading,

    isFetching,    isFetching,

  };  };

}}



/**/**

 * Hook for trending posts with auto-refresh * Hook for trending posts with auto-refresh

 *  * 

 * Usage: * Usage:

 * const { trending, refresh } = useTrendingPosts({ autoRefresh: true }); * const { trending, refresh } = useTrendingPosts({ autoRefresh: true });

 */ */

export function useTrendingPosts(options = {}) {export function useTrendingPosts(options = {}) {

  const {  const {

    limit = 10,    limit = 10,

    timeframe = 7,    timeframe = 7,

    categoryId = null,    categoryId = null,

    autoRefresh = false,    autoRefresh = false,

    refreshInterval = 300000, // 5 minutes    refreshInterval = 300000, // 5 minutes

  } = options;  } = options;



  // Call both hooks, skip one based on categoryId  // Call both hooks, skip one based on categoryId

  const allTrendingQuery = useGetTrendingQuery(  const allTrendingQuery = useGetTrendingQuery(

    { limit, timeframe },    { limit, timeframe },

    {    {

      skip: !!categoryId,      skip: !!categoryId,

      pollingInterval: autoRefresh && !categoryId ? refreshInterval : 0,      pollingInterval: autoRefresh && !categoryId ? refreshInterval : 0,

    }    }

  );  );



  const categoryTrendingQuery = useGetTrendingByCategoryQuery(  const categoryTrendingQuery = useGetTrendingByCategoryQuery(

    { categoryId, limit, timeframe },    { categoryId, limit, timeframe },

    {    {

      skip: !categoryId,      skip: !categoryId,

      pollingInterval: autoRefresh && categoryId ? refreshInterval : 0,      pollingInterval: autoRefresh && categoryId ? refreshInterval : 0,

    }    }

  );  );



  const { data, isLoading, error, refetch } = categoryId   const { data, isLoading, error, refetch } = categoryId 

    ? categoryTrendingQuery     ? categoryTrendingQuery 

    : allTrendingQuery;    : allTrendingQuery;



  return {  return {

    trending: data?.posts || data || [],    trending: data?.posts || data || [],

    isLoading,    isLoading,

    error,    error,

    refresh: refetch,    refresh: refetch,

  };  };

}}



/**/**

 * Hook for similar posts recommendations * Hook for similar posts recommendations

 *  * 

 * Usage: * Usage:

 * const { similarPosts, isLoading } = useSimilarPosts(postId); * const { similarPosts, isLoading } = useSimilarPosts(postId);

 */ */

export function useSimilarPosts(postId, options = {}) {export function useSimilarPosts(postId, options = {}) {

  const {  const {

    limit = 6,    limit = 6,

    minScore = 0.1,    minScore = 0.1,

    includeBreakdown = false,    includeBreakdown = false,

  } = options;  } = options;



  const { data, isLoading, error } = useGetSimilarPostsQuery(  const { data, isLoading, error } = useGetSimilarPostsQuery(

    { postId, limit, minScore, includeBreakdown },    { postId, limit, minScore, includeBreakdown },

    { skip: !postId }    { skip: !postId }

  );  );



  return {  return {

    similarPosts: data?.recommendations || [],    similarPosts: data?.recommendations || [],

    isLoading,    isLoading,

    error,    error,

  };  };

}}



/**/**

 * Hook for managing post engagement (likes, saves) * Hook for managing post engagement (likes, saves)

 *  * 

 * Usage: * Usage:

 * const { isLiked, isSaved, toggleLike, toggleSave, isLoading } = usePostEngagement(postId); * const { isLiked, isSaved, toggleLike, toggleSave, isLoading } = usePostEngagement(postId);

 */ */

export function usePostEngagement(postId) {export function usePostEngagement(postId) {

  const { data: savedPosts } = useGetSavedPostsQuery();  const { data: savedPosts } = useGetSavedPostsQuery();

  const { data: likedStatus } = useCheckLikedStatusQuery(postId, { skip: !postId });  const { data: likedStatus } = useCheckLikedStatusQuery(postId, { skip: !postId });

    

  const [likePost, { isLoading: isLiking }] = useLikePostMutation();  const [likePost, { isLoading: isLiking }] = useLikePostMutation();

  const [savePost, { isLoading: isSaving }] = useSavePostMutation();  const [savePost, { isLoading: isSaving }] = useSavePostMutation();

  const [unsavePost, { isLoading: isUnsaving }] = useUnsavePostMutation();  const [unsavePost, { isLoading: isUnsaving }] = useUnsavePostMutation();



  const isSaved = savedPosts?.some(p => p._id === postId);  const isSaved = savedPosts?.some(p => p._id === postId);

  const isLiked = likedStatus?.liked || false;  const isLiked = likedStatus?.liked || false;



  const toggleLike = useCallback(async () => {  const toggleLike = useCallback(async () => {

    if (!postId) return;    if (!postId) return;

    try {    try {

      await likePost(postId).unwrap();      await likePost(postId).unwrap();

    } catch (err) {    } catch (err) {

      console.error('Failed to toggle like:', err);      console.error('Failed to toggle like:', err);

      throw err;      throw err;

    }    }

  }, [postId, likePost]);  }, [postId, likePost]);



  const toggleSave = useCallback(async () => {  const toggleSave = useCallback(async () => {

    if (!postId) return;    if (!postId) return;

    try {    try {

      if (isSaved) {      if (isSaved) {

        await unsavePost(postId).unwrap();        await unsavePost(postId).unwrap();

      } else {      } else {

        await savePost(postId).unwrap();        await savePost(postId).unwrap();

      }      }

    } catch (err) {    } catch (err) {

      console.error('Failed to toggle save:', err);      console.error('Failed to toggle save:', err);

      throw err;      throw err;

    }    }

  }, [postId, isSaved, savePost, unsavePost]);  }, [postId, isSaved, savePost, unsavePost]);



  return {  return {

    isLiked,    isLiked,

    isSaved,    isSaved,

    toggleLike,    toggleLike,

    toggleSave,    toggleSave,

    isLoading: isLiking || isSaving || isUnsaving,    isLoading: isLiking || isSaving || isUnsaving,

  };  };

}}



/**/**

 * Hook for anime search with debouncing * Hook for anime search with debouncing

 *  * 

 * Usage: * Usage:

 * const { results, isSearching } = useAnimeSearch(searchTerm); * const { results, isSearching } = useAnimeSearch(searchTerm);

 */ */

export function useAnimeSearch(searchTerm, options = {}) {export function useAnimeSearch(searchTerm, options = {}) {

  const { limit = 20, debounceMs = 500 } = options;  const { limit = 20, debounceMs = 500 } = options;

  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);



  useEffect(() => {  useEffect(() => {

    const timer = setTimeout(() => {    const timer = setTimeout(() => {

      setDebouncedTerm(searchTerm);      setDebouncedTerm(searchTerm);

    }, debounceMs);    }, debounceMs);



    return () => clearTimeout(timer);    return () => clearTimeout(timer);

  }, [searchTerm, debounceMs]);  }, [searchTerm, debounceMs]);



  const { data, isLoading, error } = useSearchAnimeQuery(  const { data, isLoading, error } = useSearchAnimeQuery(

    { query: debouncedTerm, limit },    { query: debouncedTerm, limit },

    { skip: !debouncedTerm || debouncedTerm.length < 3 }    { skip: !debouncedTerm || debouncedTerm.length < 3 }

  );  );



  return {  return {

    results: data?.data || [],    results: data?.data || [],

    isSearching: isLoading,    isSearching: isLoading,

    error,    error,

    hasResults: data?.data?.length > 0,    hasResults: data?.data?.length > 0,

  };  };

}}



/**/**

 * Hook for prefetching next page * Hook for prefetching next page

 *  * 

 * Usage: * Usage:

 * const prefetchNextPage = usePrefetchPosts(); * const prefetchNextPage = usePrefetchPosts();

 * <button onMouseEnter={() => prefetchNextPage(2)}>Next</button> * <button onMouseEnter={() => prefetchNextPage(2)}>Next</button>

 */ */

export function usePrefetchPosts() {export function usePrefetchPosts() {

  const dispatch = useDispatch();  const dispatch = useDispatch();



  return useCallback((page, options = {}) => {  return useCallback((page, options = {}) => {

    dispatch(    dispatch(

      apiSlice.util.prefetch('getPosts', { page, limit: 20, ...options }, { force: false })      apiSlice.util.prefetch('getPosts', { page, limit: 20, ...options }, { force: false })

    );    );

  }, [dispatch]);  }, [dispatch]);

}}



/**/**

 * Hook for clearing all caches * Hook for clearing all caches

 *  * 

 * Usage: * Usage:

 * const clearAllCaches = useClearCache(); * const clearAllCaches = useClearCache();

 * <button onClick={clearAllCaches}>Clear Cache</button> * <button onClick={clearAllCaches}>Clear Cache</button>

 */ */

export function useClearCache() {export function useClearCache() {

  const dispatch = useDispatch();  const dispatch = useDispatch();



  return useCallback(() => {  return useCallback(() => {

    dispatch(apiSlice.util.resetApiState());    dispatch(apiSlice.util.resetApiState());

  }, [dispatch]);  }, [dispatch]);

}}



/**/**

 * Hook for accessing cache stats * Hook for accessing cache stats

 *  * 

 * Usage: * Usage:

 * const cacheInfo = useCacheInfo('getPosts', { page: 1 }); * const cacheInfo = useCacheInfo('getPosts', { page: 1 });

 */ */

export function useCacheInfo(endpointName, args) {export function useCacheInfo(endpointName, args) {

  return useSelector((state) => {  return useSelector((state) => {

    const endpoint = apiSlice.endpoints[endpointName];    const endpoint = apiSlice.endpoints[endpointName];

    if (!endpoint) return null;    if (!endpoint) return null;

        

    const selectResult = endpoint.select(args);    const selectResult = endpoint.select(args);

    return selectResult(state);    return selectResult(state);

  });  });

}}



/**/**

 * Hook for optimistic updates * Hook for optimistic updates

 *  * 

 * Usage: * Usage:

 * const updatePostOptimistically = useOptimisticUpdate('getPostById'); * const updatePostOptimistically = useOptimisticUpdate('getPostById');

 * updatePostOptimistically({ id: '123' }, (draft) => { draft.likes += 1 }); * updatePostOptimistically({ id: '123' }, (draft) => { draft.likes += 1 });

 */ */

export function useOptimisticUpdate(endpointName) {export function useOptimisticUpdate(endpointName) {

  const dispatch = useDispatch();  const dispatch = useDispatch();



  return useCallback((args, updateFn) => {  return useCallback((args, updateFn) => {

    return dispatch(    return dispatch(

      apiSlice.util.updateQueryData(endpointName, args, updateFn)      apiSlice.util.updateQueryData(endpointName, args, updateFn)

    );    );

  }, [dispatch, endpointName]);  }, [dispatch, endpointName]);

}}


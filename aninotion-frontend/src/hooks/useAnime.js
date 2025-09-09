import { useState, useEffect, useCallback } from 'react';
import { animeAPI } from '../services/api';

// Hook for searching anime
export const useAnimeSearch = (initialQuery = '') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState(initialQuery);

  const search = useCallback(async (searchQuery, options = {}) => {
    if (!searchQuery || searchQuery.trim() === '') {
      setData([]);
      setHasMore(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await animeAPI.search(searchQuery, {
        limit: 20,
        offset: 0,
        ...options
      });

      setData(response.data || []);
      setHasMore(!!response.paging?.next);
      setOffset(response.data?.length || 0);
      setQuery(searchQuery);
    } catch (err) {
      setError(err.message);
      setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!query || loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await animeAPI.search(query, {
        limit: 20,
        offset
      });

      setData(prev => [...prev, ...(response.data || [])]);
      setHasMore(!!response.paging?.next);
      setOffset(prev => prev + (response.data?.length || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, loading, hasMore, offset]);

  const clearSearch = useCallback(() => {
    setData([]);
    setError(null);
    setHasMore(false);
    setOffset(0);
    setQuery('');
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    search,
    loadMore,
    clearSearch,
    query
  };
};

// Hook for getting anime details
export const useAnimeDetails = (animeId, fields = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async (id, customFields = null) => {
    if (!id) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await animeAPI.getDetails(id, customFields || fields);
      setData(response.data);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fields]);

  useEffect(() => {
    if (animeId) {
      fetchDetails(animeId);
    }
  }, [animeId, fetchDetails]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchDetails(animeId),
    fetchDetails
  };
};

// Hook for anime rankings
export const useAnimeRanking = (rankingType = 'all', autoFetch = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchRanking = useCallback(async (type = rankingType, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await animeAPI.getRanking({
        rankingType: type,
        limit: 50,
        offset: 0,
        ...options
      });

      setData(response.data || []);
      setHasMore(!!response.paging?.next);
      setOffset(response.data?.length || 0);
    } catch (err) {
      setError(err.message);
      setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [rankingType]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await animeAPI.getRanking({
        rankingType,
        limit: 50,
        offset
      });

      setData(prev => [...prev, ...(response.data || [])]);
      setHasMore(!!response.paging?.next);
      setOffset(prev => prev + (response.data?.length || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [rankingType, loading, hasMore, offset]);

  useEffect(() => {
    if (autoFetch) {
      fetchRanking();
    }
  }, [rankingType, autoFetch, fetchRanking]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchRanking(),
    fetchRanking
  };
};

// Hook for seasonal anime
export const useSeasonalAnime = (year, season, autoFetch = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchSeasonal = useCallback(async (y = year, s = season, options = {}) => {
    if (!y || !s) {
      setData([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await animeAPI.getSeasonal(y, s, {
        limit: 50,
        offset: 0,
        ...options
      });

      setData(response.data || []);
      setHasMore(!!response.paging?.next);
      setOffset(response.data?.length || 0);
    } catch (err) {
      setError(err.message);
      setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [year, season]);

  const loadMore = useCallback(async () => {
    if (!year || !season || loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await animeAPI.getSeasonal(year, season, {
        limit: 50,
        offset
      });

      setData(prev => [...prev, ...(response.data || [])]);
      setHasMore(!!response.paging?.next);
      setOffset(prev => prev + (response.data?.length || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, season, loading, hasMore, offset]);

  useEffect(() => {
    if (autoFetch && year && season) {
      fetchSeasonal();
    }
  }, [year, season, autoFetch, fetchSeasonal]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchSeasonal(),
    fetchSeasonal
  };
};

// Hook for current season anime
export const useCurrentSeasonAnime = (autoFetch = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [seasonInfo, setSeasonInfo] = useState(null);

  const fetchCurrentSeason = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await animeAPI.getCurrentSeason({
        limit: 50,
        offset: 0,
        ...options
      });

      setData(response.data || []);
      setHasMore(!!response.paging?.next);
      setOffset(response.data?.length || 0);
      setSeasonInfo(response.season);
    } catch (err) {
      setError(err.message);
      setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await animeAPI.getCurrentSeason({
        limit: 50,
        offset
      });

      setData(prev => [...prev, ...(response.data || [])]);
      setHasMore(!!response.paging?.next);
      setOffset(prev => prev + (response.data?.length || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset]);

  useEffect(() => {
    if (autoFetch) {
      fetchCurrentSeason();
    }
  }, [autoFetch, fetchCurrentSeason]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    seasonInfo,
    refetch: fetchCurrentSeason,
    fetchCurrentSeason
  };
};

// Hook for anime API health check
export const useAnimeAPIHealth = () => {
  const [isHealthy, setIsHealthy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await animeAPI.checkHealth();
      setIsHealthy(response.success);
    } catch (err) {
      setError(err.message);
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    isHealthy,
    loading,
    error,
    checkHealth
  };
};

// Hook for popular anime (convenience)
export const usePopularAnime = (autoFetch = true) => {
  return useAnimeRanking('bypopularity', autoFetch);
};

// Hook for top rated anime (convenience)
export const useTopRatedAnime = (autoFetch = true) => {
  return useAnimeRanking('all', autoFetch);
};

// Hook for currently airing anime (convenience)
export const useCurrentlyAiringAnime = (autoFetch = true) => {
  return useAnimeRanking('airing', autoFetch);
};

// Hook for upcoming anime (convenience)
export const useUpcomingAnime = (autoFetch = true) => {
  return useAnimeRanking('upcoming', autoFetch);
};

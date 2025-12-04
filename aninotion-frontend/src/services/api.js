const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
/* there is /api include in api_base_url dont add here and cause problem */

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle authenticated requests
const authenticatedFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });
  
  // Handle 401 responses (unauthorized)
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.reload(); // Refresh to trigger auth check
    throw new Error('Authentication required');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  
  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store token and user data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get user profile (with fresh data from server)
  getProfile: async () => {
    return authenticatedFetch(`${API_BASE_URL}/auth/me`);
  },

  // Update current user profile
  updateProfile: async (userData) => {
    return authenticatedFetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // Google OAuth - Get OAuth URL
  getGoogleAuthUrl: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/google/url`);
    if (!response.ok) {
      throw new Error('Failed to get Google OAuth URL');
    }
    return response.json();
  },

  // Public signup
  signup: async (email, name, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Signup failed');
    }
    
    const data = await response.json();
    
    // Store token and user data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    return authenticatedFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Get all users from auth endpoint (admin only)
  getAllUsersFromAuth: async () => {
    return authenticatedFetch(`${API_BASE_URL}/auth/users`);
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    return authenticatedFetch(`${API_BASE_URL}/users`);
  },

  // Update user role (admin only)
  updateUserRole: async (userId, role) => {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Update user status (admin only)
  updateUserStatus: async (userId, status) => {
    return authenticatedFetch(`${API_BASE_URL}/auth/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // Get user statistics (admin only)
  getUserStats: async () => {
    return authenticatedFetch(`${API_BASE_URL}/users/stats`);
  },

  // Change current user's password
  changePassword: async (currentPassword, newPassword) => {
    return authenticatedFetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    // Include auth token if available for proper role-based filtering
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
    
    const response = await fetch(`${API_BASE_URL}/categories`, { headers });
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  create: async (categoryData) => {
    return authenticatedFetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },

  delete: async (id) => {
    return authenticatedFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE'
    });
  }
};

// Posts API
export const postsAPI = {
  getAll: async (options = {}) => {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category, 
      tags, 
      sortBy = 'publishedAt', 
      sortOrder = 'desc' 
    } = options;
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (tags) params.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
    
    let response;
    // Use authenticated fetch to get drafts if user is logged in
    if (authAPI.isAuthenticated()) {
      response = await authenticatedFetch(`${API_BASE_URL}/posts?${params}`);
    } else {
      const res = await fetch(`${API_BASE_URL}/posts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      response = await res.json();
    }
    
    // Handle new API response format with posts array and pagination
    if (response && typeof response === 'object' && Array.isArray(response.posts)) {
      return response; // Return full response with posts and pagination
    }
    
    // Fallback for old format (direct array)
    return { posts: response || [], pagination: null };
  },

  getByCategory: async (categoryId, options = {}) => {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      tags, 
      sortBy = 'publishedAt', 
      sortOrder = 'desc' 
    } = options;
    
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    
    if (status) params.append('status', status);
    if (tags) params.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
    
    const res = await fetch(`${API_BASE_URL}/posts/category/${categoryId}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch posts by category');
    const response = await res.json();
    
    // Handle new API response format with posts array and pagination
    if (response && typeof response === 'object' && Array.isArray(response.posts)) {
      return response; // Return full response with posts and pagination
    }
    
    // Fallback for old format (direct array)
    return { posts: response || [], pagination: null };
  },

  getById: async (id, incrementViews = true) => {
    const params = new URLSearchParams();
    if (!incrementViews) params.append('incrementViews', 'false');
    
    const url = `${API_BASE_URL}/posts/${id}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  },

  getBySlug: async (slug, incrementViews = true) => {
    const params = new URLSearchParams();
    if (!incrementViews) params.append('incrementViews', 'false');
    
    const url = `${API_BASE_URL}/posts/${slug}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  },

  // Get post by either ID or slug (backend handles both)
  getByIdentifier: async (identifier, incrementViews = true) => {
    const params = new URLSearchParams();
    if (!incrementViews) params.append('incrementViews', 'false');
    
    const url = `${API_BASE_URL}/posts/${identifier}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  },

  create: async (postData) => {
    return authenticatedFetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },

  update: async (id, postData) => {
    return authenticatedFetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  },

  delete: async (id) => {
    return authenticatedFetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE'
    });
  },

  // New endpoints from the enhanced backend
  publish: async (id) => {
    return authenticatedFetch(`${API_BASE_URL}/posts/${id}/publish`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'publish' })
    });
  },

  unpublish: async (id) => {
    return authenticatedFetch(`${API_BASE_URL}/posts/${id}/publish`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'unpublish' })
    });
  },

  like: async (id, sessionId) => {
    const isAuthenticated = authAPI.isAuthenticated();
    
    if (isAuthenticated) {
      return authenticatedFetch(`${API_BASE_URL}/posts/${id}/like`, {
        method: 'POST'
      });
    } else {
      throw new Error('Authentication required to like posts');
    }
  },

  // Check if current user has liked a post
  checkLikedStatus: async (id) => {
    return authenticatedFetch(`${API_BASE_URL}/posts/${id}/liked`);
  },

  // View tracking
  incrementView: async (id, sessionId) => {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
    
    const response = await fetch(`${API_BASE_URL}/posts/${id}/view`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sessionId })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    return response.json();
  },

  // Get engagement data (views, likes, user's like status)
  getEngagement: async (id, sessionId) => {
    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    
    const url = `${API_BASE_URL}/posts/${id}/engagement${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch engagement data');
    return response.json();
  },

    //  Fetch all saved posts for the logged-in user
  fetchSavedPosts: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/users/me/saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch saved posts');
      const data = await response.json();
      return data.savedPosts || [];
    } catch (err) {
      console.error("Error fetching saved posts:", err);
      throw err;
    }
  },

  // Fetch all liked posts for the logged-in user
  fetchLikedPosts: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/users/me/liked`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch liked posts');
      const data = await response.json();
      return data.likedPosts || [];
    } catch (err) {
      console.error("Error fetching liked posts:", err);
      throw err;
    }
  },

  // Fetch all posts created by the logged-in user (including drafts)
  fetchMyPosts: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/users/me/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch created posts');
      const data = await response.json();
      return data.posts || [];
    } catch (err) {
      console.error("Error fetching created posts:", err);
      throw err;
    }
  },

 
  // Save a post
  savePost: async (postId, token) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to save post');
    return response.json(); 
  },

  // Unsave a post
  unsavePost: async (postId, token) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/save`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to unsave post');
    return response.json(); 
  },
};

// Anime API
export const animeAPI = {
  // Check if anime API is working
  checkHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/anime/health`);
    if (!response.ok) throw new Error('Failed to check anime API health');
    return response.json();
  },

  // Search anime by title or keywords
  search: async (query, options = {}) => {
    const { limit = 20, offset = 0, fields } = options;
    
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('Search query is required');
    }
    
    const params = new URLSearchParams();
    params.append('q', query.trim());
    params.append('limit', Math.min(limit, 100).toString()); // Max 100 per MAL API
    params.append('offset', offset.toString());
    
    if (fields) {
      params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
    }
    
    const response = await fetch(`${API_BASE_URL}/anime/search?${params}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to search anime');
    }
    return response.json();
  },

  // Get detailed anime information by ID
  getDetails: async (animeId, fields = null) => {
    if (!animeId || isNaN(animeId)) {
      throw new Error('Valid anime ID is required');
    }
    
    const params = new URLSearchParams();
    if (fields) {
      params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
    }
    
    const url = `${API_BASE_URL}/anime/details/${animeId}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error('Anime not found');
      }
      throw new Error(errorData.message || 'Failed to fetch anime details');
    }
    return response.json();
  },

  // Get anime rankings
  getRanking: async (options = {}) => {
    const { 
      rankingType = 'all', 
      limit = 50, 
      offset = 0, 
      fields 
    } = options;
    
    const validRankingTypes = [
      'all', 'airing', 'upcoming', 'tv', 'ova', 'movie', 
      'special', 'bypopularity', 'favorite'
    ];
    
    if (!validRankingTypes.includes(rankingType)) {
      throw new Error(`Invalid ranking type. Valid types: ${validRankingTypes.join(', ')}`);
    }
    
    const params = new URLSearchParams();
    params.append('ranking_type', rankingType);
    params.append('limit', Math.min(limit, 500).toString()); // Max 500 per MAL API
    params.append('offset', offset.toString());
    
    if (fields) {
      params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
    }
    
    const response = await fetch(`${API_BASE_URL}/anime/ranking?${params}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch anime ranking');
    }
    return response.json();
  },

  // Get seasonal anime
  getSeasonal: async (year, season, options = {}) => {
    const { 
      sort, 
      limit = 50, 
      offset = 0, 
      fields 
    } = options;
    
    const validSeasons = ['winter', 'spring', 'summer', 'fall'];
    const validSorts = ['anime_score', 'anime_num_list_users'];
    
    if (!year || isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      throw new Error('Valid year is required');
    }
    
    if (!season || !validSeasons.includes(season.toLowerCase())) {
      throw new Error(`Invalid season. Valid seasons: ${validSeasons.join(', ')}`);
    }
    
    if (sort && !validSorts.includes(sort)) {
      throw new Error(`Invalid sort option. Valid sorts: ${validSorts.join(', ')}`);
    }
    
    const params = new URLSearchParams();
    params.append('limit', Math.min(limit, 500).toString()); // Max 500 per MAL API
    params.append('offset', offset.toString());
    
    if (sort) {
      params.append('sort', sort);
    }
    
    if (fields) {
      params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
    }
    
    const url = `${API_BASE_URL}/anime/season/${year}/${season.toLowerCase()}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch seasonal anime');
    }
    return response.json();
  },

  // Get current season anime (convenience method)
  getCurrentSeason: async (options = {}) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    
    let season;
    if (month >= 1 && month <= 3) {
      season = 'winter';
    } else if (month >= 4 && month <= 6) {
      season = 'spring';
    } else if (month >= 7 && month <= 9) {
      season = 'summer';
    } else {
      season = 'fall';
    }
    
    return animeAPI.getSeasonal(year, season, options);
  },

  // Get next season anime (convenience method)
  getNextSeason: async (options = {}) => {
    const now = new Date();
    let year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    let season;
    if (month >= 1 && month <= 3) {
      season = 'spring';
    } else if (month >= 4 && month <= 6) {
      season = 'summer';
    } else if (month >= 7 && month <= 9) {
      season = 'fall';
    } else {
      // If current month is Oct-Dec, next season is winter of next year
      season = 'winter';
      year += 1;
    }
    
    return animeAPI.getSeasonal(year, season, options);
  },

  // Get popular anime (convenience method)
  getPopular: async (options = {}) => {
    return animeAPI.getRanking({ 
      rankingType: 'bypopularity', 
      ...options 
    });
  },

  // Get top rated anime (convenience method)
  getTopRated: async (options = {}) => {
    return animeAPI.getRanking({ 
      rankingType: 'all', 
      ...options 
    });
  },

  // Get currently airing anime (convenience method)
  getCurrentlyAiring: async (options = {}) => {
    return animeAPI.getRanking({ 
      rankingType: 'airing', 
      ...options 
    });
  },

  // Get upcoming anime (convenience method)
  getUpcoming: async (options = {}) => {
    return animeAPI.getRanking({ 
      rankingType: 'upcoming', 
      ...options 
    });
  }
};

// Recommendations API
export const recommendationsAPI = {
  // Get similar posts for a specific post
  getSimilarPosts: async (postId, options = {}) => {
    const { limit = 6, minScore = 0.1, includeBreakdown = false } = options;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      minScore: minScore.toString(),
      includeBreakdown: includeBreakdown.toString()
    });

    const response = await fetch(
      `${API_BASE_URL}/recommendations/similar/${postId}?${queryParams}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch similar posts');
    }

    return response.json();
  },

  // Get personalized recommendations based on post history
  getPersonalized: async (postIds, options = {}) => {
    const { limit = 10, diversityFactor = 0.3 } = options;

    const response = await fetch(`${API_BASE_URL}/recommendations/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postIds, limit, diversityFactor })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch personalized recommendations');
    }

    return response.json();
  },

  // Get posts from a specific anime series
  getAnimeRecommendations: async (animeName, options = {}) => {
    const { limit = 10 } = options;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString()
    });

    const response = await fetch(
      `${API_BASE_URL}/recommendations/anime/${encodeURIComponent(animeName)}?${queryParams}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch anime recommendations');
    }

    return response.json();
  },

  // Get posts with a specific tag
  getTagRecommendations: async (tag, options = {}) => {
    const { limit = 10 } = options;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString()
    });

    const response = await fetch(
      `${API_BASE_URL}/recommendations/tag/${encodeURIComponent(tag)}?${queryParams}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch tag recommendations');
    }

    return response.json();
  },

  // Get trending posts
  getTrending: async (options = {}) => {
    const { limit = 10, timeframe = 7 } = options;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      timeframe: timeframe.toString()
    });

    const url = `${API_BASE_URL}/recommendations/trending?${queryParams}`;
    console.log('🔍 API Call:', url);
    console.log('🔍 API_BASE_URL:', API_BASE_URL);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      throw new Error('Failed to fetch trending posts');
    }

    return response.json();
  },

  // Get trending posts by category
  getTrendingByCategory: async (categoryId, options = {}) => {
    const { limit = 10, timeframe = 7 } = options;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      timeframe: timeframe.toString()
    });

    const url = `${API_BASE_URL}/recommendations/trending/category/${categoryId}?${queryParams}`;
    console.log('🔍 API Call (Trending by Category):', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      throw new Error('Failed to fetch trending posts by category');
    }

    return response.json();
  },

  // Clear cache (admin only)
  clearCache: async () => {
    return authenticatedFetch(`${API_BASE_URL}/recommendations/cache`, {
      method: 'DELETE'
    });
  },

  // Get cache statistics (admin only)
  getCacheStats: async () => {
    return authenticatedFetch(`${API_BASE_URL}/recommendations/cache/stats`);
  }
};

// Analytics API (admin only)
export const analyticsAPI = {
  // Get full dashboard data
  getDashboard: async () => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/dashboard`);
  },

  // Get realtime visitor data
  getRealtime: async () => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/realtime`);
  },

  // Get today's summary
  getToday: async () => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/today`);
  },

  // Get top content
  getTopContent: async (options = {}) => {
    const { limit = 10, days = 7 } = options;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      days: days.toString()
    });
    return authenticatedFetch(`${API_BASE_URL}/analytics/top-content?${queryParams}`);
  },

  // Get traffic sources
  getTrafficSources: async (days = 7) => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/traffic-sources?days=${days}`);
  },

  // Get device breakdown
  getDevices: async (days = 7) => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/devices?days=${days}`);
  },

  // Get hourly breakdown for today
  getHourly: async () => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/hourly`);
  },

  // Track a page view (for client-side tracking if needed)
  trackPageView: async (data) => {
    return fetch(`${API_BASE_URL}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(res => res.json());
  },

  // Trigger daily aggregation (admin only)
  aggregateStats: async () => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/aggregate`, {
      method: 'POST'
    });
  },

  // Cleanup old data (admin only)
  cleanupData: async (days = 90) => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ days })
    });
  },

  // Get debug info (admin only)
  getDebug: async () => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/debug`);
  },

  // Get status (admin only)
  getStatus: async () => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/status`);
  },

  // Reset analytics tables (admin only - use with caution!)
  resetTables: async () => {
    return authenticatedFetch(`${API_BASE_URL}/analytics/reset`, {
      method: 'POST'
    });
  }
};
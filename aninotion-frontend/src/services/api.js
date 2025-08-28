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

  // Create new user (admin only)
  createUser: async (userData) => {
    return authenticatedFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
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
  }
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
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
  getAll: async () => {
    let response;
    // Use authenticated fetch to get drafts if user is logged in
    if (authAPI.isAuthenticated()) {
      response = await authenticatedFetch(`${API_BASE_URL}/posts`);
    } else {
      const res = await fetch(`${API_BASE_URL}/posts`);
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

  getByCategory: async (categoryId) => {
    const res = await fetch(`${API_BASE_URL}/posts/category/${categoryId}`);
    if (!res.ok) throw new Error('Failed to fetch posts by category');
    const response = await res.json();
    
    // Handle new API response format with posts array and pagination
    if (response && typeof response === 'object' && Array.isArray(response.posts)) {
      return response; // Return full response with posts and pagination
    }
    
    // Fallback for old format (direct array)
    return { posts: response || [], pagination: null };
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  },

  getBySlug: async (slug) => {
    const response = await fetch(`${API_BASE_URL}/posts/slug/${slug}`);
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
      method: 'PUT'
    });
  },

  unpublish: async (id) => {
    return authenticatedFetch(`${API_BASE_URL}/posts/${id}/unpublish`, {
      method: 'PUT'
    });
  },

  like: async (id) => {
    return authenticatedFetch(`${API_BASE_URL}/posts/${id}/like`, {
      method: 'POST'
    });
  },

  unlike: async (id) => {
    return authenticatedFetch(`${API_BASE_URL}/posts/${id}/like`, {
      method: 'DELETE'
    });
  }
};
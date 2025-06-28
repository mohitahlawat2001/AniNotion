const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  create: async (categoryData) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete category');
    return response.json();
  }
};

// Posts API
export const postsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  },

  getByCategory: async (categoryId) => {
    const response = await fetch(`${API_BASE_URL}/posts/category/${categoryId}`);
    if (!response.ok) throw new Error('Failed to fetch posts by category');
    return response.json();
  },

  create: async (postData) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
  },

  update: async (id, postData) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error('Failed to update post');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete post');
    return response.json();
  }
};
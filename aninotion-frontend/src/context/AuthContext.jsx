import React, { createContext, useState, useEffect } from 'react';
import { authAPI, postsAPI } from '../services/api';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState([]);

  // Check authentication status on app load
  useEffect(() => {
    const initAuth = () => {
      const token = authAPI.getToken();
      const savedUser = authAPI.getCurrentUser();
      
      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user state (used by OAuth callback)
  const updateUser = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      // Password changed successfully
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  // Check if user has specific role or permission
  const hasRole = (role) => {
    if (!user) return false;
    if (role === 'admin') return user.role === 'admin';
    if (role === 'editor') return user.role === 'admin' || user.role === 'editor';
    if (role === 'viewer') return true; // All authenticated users can view
    return false;
  };

  // Check if user can perform write operations
  const canWrite = () => {
    return hasRole('editor') || user?.role === 'viewer'; // admin, editor, or viewer can write
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };
  
  // Fetch saved posts for logged-in user
  const fetchSavedPosts = async () => {
    const token = authAPI.getToken();
    if (!token) return;
    try {
      const posts = await postsAPI.fetchSavedPosts(token);
      setSavedPosts(posts);
    } catch (err) {
      console.error('Error fetching saved posts:', err);
    }
  };

  // Toggle save/unsave post
  const toggleSavePost = async (postId) => {
    const token = authAPI.getToken();
    // if (!token) return taost.error('You must be logged in!');
    try {
      await postsAPI.toggleSavePost(postId, token);
      
      // Update savedPosts state locally
      setSavedPosts(prev =>
        prev.some(p => p._id === postId)
          ? prev.filter(p => p._id !== postId)
          : [...prev, { _id: postId }]
      );
      
      // toast.success(prev.some(p => p._id === postId) ? 'Post unsaved!' : 'Post saved!');
    } catch (err) {
      console.error('Error toggling post save:', err);
      // toast.error('Something went wrong!');
    }
  };
  const value = {
    user,
    isAuthenticated,
    isLoading,
    savedPosts,
    login,
    logout,
    updateUser,
    changePassword,
    setUser,
    setIsAuthenticated,
    hasRole,
    canWrite,
    isAdmin,
    fetchSavedPosts,
    toggleSavePost,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

import React, { createContext, useState, useEffect } from 'react';
import { authAPI, postsAPI } from '../services/api';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);

  // Check authentication status on app load
  useEffect(() => {
    const initAuth = () => {
      const token = authAPI.getToken();
      const savedUser = authAPI.getCurrentUser();
      
      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
        fetchSavedPosts();
        fetchLikedPosts();
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
      fetchSavedPosts();
      fetchLikedPosts();
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
    setSavedPosts([]);
    setLikedPosts([]);
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

  // Fetch liked posts for logged-in user
  const fetchLikedPosts = async () => {
    const token = authAPI.getToken();
    if (!token) return;
    try {
      const posts = await postsAPI.fetchLikedPosts(token);
      setLikedPosts(posts);
    } catch (err) {
      console.error('Error fetching liked posts:', err);
    }
  };

 const toggleSavePost = async (postId, onBookmarkCountUpdate) => {
    const token = authAPI.getToken();
    if (!token) {
      alert("You must be logged in to save posts!");
      return;
    }

    try {
      // Check if post is already saved
      const isSaved = savedPosts.some(p => p._id === postId);

      let result;
      if (isSaved) {
        result = await postsAPI.unsavePost(postId, token);
        setSavedPosts(prev => prev.filter(p => p._id !== postId));
      } else {
        result = await postsAPI.savePost(postId, token);
        setSavedPosts(prev => [...prev, { _id: postId }]);
      }

      // Call the callback with the updated bookmark count
      if (onBookmarkCountUpdate && result.bookmarksCount !== undefined) {
        onBookmarkCountUpdate(result.bookmarksCount);
      }
    } catch (err) {
      console.error('Error toggling post save:', err);
    }
  };
  
  const value = {
    user,
    isAuthenticated,
    isLoading,
    savedPosts,
    likedPosts,
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
    fetchLikedPosts,
    toggleSavePost,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

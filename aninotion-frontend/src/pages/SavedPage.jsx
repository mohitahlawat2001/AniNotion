import React, { useState, useEffect } from 'react';
import PostsContainer from '../components/PostsContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { postsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const SavedPage = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedPosts();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchSavedPosts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const savedPosts = await postsAPI.fetchSavedPosts(token);
      setPosts(savedPosts || []);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view saved posts</h2>
          <p className="text-gray-600">You need to be authenticated to access your saved posts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Posts</h1>
          <p className="text-gray-600">Your collection of saved posts</p>
        </div>

        <PostsContainer
          posts={posts}
          emptyMessage="No saved posts yet!"
          onCreatePost={null} // No create post functionality on saved page
        />
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default SavedPage;
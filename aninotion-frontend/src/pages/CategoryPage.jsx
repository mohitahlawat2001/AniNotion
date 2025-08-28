import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import PostForm from '../components/PostForm';
import PostsContainer from '../components/PostsContainer';
import LayoutToggle from '../components/LayoutToggle';
import AuthButton from '../components/AuthButton';
import UserProfile from '../components/UserProfile';
import { postsAPI } from '../services/api';

const CategoryPage = ({ category }) => {
  const [posts, setPosts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategoryPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await postsAPI.getByCategory(category._id);
      
      // Handle new API response format
      if (response && typeof response === 'object' && Array.isArray(response.posts)) {
        setPosts(response.posts);
      } else {
        // Fallback for old format
        setPosts(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Error fetching category posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [category._id]);

  useEffect(() => {
    if (category) {
      fetchCategoryPosts();
    }
  }, [category, fetchCategoryPosts]);

  const handleCreatePost = async (postData) => {
    try {
      const newPost = await postsAPI.create(postData);
      setPosts([newPost, ...posts]);
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading {category.name} posts...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{category.name} Posts</h1>
        <div className="flex items-center space-x-3">
          <LayoutToggle />
          <AuthButton
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center space-x-2"
            requireAuth={true}
          >
            <Plus size={20} />
            <span>Create Post</span>
          </AuthButton>
          <UserProfile />
        </div>
      </div>

      {/* Posts Container */}
      <PostsContainer 
        posts={posts}
        emptyMessage={`No ${category.name.toLowerCase()} posts yet!`}
        onCreatePost={() => setIsFormOpen(true)}
      />

      {/* Post Form Modal */}
      <PostForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

export default CategoryPage;
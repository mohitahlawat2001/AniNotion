import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import { postsAPI } from '../services/api';

const CategoryPage = ({ category }) => {
  const [posts, setPosts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (category) {
      fetchCategoryPosts();
    }
  }, [category]);

  const fetchCategoryPosts = async () => {
    try {
      setIsLoading(true);
      const data = await postsAPI.getByCategory(category._id);
      setPosts(data);
    } catch (error) {
      console.error('Error fetching category posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Post</span>
        </button>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No {category.name.toLowerCase()} posts yet!</div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary"
          >
            Create your first {category.name.toLowerCase()} post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

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
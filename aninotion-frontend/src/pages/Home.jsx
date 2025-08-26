import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import PostForm from '../components/PostForm';
import PostsContainer from '../components/PostsContainer';
import LayoutToggle from '../components/LayoutToggle';
import { postsAPI } from '../services/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const data = await postsAPI.getAll();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
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
        <div className="text-gray-500">Loading posts...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recent Posts</h1>
        <div className="flex items-center space-x-3">
          <LayoutToggle />
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Posts Container */}
      <PostsContainer 
        posts={posts}
        emptyMessage="No posts yet!"
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

export default Home;
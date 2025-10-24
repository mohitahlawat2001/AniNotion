import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostsContainer from '../components/PostsContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { postsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const MyPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'published', 'draft'
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyPosts();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMyPosts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const myPosts = await postsAPI.fetchMyPosts(token);
      setPosts(myPosts || []);
    } catch (error) {
      console.error('Error fetching created posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'published') return post.status === 'published';
    if (filter === 'draft') return post.status === 'draft';
    return true;
  });

  const handleEditPost = (postId) => {
    navigate(`/post/${postId}/edit`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your posts</h2>
          <p className="text-gray-600">You need to be authenticated to access your created posts.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Posts</h1>
          <p className="text-gray-600">Manage your created posts and drafts</p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({posts.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'published'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Published ({posts.filter(p => p.status === 'published').length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'draft'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Drafts ({posts.filter(p => p.status === 'draft').length})
          </button>
        </div>

        <PostsContainer
          posts={filteredPosts}
          emptyMessage={
            filter === 'draft'
              ? "No drafts yet! Create a post and save it as draft."
              : filter === 'published'
              ? "No published posts yet! Publish your drafts to share them."
              : "No posts yet! Start creating your first post."
          }
          onCreatePost={null}
          showEditButton={true}
          onEdit={handleEditPost}
        />
      </div>

      <ScrollToTopButton />
    </div>
  );
};

export default MyPostsPage;

import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import PostForm from '../components/PostForm';
import PostsContainer from '../components/PostsContainer';
import LayoutToggle from '../components/LayoutToggle';
import AuthButton from '../components/AuthButton';
import UserProfile from '../components/UserProfile';
import LoadingSpinner from '../components/LoadingSpinner';
import { postsAPI } from '../services/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  useEffect(() => {
    fetchInitialPosts();
  }, []);

  const fetchInitialPosts = async () => {
    try {
      setIsLoading(true);
      const response = await postsAPI.getAll(1, 20); // Use same limit as API default
      
      // Handle new API response format
      if (response && typeof response === 'object' && Array.isArray(response.posts)) {
        setPosts(response.posts);
        setPagination(response.pagination);
        setCurrentPage(1);
        setHasMorePosts(response.pagination && response.pagination.page < response.pagination.pages);
      } else {
        // Fallback for old format
        setPosts(Array.isArray(response) ? response : []);
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
      setHasMorePosts(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMorePosts = useCallback(async () => {
    console.log('fetchMorePosts called, hasMorePosts:', hasMorePosts);
    if (!hasMorePosts || isLoadingMore) {
      console.log('No more posts to fetch or already loading, returning early');
      return;
    }

    try {
      setIsLoadingMore(true);
      console.log('Fetching more posts, current page:', currentPage, 'next page:', currentPage + 1);
      const nextPage = currentPage + 1;
      const response = await postsAPI.getAll(nextPage, 20); // Use same limit as API default
      
      console.log('Received response for page', nextPage, ':', response);
      
      if (response && typeof response === 'object' && Array.isArray(response.posts)) {
        // Check if we already have these posts to prevent duplicates
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(post => post._id));
          const newPosts = response.posts.filter(post => !existingIds.has(post._id));
          console.log('Adding', newPosts.length, 'new posts to existing', prevPosts.length, 'posts');
          return [...prevPosts, ...newPosts];
        });
        setPagination(response.pagination);
        setCurrentPage(nextPage);
        const newHasMore = response.pagination && response.pagination.page < response.pagination.pages;
        console.log('Updated hasMorePosts to:', newHasMore);
        setHasMorePosts(newHasMore);
      }
    } catch (error) {
      console.error('Error fetching more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMorePosts, isLoadingMore]);

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
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-500">Loading posts...</span>
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
        emptyMessage="No posts yet!"
        onCreatePost={() => setIsFormOpen(true)}
      />

      {/* Show More Button */}
      {hasMorePosts && posts.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={fetchMorePosts}
            disabled={isLoadingMore}
            className="group relative bg-gray-50 hover:bg-gray-100 disabled:bg-gray-50 border border-gray-200 hover:border-gray-300 disabled:border-gray-200 text-gray-700 disabled:text-gray-400 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 min-w-[140px] justify-center"
          >
            {isLoadingMore ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Show more</span>
                <svg 
                  className="w-4 h-4 transition-transform group-hover:translate-y-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* End of Posts Message */}
      {!hasMorePosts && posts.length > 0 && pagination && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end! Showing all {pagination.total} posts.</p>
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

export default Home;
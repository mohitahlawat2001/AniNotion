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
  const response = await postsAPI.getAll({ page: 1, limit: 20 }); // Use same limit as API default
      
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
  const response = await postsAPI.getAll({ page: nextPage, limit: 20 }); // Use same limit as API default
      
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

  const handleCreatePost = async (newPost) => {
    // PostForm now handles the API call, so we just need to update the local state
    setPosts([newPost, ...posts]);
  };

  if (isLoading) {
    return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold">Recent Posts</h1>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <LayoutToggle />
            <AuthButton
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center gap-2 cursor-pointer"
              requireAuth={true}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Post</span>
            </AuthButton>
          </div>
        </div>
        
        {/* Shimmer Loading */}
        <LoadingSpinner type="shimmer" count={6} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Recent Posts</h1>
        <div className="flex items-center sm:space-x-3 gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <LayoutToggle />
          <AuthButton
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center space-x-1 sm:space-x-2 px-3 sm:px-3 py-2 text-sm sm:text-base font-semibold cursor-pointer hover:bg-purple-200 rounded-lg"
            requireAuth={true}
          >
            <Plus size={18} className="sm:hidden" />
            <Plus size={20} className="hidden sm:block" />
            <span className="hidden sm:inline">Create Post</span>
            <span className="sm:hidden">Create</span>
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
        <div className="flex justify-center mt-6 sm:mt-8 px-4 sm:px-0">
          <button
            onClick={fetchMorePosts}
            disabled={isLoadingMore}
            className="group flex items-center space-x-2 bg-black/20 backdrop-blur-sm text-white hover:text-white hover:bg-black/30 disabled:bg-black/10 disabled:text-white/50 px-6 py-3 rounded-full transition-all duration-300 border border-white/30 disabled:border-white/20 min-w-[140px] justify-center touch-target"
          >
            {isLoadingMore ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="text-sm sm:text-base font-medium">Loading...</span>
              </>
            ) : (
              <>
                <span className="text-sm sm:text-base font-medium">Show more</span>
                <svg 
                  className="w-4 h-4 transition-transform group-hover:translate-y-0.5 group-hover:scale-110 duration-200" 
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
          <p>You've reached the end! Showing all {pagination.total} post{pagination.total === 1 ? '' : 's'}.</p>
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
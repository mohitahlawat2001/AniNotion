import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Plus } from 'lucide-react';
import PostFormWithToggle from '../components/PostFormWithToggle';
import PostsContainer from '../components/PostsContainer';
import LayoutToggle from '../components/LayoutToggle';
import AuthButton from '../components/AuthButton';
import UserProfile from '../components/UserProfile';
import LoadingSpinner from '../components/LoadingSpinner';
import ScrollToTopButton from '../components/ScrollToTopButton';
import TrendingSidebar from '../components/TrendingSidebar';
import { postsAPI } from '../services/api';
import { LayoutContext } from '../context/LayoutContext';

const CategoryPage = ({ category }) => {
  const [posts, setPosts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const { isList } = useContext(LayoutContext);

  const fetchInitialCategoryPosts = useCallback(async () => {
    try {
      setIsLoading(true);
  const response = await postsAPI.getByCategory(category._id, { page: 1, limit: 20 }); // Use same limit as API default
      
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
      console.error('Error fetching category posts:', error);
      setPosts([]);
      setHasMorePosts(false);
    } finally {
      setIsLoading(false);
    }
  }, [category._id]);

  const fetchMoreCategoryPosts = useCallback(async () => {
    console.log('fetchMoreCategoryPosts called, hasMorePosts:', hasMorePosts);
    if (!hasMorePosts || isLoadingMore) {
      console.log('No more category posts to fetch or already loading, returning early');
      return;
    }

    try {
      setIsLoadingMore(true);
      console.log('Fetching more category posts, current page:', currentPage, 'next page:', currentPage + 1);
      const nextPage = currentPage + 1;
  const response = await postsAPI.getByCategory(category._id, { page: nextPage, limit: 20 }); // Use same limit as API default
      
      console.log('Received category response for page', nextPage, ':', response);
      
      if (response && typeof response === 'object' && Array.isArray(response.posts)) {
        // Check if we already have these posts to prevent duplicates
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(post => post._id));
          const newPosts = response.posts.filter(post => !existingIds.has(post._id));
          console.log('Adding', newPosts.length, 'new category posts to existing', prevPosts.length, 'posts');
          return [...prevPosts, ...newPosts];
        });
        setPagination(response.pagination);
        setCurrentPage(nextPage);
        const newHasMore = response.pagination && response.pagination.page < response.pagination.pages;
        console.log('Updated category hasMorePosts to:', newHasMore);
        setHasMorePosts(newHasMore);
      }
    } catch (error) {
      console.error('Error fetching more category posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [category._id, currentPage, hasMorePosts, isLoadingMore]);

  useEffect(() => {
    if (category) {
      // Reset state when category changes
      setPosts([]);
      setCurrentPage(1);
      setHasMorePosts(true);
      fetchInitialCategoryPosts();
    }
  }, [category, fetchInitialCategoryPosts]);

  const handleCreatePost = async (newPost) => {
    // PostForm now handles the API call, so we just need to update the local state
    setPosts([newPost, ...posts]);
  };

  if (isLoading) {
    return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">{category.name} Posts</h1>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <LayoutToggle />
            <AuthButton
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
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
        
        {/* Shimmer Loading */}
        <LoadingSpinner type="shimmer" count={6} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">{category.name} Posts</h1>
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <LayoutToggle />
          <AuthButton
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
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

      {/* Two Column Layout - Posts + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Main Content - Left Side */}
        <div className="flex-1 min-w-0">
          {/* Posts Container */}
          <PostsContainer 
            posts={posts}
            emptyMessage={`No ${category.name.toLowerCase()} posts yet!`}
            onCreatePost={() => setIsFormOpen(true)}
          />

          {/* Show More Button */}
          {hasMorePosts && posts.length > 0 && (
            <div className="flex justify-center mt-6 sm:mt-8 px-4 sm:px-0">
              <button
                onClick={fetchMoreCategoryPosts}
                disabled={isLoadingMore}
                className="group relative bg-gray-50 hover:bg-gray-100 disabled:bg-gray-50 border border-gray-200 hover:border-gray-300 disabled:border-gray-200 text-gray-700 disabled:text-gray-400 px-6 sm:px-4 py-3 sm:py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 min-w-[140px] justify-center touch-target w-full sm:w-auto max-w-xs sm:max-w-none"
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
              <p>You've reached the end! Showing all {pagination.total} {category.name.toLowerCase()} posts.</p>
            </div>
          )}
        </div>

        {/* Sidebars - Right Side (Desktop Only, List View Only) */}
        {isList && (
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <TrendingSidebar 
                categoryId={category._id}
                limit={5} 
                timeframe={7}
                viewMoreLink={`/trending/category/${category._id}`}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Post Form Modal */}
      <PostFormWithToggle
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreatePost}
      />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default CategoryPage;
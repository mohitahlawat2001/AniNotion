import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import PostForm from '../components/PostForm';
import PostsContainer from '../components/PostsContainer';
import LayoutToggle from '../components/LayoutToggle';
import AuthButton from '../components/AuthButton';
import UserProfile from '../components/UserProfile';
import LoadingSpinner from '../components/LoadingSpinner';
import ScrollToTopButton from '../components/ScrollToTopButton';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const Home = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // The hook now owns and provides all data-fetching state and logic.
  const { posts, setPosts, isLoading, hasMore, loadMore } = useInfiniteScroll();

  const loadMoreButtonRef = useRef(null);
  const autoLoadTimerRef = useRef(null);

  // Effect for IntersectionObserver to auto-load more posts
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Check if the button is fully visible, there are more posts, and we are not already loading
        if (entry.isIntersecting && entry.intersectionRatio === 1 && hasMore && !isLoading) {
          if (!autoLoadTimerRef.current) {
            autoLoadTimerRef.current = setTimeout(() => {
              // Re-check conditions before calling loadMore, as state might have changed
              if (loadMoreButtonRef.current && hasMore && !isLoading) {
                loadMore();
              }
              autoLoadTimerRef.current = null; // Clear ref after execution
            }, 5000); // 5-second delay
          }
        } else {
          // If the button is not visible, clear any active timer
          if (autoLoadTimerRef.current) {
            clearTimeout(autoLoadTimerRef.current);
            autoLoadTimerRef.current = null;
          }
        }
      },
      {
        root: null, // Use the viewport as the root
        threshold: 1.0, // Trigger when 100% of the target is visible
      }
    );

    const buttonElement = loadMoreButtonRef.current;
    if (buttonElement) {
      observer.observe(buttonElement);
    }

    // Cleanup function: disconnect observer and clear any pending timeout
    return () => {
      if (autoLoadTimerRef.current) {
        clearTimeout(autoLoadTimerRef.current);
      }
      if (buttonElement) {
        observer.unobserve(buttonElement);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]); // Re-run effect if these dependencies change

  const handleCreatePost = (newPost) => {
    // Prepend the new post to the existing list for instant UI feedback
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  // Initial loading state (shimmer UI)
  if (isLoading && posts.length === 0) {
    return (
      <div>
        {/* Header is shown during initial load for context */}
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Recent Posts</h1>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <LayoutToggle />
            <AuthButton
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center gap-2"
              requireAuth={true}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Post</span>
            </AuthButton>
          </div>
        </div>
        <LoadingSpinner type="shimmer" count={6} />
      </div>
    );
  }

  return (
    <div>
      <PostForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onCreatePost={handleCreatePost}
      />
      <ScrollToTopButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Recent Posts</h1>
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

      {/* Posts Container */}
      <PostsContainer
        posts={posts}
        emptyMessage="No posts yet!"
        onCreatePost={() => setIsFormOpen(true)}
      />

      {/* Load More Button */}
      {hasMore && posts.length > 0 && (
        <div className="flex justify-center mt-6 sm:mt-8 px-4 sm:px-0">
          <button
            ref={loadMoreButtonRef}
            onClick={loadMore}
            disabled={isLoading || !hasMore}
            className="group flex items-center space-x-2 bg-black/20 backdrop-blur-sm text-white hover:text-white hover:bg-black/30 disabled:bg-black/10 disabled:text-white/50 px-6 py-3 rounded-full transition-all duration-300 border border-white/30 disabled:border-white/20 min-w-[140px] justify-center touch-target"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="text-sm sm:text-base font-medium">Loading...</span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-medium">Load More</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
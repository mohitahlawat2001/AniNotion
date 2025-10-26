import React from 'react';
import { ArrowLeft } from 'lucide-react';
import PostsContainer from './PostsContainer';
import LoadingSpinner from './LoadingSpinner';
import ScrollToTopButton from './ScrollToTopButton';
import SEO from './SEO';
import { useNavigationStack } from '../contexts/NavigationContext';

/**
 * PageWithSidebar Component - Reusable Template
 * 
 * A standardized page layout with optional sidebar
 * Used for Trending, Recommendations, Similar Posts pages, etc.
 * 
 * @param {Object} props
 * @param {string} props.pageTitle - Page title
 * @param {string} props.pageDescription - Page description for SEO
 * @param {string} props.seoTitle - SEO title
 * @param {string} props.seoDescription - SEO description
 * @param {string} props.seoUrl - SEO URL
 * @param {React.Element} props.icon - Icon component (Lucide React)
 * @param {string} props.iconColor - Tailwind color class for icon
 * @param {Array} props.posts - Array of posts to display
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.emptyMessage - Message when no posts
 * @param {React.Element} props.sidebar - Optional sidebar component
 * @param {boolean} props.showBackButton - Show back button
 * @param {string} props.backButtonText - Text for back button
 */
const PageWithSidebar = ({
  pageTitle,
  pageDescription,
  seoTitle,
  seoDescription,
  seoUrl,
  icon: Icon,
  iconColor = 'text-gray-500',
  posts = [],
  loading = false,
  error = null,
  emptyMessage = 'No posts available',
  sidebar = null,
  showBackButton = true,
  backButtonText = 'Back'
}) => {
  const { navigateBack } = useNavigationStack();

  const handleBackClick = () => {
    navigateBack();
  };

  return (
    <div>
      {/* SEO */}
      <SEO 
        title={seoTitle}
        description={seoDescription}
        url={seoUrl}
        type="website"
      />

      {/* Header */}
      <div className="mb-6">
        {/* Back Button */}
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{backButtonText}</span>
          </button>
        )}

        {/* Title Section */}
        <div className="flex items-center space-x-3">
          {Icon && <Icon className={iconColor} size={32} />}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
            {pageDescription && (
              <p className="text-gray-600 mt-1">{pageDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout - Posts + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Main Content - Left Side */}
        <div className="flex-1 min-w-0">
          {/* Loading State */}
          {loading && (
            <LoadingSpinner type="shimmer" count={8} />
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              {Icon && <Icon className="text-gray-300 mx-auto mb-4" size={64} />}
              <p className="text-gray-500 text-lg mb-2">Unable to load posts</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              {Icon && <Icon className="text-gray-300 mx-auto mb-4" size={64} />}
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
              <p className="text-gray-500">{emptyMessage}</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for more content!</p>
            </div>
          )}

          {/* Posts Grid */}
          {!loading && !error && posts.length > 0 && (
            <PostsContainer
              posts={posts}
              emptyMessage={emptyMessage}
            />
          )}
        </div>

        {/* Sidebar - Right Side (Desktop Only) */}
        {sidebar && (
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {sidebar}
            </div>
          </aside>
        )}
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default PageWithSidebar;

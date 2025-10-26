import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Flame, ArrowLeft } from 'lucide-react';
import PostsContainer from '../components/PostsContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import ScrollToTopButton from '../components/ScrollToTopButton';
import RecommendationsSidebar from '../components/RecommendationsSidebar';
import LoginPromptSidebar from '../components/LoginPromptSidebar';
import SEO from '../components/SEO';
import { recommendationsAPI, categoriesAPI } from '../services/api';
import { useNavigationStack } from '../contexts/NavigationContext';

const CategoryTrendingPage = () => {
  const { categoryId } = useParams();
  const { navigateBack } = useNavigationStack();
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit] = useState(20);
  const [timeframe] = useState(7);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch category details and trending posts in parallel
        const [categoryResponse, trendingResponse] = await Promise.all([
          categoriesAPI.getAll(),
          recommendationsAPI.getTrendingByCategory(categoryId, { 
            limit, 
            timeframe 
          })
        ]);

        // Find the specific category
        const foundCategory = categoryResponse.find(cat => cat._id === categoryId);
        
        if (!foundCategory) {
          setError('Category not found');
          setCategory(null);
          setPosts([]);
        } else {
          setCategory(foundCategory);
          
          if (trendingResponse && trendingResponse.success && trendingResponse.data) {
            setPosts(trendingResponse.data);
          } else {
            setPosts([]);
          }
        }
      } catch (err) {
        console.error('Error fetching category trending:', err);
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId, limit, timeframe]);

  const handleBackClick = () => {
    navigateBack();
  };

  if (loading) {
    return (
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-3">
            <Flame className="text-orange-500" size={32} />
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
        </div>
        <LoadingSpinner type="shimmer" count={6} />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-3">
            <Flame className="text-orange-500" size={32} />
            <h1 className="text-3xl font-bold">Error</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <Flame className="text-gray-300 mx-auto mb-4" size={64} />
          <p className="text-gray-600 text-lg">
            {error || 'Category not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* SEO */}
      <SEO 
        title={`Trending ${category.name} Posts - AniNotion`}
        description={`Discover the most popular and trending ${category.name.toLowerCase()} posts this week. View the top posts based on views, likes, and engagement.`}
        url={`/trending/category/${categoryId}`}
        type="website"
      />

      {/* Header */}
      <div className="mb-6">
        {/* Back Button */}
        <button
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Title Section */}
        <div className="flex items-center space-x-3">
          <Flame className="text-orange-500" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Trending {category.name} Posts
            </h1>
            <p className="text-gray-600 mt-1">
              Most popular {category.name.toLowerCase()} posts this week based on views, likes, and engagement
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout - Posts + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Main Content - Left Side */}
        <div className="flex-1 min-w-0">
          {/* Posts Container */}
          <PostsContainer
            posts={posts}
            emptyMessage={`No trending ${category.name.toLowerCase()} posts available right now.`}
            onCreatePost={null}
          />

          {/* End Message */}
          {posts.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Showing top {posts.length} trending {category.name.toLowerCase()} posts</p>
            </div>
          )}
        </div>

        {/* Sidebars - Right Side (Desktop Only) */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-6 space-y-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {/* Show LoginPromptSidebar if not authenticated, otherwise show Recommendations */}
            <LoginPromptSidebar />
            <RecommendationsSidebar limit={5} />
          </div>
        </aside>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default CategoryTrendingPage;

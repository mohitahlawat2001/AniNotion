import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationsAPI } from '../services/api';
import { ThumbsUp, Eye, TrendingUp, Sparkles } from 'lucide-react';

/**
 * RecommendedPosts Component
 * 
 * Displays similar or recommended posts in a grid view
 * Supports different recommendation types: similar, trending, personalized
 */
const RecommendedPosts = ({ 
  postId = null, 
  type = 'similar', 
  limit = 6,
  postIds = [],
  className = '' 
}) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize postIds to prevent unnecessary re-renders
  const postIdsString = useMemo(() => JSON.stringify(postIds), [postIds]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!postId && type === 'similar') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        let response;

        switch (type) {
          case 'similar':
            response = await recommendationsAPI.getSimilarPosts(postId, { 
              limit, 
              minScore: 0.1 
            });
            break;

          case 'trending':
            response = await recommendationsAPI.getTrending({ 
              limit, 
              timeframe: 7 
            });
            break;

          case 'personalized': {
            const parsedPostIds = JSON.parse(postIdsString);
            if (parsedPostIds && parsedPostIds.length > 0) {
              response = await recommendationsAPI.getPersonalized(parsedPostIds, { 
                limit, 
                diversityFactor: 0.3 
              });
            } else {
              // Fallback to trending if no history
              response = await recommendationsAPI.getTrending({ limit });
            }
            break;
          }

          default:
            throw new Error(`Unknown recommendation type: ${type}`);
        }

        if (response && response.success && response.data) {
          setRecommendations(response.data);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.message);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [postId, type, limit, postIdsString]);

  const handlePostClick = (post) => {
    navigate(`/post/${post._id}`, {
      state: { from: window.location.pathname }
    });
  };

  const getTitle = () => {
    switch (type) {
      case 'similar':
        return 'Similar Posts';
      case 'trending':
        return 'Trending Posts';
      case 'personalized':
        return 'Recommended For You';
      default:
        return 'Recommended Posts';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'similar':
        return <Sparkles size={20} className="text-purple-600" />;
      case 'trending':
        return <TrendingUp size={20} className="text-orange-600" />;
      case 'personalized':
        return <Sparkles size={20} className="text-blue-600" />;
      default:
        return <Sparkles size={20} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            {getTitle()}
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-3">
                <div className="w-20 h-28 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            {getTitle()}
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Unable to load recommendations</p>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            {getTitle()}
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No recommendations available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        {getIcon()}
        <h3 className="text-lg font-semibold text-gray-900">
          {getTitle()}
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-4 pr-2">
          {recommendations.map((post) => (
          <div
            key={post._id}
            onClick={() => handlePostClick(post)}
            className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            {/* Post Thumbnail */}
            {post.image && (
              <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Post Info */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1">
                {post.title}
              </h4>

              {/* Anime Name */}
              {post.animeName && (
                <p className="text-xs text-gray-600 mb-2 truncate">
                  📺 {post.animeName}
                  {post.seasonNumber && post.episodeNumber && (
                    <span className="ml-1">
                      S{post.seasonNumber}E{post.episodeNumber}
                    </span>
                  )}
                </p>
              )}

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {post.excerpt}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                {post.views !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Eye size={12} />
                    <span>{post.views.toLocaleString()}</span>
                  </div>
                )}
                {post.likesCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <ThumbsUp size={12} />
                    <span>{post.likesCount.toLocaleString()}</span>
                  </div>
                )}
                {post.similarityScore !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Sparkles size={12} className="text-purple-500" />
                    <span className="text-purple-600 font-medium">
                      {(post.similarityScore * 100).toFixed(0)}% match
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* View All Link */}
      {recommendations.length >= limit && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (type === 'similar' && postId) {
                navigate(`/post/${postId}/similar`);
              } else if (type === 'trending') {
                navigate('/trending');
              } else {
                navigate('/');
              }
            }}
            className="w-full text-center text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            View More Posts →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendedPosts;

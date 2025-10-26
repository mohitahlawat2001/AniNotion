import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationsAPI } from '../services/api';
import { TrendingUp, Eye, ThumbsUp, Flame } from 'lucide-react';

/**
 * TrendingPosts Component
 * 
 * Displays trending posts in a horizontal scrollable grid
 * Perfect for homepage or category pages
 */
const TrendingPosts = ({ 
  limit = 10, 
  timeframe = 7,
  showTitle = true,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await recommendationsAPI.getTrending({ 
          limit, 
          timeframe 
        });

        if (response && response.success && response.data) {
          setTrending(response.data);
        } else {
          setTrending([]);
        }
      } catch (err) {
        console.error('Error fetching trending posts:', err);
        setError(err.message);
        setTrending([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [limit, timeframe]);

  const handlePostClick = (post) => {
    navigate(`/post/${post._id}`);
  };

  if (loading) {
    return (
      <div className={className}>
        {showTitle && (
          <div className="flex items-center space-x-2 mb-6">
            <Flame className="text-orange-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Trending This Week</h2>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow-md overflow-hidden">
              <div className="w-full h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !trending || trending.length === 0) {
    return null; // Don't show anything if there's an error or no data
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center space-x-2 mb-6">
          <Flame className="text-orange-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Trending This Week</h2>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pr-2">
          {trending.map((post, index) => (
          <div
            key={post._id}
            onClick={() => handlePostClick(post)}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group relative"
          >
            {/* Trending Badge */}
            {index < 3 && (
              <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                <TrendingUp size={12} />
                <span>#{index + 1}</span>
              </div>
            )}

            {/* Post Image */}
            {post.image && (
              <div className="w-full h-48 overflow-hidden bg-gray-200">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Post Content */}
            <div className="p-4">
              {/* Category Badge */}
              {post.category && (
                <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded mb-2">
                  {post.category.name}
                </span>
              )}

              {/* Title */}
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {post.title}
              </h3>

              {/* Anime Name */}
              {post.animeName && (
                <p className="text-sm text-gray-600 mb-2 truncate">
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
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  {post.views !== undefined && (
                    <div className="flex items-center space-x-1">
                      <Eye size={14} />
                      <span>{post.views.toLocaleString()}</span>
                    </div>
                  )}
                  {post.likesCount !== undefined && (
                    <div className="flex items-center space-x-1">
                      <ThumbsUp size={14} />
                      <span>{post.likesCount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Engagement Score */}
                {post.engagementScore !== undefined && (
                  <div className="flex items-center space-x-1 text-orange-600 font-medium">
                    <Flame size={14} />
                    <span className="text-xs">
                      {post.engagementScore.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingPosts;

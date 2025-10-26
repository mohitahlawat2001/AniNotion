import { useNavigate } from 'react-router-dom';

/**
 * RightSidebar Component - Reusable Template
 * 
 * A generic sticky sidebar component for displaying lists of posts
 * Can be used for trending, recommendations, similar posts, etc.
 * 
 * @param {Object} props
 * @param {string} props.title - Sidebar title
 * @param {React.Element} props.icon - Icon component (Lucide React)
 * @param {string} props.iconColor - Tailwind color class for icon (e.g., 'text-orange-500')
 * @param {string} props.badgeConfig - Badge configuration function (index) => { bg, text }
 * @param {Array} props.items - Array of post items to display
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.emptyMessage - Message when no items
 * @param {string} props.viewMoreLink - Optional link for "View More" button
 * @param {string} props.viewMoreText - Text for view more button
 * @param {string} props.className - Additional classes
 */
const RightSidebar = ({
  title,
  icon: Icon,
  iconColor = 'text-gray-500',
  badgeConfig = null,
  items = [],
  loading = false,
  error = null,
  emptyMessage = 'No items available',
  viewMoreLink = null,
  viewMoreText = 'Show more',
  className = ''
}) => {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    const currentPath = window.location.pathname;
    
    // Don't pass 'from' state if we're coming from another post or similar posts page
    // This prevents navigation loops
    if (currentPath.includes('/post/') && !currentPath.includes('/similar')) {
      // If we're on a post page (but not similar posts), just navigate without state
      navigate(`/post/${item._id}`);
    } else if (currentPath.includes('/similar')) {
      // If we're on a similar posts page, don't pass state to avoid loops
      navigate(`/post/${item._id}`);
    } else {
      // For all other pages (home, trending, recommendations), pass the from state
      navigate(`/post/${item._id}`, {
        state: { from: currentPath }
      });
    }
  };

  const handleViewMoreClick = () => {
    if (viewMoreLink) {
      navigate(viewMoreLink);
    }
  };

  // Default badge config - ranking with colors
  const defaultBadgeConfig = (index) => {
    if (index === 0) return { bg: 'bg-yellow-100', text: 'text-yellow-700', content: index + 1 };
    if (index === 1) return { bg: 'bg-gray-100', text: 'text-gray-700', content: index + 1 };
    if (index === 2) return { bg: 'bg-orange-100', text: 'text-orange-700', content: index + 1 };
    return { bg: 'bg-gray-50', text: 'text-gray-600', content: index + 1 };
  };

  const getBadge = badgeConfig || defaultBadgeConfig;

  // Loading State
  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-sm ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className={iconColor} size={20} />}
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error or Empty State
  if (error || !items || items.length === 0) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-sm ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className={iconColor} size={20} />}
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
        </div>
        <div className="p-8 text-center">
          {Icon && <Icon className="text-gray-300 mx-auto mb-3" size={48} />}
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
          {error && <p className="text-gray-400 text-xs mt-1">{error}</p>}
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className={iconColor} size={20} />}
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100">
          {/* Items List */}
          {items.map((item, index) => {
            const badge = getBadge(index);
            
            return (
              <div
                key={item._id}
                onClick={() => handleItemClick(item)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start space-x-3">
                  {/* Badge */}
                  {badge && (
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${badge.bg} ${badge.text}`}>
                      {badge.content}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Category */}
                    {item.category && (
                      <p className="text-xs text-gray-500 mb-1">
                        {item.category.name}
                      </p>
                    )}

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {item.title}
                    </h3>

                    {/* Anime Name */}
                    {item.animeName && (
                      <p className="text-xs text-gray-600 mb-1 truncate">
                        {item.animeName}
                        {item.seasonNumber && item.episodeNumber && (
                          <span className="ml-1">
                            S{item.seasonNumber}E{item.episodeNumber}
                          </span>
                        )}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {item.views !== undefined && (
                        <span>{item.views.toLocaleString()} views</span>
                      )}
                      {item.likesCount !== undefined && item.views !== undefined && (
                        <span>•</span>
                      )}
                      {item.likesCount !== undefined && (
                        <span>{item.likesCount.toLocaleString()} likes</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* View More Link */}
      {viewMoreLink && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleViewMoreClick}
            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            {viewMoreText}
          </button>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;

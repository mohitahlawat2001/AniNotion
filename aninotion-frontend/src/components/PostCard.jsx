import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Tag, ChevronLeft, ChevronRight, FileText, Eye, Heart, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClickableCorner from './ClickableCorner';
import CategoryBadge from './CategoryBadge';
import ImageGallery from './ImageGallery';
import DateDisplay from './DateDisplay';
import { postsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Bookmark } from 'lucide-react';
const PostCard = ({ post, layout = 'grid', showEditButton = false, onEdit }) => {
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState({ views: 0, likesCount: 0, bookmarksCount: 0, liked: false });
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showCustomTooltip, setShowCustomTooltip] = useState(false);
const { savedPosts, toggleSavePost, isAuthenticated } = useContext(AuthContext);

  const isSaved = post && savedPosts.some(p => p._id === post._id);
  // Fetch engagement data on mount
  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        // Get basic engagement data (views, likes count)
        const data = await postsAPI.getEngagement(post._id, sessionId);
        
        let liked = false;
        // If user is authenticated, check if they liked this post
        if (isAuthenticated) {
          try {
            const likeStatus = await postsAPI.checkLikedStatus(post._id);
            liked = likeStatus.liked;
          } catch (error) {
            console.error('Error checking like status:', error);
          }
        }
        
        setEngagement({
          views: data.views || post.views || 0,
          likesCount: data.likes || post.likesCount || 0,
          bookmarksCount: post.bookmarksCount || 0,
          liked
        });
      } catch (error) {
        console.error('Error fetching engagement data:', error);
        // Fallback to post data
        setEngagement({
          views: post.views || 0,
          likesCount: post.likesCount || 0,
          bookmarksCount: post.bookmarksCount || 0,
          liked: false
        });
      }
    };

    fetchEngagement();
  }, [post._id, sessionId, post.views, post.likesCount, post.bookmarksCount, isAuthenticated]);

  // Handle like toggle
  const handleLikeToggle = async (e) => {
    e.stopPropagation(); // Prevent navigation to post page
    
    if (!isAuthenticated) {
      alert("You must be logged in to like posts!");
      return;
    }
    
    try {
      const result = await postsAPI.like(post._id);
      setEngagement(prev => ({
        ...prev,
        liked: result.liked,
        likesCount: result.likesCount
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Safety check for post data
  if (!post) {
    return null;
  }

  // Content truncation logic
  const getDisplayContent = () => {
    const maxLength = layout === 'list' ? 120 : 50;
    let content = post.excerpt || post.content || '';
    
    // Strip HTML tags for preview
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    content = tempDiv.textContent || tempDiv.innerText || '';
    
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength);
  };

  const shouldShowExpandButton = () => {
    const maxLength = layout === 'list' ? 150 : 60;
    let content = post.excerpt || post.content || '';
    
    // Strip HTML tags before checking length
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    content = tempDiv.textContent || tempDiv.innerText || '';
    
    return content.length > maxLength;
  };

  const handlePostClick = () => {
    navigate(`/post/${post._id}`, { 
      state: { from: window.location.pathname }
    });
  };

  // Get images array - prioritize 'images' array, fallback to single 'image'
  const getImages = () => {
    if (post.images && post.images.length > 0) {
      return post.images;
    } else if (post.image && post.image.trim() !== '') {
      return [post.image];
    }
    return [];
  };

  const images = getImages();

  // List layout rendering - Twitter/X style
  if (layout === 'list') {
    return (
      <div className="hover:bg-gray-50 transition-colors px-3 sm:px-4 py-3 relative rounded-2xl">
      <div className="flex space-x-3">
        {/* Avatar/Category Icon */}
        <div className="flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Tag size={18} className="text-primary sm:hidden" />
          <Tag size={20} className="text-primary hidden sm:block" />
        </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
        {/* Header with name, username, and time */}
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
          {post.title || 'Untitled'}
          </h3>
          <span className="text-gray-500 text-sm hidden sm:inline">·</span>
          <DateDisplay
            date={post.createdAt}
            showIcon={false}
            className="text-gray-500 text-xs sm:text-sm whitespace-nowrap hidden sm:block"
          />
        </div>

        {/* Mobile date (shown below title on small screens) */}
        <div className="sm:hidden mb-1">
          <DateDisplay
            date={post.createdAt}
            showIcon={false}
            className="text-gray-500 text-xs"
          />
        </div>

        {/* Anime name as subtitle */}
        <div className="flex items-center space-x-2 mb-2">
          {post.animeName && (
            <div className="relative inline-block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/anime/${encodeURIComponent(post.animeName)}`);
                }}
                onMouseEnter={() => setShowCustomTooltip(true)}
                onMouseLeave={() => setShowCustomTooltip(false)}
                className="text-gray-600 hover:text-primary hover:bg-primary/5 hover:animate-pulse text-xs sm:text-sm transition-all duration-200 px-1 py-0.5 rounded cursor-pointer"
              >
                📺 {post.animeName}
                {post.seasonNumber && post.episodeNumber 
                  ? ` - S${post.seasonNumber}E${post.episodeNumber}`
                  : post.seasonNumber
                  ? ` - Season ${post.seasonNumber}`
                  : post.episodeNumber
                  ? ` - Episode ${post.episodeNumber}`
                  : ' - Whole Series'}
              </button>
              
              {/* Custom Tooltip */}
              {showCustomTooltip && (
                <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  View all posts about this anime
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          )}
          <CategoryBadge category={post.category} size="sm" />
        </div>

        {/* Post content */}
        <div className="mb-3">
          <p className="text-gray-900 text-sm leading-relaxed">
          {getDisplayContent()}
          {shouldShowExpandButton() && '...'}
          </p>
          {shouldShowExpandButton() && (
          <button
            onClick={handlePostClick}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-1 py-1 px-2 -mx-2 rounded"
          >
            Show more
          </button>
          )}
        </div>

        {/* Images - Using reusable component */}
        {images.length > 0 && (
          <div className="mb-3">
            <ImageGallery
              images={images}
              alt={post.title || 'Post image'}
              layout="list"
            />
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {(engagement.views || 0).toLocaleString()}
            </span>
            
            {/* Like Button and Count */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleLikeToggle}
                className={`p-1 rounded-full transition-all duration-200 ${
                  engagement.liked
                    ? 'text-red-500 hover:text-red-600 bg-red-50'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
                title={engagement.liked ? 'Unlike this post' : 'Like this post'}
              >
                <Heart
                  size={14}
                  className={`transition-transform duration-200 ${
                    engagement.liked ? 'fill-current scale-110' : ''
                  }`}
                />
              </button>
              {engagement.likesCount >= 0 && (
                <span className="font-medium">
                  {engagement.likesCount.toLocaleString()}
                </span>
              )}
              
            </div>

             <button
  onClick={() => toggleSavePost(post._id, (newCount) => {
    setEngagement(prev => ({ ...prev, bookmarksCount: newCount }));
  })}
  className="p-1 rounded-full transition-all duration-200 hover:bg-yellow-50"
  title={isSaved ? 'Unsave this post' : 'Save this post'}
>
  <Bookmark
    size={16}
    className={`transition-transform duration-200 ${
      isSaved ? 'text-yellow-500 scale-110' : 'text-gray-700 hover:text-yellow-500'
    }`}
  />
</button>
{engagement.bookmarksCount >= 0 && (
  <span className="font-medium text-gray-600">
    {engagement.bookmarksCount.toLocaleString()}
  </span>
)}

          </div>
          
          {/* Edit Button for own posts */}
          {showEditButton && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(post._id);
              }}
              className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              title="Edit this post"
            >
              <Edit size={14} />
              <span className="text-xs font-medium">Edit</span>
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Clickable Corner */}
      <button
        onClick={handlePostClick}
        className="group absolute bottom-2 right-2 block outline-none cursor-pointer touch-target"
        title="View full post"
        aria-label="View full post"
      >
        <span className="relative block w-[var(--sz,2.8rem)] h-[var(--sz,2.8rem)] sm:w-[var(--sz,3.2rem)] sm:h-[var(--sz,3.2rem)] transition-[width,height] duration-300 ease-out hover:[--sz:3.2rem] sm:hover:[--sz:3.7rem] rounded-br-xl">
          {/* Fold */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-emerald-500 rounded-br-xl"></span>
          {/* Shading */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-gradient-to-tr from-black/10 to-transparent mix-blend-overlay rounded-br-xl"></span>
          {/* Diagonal READ text - adjusted for mobile */}
          <span className="absolute bottom-[8px] right-[4px] sm:bottom-[10px] sm:right-[5px] rotate-[-32deg] text-[8px] sm:text-[10px] font-semibold tracking-widest text-emerald-50">
            READ
          </span>
          {/* Ring border */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] ring-1 ring-black/10 dark:ring-white/10 rounded-br-xl"></span>
        </span>
        {/* Focus ring for keyboard users */}
        <span className="absolute inset-0 ring-2 ring-transparent focus-visible:ring-emerald-400/60 rounded-br-xl pointer-events-none"></span>
      </button>
      </div>
    );
  }

  // Grid layout rendering (default)
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative h-[460px] sm:h-[480px] flex flex-col">
      {/* Category Badge - Fixed at top left only when image exists */}
      {images.length > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <CategoryBadge category={post.category} variant="overlay" />
        </div>
      )}

      {/* Image Section */}
      {images.length > 0 && (
        <div className="aspect-[4/3] sm:aspect-[3/2] overflow-hidden flex-shrink-0">
          <ImageGallery
            images={images}
            alt={post.title || 'Post image'}
            layout="grid"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col overflow-hidden">
        {/* Category Badge - Inline when no image */}
        {images.length === 0 && (
          <div className="mb-2">
            <CategoryBadge category={post.category} />
          </div>
        )}

        {/* Title */}
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {post.title || 'Untitled'}
        </h3>

        {/* Anime Name */}
        {post.animeName && (
          <div className="relative inline-block">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/anime/${encodeURIComponent(post.animeName)}`);
              }}
              onMouseEnter={() => setShowCustomTooltip(true)}
              onMouseLeave={() => setShowCustomTooltip(false)}
              className="text-xs sm:text-sm text-gray-600 hover:text-primary hover:bg-primary/5 hover:animate-pulse mb-2 sm:mb-3 font-medium transition-all duration-200 px-1 py-0.5 rounded cursor-pointer text-left"
            >
              📺 {post.animeName}
              {post.seasonNumber && post.episodeNumber 
                ? ` - S${post.seasonNumber}E${post.episodeNumber}`
                : post.seasonNumber
                ? ` - Season ${post.seasonNumber}`
                : post.episodeNumber
                ? ` - Episode ${post.episodeNumber}`
                : ' - Whole Series'}
            </button>
            
            {/* Custom Tooltip */}
            {showCustomTooltip && (
              <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                View all posts about this anime
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        )}        {/* Content Preview */}
        <div className="mb-3 sm:mb-4 flex-shrink-0">
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
            {getDisplayContent()}
            {shouldShowExpandButton() && '...'}
          </p>
          {shouldShowExpandButton() && (
            <button
              onClick={handlePostClick}
              className="text-gray-700 hover:text-blue-500 text-xs sm:text-sm transition-colors mt-1"
            >
              Show more
            </button>
          )}
        </div>

        {/* Date */}
        <div className="text-xs sm:text-sm flex-shrink-0">
          <DateDisplay date={post.createdAt} />
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between mt-auto pt-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {(engagement.views || 0).toLocaleString()}
            </span>
            
            {/* Like Button and Count */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleLikeToggle}
                className={`p-1 rounded-full transition-all duration-200 ${
                  engagement.liked
                    ? 'text-red-500 hover:text-red-600 bg-red-50'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
                title={engagement.liked ? 'Unlike this post' : 'Like this post'}
              >
                <Heart
                  size={14}
                  className={`transition-transform duration-200 ${
                    engagement.liked ? 'fill-current scale-110' : ''
                  }`}
                />
              </button>
              {engagement.likesCount >= 0 && (
                <span className="font-medium">
                  {engagement.likesCount.toLocaleString()}
                </span>
              )}
               <button
                onClick={() => toggleSavePost(post._id, (newCount) => {
                  setEngagement(prev => ({ ...prev, bookmarksCount: newCount }));
                })}
                className="p-1 rounded-full transition-all duration-200 hover:bg-yellow-50"
                title={isSaved ? 'Unsave this post' : 'Save this post'}
              >
                <Bookmark
                  size={15}
                  className={`transition-transform duration-200 text-gray-100 ${
                    isSaved ? 'text-yellow-500 scale-110' : 'text-gray-700 hover:text-yellow-500'
                  }`}
                />
              </button>
              {engagement.bookmarksCount >= 0 && (
                <span className="font-medium text-gray-600">
                  {engagement.bookmarksCount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          
          {/* Edit Button for own posts */}
          {showEditButton && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(post._id);
              }}
              className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              title="Edit this post"
            >
              <Edit size={14} />
              <span className="text-xs font-medium">Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Clickable Corner */}
      <button
        onClick={handlePostClick}
        className="group absolute bottom-0 right-0 block outline-none cursor-pointer touch-target"
        title="View full post"
        aria-label="View full post"
      >
        <span className="relative block w-[var(--sz,2.5rem)] h-[var(--sz,2.5rem)] sm:w-[var(--sz,3.0rem)] sm:h-[var(--sz,3.0rem)] lg:w-[var(--sz,3.4rem)] lg:h-[var(--sz,3.4rem)] transition-[width,height] duration-300 ease-out hover:[--sz:2.8rem] sm:hover:[--sz:3.4rem] lg:hover:[--sz:3.9rem] rounded-tr-lg">
          {/* Fold */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-emerald-500 rounded-tr-lg"></span>
          {/* Shading */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-gradient-to-tr from-black/10 to-transparent mix-blend-overlay rounded-tr-lg"></span>
          {/* Diagonal READ text - adjusted for mobile */}
          <span className="absolute bottom-[8px] right-[4px] sm:bottom-[10px] sm:right-[5px] lg:bottom-[12px] lg:right-[6px] rotate-[-32deg] text-[7px] sm:text-[8px] lg:text-[10px] font-semibold tracking-widest text-emerald-50">
            READ
          </span>
          {/* Ring border */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] ring-1 ring-black/10 dark:ring-white/10 rounded-tr-lg"></span>
        </span>
        {/* Focus ring for keyboard users */}
        <span className="absolute inset-0 ring-2 ring-transparent focus-visible:ring-emerald-400/60 rounded-tr-lg pointer-events-none"></span>
      </button>
    </div>
  );
};

export default PostCard;
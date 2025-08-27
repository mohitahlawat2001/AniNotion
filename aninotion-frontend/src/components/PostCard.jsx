import React from 'react';
import { Calendar, Tag, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClickableCorner from './ClickableCorner';
import CategoryBadge from './CategoryBadge';
import ImageGallery from './ImageGallery';
import DateDisplay from './DateDisplay';

const PostCard = ({ post, layout = 'grid' }) => {
  const navigate = useNavigate();

  // Content truncation logic
  const getDisplayContent = () => {
    const maxLength = layout === 'list' ? 200 : 150;
    if (post.content.length <= maxLength) {
      return post.content;
    }
    return post.content.substring(0, maxLength);
  };

  const shouldShowExpandButton = () => {
    const maxLength = layout === 'list' ? 300 : 150;
    return post.content.length > maxLength;
  };

  const handlePostClick = () => {
    navigate(`/post/${post._id}`);
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
      <div className="hover:bg-gray-50 transition-colors px-4 py-3 relative rounded-2xl">
      <div className="flex space-x-3">
        {/* Avatar/Category Icon */}
        <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Tag size={20} className="text-primary" />
        </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
        {/* Header with name, username, and time */}
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-bold text-gray-900 text-sm truncate">
          {post.title}
          </h3>
          <span className="text-gray-500 text-sm">·</span>
          <DateDisplay
            date={post.createdAt}
            showIcon={false}
            className="text-gray-500 text-sm whitespace-nowrap"
          />
        </div>

        {/* Anime name as subtitle */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-gray-600 text-sm">📺 {post.animeName}</span>
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
            className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-1"
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
              alt={post.title}
              layout="list"
            />
          </div>
        )}

        </div>
      </div>

      {/* Clickable Corner - Using reusable component */}
      <ClickableCorner
        onClick={handlePostClick}
        layout="list"
        title="View full post"
      />
      </div>
    );
  }

  // Grid layout rendering (default)
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Image Section */}
      {images.length > 0 && (
        <ImageGallery
          images={images}
          alt={post.title}
          layout="grid"
          className="mb-6"
        />
      )}
      
      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <CategoryBadge category={post.category} />

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {post.title}
        </h3>

        {/* Anime Name */}
        <p className="text-sm text-gray-600 mb-3 font-medium">
          📺 {post.animeName}
        </p>

        {/* Content Preview */}
        <div className="mb-4">
          <p className="text-gray-700 line-clamp-3">
            {getDisplayContent()}
            {shouldShowExpandButton() && '...'}
          </p>
          {shouldShowExpandButton() && (
            <button
              onClick={handlePostClick}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-2"
            >
              Show more
            </button>
          )}
        </div>

        {/* Date */}
        <DateDisplay date={post.createdAt} />
      </div>

      {/* Clickable Corner - Using reusable component */}
      <ClickableCorner
        onClick={handlePostClick}
        layout="grid"
        title="View full post"
      />
    </div>
  );
};

export default PostCard;
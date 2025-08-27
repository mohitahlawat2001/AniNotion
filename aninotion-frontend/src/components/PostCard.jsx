import React, { useState } from 'react';
import { Calendar, Tag, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ post, layout = 'grid' }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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
          <span className="text-gray-500 text-sm whitespace-nowrap">
          {formatDate(post.createdAt)}
          </span>
        </div>

        {/* Anime name as subtitle */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-gray-600 text-sm">📺 {post.animeName}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {post.category?.name}
          </span>
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

        {/* Images - Twitter style */}
        {images.length > 0 && (
          <div className="mb-3">
          {images.length === 1 ? (
            // Single image
            <div className="rounded-2xl overflow-hidden border border-gray-200 max-w-lg">
            <img
              src={images[0]}
              alt={post.title}
              className="w-full h-auto max-h-80 object-cover"
              referrerPolicy="no-referrer"
            />
            </div>
          ) : (
            // Multiple images with navigation
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-w-lg group">
            <img
              src={images[currentImageIndex]}
              alt={post.title}
              className="w-full h-auto max-h-80 object-cover"
              referrerPolicy="no-referrer"
            />
            
            {/* Navigation for multiple images */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={16} />
            </button>

            {/* Image indicator dots */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
              ))}
            </div>

            {/* Image counter */}
            <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1}/{images.length}
            </div>
            </div>
          )}
          </div>
        )}

        </div>
      </div>

      {/* Clickable Corner - Compact for List View */}
      <a
        onClick={handlePostClick}
        className="group absolute bottom-2 right-2 block outline-none cursor-pointer"
        title="View full post"
      >
        <span className="sr-only">View full post</span>
        <span className="relative block w-[var(--sz,3.2rem)] h-[var(--sz,3.2rem)] transition-[width,height] duration-300 ease-out hover:[--sz:3.7rem] rounded-br-xl">
          {/* Fold */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-emerald-500 rounded-br-xl"></span>
          {/* Shading */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-gradient-to-tr from-black/10 to-transparent mix-blend-overlay rounded-br-xl"></span>
          {/* Diagonal READ text - adjusted for larger size */}
          <span className="absolute bottom-[10px] right-[5px] rotate-[-32deg] text-[10px] font-semibold tracking-widest text-emerald-50">
            READ
          </span>
          {/* Ring border */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] ring-1 ring-black/10 dark:ring-white/10 rounded-br-xl"></span>
        </span>
        {/* Focus ring for keyboard users */}
        <span className="absolute inset-0 ring-2 ring-transparent focus-visible:ring-emerald-400/60 rounded-br-xl pointer-events-none"></span>
      </a>
      </div>
    );
  }

  // Grid layout rendering (default)
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Image Section */}
      {images.length > 0 && (
        <div className="h-48 overflow-hidden relative group">
          <img
            src={images[currentImageIndex]}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer" // Added for enhanced security
          />
          
          {/* Image Navigation for Multiple Images */}
          {hasMultipleImages && (
            <>
              {/* Navigation Buttons */}
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={16} />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex
                        ? 'bg-white'
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                  />
                ))}
              </div>

              {/* Image Counter */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="flex items-center mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Tag size={12} className="mr-1" />
            {post.category?.name}
          </span>
        </div>

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
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={14} className="mr-1" />
          {formatDate(post.createdAt)}
        </div>
      </div>

      {/* Clickable Corner - Diagonal VIEW Tag */}
      <a
        onClick={handlePostClick}
        className="group absolute bottom-0 right-0 block outline-none cursor-pointer"
        title="View full post"
      >
        <span className="sr-only">View full post</span>
        <span className="relative block w-[var(--sz,3.4rem)] h-[var(--sz,3.4rem)] transition-[width,height] duration-300 ease-out hover:[--sz:3.9rem]">
          {/* Fold */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-emerald-500"></span>
          {/* Shading */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-gradient-to-tr from-black/10 to-transparent mix-blend-overlay"></span>
          {/* Diagonal VIEW text */}
          <span className="absolute bottom-[12px] right-[6px] rotate-[-32deg] text-[10px] font-semibold tracking-widest text-emerald-50">
            READ
          </span>
          {/* Ring border */}
          <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] ring-1 ring-black/10 dark:ring-white/10"></span>
        </span>
        {/* Focus ring for keyboard users */}
        <span className="absolute inset-0 ring-2 ring-transparent focus-visible:ring-emerald-400/60 rounded-tr-lg pointer-events-none"></span>
      </a>
    </div>
  );
};

export default PostCard;
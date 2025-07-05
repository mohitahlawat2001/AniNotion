import React, { useState } from 'react';
import { Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

const PostCard = ({ post }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Section */}
      {images.length > 0 && (
        <div className="h-48 overflow-hidden relative group">
          <img
            src={images[currentImageIndex]}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
        <p className="text-gray-700 mb-4 line-clamp-3">
          {post.content.length > 150 
            ? `${post.content.substring(0, 150)}...` 
            : post.content
          }
        </p>

        {/* Date */}
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={14} className="mr-1" />
          {formatDate(post.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
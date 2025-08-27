import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ImageGallery - A reusable image gallery with navigation
 */
const ImageGallery = ({
  images = [],
  alt = "Post image",
  layout = "grid", // "grid" or "list"
  className = "",
  showCounter = true,
  maxHeight = "h-48"
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const containerClasses = layout === "list"
    ? "rounded-2xl overflow-hidden border border-gray-200 max-w-lg group"
    : `h-48 overflow-hidden relative group ${maxHeight}`;

  const imageClasses = layout === "list"
    ? "w-full h-auto max-h-80 object-cover"
    : "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105";

  return (
    <div className={`${containerClasses} ${className}`}>
      <img
        src={images[currentImageIndex]}
        alt={alt}
        className={imageClasses}
        referrerPolicy="no-referrer"
      />

      {/* Navigation for multiple images */}
      {hasMultipleImages && (
        <>
          <button
            onClick={prevImage}
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              layout === "list" ? "p-1.5 rounded-full" : ""
            }`}
          >
            <ChevronLeft size={layout === "list" ? 16 : 16} />
          </button>
          <button
            onClick={nextImage}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              layout === "list" ? "p-1.5 rounded-full" : ""
            }`}
          >
            <ChevronRight size={layout === "list" ? 16 : 16} />
          </button>

          {/* Image indicators */}
          {layout === "grid" && (
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
          )}

          {/* Image counter */}
          {showCounter && (
            <div className={`absolute bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded ${
              layout === "list" ? "top-3 right-3 rounded-full" : "top-2 right-2"
            }`}>
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageGallery;

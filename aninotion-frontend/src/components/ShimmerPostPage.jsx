import React from 'react';

const ShimmerPostPage = () => {
  const shimmerClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header section shimmer */}
      <div className="mb-6 sm:mb-8">
        {/* Category badge shimmer */}
        <div className={`h-6 w-20 bg-gray-200 rounded-full mb-4 ${shimmerClasses}`}></div>
        
        {/* Title shimmer */}
        <div className="space-y-3 mb-4">
          <div className={`h-8 sm:h-10 bg-gray-300 rounded w-full ${shimmerClasses}`}></div>
          <div className={`h-8 sm:h-10 bg-gray-300 rounded w-3/4 ${shimmerClasses}`}></div>
        </div>

        {/* Anime name shimmer */}
        <div className={`h-5 bg-gray-200 rounded w-1/2 mb-4 ${shimmerClasses}`}></div>

        {/* Meta info shimmer */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className={`h-4 bg-gray-200 rounded w-24 ${shimmerClasses}`}></div>
          <div className={`h-4 bg-gray-200 rounded w-20 ${shimmerClasses}`}></div>
          <div className={`h-4 bg-gray-200 rounded w-16 ${shimmerClasses}`}></div>
        </div>
      </div>

      {/* Image gallery shimmer */}
      <div className="mb-6 sm:mb-8">
        <div className={`aspect-video w-full bg-gray-200 rounded-lg ${shimmerClasses}`}></div>
      </div>

      {/* Content shimmer */}
      <div className="prose prose-lg max-w-none">
        <div className="space-y-4">
          {/* Paragraph shimmers */}
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className={`h-4 bg-gray-200 rounded w-full ${shimmerClasses}`}></div>
              <div className={`h-4 bg-gray-200 rounded w-11/12 ${shimmerClasses}`}></div>
              <div className={`h-4 bg-gray-200 rounded w-5/6 ${shimmerClasses}`}></div>
              <div className={`h-4 bg-gray-200 rounded w-3/4 ${shimmerClasses}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons shimmer */}
      <div className="mt-8 flex flex-wrap gap-3">
        <div className={`h-10 w-24 bg-gray-200 rounded ${shimmerClasses}`}></div>
        <div className={`h-10 w-20 bg-gray-200 rounded ${shimmerClasses}`}></div>
      </div>
    </div>
  );
};

export default ShimmerPostPage;

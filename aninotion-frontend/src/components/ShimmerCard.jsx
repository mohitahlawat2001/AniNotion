import React from 'react';
import { useLayout } from '../hooks/useLayout';

const ShimmerCard = ({ layout: layoutProp }) => {
  const { layout: contextLayout } = useLayout();
  const currentLayout = layoutProp || contextLayout;

  // Shimmer animation classes
  const shimmerClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer";

  // List layout shimmer (Twitter/X style)
  if (currentLayout === 'list') {
    return (
      <div className="hover:bg-gray-50 transition-colors px-3 sm:px-4 py-3 relative rounded-2xl border-b border-gray-100 last:border-b-0">
        <div className="flex space-x-3">
          {/* Avatar shimmer */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${shimmerClasses}`}></div>
          </div>

          {/* Main content shimmer */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header shimmer - title and date */}
            <div className="flex items-center space-x-2">
              <div className={`h-4 sm:h-5 bg-gray-300 rounded w-32 sm:w-40 ${shimmerClasses}`}></div>
              <div className={`h-3 bg-gray-200 rounded w-16 hidden sm:block ${shimmerClasses}`}></div>
            </div>

            {/* Mobile date shimmer */}
            <div className="sm:hidden">
              <div className={`h-3 bg-gray-200 rounded w-16 ${shimmerClasses}`}></div>
            </div>

            {/* Anime name and category shimmer */}
            <div className="flex items-center space-x-2">
              <div className={`h-3 bg-gray-200 rounded w-24 sm:w-32 ${shimmerClasses}`}></div>
              <div className={`h-5 bg-gray-200 rounded w-16 ${shimmerClasses}`}></div>
            </div>

            {/* Content shimmer - multiple lines */}
            <div className="space-y-2">
              <div className={`h-4 bg-gray-200 rounded w-full ${shimmerClasses}`}></div>
              <div className={`h-4 bg-gray-200 rounded w-3/4 ${shimmerClasses}`}></div>
              <div className={`h-4 bg-gray-200 rounded w-1/2 ${shimmerClasses}`}></div>
            </div>

            {/* Image shimmer */}
            <div className={`h-32 sm:h-40 bg-gray-200 rounded-lg w-full ${shimmerClasses}`}></div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout shimmer (default)
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image shimmer */}
      <div className={`aspect-[4/3] sm:aspect-[3/2] bg-gray-200 ${shimmerClasses}`}></div>
      
      {/* Content shimmer */}
      <div className="p-3 sm:p-4 lg:p-6 space-y-3">
        {/* Category badge shimmer */}
        <div className={`h-6 bg-gray-200 rounded-full w-20 ${shimmerClasses}`}></div>

        {/* Title shimmer */}
        <div className="space-y-2">
          <div className={`h-5 sm:h-6 bg-gray-300 rounded w-full ${shimmerClasses}`}></div>
          <div className={`h-5 sm:h-6 bg-gray-300 rounded w-3/4 ${shimmerClasses}`}></div>
        </div>

        {/* Anime name shimmer */}
        <div className={`h-4 bg-gray-200 rounded w-2/3 ${shimmerClasses}`}></div>

        {/* Content preview shimmer */}
        <div className="space-y-2">
          <div className={`h-4 bg-gray-200 rounded w-full ${shimmerClasses}`}></div>
          <div className={`h-4 bg-gray-200 rounded w-5/6 ${shimmerClasses}`}></div>
          <div className={`h-4 bg-gray-200 rounded w-2/3 ${shimmerClasses}`}></div>
        </div>

        {/* Date shimmer */}
        <div className={`h-4 bg-gray-200 rounded w-24 ${shimmerClasses}`}></div>
      </div>
    </div>
  );
};

export default ShimmerCard;

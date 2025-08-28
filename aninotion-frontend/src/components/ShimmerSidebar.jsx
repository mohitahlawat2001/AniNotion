import React from 'react';

const ShimmerSidebar = () => {
  const shimmerClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer";

  return (
    <div className="p-4 space-y-6">
      {/* User profile section shimmer */}
      <div className="space-y-3">
        <div className={`h-6 bg-gray-300 rounded w-24 ${shimmerClasses}`}></div>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gray-200 rounded-full ${shimmerClasses}`}></div>
          <div className="space-y-2">
            <div className={`h-4 bg-gray-200 rounded w-20 ${shimmerClasses}`}></div>
            <div className={`h-3 bg-gray-200 rounded w-16 ${shimmerClasses}`}></div>
          </div>
        </div>
      </div>

      {/* Navigation links shimmer */}
      <div className="space-y-3">
        <div className={`h-5 bg-gray-300 rounded w-20 ${shimmerClasses}`}></div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center space-x-3 py-2">
            <div className={`w-5 h-5 bg-gray-200 rounded ${shimmerClasses}`}></div>
            <div className={`h-4 bg-gray-200 rounded w-24 ${shimmerClasses}`}></div>
          </div>
        ))}
      </div>

      {/* Categories section shimmer */}
      <div className="space-y-3">
        <div className={`h-5 bg-gray-300 rounded w-20 ${shimmerClasses}`}></div>
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className={`h-4 bg-gray-200 rounded w-20 ${shimmerClasses}`}></div>
              <div className={`h-4 w-6 bg-gray-200 rounded ${shimmerClasses}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity shimmer */}
      <div className="space-y-3">
        <div className={`h-5 bg-gray-300 rounded w-28 ${shimmerClasses}`}></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className={`h-4 bg-gray-200 rounded w-full ${shimmerClasses}`}></div>
              <div className={`h-3 bg-gray-200 rounded w-3/4 ${shimmerClasses}`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShimmerSidebar;

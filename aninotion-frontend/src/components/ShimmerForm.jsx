import React from 'react';

const ShimmerForm = ({ fields = 4 }) => {
  const shimmerClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer";

  return (
    <div className="space-y-6">
      {/* Form title shimmer */}
      <div className={`h-8 bg-gray-300 rounded w-48 ${shimmerClasses}`}></div>

      {/* Form fields shimmer */}
      <div className="space-y-4">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            {/* Label shimmer */}
            <div className={`h-4 bg-gray-200 rounded w-20 ${shimmerClasses}`}></div>
            {/* Input shimmer */}
            <div className={`h-10 bg-gray-200 rounded w-full ${shimmerClasses}`}></div>
          </div>
        ))}

        {/* Textarea shimmer */}
        <div className="space-y-2">
          <div className={`h-4 bg-gray-200 rounded w-16 ${shimmerClasses}`}></div>
          <div className={`h-32 bg-gray-200 rounded w-full ${shimmerClasses}`}></div>
        </div>

        {/* Image upload shimmer */}
        <div className="space-y-2">
          <div className={`h-4 bg-gray-200 rounded w-24 ${shimmerClasses}`}></div>
          <div className={`h-24 bg-gray-200 rounded border-2 border-dashed border-gray-300 w-full ${shimmerClasses}`}></div>
        </div>
      </div>

      {/* Action buttons shimmer */}
      <div className="flex space-x-3 pt-4">
        <div className={`h-10 w-24 bg-gray-300 rounded ${shimmerClasses}`}></div>
        <div className={`h-10 w-20 bg-gray-200 rounded ${shimmerClasses}`}></div>
      </div>
    </div>
  );
};

export default ShimmerForm;

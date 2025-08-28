import React from 'react';
import { useLayout } from '../hooks/useLayout';
import ShimmerContainer from './ShimmerContainer';
import ShimmerPostPage from './ShimmerPostPage';
import ShimmerSidebar from './ShimmerSidebar';
import ShimmerForm from './ShimmerForm';

const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  type = 'spinner', // 'spinner', 'shimmer', 'post', 'sidebar', 'form'
  count = 6,
  layout
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Return appropriate loading component based on type
  switch (type) {
    case 'shimmer':
      return <ShimmerContainer count={count} layout={layout} className={className} />;
    
    case 'post':
      return <ShimmerPostPage />;
    
    case 'sidebar':
      return <ShimmerSidebar />;
    
    case 'form':
      return <ShimmerForm />;
    
    case 'spinner':
    default:
      return (
        <div className={`flex justify-center items-center py-4 ${className}`}>
          <div className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
        </div>
      );
  }
};

export default LoadingSpinner;

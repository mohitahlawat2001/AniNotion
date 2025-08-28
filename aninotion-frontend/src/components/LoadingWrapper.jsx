import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useLoadingContext } from '../hooks/useLoadingContext';

const LoadingWrapper = ({ 
  children, 
  loadingKey,
  fallback,
  className = '',
  showMessage = true
}) => {
  const { getLoadingState } = useLoadingContext();
  const { isLoading, type, message } = getLoadingState(loadingKey);

  if (isLoading) {
    return (
      <div className={`loading-wrapper ${className}`}>
        {fallback || <LoadingSpinner type={type} />}
        {showMessage && message && (
          <div className="text-center text-gray-600 mt-4">
            {message}
          </div>
        )}
      </div>
    );
  }

  return children;
};

export default LoadingWrapper;

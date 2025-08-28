import React from 'react';
import { useLayout } from '../hooks/useLayout';
import ShimmerCard from './ShimmerCard';

const ShimmerContainer = ({ 
  count = 6, 
  layout: layoutProp,
  className = ''
}) => {
  const { layout: contextLayout } = useLayout();
  const currentLayout = layoutProp || contextLayout;

  // Generate array of shimmer cards
  const shimmerCards = Array.from({ length: count }, (_, index) => (
    <ShimmerCard key={index} layout={currentLayout} />
  ));

  return (
    <div className={`${className}`}>
      <div className={
        currentLayout === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
          : "bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200"
      }>
        {shimmerCards}
      </div>
    </div>
  );
};

export default ShimmerContainer;

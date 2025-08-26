import React from 'react';
import { Grid3X3, List } from 'lucide-react';
import { useLayout } from '../hooks/useLayout';

const LayoutToggle = ({ className = "" }) => {
  const { layout, toggleLayout } = useLayout();

  return (
    <button
      onClick={toggleLayout}
      className={`
        flex items-center justify-center w-10 h-10 rounded-lg
        border border-gray-300 hover:border-gray-400
        bg-white hover:bg-gray-50
        text-gray-600 hover:text-gray-800
        transition-all duration-200
        ${className}
      `}
      title={`Switch to ${layout === 'grid' ? 'list' : 'grid'} view`}
      aria-label={`Switch to ${layout === 'grid' ? 'list' : 'grid'} view`}
    >
      {layout === 'grid' ? (
        <List size={20} />
      ) : (
        <Grid3X3 size={20} />
      )}
    </button>
  );
};

export default LayoutToggle;

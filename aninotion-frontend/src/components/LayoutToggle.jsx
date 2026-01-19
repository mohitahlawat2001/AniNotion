import React from 'react';
import { Grid3X3, List } from 'lucide-react';
import { useLayout } from '../hooks/useLayout';
import { useAuth } from '../hooks/useAuth';

const LayoutToggle = ({ className = "" }) => {
  const { layout, toggleLayout } = useLayout();
  const { isAuthenticated } = useAuth();

  // Only show layout toggle for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={toggleLayout}
      className={`
        hidden md:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg
        border border-gray-300 hover:border-gray-400
        bg-white hover:bg-gray-50
        text-gray-600 hover:text-gray-800
        transition-all duration-200
        touch-target
        ${className}
      `}
      title={`Switch to ${layout === 'grid' ? 'list' : 'grid'} view`}
      aria-label={`Switch to ${layout === 'grid' ? 'list' : 'grid'} view`}
    >
      {layout === 'grid' ? (
        <List size={18} className="sm:hidden" />
      ) : (
        <Grid3X3 size={18} className="sm:hidden" />
      )}
      {layout === 'grid' ? (
        <List size={20} className="hidden sm:block" />
      ) : (
        <Grid3X3 size={20} className="hidden sm:block" />
      )}
    </button>
  );
};

export default LayoutToggle;

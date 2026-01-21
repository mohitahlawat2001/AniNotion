import React from 'react';
import { EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const HiddenCategoryToggle = ({ showHiddenOnly, onToggle, className = "" }) => {
  const { isAuthenticated, user } = useAuth();

  // Only show for users with role 'paid' and above (paid, editor, admin)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if user has paid role or above
  const roleHierarchy = { 'viewer': 1, 'paid': 2, 'editor': 3, 'admin': 4 };
  const userRoleValue = roleHierarchy[user.role] || 0;
  
  if (userRoleValue < 2) { // Less than paid
    return null;
  }

  return (
    <button
      onClick={onToggle}
      className={`
        hidden md:flex relative items-center h-8 w-16 rounded-full
        bg-gray-300
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
        focus:ring-primary focus:ring-offset-2
        ${className}
      `}
      role="switch"
      aria-checked={showHiddenOnly}
      aria-label={showHiddenOnly ? 'Show public categories' : 'Show hidden categories'}
    >
      <span
        className={`
          absolute inline-flex items-center justify-center h-7 w-7 transform rounded-full 
          bg-white shadow-md
          transition-transform duration-200 ease-in-out
          ${showHiddenOnly ? 'translate-x-8' : 'translate-x-0.5'}
        `}
      >
        <span className="text-xs font-extrabold text-gray-900">
          {showHiddenOnly ? 'X' : 'N'}
        </span>
      </span>
    </button>
  );
};

export default HiddenCategoryToggle;

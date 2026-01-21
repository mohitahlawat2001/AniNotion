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
        transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 
        focus:ring-primary focus:ring-offset-2
        hover:bg-gray-400 active:scale-95
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
          transition-all duration-300 ease-out
          ${showHiddenOnly ? 'translate-x-8 rotate-180' : 'translate-x-0.5 rotate-0'}
          hover:scale-110
        `}
      >
        <span className={`
          text-xs font-extrabold text-gray-900
          transition-all duration-300 ease-in-out
          ${showHiddenOnly ? 'scale-110' : 'scale-100'}
        `}>
          {showHiddenOnly ? 'X' : 'N'}
        </span>
      </span>
    </button>
  );
};

export default HiddenCategoryToggle;

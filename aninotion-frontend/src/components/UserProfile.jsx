import React, { useState } from 'react';
import { User, Settings, Users, LogOut, ChevronDown, Shield, Edit, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import UserManagement from './UserManagement';

const UserProfile = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const { isAuthenticated, user, logout, isAdmin, canWrite } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-red-500" />;
      case 'editor':
        return <Edit size={16} className="text-blue-500" />;
      case 'viewer':
        return <Eye size={16} className="text-gray-500" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Full access - Can manage users, posts, and categories';
      case 'editor':
        return 'Can create and edit posts and categories';
      case 'viewer':
        return 'Read-only access to content';
      default:
        return 'Unknown role';
    }
  };

  const getProfileIcon = (role) => {
    switch (role) {
      case 'admin':
        return 'A';
      case 'editor':
        return 'E';
      case 'viewer':
      case 'user':
      default:
        return 'U';
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target cursor-pointer"
        aria-label="User menu"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-400 text-white rounded-full flex items-center justify-center border-2 border-gray-300 shadow-sm">
          <span className="text-sm font-semibold">{getProfileIcon(user.role)}</span>
        </div>
        <div className="hidden md:flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-700">
            {user.name || user.email}
          </span>
          <ChevronDown 
            size={16} 
            className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform md:hidden ${isDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mx-2 sm:mx-0">
          {/* User Info Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-purple-400 text-white rounded-full flex items-center justify-center border-2 border-gray-300 shadow-sm">
                <span className="text-sm sm:text-base font-semibold">{getProfileIcon(user.role)}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  {user.name || 'User'}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">{user.email}</div>
                <div className="flex items-center space-x-2 mt-1">
                  {getRoleIcon(user.role)}
                  <span className="text-xs sm:text-sm font-medium capitalize text-gray-700">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded hover:bg-gray-100">
              {getRoleDescription(user.role)}
            </div>
          </div>

          {/* Role Capabilities */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Your Capabilities:</div>
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <Eye size={12} className="text-green-500 sm:hidden" />
                <Eye size={16} className="text-green-500 hidden sm:block" />
                <span className="text-gray-600">View posts and categories</span>
              </div>
              {canWrite() && (
                <div className="flex items-center space-x-2">
                  <Edit size={12} className="text-green-500 sm:hidden" />
                  <Edit size={16} className="text-green-500 hidden sm:block" />
                  <span className="text-gray-600">Create and edit posts</span>
                </div>
              )}
              {canWrite() && (
                <div className="flex items-center space-x-2">
                  <Settings size={12} className="text-green-500 sm:hidden" />
                  <Settings size={16} className="text-green-500 hidden sm:block" />
                  <span className="text-gray-600">Manage categories</span>
                </div>
              )}
              {isAdmin() && (
                <div className="flex items-center space-x-2">
                  <Users size={12} className="text-green-500 sm:hidden" />
                  <Users size={16} className="text-green-500 hidden sm:block" />
                  <span className="text-gray-600">Manage users and permissions</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {isAdmin() && (
              <button
                onClick={() => {
                  setShowUserManagement(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center space-x-3 p-3 sm:p-2 rounded hover:bg-gray-100 text-left text-base md:text-lg touch-target cursor-pointer"
              >
                <Users size={14} className="text-gray-500 sm:hidden" />
                <Users size={18} className="text-gray-500 hidden sm:block" />
                <span className="text-sm text-gray-700">Manage Users</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 sm:p-2 rounded hover:bg-red-50 text-left text-base md:text-lg touch-target cursor-pointer"
            >
              <LogOut size={14} className="text-red-500 sm:hidden" />
              <LogOut size={18} className="text-red-500 hidden sm:block" />
              <span className="text-sm text-red-600">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagement
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;

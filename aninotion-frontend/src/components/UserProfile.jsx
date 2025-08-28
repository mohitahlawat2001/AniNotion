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

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
          <User size={16} />
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
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* User Info Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {user.name || 'User'}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="flex items-center space-x-2 mt-1">
                  {getRoleIcon(user.role)}
                  <span className="text-sm font-medium capitalize text-gray-700">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
              {getRoleDescription(user.role)}
            </div>
          </div>

          {/* Role Capabilities */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Your Capabilities:</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <Eye size={14} className="text-green-500" />
                <span className="text-gray-600">View posts and categories</span>
              </div>
              {canWrite() && (
                <div className="flex items-center space-x-2">
                  <Edit size={14} className="text-green-500" />
                  <span className="text-gray-600">Create and edit posts</span>
                </div>
              )}
              {canWrite() && (
                <div className="flex items-center space-x-2">
                  <Settings size={14} className="text-green-500" />
                  <span className="text-gray-600">Manage categories</span>
                </div>
              )}
              {isAdmin() && (
                <div className="flex items-center space-x-2">
                  <Users size={14} className="text-green-500" />
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
                className="w-full flex items-center space-x-3 p-2 rounded hover:bg-gray-100 text-left"
              >
                <Users size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">Manage Users</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-2 rounded hover:bg-red-50 text-left"
            >
              <LogOut size={16} className="text-red-500" />
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

import React, { useState, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import PostForm from './PostForm';
import PostFormV1 from './PostFormV1';

/**
 * PostFormWithToggle - Wrapper component that allows switching between
 * the original PostForm (classic) and the new PostFormV1 (list-view style)
 * Toggle is only shown if VITE_ENABLE_POST_FORM_TOGGLE=true in environment
 */
const PostFormWithToggle = ({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) => {
  // Check if toggle is enabled via environment variable
  // If VITE_ENABLE_POST_FORM_TOGGLE is not set, it will be undefined
  // undefined === 'true' is false, so toggle is disabled by default
  const isToggleEnabled = import.meta.env.VITE_ENABLE_POST_FORM_TOGGLE === 'true';

  // Load preference from localStorage, default to V1 (list view)
  const [useV1, setUseV1] = useState(() => {
    if (!isToggleEnabled) return true; // Always use V1 if toggle is disabled
    const saved = localStorage.getItem('postFormVersion');
    return saved !== null ? saved === 'v1' : true; // Default to V1
  });

  // Save preference to localStorage when it changes (only if toggle is enabled)
  useEffect(() => {
    if (isToggleEnabled) {
      localStorage.setItem('postFormVersion', useV1 ? 'v1' : 'classic');
    }
  }, [useV1, isToggleEnabled]);

  // If toggle is disabled, always render V1
  if (!isToggleEnabled) {
    return (
      <PostFormV1
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
        isEdit={isEdit}
      />
    );
  }

  // Don't render toggle if form is not open
  if (!isOpen) {
    return useV1
      ? <PostFormV1 isOpen={false} onClose={onClose} onSubmit={onSubmit} initialData={initialData} isEdit={isEdit} />
      : <PostForm isOpen={false} onClose={onClose} onSubmit={onSubmit} initialData={initialData} isEdit={isEdit} />;
  }

  return (
    <div className="relative">
      {/* Toggle Button - Positioned at top right of the form */}
      <div className="fixed top-4 right-4 z-[60] flex items-center space-x-2 bg-white rounded-full shadow-lg border border-gray-200 p-1">
        <button
          onClick={() => setUseV1(false)}
          className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            !useV1 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Classic Form - Full featured vertical layout"
        >
          <LayoutGrid size={16} />
          <span className="hidden sm:inline">Classic</span>
        </button>
        <button
          onClick={() => setUseV1(true)}
          className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            useV1 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="V1 Form - List-view style with live preview"
        >
          <List size={16} />
          <span className="hidden sm:inline">List View</span>
        </button>
      </div>

      {/* Render the selected form */}
      {useV1 ? (
        <PostFormV1 
          isOpen={isOpen} 
          onClose={onClose} 
          onSubmit={onSubmit} 
          initialData={initialData} 
          isEdit={isEdit} 
        />
      ) : (
        <PostForm 
          isOpen={isOpen} 
          onClose={onClose} 
          onSubmit={onSubmit} 
          initialData={initialData} 
          isEdit={isEdit} 
        />
      )}
    </div>
  );
};

export default PostFormWithToggle;

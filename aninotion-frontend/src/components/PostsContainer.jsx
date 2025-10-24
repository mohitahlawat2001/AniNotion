import React from 'react';
import { useLayout } from '../hooks/useLayout';
import PostCard from './PostCard';
import AuthButton from './AuthButton';

const PostsContainer = ({ posts, emptyMessage, onCreatePost, showEditButton = false, onEdit }) => {
  const { layout } = useLayout();

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">{emptyMessage}</div>
        {onCreatePost && (
          <AuthButton
            onClick={onCreatePost}
            className="btn-primary"
            requireAuth={true}
          >
            Create your first post
          </AuthButton>
        )}
      </div>
    );
  }

  return (
    <div className={
      layout === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        : "bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200"
    }>
      {posts.map((post) => (
        <PostCard 
          key={post._id} 
          post={post} 
          layout={layout}
          showEditButton={showEditButton}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default PostsContainer;

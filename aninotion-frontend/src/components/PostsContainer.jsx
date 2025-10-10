import React from 'react';
import { useLayout } from '../hooks/useLayout';
import PostCard from './PostCard';
import AuthButton from './AuthButton';

const PostsContainer = ({ posts, emptyMessage, onCreatePost }) => {
  const { layout } = useLayout();

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">{emptyMessage}</div>
        <AuthButton
          onClick={onCreatePost}
          className="btn-primary cursor-pointer hover:bg-gray-200 px-4 py-2 rounded-lg"
          requireAuth={true}
        >
          Create your first post
        </AuthButton>
      </div>
    );
  }

  return (
    <div className={
      layout === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        : "rounded-lg overflow-hidden divide-y divide-gray-200"
    }>
      {posts.map((post) => (
        <PostCard 
          key={post._id} 
          post={post} 
          layout={layout}
        />
      ))}
    </div>
  );
};

export default PostsContainer;

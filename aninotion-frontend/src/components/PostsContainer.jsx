import React from 'react';
import { useLayout } from '../hooks/useLayout';
import PostCard from './PostCard';

const PostsContainer = ({ posts, emptyMessage, onCreatePost }) => {
  const { layout } = useLayout();

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">{emptyMessage}</div>
        <button
          onClick={onCreatePost}
          className="btn-primary"
        >
          Create your first post
        </button>
      </div>
    );
  }

  return (
    <div className={
      layout === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        : "bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200"
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

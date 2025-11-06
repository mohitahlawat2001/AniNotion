import React from 'react';
import { useInfiniteScrollPosts, useCategoryFilter } from '../hooks/useRTKQuery';

/**
 * Simple test component to demonstrate RTK Query cache behavior
 * Add this temporarily to any page to see cache logs in action
 */
export const CacheTestComponent = () => {
  const { posts, isLoading, loadMore, hasMore } = useInfiniteScrollPosts();
  const { categories, setSelectedCategory, filteredPosts } = useCategoryFilter();

  return (
    <div style={{ padding: '20px', border: '2px solid #007bff', margin: '20px', backgroundColor: '#f8f9fa' }}>
      <h3>🧪 RTK Query Cache Test</h3>
      <p><strong>Instructions:</strong> Open browser console and watch for cache logs!</p>

      <div style={{ marginBottom: '15px' }}>
        <h4>Posts Status:</h4>
        <p>Loading: {isLoading ? 'Yes' : 'No'} | Posts: {posts.length} | Has More: {hasMore ? 'Yes' : 'No'}</p>
        <button onClick={loadMore} disabled={!hasMore || isLoading}>
          Load More Posts
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>Categories Test:</h4>
        <p>Categories: {categories.length}</p>
        <select onChange={(e) => {
          const category = categories.find(c => c.id === parseInt(e.target.value));
          setSelectedCategory(category || null);
        }}>
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <p>Filtered Posts: {filteredPosts.length}</p>
      </div>

      <div style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
        <p><strong>Expected Console Logs:</strong></p>
        <ul>
          <li>🚀 FETCHING - First API call</li>
          <li>💾 USING CACHED - Subsequent cache hits</li>
          <li>🔄 REFETCHING - Background updates</li>
        </ul>
        <p>Try: Load page → Refresh → Load more → Change category</p>
      </div>
    </div>
  );
};

export default CacheTestComponent;
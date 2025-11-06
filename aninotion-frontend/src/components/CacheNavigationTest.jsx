import React from 'react';
import { useGetPostsQuery, useGetCategoriesQuery } from '../store/slices/apiSlice';

/**
 * Component to test cache behavior with navigation simulation
 * This component demonstrates that RTK Query uses cache when remounting
 */
export const CacheNavigationTest = () => {
  const [showPosts, setShowPosts] = React.useState(false);
  const [showCategories, setShowCategories] = React.useState(false);
  const [navigationCount, setNavigationCount] = React.useState(0);

  return (
    <div style={{ padding: '20px', border: '2px solid #2196F3', margin: '20px', borderRadius: '8px' }}>
      <h3>🧪 Cache Navigation Test</h3>
      
      <div style={{ marginBottom: '20px', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
        <h4>Test Instructions:</h4>
        <ol style={{ margin: '10px 0' }}>
          <li>Click "Show Posts" - Watch console for 📡 network request</li>
          <li>Click "Hide Posts" to unmount the component</li>
          <li>Click "Show Posts" again - Should see 💾 cache hit (NO 📡 network request!)</li>
          <li>Check Network tab - no new request on step 3</li>
        </ol>
        <p style={{ margin: '10px 0', fontWeight: 'bold' }}>
          Navigation Count: {navigationCount} 
          {navigationCount > 1 && ' (Subsequent loads should use cache!)'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => {
            setShowPosts(!showPosts);
            if (!showPosts) setNavigationCount(prev => prev + 1);
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: showPosts ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showPosts ? '🙈 Hide Posts' : '👁️ Show Posts'}
        </button>
        
        <button 
          onClick={() => setShowCategories(!showCategories)}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: showCategories ? '#f44336' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showCategories ? '🙈 Hide Categories' : '👁️ Show Categories'}
        </button>

        <button 
          onClick={() => {
            setShowPosts(false);
            setShowCategories(false);
            setNavigationCount(0);
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Reset Test
        </button>
      </div>

      {showPosts && <PostsComponent />}
      {showCategories && <CategoriesComponent />}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <p><strong>💡 What to look for in console:</strong></p>
        <ul style={{ margin: '5px 0', fontSize: '14px' }}>
          <li>First "Show Posts": 🌐 Building query → 📡 Network request → ✅ Success</li>
          <li>Second "Show Posts": 🌐 Building query → 💾 Cache hit (NO 📡!)</li>
          <li>Cache valid for 5 minutes (300 seconds)</li>
        </ul>
      </div>
    </div>
  );
};

const PostsComponent = () => {
  const { data, isLoading, isFetching } = useGetPostsQuery({ page: 1, limit: 5 });
  
  return (
    <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px', marginTop: '10px' }}>
      <h4>📄 Posts Data</h4>
      {isLoading && <p>⏳ Loading posts...</p>}
      {isFetching && !isLoading && <p>🔄 Updating posts...</p>}
      {data && (
        <div>
          <p><strong>Loaded {data.posts?.length || 0} posts</strong></p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Status: {isLoading ? 'Loading' : isFetching ? 'Fetching' : '✅ Ready'}
          </p>
        </div>
      )}
    </div>
  );
};

const CategoriesComponent = () => {
  const { data: categories, isLoading, isFetching } = useGetCategoriesQuery();
  
  return (
    <div style={{ padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '5px', marginTop: '10px' }}>
      <h4>📂 Categories Data</h4>
      {isLoading && <p>⏳ Loading categories...</p>}
      {isFetching && !isLoading && <p>🔄 Updating categories...</p>}
      {categories && (
        <div>
          <p><strong>Loaded {categories.length} categories</strong></p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Status: {isLoading ? 'Loading' : isFetching ? 'Fetching' : '✅ Ready'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CacheNavigationTest;

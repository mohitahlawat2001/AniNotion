import React from 'react';
import { enableRTKQueryDebugging, useRTKQueryCacheMonitor, useInfiniteScrollPosts, useCategoryFilter } from '../hooks/useRTKQuery';

/**
 * Example component demonstrating RTK Query cache monitoring
 * Add this to your app to see cache performance in action
 */
export const RTKQueryCacheDebugger = () => {
  // Enable debugging (call this once in your app) - minimal logging by default
  React.useEffect(() => {
    enableRTKQueryDebugging(false); // Set to true for detailed cache hit logging
  }, []);

  // Monitor cache performance
  const { apiCalls, cacheHits, mutations, cacheHitRate, resetStats } = useRTKQueryCacheMonitor();

  // Example hooks to demonstrate caching (only load when user interacts)
  const [loadDemoData, setLoadDemoData] = React.useState(false);
  const { posts: _posts, isLoading: _isLoading, loadMore: _loadMore, hasMore: _hasMore } = useInfiniteScrollPosts({}, !loadDemoData);
  const { categories, setSelectedCategory } = useCategoryFilter(!loadDemoData);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>🔍 RTK Query Cache Monitor</h3>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div>
          <strong>API Calls:</strong> {apiCalls}
        </div>
        <div>
          <strong>Cache Hits:</strong> {cacheHits}
        </div>
        <div>
          <strong>Mutations:</strong> {mutations}
        </div>
        <div>
          <strong>Cache Hit Rate:</strong> {cacheHitRate}
        </div>
        <button onClick={resetStats}>Reset Stats</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Test Cache Behavior:</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setLoadDemoData(true)} disabled={loadDemoData}>
            📊 {loadDemoData ? 'Demo Data Loaded' : 'Load Demo Data (triggers API calls)'}
          </button>
          <button onClick={() => setLoadDemoData(false)} disabled={!loadDemoData}>
            🗑️ Clear Demo Data
          </button>
          <button onClick={() => setLoadDemoData(prev => !prev)}>
            🔄 Toggle Demo Data (test cache)
          </button>
          <button onClick={() => setSelectedCategory(categories[0] || null)} disabled={!loadDemoData || !categories.length}>
            📂 Load Category Posts
          </button>
        </div>
      </div>

      <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px', marginBottom: '20px' }}>
        <p><strong>📊 Demo Data Status:</strong></p>
        <ul style={{ margin: '5px 0' }}>
          <li>Demo Data: {loadDemoData ? '✅ Active (loading posts & categories)' : '❌ Inactive'}</li>
          <li>Categories Loaded: {categories.length > 0 ? `✅ ${categories.length} categories` : '❌ None'}</li>
        </ul>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p><strong>How to test caching:</strong></p>
        <ol>
          <li>Click "Load Demo Data" - watch console for 🚀 API calls</li>
          <li>Click "Clear Demo Data" then "Load Demo Data" again - watch for 💾 cache hits</li>
          <li>Check Network tab: first load = network requests, cache hits = no requests</li>
          <li>Cache is valid for 5 minutes (keepUnusedDataFor: 300s)</li>
        </ol>
        <p><strong>Console Logs:</strong></p>
        <ul>
          <li>🚀 = Fetching from API (network request)</li>
          <li>💾 = Cache hit (no network request)</li>
          <li>🔄 = Refetching (background update)</li>
        </ul>
      </div>
    </div>
  );
};

export default RTKQueryCacheDebugger;
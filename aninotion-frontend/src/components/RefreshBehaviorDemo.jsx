/**
 * Browser Refresh vs Navigation Demo
 *
 * This component demonstrates the difference between:
 * - Browser refresh (F5) → Fresh API calls
 * - In-app navigation → Cache hits
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGetPostsQuery, useGetCategoriesQuery } from '../store/slices/apiSlice';

function RefreshBehaviorDemo() {
  const location = useLocation();
  const [refreshCount, setRefreshCount] = useState(0);

  // Track page refreshes (persists in sessionStorage)
  useEffect(() => {
    const count = parseInt(sessionStorage.getItem('refreshCount') || '0') + 1;
    sessionStorage.setItem('refreshCount', count.toString());
    setRefreshCount(count);
  }, []);

  // Queries
  const postsQuery = useGetPostsQuery({ page: 1, limit: 5 });
  const categoriesQuery = useGetCategoriesQuery();

  const { data: posts, isLoading: postsLoading, isFetching: postsFetching } = postsQuery;
  const { data: categories, isLoading: categoriesLoading } = categoriesQuery;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Browser Refresh vs Navigation Demo</h1>

      {/* Status Indicator */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">📊 Current Status:</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Page Loads:</strong> {refreshCount}
          </div>
          <div>
            <strong>Current Path:</strong> {location.pathname}
          </div>
          <div>
            <strong>Posts Status:</strong>
            {postsLoading && <span className="text-orange-600"> Loading (API call)</span>}
            {postsFetching && !postsLoading && <span className="text-blue-600"> Fetching (API call)</span>}
            {!postsLoading && !postsFetching && <span className="text-green-600"> Cache hit</span>}
          </div>
          <div>
            <strong>Categories Status:</strong>
            {categoriesLoading
              ? <span className="text-orange-600"> Loading (API call)</span>
              : <span className="text-green-600"> Cache hit</span>
            }
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">🧪 How to Test:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Browser Refresh:</strong> Press F5 or Ctrl+R → Watch status change to "Loading"</li>
          <li><strong>In-App Navigation:</strong> Click navigation links → Status stays "Cache hit"</li>
          <li><strong>Open Network Tab:</strong> See API calls on refresh vs no calls on navigation</li>
        </ol>
      </div>

      {/* Navigation Links */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">🧭 Navigation Links</h2>
        <div className="flex gap-4">
          <Link
            to="/demo"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Same Page (/demo)
          </Link>
          <Link
            to="/demo2"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Different Page (/demo2)
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🔄 Browser Refresh
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          <strong>Note:</strong> Navigation links use React Router (cache persists).
          Browser refresh button reloads the page (cache clears).
        </p>
      </div>

      {/* Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Posts */}
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-3">📝 Posts (Cached: 5 min)</h3>
          {posts?.posts ? (
            <div className="space-y-2">
              {posts.posts.map(post => (
                <div key={post._id} className="border p-2 rounded text-sm">
                  <div className="font-medium truncate">{post.title}</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">Loading posts...</div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-3">📂 Categories (Cached: 10 min)</h3>
          {categories ? (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <span key={cat._id} className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {cat.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">Loading categories...</div>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-green-50 border border-green-200 rounded p-4 mt-6">
        <h2 className="font-semibold mb-2">🎯 Key Takeaways:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Browser Refresh:</strong> Redux store clears → Cache empty → API calls made</li>
          <li><strong>In-App Navigation:</strong> Redux store persists → Cache available → Instant loads</li>
          <li><strong>Page Counter:</strong> Resets on refresh, persists on navigation</li>
          <li><strong>Network Tab:</strong> Shows API calls on refresh, none on navigation</li>
        </ul>
      </div>
    </div>
  );
}

export default RefreshBehaviorDemo;

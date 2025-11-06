/**
 * RTK Query Cache Behavior Demo
 *
 * This component demonstrates when API calls are made vs cache hits
 * Open browser dev tools Network tab to see actual requests
 */

import { useState } from 'react';
import { useGetPostsQuery, useGetCategoriesQuery, useCreatePostMutation } from '../store/slices/apiSlice';

function CacheBehaviorDemo() {
  const [page, setPage] = useState(1);
  const [showCategories, setShowCategories] = useState(false);

  // Query 1: Posts (changes with page)
  const postsQuery = useGetPostsQuery({ page, limit: 10 });
  const { data: posts, isLoading: postsLoading, isFetching: postsFetching } = postsQuery;

  // Query 2: Categories (static)
  const categoriesQuery = useGetCategoriesQuery(undefined, {
    skip: !showCategories // Only fetch when requested
  });
  const { data: categories, isLoading: categoriesLoading } = categoriesQuery;

  // Mutation: Create post (invalidates cache)
  const [createPost, { isLoading: creating }] = useCreatePostMutation();

  const handleCreatePost = async () => {
    try {
      await createPost({
        title: `Test Post ${Date.now()}`,
        content: 'This is a test post to demonstrate cache invalidation',
        category: 'test',
        tags: ['demo']
      }).unwrap();
      alert('Post created! Notice how posts list automatically refreshes');
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('Failed to create post');
    }
  };

  const handleRefetch = () => {
    postsQuery.refetch();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">RTK Query Cache Behavior Demo</h1>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">📊 How to Test Cache Behavior:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open browser DevTools → Network tab</li>
          <li>Filter by "posts" to see API calls</li>
          <li>Try the actions below and watch network requests</li>
        </ol>
      </div>

      {/* Posts Section */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">📝 Posts Query</h2>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setPage(1)}
            className={`px-4 py-2 rounded ${page === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Page 1
          </button>
          <button
            onClick={() => setPage(2)}
            className={`px-4 py-2 rounded ${page === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Page 2
          </button>
          <button
            onClick={handleRefetch}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            🔄 Manual Refetch
          </button>
        </div>

        <div className="mb-4">
          <strong>Status:</strong>
          {postsLoading && <span className="text-orange-600"> Loading (API call)</span>}
          {postsFetching && !postsLoading && <span className="text-blue-600"> Fetching (API call)</span>}
          {!postsLoading && !postsFetching && <span className="text-green-600"> Cache hit (no API call)</span>}
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <strong>Cache Key:</strong> getPosts({`{"page":${page},"limit":10}`})
          <br />
          <strong>Cache Duration:</strong> 5 minutes
        </div>

        {posts?.posts && (
          <div className="space-y-2">
            {posts.posts.slice(0, 3).map(post => (
              <div key={post._id} className="border p-2 rounded text-sm">
                {post.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">📂 Categories Query</h2>

        <button
          onClick={() => setShowCategories(!showCategories)}
          className="px-4 py-2 bg-purple-500 text-white rounded mb-4"
        >
          {showCategories ? 'Hide Categories' : 'Load Categories'}
        </button>

        {showCategories && (
          <>
            <div className="mb-4">
              <strong>Status:</strong>
              {categoriesLoading
                ? <span className="text-orange-600"> Loading (API call)</span>
                : <span className="text-green-600"> Cache hit (no API call)</span>
              }
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <strong>Cache Key:</strong> getCategories()
              <br />
              <strong>Cache Duration:</strong> 10 minutes
            </div>

            {categories && (
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <span key={cat._id} className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mutation Section */}
      <div className="bg-white border rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">✏️ Create Post Mutation</h2>

        <button
          onClick={handleCreatePost}
          disabled={creating}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Test Post'}
        </button>

        <div className="mt-4 text-sm text-gray-600">
          <strong>What happens:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>API call to create post</li>
            <li>Cache for posts list gets invalidated</li>
            <li>Posts query automatically refetches</li>
            <li>You'll see the new post appear</li>
          </ol>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-green-50 p-4 rounded">
        <h2 className="font-semibold mb-2">🎯 Key Takeaways:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>First query:</strong> Always makes API call</li>
          <li><strong>Same query again:</strong> Cache hit (no API call)</li>
          <li><strong>Different parameters:</strong> New API call (different cache key)</li>
          <li><strong>After cache expires:</strong> API call to refresh</li>
          <li><strong>After mutation:</strong> Related caches invalidated → API calls</li>
          <li><strong>Multiple components:</strong> Share same cache (1 API call total)</li>
        </ul>
      </div>
    </div>
  );
}

export default CacheBehaviorDemo;

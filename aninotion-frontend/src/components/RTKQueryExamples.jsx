/**
 * Example Component: Posts List with RTK Query
 * 
 * This demonstrates how to use RTK Query hooks for:
 * - Fetching data with automatic caching
 * - Handling loading and error states
 * - Pagination
 * - Manual refetching
 */

import { useState } from 'react';
import { useGetPostsQuery } from '../store/slices/apiSlice';
import LoadingSpinner from './LoadingSpinner';
import PostCard from './PostCard';

function PostsListExample() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // RTK Query hook - automatic caching and loading states
  const { 
    data, 
    isLoading, 
    isFetching,
    error, 
    refetch 
  } = useGetPostsQuery({ 
    page, 
    limit,
    sortBy: 'publishedAt',
    sortOrder: 'desc'
  });

  const posts = data?.posts || [];
  const pagination = data?.pagination;

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">
          Error: {error.data?.message || error.error || 'Failed to load posts'}
        </div>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle empty state
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No posts found</p>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>
        <button 
          onClick={refetch}
          disabled={isFetching}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasNextPage || isFetching}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Loading indicator for background fetching */}
      {isFetching && !isLoading && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
          Updating...
        </div>
      )}
    </div>
  );
}

export default PostsListExample;


/**
 * Example Component: Post Detail with Like/Save
 * 
 * Demonstrates:
 * - Fetching single post
 * - Mutations (like, save)
 * - Cache invalidation
 */

import { useParams } from 'react-router-dom';
import { 
  useGetPostBySlugQuery, 
  useLikePostMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useGetSavedPostsQuery
} from '../store/slices/apiSlice';

export function PostDetailExample() {
  const { slug } = useParams();
  
  // Fetch post data - cached automatically
  const { data: post, isLoading, error } = useGetPostBySlugQuery({ 
    slug,
    incrementViews: true 
  });

  // Check if post is saved
  const { data: savedPosts } = useGetSavedPostsQuery();
  const isSaved = savedPosts?.some(p => p._id === post?._id);

  // Mutations
  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [savePost, { isLoading: isSaving }] = useSavePostMutation();
  const [unsavePost, { isLoading: isUnsaving }] = useUnsavePostMutation();

  const handleLike = async () => {
    try {
      await likePost(post._id).unwrap();
      // Cache automatically invalidated - post will refetch!
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await unsavePost(post._id).unwrap();
      } else {
        await savePost(post._id).unwrap();
      }
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          ❤️ {post.likes || 0} {isLiking && '...'}
        </button>
        
        <button
          onClick={handleSave}
          disabled={isSaving || isUnsaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSaved ? '🔖 Saved' : '📌 Save'}
          {(isSaving || isUnsaving) && '...'}
        </button>
      </div>

      <div className="prose max-w-none">
        {/* Post content */}
      </div>
    </article>
  );
}


/**
 * Example Component: Category Filter
 * 
 * Demonstrates:
 * - Fetching with dependencies
 * - Conditional queries
 */

import { useGetCategoriesQuery, useGetPostsByCategoryQuery } from '../store/slices/apiSlice';

export function CategoryFilterExample() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories - cached for 10 minutes
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();

  // Fetch posts by category - only when category is selected
  const { data: categoryPosts, isLoading: postsLoading } = useGetPostsByCategoryQuery(
    { 
      categoryId: selectedCategory,
      page: 1,
      limit: 20
    },
    { skip: !selectedCategory } // Don't fetch if no category selected
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Filter by Category</h2>
      
      {/* Category buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categoriesLoading ? (
          <LoadingSpinner />
        ) : (
          categories?.map((category) => (
            <button
              key={category._id}
              onClick={() => setSelectedCategory(category._id)}
              className={`px-4 py-2 rounded ${
                selectedCategory === category._id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))
        )}
      </div>

      {/* Posts for selected category */}
      {selectedCategory && (
        <div>
          {postsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryPosts?.posts?.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/**
 * Example Component: Anime Search with RTK Query
 * 
 * Demonstrates:
 * - Search queries
 * - Debouncing (manual)
 * - Caching search results
 */

import { useEffect } from 'react';
import { useSearchAnimeQuery } from '../store/slices/apiSlice';

export function AnimeSearchExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search anime - results cached for 15 minutes
  const { data, isLoading, error } = useSearchAnimeQuery(
    { 
      query: debouncedTerm,
      limit: 20
    },
    { skip: debouncedTerm.length < 3 } // Only search if 3+ characters
  );

  return (
    <div className="p-4">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search anime..."
        className="w-full px-4 py-2 border rounded mb-4"
      />

      {isLoading && <LoadingSpinner />}
      {error && <div className="text-red-500">Error: {error.message}</div>}
      
      {data?.data?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.data.map((anime) => (
            <div key={anime.node.id} className="border rounded p-2">
              <img 
                src={anime.node.main_picture?.medium} 
                alt={anime.node.title}
                className="w-full h-48 object-cover rounded mb-2"
              />
              <h3 className="font-semibold truncate">{anime.node.title}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

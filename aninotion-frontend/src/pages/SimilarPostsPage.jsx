import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import PostsContainer from '../components/PostsContainer';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SEO from '../components/SEO';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { recommendationsAPI, postsAPI } from '../services/api';
import { useNavigationStack } from '../contexts/NavigationContext';

const SimilarPostsPage = () => {
  const { postId } = useParams();
  const { navigateBack } = useNavigationStack();
  const [posts, setPosts] = useState([]);
  const [originalPost, setOriginalPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the original post and similar posts in parallel
        const [postResponse, similarResponse] = await Promise.all([
          postsAPI.getById(postId),
          recommendationsAPI.getSimilarPosts(postId, { 
            limit: 20, 
            minScore: 0.1 
          })
        ]);

        if (postResponse) {
          setOriginalPost(postResponse);
        }

        if (similarResponse && similarResponse.success && similarResponse.data) {
          setPosts(similarResponse.data);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error('Error fetching similar posts:', err);
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchData();
    }
  }, [postId]);

  const handleBackClick = () => {
    navigateBack();
  };

  return (
    <div>
      {/* SEO */}
      <SEO 
        title={originalPost ? `Similar to: ${originalPost.title} - AniNotion` : 'Similar Posts - AniNotion'}
        description={originalPost ? `Discover posts similar to "${originalPost.title}"` : 'Discover similar anime posts and recommendations'}
        url={`/post/${postId}/similar`}
        type="website"
      />

      {/* Header */}
      <div className="mb-6">
        {/* Back Button */}
        <button
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Post</span>
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3">
          <Sparkles className="text-primary" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Similar Posts</h1>
            {originalPost && (
              <p className="text-gray-600 mt-1">
                Posts similar to: <span className="font-medium">{originalPost.title}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner type="shimmer" count={8} />
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Sparkles className="text-gray-300 mx-auto mb-4" size={64} />
          <p className="text-gray-500 text-lg mb-2">Unable to load similar posts</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Sparkles className="text-gray-300 mx-auto mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Similar Posts Found</h3>
          <p className="text-gray-500 mb-4">We couldn't find any posts similar to this one.</p>
          <button
            onClick={handleBackClick}
            className="btn-primary"
          >
            Back to Post
          </button>
        </div>
      )}

      {/* Posts Grid using existing PostsContainer */}
      {!loading && !error && posts.length > 0 && (
        <>
          {originalPost && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Original Post</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <PostCard post={originalPost} layout="list" />
              </div>
            </div>
          )}
          <div className="mb-4 text-sm text-gray-600">
            Found {posts.length} similar post{posts.length !== 1 ? 's' : ''}
          </div>
          <PostsContainer
            posts={posts}
            emptyMessage="No similar posts available."
          />
        </>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default SimilarPostsPage;

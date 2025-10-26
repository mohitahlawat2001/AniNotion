import { useState, useEffect } from 'react';
import { recommendationsAPI } from '../services/api';
import { Sparkles } from 'lucide-react';
import RightSidebar from './RightSidebar';

/**
 * SimilarPostsSidebar Component
 *
 * Sidebar showing similar posts to a given post
 * Can be used on post detail pages
 * Uses the RightSidebar template
 */
const SimilarPostsSidebar = ({
  postId,
  limit = 5,
  className = ''
}) => {
  const [similarPosts, setSimilarPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const fetchSimilarPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await recommendationsAPI.getSimilarPosts(postId, {
          limit
        });

        if (response && response.success && response.data) {
          setSimilarPosts(response.data);
        } else {
          setSimilarPosts([]);
        }
      } catch (err) {
        console.error('Error fetching similar posts:', err);
        setError(err.message);
        setSimilarPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarPosts();
  }, [postId, limit]);

  // Badge configuration for similar posts (simple numbers)
  const similarBadgeConfig = (index) => {
    return {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      content: index + 1
    };
  };

  return (
    <RightSidebar
      title="Similar Posts"
      icon={Sparkles}
      iconColor="text-purple-500"
      badgeConfig={similarBadgeConfig}
      items={similarPosts}
      loading={loading}
      error={error}
      emptyMessage="No similar posts found"
      viewMoreLink={postId ? `/post/${postId}/similar` : null}
      viewMoreText="View all similar posts"
      className={className}
    />
  );
};

export default SimilarPostsSidebar;

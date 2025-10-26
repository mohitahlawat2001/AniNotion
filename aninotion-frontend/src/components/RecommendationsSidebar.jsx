import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { recommendationsAPI } from '../services/api';
import { Sparkles } from 'lucide-react';
import RightSidebar from './RightSidebar';

/**
 * RecommendationsSidebar Component
 *
 * Sidebar showing personalized recommendations
 * Only displays if user is authenticated
 * Placed below the trending sidebar
 * Uses the RightSidebar template
 */
const RecommendationsSidebar = ({
  limit = 5,
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // For demo purposes, fetch trending posts and use different slice
        // In a real app, this would use actual personalized recommendation API
        const response = await recommendationsAPI.getTrending({
          limit: limit + 5,
          timeframe: 7
        });

        if (response && response.success && response.data) {
          // Use a different slice than trending sidebar
          setRecommendations(response.data.slice(5, 5 + limit));
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.message);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [limit, isAuthenticated]);

  // Badge configuration for recommendations (sparkle icons)
  const recommendationsBadgeConfig = () => {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      content: <Sparkles size={12} />
    };
  };

  // Don't render sidebar if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <RightSidebar
      title="Recommended For You"
      icon={Sparkles}
      iconColor="text-blue-500"
      badgeConfig={recommendationsBadgeConfig}
      items={recommendations}
      loading={loading}
      error={error}
      emptyMessage="No recommendations yet"
      viewMoreLink="/recommendations"
      viewMoreText="Show more"
      className={className}
    />
  );
};

export default RecommendationsSidebar;
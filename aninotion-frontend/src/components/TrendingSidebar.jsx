import { useState, useEffect } from 'react';
import { recommendationsAPI } from '../services/api';
import { Flame, TrendingUp } from 'lucide-react';
import RightSidebar from './RightSidebar';

/**
 * TrendingSidebar Component
 *
 * Twitter-style trending sidebar for desktop view
 * Shows compact trending posts on the right side
 * Uses the RightSidebar template
 * 
 * Can show global trending or category-specific trending
 */
const TrendingSidebar = ({
  limit = 5,
  timeframe = 7,
  categoryId = null, // Optional: filter by category
  viewMoreLink = null, // Optional: custom link for "Show more" button
  className = ''
}) => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch category-specific or global trending
        const response = categoryId 
          ? await recommendationsAPI.getTrendingByCategory(categoryId, { limit, timeframe })
          : await recommendationsAPI.getTrending({ limit, timeframe });

        if (response && response.success && response.data) {
          setTrending(response.data);
        } else {
          setTrending([]);
        }
      } catch (err) {
        console.error('Error fetching trending posts:', err);
        setError(err.message);
        setTrending([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [limit, timeframe, categoryId]);

  // Badge configuration for trending (top 3 get special colors + icon)
  const trendingBadgeConfig = (index) => {
    if (index === 0) return { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-700', 
      content: index + 1,
      showIcon: true
    };
    if (index === 1) return { 
      bg: 'bg-gray-100', 
      text: 'text-gray-700', 
      content: index + 1,
      showIcon: true
    };
    if (index === 2) return { 
      bg: 'bg-orange-100', 
      text: 'text-orange-700', 
      content: index + 1,
      showIcon: true
    };
    return { 
      bg: 'bg-gray-50', 
      text: 'text-gray-600', 
      content: index + 1,
      showIcon: false
    };
  };

  return (
    <RightSidebar
      title="Trending"
      icon={Flame}
      iconColor="text-orange-500"
      badgeConfig={trendingBadgeConfig}
      items={trending}
      loading={loading}
      error={error}
      emptyMessage="No trending posts yet"
      viewMoreLink={viewMoreLink || "/trending"}
      viewMoreText="Show more"
      className={className}
    />
  );
};

export default TrendingSidebar;

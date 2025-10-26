import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import PageWithSidebar from '../components/PageWithSidebar';
import RecommendationsSidebar from '../components/RecommendationsSidebar';
import { recommendationsAPI } from '../services/api';

const TrendingPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await recommendationsAPI.getTrending({ 
          limit: 20, 
          timeframe: 7 
        });

        if (response && response.success && response.data) {
          setPosts(response.data);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error('Error fetching trending posts:', err);
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <PageWithSidebar
      pageTitle="Trending This Week"
      pageDescription="Most popular posts based on views, likes, and engagement"
      seoTitle="Trending Posts - AniNotion"
      seoDescription="Discover the most popular and trending anime posts, reviews, and discussions this week."
      seoUrl="/trending"
      icon={Flame}
      iconColor="text-orange-500"
      posts={posts}
      loading={loading}
      error={error}
      emptyMessage="No trending posts available right now."
      sidebar={<RecommendationsSidebar limit={5} />}
      showBackButton={true}
      backButtonText="Back"
    />
  );
};

export default TrendingPage;

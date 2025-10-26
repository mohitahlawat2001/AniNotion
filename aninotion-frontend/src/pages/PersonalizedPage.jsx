import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import PageWithSidebar from '../components/PageWithSidebar';
import TrendingSidebar from '../components/TrendingSidebar';
import { recommendationsAPI } from '../services/api';

const PersonalizedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For demo, use trending as personalized recommendations
        // In production, this would call a real personalized recommendation API
        const response = await recommendationsAPI.getTrending({ 
          limit: 20, 
          timeframe: 7 
        });

        if (response && response.success && response.data) {
          // Slice to get different posts than the trending page
          setPosts(response.data.slice(5, 25));
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <PageWithSidebar
      pageTitle="Recommended For You"
      pageDescription="Personalized anime content based on your interests and activity"
      seoTitle="Personalized Recommendations - AniNotion"
      seoDescription="Discover anime posts, reviews, and discussions tailored to your interests."
      seoUrl="/recommendations"
      icon={Sparkles}
      iconColor="text-blue-500"
      posts={posts}
      loading={loading}
      error={error}
      emptyMessage="No recommendations available yet. Start exploring content to get personalized suggestions!"
      sidebar={<TrendingSidebar limit={5} timeframe={7} />}
      showBackButton={true}
      backButtonText="Back"
    />
  );
};

export default PersonalizedPage;

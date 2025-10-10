import React, { useState } from 'react';
import AnimeSearch from '../components/AnimeSearch';
import AnimeGrid from '../components/AnimeGrid';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { 
  useTopRatedAnime, 
  useCurrentlyAiringAnime, 
  useCurrentSeasonAnime,
  useAnimeAPIHealth 
} from '../hooks/useAnime';

const AnimePage = () => {
  const [activeTab, setActiveTab] = useState('search');
  
  // API Health Check
  const { isHealthy, loading: healthLoading, error: healthError } = useAnimeAPIHealth();
  
  // Different anime lists
  const { 
    data: topRated, 
    loading: topRatedLoading, 
    error: topRatedError,
    hasMore: topRatedHasMore,
    loadMore: loadMoreTopRated 
  } = useTopRatedAnime(activeTab === 'top-rated');
  
  const { 
    data: currentlyAiring, 
    loading: airingLoading, 
    error: airingError,
    hasMore: airingHasMore,
    loadMore: loadMoreAiring 
  } = useCurrentlyAiringAnime(activeTab === 'currently-airing');
  
  const { 
    data: currentSeason, 
    loading: seasonLoading, 
    error: seasonError,
    hasMore: seasonHasMore,
    loadMore: loadMoreSeason,
    seasonInfo 
  } = useCurrentSeasonAnime(activeTab === 'current-season');

  const tabs = [
    { id: 'search', label: 'Search Anime', icon: '🔍' },
    { id: 'top-rated', label: 'Top Rated', icon: '⭐' },
    { id: 'currently-airing', label: 'Currently Airing', icon: '📺' },
    { id: 'current-season', label: 'Current Season', icon: '📅' }
  ];

  const handleAnimeSelect = (anime) => {
    const animeData = anime?.node || anime;
    if (animeData?.id) {
      // Navigate to anime details page or handle selection
      console.log('Selected anime:', animeData);
      // navigate(`/anime/${animeData.id}`);
      
      // For now, just show an alert
      alert(`Selected: ${animeData.title}`);
    }
  };

  const generateAnimeLink = (anime) => {
    const animeData = anime?.node || anime;
    return animeData?.id ? `/anime/${animeData.id}` : null;
  };

  // API Health Status Component
  const APIHealthStatus = () => {
    if (healthLoading) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-800 text-sm">Checking MyAnimeList API connection...</span>
          </div>
        </div>
      );
    }

    if (healthError || !isHealthy) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 text-sm">
              MyAnimeList API connection failed: {healthError || 'Service unavailable'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800 text-sm">MyAnimeList API connection healthy</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Anime Database</h1>
        <p className="text-gray-600">
          Discover, search, and explore anime powered by MyAnimeList
        </p>
      </div>

      {/* API Health Status */}
      <APIHealthStatus />

      {/* Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'search' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Anime</h2>
            <AnimeSearch
              onAnimeSelect={handleAnimeSelect}
              generateLinkTo={generateAnimeLink}
              placeholder="Search for anime by title..."
            />
          </div>
        )}

        {activeTab === 'top-rated' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Rated Anime</h2>
            <AnimeGrid
              animes={topRated}
              loading={topRatedLoading}
              error={topRatedError}
              hasMore={topRatedHasMore}
              onLoadMore={loadMoreTopRated}
              onAnimeClick={handleAnimeSelect}
              showRank={true}
              generateLinkTo={generateAnimeLink}
              emptyMessage="No top rated anime available"
            />
          </div>
        )}

        {activeTab === 'currently-airing' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Currently Airing Anime</h2>
            <AnimeGrid
              animes={currentlyAiring}
              loading={airingLoading}
              error={airingError}
              hasMore={airingHasMore}
              onLoadMore={loadMoreAiring}
              onAnimeClick={handleAnimeSelect}
              showRank={true}
              generateLinkTo={generateAnimeLink}
              emptyMessage="No currently airing anime available"
            />
          </div>
        )}

        {activeTab === 'current-season' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Current Season Anime</h2>
              {seasonInfo && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {seasonInfo.season} {seasonInfo.year}
                </div>
              )}
            </div>
            <AnimeGrid
              animes={currentSeason}
              loading={seasonLoading}
              error={seasonError}
              hasMore={seasonHasMore}
              onLoadMore={loadMoreSeason}
              onAnimeClick={handleAnimeSelect}
              generateLinkTo={generateAnimeLink}
              emptyMessage="No current season anime available"
            />
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default AnimePage;

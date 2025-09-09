import React from 'react';
import AnimeCard from './AnimeCard';
import LoadingSpinner from './LoadingSpinner';

const AnimeGrid = ({ 
  animes = [], 
  loading = false, 
  error = null, 
  hasMore = false,
  onLoadMore = null,
  onAnimeClick = null,
  showRank = false,
  showScore = true,
  emptyMessage = "No anime found",
  className = '',
  generateLinkTo = null // Function to generate link for each anime
}) => {
  const handleAnimeClick = (anime) => {
    if (onAnimeClick) {
      onAnimeClick(anime);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">Error loading anime</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!loading && animes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6z" />
          </svg>
          <p className="text-xl font-medium text-gray-700">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Anime Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {animes.map((anime, index) => {
          const animeData = anime?.node || anime;
          const key = animeData?.id || index;
          
          return (
            <AnimeCard
              key={key}
              anime={anime}
              showRank={showRank}
              showScore={showScore}
              onClick={() => handleAnimeClick(anime)}
              linkTo={generateLinkTo ? generateLinkTo(anime) : null}
            />
          );
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && onLoadMore && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Load More Anime
          </button>
        </div>
      )}

      {/* End of Results Message */}
      {!loading && !hasMore && animes.length > 0 && (
        <div className="text-center py-6 text-gray-500">
          <p>You've reached the end of the results</p>
        </div>
      )}
    </div>
  );
};

export default AnimeGrid;

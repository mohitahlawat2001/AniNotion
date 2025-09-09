import React, { useState, useEffect } from 'react';
import { useAnimeSearch } from '../hooks/useAnime';
import AnimeGrid from './AnimeGrid';

const AnimeSearch = ({ 
  onAnimeSelect = null,
  showSearchHistory = true,
  maxHistoryItems = 5,
  generateLinkTo = null,
  placeholder = "Search for anime..."
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const { 
    data: animes, 
    loading, 
    error, 
    hasMore, 
    search, 
    loadMore, 
    clearSearch,
    query 
  } = useAnimeSearch();

  // Load search history from localStorage on mount
  useEffect(() => {
    if (showSearchHistory) {
      const savedHistory = localStorage.getItem('animeSearchHistory');
      if (savedHistory) {
        try {
          setSearchHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse search history:', e);
        }
      }
    }
  }, [showSearchHistory]);

  // Save search history to localStorage
  const saveToHistory = (searchTerm) => {
    if (!showSearchHistory || !searchTerm.trim()) return;

    const newHistory = [
      searchTerm.trim(),
      ...searchHistory.filter(item => item !== searchTerm.trim())
    ].slice(0, maxHistoryItems);

    setSearchHistory(newHistory);
    localStorage.setItem('animeSearchHistory', JSON.stringify(newHistory));
  };

  const handleSearch = async (searchTerm = searchInput) => {
    if (!searchTerm.trim()) {
      clearSearch();
      return;
    }

    await search(searchTerm.trim());
    saveToHistory(searchTerm.trim());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleHistoryClick = (historyItem) => {
    setSearchInput(historyItem);
    handleSearch(historyItem);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('animeSearchHistory');
  };

  const handleAnimeClick = (anime) => {
    if (onAnimeSelect) {
      onAnimeSelect(anime);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-12 pr-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
          />
          
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Clear Button */}
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                clearSearch();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={!searchInput.trim() || loading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Search History */}
      {showSearchHistory && searchHistory.length > 0 && !query && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item)}
                className="bg-white hover:bg-blue-50 text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Search Query */}
      {query && (
        <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
          <div>
            <span className="text-sm text-blue-700">
              Showing results for: <span className="font-medium">"{query}"</span>
            </span>
            {animes.length > 0 && (
              <span className="text-sm text-blue-600 ml-2">
                ({animes.length} result{animes.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSearchInput('');
              clearSearch();
            }}
            className="text-blue-700 hover:text-blue-900 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Results */}
      <AnimeGrid
        animes={animes}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onAnimeClick={handleAnimeClick}
        generateLinkTo={generateLinkTo}
        emptyMessage={query ? `No anime found for "${query}"` : "Start typing to search for anime"}
      />
    </div>
  );
};

export default AnimeSearch;

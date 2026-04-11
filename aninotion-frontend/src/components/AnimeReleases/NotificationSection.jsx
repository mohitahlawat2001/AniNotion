import React, { useState, useEffect } from 'react';
import { Bell, Filter } from 'lucide-react';
import AnimeReleaseCard from './AnimeReleaseCard';
import animeReleaseService from '../../services/animeReleaseService';

const NotificationSection = ({ currentUserId }) => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ unseenCount: 0, total: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [showNewOnly, setShowNewOnly] = useState(false);

  // Fetch releases
  const fetchReleases = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (showNewOnly && currentUserId) {
        response = await animeReleaseService.getUnseenReleases(currentUserId, {
          page,
          limit: pagination.limit
        });
      } else {
        response = await animeReleaseService.getAnimeReleases({
          page,
          limit: pagination.limit,
          isNew: showNewOnly || undefined
        });
      }

      if (response.success) {
        setReleases(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError('Failed to load anime releases. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await animeReleaseService.getStats(currentUserId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReleases(1);
    fetchStats();
  }, [showNewOnly, currentUserId]);

  // Handle mark as seen
  const handleMarkAsSeen = async (releaseIds) => {
    if (!currentUserId) return;

    try {
      await animeReleaseService.markAsSeen(releaseIds, currentUserId);
      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Error marking as seen:', err);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchReleases(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Latest Anime Releases
            </h1>
            <p className="text-gray-600 mt-2">
              Discover the newest anime episodes and series
            </p>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewOnly(!showNewOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showNewOnly
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              {showNewOnly ? 'All Releases' : 'New Only'}
            </button>
          </div>
        </div>

        {/* Stats Badge */}
        {stats.unseenCount > 0 && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600 animate-bounce" />
              <p className="text-blue-800 font-medium">
                You have <span className="font-bold">{stats.unseenCount}</span> unseen anime release{stats.unseenCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading anime releases...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Releases Grid */}
      {!loading && !error && (
        <>
          {releases.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {releases.map((release) => (
                  <AnimeReleaseCard
                    key={release._id}
                    release={release}
                    onMarkAsSeen={handleMarkAsSeen}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    {/* First Page */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        pagination.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                      title="First Page"
                    >
                      «
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        pagination.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Previous Page"
                    >
                      ‹ Previous
                    </button>

                    {/* Current Page */}
                    <span className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md">
                      {pagination.page}
                    </span>

                    {/* Next Page */}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasMore}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        !pagination.hasMore
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Next Page"
                    >
                      Next ›
                    </button>

                    {/* Last Page */}
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={!pagination.hasMore}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        !pagination.hasMore
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Last Page"
                    >
                      »
                    </button>
                  </div>

                  {/* Pagination Info */}
                  <p className="text-sm text-gray-600">
                    Page <span className="font-semibold">{pagination.page}</span> of{' '}
                    <span className="font-semibold">{pagination.totalPages}</span> •{' '}
                    <span className="font-semibold">{pagination.total}</span> total releases
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <Bell className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No releases found</h3>
              <p className="text-gray-600">
                {showNewOnly 
                  ? "You've seen all the new releases! Check back later for more." 
                  : "No anime releases available at the moment. Check back later!"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationSection;

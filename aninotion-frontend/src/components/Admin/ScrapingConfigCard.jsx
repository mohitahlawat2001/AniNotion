import React from 'react';

const ScrapingConfigCard = ({ config, onEdit, onDelete, onToggle, onTest, onScrape }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-800">{config.name}</h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {config.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{config.sourceWebsite}</p>
        </div>
        
        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.isActive}
            onChange={() => onToggle(config._id)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* URL */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Source URL</p>
        <p className="text-sm text-gray-700 break-all">{config.sourceUrl}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
        <div>
          <p className="text-xs text-gray-500">Interval</p>
          <p className="text-sm font-medium">{config.scrapeIntervalHours}h</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Max Items</p>
          <p className="text-sm font-medium">{config.maxReleasesToScrape}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Fetched</p>
          <p className="text-sm font-medium text-blue-600">{config.totalReleasesFetched || 0}</p>
        </div>
      </div>

      {/* Last Scrape Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Last Scrape:</span>
          <span className="text-gray-700">{formatDate(config.lastScrapedAt)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-500">Status:</span>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(config.lastScrapeStatus)}`}>
            {config.lastScrapeStatus}
          </span>
        </div>
        {config.lastScrapeError && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            Error: {config.lastScrapeError}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTest(config._id)}
          className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
        >
          🧪 Test
        </button>
        <button
          onClick={() => onScrape(config._id)}
          disabled={!config.isActive}
          className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
            config.isActive
              ? 'text-green-600 bg-green-50 hover:bg-green-100'
              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }`}
        >
          ▶️ Scrape
        </button>
        <button
          onClick={() => onEdit(config)}
          className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onDelete(config._id)}
          className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default ScrapingConfigCard;

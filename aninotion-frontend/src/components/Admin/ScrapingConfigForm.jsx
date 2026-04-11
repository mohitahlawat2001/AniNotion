import React, { useState } from 'react';

const ScrapingConfigForm = ({ config, onSubmit, onCancel, currentUserId }) => {
  const [formData, setFormData] = useState(config || {
    name: '',
    sourceWebsite: 'animepahe',
    sourceUrl: '',
    selectors: {
      episodeWrap: '.episode-wrap',
      dataId: 'data-id',
      thumbnail: '.episode-snapshot img',
      watchLink: 'a.play',
      animeName: '.episode-title a',
      animePageUrl: '.episode-title a',
      episodeNumber: '.episode-number',
      isComplete: '.episode-number.text-success'
    },
    maxReleasesToScrape: 50,
    requestDelayMs: 2000,
    scrapeIntervalHours: 6,
    isActive: true,
    useProxy: false,
    proxyUrl: '',
    enablePagination: false,
    maxPagesToScrape: 1,
    paginationConfig: {
      autoDetect: true,
      urlPattern: '?page={page}',
      nextLinkSelectors: ['a.next-page', 'a[rel="next"]'],
      pageAttributeSelector: '[data-page]',
      containerSelector: '.pagination'
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPagination, setShowPagination] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectorChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      selectors: {
        ...prev.selectors,
        [name]: value
      }
    }));
  };

  const handlePaginationConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      paginationConfig: {
        ...prev.paginationConfig,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleNextLinkSelectorsChange = (value) => {
    const selectors = value.split(',').map(s => s.trim()).filter(s => s);
    setFormData(prev => ({
      ...prev,
      paginationConfig: {
        ...prev.paginationConfig,
        nextLinkSelectors: selectors
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      createdBy: currentUserId,
      updatedBy: currentUserId
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Configuration Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., AnimePahe Latest Releases"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Website *
              </label>
              <select
                name="sourceWebsite"
                value={formData.sourceWebsite}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="animepahe">AnimePahe</option>
                <option value="gogoanime">GogoAnime</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <label className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source URL *
            </label>
            <input
              type="url"
              name="sourceUrl"
              value={formData.sourceUrl}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://animepahe.com"
            />
          </div>
        </div>
      </div>

      {/* Scraping Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Scraping Settings</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Releases per Scrape
            </label>
            <input
              type="number"
              name="maxReleasesToScrape"
              value={formData.maxReleasesToScrape}
              onChange={handleChange}
              min="1"
              max="200"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Delay (ms)
            </label>
            <input
              type="number"
              name="requestDelayMs"
              value={formData.requestDelayMs}
              onChange={handleChange}
              min="500"
              max="10000"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scrape Interval (hours)
            </label>
            <input
              type="number"
              name="scrapeIntervalHours"
              value={formData.scrapeIntervalHours}
              onChange={handleChange}
              min="1"
              max="24"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* CSS Selectors */}
      <div>
        <h3 className="text-lg font-semibold mb-4">CSS Selectors</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Episode Wrap (container)
            </label>
            <input
              type="text"
              name="episodeWrap"
              value={formData.selectors.episodeWrap}
              onChange={handleSelectorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder=".episode-wrap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data ID Attribute
            </label>
            <input
              type="text"
              name="dataId"
              value={formData.selectors.dataId}
              onChange={handleSelectorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="data-id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail Image
            </label>
            <input
              type="text"
              name="thumbnail"
              value={formData.selectors.thumbnail}
              onChange={handleSelectorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder=".episode-snapshot img"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Watch Link
            </label>
            <input
              type="text"
              name="watchLink"
              value={formData.selectors.watchLink}
              onChange={handleSelectorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="a.play"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anime Name
            </label>
            <input
              type="text"
              name="animeName"
              value={formData.selectors.animeName}
              onChange={handleSelectorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder=".episode-title a"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anime Page URL
            </label>
            <input
              type="text"
              name="animePageUrl"
              value={formData.selectors.animePageUrl}
              onChange={handleSelectorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder=".episode-title a"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Episode Number
            </label>
            <input
              type="text"
              name="episodeNumber"
              value={formData.selectors.episodeNumber}
              onChange={handleSelectorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder=".episode-number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complete Marker
            </label>
            <input
              type="text"
              name="isComplete"
              value={formData.selectors.isComplete}
              onChange={handleSelectorChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder=".episode-number.text-success"
            />
          </div>
        </div>
      </div>

      {/* Pagination Settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowPagination(!showPagination)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          {showPagination ? '▼' : '▶'} Pagination Settings (Multi-Page Scraping)
        </button>

        {showPagination && (
          <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-md">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enablePagination"
                checked={formData.enablePagination}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Enable Multi-Page Scraping</span>
            </label>

            {formData.enablePagination && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Pages to Scrape *
                  </label>
                  <input
                    type="number"
                    name="maxPagesToScrape"
                    value={formData.maxPagesToScrape}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Approx. {formData.maxPagesToScrape} pages × {formData.maxReleasesToScrape} releases = {formData.maxPagesToScrape * formData.maxReleasesToScrape} total items
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Auto-Detection (Recommended)</p>
                  
                  <label className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      name="autoDetect"
                      checked={formData.paginationConfig?.autoDetect}
                      onChange={handlePaginationConfigChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Auto-detect next page links</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Pattern
                    </label>
                    <input
                      type="text"
                      name="urlPattern"
                      value={formData.paginationConfig?.urlPattern || ''}
                      onChange={handlePaginationConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      placeholder="?page={page}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {'{page}'} as placeholder. Example: ?page={'{page}'} or /page/{'{page}'}
                    </p>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Link Selectors (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.paginationConfig?.nextLinkSelectors?.join(', ') || ''}
                      onChange={(e) => handleNextLinkSelectorsChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      placeholder="a.next-page, a[rel=next], .pagination a:contains(Next)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      CSS selectors to find the next page link. Multiple selectors will be tried in order.
                    </p>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pagination Container
                    </label>
                    <input
                      type="text"
                      name="containerSelector"
                      value={formData.paginationConfig?.containerSelector || ''}
                      onChange={handlePaginationConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      placeholder=".pagination"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Container element that holds pagination controls
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Tip:</strong> The scraper will automatically detect pagination patterns. 
                    Configure specific selectors only if auto-detection fails.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings (Proxy)
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="useProxy"
                checked={formData.useProxy}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Use Proxy</span>
            </label>

            {formData.useProxy && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proxy URL
                </label>
                <input
                  type="text"
                  name="proxyUrl"
                  value={formData.proxyUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="http://proxy.example.com:8080"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {config ? 'Update Configuration' : 'Create Configuration'}
        </button>
      </div>
    </form>
  );
};

export default ScrapingConfigForm;

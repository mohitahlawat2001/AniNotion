import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import scrapingConfigService from '../../services/scrapingConfigService';
import ScrapingConfigCard from '../../components/Admin/ScrapingConfigCard';
import ScrapingConfigForm from '../../components/Admin/ScrapingConfigForm';

const ScrapingAdminPage = () => {
  const [configs, setConfigs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Get current user from Auth Context
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [configsRes, statsRes] = await Promise.all([
        scrapingConfigService.getAllConfigs(),
        scrapingConfigService.getStats()
      ]);
      setConfigs(configsRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load scraping configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleCreate = () => {
    setEditingConfig(null);
    setShowForm(true);
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingConfig) {
        await scrapingConfigService.updateConfig(editingConfig._id, formData);
      } else {
        await scrapingConfigService.createConfig(formData);
      }
      setShowForm(false);
      setEditingConfig(null);
      fetchData();
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Failed to save configuration');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConfig(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      await scrapingConfigService.deleteConfig(id);
      fetchData();
    } catch (err) {
      console.error('Error deleting config:', err);
      alert('Failed to delete configuration');
    }
  };

  const handleToggle = async (id) => {
    try {
      await scrapingConfigService.toggleStatus(id);
      fetchData();
    } catch (err) {
      console.error('Error toggling config:', err);
      alert('Failed to toggle configuration status');
    }
  };

  const handleTest = async (id) => {
    try {
      setTestResult({ loading: true, id });
      const result = await scrapingConfigService.testConfig(id);
      setTestResult({ loading: false, id, data: result });
      alert(`Test successful! Found ${result.data.releasesFound} releases.\n\nSample: ${result.data.sampleReleases[0]?.animeName || 'N/A'}`);
    } catch (err) {
      console.error('Error testing config:', err);
      setTestResult({ loading: false, id, error: err.message });
      alert('Test failed: ' + err.message);
    }
  };

  const handleScrape = async (id) => {
    if (!confirm('Trigger manual scrape for this configuration?')) return;
    
    try {
      const result = await scrapingConfigService.triggerScrape(id);
      alert(`Scrape completed!\nSaved: ${result.data.savedCount}\nDuplicates: ${result.data.duplicateCount}`);
      fetchData();
    } catch (err) {
      console.error('Error scraping:', err);
      alert('Scrape failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scraping Administration</h1>
              <p className="text-gray-600 mt-1">Manage anime scraping configurations</p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add New Source
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-500 mb-1">Total Configurations</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalConfigs}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-500 mb-1">Active Sources</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeConfigs}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-500 mb-1">Total Releases Fetched</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalReleasesFetched}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-500 mb-1">Success Rate</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.totalConfigs > 0 
                  ? Math.round((stats.successfulScrapes / stats.totalConfigs) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
                </h2>
                <ScrapingConfigForm
                  config={editingConfig}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>
        )}

        {/* Configurations Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Scraping Configurations ({configs.length})
          </h2>
          
          {configs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg mb-4">No scraping configurations found</p>
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Configuration
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configs.map((config) => (
                <ScrapingConfigCard
                  key={config._id}
                  config={config}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onTest={handleTest}
                  onScrape={handleScrape}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Scrapes Section */}
        {stats?.recentScrapes && stats.recentScrapes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Recent Scrapes</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Scraped
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fetched
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentScrapes.map((scrape) => (
                    <tr key={scrape._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {scrape.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scrape.sourceWebsite}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scrape.lastScrapedAt 
                          ? new Date(scrape.lastScrapedAt).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          scrape.lastScrapeStatus === 'success'
                            ? 'bg-green-100 text-green-800'
                            : scrape.lastScrapeStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {scrape.lastScrapeStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scrape.totalReleasesFetched}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapingAdminPage;

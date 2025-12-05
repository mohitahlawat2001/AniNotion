import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  ArrowLeft,
  RefreshCw,
  Activity,
  FileText,
  MousePointer,
  Layout,
  FolderOpen,
  BookOpen
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';

const AdminAnalyticsPage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsAPI.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDebugData = async () => {
    try {
      const data = await analyticsAPI.getDebug();
      setDebugData(data);
    } catch (err) {
      console.error('Error fetching debug data:', err);
      setDebugData({ error: err.message });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    if (showDebug) {
      await fetchDebugData();
    }
    setRefreshing(false);
  };

  const toggleDebug = () => {
    const newShowDebug = !showDebug;
    setShowDebug(newShowDebug);
    if (newShowDebug && !debugData) {
      fetchDebugData();
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400">You need admin privileges to view this page.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Analytics</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { realtime, today, topContent, trafficSources, devices, hourlyBreakdown, pageStats, categoryStats, postStats } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Real-time insights and visitor statistics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDebug}
            className={`px-4 py-2 rounded-lg transition-colors ${showDebug ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="mb-8 p-4 bg-gray-800 rounded-xl border border-yellow-500/30">
          <h2 className="text-xl font-semibold mb-4 text-yellow-500">🔧 Debug Info</h2>
          {debugData ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Table Counts:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {debugData.tableCounts && Object.entries(debugData.tableCounts).map(([table, count]) => (
                    <div key={table} className="bg-gray-700 p-2 rounded">
                      <span className="text-xs text-gray-400">{table}</span>
                      <div className="text-lg font-bold">{typeof count === 'number' ? count : count}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Visitors:</h3>
                <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugData.recentVisitors, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Visits:</h3>
                <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugData.recentVisits, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Activity:</h3>
                <pre className="text-xs bg-gray-700 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugData.recentActivity, null, 2)}
                </pre>
              </div>
              <div className="pt-4 border-t border-gray-700 flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await analyticsAPI.cleanupRealtime();
                      alert('Cleanup completed! Old sessions expired.');
                      fetchDebugData();
                      fetchDashboardData();
                    } catch (err) {
                      alert('Cleanup failed: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm"
                >
                  🧹 Cleanup Old Sessions
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('⚠️ This will DELETE all analytics data and reset the tables. Are you sure?')) {
                      try {
                        await analyticsAPI.resetTables();
                        alert('Tables reset successfully!');
                        fetchDebugData();
                        fetchDashboardData();
                      } catch (err) {
                        alert('Reset failed: ' + err.message);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  ⚠️ Reset All Tables
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Loading debug data...</p>
          )}
        </div>
      )}

      {/* Real-time Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Real-time Activity
          <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full animate-pulse">
            LIVE
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Visitors"
            value={realtime?.counts?.active_visitors || 0}
            icon={Users}
            color="green"
            subtitle="Last 5 minutes"
          />
          <StatCard
            title="Total Activities"
            value={realtime?.counts?.total_activities || 0}
            icon={MousePointer}
            color="blue"
            subtitle="Recent actions"
          />
          <StatCard
            title="Page Views Today"
            value={today?.total_page_views || 0}
            icon={Eye}
            color="purple"
            subtitle="Since midnight"
          />
          <StatCard
            title="Unique Visitors"
            value={today?.total_visitors || 0}
            icon={Users}
            color="orange"
            subtitle="Today"
          />
        </div>
      </div>

      {/* Today's Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Today's Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Authenticated Users"
            value={today?.authenticated_visitors || 0}
            icon={Users}
            color="blue"
            subtitle="Logged in visitors"
          />
          <StatCard
            title="Anonymous Visitors"
            value={today?.anonymous_visitors || 0}
            icon={Globe}
            color="gray"
            subtitle="Not logged in"
          />
          <StatCard
            title="Total Sessions"
            value={today?.total_sessions || 0}
            icon={Clock}
            color="purple"
            subtitle="Browsing sessions"
          />
          <StatCard
            title="Bounce Rate"
            value={`${(today?.bounce_rate || 0).toFixed(1)}%`}
            icon={TrendingUp}
            color={today?.bounce_rate > 50 ? 'red' : 'green'}
            subtitle={today?.bounce_rate > 50 ? 'Needs improvement' : 'Good engagement'}
          />
        </div>
      </div>

      {/* Page, Category & Post Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Page Stats */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-500" />
            Page Views
          </h3>
          {pageStats && pageStats.length > 0 ? (
            <div className="space-y-3">
              {pageStats.map((page, index) => (
                <div 
                  key={page.page_name || index}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-mono text-sm w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium capitalize">
                        {page.page_name?.replace(/_/g, ' ') || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400">{page.unique_visitors || 0} unique</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-400">{page.total_views || 0}</p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No page data yet</p>
          )}
        </div>

        {/* Category Stats */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-green-500" />
            Category Views
          </h3>
          {categoryStats && categoryStats.length > 0 ? (
            <div className="space-y-3">
              {categoryStats.map((cat, index) => (
                <div 
                  key={cat.category_id || index}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-mono text-sm w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium truncate max-w-[120px]">
                        {cat.category_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400">{cat.unique_visitors || 0} unique</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">{cat.total_views || 0}</p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No category data yet</p>
          )}
        </div>

        {/* Post Stats */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Top Posts
          </h3>
          {postStats && postStats.length > 0 ? (
            <div className="space-y-3">
              {postStats.map((post, index) => (
                <div 
                  key={post.post_id || index}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-mono text-sm w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium truncate max-w-[120px]" title={post.post_title}>
                        {post.post_title || 'Untitled'}
                      </p>
                      <p className="text-xs text-gray-400">{post.category_name || 'No category'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-400">{post.total_views || 0}</p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No post data yet</p>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Content */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-500" />
            Top Content
          </h3>
          {topContent && topContent.length > 0 ? (
            <div className="space-y-3">
              {topContent.slice(0, 10).map((content, index) => (
                <div 
                  key={content.mongo_id || index}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-mono text-sm w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">
                        {content.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{content.content_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-400">{content.views || 0}</p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No content data available</p>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            Traffic Sources
          </h3>
          {trafficSources && trafficSources.length > 0 ? (
            <div className="space-y-3">
              {trafficSources.map((source, index) => {
                const total = trafficSources.reduce((sum, s) => sum + parseInt(s.visits || 0), 0);
                const percentage = total > 0 ? ((source.visits / total) * 100).toFixed(1) : 0;
                return (
                  <div key={source.referrer_type || index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{source.referrer_type || 'Unknown'}</span>
                      <span className="text-gray-400">{source.visits} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No traffic data available</p>
          )}
        </div>
      </div>

      {/* Device Breakdown & Hourly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Device Breakdown */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-purple-500" />
            Device Breakdown
          </h3>
          {devices && devices.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {devices.map((device, index) => {
                const IconComponent = 
                  device.device_type === 'mobile' ? Smartphone :
                  device.device_type === 'tablet' ? Tablet : Monitor;
                const total = devices.reduce((sum, d) => sum + parseInt(d.visits || 0), 0);
                const percentage = total > 0 ? ((device.visits / total) * 100).toFixed(0) : 0;
                
                return (
                  <div 
                    key={device.device_type || index}
                    className="text-center p-4 bg-gray-700/50 rounded-lg"
                  >
                    <IconComponent className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <p className="text-2xl font-bold">{percentage}%</p>
                    <p className="text-sm text-gray-400 capitalize">{device.device_type || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{device.visits} visits</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No device data available</p>
          )}
        </div>

        {/* Hourly Activity Chart */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Hourly Activity (Today)
          </h3>
          {hourlyBreakdown && hourlyBreakdown.length > 0 ? (
            <div className="flex items-end justify-between h-40 gap-1">
              {hourlyBreakdown.map((hour, index) => {
                const maxVisits = Math.max(...hourlyBreakdown.map(h => h.visits || 0));
                const height = maxVisits > 0 ? ((hour.visits || 0) / maxVisits) * 100 : 0;
                const isCurrentHour = new Date().getHours() === index;
                
                return (
                  <div 
                    key={index}
                    className="flex-1 flex flex-col items-center group"
                  >
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isCurrentHour ? 'bg-orange-500' : 'bg-blue-500/70 hover:bg-blue-500'
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${index}:00 - ${hour.visits || 0} visits`}
                    />
                    {index % 4 === 0 && (
                      <span className="text-xs text-gray-500 mt-1">{index}h</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hourly data available</p>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      {realtime?.activities && realtime.activities.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Recent Activity
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {realtime.activities.slice(0, 15).map((activity, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${activity.is_authenticated ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-gray-300">
                    {activity.is_authenticated ? 'User' : 'Visitor'} viewed
                  </span>
                  <span className="text-blue-400 truncate max-w-[200px]">
                    {activity.content_title || activity.path?.split('/').pop() || 'page'}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(activity.activity_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        Last updated: {dashboardData?.generatedAt ? new Date(dashboardData.generatedAt).toLocaleString() : 'Unknown'}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className="text-sm font-medium">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

export default AdminAnalyticsPage;

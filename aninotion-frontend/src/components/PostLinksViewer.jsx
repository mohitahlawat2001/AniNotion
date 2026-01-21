import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { postLinksAPI } from '../services/api';

const PostLinksViewer = ({ postId }) => {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'anime',
    platform: ''
  });

  useEffect(() => {
    fetchLinks();
  }, [postId]);

  const fetchLinks = async () => {
    try {
      const data = await postLinksAPI.getByPost(postId);
      setLinks(data);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to add links');
      return;
    }

    try {
      if (editingLink) {
        await postLinksAPI.update(editingLink._id, formData);
      } else {
        await postLinksAPI.create({ ...formData, postId });
      }
      
      await fetchLinks();
      setShowAddForm(false);
      setEditingLink(null);
      setFormData({ title: '', url: '', type: 'anime', platform: '' });
    } catch (error) {
      console.error('Error saving link:', error);
      alert(error.message || 'Failed to save link');
    }
  };

  const handleDelete = async (linkId) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      await postLinksAPI.delete(linkId);
      await fetchLinks();
      if (activeTab >= links.length - 1 && activeTab > 0) {
        setActiveTab(activeTab - 1);
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert(error.message || 'Failed to delete link');
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      type: link.type,
      platform: link.platform || ''
    });
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingLink(null);
    setFormData({ title: '', url: '', type: 'anime', platform: '' });
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Watch/Read Links</h3>
        {user && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6 bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">
              {editingLink ? 'Edit Link' : 'Add New Link'}
            </h4>
            <button
              onClick={cancelForm}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g., Watch on Crunchyroll"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="https://..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="anime">Anime</option>
                  <option value="manga">Manga</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Crunchyroll"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                {editingLink ? 'Update Link' : 'Add Link'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {links.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <ExternalLink className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No links available yet</p>
          {user && (
            <p className="text-sm mt-2">Be the first to add a link!</p>
          )}
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-700">
            {links.map((link, index) => (
              <button
                key={link._id}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === index
                    ? 'bg-slate-700 text-white border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {link.title}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          {links[activeTab] && (
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {links[activeTab].title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300 mb-3">
                      <span className="px-2 py-1 bg-slate-800 rounded capitalize">
                        {links[activeTab].type}
                      </span>
                      {links[activeTab].platform && (
                        <span className="px-2 py-1 bg-slate-800 rounded">
                          {links[activeTab].platform}
                        </span>
                      )}
                      {links[activeTab].createdBy && (
                        <span className="text-slate-400">
                          Added by {links[activeTab].createdBy.displayName || links[activeTab].createdBy.username}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={links[activeTab].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Link
                      </a>
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Show Preview
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {user && user.id === links[activeTab].createdBy?._id && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(links[activeTab])}
                        className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                        title="Edit link"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(links[activeTab]._id)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-400 break-all">
                  {links[activeTab].url}
                </div>
                
                {/* Link Preview */}
                {showPreview && (
                  <div className="mt-4">
                    <div className="relative w-full bg-slate-800 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                      <iframe
                        src={links[activeTab].url}
                        className="w-full h-full border-0"
                        title={`Preview of ${links[activeTab].title}`}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div 
                        className="hidden absolute inset-0 items-center justify-center bg-slate-800 text-slate-400 text-center p-8"
                      >
                        <div>
                          <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg mb-2">Preview not available</p>
                          <p className="text-sm">This website doesn't allow embedding. Click "Open Link" to view it in a new tab.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostLinksViewer;

import React, { useState } from 'react';
import { NotificationSection } from '../components/AnimeReleases';
import { useAuth } from '../hooks/useAuth';
import { RefreshCw } from 'lucide-react';

const AnimeReleasesPage = () => {
  // Get current user ID from Auth Context
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  // Toggle between old and new schema (for testing/migration)
  const [useNewSchema, setUseNewSchema] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema Toggle (can be removed after full migration) */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Data Source:</span>{' '}
            {useNewSchema ? 'New Schema (Anime + Episodes)' : 'Legacy Schema (AnimeRelease)'}
          </div>
          <button
            onClick={() => setUseNewSchema(!useNewSchema)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            title="Toggle between old and new database schema"
          >
            <RefreshCw className="w-4 h-4" />
            Switch to {useNewSchema ? 'Legacy' : 'New'} Schema
          </button>
        </div>
      </div>

      <NotificationSection 
        currentUserId={currentUserId} 
        useNewSchema={useNewSchema}
      />
    </div>
  );
};

export default AnimeReleasesPage;

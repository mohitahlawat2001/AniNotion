import React from 'react';
import { NotificationSection } from '../components/AnimeReleases';
import { useAuth } from '../hooks/useAuth';

const AnimeReleasesPage = () => {
  // Get current user ID from Auth Context
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationSection currentUserId={currentUserId} />
    </div>
  );
};

export default AnimeReleasesPage;

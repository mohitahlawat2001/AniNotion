import React, { useState, useEffect } from 'react';
import animeReleaseService from '../../services/animeReleaseService';

const NotificationBadge = ({ currentUserId }) => {
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await animeReleaseService.getStats(currentUserId);
        if (response.success) {
          setUnseenCount(response.data.unseenCount);
        }
      } catch (err) {
        console.error('Error fetching notification stats:', err);
      }
    };

    if (currentUserId) {
      fetchStats();
      
      // Refresh stats every 5 minutes
      const interval = setInterval(fetchStats, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

  if (!unseenCount || unseenCount === 0) return null;

  return (
    <span className="notification-badge inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
      {unseenCount > 99 ? '99+' : unseenCount}
    </span>
  );
};

export default NotificationBadge;

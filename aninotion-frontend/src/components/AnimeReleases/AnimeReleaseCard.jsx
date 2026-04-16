import React from 'react';
import { ExternalLink, Play, Calendar, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnimeReleaseCard = ({ release, onMarkAsSeen, currentUserId }) => {
  const navigate = useNavigate();
  
  const handleWatch = () => {
    // Mark as seen when user clicks watch
    if (currentUserId && onMarkAsSeen) {
      onMarkAsSeen([release._id]);
    }
  };

  const handleAnimeClick = (e) => {
    e.stopPropagation();
    // Navigate to anime detail page
    navigate(`/anime/${encodeURIComponent(release.animeName)}`);
  };

  // Format release date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Thumbnail Image */}
      <div className="relative group">
        <img 
          src={release.thumbnailUrl} 
          alt={release.title}
          className="w-full h-56 object-cover"
          loading="lazy"
        />
        
        {/* Overlay with Play Button */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100">
            <Play className="w-16 h-16 text-white fill-white" />
          </div>
        </div>

        {/* New Badge */}
        {release.isNew && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg animate-pulse">
              NEW
            </span>
          </div>
        )}

        {/* Complete Badge */}
        {release.isComplete && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-green-500 rounded-full shadow-lg">
              ✓ Complete
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Anime Title - Clickable */}
        <button
          onClick={handleAnimeClick}
          className="w-full text-left group-anime mb-2"
        >
          <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 min-h-[3rem] hover:text-primary transition-colors cursor-pointer" title={release.animeName}>
            {release.animeName}
            <Info className="w-3 h-3 inline-block ml-1 opacity-0 group-anime-hover:opacity-100 transition-opacity" />
          </h3>
        </button>

        {/* Episode Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            {release.episodeNumber ? (
              <span className="font-medium">Episode {release.episodeNumber}</span>
            ) : (
              <span className="font-medium">Movie/OVA</span>
            )}
          </div>
          
          {/* Release Time */}
          {release.releaseDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(release.releaseDate)}
            </div>
          )}
        </div>

        {/* Source Website Badge */}
        {release.sourceWebsite && (
          <div className="mb-3">
            <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
              {release.sourceWebsite}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Watch Button */}
          <a 
            href={release.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWatch}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
          >
            <Play className="w-4 h-4" />
            Watch
          </a>

          {/* Anime Info Button */}
          <button
            onClick={handleAnimeClick}
            className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors duration-200"
            title="View all episodes for this anime"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimeReleaseCard;

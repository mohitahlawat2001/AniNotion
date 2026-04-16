import React from 'react';
import { ExternalLink, Play, Calendar, Tv, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Episode Card Component (New Schema)
 * Displays episode information with anime reference
 * UPDATED: Links to episode detail page for multi-source viewing
 */
const EpisodeCard = ({ episode, onMarkAsSeen, currentUserId }) => {
  const navigate = useNavigate();
  
  // episode.anime is populated with { name, slug, coverImage, status }
  const animeName = episode.anime?.name || 'Unknown Anime';
  const animeSlug = episode.anime?.slug;
  const animeCover = episode.anime?.coverImage;
  
  const handleWatch = (watchUrl) => {
    // Mark as seen when user clicks watch
    if (currentUserId && onMarkAsSeen) {
      onMarkAsSeen(episode._id);
    }
    
    // Open in new tab
    window.open(watchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAnimeClick = (e) => {
    e.stopPropagation();
    // Navigate to anime detail page
    navigate(`/anime/${encodeURIComponent(animeName)}`);
  };

  const handleEpisodeClick = () => {
    // Navigate to episode detail page to view all sources
    navigate(`/anime/${encodeURIComponent(animeName)}/episode/${episode.episodeNumber}`);
  };

  // Format release date
  const formatDate = (dateString) => {
    if (!dateString) return '';
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

  // Get primary watch URL
  const primaryWatchUrl = episode.primarySource?.watchUrl;
  const primaryWebsite = episode.primarySource?.website;
  
  // Check if there are multiple sources
  const hasMultipleSources = episode.additionalSources && episode.additionalSources.length > 0;
  const totalSources = 1 + (episode.additionalSources?.length || 0);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Thumbnail Image */}
      <div className="relative group cursor-pointer" onClick={handleEpisodeClick}>
        <img 
          src={episode.thumbnailUrl} 
          alt={`${animeName} Episode ${episode.episodeNumber}`}
          className="w-full h-56 object-cover"
          loading="lazy"
          onError={(e) => {
            // Fallback to anime cover if episode thumbnail fails
            if (animeCover && e.target.src !== animeCover) {
              e.target.src = animeCover;
            }
          }}
        />
        
        {/* Overlay with Play Button */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100">
            <Play className="w-16 h-16 text-white fill-white" />
          </div>
        </div>

        {/* New Badge */}
        {episode.isNew && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg animate-pulse">
              NEW
            </span>
          </div>
        )}

        {/* Complete Badge */}
        {episode.isComplete && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-green-500 rounded-full shadow-lg">
              ✓ Complete
            </span>
          </div>
        )}

        {/* Multiple Sources Badge */}
        {hasMultipleSources && (
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded-full shadow-lg">
              <Tv className="w-3 h-3 mr-1" />
              {totalSources} sources
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
          <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1 hover:text-primary transition-colors cursor-pointer" title={animeName}>
            {animeName}
            <Info className="w-3 h-3 inline-block ml-1 opacity-0 group-anime-hover:opacity-100 transition-opacity" />
          </h3>
        </button>

        {/* Episode Title/Number - Clickable */}
        <div className="mb-2 cursor-pointer" onClick={handleEpisodeClick}>
          {episode.episodeTitle ? (
            <div>
              <div className="text-sm text-gray-600 font-medium hover:text-blue-600 transition-colors">
                Episode {episode.episodeNumber}
              </div>
              <div className="text-xs text-gray-500 line-clamp-1 hover:text-blue-500 transition-colors" title={episode.episodeTitle}>
                {episode.episodeTitle}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 font-medium hover:text-blue-600 transition-colors">
              {episode.type === 'movie' ? 'Movie' : `Episode ${episode.episodeNumber}`}
            </div>
          )}
        </div>

        {/* Metadata Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Source Website */}
          {primaryWebsite && (
            <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded capitalize">
              {primaryWebsite}
            </span>
          )}
          
          {/* Release Time */}
          {episode.releaseDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(episode.releaseDate)}
            </div>
          )}
        </div>

        {/* Views Counter */}
        {episode.views > 0 && (
          <div className="text-xs text-gray-500 mb-3">
            {episode.views.toLocaleString()} view{episode.views !== 1 ? 's' : ''}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Primary Action Button - Changes based on sources */}
          {hasMultipleSources ? (
            /* Multiple Sources - Go to Detail Page */
            <button
              onClick={handleEpisodeClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              <Tv className="w-4 h-4" />
              Choose Source ({totalSources})
            </button>
          ) : (
            /* Single Source - Direct Watch */
            <button
              onClick={() => handleWatch(primaryWatchUrl)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              <Play className="w-4 h-4" />
              Watch Now
            </button>
          )}

          {/* Quick Watch Primary Source (if multiple sources exist) */}
          {hasMultipleSources && (
            <button
              onClick={() => handleWatch(primaryWatchUrl)}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
              title={`Quick watch on ${primaryWebsite}`}
            >
              <Play className="w-4 h-4" />
            </button>
          )}

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

export default EpisodeCard;

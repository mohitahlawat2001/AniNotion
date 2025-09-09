import React from 'react';
import { Link } from 'react-router-dom';

const AnimeCard = ({ 
  anime, 
  showRank = false, 
  showScore = true, 
  onClick,
  className = '',
  linkTo = null 
}) => {
  const animeData = anime?.node || anime;
  
  if (!animeData) {
    return null;
  }

  const {
    title,
    main_picture,
    mean,
    popularity,
    genres = [],
    media_type,
    status,
    num_episodes,
    start_season
  } = animeData;

  const ranking = anime?.ranking;

  const formatMediaType = (type) => {
    if (!type) return '';
    return type.replace('_', ' ').toUpperCase();
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const cardContent = (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative">
        <img
          src={main_picture?.large || main_picture?.medium || '/api/placeholder/300/400'}
          alt={title}
          className="w-full h-64 object-cover"
          loading="lazy"
        />
        
        {/* Rank Badge */}
        {showRank && ranking?.rank && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            #{ranking.rank}
          </div>
        )}
        
        {/* Score Badge */}
        {showScore && mean && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            ⭐ {mean.toFixed(1)}
          </div>
        )}
        
        {/* Media Type Badge */}
        {media_type && (
          <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded-md text-xs">
            {formatMediaType(media_type)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900" title={title}>
          {title}
        </h3>

        {/* Metadata */}
        <div className="space-y-2 mb-3">
          {start_season && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Season:</span> {start_season.season} {start_season.year}
            </div>
          )}
          
          {num_episodes && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Episodes:</span> {num_episodes}
            </div>
          )}
          
          {status && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Status:</span> {formatStatus(status)}
            </div>
          )}
          
          {popularity && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Popularity:</span> #{popularity}
            </div>
          )}
        </div>

        {/* Genres */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 3).map((genre) => (
              <span
                key={genre.id}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {genre.name}
              </span>
            ))}
            {genres.length > 3 && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                +{genres.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // If linkTo is provided, wrap in Link
  if (linkTo) {
    return (
      <Link to={linkTo} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default AnimeCard;

import React, { useState, useEffect } from 'react';
import { Play, Calendar, Eye, ExternalLink, Loader } from 'lucide-react';
import episodeService from '../../services/episodeService';


const AnimeEpisodesSection = ({ animeName }) => {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anime, setAnime] = useState(null);

  useEffect(() => {
    fetchEpisodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeName]);

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('AnimeEpisodesSection: Fetching episodes for:', animeName);

      // Use the new dedicated API endpoint
      const response = await episodeService.getEpisodesByAnimeName(animeName);

      console.log('AnimeEpisodesSection: API response:', response);

      if (response.success) {
        console.log('AnimeEpisodesSection: Episodes found:', response.count);
        console.log('AnimeEpisodesSection: Schema used:', response.schema);
        
        setEpisodes(response.data);
        
        // Set anime info from first episode
        if (response.data.length > 0) {
          setAnime(response.data[0].anime);
        }
      }
    } catch (err) {
      console.error('Error fetching episodes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-center space-x-3">
          <Loader className="w-5 h-5 animate-spin text-primary" />
          <span className="text-gray-600">Loading available episodes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600">Error loading episodes: {error}</p>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="text-center">
          <p className="text-blue-700 font-medium mb-2">No episodes available yet</p>
          <p className="text-blue-600 text-sm">
            Episodes for "{animeName}" haven't been added to the new schema yet. 
            Check back later or view blog posts below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Play className="w-6 h-6 mr-2" />
              Available Episodes
            </h2>
            <p className="text-sm text-white/80 mt-1">
              {episodes.length} episode{episodes.length !== 1 ? 's' : ''} available to watch
            </p>
          </div>
          {anime?.coverImage && (
            <img 
              src={anime.coverImage} 
              alt={anime.name}
              className="w-16 h-24 object-cover rounded-lg shadow-lg"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>

      {/* Episodes Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {episodes.map((episode) => (
            <div
              key={episode._id}
              className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-primary"
            >
              {/* Episode Thumbnail */}
              <div className="relative aspect-video bg-gray-200 overflow-hidden">
                {episode.thumbnailUrl ? (
                  <img
                    src={episode.thumbnailUrl}
                    alt={`Episode ${episode.episodeNumber}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                    <Play className="w-12 h-12 text-white/50" />
                  </div>
                )}
                
                {/* Episode Number Badge */}
                <div className="absolute top-2 left-2 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-bold">
                  EP {episode.episodeNumber}
                </div>

                {/* New Badge */}
                {episode.isNew && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                    NEW
                  </div>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-4 shadow-lg">
                      <Play className="w-8 h-8 text-primary fill-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Episode Info */}
              <div className="p-4">
                {episode.title && (
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                    {episode.title}
                  </h3>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(episode.releaseDate).toLocaleDateString()}</span>
                  </div>
                  {episode.viewCount > 0 && (
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{episode.viewCount}</span>
                    </div>
                  )}
                </div>

                {/* Multi-Source Support */}
                {episode.additionalSources && episode.additionalSources.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="text-xs font-medium text-gray-600">Sources:</span>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {episode.primarySource.website}
                        </span>
                        {episode.additionalSources.slice(0, 2).map((source, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700"
                          >
                            {source.website}
                          </span>
                        ))}
                        {episode.additionalSources.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            +{episode.additionalSources.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Watch Button */}
                <a
                  href={episode.watchUrl || episode.primarySource.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Play className="w-4 h-4" />
                  <span>Watch Now</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Anime Info Footer */}
        {anime && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                {anime.status && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {anime.status.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span>Latest Episode: {anime.latestEpisodeNumber}</span>
                <span>Total Episodes: {anime.episodeCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeEpisodesSection;

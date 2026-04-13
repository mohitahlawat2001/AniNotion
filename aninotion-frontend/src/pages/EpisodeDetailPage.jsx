import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaPlay, FaArrowLeft, FaExternalLinkAlt, FaClock, FaCalendar, FaEye, FaCheckCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_SCRAPING_API_URL || 'http://localhost:5001/api';

const normalizeWebsite = (website = '') => {
  const w = String(website || '').toLowerCase().trim();
  if (!w) return 'unknown';
  if (w.includes('animekai')) return 'animekai';
  if (w.includes('animepahe')) return 'animepahe';
  if (w.includes('gogoanime')) return 'gogoanime';
  if (w.includes('9anime')) return '9anime';
  return w.replace(/^www\./, '');
};

const inferWebsiteFromUrl = (url = '') => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('animekai')) return 'animekai';
    if (host.includes('animepahe')) return 'animepahe';
    if (host.includes('gogoanime')) return 'gogoanime';
    if (host.includes('9anime')) return '9anime';
    return host.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export default function EpisodeDetailPage() {
  const { animeName, episodeNumber } = useParams();
  const navigate = useNavigate();
  const [episodeData, setEpisodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);

  useEffect(() => {
    fetchEpisodeDetails();
  }, [animeName, episodeNumber]);

  const fetchEpisodeDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${API_URL}/anime/${animeName}/episodes/${episodeNumber}`
      );
      
      if (response.data.success) {
        const data = response.data.data;
        const sourceByWebsite = new Map();

        for (const source of data.sources || []) {
          let normalizedWebsite = normalizeWebsite(source.website);
          if (normalizedWebsite === 'custom' || normalizedWebsite === 'unknown') {
            normalizedWebsite = inferWebsiteFromUrl(source.watchUrl || source.url) || normalizedWebsite;
          }
          const normalizedSource = {
            ...source,
            website: normalizedWebsite
          };
          const existing = sourceByWebsite.get(normalizedWebsite);

          if (!existing) {
            sourceByWebsite.set(normalizedWebsite, normalizedSource);
            continue;
          }

          if (!existing.isPrimary && normalizedSource.isPrimary) {
            sourceByWebsite.set(normalizedWebsite, normalizedSource);
            continue;
          }

          const existingTs = existing.scrapedAt ? new Date(existing.scrapedAt).getTime() : 0;
          const nextTs = normalizedSource.scrapedAt ? new Date(normalizedSource.scrapedAt).getTime() : 0;
          if (nextTs > existingTs && !existing.isPrimary) {
            sourceByWebsite.set(normalizedWebsite, normalizedSource);
          }
        }

        const dedupedSources = Array.from(sourceByWebsite.values());
        const normalizedData = {
          ...data,
          sources: dedupedSources,
          sourceCount: dedupedSources.length
        };

        setEpisodeData(normalizedData);
        // Auto-select first source
        if (dedupedSources.length > 0) {
          setSelectedSource(dedupedSources[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching episode details:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load episode details';
      // Show "Coming Soon" for not found episodes
      if (errorMessage.toLowerCase().includes('not found') || err.response?.status === 404) {
        setError('coming-soon');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWatchNow = (source) => {
    // Track view
    if (episodeData?.episode?._id) {
      axios.post(`${API_URL}/episodes/${episodeData.episode._id}/seen`).catch(console.error);
    }
    
    // Open watch URL in new tab
    window.open(source.watchUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    const isComingSoon = error === 'coming-soon';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center">
          {isComingSoon ? (
            <>
              <div className="mb-6">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-4xl font-bold text-blue-400 mb-2">Coming Soon</h2>
                <p className="text-gray-400 text-lg">This episode will be available shortly!</p>
              </div>
              <p className="text-gray-500 mb-6 text-sm">
                We're working on getting this episode ready for you.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
              <p className="text-gray-400 mb-6">{error}</p>
            </>
          )}
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!episodeData) {
    return null;
  }

  const { episode, anime, sources, sourceCount } = episodeData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(${episode.thumbnail})` 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 h-full relative z-10">
          <div className="flex flex-col justify-end h-full pb-8">
            {/* Back Button */}
            <button
              onClick={() => navigate(`/anime/${encodeURIComponent(anime.name)}`)}
              className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition w-fit"
            >
              <FaArrowLeft />
              Back to {anime.name}
            </button>

            {/* Episode Info */}
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {anime.name}
            </h1>
            <h2 className="text-2xl md:text-3xl text-blue-400 mb-4">
              Episode {episode.number}{episode.title && `: ${episode.title}`}
            </h2>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              {episode.duration && (
                <div className="flex items-center gap-2">
                  <FaClock className="text-blue-400" />
                  {episode.duration} min
                </div>
              )}
              {episode.airDate && (
                <div className="flex items-center gap-2">
                  <FaCalendar className="text-blue-400" />
                  {new Date(episode.airDate).toLocaleDateString()}
                </div>
              )}
              {episode.views > 0 && (
                <div className="flex items-center gap-2">
                  <FaEye className="text-blue-400" />
                  {episode.views} views
                </div>
              )}
              {episode.isComplete && (
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" />
                  Complete
                </div>
              )}
              {episode.isNew && (
                <span className="px-3 py-1 bg-red-600 rounded-full text-xs font-semibold">
                  NEW
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sources */}
          <div className="lg:col-span-2">
            {/* Available Sources */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold mb-4">
                Watch Now ({sourceCount} {sourceCount === 1 ? 'Source' : 'Sources'})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition ${
                      selectedSource?.id === source.id
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                    }`}
                    onClick={() => setSelectedSource(source)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg capitalize">
                          {source.website}
                        </h4>
                        {source.isPrimary && (
                          <span className="text-xs text-blue-400">Primary Source</span>
                        )}
                      </div>
                      {selectedSource?.id === source.id && (
                        <FaCheckCircle className="text-blue-500" />
                      )}
                    </div>

                    {/* Source Info */}
                    <div className="text-sm text-gray-400 space-y-1 mb-3">
                      {source.quality && (
                        <div>Quality: <span className="text-white">{source.quality}</span></div>
                      )}
                      {source.dubbed !== undefined && (
                        <div>
                          Audio: <span className="text-white">{source.dubbed ? 'Dubbed' : 'Subbed'}</span>
                        </div>
                      )}
                      {source.subtitles && source.subtitles.length > 0 && (
                        <div>
                          Subtitles: <span className="text-white">{source.subtitles.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Watch Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWatchNow(source);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center justify-center gap-2 font-semibold"
                    >
                      <FaPlay size={14} />
                      Watch on {source.website}
                      <FaExternalLinkAlt size={12} />
                    </button>

                    {/* Scraped Date */}
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Added {new Date(source.scrapedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {sourceCount > 1 && (
                <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                  <p className="text-sm text-blue-200">
                    💡 <strong>Tip:</strong> Multiple sources available! If one doesn't work, try another. 
                    Different sources may have different quality, subtitles, or loading speeds.
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {episode.description && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Episode Description</h3>
                <p className="text-gray-300 leading-relaxed">{episode.description}</p>
              </div>
            )}
          </div>

          {/* Right Column - Anime Info */}
          <div className="space-y-6">
            {/* Anime Card */}
            <Link
              to={`/anime/${encodeURIComponent(animeName)}`}
              className="block bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition"
            >
              <img
                src={anime.coverImage}
                alt={anime.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{anime.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="px-2 py-1 bg-gray-700 rounded text-xs capitalize">
                    {anime.status}
                  </span>
                  {anime.genres && anime.genres.length > 0 && (
                    <span className="text-xs">
                      {anime.genres.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Quick Nav */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-3">Quick Navigation</h3>
              <div className="space-y-2">
                <Link
                  to={`/anime/${encodeURIComponent(animeName)}`}
                  className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-center"
                >
                  View All Episodes
                </Link>
                {parseInt(episodeNumber) > 1 && (
                  <Link
                    to={`/anime/${encodeURIComponent(animeName)}/episode/${parseInt(episodeNumber) - 1}`}
                    className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-center"
                  >
                    ← Previous Episode
                  </Link>
                )}
                <Link
                  to={`/anime/${encodeURIComponent(animeName)}/episode/${parseInt(episodeNumber) + 1}`}
                  className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-center"
                >
                  Next Episode →
                </Link>
              </div>
            </div>

            {/* Share */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-3">Share This Episode</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

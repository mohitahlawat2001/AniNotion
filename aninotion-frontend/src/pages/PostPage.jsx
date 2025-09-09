import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Tag, ChevronLeft, ChevronRight, ArrowLeft, ExternalLink, Star, Users, Play, Clock } from 'lucide-react';
import { postsAPI } from '../services/api';
import { useAnimeSearch, useAnimeDetails } from '../hooks/useAnime';
import LoadingSpinner from '../components/LoadingSpinner';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnimeId, setSelectedAnimeId] = useState(null);

  // Anime search hook for finding anime based on post's animeName
  const { 
    data: searchResults, 
    loading: searchLoading, 
    search: searchAnime 
  } = useAnimeSearch();

  // Anime details hook for selected anime
  const { 
    data: animeDetails, 
    loading: detailsLoading 
  } = useAnimeDetails(selectedAnimeId);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
  // Backend supports identifier (either ObjectId or slug) on the same route
  const data = await postsAPI.getByIdentifier(id, true);
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Search for anime when post loads
  useEffect(() => {
    if (post?.animeName && !selectedAnimeId) {
      searchAnime(post.animeName, { limit: 5 });
    }
  }, [post?.animeName, searchAnime, selectedAnimeId]);

  // Auto-select first anime result if there's a good match
  useEffect(() => {
    if (searchResults && searchResults.length > 0 && !selectedAnimeId && post?.animeName) {
      // Look for exact or close match
      const exactMatch = searchResults.find(anime => 
        anime.node.title.toLowerCase() === post.animeName.toLowerCase()
      );
      
      if (exactMatch) {
        setSelectedAnimeId(exactMatch.node.id);
      } else {
        // Use first result as fallback
        setSelectedAnimeId(searchResults[0].node.id);
      }
    }
  }, [searchResults, selectedAnimeId, post?.animeName, setSelectedAnimeId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get images array - prioritize 'images' array, fallback to single 'image'
  const getImages = () => {
    if (post?.images && post.images.length > 0) {
      return post.images;
    } else if (post?.image && post.image.trim() !== '') {
      return [post.image];
    }
    return [];
  };

  const images = getImages();
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isLoading) {
    return <LoadingSpinner type="post" />;
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Post not found</div>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Main Post Content */}
        <div className="flex-1 max-w-none lg:max-w-3xl relative">
          {/* See-through Back Button - Right side on mobile, left on larger screens */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 sm:left-4 sm:right-auto z-10 flex items-center space-x-2 bg-black/20 backdrop-blur-sm text-white hover:text-white hover:bg-black/30 px-4 py-2 rounded-full transition-all duration-300 border border-white/30 group"
          >
            <ArrowLeft size={18} className="sm:hidden group-hover:scale-110 transition-transform duration-200" />
            <ArrowLeft size={20} className="hidden sm:block group-hover:scale-110 transition-transform duration-200" />
            <span className="text-sm sm:text-base font-medium">Back</span>
          </button>

          {/* Post Card */}
          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Images Section */}
            {images.length > 0 && (
              <div className="relative">
                <img
                  src={images[currentImageIndex]}
                  alt={post.title}
                  className="w-full h-auto max-h-64 sm:max-h-80 lg:max-h-96 object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Image Navigation for Multiple Images */}
                {hasMultipleImages && (
                  <>
                    {/* Navigation Buttons */}
                    <button
                      onClick={prevImage}
                      className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1.5 sm:p-2 rounded-full transition-opacity touch-target"
                    >
                      <ChevronLeft size={16} className="sm:hidden" />
                      <ChevronLeft size={20} className="hidden sm:block" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1.5 sm:p-2 rounded-full transition-opacity touch-target"
                    >
                      <ChevronRight size={16} className="sm:hidden" />
                      <ChevronRight size={20} className="hidden sm:block" />
                    </button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors touch-target ${
                            index === currentImageIndex
                              ? 'bg-white'
                              : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Image Counter */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black bg-opacity-60 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Category Badge */}
              <div className="flex items-center mb-3 sm:mb-4">
                <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-primary/10 text-primary">
                  <Tag size={12} className="mr-1 sm:hidden" />
                  <Tag size={14} className="mr-1 hidden sm:block" />
                  {post.category?.name}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                {post.title}
              </h1>

              {/* Anime Name */}
              <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4 font-medium">
                📺 {post.animeName}
              </p>

              {/* Date */}
              <div className="flex items-center text-gray-500 mb-4 sm:mb-6">
                <Calendar size={14} className="mr-2 sm:hidden" />
                <Calendar size={16} className="mr-2 hidden sm:block" />
                <span className="text-sm sm:text-base">{formatDate(post.createdAt)}</span>
              </div>

              {/* Full Content */}
              <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {post.content}
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* Recommendations Sidebar - Below content on mobile, sidebar on desktop */}
        <div className="w-full lg:w-80 mt-6 lg:mt-0">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recommended Posts
            </h3>
            <div className="text-gray-500 text-center py-8">
              Coming soon...
            </div>
          </div>
        </div>

        
      </div>

      {/* Full-width Anime Details Section */}
      {post?.animeName && (
        <div className="mt-8 lg:mt-12">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="absolute inset-0" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.05"%3E%3Cpath d="m0 40l40-40h-40z"/%3E%3C/g%3E%3C/svg%3E")'
              }}></div>
              <div className="relative p-6 sm:p-8">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                    <Play size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Anime Information</h2>
                    <p className="text-white text-opacity-90 text-sm mt-1">
                      Details about "{post.animeName}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {detailsLoading || searchLoading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Anime Details</h3>
                <p className="text-gray-600">Fetching information from MyAnimeList...</p>
              </div>
            ) : animeDetails ? (
              <div className="p-6 sm:p-8">
                {/* Main Anime Info */}
                <div className="flex flex-col lg:flex-row gap-8 mb-8">
                  {/* Anime Poster with enhanced styling */}
                  <div className="flex-shrink-0 lg:w-64">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300 rounded-xl z-10"></div>
                      <img
                        src={animeDetails.main_picture?.large || animeDetails.main_picture?.medium}
                        alt={animeDetails.title}
                        className="w-full h-auto max-w-64 mx-auto lg:mx-0 rounded-xl shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {animeDetails.mean && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm">
                          <div className="flex items-center space-x-1">
                            <Star size={16} className="fill-current" />
                            <span className="font-bold text-sm">{animeDetails.mean.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Anime Details */}
                  <div className="flex-1 space-y-6">
                    {/* Title Section */}
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                        {animeDetails.title}
                      </h3>
                      {animeDetails.alternative_titles?.en && animeDetails.alternative_titles.en !== animeDetails.title && (
                        <p className="text-lg text-gray-600 font-medium">
                          {animeDetails.alternative_titles.en}
                        </p>
                      )}
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {animeDetails.rank && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600">#{animeDetails.rank}</div>
                          <div className="text-xs text-blue-600 font-medium">Rank</div>
                        </div>
                      )}
                      
                      {animeDetails.popularity && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
                          <div className="text-2xl font-bold text-green-600">#{animeDetails.popularity}</div>
                          <div className="text-xs text-green-600 font-medium">Popularity</div>
                        </div>
                      )}

                      {animeDetails.num_episodes && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
                          <div className="text-2xl font-bold text-purple-600">{animeDetails.num_episodes}</div>
                          <div className="text-xs text-purple-600 font-medium">Episodes</div>
                        </div>
                      )}

                      {animeDetails.mean && (
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-600">{animeDetails.mean.toFixed(1)}/10</div>
                          <div className="text-xs text-yellow-600 font-medium">Score</div>
                        </div>
                      )}
                    </div>

                    {/* Detailed Information */}
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {animeDetails.media_type && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-medium text-gray-700">Type</span>
                            <span className="text-gray-900 capitalize font-medium">
                              {animeDetails.media_type.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        
                        {animeDetails.status && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-medium text-gray-700">Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              animeDetails.status === 'finished_airing' ? 'bg-green-100 text-green-800' :
                              animeDetails.status === 'currently_airing' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {animeDetails.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {animeDetails.start_date && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-medium text-gray-700">Aired</span>
                            <span className="text-gray-900 font-medium">
                              {new Date(animeDetails.start_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short',
                                day: 'numeric'
                              })}
                              {animeDetails.end_date && animeDetails.end_date !== animeDetails.start_date && 
                                ` - ${new Date(animeDetails.end_date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short',
                                  day: 'numeric'
                                })}`
                              }
                            </span>
                          </div>
                        )}
                        
                        {animeDetails.studios && animeDetails.studios.length > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="font-medium text-gray-700">Studio</span>
                            <span className="text-gray-900 font-medium text-right">
                              {animeDetails.studios.map(studio => studio.name).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Genres Section */}
                {animeDetails.genres && animeDetails.genres.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {animeDetails.genres.map((genre, index) => (
                        <span
                          key={genre.id}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                            index % 6 === 0 ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            index % 6 === 1 ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                            index % 6 === 2 ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                            index % 6 === 3 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                            index % 6 === 4 ? 'bg-pink-100 text-pink-800 hover:bg-pink-200' :
                            'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                          }`}
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synopsis Section */}
                {animeDetails.synopsis && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Synopsis</h4>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {animeDetails.synopsis}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <a
                    href={`https://myanimelist.net/anime/${animeDetails.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink size={18} className="mr-2" />
                    View on MyAnimeList
                  </a>
                  
                  {animeDetails.trailer && (
                    <a
                      href={animeDetails.trailer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <Play size={18} className="mr-2" />
                      Watch Trailer
                    </a>
                  )}
                </div>

                {/* Alternative Anime Results */}
                {searchResults && searchResults.length > 1 && (
                  <div className="border-t border-gray-200 pt-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Other search results for "{post.animeName}"
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.slice(0, 6).map((anime) => (
                        <button
                          key={anime.node.id}
                          onClick={() => setSelectedAnimeId(anime.node.id)}
                          className={`text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                            selectedAnimeId === anime.node.id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={anime.node.main_picture?.medium}
                              alt={anime.node.title}
                              className="w-16 h-20 object-cover rounded-lg shadow-md flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 truncate text-sm mb-1">
                                {anime.node.title}
                              </p>
                              {anime.node.start_date && (
                                <p className="text-xs text-gray-500">
                                  {new Date(anime.node.start_date).getFullYear()}
                                </p>
                              )}
                              {selectedAnimeId === anime.node.id && (
                                <div className="flex items-center mt-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                  <span className="text-xs text-blue-600 font-medium">Selected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : searchResults && searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.09m6.582 0A7.962 7.962 0 0118 15c-2.034 0-3.9.785-5.291 2.09M15 11V9a6 6 0 00-12 0v2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Anime Not Found</h3>
                <p className="text-gray-600">No anime found for "{post.animeName}"</p>
                <p className="text-sm text-gray-500 mt-1">The anime might not be in the MyAnimeList database.</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load</h3>
                <p className="text-gray-600">Unable to load anime details at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostPage;

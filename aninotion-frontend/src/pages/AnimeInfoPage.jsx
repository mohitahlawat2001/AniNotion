import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, FileText, PlayCircle, Tv } from 'lucide-react';

const AnimeInfoPage = () => {
  const { animeName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [groupedPosts, setGroupedPosts] = useState({ 
    bySeasonAndEpisode: {}, 
    seasonOnly: [], 
    episodeOnly: [], 
    wholeSeries: [] 
  });

  useEffect(() => {
    fetchAnimePosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeName]);

  const fetchAnimePosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all posts for this anime
      const response = await postsAPI.getAll({
        limit: 1000, // Get all posts
        sortBy: 'episodeNumber',
        sortOrder: 'asc'
      });

      // Filter posts by anime name (case-insensitive)
      const decodedAnimeName = decodeURIComponent(animeName);
      const animePosts = response.posts.filter(
        post => post.animeName && 
        post.animeName.toLowerCase() === decodedAnimeName.toLowerCase()
      );

      setPosts(animePosts);

      // Group posts by seasons, episodes, and whole series
      const episodePosts = animePosts
        .filter(post => post.episodeNumber || post.seasonNumber)
        .sort((a, b) => {
          // Sort by season number first
          const seasonA = a.seasonNumber || 0;
          const seasonB = b.seasonNumber || 0;
          if (seasonA !== seasonB) {
            return seasonA - seasonB;
          }
          // Then by episode number
          const episodeA = a.episodeNumber || 0;
          const episodeB = b.episodeNumber || 0;
          if (episodeA !== episodeB) {
            return episodeA - episodeB;
          }
          // Finally by creation date for same season/episode
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      
      const wholeSeriesPosts = animePosts
        .filter(post => !post.episodeNumber && !post.seasonNumber)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Group episodes by season for better organization
      const episodesBySeason = {};
      episodePosts.forEach(post => {
        const season = post.seasonNumber || 'unsorted';
        if (!episodesBySeason[season]) {
          episodesBySeason[season] = [];
        }
        episodesBySeason[season].push(post);
      });

      setGroupedPosts({
        episodes: episodePosts,
        episodesBySeason: episodesBySeason,
        wholeSeries: wholeSeriesPosts
      });

    } catch (err) {
      console.error('Error fetching anime posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="mb-6 text-primary hover:text-primary-dark transition-colors"
          >
            ← Back to Home
          </button>
          <div className="text-center py-12">
            <Tv className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Posts Found
            </h2>
            <p className="text-gray-600">
              No posts found for "{decodeURIComponent(animeName)}"
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-primary hover:text-primary-dark transition-colors flex items-center"
          >
            ← Back to Home
          </button>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Tv className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">
                {decodeURIComponent(animeName)}
              </h1>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mt-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{posts.length} Total Posts</span>
              </div>
              <div className="flex items-center space-x-2">
                <PlayCircle className="w-4 h-4" />
                <span>{groupedPosts.episodes.length} Episode Posts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4" />
                <span>{groupedPosts.wholeSeries.length} Series Posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Whole Series Posts */}
        {groupedPosts.wholeSeries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Tv className="w-6 h-6 mr-2 text-primary" />
              Whole Series Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedPosts.wholeSeries.map(post => (
                <div
                  key={post._id}
                  onClick={() => handlePostClick(post._id)}
                  className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.category && (
                      <span className="ml-3 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full whitespace-nowrap">
                        {post.category.name}
                      </span>
                    )}
                  </div>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span>👁️ {post.views || 0}</span>
                      <span>❤️ {post.likesCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Episode Posts - Infographic Style */}
        {groupedPosts.episodes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <PlayCircle className="w-6 h-6 mr-2 text-primary" />
              Season & Episode Posts
            </h2>
            
            {/* Group by Season */}
            {Object.keys(groupedPosts.episodesBySeason).sort((a, b) => {
              // 'unsorted' goes last
              if (a === 'unsorted') return 1;
              if (b === 'unsorted') return -1;
              return Number(a) - Number(b);
            }).map(seasonKey => (
              <div key={seasonKey} className="mb-8">
                {/* Season Header */}
                {seasonKey !== 'unsorted' && (
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                      <span className="bg-primary text-white px-4 py-2 rounded-lg shadow">
                        Season {seasonKey}
                      </span>
                      <span className="ml-3 text-sm text-gray-500">
                        {groupedPosts.episodesBySeason[seasonKey].length} posts
                      </span>
                    </h3>
                  </div>
                )}
                
                {seasonKey === 'unsorted' && (
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      Other Posts
                    </h3>
                  </div>
                )}

                {/* Timeline/Infographic View */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="space-y-4">
                    {groupedPosts.episodesBySeason[seasonKey].map((post, index) => (
                      <div
                        key={post._id}
                        onClick={() => handlePostClick(post._id)}
                        className="relative border-l-4 border-primary pb-6 last:pb-0 hover:bg-gray-50 -ml-6 pl-6 pr-4 py-3 rounded-r-lg transition-colors cursor-pointer group"
                      >
                        {/* Season/Episode Badge */}
                        <div className="absolute -left-10 top-3 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-lg z-10 group-hover:scale-110 transition-transform">
                          <div className="text-center text-xs leading-tight">
                            {post.seasonNumber && post.episodeNumber ? (
                              <>
                                <div>S{post.seasonNumber}</div>
                                <div>E{post.episodeNumber}</div>
                              </>
                            ) : post.episodeNumber ? (
                              <>
                                <div>EP</div>
                                <div className="text-lg">{post.episodeNumber}</div>
                              </>
                            ) : (
                              <>
                                <div>S</div>
                                <div className="text-lg">{post.seasonNumber}</div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Timeline connector dot */}
                        {index < groupedPosts.episodesBySeason[seasonKey].length - 1 && (
                          <div className="absolute left-0 top-20 w-1 h-full bg-gray-200 -ml-0.5"></div>
                        )}

                    {/* Post Content */}
                    <div className="ml-12">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 flex-1 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        {post.category && (
                          <span className="ml-3 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full whitespace-nowrap">
                            {post.category.name}
                          </span>
                        )}
                      </div>

                      {post.excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Post Images Preview */}
                      {post.images && post.images.length > 0 && (
                        <div className="flex space-x-2 mb-3 overflow-x-auto">
                          {post.images.slice(0, 3).map((img, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={img}
                              alt={`Preview ${imgIndex + 1}`}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                          {post.images.length > 3 && (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-sm flex-shrink-0">
                              +{post.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Post Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <span>👁️</span>
                            <span>{post.views || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>❤️</span>
                            <span>{post.likesCount || 0}</span>
                          </span>
                          {post.readingTimeMinutes > 0 && (
                            <span>{post.readingTimeMinutes} min read</span>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeInfoPage;

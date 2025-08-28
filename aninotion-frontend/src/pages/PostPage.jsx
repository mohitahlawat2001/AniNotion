import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Tag, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { postsAPI } from '../services/api';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const data = await postsAPI.getById(id);
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading post...</div>
      </div>
    );
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
        <div className="flex-1 max-w-none lg:max-w-3xl">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 lg:mb-6 transition-colors p-2 -ml-2 rounded touch-target"
          >
            <ArrowLeft size={18} className="sm:hidden" />
            <ArrowLeft size={20} className="hidden sm:block" />
            <span className="text-sm sm:text-base">Back</span>
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
    </div>
  );
};

export default PostPage;

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, Image, Plus, Link, Check, Search, ChevronDown } from 'lucide-react';
import { categoriesAPI, postsAPI, animeAPI } from '../services/api';


const PostForm = ({ isOpen, onClose, onSubmit }) => {
  const [categories, setCategories] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageLinks, setImageLinks] = useState([]); // Track which images are from links
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [error, setError] = useState('');
  
  // Anime suggestion states
  const [animeQuery, setAnimeQuery] = useState('');
  const [animeSuggestions, setAnimeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAnime, setIsSearchingAnime] = useState(false);
  const [selectedAnimeIndex, setSelectedAnimeIndex] = useState(-1);
  
  const fileInputRef = useRef(null);
  const animeInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch categories when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Add paste event listener
  useEffect(() => {
    const handlePaste = (e) => {
      if (!isOpen) return;
      
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              handleFileToBase64(file);
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Debounced anime search effect
  useEffect(() => {
    if (!animeQuery.trim() || animeQuery.length < 2) {
      setAnimeSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearchingAnime(true);
        const response = await animeAPI.search(animeQuery, { limit: 8 });
        setAnimeSuggestions(response.data || []);
        setShowSuggestions(true);
        setSelectedAnimeIndex(-1);
      } catch (error) {
        console.error('Error searching anime:', error);
        setAnimeSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearchingAnime(false);
      }
    }, 500); // 0.5 second delay

    return () => clearTimeout(timeoutId);
  }, [animeQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        animeInputRef.current &&
        !animeInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedAnimeIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      setError('');
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
    }
  };

  // Handle anime input change
  const handleAnimeInputChange = (e) => {
    const value = e.target.value;
    setAnimeQuery(value);
    setValue('animeName', value);
  };

  // Handle anime selection from suggestions
  const handleAnimeSelect = (anime) => {
    const animeData = anime.node || anime;
    const title = animeData.title;
    setAnimeQuery(title);
    setValue('animeName', title);
    setShowSuggestions(false);
    setSelectedAnimeIndex(-1);
    animeInputRef.current?.focus();
  };

  // Handle keyboard navigation in suggestions
  const handleAnimeKeyDown = (e) => {
    if (!showSuggestions || animeSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedAnimeIndex(prev => 
          prev < animeSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedAnimeIndex(prev => 
          prev > 0 ? prev - 1 : animeSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedAnimeIndex >= 0 && selectedAnimeIndex < animeSuggestions.length) {
          handleAnimeSelect(animeSuggestions[selectedAnimeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedAnimeIndex(-1);
        break;
    }
  };

  const handleFileToBase64 = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => [...prev, reader.result]);
      setImageLinks(prev => [...prev, false]); // Mark as not from link
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      handleFileToBase64(file);
    });
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // const validateImageUrl = (url) => {
  //   return new Promise((resolve) => {
  //     const img = new Image();
  //     img.onload = () => resolve(true);
  //     img.onerror = () => resolve(false);
  //     img.src = url;
  //   });
  // };

  const handleAddImageUrl = async () => {
  if (!imageUrl.trim()) return;

  // Basic URL format validation only
  try {
    new URL(imageUrl);
  } catch (e) {
    alert('Please enter a valid URL format (e.g., https://example.com/image.jpg)' + e.message);
    return;
  }

  setIsValidatingUrl(true);
  
  try {
    // Accept all URLs without validation - let browser handle loading
    setImagePreviews(prev => [...prev, imageUrl]);
    setImageLinks(prev => [...prev, true]); // Mark as from link
    setImageUrl('');
    setShowLinkInput(false);
  } catch (error) {
    console.error('Error adding image URL:', error);
    alert('Error adding image URL. Please try again.');
  } finally {
    setIsValidatingUrl(false);
  }
};

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageLinks(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmitForm = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const postData = {
        title: data.title,
        animeName: data.animeName,
        category: data.category,
        content: data.content,
        images: imagePreviews, // Array of base64 images and URLs
        imageTypes: imageLinks, // Array indicating which are URLs vs base64
        status: 'published' // Default to published
      };
      
      // Use the centralized API method
      const newPost = await postsAPI.create(postData);
      
      // Call the parent's onSubmit with the created post
      await onSubmit(newPost);
      
      // Reset form state
      reset();
      setImagePreviews([]);
      setImageLinks([]);
      setImageUrl('');
      setShowLinkInput(false);
      setAnimeQuery('');
      setAnimeSuggestions([]);
      setShowSuggestions(false);
      setSelectedAnimeIndex(-1);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 touch-target"
            aria-label="Close"
          >
            <X size={20} className="sm:hidden" />
            <X size={24} className="hidden sm:block" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter post title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Anime Name */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anime/Manga Name *
            </label>
            <div className="relative">
              <input
                ref={animeInputRef}
                type="text"
                value={animeQuery}
                onChange={handleAnimeInputChange}
                onKeyDown={handleAnimeKeyDown}
                onFocus={() => {
                  if (animeSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Start typing anime or manga name..."
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                autoComplete="off"
              />
              
              {/* Search/Loading Icon */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isSearchingAnime ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                ) : (
                  <Search size={20} className="text-gray-400" />
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {animeSuggestions.length > 0 ? (
                    <div className="py-1">
                      {animeSuggestions.map((anime, index) => {
                        const animeData = anime.node || anime;
                        return (
                          <button
                            key={animeData.id}
                            type="button"
                            onClick={() => handleAnimeSelect(anime)}
                            className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                              index === selectedAnimeIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            {/* Anime Poster */}
                            {animeData.main_picture?.medium && (
                              <img
                                src={animeData.main_picture.medium}
                                alt={animeData.title}
                                className="w-12 h-16 object-cover rounded flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            
                            {/* Anime Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {animeData.title}
                              </div>
                              {animeData.alternative_titles?.en && animeData.alternative_titles.en !== animeData.title && (
                                <div className="text-sm text-gray-600 truncate">
                                  {animeData.alternative_titles.en}
                                </div>
                              )}
                              {animeData.start_date && (
                                <div className="text-xs text-gray-500">
                                  {new Date(animeData.start_date).getFullYear()}
                                </div>
                              )}
                            </div>

                            {/* Score */}
                            {animeData.mean && (
                              <div className="flex items-center text-yellow-600 flex-shrink-0">
                                <span className="text-sm font-medium">★ {animeData.mean.toFixed(1)}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                      
                      {/* Footer */}
                      <div className="px-4 py-2 text-xs text-gray-500 border-t bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
                          <span className="flex items-center">
                            Powered by 
                            <span className="ml-1 font-medium text-blue-600">MyAnimeList</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500">
                      {isSearchingAnime ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span>Searching anime...</span>
                        </div>
                      ) : animeQuery.trim().length > 0 ? (
                        <div>
                          <div className="text-sm">No anime found for "{animeQuery}"</div>
                          <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
                        </div>
                      ) : (
                        <div className="text-sm">Start typing to search for anime</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Hidden input for form validation */}
            <input
              type="hidden"
              {...register('animeName', { required: 'Anime/Manga name is required' })}
            />
            
            {errors.animeName && (
              <p className="text-red-500 text-sm mt-1">{errors.animeName.message}</p>
            )}
            
            {/* Helper text */}
            <p className="text-xs text-gray-500 mt-1">
              Start typing to see suggestions from MyAnimeList database
            </p>
          </div>

          {/* Multiple Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photos
              <span className="text-gray-500 text-xs ml-2 hidden sm:inline">
                (Upload files, paste images with Ctrl+V, or add image URLs)
              </span>
              <span className="text-gray-500 text-xs ml-2 sm:hidden block mt-1">
                Upload files, paste images, or add URLs
              </span>
            </label>
            
            {/* Image Previews Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                      referrerPolicy="no-referrer"
                    />
                    {/* Badge to show if it's a link */}
                    {imageLinks[index] && (
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-blue-500 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center">
                        <Link size={8} className="mr-0.5 sm:mr-1 sm:hidden" />
                        <Link size={10} className="mr-1 hidden sm:block" />
                        <span className="text-xs">URL</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity touch-target"
                      aria-label="Remove image"
                    >
                      <X size={14} className="sm:hidden" />
                      <X size={16} className="hidden sm:block" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Options */}
            <div className="space-y-3 sm:space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
                  <div className="space-y-1 sm:space-y-2">
                    <label className="cursor-pointer">
                      <span className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        Click to upload images
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      or paste images with Ctrl+V
                    </p>
                    <p className="text-xs text-gray-500 sm:hidden">
                      or paste images
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Image URL Option */}
              <div className="flex items-center justify-center">
                <div className="text-sm text-gray-500">or</div>
              </div>

              {!showLinkInput ? (
                <button
                  type="button"
                  onClick={() => setShowLinkInput(true)}
                  className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                >
                  <Link size={16} className="mr-2" />
                  Add Image from URL
                </button>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddImageUrl()}
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrl.trim() || isValidatingUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isValidatingUrl ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check size={16} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkInput(false);
                        setImageUrl('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 flex items-center"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a direct link to an image (jpg, png, gif, etc.)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              {...register('content', { required: 'Content is required' })}
              rows={4}
              placeholder="Write your thoughts about this anime/manga..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical text-base sm:rows-6"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-white text-base font-medium order-2 sm:order-1 touch-target"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-base font-medium order-1 sm:order-2 touch-target"
            >
              {isLoading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;
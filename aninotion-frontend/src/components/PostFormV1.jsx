import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, Link, Check, Search, Tag } from 'lucide-react';
import { categoriesAPI, postsAPI, animeAPI } from '../services/api';
import CategoryBadge from './CategoryBadge';
import DateDisplay from './DateDisplay';

const PostFormV1 = ({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [categories, setCategories] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageLinks, setImageLinks] = useState([]);
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
  const [hasUserInteractedWithAnime, setHasUserInteractedWithAnime] = useState(false);
  
  const fileInputRef = useRef(null);
  const animeInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  // Watch form values
  const watchCategory = watch('category', '');

  const selectedCategory = categories.find(cat => cat._id === watchCategory);

  // Fetch categories
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEdit && initialData && categories.length > 0 && initialData.category?._id) {
      setValue('category', initialData.category._id);
    }
  }, [categories, isEdit, initialData, setValue]);

  // Populate form data when editing
  useEffect(() => {
    if (isOpen && isEdit && initialData) {
      setValue('title', initialData.title || '');
      setValue('category', initialData.category?._id || '');
      setValue('content', initialData.content || '');
      setValue('status', initialData.status || 'published');
      setValue('excerpt', initialData.excerpt || '');
      setValue('tags', initialData.tags ? initialData.tags.join(', ') : '');
      
      const animeName = initialData.animeName || '';
      setValue('animeName', animeName);
      setAnimeQuery(animeName);
      
      setValue('episodeNumber', initialData.episodeNumber || '');
      setValue('seasonNumber', initialData.seasonNumber || '');
      
      if (initialData.images && initialData.images.length > 0) {
        setImagePreviews(initialData.images);
        setImageLinks(new Array(initialData.images.length).fill(true));
      }
    } else if (isOpen && !isEdit) {
      reset();
      setImagePreviews([]);
      setImageLinks([]);
      setAnimeQuery('');
      setError('');
      setHasUserInteractedWithAnime(false);
    }
    
    if (isOpen) {
      setHasUserInteractedWithAnime(false);
      setShowSuggestions(false);
      setAnimeSuggestions([]);
    }
  }, [isOpen, isEdit, initialData, categories, setValue, reset]);

  // Paste event listener
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

  // Debounced anime search
  useEffect(() => {
    if (!animeQuery.trim() || animeQuery.length < 2 || !hasUserInteractedWithAnime) {
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
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [animeQuery, hasUserInteractedWithAnime]);

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

  const handleAnimeInputChange = (e) => {
    const value = e.target.value;
    setAnimeQuery(value);
    setValue('animeName', value);
    setHasUserInteractedWithAnime(true);
  };

  const handleAnimeInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedAnimeIndex(-1);
    }, 200);
  };

  const handleAnimeInputFocus = () => {
    setHasUserInteractedWithAnime(true);
    if (animeSuggestions.length > 0 && animeQuery.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleAnimeSelect = (anime) => {
    const animeData = anime.node || anime;
    const title = animeData.title;
    setAnimeQuery(title);
    setValue('animeName', title);
    setShowSuggestions(false);
    setSelectedAnimeIndex(-1);
    animeInputRef.current?.focus();
  };

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
      setImageLinks(prev => [...prev, false]);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      handleFileToBase64(file);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = async () => {
    if (!imageUrl.trim()) return;

    try {
      new URL(imageUrl);
    } catch {
      alert('Please enter a valid URL format');
      return;
    }

    setIsValidatingUrl(true);
    
    try {
      setImagePreviews(prev => [...prev, imageUrl]);
      setImageLinks(prev => [...prev, true]);
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
        episodeNumber: data.episodeNumber ? parseInt(data.episodeNumber) : undefined,
        seasonNumber: data.seasonNumber ? parseInt(data.seasonNumber) : undefined,
        category: data.category,
        content: data.content,
        status: data.status || 'published',
        tags: data.tags,
        excerpt: data.excerpt
      };

      if (!isEdit || imagePreviews.length > 0) {
        postData.images = imagePreviews;
        postData.imageTypes = imageLinks;
      }
      
      let result;
      if (isEdit && initialData) {
        result = await postsAPI.update(initialData._id, postData);
      } else {
        result = await postsAPI.create(postData);
      }
      
      await onSubmit(result);
      
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
      console.error(`Error ${isEdit ? 'updating' : 'creating'} post:`, error);
      setError(error.message || `Failed to ${isEdit ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-4 mx-2 sm:mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10 rounded-t-lg">
          <h2 className="text-xl sm:text-2xl font-bold">
            {isEdit ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 touch-target"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form styled as List View Card */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-4 sm:p-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Twitter/X Style Card Layout */}
          <div className="bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-4 rounded-2xl border border-gray-200">
            <div className="flex space-x-3">
              {/* Avatar/Category Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Tag size={20} className="text-primary" />
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Category & Date Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <select
                      {...register('category', { required: 'Category is required' })}
                      className="text-sm font-medium bg-transparent border-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {selectedCategory && <CategoryBadge category={selectedCategory} size="sm" />}
                  </div>
                  <DateDisplay date={new Date()} showIcon={false} className="text-gray-500 text-sm" />
                </div>
                {errors.category && (
                  <p className="text-red-500 text-xs">{errors.category.message}</p>
                )}

                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="What's the title of your post?"
                    className="w-full text-base font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder-gray-400"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Anime Name Input */}
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">📺</span>
                    <input
                      ref={animeInputRef}
                      type="text"
                      value={animeQuery}
                      onChange={handleAnimeInputChange}
                      onKeyDown={handleAnimeKeyDown}
                      onFocus={handleAnimeInputFocus}
                      onBlur={handleAnimeInputBlur}
                      placeholder="Anime/Manga name..."
                      className="flex-1 text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder-gray-400"
                      autoComplete="off"
                    />
                    {isSearchingAnime && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && animeSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {animeSuggestions.map((anime, index) => {
                        const animeData = anime.node || anime;
                        return (
                          <button
                            key={animeData.id}
                            type="button"
                            onClick={() => handleAnimeSelect(anime)}
                            className={`w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-gray-50 text-sm ${
                              index === selectedAnimeIndex ? 'bg-blue-50' : ''
                            }`}
                          >
                            {animeData.main_picture?.medium && (
                              <img
                                src={animeData.main_picture.medium}
                                alt={animeData.title}
                                className="w-8 h-12 object-cover rounded"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <span className="truncate">{animeData.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  <input type="hidden" {...register('animeName', { required: 'Anime name is required' })} />
                  {errors.animeName && (
                    <p className="text-red-500 text-xs mt-1">{errors.animeName.message}</p>
                  )}
                </div>

                {/* Season & Episode Inputs */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Season:</label>
                    <input
                      type="number"
                      {...register('seasonNumber', { min: 1 })}
                      placeholder="1"
                      className="w-12 sm:w-16 text-sm text-gray-600 bg-white border border-gray-300 rounded px-1 sm:px-2 py-1 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Episode:</label>
                    <input
                      type="number"
                      {...register('episodeNumber', { min: 1 })}
                      placeholder="12"
                      className="w-12 sm:w-16 text-sm text-gray-600 bg-white border border-gray-300 rounded px-1 sm:px-2 py-1 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Content Textarea */}
                <div>
                  <textarea
                    {...register('content', { required: 'Content is required' })}
                    rows={4}
                    placeholder="Share your thoughts about this anime..."
                    className="w-full text-sm text-gray-900 leading-relaxed bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder-gray-400 resize-none"
                  />
                  {errors.content && (
                    <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>
                  )}
                </div>

                {/* Images Section */}
                {imagePreviews.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    {imagePreviews.length === 1 ? (
                      <div className="relative group">
                        <img
                          src={imagePreviews[0]}
                          alt="Preview"
                          className="w-full max-h-48 sm:max-h-80 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(0)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : imagePreviews.length === 2 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                        {imagePreviews.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-32 sm:h-48 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : imagePreviews.length === 3 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                        <div className="relative group sm:row-span-2">
                          <img
                            src={imagePreviews[0]}
                            alt="Preview 1"
                            className="w-full h-32 sm:h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(0)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {imagePreviews.slice(1, 3).map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Preview ${idx + 2}`}
                              className="w-full h-24 sm:h-24 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx + 1)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-0.5">
                        {imagePreviews.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-24 sm:h-32 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Image Upload Button */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-sm">
                    <Upload size={16} />
                    <span>Add images</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                    />
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <button
                      type="button"
                      onClick={() => setShowLinkInput(!showLinkInput)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Add URL
                    </button>
                    <span className="text-gray-400 text-xs">or paste (Ctrl+V)</span>
                  </div>
                </div>

                {/* Image URL Input */}
                {showLinkInput && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrl.trim() || isValidatingUrl}
                      className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkInput(false);
                        setImageUrl('');
                      }}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Additional Fields (collapsed by default) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 p-2 bg-gray-50 rounded">
              Additional Options (Tags, Excerpt, Status)
            </summary>
            <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded">
              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  placeholder="action, adventure, comedy"
                  className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  {...register('excerpt')}
                  rows={2}
                  placeholder="Brief summary (auto-generated if empty)"
                  className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </details>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 mt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {isLoading 
                ? (isEdit ? 'Updating...' : 'Creating...') 
                : (isEdit ? 'Update Post' : 'Create Post')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostFormV1;

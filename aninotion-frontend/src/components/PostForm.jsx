import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Link, Check, Search } from 'lucide-react';

// Mock API services - replace with actual imports
const categoriesAPI = { getAll: async () => [] };
const postsAPI = { create: async (data) => data, update: async (id, data) => data };
const animeAPI = { search: async (query, options) => ({ data: [] }) };

const PostForm = ({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [categories, setCategories] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageLinks, setImageLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    animeName: '',
    content: '',
    excerpt: '',
    tags: '',
    status: 'published'
  });
  const [formErrors, setFormErrors] = useState({});

  const [animeQuery, setAnimeQuery] = useState('');
  const [animeSuggestions, setAnimeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAnime, setIsSearchingAnime] = useState(false);
  const [selectedAnimeIndex, setSelectedAnimeIndex] = useState(-1);
  const [hasUserInteractedWithAnime, setHasUserInteractedWithAnime] = useState(false);

  const fileInputRef = useRef(null);
  const animeInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEdit && initialData && categories.length > 0 && initialData.category?._id) {
      setFormData(prev => ({ ...prev, category: initialData.category._id }));
    }
  }, [categories, isEdit, initialData]);

  useEffect(() => {
    if (isOpen && isEdit && initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category?._id || '',
        animeName: initialData.animeName || '',
        content: initialData.content || '',
        excerpt: initialData.excerpt || '',
        tags: initialData.tags ? initialData.tags.join(', ') : '',
        status: initialData.status || 'published'
      });

      const animeName = initialData.animeName || '';
      setAnimeQuery(animeName);

      if (initialData.images && initialData.images.length > 0) {
        setImagePreviews(initialData.images);
        setImageLinks(new Array(initialData.images.length).fill(true));
      }
    } else if (isOpen && !isEdit) {
      setFormData({
        title: '',
        category: '',
        animeName: '',
        content: '',
        excerpt: '',
        tags: '',
        status: 'published'
      });
      setImagePreviews([]);
      setImageLinks([]);
      setAnimeQuery('');
      setError('');
      setFormErrors({});
      setHasUserInteractedWithAnime(false);
    }

    if (isOpen) {
      setHasUserInteractedWithAnime(false);
      setShowSuggestions(false);
      setAnimeSuggestions([]);
    }
  }, [isOpen, isEdit, initialData, categories]);

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

  useEffect(() => {
    if (!animeQuery.trim() || animeQuery.length < 2) {
      setAnimeSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!hasUserInteractedWithAnime) {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAnimeInputChange = (e) => {
    const value = e.target.value;
    setAnimeQuery(value);
    setFormData(prev => ({ ...prev, animeName: value }));
    setHasUserInteractedWithAnime(true);
    if (formErrors.animeName) {
      setFormErrors(prev => ({ ...prev, animeName: '' }));
    }
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
    setFormData(prev => ({ ...prev, animeName: title }));
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
    } catch (e) {
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

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.animeName.trim()) errors.animeName = 'Anime/Manga name is required';
    if (!formData.content.trim()) errors.content = 'Content is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const postData = {
        title: formData.title,
        animeName: formData.animeName,
        category: formData.category,
        content: formData.content,
        status: formData.status,
        tags: formData.tags,
        excerpt: formData.excerpt
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

      setFormData({
        title: '',
        category: '',
        animeName: '',
        content: '',
        excerpt: '',
        tags: '',
        status: 'published'
      });
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
      <div className="bg-white rounded-2xl max-w-4xl w-full my-4 mx-2 sm:mx-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="px-6 py-6">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Featured Image Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Featured Image
              </label>
              
              {imagePreviews.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative group rounded-xl overflow-hidden">
                    <img
                      src={imagePreviews[0]}
                      alt="Featured"
                      className="w-full h-64 sm:h-80 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(0)}
                      className="absolute top-3 right-3 bg-white text-gray-700 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                    {imageLinks[0] && (
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg">
                        <Link size={12} className="mr-1" />
                        <span>URL</span>
                      </div>
                    )}
                  </div>

                  {imagePreviews.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {imagePreviews.slice(1).map((preview, index) => (
                        <div key={index + 1} className="relative group rounded-lg overflow-hidden">
                          <img
                            src={preview}
                            alt={`Preview ${index + 2}`}
                            className="w-full h-20 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index + 1)}
                            className="absolute -top-1 -right-1 bg-white text-gray-700 rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                          {imageLinks[index + 1] && (
                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                              <Link size={8} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-base font-medium text-blue-600 hover:text-blue-700">
                        Click to upload
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
                    <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              )}

              <div className="mt-3">
                {!showLinkInput ? (
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
                  >
                    <Link size={14} className="mr-1" />
                    Add image from URL
                  </button>
                ) : (
                  <div className="flex space-x-2 mt-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddImageUrl()}
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrl.trim() || isValidatingUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Post title"
                className="w-full px-0 py-2 text-3xl sm:text-4xl font-bold border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 focus:outline-none placeholder-gray-300"
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-2">{formErrors.title}</p>
              )}
            </div>

            {/* Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                  <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center mr-2 text-xs">📁</span>
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
                )}
              </div>

              <div className="relative">
                <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                  <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center mr-2 text-xs">🎬</span>
                  Anime/Manga
                </label>
                <div className="relative">
                  <input
                    ref={animeInputRef}
                    type="text"
                    value={animeQuery}
                    onChange={handleAnimeInputChange}
                    onKeyDown={handleAnimeKeyDown}
                    onFocus={handleAnimeInputFocus}
                    onBlur={handleAnimeInputBlur}
                    placeholder="Search anime..."
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    autoComplete="off"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isSearchingAnime ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : (
                      <Search size={20} className="text-gray-400" />
                    )}
                  </div>

                  {showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseUp={(e) => e.preventDefault()}
                    >
                      {animeSuggestions.length > 0 ? (
                        <div className="py-2">
                          {animeSuggestions.map((anime, index) => {
                            const animeData = anime.node || anime;
                            return (
                              <button
                                key={animeData.id}
                                type="button"
                                onClick={() => handleAnimeSelect(anime)}
                                className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-blue-50 transition-colors ${
                                  index === selectedAnimeIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                }`}
                              >
                                {animeData.main_picture?.medium && (
                                  <img
                                    src={animeData.main_picture.medium}
                                    alt={animeData.title}
                                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {animeData.title}
                                  </div>
                                  {animeData.alternative_titles?.en && (
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
                                {animeData.mean && (
                                  <div className="text-yellow-600 flex-shrink-0">
                                    <span className="text-sm font-medium">★ {animeData.mean.toFixed(1)}</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          {isSearchingAnime ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span>Searching...</span>
                            </div>
                          ) : (
                            <div className="text-sm">No results found</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formErrors.animeName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.animeName}</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={8}
                placeholder="Write your thoughts..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-base leading-relaxed"
              />
              {formErrors.content && (
                <p className="text-red-500 text-sm mt-1">{formErrors.content}</p>
              )}
            </div>

            {/* Excerpt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={2}
                placeholder="Brief summary..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-base"
              />
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="action, adventure, comedy"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
            </div>

            {/* Status */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
          >
            {isLoading
              ? (isEdit ? 'Updating...' : 'Publishing...')
              : (isEdit ? 'Update Post' : 'Publish Post')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostForm;
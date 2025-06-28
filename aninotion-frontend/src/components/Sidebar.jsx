import React, { useState, useEffect } from 'react';
import { Home, Film, BookOpen, Plus, X, Database } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { categoriesAPI } from '../services/api';

const Sidebar = ({ activeCategory, onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const location = useLocation();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoriesAPI.create({ name: newCategoryName.trim() });
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const getCategoryIcon = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'anime':
        return <Film size={20} />;
      case 'manga':
        return <BookOpen size={20} />;
      default:
        return <Plus size={20} />;
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen p-4">
      <h1 className="text-2xl font-bold text-primary mb-8">AniNotion</h1>
      
      <nav className="space-y-2">
        {/* Home */}
        <Link
          to="/"
          onClick={() => onCategoryChange(null)}
          className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-100 ${
            location.pathname === '/' && activeCategory === null ? 'bg-primary/10 text-primary' : ''
          }`}
        >
          <Home size={20} />
          <span>Home</span>
        </Link>

        {/* Raw Data */}
        <Link
          to="/raw"
          className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-100 ${
            location.pathname === '/raw' ? 'bg-primary/10 text-primary' : ''
          }`}
        >
          <Database size={20} />
          <span>Raw Data</span>
        </Link>
        
        {/* Categories */}
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => onCategoryChange(category)}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-100 ${
              activeCategory?._id === category._id && location.pathname === '/' ? 'bg-primary/10 text-primary' : ''
            }`}
          >
            {getCategoryIcon(category.name)}
            <span>{category.name}</span>
          </button>
        ))}

        {/* Add Category */}
        {showAddCategory ? (
          <div className="p-3 border border-gray-300 rounded-lg">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full p-2 text-sm border border-gray-300 rounded mb-2"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddCategory}
                className="flex-1 bg-primary text-white text-sm py-1 px-3 rounded hover:bg-primary/90"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 text-sm py-1 px-3 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCategory(true)}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-100 text-gray-600"
          >
            <Plus size={20} />
            <span>Add Category</span>
          </button>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
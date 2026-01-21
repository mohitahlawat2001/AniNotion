const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const logger = require('../config/logger');
const { optionalAuth } = require('../middleware/auth');

// Helper function to get role hierarchy value
const getRoleValue = (role) => {
  const roleHierarchy = { 'viewer': 1, 'paid': 2, 'editor': 3, 'admin': 4 };
  return roleHierarchy[role] || 0;
};

// Helper function to filter categories based on user role
const filterCategoriesByRole = (categories, userRole) => {
  return categories.filter(category => {
    // If no minRole is set, category is visible to everyone
    if (!category.minRole) return true;
    
    // If no user role provided (not authenticated), can only see categories with no minRole
    if (!userRole) return false;
    
    // Check role hierarchy
    return getRoleValue(userRole) >= getRoleValue(category.minRole);
  });
};

// Get all categories
router.get('/', optionalAuth, async (req, res) => {
  try {
    logger.info("📂 Fetching all categories");
    const categories = await Category.find().sort({ createdAt: -1 });
    
    // Filter categories based on user role
    const userRole = req.user?.role;
    const filteredCategories = filterCategoriesByRole(categories, userRole);
    
    logger.info("✅ Categories fetched successfully", {
      totalCount: categories.length,
      filteredCount: filteredCategories.length,
      userRole: userRole || 'anonymous'
    });
    
    res.json(filteredCategories);
  } catch (error) {
    logger.error("❌ Error fetching categories:", {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Create new category
router.post('/', async (req, res) => {
  try {
    const { name, minRole } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    logger.info("📝 Creating new category", {
      name,
      slug,
      minRole: minRole || 'none (visible to all)'
    });
    
    // Validate minRole if provided
    if (minRole && !['viewer', 'paid', 'editor', 'admin'].includes(minRole)) {
      return res.status(400).json({ 
        message: 'Invalid minRole. Must be one of: viewer, paid, editor, admin, or null' 
      });
    }
    
    const category = new Category({
      name,
      slug,
      isDefault: false,
      minRole: minRole || null // null means visible to all
    });
    
    const savedCategory = await category.save();
    
    logger.info("✅ Category created successfully", {
      id: savedCategory._id,
      name: savedCategory.name,
      slug: savedCategory.slug,
      minRole: savedCategory.minRole || 'none (visible to all)'
    });
    
    res.status(201).json(savedCategory);
  } catch (error) {
    logger.error("❌ Error creating category:", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(400).json({ message: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    logger.info("🗑️ Deleting category", {
      categoryId: req.params.id
    });

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      logger.warn("⚠️ Category not found for deletion", {
        categoryId: req.params.id
      });
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.isDefault) {
      logger.warn("⚠️ Attempt to delete default category", {
        categoryId: req.params.id,
        categoryName: category.name
      });
      return res.status(400).json({ message: 'Cannot delete default categories' });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    logger.info("✅ Category deleted successfully", {
      categoryId: req.params.id,
      categoryName: category.name
    });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error("❌ Error deleting category:", {
      error: error.message,
      stack: error.stack,
      categoryId: req.params.id
    });
    
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
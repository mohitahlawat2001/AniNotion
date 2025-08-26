const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const logger = require('../config/logger');

// Get all categories
router.get('/', async (req, res) => {
  try {
    logger.info("📂 Fetching all categories");
    const categories = await Category.find().sort({ createdAt: -1 });
    
    logger.info("✅ Categories fetched successfully", {
      count: categories.length
    });
    
    res.json(categories);
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
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    logger.info("📝 Creating new category", {
      name,
      slug
    });
    
    const category = new Category({
      name,
      slug,
      isDefault: false
    });
    
    const savedCategory = await category.save();
    
    logger.info("✅ Category created successfully", {
      id: savedCategory._id,
      name: savedCategory.name,
      slug: savedCategory.slug
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
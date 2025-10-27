/**
 * Migration Script: Add minRole field to existing categories
 * 
 * This script adds the minRole field to all existing categories,
 * setting it to null (visible to all) to maintain backward compatibility.
 * 
 * Usage: node scripts/migrate-add-minrole.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const logger = require('../config/logger');

async function migrateCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Find all categories that don't have minRole field
    const categories = await Category.find({ minRole: { $exists: false } });
    
    logger.info(`Found ${categories.length} categories without minRole field`);

    if (categories.length === 0) {
      logger.info('No categories to migrate. All categories already have minRole field.');
      return;
    }

    // Update each category to have minRole: null (visible to all)
    for (const category of categories) {
      category.minRole = null;
      await category.save();
      logger.info(`Updated category: ${category.name} (${category._id}) - minRole set to null`);
    }

    logger.info('✅ Migration completed successfully');
    logger.info(`Updated ${categories.length} categories`);

  } catch (error) {
    logger.error('❌ Migration failed:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateCategories();

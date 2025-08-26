const mongoose = require('mongoose');
const Category = require('../models/Category');
const logger = require('../config/logger');
require('dotenv').config();

const defaultCategories = [
  { name: 'Anime', slug: 'anime', isDefault: true },
  { name: 'Manga', slug: 'manga', isDefault: true },
  { name: 'Other', slug: 'other', isDefault: true }
];

const seedCategories = async () => {
  try {
    logger.info("🌱 Starting category seeding process");
    
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("✅ Connected to MongoDB for seeding");
    
    // Clear existing categories
    const deleteResult = await Category.deleteMany({});
    logger.info("🗑️ Cleared existing categories", {
      deletedCount: deleteResult.deletedCount
    });
    
    // Insert default categories
    const insertResult = await Category.insertMany(defaultCategories);
    logger.info("✅ Default categories seeded successfully", {
      insertedCount: insertResult.length,
      categories: insertResult.map(cat => ({ name: cat.name, slug: cat.slug }))
    });
    
    console.log('Default categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error seeding categories:", {
      error: error.message,
      stack: error.stack
    });
    
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
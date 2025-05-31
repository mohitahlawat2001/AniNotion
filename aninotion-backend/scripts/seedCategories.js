const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const defaultCategories = [
  { name: 'Anime', slug: 'anime', isDefault: true },
  { name: 'Manga', slug: 'manga', isDefault: true },
  { name: 'Other', slug: 'other', isDefault: true }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing categories
    await Category.deleteMany({});
    
    // Insert default categories
    await Category.insertMany(defaultCategories);
    
    console.log('Default categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
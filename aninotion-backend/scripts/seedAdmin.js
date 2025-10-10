#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../config/logger');
require('dotenv').config({ path: __dirname + '/../.env' });

/**
 * Seed script to create an admin user
 */
const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info("🔗 Connected to MongoDB for seeding");
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${existingAdmin.email}`);
      process.exit(0);
    }
    
    // Get admin details from command line or use defaults
    const email = process.argv[2] || 'admin@aninotion.com';
    const password = process.argv[3] || 'admin123456';
    const name = process.argv[4] || 'Administrator';
    
    // Check if email is already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(`❌ Email ${email} is already taken`);
      process.exit(1);
    }
    
    // Create admin user
    const admin = new User({
      email,
      name,
      password, // Will be hashed by the model
      role: 'admin'
    });
    
    await admin.save();
    
    console.log(`
    🎉 Admin user created successfully!
    
    📧 Email: ${admin.email}
    👤 Name: ${admin.name}
    🔑 Password: ${password}
    👑 Role: ${admin.role}
    
    ⚠️  IMPORTANT: Change the password after first login!
    
    You can now login at: POST /api/auth/login
    `);
    
    logger.info("✅ Admin user seeded successfully", {
      email: admin.email,
      name: admin.name,
      role: admin.role
    });
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    logger.error("Failed to seed admin user:", {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node scripts/seedAdmin.js [email] [password] [name]

Arguments:
  email     Admin email address (default: admin@aninotion.com)
  password  Admin password (default: admin123456)
  name      Admin display name (default: Administrator)

Examples:
  node scripts/seedAdmin.js
  node scripts/seedAdmin.js myemail@example.com mypassword "My Name"

Note: All arguments are optional. Defaults will be used if not provided.
  `);
  process.exit(0);
}

// Run the seeding
seedAdmin();

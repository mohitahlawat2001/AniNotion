const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('@models/User');
const Category = require('@models/Category');

let mongoServer;
let app;

/**
 * Setup test server and database
 */
async function setupTestServer() {
  // Create MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  // Create Express app
  app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Import routes
  const postsRouter = require('../../../aninotion-backend/routes/posts');
  const categoriesRouter = require('../../../aninotion-backend/routes/categories');
  const usersRouter = require('../../../aninotion-backend/routes/users');
  
  // Mount routes
  app.use('/api/posts', postsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/users', usersRouter);
  
  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      message: err.message,
      error: process.env.NODE_ENV === 'test' ? err : {}
    });
  });
  
  return app;
}

/**
 * Teardown test server and database
 */
async function teardownTestServer() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  mongoServer = null;
  app = null;
}

/**
 * Clear all collections
 */
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Create test user
 */
async function createTestUser(overrides = {}) {
  const userData = {
    email: 'test@example.com',
    role: 'viewer',
    status: 'active',
    authProvider: 'local',
    ...overrides
  };
  
  const user = new User(userData);
  if (overrides.password) {
    user.password = overrides.password;
  } else if (!overrides.passwordHash) {
    user.password = 'password123';
  }
  
  await user.save();
  return user;
}

/**
 * Create test category
 */
async function createTestCategory(overrides = {}) {
  const categoryData = {
    name: 'Test Category',
    slug: 'test-category',
    isDefault: false,
    ...overrides
  };
  
  return await Category.create(categoryData);
}

/**
 * Generate JWT token for user
 */
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );
}

/**
 * Create authenticated request headers
 */
function authHeaders(user) {
  const token = generateToken(user);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

module.exports = {
  setupTestServer,
  teardownTestServer,
  clearDatabase,
  createTestUser,
  createTestCategory,
  generateToken,
  authHeaders
};
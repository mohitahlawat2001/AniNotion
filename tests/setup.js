// Global test setup
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.BCRYPT_ROUNDS = '10'; // Lower rounds for faster tests

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test utilities
global.testUtils = {
  // Helper to create test user data
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    passwordHash: 'hashedpassword123',
    role: 'viewer',
    status: 'active',
    authProvider: 'local',
    ...overrides,
  }),
  
  // Helper to create test post data
  createTestPost: (categoryId, overrides = {}) => ({
    title: 'Test Post',
    animeName: 'Test Anime',
    category: categoryId,
    content: 'This is test content for the post.',
    status: 'published',
    ...overrides,
  }),
  
  // Helper to create test category data
  createTestCategory: (overrides = {}) => ({
    name: 'Test Category',
    slug: 'test-category',
    isDefault: false,
    ...overrides,
  }),
};
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'aninotion-backend/**/*.js',
    '!aninotion-backend/node_modules/**',
    '!aninotion-backend/coverage/**',
    '!aninotion-backend/scripts/**',
    '!aninotion-backend/test-user.js',
    '!aninotion-backend/server.js', // Exclude server entry point
  ],
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@models/(.*)$': '<rootDir>/aninotion-backend/models/$1',
    '^@utils/(.*)$': '<rootDir>/aninotion-backend/utils/$1',
    '^@middleware/(.*)$': '<rootDir>/aninotion-backend/middleware/$1',
    '^@config/(.*)$': '<rootDir>/aninotion-backend/config/$1',
    '^@routes/(.*)$': '<rootDir>/aninotion-backend/routes/$1',
  },
  
  // Timeout for tests
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
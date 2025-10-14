# AniNotion Tests

This directory contains all automated tests for the AniNotion project.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Directory Structure

```
tests/
├── setup.js                    # Global test configuration and utilities
├── unit/                       # Unit tests
│   ├── utils/                  # Utility function tests
│   │   ├── postHelpers.test.js
│   │   └── helpers.test.js
│   └── models/                 # Model validation tests
│       ├── Post.test.js
│       ├── User.test.js
│       └── Category.test.js
└── integration/                # Integration tests
    ├── helpers/                # Test helpers and utilities
    │   └── testServer.js
    └── api/                    # API endpoint tests
        └── posts.test.js
```

## Test Types

### Unit Tests (`tests/unit/`)

Test individual functions and utilities in isolation without external dependencies.

**Coverage:**

- `utils/postHelpers.test.js`: Tests for post-related utility functions

  - generateExcerpt
  - calculateReadingTime
  - processTags
  - isValidStatusTransition
  - buildPostQuery

- `utils/helpers.test.js`: Tests for general utility functions
  - slugify
  - generateUniqueSlug
  - validators (email, url, objectId, etc.)
  - sanitizers (html, text, searchQuery)
  - textUtils (truncate, excerpt, wordCount, readingTime)
  - arrayUtils (unique, chunk, shuffle)
  - dateUtils (formatDate, timeAgo)
  - generateId, generateHash, deepClone

### Model Tests (`tests/unit/models/`)

Test database models, schema validation, and model methods using MongoDB Memory Server.

**Coverage:**

- `Post.test.js`: Post model validation and methods

  - Schema validation (required fields, defaults)
  - Status management
  - Pre-save middleware (excerpt, reading time, publishedAt)
  - Instance methods (incrementViews, generateExcerpt, calculateReadingTime)
  - Static methods (findPublished)
  - Tags handling
  - User references
  - Soft delete

- `User.test.js`: User model validation and methods

  - Schema validation
  - Role management
  - OAuth support
  - Status management
  - Password hashing
  - Instance methods (comparePassword, updateLastLogin, toJSON)
  - User references
  - Deletion tracking

- `Category.test.js`: Category model validation
  - Schema validation
  - Default category handling
  - Timestamps
  - CRUD operations

### Integration Tests (`tests/integration/`)

Test API endpoints and their interactions with the database and authentication.

**Coverage:**

- `api/posts.test.js`: Posts API endpoints
  - POST /api/posts (create post)
  - GET /api/posts (list posts with filters and pagination)
  - GET /api/posts/:identifier (get single post by ID or slug)
  - PUT /api/posts/:id (update post)
  - DELETE /api/posts/:id (soft delete post)
  - Authentication and authorization
  - Permission-based access control

## Test Utilities

### Global Utilities (`tests/setup.js`)

Available via `global.testUtils`:

```javascript
// Create test user data
testUtils.createTestUser({ email: "test@example.com", role: "editor" });

// Create test post data
testUtils.createTestPost(categoryId, { title: "Custom Title" });

// Create test category data
testUtils.createTestCategory({ name: "Action", slug: "action" });
```

### Integration Test Helpers (`tests/integration/helpers/testServer.js`)

```javascript
// Setup test server with routes
const app = await setupTestServer();

// Teardown test server and database
await teardownTestServer();

// Clear all database collections
await clearDatabase();

// Create test user with password hashing
const user = await createTestUser({ email: "test@example.com", role: "admin" });

// Create test category
const category = await createTestCategory({ name: "Action" });

// Generate JWT token for user
const token = generateToken(user);

// Get authentication headers
const headers = authHeaders(user);
```

## Running Specific Tests

### Run only unit tests

```bash
npm run test:unit
```

### Run only integration tests

```bash
npm run test:integration
```

### Run a specific test file

```bash
npm test -- tests/unit/utils/postHelpers.test.js
```

### Run tests matching a pattern

```bash
npm test -- --testNamePattern="should create post"
```

## Writing New Tests

### 1. Choose the Right Test Type

- **Unit Test**: Testing a pure function or utility
- **Model Test**: Testing database schema or model methods
- **Integration Test**: Testing API endpoints or complex workflows

### 2. Follow the Test Structure

```javascript
describe("Feature or Component", () => {
  // Setup
  beforeAll(async () => {
    // One-time setup (e.g., database connection)
  });

  afterAll(async () => {
    // One-time cleanup
  });

  beforeEach(async () => {
    // Setup before each test (e.g., create test data)
  });

  afterEach(async () => {
    // Cleanup after each test (e.g., clear database)
  });

  describe("Specific functionality", () => {
    test("should do something specific", async () => {
      // Arrange: Set up test data
      const input = "test input";

      // Act: Execute the function/endpoint
      const result = functionToTest(input);

      // Assert: Verify the result
      expect(result).toBe("expected output");
    });
  });
});
```

### 3. Use Descriptive Test Names

✅ Good:

```javascript
test("should return 404 when post does not exist", async () => {
  // ...
});
```

❌ Bad:

```javascript
test("test post endpoint", async () => {
  // ...
});
```

### 4. Test Both Success and Failure Cases

```javascript
describe("POST /api/posts", () => {
  test("should create post with valid data", async () => {
    // Test success case
  });

  test("should return 400 when required fields are missing", async () => {
    // Test validation failure
  });

  test("should return 401 when not authenticated", async () => {
    // Test authentication failure
  });

  test("should return 403 when user lacks permission", async () => {
    // Test authorization failure
  });
});
```

## Coverage Goals

- **Utility Functions**: 90%+ coverage
- **Models**: 80%+ coverage
- **API Routes**: 70%+ coverage
- **Overall Project**: 75%+ coverage

View coverage report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Debugging Tests

### Enable verbose output

```bash
npm test -- --verbose
```

### Run tests in debug mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### Increase timeout for slow tests

```javascript
jest.setTimeout(60000); // 60 seconds
```

## Common Patterns

### Testing Async Functions

```javascript
test("should handle async operation", async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Errors

```javascript
test("should throw error for invalid input", async () => {
  await expect(functionThatThrows()).rejects.toThrow("Error message");
});
```

### Testing API Endpoints

```javascript
test("should return 200 and data", async () => {
  const response = await request(app)
    .get("/api/endpoint")
    .set(authHeaders(user))
    .expect(200);

  expect(response.body).toHaveProperty("data");
});
```

## Best Practices

1. **Keep tests independent**: Each test should work in isolation
2. **Use factories**: Create test data with helper functions
3. **Clean up**: Always clean up test data after tests
4. **Mock external services**: Don't make real API calls in tests
5. **Test edge cases**: Test boundary conditions and error cases
6. **Keep tests fast**: Unit tests should run in milliseconds
7. **Use meaningful assertions**: Be specific about what you're testing

## Troubleshooting

### Tests timeout

- Increase Jest timeout in `jest.config.js`
- Check for unresolved promises
- Ensure database connections are properly closed

### MongoDB Memory Server fails to start

- Check available disk space
- Increase timeout for `beforeAll` hooks
- Try a different MongoDB version in configuration

### Module not found errors

- Verify path aliases in `jest.config.js`
- Check that files exist at specified paths
- Ensure dependencies are installed

## Additional Resources

- [Main Testing Documentation](../docs/TESTING.md)
- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

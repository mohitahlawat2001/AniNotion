# Testing Guide for AniNotion

This document describes the testing setup and practices for the AniNotion project.

## Table of Contents

- [Overview](#overview)
- [Testing Framework](#testing-framework)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Continuous Integration](#continuous-integration)

## Overview

AniNotion uses **Jest** as the primary testing framework with the following test types:

- **Unit Tests**: Test individual functions and utilities in isolation
- **Model Tests**: Test database models and their validation logic
- **Integration Tests**: Test API endpoints and their interactions

## Testing Framework

### Dependencies

- **Jest**: Testing framework
- **Supertest**: HTTP assertion library for API testing
- **MongoDB Memory Server**: In-memory MongoDB for testing

### Configuration

The Jest configuration is located in `jest.config.js` at the project root.

Key configuration options:

- Test environment: Node.js
- Coverage reporting: Text, LCOV, and HTML formats
- Module path aliases for cleaner imports
- 30-second timeout for tests

## Test Structure

```
tests/
├── setup.js                    # Global test setup
├── unit/                       # Unit tests
│   ├── utils/
│   │   ├── postHelpers.test.js    # Post utility functions (50+ tests)
│   │   └── helpers.test.js        # General helper functions (80+ tests)
│   ├── models/
│   │   ├── Post.test.js           # Post model validation (30+ tests)
│   │   ├── User.test.js           # User model validation (20+ tests)
│   │   └── Category.test.js       # Category model validation (10+ tests)
│   └── middleware/
│       ├── auth.test.js           # Authentication middleware (20+ tests)
│       └── roleAuth.test.js       # Role authorization middleware (25+ tests)
└── integration/                # Integration tests
    ├── helpers/
    │   └── testServer.js          # Test server setup utilities
    └── api/
        ├── posts.test.js          # Posts API endpoints (30+ tests)
        └── categories.test.js     # Categories API endpoints (20+ tests)
```

**Total Test Count: 285+ tests**

## Running Tests

### Install Dependencies

First, install the testing dependencies:

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

Automatically re-run tests when files change:

```bash
npm run test:watch
```

### Run Tests with Coverage

Generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view the detailed report.

### Run Specific Test Suites

Run only unit tests:

```bash
npm run test:unit
```

Run only integration tests:

```bash
npm run test:integration
```

Run a specific test file:

```bash
npm test -- tests/unit/utils/postHelpers.test.js
```

Run tests matching a pattern:

```bash
npm test -- --testNamePattern="should create post"
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions in isolation.

**Example: Testing a utility function**

```javascript
const {
  generateExcerpt,
} = require("../../../aninotion-backend/utils/postHelpers");

describe("generateExcerpt", () => {
  test("should generate excerpt from plain text", () => {
    const content = "This is a simple text content that should be excerpted.";
    const excerpt = generateExcerpt(content, 20);

    expect(excerpt).toBe("This is a simple...");
  });

  test("should remove HTML tags from content", () => {
    const content = "<p>This is <strong>HTML</strong> content.</p>";
    const excerpt = generateExcerpt(content, 30);

    expect(excerpt).not.toContain("<p>");
    expect(excerpt).toContain("This is HTML content");
  });
});
```

### Model Tests

Model tests verify database schema validation and model methods.

**Example: Testing a model**

```javascript
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Post = require("@models/Post");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Post Model", () => {
  test("should create a valid post", async () => {
    const post = await Post.create({
      title: "Test Post",
      animeName: "Test Anime",
      category: categoryId,
      content: "Test content",
    });

    expect(post._id).toBeDefined();
    expect(post.title).toBe("Test Post");
  });

  test("should fail without required fields", async () => {
    const post = new Post({ title: "Incomplete" });
    await expect(post.save()).rejects.toThrow();
  });
});
```

### Integration Tests

Integration tests verify API endpoints and their behavior.

**Example: Testing an API endpoint**

```javascript
const request = require("supertest");
const {
  setupTestServer,
  createTestUser,
  authHeaders,
} = require("../helpers/testServer");

let app;
let testUser;

beforeAll(async () => {
  app = await setupTestServer();
});

beforeEach(async () => {
  testUser = await createTestUser({ role: "editor" });
});

describe("POST /api/posts", () => {
  test("should create post as editor", async () => {
    const postData = {
      title: "Test Post",
      animeName: "Test Anime",
      category: categoryId,
      content: "Test content",
    };

    const response = await request(app)
      .post("/api/posts")
      .set(authHeaders(testUser))
      .send(postData)
      .expect(201);

    expect(response.body.title).toBe("Test Post");
  });
});
```

## Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use clear, descriptive test names
- Follow the Arrange-Act-Assert pattern

### 2. Test Independence

- Each test should be independent and not rely on other tests
- Use `beforeEach` and `afterEach` to set up and tear down test data
- Clear database between tests

### 3. Mock External Dependencies

- Mock external API calls
- Use in-memory database for testing
- Mock file system operations when appropriate

### 4. Coverage Goals

Aim for the following coverage targets:

- **Utility Functions**: 90%+ coverage
- **Models**: 80%+ coverage
- **API Routes**: 70%+ coverage
- **Overall**: 75%+ coverage

### 5. Test Data

- Use factories or helper functions to create test data
- Keep test data minimal and focused
- Use realistic but safe test values

### 6. Assertions

- Use specific assertions (e.g., `toBe`, `toEqual`, `toContain`)
- Test both success and failure cases
- Verify error messages and status codes

### 7. Async Testing

- Always use `async/await` for asynchronous tests
- Ensure promises are properly awaited
- Handle errors appropriately

## Test Helpers

### Global Test Utilities

Available in `tests/setup.js`:

```javascript
// Create test user data
global.testUtils.createTestUser({ email: "test@example.com" });

// Create test post data
global.testUtils.createTestPost(categoryId, { title: "Custom Title" });

// Create test category data
global.testUtils.createTestCategory({ name: "Action" });
```

### Integration Test Helpers

Available in `tests/integration/helpers/testServer.js`:

```javascript
// Setup test server
const app = await setupTestServer();

// Create test user
const user = await createTestUser({ role: "admin" });

// Generate auth token
const token = generateToken(user);

// Get auth headers
const headers = authHeaders(user);

// Clear database
await clearDatabase();
```

## Continuous Integration

### GitHub Actions

A comprehensive CI/CD workflow is configured in `.github/workflows/test.yml` that automatically runs tests on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

**Workflow Features:**

- **Matrix Testing**: Tests run on Node.js 18.x and 20.x
- **Separate Test Jobs**: Unit and integration tests run separately for better visibility
- **Coverage Reporting**: Generates and uploads coverage reports to Codecov
- **Coverage Comments**: Automatically comments coverage changes on pull requests
- **Lint Checking**: Runs ESLint if configured
- **Test Summary**: Provides a summary of test results in GitHub Actions UI
- **Artifacts**: Uploads coverage reports as artifacts (retained for 7 days)

**Environment Variables:**

The workflow sets the following environment variables for tests:

- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret-for-ci`
- `BCRYPT_ROUNDS=10`

**Viewing Results:**

1. Go to the "Actions" tab in your GitHub repository
2. Click on the latest workflow run
3. View test results, coverage reports, and logs
4. Download coverage artifacts if needed

### Pre-commit Hooks

Consider adding pre-commit hooks to run tests before committing:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

## Debugging Tests

### Run Tests in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome and click "inspect".

### Verbose Output

```bash
npm test -- --verbose
```

### Run Single Test

```bash
npm test -- --testNamePattern="specific test name"
```

### Disable Coverage

For faster test runs during development:

```bash
npm test -- --coverage=false
```

## Common Issues

### MongoDB Memory Server Timeout

If tests timeout during MongoDB setup, increase the timeout:

```javascript
jest.setTimeout(60000); // 60 seconds
```

### Port Already in Use

If integration tests fail due to port conflicts, ensure no other instances are running.

### Module Not Found

Ensure path aliases in `jest.config.js` match your project structure.

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before submitting PR
3. Maintain or improve code coverage
4. Update this documentation if adding new test patterns

## Support

For questions or issues with testing:

- Check existing test files for examples
- Review Jest documentation
- Ask in project discussions or issues

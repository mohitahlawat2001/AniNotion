const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { requireAuth, requireRole, optionalAuth } = require('@middleware/auth');
const User = require('@models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

// Helper to create mock request and response objects
const createMockReqRes = () => {
  const req = {
    headers: {},
    ip: '127.0.0.1',
    originalUrl: '/test',
    get: jest.fn().mockReturnValue('Test User Agent'),
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

// Helper to generate valid JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
};

describe('requireAuth Middleware', () => {
  test('should pass authentication with valid token', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      role: 'editor',
      status: 'active',
    });

    const token = generateToken(user._id);
    const { req, res, next } = createMockReqRes();
    req.headers.authorization = `Bearer ${token}`;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(user._id.toString());
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject request without authorization header', async () => {
    const { req, res, next } = createMockReqRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
      message: 'Please provide a valid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with malformed authorization header', async () => {
    const { req, res, next } = createMockReqRes();
    req.headers.authorization = 'InvalidFormat token123';

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
      message: 'Please provide a valid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token', async () => {
    const { req, res, next } = createMockReqRes();
    req.headers.authorization = 'Bearer invalid-token';

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication failed',
      message: 'Invalid or expired token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with expired token', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      role: 'editor',
      status: 'active',
    });

    const expiredToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // Expired 1 hour ago
    );

    const { req, res, next } = createMockReqRes();
    req.headers.authorization = `Bearer ${expiredToken}`;

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication failed',
      message: 'Invalid or expired token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request when user does not exist', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const token = generateToken(nonExistentUserId);

    const { req, res, next } = createMockReqRes();
    req.headers.authorization = `Bearer ${token}`;

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication failed',
      message: 'User account not found',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request when user is disabled', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      role: 'editor',
      status: 'disabled',
    });

    const token = generateToken(user._id);
    const { req, res, next } = createMockReqRes();
    req.headers.authorization = `Bearer ${token}`;

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication failed',
      message: 'User account is disabled',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole Middleware', () => {
  test('should allow user with correct role', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'admin' };

    const middleware = requireRole('admin', 'editor');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should allow user with one of multiple allowed roles', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'editor' };

    const middleware = requireRole('admin', 'editor');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject user without required role', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'viewer' };

    const middleware = requireRole('admin', 'editor');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Insufficient permissions',
      message: 'Required role: admin or editor',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request without user object', () => {
    const { req, res, next } = createMockReqRes();
    // No req.user set

    const middleware = requireRole('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required',
      message: 'Please login first',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should work with single role', () => {
    const { req, res, next } = createMockReqRes();
    req.user = { _id: 'user123', role: 'admin' };

    const middleware = requireRole('admin');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('optionalAuth Middleware', () => {
  test('should add user to request with valid token', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      role: 'editor',
      status: 'active',
    });

    const token = generateToken(user._id);
    const { req, res, next } = createMockReqRes();
    req.headers.authorization = `Bearer ${token}`;

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(user._id.toString());
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should continue without user when no token provided', async () => {
    const { req, res, next } = createMockReqRes();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should continue without user when token is invalid', async () => {
    const { req, res, next } = createMockReqRes();
    req.headers.authorization = 'Bearer invalid-token';

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should not add disabled user to request', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      role: 'editor',
      status: 'disabled',
    });

    const token = generateToken(user._id);
    const { req, res, next } = createMockReqRes();
    req.headers.authorization = `Bearer ${token}`;

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should continue when user does not exist', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const token = generateToken(nonExistentUserId);

    const { req, res, next } = createMockReqRes();
    req.headers.authorization = `Bearer ${token}`;

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should continue with malformed authorization header', async () => {
    const { req, res, next } = createMockReqRes();
    req.headers.authorization = 'InvalidFormat token123';

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });
});
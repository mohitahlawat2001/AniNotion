const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../aninotion-backend/models/User');

let mongoServer;

beforeAll(async () => {
  // Increase timeout for setup
  jest.setTimeout(30000);

  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Create MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database with proper options
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Wait for connection to be ready
  await mongoose.connection.asPromise();
}, 30000);

afterAll(async () => {
  // Clean up all collections
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    
    await mongoose.disconnect();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

afterEach(async () => {
  // Clean up after each test
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({});
  }
});

describe('User Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid user with required fields', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'viewer'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.role).toBe('viewer');
      expect(savedUser.status).toBe('active'); // default
      expect(savedUser.authProvider).toBe('local'); // default
    });

    test('should fail without email', async () => {
      const user = new User({
        passwordHash: 'hashedpassword123'
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should fail with duplicate email', async () => {
      await User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123'
      });

      const duplicateUser = new User({
        email: 'test@example.com',
        passwordHash: 'anotherpassword'
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    test('should convert email to lowercase', async () => {
      const user = await User.create({
        email: 'TEST@EXAMPLE.COM',
        passwordHash: 'hashedpassword123'
      });

      expect(user.email).toBe('test@example.com');
    });

    test('should trim email whitespace', async () => {
      const user = await User.create({
        email: '  test@example.com  ',
        passwordHash: 'hashedpassword123'
      });

      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Role Management', () => {
    test('should default role to viewer', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123'
      });

      expect(user.role).toBe('viewer');
    });

    test('should accept admin role', async () => {
      const user = await User.create({
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        role: 'admin'
      });

      expect(user.role).toBe('admin');
    });

    test('should accept editor role', async () => {
      const user = await User.create({
        email: 'editor@example.com',
        passwordHash: 'hashedpassword123',
        role: 'editor'
      });

      expect(user.role).toBe('editor');
    });

    test('should reject invalid role', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'invalid-role'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('OAuth Support', () => {
    test('should create user with Google OAuth', async () => {
      const user = await User.create({
        email: 'google@example.com',
        googleId: '123456789',
        authProvider: 'google',
        name: 'Google User'
      });

      expect(user.googleId).toBe('123456789');
      expect(user.authProvider).toBe('google');
      expect(user.passwordHash).toBeUndefined();
    });

    test('should require password for local auth', async () => {
      const user = new User({
        email: 'local@example.com',
        authProvider: 'local'
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should not require password for OAuth', async () => {
      const user = await User.create({
        email: 'oauth@example.com',
        googleId: '987654321',
        authProvider: 'google'
      });

      expect(user._id).toBeDefined();
      expect(user.passwordHash).toBeUndefined();
    });
  });

  describe('Status Management', () => {
    test('should default status to active', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123'
      });

      expect(user.status).toBe('active');
    });

    test('should accept disabled status', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        status: 'disabled'
      });

      expect(user.status).toBe('disabled');
    });

    test('should accept deleted status', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        status: 'deleted'
      });

      expect(user.status).toBe('deleted');
    });

    test('should reject invalid status', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        status: 'invalid-status'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Password Virtual', () => {
    test('should hash password when set via virtual', async () => {
      const user = new User({
        email: 'test@example.com',
        role: 'viewer'
      });

      user.password = 'plainpassword123';
      await user.save();

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('plainpassword123');
      expect(user.passwordHash.length).toBeGreaterThan(20);
    });
  });

  describe('Instance Methods', () => {
    test('comparePassword should validate correct password', async () => {
      const user = new User({
        email: 'test@example.com'
      });
      user.password = 'correctpassword';
      await user.save();

      const isValid = user.comparePassword('correctpassword');
      expect(isValid).toBe(true);
    });

    test('comparePassword should reject incorrect password', async () => {
      const user = new User({
        email: 'test@example.com'
      });
      user.password = 'correctpassword';
      await user.save();

      const isValid = user.comparePassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    test('updateLastLogin should set lastLoginAt', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123'
      });

      expect(user.lastLoginAt).toBeUndefined();

      await user.updateLastLogin();
      expect(user.lastLoginAt).toBeInstanceOf(Date);
    });

    test('toJSON should not include passwordHash', async () => {
      const user = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword123'
      });

      const json = user.toJSON();
      expect(json.passwordHash).toBeUndefined();
      expect(json.email).toBe('test@example.com');
    });
  });

  describe('User References', () => {
    test('should store createdBy reference', async () => {
      const admin = await User.create({
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        role: 'admin'
      });

      const user = await User.create({
        email: 'user@example.com',
        passwordHash: 'hashedpassword123',
        createdBy: admin._id
      });

      expect(user.createdBy).toEqual(admin._id);
    });

    test('should populate createdBy user', async () => {
      const admin = await User.create({
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        role: 'admin'
      });

      const user = await User.create({
        email: 'user@example.com',
        passwordHash: 'hashedpassword123',
        createdBy: admin._id
      });

      const populatedUser = await User.findById(user._id).populate('createdBy');
      expect(populatedUser.createdBy.email).toBe('admin@example.com');
    });
  });

  describe('Deletion Tracking', () => {
    test('should track deletion metadata', async () => {
      const admin = await User.create({
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        role: 'admin'
      });

      const user = await User.create({
        email: 'user@example.com',
        passwordHash: 'hashedpassword123'
      });

      user.status = 'deleted';
      user.deletedBy = admin._id;
      user.deletedAt = new Date();
      await user.save();

      expect(user.status).toBe('deleted');
      expect(user.deletedBy).toEqual(admin._id);
      expect(user.deletedAt).toBeInstanceOf(Date);
    });
  });
});
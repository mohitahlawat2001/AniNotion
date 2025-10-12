const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Post = require('@models/Post');
const Category = require('@models/Category');
const User = require('@models/User');

let mongoServer;
let testCategory;
let testUser;

beforeAll(async () => {
  // Close any existing connections first
  await mongoose.disconnect();

  // Create MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect with timeout settings
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  // Verify connection is ready
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Failed to connect to MongoDB Memory Server');
  }
}, 60000);

afterAll(async () => {
  // Cleanup in proper order
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error in afterAll cleanup:', error);
  }
}, 60000);

beforeEach(async () => {
  // Verify connection before each test
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection not ready');
  }

  // Create test fixtures
  testCategory = await Category.create({
    name: 'Action',
    slug: 'action',
    isDefault: true
  });

  testUser = await User.create({
    email: 'testuser@example.com',
    passwordHash: 'hashedpassword123',
    role: 'editor'
  });
});

afterEach(async () => {
  // Clean up collections in proper order to avoid reference issues
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

describe('Post Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid post with required fields', async () => {
      const postData = {
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'This is test content for the post.'
      };

      const post = new Post(postData);
      const savedPost = await post.save();

      expect(savedPost._id).toBeDefined();
      expect(savedPost.title).toBe('Test Post');
      expect(savedPost.animeName).toBe('Test Anime');
      expect(savedPost.content).toBe('This is test content for the post.');
      expect(savedPost.status).toBe('published'); // default
      expect(savedPost.views).toBe(0); // default
      expect(savedPost.likesCount).toBe(0); // default
      expect(savedPost.isDeleted).toBe(false); // default
    });

    test('should fail without title', async () => {
      const post = new Post({
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content'
      });

      await expect(post.save()).rejects.toThrow();
    });

    test('should fail without animeName', async () => {
      const post = new Post({
        title: 'Test Post',
        category: testCategory._id,
        content: 'Content'
      });

      await expect(post.save()).rejects.toThrow();
    });

    test('should fail without category', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        content: 'Content'
      });

      await expect(post.save()).rejects.toThrow();
    });

    test('should fail without content', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id
      });

      await expect(post.save()).rejects.toThrow();
    });

    test('should trim slug whitespace', async () => {
      const post = new Post({
        title: 'Test Post',
        slug: '  test-slug  ',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content'
      });

      const savedPost = await post.save();
      expect(savedPost.slug).toBe('test-slug');
    });
  });

  describe('Status Management', () => {
    test('should default status to published', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content'
      });

      const savedPost = await post.save();
      expect(savedPost.status).toBe('published');
    });

    test('should only accept valid status values', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        status: 'invalid-status'
      });

      await expect(post.save()).rejects.toThrow(/is not a valid enum value/);
    });

    test('should accept draft status', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        status: 'draft'
      });

      const savedPost = await post.save();
      expect(savedPost.status).toBe('draft');
    });

    test('should accept scheduled status', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        status: 'scheduled'
      });

      const savedPost = await post.save();
      expect(savedPost.status).toBe('scheduled');
    });
  });

  describe('Pre-save Middleware', () => {
    test('should auto-generate excerpt from content', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: '<p>This is a long content that should be excerpted automatically when saving the post.</p>'
      });

      const savedPost = await post.save();
      expect(savedPost.excerpt).toBeDefined();
      expect(savedPost.excerpt.length).toBeGreaterThan(0);
      expect(savedPost.excerpt).not.toContain('<p>');
    });

    test('should not override provided excerpt', async () => {
      const customExcerpt = 'Custom excerpt provided by user';
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Long content here',
        excerpt: customExcerpt
      });

      const savedPost = await post.save();
      expect(savedPost.excerpt).toBe(customExcerpt);
    });

    test('should auto-calculate reading time', async () => {
      const longContent = 'word '.repeat(400); // 400 words
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: longContent
      });

      const savedPost = await post.save();
      expect(savedPost.readingTimeMinutes).toBeGreaterThan(0);
      expect(savedPost.readingTimeMinutes).toBe(2); // 400 words / 200 wpm
    });

    test('should not override provided reading time', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Short content',
        readingTimeMinutes: 10
      });

      const savedPost = await post.save();
      expect(savedPost.readingTimeMinutes).toBe(10);
    });

    test('should set publishedAt when status is published', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        status: 'published'
      });

      const savedPost = await post.save();
      expect(savedPost.publishedAt).toBeInstanceOf(Date);
    });

    test('should not set publishedAt for draft status', async () => {
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        status: 'draft'
      });

      const savedPost = await post.save();
      expect(savedPost.publishedAt).toBeUndefined();
    });

    test('should not override existing publishedAt', async () => {
      const customDate = new Date('2023-01-01');
      const post = new Post({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        status: 'published',
        publishedAt: customDate
      });

      const savedPost = await post.save();
      expect(savedPost.publishedAt.toISOString()).toBe(customDate.toISOString());
    });
  });

  describe('Instance Methods', () => {
    test('incrementViews should increase view count', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content'
      });

      expect(post.views).toBe(0);

      await post.incrementViews();
      expect(post.views).toBe(1);

      await post.incrementViews();
      expect(post.views).toBe(2);
    });

    test('generateExcerpt should create excerpt from content', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: '<p>This is HTML content with tags.</p>'
      });

      const excerpt = post.generateExcerpt(20);
      expect(excerpt).toBe('This is HTML...');
      expect(excerpt).not.toContain('<');
    });

    test('calculateReadingTime should compute reading minutes', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'word '.repeat(600) // 600 words
      });

      const readingTime = post.calculateReadingTime();
      expect(readingTime).toBe(3); // 600 / 200 = 3 minutes
    });
  });

  describe('Static Methods', () => {
    test('findPublished should return only published posts', async () => {
      await Post.create([
        {
          title: 'Published Post',
          animeName: 'Anime 1',
          category: testCategory._id,
          content: 'Content',
          status: 'published'
        },
        {
          title: 'Draft Post',
          animeName: 'Anime 2',
          category: testCategory._id,
          content: 'Content',
          status: 'draft'
        },
        {
          title: 'Deleted Post',
          animeName: 'Anime 3',
          category: testCategory._id,
          content: 'Content',
          status: 'published',
          isDeleted: true
        }
      ]);

      const publishedPosts = await Post.findPublished();
      expect(publishedPosts).toHaveLength(1);
      expect(publishedPosts[0].title).toBe('Published Post');
    });

    test('findPublished should accept additional query parameters', async () => {
      await Post.create([
        {
          title: 'Post 1',
          animeName: 'Anime 1',
          category: testCategory._id,
          content: 'Content',
          status: 'published',
          tags: ['action']
        },
        {
          title: 'Post 2',
          animeName: 'Anime 2',
          category: testCategory._id,
          content: 'Content',
          status: 'published',
          tags: ['comedy']
        }
      ]);

      const actionPosts = await Post.findPublished({ tags: 'action' });
      expect(actionPosts).toHaveLength(1);
      expect(actionPosts[0].tags).toContain('action');
    });
  });

  describe('Tags', () => {
    test('should store tags as lowercase', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        tags: ['Action', 'ADVENTURE', 'shounen']
      });

      expect(post.tags).toEqual(['action', 'adventure', 'shounen']);
    });

    test('should trim tag whitespace', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        tags: ['  action  ', '  adventure  ']
      });

      expect(post.tags).toEqual(['action', 'adventure']);
    });

    test('should allow empty tags array', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        tags: []
      });

      expect(post.tags).toEqual([]);
    });
  });

  describe('User References', () => {
    test('should store createdBy reference', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        createdBy: testUser._id
      });

      expect(post.createdBy).toEqual(testUser._id);
    });

    test('should populate createdBy user', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content',
        createdBy: testUser._id
      });

      const populatedPost = await Post.findById(post._id).populate('createdBy');
      expect(populatedPost.createdBy.email).toBe('testuser@example.com');
    });
  });

  describe('Soft Delete', () => {
    test('should default isDeleted to false', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content'
      });

      expect(post.isDeleted).toBe(false);
    });

    test('should allow soft delete', async () => {
      const post = await Post.create({
        title: 'Test Post',
        animeName: 'Test Anime',
        category: testCategory._id,
        content: 'Content'
      });

      post.isDeleted = true;
      await post.save();

      const deletedPost = await Post.findById(post._id);
      expect(deletedPost.isDeleted).toBe(true);
    });
  });
});
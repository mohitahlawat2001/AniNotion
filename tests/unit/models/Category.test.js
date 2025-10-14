const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Category = require('../../../aninotion-backend/models/Category');

let mongoServer;

beforeAll(async () => {
  jest.setTimeout(30000);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await mongoose.connection.asPromise();
}, 30000);

afterAll(async () => {
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
  if (mongoose.connection.readyState === 1) {
    await Category.deleteMany({});
  }
}, 10000);

describe('Category Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid category with required fields', async () => {
      const categoryData = {
        name: 'Action',
        slug: 'action'
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe('Action');
      expect(savedCategory.slug).toBe('action');
      expect(savedCategory.isDefault).toBe(false); // default
      expect(savedCategory.createdAt).toBeInstanceOf(Date);
      expect(savedCategory.updatedAt).toBeInstanceOf(Date);
    });

    test('should fail without name', async () => {
      const category = new Category({
        slug: 'action'
      });

      await expect(category.save()).rejects.toThrow();
    });

    test('should fail without slug', async () => {
      const category = new Category({
        name: 'Action'
      });

      await expect(category.save()).rejects.toThrow();
    });

    test('should fail with duplicate name', async () => {
      await Category.create({
        name: 'Action',
        slug: 'action'
      });

      const duplicateCategory = new Category({
        name: 'Action',
        slug: 'action-2'
      });

      await expect(duplicateCategory.save()).rejects.toThrow();
    });

    test('should fail with duplicate slug', async () => {
      await Category.create({
        name: 'Action',
        slug: 'action'
      });

      const duplicateCategory = new Category({
        name: 'Action 2',
        slug: 'action'
      });

      await expect(duplicateCategory.save()).rejects.toThrow();
    });
  });

  describe('Default Category', () => {
    test('should default isDefault to false', async () => {
      const category = await Category.create({
        name: 'Action',
        slug: 'action'
      });

      expect(category.isDefault).toBe(false);
    });

    test('should allow setting isDefault to true', async () => {
      const category = await Category.create({
        name: 'General',
        slug: 'general',
        isDefault: true
      });

      expect(category.isDefault).toBe(true);
    });

    test('should allow multiple non-default categories', async () => {
      await Category.create({
        name: 'Action',
        slug: 'action',
        isDefault: false
      });

      const category2 = await Category.create({
        name: 'Comedy',
        slug: 'comedy',
        isDefault: false
      });

      expect(category2._id).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const category = await Category.create({
        name: 'Action',
        slug: 'action'
      });

      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const category = await Category.create({
        name: 'Action',
        slug: 'action'
      });

      const originalUpdatedAt = category.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      category.name = 'Action Updated';
      await category.save();

      expect(category.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Category Operations', () => {
    test('should find category by slug', async () => {
      await Category.create({
        name: 'Action',
        slug: 'action'
      });

      const category = await Category.findOne({ slug: 'action' });
      expect(category).toBeDefined();
      expect(category.name).toBe('Action');
    });

    test('should find category by name', async () => {
      await Category.create({
        name: 'Action',
        slug: 'action'
      });

      const category = await Category.findOne({ name: 'Action' });
      expect(category).toBeDefined();
      expect(category.slug).toBe('action');
    });

    test('should update category', async () => {
      const category = await Category.create({
        name: 'Action',
        slug: 'action'
      });

      category.name = 'Action & Adventure';
      await category.save();

      const updatedCategory = await Category.findById(category._id);
      expect(updatedCategory.name).toBe('Action & Adventure');
    });

    test('should delete category', async () => {
      const category = await Category.create({
        name: 'Action',
        slug: 'action'
      });

      await Category.deleteOne({ _id: category._id });

      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    });
  });

  describe('Multiple Categories', () => {
    test('should create multiple categories', async () => {
      const categories = await Category.create([
        { name: 'Action', slug: 'action' },
        { name: 'Comedy', slug: 'comedy' },
        { name: 'Drama', slug: 'drama' }
      ]);

      expect(categories).toHaveLength(3);
      expect(categories[0].name).toBe('Action');
      expect(categories[1].name).toBe('Comedy');
      expect(categories[2].name).toBe('Drama');
    });

    test('should find all categories', async () => {
      await Category.create([
        { name: 'Action', slug: 'action' },
        { name: 'Comedy', slug: 'comedy' },
        { name: 'Drama', slug: 'drama' }
      ]);

      const allCategories = await Category.find({});
      expect(allCategories).toHaveLength(3);
    });

    test('should find default category', async () => {
      await Category.create([
        { name: 'Action', slug: 'action', isDefault: false },
        { name: 'General', slug: 'general', isDefault: true },
        { name: 'Comedy', slug: 'comedy', isDefault: false }
      ]);

      const defaultCategory = await Category.findOne({ isDefault: true });
      expect(defaultCategory).toBeDefined();
      expect(defaultCategory.name).toBe('General');
    });
  });
});
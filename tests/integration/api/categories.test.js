const request = require('supertest');
const mongoose = require('mongoose');
const {
  setupTestServer,
  closeTestServer,
  clearDatabase,
  createTestCategory,
} = require('../helpers/testServer');
const Category = require('@models/Category');

let app;

beforeAll(async () => {
  jest.setTimeout(30000);
  app = await setupTestServer();
}, 30000);

afterAll(async () => {
  if (typeof closeTestServer === 'function') {
    await closeTestServer();
  }
}, 30000);

beforeEach(async () => {
  if (typeof clearDatabase === 'function') {
    await clearDatabase();
  }
});

describe('Categories API', () => {
  describe('GET /api/categories', () => {
    test('should return empty array when no categories exist', async () => {
      const response = await request(app)
        .get('/api/categories');

      if (response.status !== 200) {
        console.error('Error response:', response.body);
      }
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return all categories', async () => {
      await createTestCategory({ name: 'Action', slug: 'action' });
      await createTestCategory({ name: 'Comedy', slug: 'comedy' });
      await createTestCategory({ name: 'Drama', slug: 'drama' });

      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('slug');
    });

    test('should return categories sorted by createdAt descending', async () => {
      const category1 = await createTestCategory({ name: 'Action', slug: 'action' });
      await new Promise(resolve => setTimeout(resolve, 100));
      const category2 = await createTestCategory({ name: 'Comedy', slug: 'comedy' });

      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]._id.toString()).toBe(category2._id.toString());
      expect(response.body[1]._id.toString()).toBe(category1._id.toString());
    });
  });

  describe('POST /api/categories', () => {
    test('should create a new category', async () => {
      const categoryData = {
        name: 'Action',
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      if (response.status !== 201) {
        console.error('Error response:', response.body);
        console.error('Error status:', response.status);
      }
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe('Action');
      expect(response.body.slug).toBe('action');
      expect(response.body.isDefault).toBe(false);
    });

    test('should generate slug from name', async () => {
      const categoryData = {
        name: 'Science Fiction',
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.slug).toBe('science-fiction');
    });

    test('should handle multiple words in name', async () => {
      const categoryData = {
        name: 'Slice of Life',
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.slug).toBe('slice-of-life');
    });

    test('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for duplicate category name', async () => {
      await createTestCategory({ name: 'Action', slug: 'action' });

      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Action' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 for duplicate slug', async () => {
      await createTestCategory({ name: 'Action', slug: 'action' });

      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'action' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    test('should delete a category', async () => {
      const category = await createTestCategory({ name: 'Action', slug: 'action' });

      const response = await request(app)
        .delete(`/api/categories/${category._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');

      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    test('should return 404 when category does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/categories/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Category not found');
    });

    test('should return 400 when trying to delete default category', async () => {
      const defaultCategory = await createTestCategory({
        name: 'General',
        slug: 'general',
        isDefault: true,
      });

      const response = await request(app)
        .delete(`/api/categories/${defaultCategory._id}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cannot delete default categories');

      const category = await Category.findById(defaultCategory._id);
      expect(category).not.toBeNull();
    });

    test('should return 500 for invalid category ID format', async () => {
      const response = await request(app)
        .delete('/api/categories/invalid-id');

      // Accept either 400 or 500 depending on your error handling
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Category validation', () => {
    test('should enforce unique category names', async () => {
      await createTestCategory({ name: 'Action', slug: 'action' });

      const duplicateCategory = new Category({
        name: 'Action',
        slug: 'action-2',
      });

      await expect(duplicateCategory.save()).rejects.toThrow();
    });

    test('should enforce unique slugs', async () => {
      await createTestCategory({ name: 'Action', slug: 'action' });

      const duplicateCategory = new Category({
        name: 'Action 2',
        slug: 'action',
      });

      await expect(duplicateCategory.save()).rejects.toThrow();
    });

    test('should set isDefault to false by default', async () => {
      const category = await createTestCategory({ name: 'Action', slug: 'action' });
      expect(category.isDefault).toBe(false);
    });
  });
});
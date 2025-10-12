const request = require('supertest');
const {
  setupTestServer,
  closeTestServer,
  clearDatabase,
  createTestUser,
  createTestCategory,
  authHeaders
} = require('../helpers/testServer');
const Post = require('@models/Post');

let app;
let testCategory;
let viewerUser;
let editorUser;
let adminUser;

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
  
  // Create test users
  viewerUser = await createTestUser({
    email: 'viewer@example.com',
    role: 'viewer'
  });
  
  editorUser = await createTestUser({
    email: 'editor@example.com',
    role: 'editor'
  });
  
  adminUser = await createTestUser({
    email: 'admin@example.com',
    role: 'admin'
  });
  
  // Create test category
  testCategory = await createTestCategory({
    name: 'Action',
    slug: 'action'
  });
});

describe('POST /api/posts', () => {
  test('should create post as editor', async () => {
    const postData = {
      title: 'Test Post',
      animeName: 'Test Anime',
      category: testCategory._id.toString(),
      content: 'This is test content',
      status: 'published'
    };

    const response = await request(app)
      .post('/api/posts')
      .set(authHeaders(editorUser))
      .send(postData)
      .expect(201);

    expect(response.body.title).toBe('Test Post');
    expect(response.body.animeName).toBe('Test Anime');
    expect(response.body.slug).toBeDefined();
    expect(response.body.excerpt).toBeDefined();
  });

  test('should create post as admin', async () => {
    const postData = {
      title: 'Admin Post',
      animeName: 'Admin Anime',
      category: testCategory._id.toString(),
      content: 'Admin content'
    };

    const response = await request(app)
      .post('/api/posts')
      .set(authHeaders(adminUser))
      .send(postData)
      .expect(201);

    expect(response.body.title).toBe('Admin Post');
  });

  test('should reject post creation by viewer', async () => {
    const postData = {
      title: 'Viewer Post',
      animeName: 'Viewer Anime',
      category: testCategory._id.toString(),
      content: 'Viewer content'
    };

    await request(app)
      .post('/api/posts')
      .set(authHeaders(viewerUser))
      .send(postData)
      .expect(403);
  });

  test('should reject post without authentication', async () => {
    const postData = {
      title: 'Unauthenticated Post',
      animeName: 'Test Anime',
      category: testCategory._id.toString(),
      content: 'Content'
    };

    await request(app)
      .post('/api/posts')
      .send(postData)
      .expect(401);
  });

  test('should reject post without required fields', async () => {
    const postData = {
      title: 'Incomplete Post'
      // Missing animeName, category, content
    };

    await request(app)
      .post('/api/posts')
      .set(authHeaders(editorUser))
      .send(postData)
      .expect(400);
  });

  test('should auto-generate slug from title', async () => {
    const postData = {
      title: 'My Awesome Post Title',
      animeName: 'Test Anime',
      category: testCategory._id.toString(),
      content: 'Content'
    };

    const response = await request(app)
      .post('/api/posts')
      .set(authHeaders(editorUser))
      .send(postData)
      .expect(201);

    expect(response.body.slug).toBe('my-awesome-post-title');
  });

  test('should process tags correctly', async () => {
    const postData = {
      title: 'Tagged Post',
      animeName: 'Test Anime',
      category: testCategory._id.toString(),
      content: 'Content',
      tags: ['Action', 'ADVENTURE', 'shounen']
    };

    const response = await request(app)
      .post('/api/posts')
      .set(authHeaders(editorUser))
      .send(postData)
      .expect(201);

    expect(response.body.tags).toEqual(['action', 'adventure', 'shounen']);
  });
});

describe('GET /api/posts', () => {
  beforeEach(async () => {
    // Create test posts
    await Post.create([
      {
        title: 'Published Post 1',
        animeName: 'Anime 1',
        category: testCategory._id,
        content: 'Content 1',
        status: 'published',
        createdBy: editorUser._id
      },
      {
        title: 'Published Post 2',
        animeName: 'Anime 2',
        category: testCategory._id,
        content: 'Content 2',
        status: 'published',
        createdBy: editorUser._id
      },
      {
        title: 'Draft Post',
        animeName: 'Anime 3',
        category: testCategory._id,
        content: 'Content 3',
        status: 'draft',
        createdBy: editorUser._id
      }
    ]);
  });

  test('should return published posts for anonymous users', async () => {
    const response = await request(app)
      .get('/api/posts')
      .expect(200);

    expect(response.body.posts).toHaveLength(2);
    expect(response.body.posts.every(p => p.status === 'published')).toBe(true);
  });

  test('should return all posts for admin', async () => {
    const response = await request(app)
      .get('/api/posts')
      .set(authHeaders(adminUser))
      .expect(200);

    expect(response.body.posts).toHaveLength(3);
  });

  test('should return all posts for editor', async () => {
    const response = await request(app)
      .get('/api/posts')
      .set(authHeaders(editorUser))
      .expect(200);

    expect(response.body.posts).toHaveLength(3);
  });

  test('should support pagination', async () => {
    const response = await request(app)
      .get('/api/posts?limit=1&page=1')
      .expect(200);

    expect(response.body.posts).toHaveLength(1);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(1);
    expect(response.body.pagination.total).toBe(2);
  });

  test('should filter by category', async () => {
    const anotherCategory = await createTestCategory({
      name: 'Comedy',
      slug: 'comedy'
    });

    await Post.create({
      title: 'Comedy Post',
      animeName: 'Comedy Anime',
      category: anotherCategory._id,
      content: 'Comedy content',
      status: 'published'
    });

    const response = await request(app)
      .get(`/api/posts?category=${testCategory._id}`)
      .expect(200);

    expect(response.body.posts).toHaveLength(2);
    expect(response.body.posts.every(p => p.category._id === testCategory._id.toString())).toBe(true);
  });
});

describe('GET /api/posts/:identifier', () => {
  let testPost;

  beforeEach(async () => {
    testPost = await Post.create({
      title: 'Test Post',
      slug: 'test-post',
      animeName: 'Test Anime',
      category: testCategory._id,
      content: 'Test content',
      status: 'published',
      createdBy: editorUser._id
    });
  });

  test('should get post by ID', async () => {
    const response = await request(app)
      .get(`/api/posts/${testPost._id}`)
      .expect(200);

    expect(response.body.title).toBe('Test Post');
    expect(response.body.animeName).toBe('Test Anime');
  });

  test('should get post by slug', async () => {
    const response = await request(app)
      .get('/api/posts/test-post')
      .expect(200);

    expect(response.body.title).toBe('Test Post');
    expect(response.body.slug).toBe('test-post');
  });

  test('should increment views on get', async () => {
    const initialViews = testPost.views;

    await request(app)
      .get(`/api/posts/${testPost._id}`)
      .expect(200);

    // Wait a bit for async view increment
    await new Promise(resolve => setTimeout(resolve, 100));

    const updatedPost = await Post.findById(testPost._id);
    expect(updatedPost.views).toBe(initialViews + 1);
  });

  test('should return 404 for non-existent post', async () => {
    await request(app)
      .get('/api/posts/507f1f77bcf86cd799439011')
      .expect(404);
  });

  test('should not return draft post to anonymous user', async () => {
    const draftPost = await Post.create({
      title: 'Draft Post',
      slug: 'draft-post',
      animeName: 'Draft Anime',
      category: testCategory._id,
      content: 'Draft content',
      status: 'draft',
      createdBy: editorUser._id
    });

    await request(app)
      .get(`/api/posts/${draftPost._id}`)
      .expect(404);
  });

  test('should return draft post to editor', async () => {
    const draftPost = await Post.create({
      title: 'Draft Post',
      slug: 'draft-post',
      animeName: 'Draft Anime',
      category: testCategory._id,
      content: 'Draft content',
      status: 'draft',
      createdBy: editorUser._id
    });

    const response = await request(app)
      .get(`/api/posts/${draftPost._id}`)
      .set(authHeaders(editorUser))
      .expect(200);

    expect(response.body.status).toBe('draft');
  });
});

describe('PUT /api/posts/:id', () => {
  let testPost;

  beforeEach(async () => {
    testPost = await Post.create({
      title: 'Original Title',
      slug: 'original-title',
      animeName: 'Original Anime',
      category: testCategory._id,
      content: 'Original content',
      status: 'published',
      createdBy: editorUser._id
    });
  });

  test('should update post as editor', async () => {
    const updateData = {
      title: 'Updated Title',
      animeName: 'Updated Anime',
      content: 'Updated content'
    };

    const response = await request(app)
      .put(`/api/posts/${testPost._id}`)
      .set(authHeaders(editorUser))
      .send(updateData)
      .expect(200);

    expect(response.body.title).toBe('Updated Title');
    expect(response.body.animeName).toBe('Updated Anime');
  });

  test('should update post as admin', async () => {
    const updateData = {
      title: 'Admin Updated',
      content: 'Admin updated content'
    };

    const response = await request(app)
      .put(`/api/posts/${testPost._id}`)
      .set(authHeaders(adminUser))
      .send(updateData)
      .expect(200);

    expect(response.body.title).toBe('Admin Updated');
  });

  test('should reject update by viewer', async () => {
    const updateData = {
      title: 'Viewer Update'
    };

    await request(app)
      .put(`/api/posts/${testPost._id}`)
      .set(authHeaders(viewerUser))
      .send(updateData)
      .expect(403);
  });

  test('should reject update without authentication', async () => {
    const updateData = {
      title: 'Unauthenticated Update'
    };

    await request(app)
      .put(`/api/posts/${testPost._id}`)
      .send(updateData)
      .expect(401);
  });
});

describe('DELETE /api/posts/:id', () => {
  let testPost;

  beforeEach(async () => {
    testPost = await Post.create({
      title: 'Post to Delete',
      slug: 'post-to-delete',
      animeName: 'Delete Anime',
      category: testCategory._id,
      content: 'Content to delete',
      status: 'published',
      createdBy: editorUser._id
    });
  });

  test('should soft delete post as editor', async () => {
    await request(app)
      .delete(`/api/posts/${testPost._id}`)
      .set(authHeaders(editorUser))
      .expect(200);

    const deletedPost = await Post.findById(testPost._id);
    expect(deletedPost.isDeleted).toBe(true);
  });

  test('should soft delete post as admin', async () => {
    await request(app)
      .delete(`/api/posts/${testPost._id}`)
      .set(authHeaders(adminUser))
      .expect(200);

    const deletedPost = await Post.findById(testPost._id);
    expect(deletedPost.isDeleted).toBe(true);
  });

  test('should reject delete by viewer', async () => {
    await request(app)
      .delete(`/api/posts/${testPost._id}`)
      .set(authHeaders(viewerUser))
      .expect(403);
  });

  test('should reject delete without authentication', async () => {
    await request(app)
      .delete(`/api/posts/${testPost._id}`)
      .expect(401);
  });
});
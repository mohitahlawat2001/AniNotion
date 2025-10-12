const {
  generateExcerpt,
  calculateReadingTime,
  processTags,
  isValidStatusTransition,
  buildPostQuery,
} = require('../../../aninotion-backend/utils/postHelpers');

describe('postHelpers - Unit Tests', () => {
  describe('generateExcerpt', () => {
    test('should generate excerpt from plain text', () => {
      const content = 'This is a simple text content that should be excerpted.';
      const excerpt = generateExcerpt(content, 20);
      
      expect(excerpt).toBe('This is a simple...');
      expect(excerpt.length).toBeLessThanOrEqual(23); // 20 + '...'
    });

    test('should remove HTML tags from content', () => {
      const content = '<p>This is <strong>HTML</strong> content with <em>tags</em>.</p>';
      const excerpt = generateExcerpt(content, 30);
      
      expect(excerpt).not.toContain('<p>');
      expect(excerpt).not.toContain('<strong>');
      expect(excerpt).not.toContain('<em>');
      expect(excerpt).toContain('This is HTML content');
    });

    test('should return full text if shorter than limit', () => {
      const content = 'Short text';
      const excerpt = generateExcerpt(content, 100);
      
      expect(excerpt).toBe('Short text');
      expect(excerpt).not.toContain('...');
    });

    test('should return empty string for empty content', () => {
      expect(generateExcerpt('')).toBe('');
      expect(generateExcerpt(null)).toBe('');
      expect(generateExcerpt(undefined)).toBe('');
    });

    test('should break at last complete word', () => {
      const content = 'This is a test content with multiple words';
      const excerpt = generateExcerpt(content, 15);
      
      // Should break at word boundary
      expect(excerpt).toBe('This is a test...');
      expect(excerpt.split(' ').pop()).not.toBe('te...'); // Not breaking mid-word
    });

    test('should use default length of 160 characters', () => {
      const longContent = 'a'.repeat(200);
      const excerpt = generateExcerpt(longContent);
      
      expect(excerpt.length).toBeLessThanOrEqual(163); // 160 + '...'
    });
  });

  describe('calculateReadingTime', () => {
    test('should calculate reading time correctly', () => {
      const content = 'word '.repeat(400); // 400 words
      const readingTime = calculateReadingTime(content);
      
      expect(readingTime).toBe(2); // 400 words / 200 wpm = 2 minutes
    });

    test('should return minimum of 1 minute', () => {
      const content = 'Just a few words';
      const readingTime = calculateReadingTime(content);
      
      expect(readingTime).toBe(1);
    });

    test('should handle HTML content', () => {
      const content = '<p>' + 'word '.repeat(600) + '</p>'; // 600 words
      const readingTime = calculateReadingTime(content);
      
      expect(readingTime).toBe(3); // 600 / 200 = 3 minutes
    });

    test('should return 0 for empty content', () => {
      expect(calculateReadingTime('')).toBe(0);
      expect(calculateReadingTime(null)).toBe(0);
      expect(calculateReadingTime(undefined)).toBe(0);
    });

    test('should accept custom words per minute', () => {
      const content = 'word '.repeat(300); // 300 words
      const readingTime = calculateReadingTime(content, 100); // 100 wpm
      
      expect(readingTime).toBe(3); // 300 / 100 = 3 minutes
    });

    test('should round up partial minutes', () => {
      const content = 'word '.repeat(250); // 250 words
      const readingTime = calculateReadingTime(content, 200); // 200 wpm
      
      expect(readingTime).toBe(2); // 250 / 200 = 1.25, rounds up to 2
    });
  });

  describe('processTags', () => {
    test('should process array of tags', () => {
      const tags = ['Action', 'Adventure', 'Shounen'];
      const processed = processTags(tags);
      
      expect(processed).toEqual(['action', 'adventure', 'shounen']);
    });

    test('should process comma-separated string', () => {
      const tags = 'Action, Adventure, Shounen';
      const processed = processTags(tags);
      
      expect(processed).toEqual(['action', 'adventure', 'shounen']);
    });

    test('should convert to lowercase', () => {
      const tags = ['ACTION', 'AdVeNtUrE', 'shounen'];
      const processed = processTags(tags);
      
      expect(processed).toEqual(['action', 'adventure', 'shounen']);
    });

    test('should trim whitespace', () => {
      const tags = ['  action  ', '  adventure  ', '  shounen  '];
      const processed = processTags(tags);
      
      expect(processed).toEqual(['action', 'adventure', 'shounen']);
    });

    test('should remove duplicates', () => {
      const tags = ['action', 'Action', 'ACTION', 'adventure'];
      const processed = processTags(tags);
      
      expect(processed).toEqual(['action', 'adventure']);
    });

    test('should filter out empty tags', () => {
      const tags = ['action', '', '  ', 'adventure'];
      const processed = processTags(tags);
      
      expect(processed).toEqual(['action', 'adventure']);
    });

    test('should filter out tags longer than 50 characters', () => {
      const longTag = 'a'.repeat(51);
      const tags = ['action', longTag, 'adventure'];
      const processed = processTags(tags);
      
      expect(processed).toEqual(['action', 'adventure']);
    });

    test('should return empty array for null/undefined', () => {
      expect(processTags(null)).toEqual([]);
      expect(processTags(undefined)).toEqual([]);
    });

    test('should handle empty array', () => {
      expect(processTags([])).toEqual([]);
    });
  });

  describe('isValidStatusTransition', () => {
    test('admin can do any transition', () => {
      expect(isValidStatusTransition('draft', 'published', 'admin')).toBe(true);
      expect(isValidStatusTransition('published', 'draft', 'admin')).toBe(true);
      expect(isValidStatusTransition('scheduled', 'published', 'admin')).toBe(true);
    });

    test('editor can transition draft to published', () => {
      expect(isValidStatusTransition('draft', 'published', 'editor')).toBe(true);
    });

    test('editor can transition draft to scheduled', () => {
      expect(isValidStatusTransition('draft', 'scheduled', 'editor')).toBe(true);
    });

    test('editor can transition published to draft', () => {
      expect(isValidStatusTransition('published', 'draft', 'editor')).toBe(true);
    });

    test('editor can transition scheduled to draft', () => {
      expect(isValidStatusTransition('scheduled', 'draft', 'editor')).toBe(true);
    });

    test('editor can transition scheduled to published', () => {
      expect(isValidStatusTransition('scheduled', 'published', 'editor')).toBe(true);
    });

    test('viewer cannot change status', () => {
      expect(isValidStatusTransition('draft', 'published', 'viewer')).toBe(false);
      expect(isValidStatusTransition('published', 'draft', 'viewer')).toBe(false);
    });

    test('invalid transitions return false for editor', () => {
      expect(isValidStatusTransition('published', 'scheduled', 'editor')).toBe(false);
    });
  });

  describe('buildPostQuery', () => {
    test('should add isDeleted: false to base query', () => {
      const query = buildPostQuery(null);
      
      expect(query.isDeleted).toBe(false);
    });

    test('anonymous user can only see published posts', () => {
      const query = buildPostQuery(null);
      
      expect(query.status).toBe('published');
      expect(query.isDeleted).toBe(false);
    });

    test('viewer can only see published posts', () => {
      const user = { role: 'viewer' };
      const query = buildPostQuery(user);
      
      expect(query.status).toBe('published');
      expect(query.isDeleted).toBe(false);
    });

    test('admin can see all posts', () => {
      const user = { role: 'admin' };
      const query = buildPostQuery(user);
      
      expect(query.status).toBeUndefined();
      expect(query.isDeleted).toBe(false);
    });

    test('editor can see all posts', () => {
      const user = { role: 'editor' };
      const query = buildPostQuery(user);
      
      expect(query.status).toBeUndefined();
      expect(query.isDeleted).toBe(false);
    });

    test('should merge with base query', () => {
      const user = { role: 'admin' };
      const baseQuery = { category: '123', tags: 'action' };
      const query = buildPostQuery(user, baseQuery);
      
      expect(query.category).toBe('123');
      expect(query.tags).toBe('action');
      expect(query.isDeleted).toBe(false);
    });

    test('should not override isDeleted in base query', () => {
      const user = { role: 'admin' };
      const baseQuery = { isDeleted: true };
      const query = buildPostQuery(user, baseQuery);
      
      // buildPostQuery always sets isDeleted to false
      expect(query.isDeleted).toBe(false);
    });
  });
});
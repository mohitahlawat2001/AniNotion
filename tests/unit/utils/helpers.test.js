const {
  slugify,
  generateUniqueSlug,
  validators,
  sanitizers,
  textUtils,
  arrayUtils,
  dateUtils,
  generateId,
  generateHash,
  deepClone,
} = require('../../../aninotion-backend/utils/helpers');

describe('helpers - Unit Tests', () => {
  describe('slugify', () => {
    test('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    test('should remove special characters', () => {
      expect(slugify('Hello @#$ World!')).toBe('hello--world');
    });

    test('should handle HTML tags', () => {
      expect(slugify('<p>Hello World</p>')).toBe('hello-world');
    });

    test('should use custom separator', () => {
      expect(slugify('Hello World', { separator: '_' })).toBe('hello_world');
    });

    test('should respect maxLength option', () => {
      const longText = 'a'.repeat(150);
      const slug = slugify(longText, { maxLength: 50 });
      expect(slug.length).toBeLessThanOrEqual(50);
    });

    test('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });

    test('should handle non-string input', () => {
      expect(slugify(null)).toBe('');
      expect(slugify(undefined)).toBe('');
      expect(slugify(123)).toBe('');
    });

    test('should preserve case when lowercase is false', () => {
      expect(slugify('Hello World', { lowercase: false })).toBe('Hello-World');
    });
  });

  describe('generateUniqueSlug', () => {
    test('should generate unique slug when base slug exists', async () => {
      const checkExists = jest.fn()
        .mockResolvedValueOnce(true)  // First slug exists
        .mockResolvedValueOnce(false); // Second slug doesn't exist
      
      const slug = await generateUniqueSlug('Test Post', checkExists);
      
      expect(slug).toBe('test-post-1');
      expect(checkExists).toHaveBeenCalledTimes(2);
    });

    test('should return base slug if it does not exist', async () => {
      const checkExists = jest.fn().mockResolvedValue(false);
      
      const slug = await generateUniqueSlug('Test Post', checkExists);
      
      expect(slug).toBe('test-post');
      expect(checkExists).toHaveBeenCalledTimes(1);
    });

    test('should increment counter for multiple conflicts', async () => {
      const checkExists = jest.fn()
        .mockResolvedValueOnce(true)  // test-post exists
        .mockResolvedValueOnce(true)  // test-post-1 exists
        .mockResolvedValueOnce(true)  // test-post-2 exists
        .mockResolvedValueOnce(false); // test-post-3 doesn't exist
      
      const slug = await generateUniqueSlug('Test Post', checkExists);
      
      expect(slug).toBe('test-post-3');
    });
  });

  describe('validators', () => {
    describe('email', () => {
      test('should validate correct email', () => {
        expect(validators.email('test@example.com')).toBe(true);
        expect(validators.email('user.name@domain.co.uk')).toBe(true);
      });

      test('should reject invalid email', () => {
        expect(validators.email('invalid')).toBe(false);
        expect(validators.email('test@')).toBe(false);
        expect(validators.email('@example.com')).toBe(false);
      });
    });

    describe('url', () => {
      test('should validate correct URL', () => {
        expect(validators.url('https://example.com')).toBe(true);
        expect(validators.url('http://test.com/path')).toBe(true);
      });

      test('should reject invalid URL', () => {
        expect(validators.url('not-a-url')).toBe(false);
        expect(validators.url('htp://wrong')).toBe(false);
      });
    });

    describe('objectId', () => {
      test('should validate correct MongoDB ObjectId', () => {
        expect(validators.objectId('507f1f77bcf86cd799439011')).toBe(true);
        expect(validators.objectId('123456789012345678901234')).toBe(true);
      });

      test('should reject invalid ObjectId', () => {
        expect(validators.objectId('invalid')).toBe(false);
        expect(validators.objectId('12345')).toBe(false);
        expect(validators.objectId('zzz456789012345678901234')).toBe(false);
      });
    });

    describe('slug', () => {
      test('should validate correct slug', () => {
        expect(validators.slug('hello-world')).toBe(true);
        expect(validators.slug('test-123')).toBe(true);
      });

      test('should reject invalid slug', () => {
        expect(validators.slug('Hello World')).toBe(false);
        expect(validators.slug('test_slug')).toBe(false);
        expect(validators.slug('test--slug')).toBe(false);
      });
    });

    describe('animeTitle', () => {
      test('should validate correct anime title', () => {
        expect(validators.animeTitle('Naruto')).toBe(true);
        expect(validators.animeTitle('Attack on Titan')).toBe(true);
      });

      test('should reject invalid anime title', () => {
        expect(validators.animeTitle('')).toBe(false);
        expect(validators.animeTitle('   ')).toBe(false);
        expect(validators.animeTitle('a'.repeat(201))).toBe(false);
      });
    });

    describe('year', () => {
      test('should validate correct year', () => {
        expect(validators.year(2020)).toBe(true);
        expect(validators.year(1990)).toBe(true);
      });

      test('should reject invalid year', () => {
        expect(validators.year(1800)).toBe(false);
        expect(validators.year(3000)).toBe(false);
        expect(validators.year('2020')).toBe(false);
      });
    });

    describe('rating', () => {
      test('should validate correct rating', () => {
        expect(validators.rating(5)).toBe(true);
        expect(validators.rating(10)).toBe(true);
        expect(validators.rating(1)).toBe(true);
      });

      test('should reject invalid rating', () => {
        expect(validators.rating(0)).toBe(false);
        expect(validators.rating(11)).toBe(false);
        expect(validators.rating('5')).toBe(false);
      });
    });
  });

  describe('sanitizers', () => {
    describe('html', () => {
      test('should remove script tags', () => {
        const html = '<p>Hello</p><script>alert("xss")</script>';
        const sanitized = sanitizers.html(html);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).toContain('<p>Hello</p>');
      });

      test('should remove iframe tags', () => {
        const html = '<p>Hello</p><iframe src="evil.com"></iframe>';
        const sanitized = sanitizers.html(html);
        expect(sanitized).not.toContain('<iframe>');
      });

      test('should remove event handlers', () => {
        const html = '<div onclick="alert()">Click</div>';
        const sanitized = sanitizers.html(html);
        expect(sanitized).not.toContain('onclick');
      });

      test('should handle empty input', () => {
        expect(sanitizers.html('')).toBe('');
        expect(sanitizers.html(null)).toBe('');
      });
    });

    describe('text', () => {
      test('should trim text', () => {
        expect(sanitizers.text('  hello  ')).toBe('hello');
      });

      test('should respect maxLength', () => {
        const longText = 'a'.repeat(100);
        const sanitized = sanitizers.text(longText, { maxLength: 50 });
        expect(sanitized.length).toBe(50);
      });

      test('should remove newlines when allowNewlines is false', () => {
        const text = 'line1\nline2\nline3';
        const sanitized = sanitizers.text(text, { allowNewlines: false });
        expect(sanitized).not.toContain('\n');
      });
    });

    describe('searchQuery', () => {
      test('should sanitize search query', () => {
        expect(sanitizers.searchQuery('  test query  ')).toBe('test query');
      });

      test('should remove HTML characters', () => {
        expect(sanitizers.searchQuery('test<>query')).toBe('testquery');
      });

      test('should remove quotes', () => {
        expect(sanitizers.searchQuery('test"query\'here')).toBe('testqueryhere');
      });

      test('should limit length', () => {
        const longQuery = 'a'.repeat(150);
        const sanitized = sanitizers.searchQuery(longQuery);
        expect(sanitized.length).toBe(100);
      });
    });
  });

  describe('textUtils', () => {
    describe('truncate', () => {
      test('should truncate long text', () => {
        const text = 'This is a long text that needs truncation';
        const truncated = textUtils.truncate(text, 20);
        expect(truncated).toBe('This is a long te...');
      });

      test('should not truncate short text', () => {
        const text = 'Short';
        expect(textUtils.truncate(text, 20)).toBe('Short');
      });

      test('should use custom suffix', () => {
        const text = 'This is a long text';
        const truncated = textUtils.truncate(text, 10, '---');
        expect(truncated).toContain('---');
      });
    });

    describe('excerpt', () => {
      test('should extract excerpt from text', () => {
        const text = 'This is a long text that should be excerpted properly';
        const excerpt = textUtils.excerpt(text, 20);
        expect(excerpt.length).toBeLessThanOrEqual(23);
        expect(excerpt).toContain('...');
      });

      test('should remove HTML tags', () => {
        const text = '<p>This is <strong>HTML</strong> content</p>';
        const excerpt = textUtils.excerpt(text, 50);
        expect(excerpt).not.toContain('<p>');
        expect(excerpt).not.toContain('<strong>');
      });
    });

    describe('wordCount', () => {
      test('should count words correctly', () => {
        expect(textUtils.wordCount('one two three')).toBe(3);
        expect(textUtils.wordCount('single')).toBe(1);
      });

      test('should handle HTML content', () => {
        const html = '<p>one two three</p>';
        expect(textUtils.wordCount(html)).toBe(3);
      });

      test('should return 0 for empty text', () => {
        expect(textUtils.wordCount('')).toBe(0);
        expect(textUtils.wordCount(null)).toBe(0);
      });
    });

    describe('readingTime', () => {
      test('should calculate reading time', () => {
        const text = 'word '.repeat(400);
        expect(textUtils.readingTime(text)).toBe('2 min read');
      });

      test('should handle short text', () => {
        const text = 'Just a few words';
        expect(textUtils.readingTime(text)).toBe('Less than 1 min read');
      });

      test('should handle singular minute', () => {
        const text = 'word '.repeat(200);
        expect(textUtils.readingTime(text)).toBe('1 min read');
      });
    });
  });

  describe('arrayUtils', () => {
    describe('unique', () => {
      test('should remove duplicates from simple array', () => {
        const array = [1, 2, 2, 3, 3, 4];
        expect(arrayUtils.unique(array)).toEqual([1, 2, 3, 4]);
      });

      test('should remove duplicates by key', () => {
        const array = [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 1, name: 'C' }
        ];
        const unique = arrayUtils.unique(array, 'id');
        expect(unique).toHaveLength(2);
        expect(unique[0].id).toBe(1);
        expect(unique[1].id).toBe(2);
      });

      test('should handle empty array', () => {
        expect(arrayUtils.unique([])).toEqual([]);
      });
    });

    describe('chunk', () => {
      test('should chunk array into smaller arrays', () => {
        const array = [1, 2, 3, 4, 5, 6, 7];
        const chunks = arrayUtils.chunk(array, 3);
        expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
      });

      test('should handle empty array', () => {
        expect(arrayUtils.chunk([], 3)).toEqual([]);
      });

      test('should handle invalid size', () => {
        expect(arrayUtils.chunk([1, 2, 3], 0)).toEqual([]);
        expect(arrayUtils.chunk([1, 2, 3], -1)).toEqual([]);
      });
    });

    describe('shuffle', () => {
      test('should shuffle array', () => {
        const array = [1, 2, 3, 4, 5];
        const shuffled = arrayUtils.shuffle(array);
        
        expect(shuffled).toHaveLength(array.length);
        expect(shuffled).toEqual(expect.arrayContaining(array));
        // Original array should not be modified
        expect(array).toEqual([1, 2, 3, 4, 5]);
      });

      test('should handle empty array', () => {
        expect(arrayUtils.shuffle([])).toEqual([]);
      });
    });
  });

  describe('dateUtils', () => {
    describe('formatDate', () => {
      test('should format date as YYYY-MM-DD', () => {
        const date = new Date('2023-06-15');
        expect(dateUtils.formatDate(date, 'YYYY-MM-DD')).toBe('2023-06-15');
      });

      test('should format date as DD/MM/YYYY', () => {
        const date = new Date('2023-06-15');
        expect(dateUtils.formatDate(date, 'DD/MM/YYYY')).toBe('15/06/2023');
      });

      test('should format date as MM/DD/YYYY', () => {
        const date = new Date('2023-06-15');
        expect(dateUtils.formatDate(date, 'MM/DD/YYYY')).toBe('06/15/2023');
      });

      test('should handle invalid date', () => {
        expect(dateUtils.formatDate('invalid')).toBe('');
        expect(dateUtils.formatDate(null)).toBe('');
      });
    });

    describe('timeAgo', () => {
      test('should return "just now" for recent dates', () => {
        const now = new Date();
        expect(dateUtils.timeAgo(now)).toBe('just now');
      });

      test('should return minutes ago', () => {
        const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
        expect(dateUtils.timeAgo(date)).toBe('5 minutes ago');
      });

      test('should return hours ago', () => {
        const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
        expect(dateUtils.timeAgo(date)).toBe('3 hours ago');
      });

      test('should return days ago', () => {
        const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        expect(dateUtils.timeAgo(date)).toBe('2 days ago');
      });

      test('should handle future dates', () => {
        const future = new Date(Date.now() + 1000000);
        expect(dateUtils.timeAgo(future)).toBe('in the future');
      });
    });
  });

  describe('generateId', () => {
    test('should generate random ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBe(16); // 8 bytes = 16 hex chars
    });

    test('should respect custom length', () => {
      const id = generateId(16);
      expect(id.length).toBe(32); // 16 bytes = 32 hex chars
    });
  });

  describe('generateHash', () => {
    test('should generate consistent hash for same data', () => {
      const data = { test: 'value' };
      const hash1 = generateHash(data);
      const hash2 = generateHash(data);
      
      expect(hash1).toBe(hash2);
    });

    test('should generate different hash for different data', () => {
      const hash1 = generateHash({ test: 'value1' });
      const hash2 = generateHash({ test: 'value2' });
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('deepClone', () => {
    test('should deep clone object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    test('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });
  });
});
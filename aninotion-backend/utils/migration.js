const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const { generateUniqueSlug, generateExcerpt, calculateReadingTime } = require('../utils/postHelpers');
const logger = require('../config/logger');
const connectDB = require('../config/database');

/**
 * Migration to add new fields to existing posts
 * This is safe to run multiple times - it will only update missing fields
 */
const migratePostsFields = async () => {
  try {
    logger.info("🔄 Starting posts migration...");
    
    // Get all posts that need migration
    const posts = await Post.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' },
        { status: { $exists: false } },
        { publishedAt: { $exists: false } },
        { views: { $exists: false } },
        { likesCount: { $exists: false } },
        { excerpt: { $exists: false } },
        { readingTimeMinutes: { $exists: false } },
        { isDeleted: { $exists: false } }
      ]
    });
    
    logger.info(`📊 Found ${posts.length} posts requiring migration`);
    
    if (posts.length === 0) {
      logger.info("✅ No posts need migration");
      return { updated: 0, skipped: 0 };
    }
    
    let updated = 0;
    let skipped = 0;
    
    // Process posts in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      logger.info(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(posts.length/batchSize)}`);
      
      for (const post of batch) {
        try {
          let needsUpdate = false;
          
          // Generate slug if missing
          if (!post.slug) {
            post.slug = await generateUniqueSlug(post.title, post._id);
            needsUpdate = true;
            logger.debug(`Generated slug for post ${post._id}: ${post.slug}`);
          }
          
          // Set default status if missing
          if (!post.status) {
            post.status = 'published';
            needsUpdate = true;
          }
          
          // Set publishedAt if missing (use createdAt as fallback)
          if (!post.publishedAt && post.status === 'published') {
            post.publishedAt = post.createdAt || new Date();
            needsUpdate = true;
          }
          
          // Initialize counters if missing
          if (post.views === undefined) {
            post.views = 0;
            needsUpdate = true;
          }
          
          if (post.likesCount === undefined) {
            post.likesCount = 0;
            needsUpdate = true;
          }
          
          // Generate excerpt if missing
          if (!post.excerpt && post.content) {
            post.excerpt = generateExcerpt(post.content);
            needsUpdate = true;
          }
          
          // Calculate reading time if missing
          if (!post.readingTimeMinutes && post.content) {
            post.readingTimeMinutes = calculateReadingTime(post.content);
            needsUpdate = true;
          }
          
          // Set isDeleted if missing
          if (post.isDeleted === undefined) {
            post.isDeleted = false;
            needsUpdate = true;
          }
          
          // Initialize tags array if missing
          if (!post.tags) {
            post.tags = [];
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            await post.save();
            updated++;
            logger.debug(`✅ Updated post ${post._id}: ${post.title}`);
          } else {
            skipped++;
          }
          
        } catch (error) {
          logger.error(`❌ Failed to migrate post ${post._id}:`, {
            error: error.message,
            postTitle: post.title
          });
          skipped++;
        }
      }
    }
    
    logger.info("✅ Posts migration completed", {
      totalPosts: posts.length,
      updated,
      skipped
    });
    
    return { updated, skipped };
    
  } catch (error) {
    logger.error("❌ Posts migration failed:", {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Create initial admin user if none exists
 */
const createInitialAdmin = async () => {
  try {
    logger.info("👤 Checking for admin users...");
    
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount > 0) {
      logger.info(`✅ Found ${adminCount} admin users, skipping creation`);
      return null;
    }
    
    // Create default admin user
    const defaultAdmin = {
      email: 'admin@aninotion.com',
      name: 'Administrator',
      password: 'admin123456', // Should be changed immediately
      role: 'admin'
    };
    
    const admin = new User(defaultAdmin);
    await admin.save();
    
    logger.info("✅ Default admin user created", {
      email: admin.email,
      userId: admin._id
    });
    
    console.log(`
    🎉 Default admin user created:
    📧 Email: ${admin.email}
    🔑 Password: admin123456
    
    ⚠️  IMPORTANT: Change this password immediately after first login!
    `);
    
    return admin;
    
  } catch (error) {
    logger.error("❌ Failed to create admin user:", {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Add unique index to slug field after migration
 */
const addSlugIndex = async () => {
  try {
    logger.info("📇 Adding unique index to slug field...");
    
    // Check if index already exists
    const indexes = await Post.collection.getIndexes();
    const slugIndexExists = Object.keys(indexes).some(key => 
      key.includes('slug') && indexes[key].some(field => field[0] === 'slug')
    );
    
    if (slugIndexExists) {
      logger.info("✅ Slug index already exists");
      return;
    }
    
    // Add unique index
    await Post.collection.createIndex(
      { slug: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { slug: { $exists: true, $ne: null, $ne: '' } }
      }
    );
    
    logger.info("✅ Unique index added to slug field");
    
  } catch (error) {
    logger.error("❌ Failed to add slug index:", {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Run all migrations
 */
const runMigration = async () => {
  try {
    logger.info("🚀 Starting AniNotion v0.5 migration...");
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    
    // 1. Create initial admin user
    const admin = await createInitialAdmin();
    
    // 2. Migrate post fields
    const migrationResult = await migratePostsFields();
    
    // 3. Add slug index
    await addSlugIndex();
    
    logger.info("🎉 Migration completed successfully!", {
      adminCreated: !!admin,
      postsUpdated: migrationResult.updated,
      postsSkipped: migrationResult.skipped
    });
    
    return {
      success: true,
      adminCreated: !!admin,
      postsUpdated: migrationResult.updated,
      postsSkipped: migrationResult.skipped
    };
    
  } catch (error) {
    logger.error("❌ Migration failed:", {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  migratePostsFields,
  createInitialAdmin,
  addSlugIndex,
  runMigration
};

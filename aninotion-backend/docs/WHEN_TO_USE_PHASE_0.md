# When to Use Phase 0 Tools - Practical Guide

This guide explains the specific scenarios when you should use each Phase 0 tool and provides step-by-step instructions.

## 🔧 Environment Configuration (`config/environment.js`)

### When to Use:
- **Every time the server starts** (automatically used)
- **When adding new environment variables**
- **When switching between development/staging/production**
- **When debugging configuration issues**

### How to Use:
```javascript
// In any file that needs configuration
const config = require('./config/environment');

// Get database URL
const dbUrl = config.getDatabase();

// Check if features are enabled
const features = config.getFeatures();
if (features.enableRecommendations) {
  // Recommendation logic here
}

// Get security settings
const { jwtSecret, jwtExpiry } = config.getSecurity();
```

### Real Examples:
```bash
# 1. Starting development
NODE_ENV=development npm start

# 2. Testing staging environment
NODE_ENV=staging npm start

# 3. Production deployment
NODE_ENV=production npm start
```

---

## 💾 Backup System (`utils/backup.js`)

### When to Use:

#### **ALWAYS Before:**
- Adding new features to the database
- Running migrations
- Major deployments
- Database schema changes
- Bulk data operations

#### **Regularly:**
- Daily automated backups
- Before weekend deployments
- Before testing new features

### How to Use:
```bash
# Create backup before making changes
npm run backup

# Or using CLI directly
npm run cli backup create

# List all backups
npm run cli backup list

# Restore if something goes wrong
npm run cli backup restore backup_2025-08-27_143022.gz
```

### Real Scenarios:

#### Scenario 1: Adding Anime Integration Feature
```bash
# Before implementing anime data models
npm run backup
# Now safe to add anime-related migrations
```

#### Scenario 2: Production Deployment
```bash
# Before deploying to production
NODE_ENV=production npm run backup
# Deploy your changes
# If issues occur, restore quickly
```

#### Scenario 3: Testing Bulk Operations
```bash
# Before running a script that updates many posts
npm run backup
node scripts/updateAllPosts.js
# If script causes issues, restore from backup
```

---

## 🔄 Migration System (`utils/migration.js`)

### When to Use:

#### **Required For:**
- Adding new fields to existing models
- Changing data types
- Adding new collections
- Updating existing data structure
- Adding indexes for performance

### How to Use:
```bash
# Check what migrations are pending
npm run migrate status

# Run all pending migrations
npm run migrate

# Run specific migration
npm run cli migration run add-anime-fields

# Rollback last migration (if needed)
npm run cli migration rollback
```

### Real Migration Examples:

#### Migration 1: Adding SEO Fields
```javascript
// migrations/001_add_seo_fields.js
module.exports = {
  name: 'add_seo_fields',
  description: 'Add SEO meta fields to posts',
  up: async (db) => {
    await db.collection('posts').updateMany(
      {},
      {
        $set: {
          seoTitle: '',
          seoDescription: '',
          slug: ''
        }
      }
    );
  },
  down: async (db) => {
    await db.collection('posts').updateMany(
      {},
      {
        $unset: {
          seoTitle: '',
          seoDescription: '',
          slug: ''
        }
      }
    );
  }
};
```

#### When to Run:
```bash
# Before implementing SEO features
npm run backup  # Safety first!
npm run migrate # Apply the migration
```

#### Migration 2: Adding Relations
```javascript
// migrations/002_add_post_relations.js
module.exports = {
  name: 'add_post_relations',
  description: 'Add related posts functionality',
  up: async (db) => {
    await db.collection('posts').updateMany(
      {},
      {
        $set: {
          relatedPosts: [],
          tags: []
        }
      }
    );
  }
};
```

---

## 🛠️ Utility Functions (`utils/common.js`)

### When to Use:

#### **In Your Code:**
- Creating slugs for URLs
- Validating user input
- Processing large datasets
- Standardizing data formats

### How to Use:
```javascript
const { 
  generateSlug, 
  validateEmail, 
  batchProcess 
} = require('../utils/common');

// Creating post slug
const postSlug = generateSlug(postTitle);

// Validating email
if (!validateEmail(userEmail)) {
  throw new Error('Invalid email');
}

// Processing many posts
await batchProcess(posts, async (batch) => {
  // Process each batch of posts
  for (const post of batch) {
    post.slug = generateSlug(post.title);
    await post.save();
  }
});
```

### Real Examples:

#### Example 1: Creating SEO-friendly URLs
```javascript
// In your post creation route
app.post('/api/posts', async (req, res) => {
  const { generateSlug } = require('../utils/common');
  
  const post = new Post({
    title: req.body.title,
    slug: generateSlug(req.body.title), // Auto-generate slug
    content: req.body.content
  });
  
  await post.save();
});
```

#### Example 2: Bulk Processing Posts
```javascript
// Adding slugs to existing posts
const { batchProcess } = require('../utils/common');

async function addSlugsToAllPosts() {
  const posts = await Post.find({ slug: { $exists: false } });
  
  await batchProcess(posts, async (batch) => {
    const bulkOps = batch.map(post => ({
      updateOne: {
        filter: { _id: post._id },
        update: { slug: generateSlug(post.title) }
      }
    }));
    
    await Post.bulkWrite(bulkOps);
  });
}
```

---

## 🖥️ CLI Tools (`scripts/cli.js`)

### When to Use:

#### **Development:**
- Setting up new development environment
- Running maintenance tasks
- Testing database operations
- Debugging issues

#### **Production:**
- Scheduled maintenance
- Emergency operations
- Health checks
- Automated deployments

### Available Commands:
```bash
# Health checks
npm run health              # Overall system health
npm run cli health db       # Database connection
npm run cli health config   # Configuration validation

# Backup operations
npm run backup             # Create backup
npm run cli backup list    # List all backups
npm run cli backup clean   # Remove old backups

# Migration operations
npm run migrate           # Run migrations
npm run cli migration status  # Check migration status
npm run cli migration rollback  # Rollback migrations

# Maintenance
npm run cli maintenance indexes  # Rebuild database indexes
npm run cli maintenance cleanup  # Clean temporary files
```

---

## 📅 Real-World Usage Timeline

### Daily Development:
```bash
# Morning startup
NODE_ENV=development npm start

# Before implementing new feature
npm run backup
npm run health

# After adding new model fields
npm run migrate
```

### Before Major Feature (e.g., Anime Integration):
```bash
# 1. Backup current state
npm run backup

# 2. Check system health
npm run health

# 3. Create migration for new anime fields
npm run cli migration create add-anime-integration

# 4. Run migration
npm run migrate

# 5. Implement feature code

# 6. Test everything works
npm run health
```

### Before Production Deployment:
```bash
# 1. Final backup
NODE_ENV=production npm run backup

# 2. Health check
NODE_ENV=production npm run health

# 3. Run production migrations
NODE_ENV=production npm run migrate

# 4. Deploy application

# 5. Post-deployment health check
NODE_ENV=production npm run health
```

### Emergency Situations:
```bash
# Database corruption or bad migration
npm run cli backup restore backup_2025-08-27_143022.gz

# Rolling back a problematic migration
npm run cli migration rollback

# System health diagnosis
npm run health
npm run cli health db
npm run cli health config
```

---

## 🚨 When NOT to Use

### Don't Use Backup/Restore:
- ❌ On every small code change
- ❌ When only changing frontend code
- ❌ For temporary testing (use staging environment)

### Don't Use Migrations:
- ❌ For one-time data fixes (use scripts instead)
- ❌ When only adding new endpoints
- ❌ For configuration changes only

### Don't Use CLI Tools:
- ❌ In production without testing first
- ❌ When you're not sure what they do
- ❌ During active user sessions (for maintenance commands)

---

## 📋 Quick Reference Checklist

### Before ANY Database Changes:
- [ ] Create backup: `npm run backup`
- [ ] Check health: `npm run health`
- [ ] Have rollback plan ready

### When Adding New Features:
- [ ] Update environment variables if needed
- [ ] Create migration if database changes needed
- [ ] Use utility functions for common operations
- [ ] Test with staging environment first

### Before Production Deployment:
- [ ] Backup production database
- [ ] Run migrations in staging first
- [ ] Health check all systems
- [ ] Have emergency contacts ready

This guide ensures you use the right tool at the right time, maintaining system stability while developing new features efficiently.

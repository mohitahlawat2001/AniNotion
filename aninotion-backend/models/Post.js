const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  // SEO-friendly URL slug (unique will be added later after migration)
  slug: {
    type: String,
    trim: true
  },
  animeName: {
    type: String,
    required: true
  },
  episodeNumber: {
    type: Number,
    required: false
  },
  seasonNumber: {
    type: Number,
    required: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // Post lifecycle management
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'published' // Default for existing posts
  },
  publishedAt: {
    type: Date
  },
  // User management fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  likesCount: {
    type: Number,
    default: 0
  },
  bookmarksCount: {
    type: Number,
    default: 0
  },
  // Content organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  excerpt: {
    type: String,
    trim: true
  },
  readingTimeMinutes: {
    type: Number,
    default: 0
  },
  // Soft delete for safety
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Existing image fields
  image: {
    type: String,
    default: ''
  },
  images: [{
    type: String,
    required: false
  }], // Array of image URLs
  // Recommendation engine fields
  contentHash: {
    type: String,
    index: true
  },
  contentLength: {
    type: Number,
    default: 0
  },
  // Store TF-IDF features for similarity calculations (can be populated on-demand)
  tfidfFeatures: {
    type: Map,
    of: Number,
    default: new Map()
  },
  // Engagement score for ranking recommendations
  engagementScore: {
    type: Number,
    default: 0,
    index: true
  },
  // Last time similarity was calculated
  lastSimilarityUpdate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance and uniqueness
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ category: 1, status: 1, publishedAt: -1 }); // Added for category filter + status + sort
postSchema.index({ createdBy: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ isDeleted: 1 });
postSchema.index({ slug: 1 }); // Unique will be added after migration

// Virtual for published posts query
postSchema.statics.findPublished = function(query = {}) {
  return this.find({
    ...query,
    status: 'published',
    isDeleted: false
  }).populate('category createdBy updatedBy', '-passwordHash');
};

// Instance method to increment views
postSchema.methods.incrementViews = function() {
  this.views = (this.views || 0) + 1;
  return this.save();
};

// Instance method to generate excerpt
postSchema.methods.generateExcerpt = function(length = 160) {
  if (this.content) {
    // Remove HTML tags and get plain text
    const plainText = this.content.replace(/<[^>]*>/g, '').trim();
    this.excerpt = plainText.length > length 
      ? plainText.substring(0, length) + '...' 
      : plainText;
  }
  return this.excerpt;
};

// Instance method to calculate reading time
postSchema.methods.calculateReadingTime = function() {
  if (this.content) {
    const wordsPerMinute = 200;
    const words = this.content.split(/\s+/).length;
    this.readingTimeMinutes = Math.ceil(words / wordsPerMinute);
  }
  return this.readingTimeMinutes;
};

// Instance method to calculate engagement score
postSchema.methods.calculateEngagementScore = function() {
  // Weighted engagement score: views (0.3) + likes (0.5) + bookmarks (0.2)
  const viewsScore = (this.views || 0) * 0.3;
  const likesScore = (this.likesCount || 0) * 0.5;
  const bookmarksScore = (this.bookmarksCount || 0) * 0.2;
  
  // Apply time decay factor (newer posts get slight boost)
  const daysSincePublish = this.publishedAt 
    ? (Date.now() - this.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const timeFactor = Math.exp(-daysSincePublish / 365); // Decay over a year
  
  this.engagementScore = (viewsScore + likesScore + bookmarksScore) * (0.5 + 0.5 * timeFactor);
  return this.engagementScore;
};

// Pre-save middleware to auto-generate fields
postSchema.pre('save', function(next) {
  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.generateExcerpt();
  }
  
  // Calculate reading time if not provided
  if (!this.readingTimeMinutes && this.content) {
    this.calculateReadingTime();
  }
  
  // Calculate content length
  if (this.content) {
    this.contentLength = this.content.length;
  }
  
  // Set publishedAt if status is published and not already set
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Post', postSchema);
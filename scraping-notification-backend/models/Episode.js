const mongoose = require('mongoose');

/**
 * Episode Model
 * Stores individual episode information with source tracking
 */
const episodeSchema = new mongoose.Schema({
  // Reference to parent anime
  anime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anime',
    required: true,
    index: true
  },
  
  // Episode identification
  episodeNumber: {
    type: Number,
    required: true,
    index: true
  },
  
  episodeTitle: {
    type: String,
    trim: true
  },
  
  // Episode type
  type: {
    type: String,
    enum: ['regular', 'special', 'ova', 'movie', 'recap'],
    default: 'regular'
  },
  
  // Visual content
  thumbnailUrl: {
    type: String,
    required: true
  },
  
  screenshotUrls: [{
    type: String
  }],
  
  // Episode metadata
  description: {
    type: String,
    trim: true
  },
  
  duration: {
    type: Number, // Duration in minutes
  },
  
  airDate: {
    type: Date,
    index: true
  },
  
  // Source tracking - PRIMARY SOURCE
  primarySource: {
    website: {
      type: String,
      required: true,
      index: true
    },
    url: {
      type: String,
      required: true
    },
    watchUrl: {
      type: String,
      required: true
    },
    dataId: String,
    quality: String, // '720p', '1080p', etc.
    subtitles: [String], // ['English', 'Japanese', 'Spanish']
    dubbed: Boolean,
    scrapedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  
  // Additional sources for this episode
  additionalSources: [{
    website: String,
    url: String,
    watchUrl: String,
    dataId: String,
    quality: String,
    subtitles: [String],
    dubbed: Boolean,
    scrapedAt: Date
  }],
  
  // Status
  isComplete: {
    type: Boolean,
    default: false
  },
  
  isNew: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Release tracking
  releaseDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // User engagement tracking
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  views: {
    type: Number,
    default: 0
  },
  
  // Post generation
  postGenerated: {
    type: Boolean,
    default: false,
    index: true
  },
  
  generatedPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  postGeneratedAt: {
    type: Date
  },
  
  // Rich metadata for post creation
  postMetadata: {
    title: String,        // Generated post title
    excerpt: String,      // Short description for post
    content: String,      // Full post content (HTML/Markdown)
    images: [String],     // Images to include in post
    tags: [String],       // Tags for the post
    category: String      // Post category
  }
  
}, {
  timestamps: true
});

// Compound indexes
episodeSchema.index({ anime: 1, episodeNumber: 1 }, { unique: true });
episodeSchema.index({ 'primarySource.website': 1, 'primarySource.dataId': 1 });
episodeSchema.index({ anime: 1, releaseDate: -1 });
episodeSchema.index({ isNew: 1, releaseDate: -1 });
episodeSchema.index({ postGenerated: 1, isNew: 1 });

// Virtual for composite title
episodeSchema.virtual('fullTitle').get(function() {
  return this.episodeTitle 
    ? `Episode ${this.episodeNumber}: ${this.episodeTitle}`
    : `Episode ${this.episodeNumber}`;
});

// Methods
episodeSchema.methods.addSource = function(source) {
  // Check if source already exists
  const exists = this.additionalSources.some(s => 
    s.website === source.website && s.dataId === source.dataId
  );
  
  if (!exists) {
    this.additionalSources.push({
      ...source,
      scrapedAt: new Date()
    });
  }
};

episodeSchema.methods.markAsSeen = function(userId) {
  if (!this.seenBy.includes(userId)) {
    this.seenBy.push(userId);
  }
  return this.save();
};

episodeSchema.methods.generatePostMetadata = function(animeName) {
  // Auto-generate post metadata
  this.postMetadata = {
    title: `${animeName} - Episode ${this.episodeNumber}${this.episodeTitle ? ': ' + this.episodeTitle : ''}`,
    excerpt: this.description || `Watch ${animeName} Episode ${this.episodeNumber} online now!`,
    content: this._generatePostContent(animeName),
    images: [this.thumbnailUrl, ...this.screenshotUrls].filter(Boolean),
    tags: ['anime', animeName.toLowerCase().replace(/\s+/g, '-'), `episode-${this.episodeNumber}`],
    category: 'anime-release'
  };
  
  return this.save();
};

episodeSchema.methods._generatePostContent = function(animeName) {
  let content = `<h2>${animeName} - Episode ${this.episodeNumber}</h2>\n\n`;
  
  if (this.episodeTitle) {
    content += `<h3>${this.episodeTitle}</h3>\n\n`;
  }
  
  if (this.description) {
    content += `<p>${this.description}</p>\n\n`;
  }
  
  content += `<p>Watch this episode now on multiple platforms:</p>\n\n`;
  content += `<ul>\n`;
  content += `  <li><strong>${this.primarySource.website}</strong>: <a href="${this.primarySource.watchUrl}" target="_blank">Watch Now</a></li>\n`;
  
  this.additionalSources.forEach(source => {
    content += `  <li><strong>${source.website}</strong>: <a href="${source.watchUrl}" target="_blank">Watch Now</a></li>\n`;
  });
  
  content += `</ul>\n`;
  
  return content;
};

// Statics
episodeSchema.statics.findByAnime = function(animeId, options = {}) {
  const query = this.find({ anime: animeId });
  
  if (options.newOnly) {
    query.where({ isNew: true });
  }
  
  query.sort({ episodeNumber: options.ascending ? 1 : -1 });
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query;
};

episodeSchema.statics.findUngenerated = function(limit = 10) {
  return this.find({ 
    postGenerated: false,
    isNew: true 
  })
  .populate('anime', 'name coverImage')
  .sort({ releaseDate: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Episode', episodeSchema);

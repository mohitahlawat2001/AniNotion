const mongoose = require('mongoose');

const animeReleaseSchema = new mongoose.Schema({
  // Anime identification
  title: {
    type: String,
    required: true,
    trim: true
  },
  animeName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  episodeNumber: {
    type: Number,
    required: false
  },
  
  // Visual content
  thumbnailUrl: {
    type: String,
    required: true
  },
  
  // External links
  watchUrl: {
    type: String,
    required: true
  },
  animePageUrl: {
    type: String,
    required: false
  },
  
  // Source tracking
  sourceWebsite: {
    type: String,
    required: true,
    default: 'animepahe'
  },
  dataId: {
    type: String,
    required: false,
    index: true
  },
  
  // Dates and status
  releaseDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  isNew: {
    type: Boolean,
    default: true
  },
  
  // Status markers
  isComplete: {
    type: Boolean,
    default: false
  },
  
  // User tracking - store which users have seen this release
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Compound index for uniqueness - prevent duplicate releases
animeReleaseSchema.index({ dataId: 1, episodeNumber: 1 }, { unique: true, sparse: true });
animeReleaseSchema.index({ animeName: 1, episodeNumber: 1 });

// Index for efficient queries
animeReleaseSchema.index({ releaseDate: -1 });
animeReleaseSchema.index({ isNew: 1, releaseDate: -1 });

module.exports = mongoose.model('AnimeRelease', animeReleaseSchema);

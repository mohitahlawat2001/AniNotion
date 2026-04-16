const mongoose = require('mongoose');

/**
 * Anime Master Model
 * Stores anime series information (one document per anime)
 */
const animeSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Alternative titles for matching
  alternativeTitles: [{
    type: String,
    trim: true
  }],
  
  // Anime metadata
  description: {
    type: String,
    trim: true
  },
  
  // Visual assets
  coverImage: {
    type: String, // Main cover/poster image URL
  },
  bannerImage: {
    type: String, // Banner/header image URL
  },
  
  // Categories and tags
  genres: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  
  // Anime status
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'upcoming', 'unknown'],
    default: 'unknown'
  },
  
  // Episode count
  totalEpisodes: {
    type: Number,
    default: null // null means unknown/ongoing
  },
  
  // External IDs for linking
  externalIds: {
    mal: String,        // MyAnimeList ID
    anilist: String,    // AniList ID
    kitsu: String,      // Kitsu ID
    custom: String      // Custom ID from scraping site
  },
  
  // Source tracking - where this anime info was first scraped from
  primarySource: {
    website: {
      type: String,
      required: true
    },
    url: String,
    scrapedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Additional sources that have this anime
  additionalSources: [{
    website: String,
    url: String,
    dataId: String, // External ID from that source
    scrapedAt: Date
  }],
  
  // Computed fields
  latestEpisodeNumber: {
    type: Number,
    default: 0
  },
  
  episodeCount: {
    type: Number,
    default: 0
  },
  
  // Post generation metadata
  postGenerated: {
    type: Boolean,
    default: false
  },
  
  lastPostGeneratedAt: {
    type: Date
  },
  
  // For automatic post creation
  postTemplate: {
    type: String,
    default: 'anime-release' // Template to use for post generation
  }
  
}, {
  timestamps: true
});

// Indexes for efficient queries
animeSchema.index({ name: 1 }, { unique: true });
animeSchema.index({ 'primarySource.website': 1 });
animeSchema.index({ status: 1 });
animeSchema.index({ latestEpisodeNumber: -1 });
animeSchema.index({ updatedAt: -1 });

// Text search index for anime names
animeSchema.index({ name: 'text', alternativeTitles: 'text' });

// Methods
animeSchema.methods.addSource = function(source) {
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

animeSchema.methods.updateEpisodeCount = async function() {
  const Episode = mongoose.model('Episode');
  this.episodeCount = await Episode.countDocuments({ anime: this._id });
  
  // Find latest episode number
  const latest = await Episode.findOne({ anime: this._id })
    .sort({ episodeNumber: -1 })
    .select('episodeNumber');
  
  if (latest) {
    this.latestEpisodeNumber = latest.episodeNumber;
  }
  
  return this.save();
};

module.exports = mongoose.model('Anime', animeSchema);

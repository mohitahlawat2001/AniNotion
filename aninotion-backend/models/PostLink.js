const mongoose = require('mongoose');

const postLinkSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['anime', 'manga', 'other'],
    default: 'anime'
  },
  platform: {
    type: String,
    trim: true,
    maxlength: 50
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
postLinkSchema.index({ post: 1, isDeleted: 1 });

const PostLink = mongoose.model('PostLink', postLinkSchema);

module.exports = PostLink;

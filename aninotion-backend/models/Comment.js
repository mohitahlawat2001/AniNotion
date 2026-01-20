const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // The post this comment belongs to
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  // The user who created the comment (required - only logged-in users can comment)
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Comment text content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000 // Reasonable limit for comment length
  },
  // Support for photos in comments (for future implementation)
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String // Cloudinary public ID for deletion
    },
    altText: {
      type: String,
      default: ''
    }
  }],
  // Parent comment for nested replies (optional, for future threading)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  // Track if comment was edited
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  // Soft delete for safety
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Engagement metrics (for future use)
  likesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
commentSchema.index({ post: 1, createdAt: -1 }); // Get comments for a post sorted by date
commentSchema.index({ author: 1, createdAt: -1 }); // Get comments by a user
commentSchema.index({ parentComment: 1 }); // For threaded replies
commentSchema.index({ isDeleted: 1 });

// Virtual for reply count (if implementing threaded comments)
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

// Static method to find active comments for a post
commentSchema.statics.findByPost = function(postId, options = {}) {
  const { page = 1, limit = 20, sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  
  return this.find({
    post: postId,
    isDeleted: false,
    parentComment: null // Only get top-level comments
  })
    .populate('author', 'name email profilePicture')
    .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find replies to a comment
commentSchema.statics.findReplies = function(commentId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({
    parentComment: commentId,
    isDeleted: false
  })
    .populate('author', 'name email profilePicture')
    .sort({ createdAt: 1 }) // Oldest first for replies
    .skip(skip)
    .limit(limit);
};

// Instance method for soft delete
commentSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Pre-save middleware
commentSchema.pre('save', function(next) {
  // Mark as edited if content changed and not new
  if (!this.isNew && this.isModified('content')) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Comment', commentSchema);

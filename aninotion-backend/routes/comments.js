const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { v2: cloudinary } = require('cloudinary');
const logger = require('../config/logger');

// Configure Cloudinary (if not already configured globally)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @route   GET /api/comments/post/:postId
 * @desc    Get all comments for a specific post
 * @access  Public (but shows more info to authenticated users)
 */
router.get('/post/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20, sortOrder = 'desc' } = req.query;

    logger.info("📝 Fetching comments for post", {
      postId,
      page,
      limit,
      userId: req.user?._id,
      ip: req.ip
    });

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'The post you are looking for does not exist'
      });
    }

    // Get comments for the post
    const comments = await Comment.findByPost(postId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortOrder
    });

    // Get reply counts for each comment
    const commentIds = comments.map(c => c._id);
    const replyCounts = await Comment.aggregate([
      { $match: { parentComment: { $in: commentIds }, isDeleted: false } },
      { $group: { _id: '$parentComment', count: { $sum: 1 } } }
    ]);
    
    // Create a map of comment ID to reply count
    const replyCountMap = replyCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    // Add reply count to each comment
    const commentsWithReplyCounts = comments.map(comment => ({
      ...comment.toObject(),
      replyCount: replyCountMap[comment._id.toString()] || 0
    }));

    // Get total count for pagination
    const totalCount = await Comment.countDocuments({
      post: postId,
      isDeleted: false,
      parentComment: null
    });

    logger.info("✅ Comments fetched successfully", {
      postId,
      count: comments.length,
      totalCount
    });

    res.json({
      comments: commentsWithReplyCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasMore: parseInt(page) * parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    logger.error("❌ Error fetching comments", {
      error: error.message,
      postId: req.params.postId,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to fetch comments',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/comments/:commentId/replies
 * @desc    Get replies to a specific comment
 * @access  Public
 */
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const replies = await Comment.findReplies(commentId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const totalCount = await Comment.countDocuments({
      parentComment: commentId,
      isDeleted: false
    });

    res.json({
      replies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasMore: parseInt(page) * parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    logger.error("❌ Error fetching replies", {
      error: error.message,
      commentId: req.params.commentId
    });

    res.status(500).json({
      error: 'Failed to fetch replies',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/comments
 * @desc    Create a new comment on a post
 * @access  Private (authenticated users only)
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { postId, content, parentCommentId, images } = req.body;

    logger.info("📝 Creating new comment", {
      userId: req.user._id,
      postId,
      hasImages: !!(images && images.length),
      isReply: !!parentCommentId
    });

    // Validate required fields
    if (!postId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Post ID is required'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Comment content is required'
      });
    }

    // Verify post exists and is accessible
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'The post you are trying to comment on does not exist'
      });
    }

    if (post.isDeleted) {
      return res.status(400).json({
        error: 'Cannot comment',
        message: 'Cannot comment on a deleted post'
      });
    }

    // Verify parent comment exists if replying
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.isDeleted) {
        return res.status(404).json({
          error: 'Parent comment not found',
          message: 'The comment you are replying to does not exist'
        });
      }
      // Ensure parent comment belongs to the same post
      if (parentComment.post.toString() !== postId) {
        return res.status(400).json({
          error: 'Invalid parent comment',
          message: 'Parent comment does not belong to this post'
        });
      }
    }

    // Process images if provided (for future photo support)
    let processedImages = [];
    if (images && Array.isArray(images) && images.length > 0) {
      // Limit number of images per comment
      if (images.length > 5) {
        return res.status(400).json({
          error: 'Too many images',
          message: 'Maximum 5 images allowed per comment'
        });
      }

      // Upload images to Cloudinary
      for (const image of images) {
        try {
          const uploadResult = await cloudinary.uploader.upload(image.data || image, {
            folder: 'aninotion/comments',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          });

          processedImages.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            altText: image.altText || ''
          });
        } catch (uploadError) {
          logger.error("❌ Error uploading comment image", {
            error: uploadError.message,
            userId: req.user._id
          });
          // Continue with other images, don't fail the whole comment
        }
      }
    }

    // Create the comment
    const comment = new Comment({
      post: postId,
      author: req.user._id,
      content: content.trim(),
      images: processedImages,
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Update post's comment count
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 }
    });

    // Populate author info for response
    await comment.populate('author', 'name email profilePicture');

    logger.info("✅ Comment created successfully", {
      commentId: comment._id,
      postId,
      userId: req.user._id
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    logger.error("❌ Error creating comment", {
      error: error.message,
      userId: req.user._id,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to create comment',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment (only by the author)
 * @access  Private (authenticated, owner only)
 */
router.put('/:commentId', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    logger.info("📝 Updating comment", {
      commentId,
      userId: req.user._id
    });

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The comment you are trying to update does not exist'
      });
    }

    if (comment.isDeleted) {
      return res.status(400).json({
        error: 'Cannot update',
        message: 'Cannot update a deleted comment'
      });
    }

    // Check ownership (only author can edit, or admin)
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only edit your own comments'
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Comment content is required'
      });
    }

    // Update the comment
    comment.content = content.trim();
    await comment.save(); // Pre-save middleware will set isEdited flag

    await comment.populate('author', 'name email profilePicture');

    logger.info("✅ Comment updated successfully", {
      commentId,
      userId: req.user._id
    });

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    logger.error("❌ Error updating comment", {
      error: error.message,
      commentId: req.params.commentId,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Failed to update comment',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment (soft delete)
 * @access  Private (authenticated, owner or admin)
 */
router.delete('/:commentId', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;

    logger.info("🗑️ Deleting comment", {
      commentId,
      userId: req.user._id
    });

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The comment you are trying to delete does not exist'
      });
    }

    if (comment.isDeleted) {
      return res.status(400).json({
        error: 'Already deleted',
        message: 'This comment has already been deleted'
      });
    }

    // Check ownership (only author can delete, or admin)
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only delete your own comments'
      });
    }

    // Soft delete the comment
    await comment.softDelete(req.user._id);

    // Update post's comment count
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 }
    });

    // Delete images from Cloudinary if any
    if (comment.images && comment.images.length > 0) {
      for (const image of comment.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (deleteError) {
            logger.warn("⚠️ Failed to delete comment image from Cloudinary", {
              publicId: image.publicId,
              error: deleteError.message
            });
          }
        }
      }
    }

    logger.info("✅ Comment deleted successfully", {
      commentId,
      userId: req.user._id
    });

    res.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    logger.error("❌ Error deleting comment", {
      error: error.message,
      commentId: req.params.commentId,
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Failed to delete comment',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/comments/user/:userId
 * @desc    Get all comments by a specific user
 * @access  Private (authenticated, own comments or admin)
 */
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Only allow users to see their own comments or admin to see anyone's
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only view your own comments'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({
      author: userId,
      isDeleted: false
    })
      .populate('post', 'title slug')
      .populate('author', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Comment.countDocuments({
      author: userId,
      isDeleted: false
    });

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasMore: parseInt(page) * parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    logger.error("❌ Error fetching user comments", {
      error: error.message,
      userId: req.params.userId
    });

    res.status(500).json({
      error: 'Failed to fetch user comments',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/comments/:commentId/images
 * @desc    Add images to an existing comment
 * @access  Private (authenticated, owner only)
 */
router.post('/:commentId/images', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { images } = req.body;

    logger.info("📷 Adding images to comment", {
      commentId,
      userId: req.user._id,
      imageCount: images?.length
    });

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The comment you are trying to update does not exist'
      });
    }

    // Check ownership
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only add images to your own comments'
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'At least one image is required'
      });
    }

    // Check total image limit
    const currentImageCount = comment.images?.length || 0;
    if (currentImageCount + images.length > 5) {
      return res.status(400).json({
        error: 'Too many images',
        message: `Maximum 5 images allowed. Current: ${currentImageCount}, Trying to add: ${images.length}`
      });
    }

    // Upload images to Cloudinary
    const processedImages = [];
    for (const image of images) {
      try {
        const uploadResult = await cloudinary.uploader.upload(image.data || image, {
          folder: 'aninotion/comments',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        });

        processedImages.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          altText: image.altText || ''
        });
      } catch (uploadError) {
        logger.error("❌ Error uploading comment image", {
          error: uploadError.message,
          userId: req.user._id
        });
      }
    }

    // Add images to comment
    comment.images = [...(comment.images || []), ...processedImages];
    await comment.save();

    await comment.populate('author', 'name email profilePicture');

    logger.info("✅ Images added to comment successfully", {
      commentId,
      addedCount: processedImages.length
    });

    res.json({
      message: 'Images added successfully',
      comment
    });
  } catch (error) {
    logger.error("❌ Error adding images to comment", {
      error: error.message,
      commentId: req.params.commentId
    });

    res.status(500).json({
      error: 'Failed to add images',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/comments/:commentId/images/:imageIndex
 * @desc    Remove an image from a comment
 * @access  Private (authenticated, owner only)
 */
router.delete('/:commentId/images/:imageIndex', requireAuth, async (req, res) => {
  try {
    const { commentId, imageIndex } = req.params;
    const index = parseInt(imageIndex);

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The comment does not exist'
      });
    }

    // Check ownership
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only remove images from your own comments'
      });
    }

    if (!comment.images || index < 0 || index >= comment.images.length) {
      return res.status(400).json({
        error: 'Invalid image index',
        message: 'The specified image does not exist'
      });
    }

    // Get the image to delete
    const imageToDelete = comment.images[index];

    // Delete from Cloudinary
    if (imageToDelete.publicId) {
      try {
        await cloudinary.uploader.destroy(imageToDelete.publicId);
      } catch (deleteError) {
        logger.warn("⚠️ Failed to delete image from Cloudinary", {
          publicId: imageToDelete.publicId,
          error: deleteError.message
        });
      }
    }

    // Remove from comment
    comment.images.splice(index, 1);
    await comment.save();

    await comment.populate('author', 'name email profilePicture');

    logger.info("✅ Image removed from comment", {
      commentId,
      imageIndex: index
    });

    res.json({
      message: 'Image removed successfully',
      comment
    });
  } catch (error) {
    logger.error("❌ Error removing image from comment", {
      error: error.message,
      commentId: req.params.commentId
    });

    res.status(500).json({
      error: 'Failed to remove image',
      message: error.message
    });
  }
});

module.exports = router;

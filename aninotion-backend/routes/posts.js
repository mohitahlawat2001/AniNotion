const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { v2: cloudinary } = require('cloudinary');
const { processImages } = require('../utils/imageProcessor');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { 
  generateUniqueSlug, 
  generateExcerpt, 
  calculateReadingTime, 
  processTags,
  isValidStatusTransition,
  buildPostQuery 
} = require('../utils/postHelpers');
const logger = require('../config/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

logger.info("🖼️ Cloudinary configured", {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || "not set",
  apiKeySet: !!process.env.CLOUDINARY_API_KEY,
  apiSecretSet: !!process.env.CLOUDINARY_API_SECRET
});

// Get all posts (for home page)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, category, tags, limit, page, sortBy = 'publishedAt', sortOrder = 'desc' } = req.query;
    
    logger.info("📝 Fetching posts", {
      userId: req.user?._id,
      userRole: req.user?.role,
      status,
      category,
      tags,
      limit,
      page,
      ip: req.ip
    });
    
    // Build query based on user permissions
    const query = buildPostQuery(req.user);
    
    // Add optional filters
    if (status && (req.user?.role === 'admin' || req.user?.role === 'editor')) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Pagination
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    
    // Sort options
    const validSortFields = ['publishedAt', 'createdAt', 'updatedAt', 'views', 'likesCount', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'publishedAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const posts = await Post.find(query)
      .populate('category', 'name slug color') // Only get essential category fields
      .populate('createdBy', 'name email') // Only get essential user fields
      .select('-content -__v') // Exclude heavy content field and __v
      .sort({ [sortField]: sortDirection })
      .limit(limitNum)
      .skip(skip)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Post.countDocuments(query);
    
    logger.info("✅ Posts fetched successfully", {
      count: posts.length,
      totalCount,
      page: pageNum,
      limit: limitNum,
      userId: req.user?._id
    });
    
    res.json({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    logger.error("❌ Error fetching posts:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Get posts by category
router.get('/category/:categoryId', optionalAuth, async (req, res) => {
  try {
    const { status, limit, page, sortBy = 'publishedAt', sortOrder = 'desc' } = req.query;
    const { categoryId } = req.params;
    
    logger.info("📂 Fetching posts by category", {
      categoryId,
      userId: req.user?._id,
      userRole: req.user?.role,
      status,
      ip: req.ip
    });
    console.log("📂 Fetching posts by category", {
      categoryId,
      userId: req.user?._id,
      userRole: req.user?.role,
      status,
      ip: req.ip
    });
    
    // Build query based on user permissions
    const query = buildPostQuery(req.user, { category: categoryId });
    
    // Add status filter if user has permission
    if (status && (req.user?.role === 'admin' || req.user?.role === 'editor')) {
      query.status = status;
    }
    
    // Pagination
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    
    // Sort options
    const validSortFields = ['publishedAt', 'createdAt', 'updatedAt', 'views', 'likesCount', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'publishedAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const posts = await Post.find(query)
      .populate('category', 'name slug color') // Only get essential category fields
      .populate('createdBy', 'name email') // Only get essential user fields
      .select('-content -__v') // Exclude heavy content field and __v
      .sort({ [sortField]: sortDirection })
      .limit(limitNum)
      .skip(skip)
      .lean();
    console.log("📂 Fetched posts:", { count: posts.length });
    console.log("📂 Fetched posts:", { posts });
    // Get total count for pagination
    const totalCount = await Post.countDocuments(query);
      
    logger.info("✅ Posts fetched by category successfully", {
      categoryId,
      count: posts.length,
      totalCount,
      userId: req.user?._id
    });
    
    res.json({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    logger.error("❌ Error fetching posts by category:", {
      error: error.message,
      stack: error.stack,
      categoryId: req.params.categoryId,
      userId: req.user?._id
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Get single post by ID or slug
router.get('/:identifier', optionalAuth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { incrementViews = 'true' } = req.query;
    
    logger.info("📄 Fetching single post", {
      identifier,
      userId: req.user?._id,
      userRole: req.user?.role,
      ip: req.ip
    });
    
    // Try to find by ID first, then by slug
    let query;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId
      query = { _id: identifier };
    } else {
      // Assume it's a slug
      query = { slug: identifier };
    }
    
    // Apply permission-based filters
    const permissionQuery = buildPostQuery(req.user, query);
    
    const post = await Post.findOne(permissionQuery)
      .populate('category')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
      
    if (!post) {
      logger.warn("❌ Post not found", {
        identifier,
        userId: req.user?._id,
        ip: req.ip
      });
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment views for published posts (unless explicitly disabled)
    if (post.status === 'published' && incrementViews === 'true') {
      // Don't wait for this to complete
      post.incrementViews().catch(error => {
        logger.error("Failed to increment views:", {
          postId: post._id,
          error: error.message
        });
      });
    }
      
    logger.info("✅ Post fetched successfully", {
      postId: post._id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      views: post.views,
      userId: req.user?._id
    });
    
    res.json(post);
  } catch (error) {
    logger.error("❌ Error fetching post:", {
      error: error.message,
      stack: error.stack,
      identifier: req.params.identifier,
      userId: req.user?._id
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Create new post
router.post('/', requireAuth, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { 
      title, 
      animeName, 
      category, 
      content, 
      images, 
      imageTypes,
      status = 'published',
      tags,
      excerpt,
      publishedAt
    } = req.body;
    
    logger.info("📝 Creating new post", {
      title,
      animeName,
      category,
      status,
      imageCount: images ? images.length : 0,
      userId: req.user._id,
      userRole: req.user.role,
      ip: req.ip
    });
    
    // Validation
    if (!title || !animeName || !category || !content) {
      logger.warn("Post creation failed: Missing required fields", {
        title: !!title,
        animeName: !!animeName,
        category: !!category,
        content: !!content,
        userId: req.user._id
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Title, anime name, category, and content are required'
      });
    }
    
    let imageUrls = [];
    
    // Process images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        logger.info("🖼️ Processing images for post", {
          imageCount: images.length,
          userId: req.user._id
        });
        
        // Use imageTypes array if provided, otherwise assume all are base64
        const types = imageTypes || new Array(images.length).fill(false);
        imageUrls = await processImages(images, types);
        
        logger.info("✅ Images processed successfully", {
          processedCount: imageUrls.length,
          userId: req.user._id
        });
      } catch (uploadError) {
        logger.error("❌ Image processing failed:", {
          error: uploadError.message,
          stack: uploadError.stack,
          userId: req.user._id
        });
        
        return res.status(400).json({ 
          message: 'Image processing failed', 
          error: uploadError.message 
        });
      }
    }
    
    // Generate slug from title
    const slug = await generateUniqueSlug(title);
    
    // Process tags
    const processedTags = processTags(tags);
    
    // Create post object
    const postData = {
      title,
      slug,
      animeName,
      category,
      content,
      status,
      tags: processedTags,
      images: imageUrls,
      createdBy: req.user._id,
      excerpt: excerpt || generateExcerpt(content),
      readingTimeMinutes: calculateReadingTime(content)
    };
    
    // Set publishedAt if status is published
    if (status === 'published') {
      postData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
    }
    
    const post = new Post(postData);
    const savedPost = await post.save();
    
    // Populate the response
    const populatedPost = await Post.findById(savedPost._id)
      .populate('category')
      .populate('createdBy', 'name email');
    
    logger.info("✅ Post created successfully", {
      postId: savedPost._id,
      title,
      slug,
      status,
      animeName,
      imageCount: imageUrls.length,
      userId: req.user._id,
      userEmail: req.user.email
    });
    
    res.status(201).json(populatedPost);
  } catch (error) {
    logger.error("❌ Error creating post:", {
      error: error.message,
      stack: error.stack,
      requestBody: { title, animeName, category },
      userId: req.user?._id
    });
    
    res.status(400).json({ message: error.message });
  }
});

// Update post
router.put('/:id', requireAuth, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { 
      title, 
      animeName, 
      category, 
      content, 
      status,
      tags,
      excerpt,
      publishedAt
    } = req.body;
    
    logger.info("✏️ Updating post", {
      postId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      ip: req.ip
    });

    // Find the existing post
    const existingPost = await Post.findById(req.params.id);
    
    if (!existingPost) {
      logger.warn("⚠️ Post not found for update", {
        postId: req.params.id,
        userId: req.user._id
      });
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user can edit this post
    if (req.user.role !== 'admin' && 
        existingPost.createdBy && 
        existingPost.createdBy.toString() !== req.user._id.toString()) {
      logger.warn("⚠️ User attempted to edit post they don't own", {
        postId: req.params.id,
        postCreatedBy: existingPost.createdBy,
        userId: req.user._id,
        userRole: req.user.role
      });
      return res.status(403).json({ 
        message: 'You can only edit posts you created' 
      });
    }
    
    // Validate status transition
    if (status && status !== existingPost.status) {
      if (!isValidStatusTransition(existingPost.status, status, req.user.role)) {
        logger.warn("⚠️ Invalid status transition attempted", {
          postId: req.params.id,
          currentStatus: existingPost.status,
          newStatus: status,
          userRole: req.user.role,
          userId: req.user._id
        });
        return res.status(400).json({
          message: `Cannot change status from ${existingPost.status} to ${status}`
        });
      }
    }
    
    // Prepare update data
    const updateData = {
      updatedBy: req.user._id
    };
    
    // Update fields if provided
    if (title !== undefined) {
      updateData.title = title;
      // Regenerate slug if title changed
      if (title !== existingPost.title) {
        updateData.slug = await generateUniqueSlug(title, req.params.id);
      }
    }
    
    if (animeName !== undefined) updateData.animeName = animeName;
    if (category !== undefined) updateData.category = category;
    if (content !== undefined) {
      updateData.content = content;
      // Regenerate excerpt and reading time if content changed
      if (!excerpt) {
        updateData.excerpt = generateExcerpt(content);
      }
      updateData.readingTimeMinutes = calculateReadingTime(content);
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (tags !== undefined) updateData.tags = processTags(tags);
    
    // Handle status changes
    if (status !== undefined) {
      updateData.status = status;
      
      // Set publishedAt when publishing
      if (status === 'published' && existingPost.status !== 'published') {
        updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
      }
      // Clear publishedAt when unpublishing
      else if (status !== 'published' && existingPost.status === 'published') {
        updateData.publishedAt = null;
      }
    }
    
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category')
     .populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');
    
    logger.info("✅ Post updated successfully", {
      postId: req.params.id,
      title: updatedPost.title,
      status: updatedPost.status,
      userId: req.user._id,
      userEmail: req.user.email
    });
    
    res.json(updatedPost);
  } catch (error) {
    logger.error("❌ Error updating post:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(400).json({ message: error.message });
  }
});

// Delete post (soft delete)
router.delete('/:id', requireAuth, requireRole('admin', 'editor'), async (req, res) => {
  try {
    logger.info("🗑️ Deleting post", {
      postId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      ip: req.ip
    });

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      logger.warn("⚠️ Post not found for deletion", {
        postId: req.params.id,
        userId: req.user._id
      });
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user can delete this post
    if (req.user.role !== 'admin' && 
        post.createdBy && 
        post.createdBy.toString() !== req.user._id.toString()) {
      logger.warn("⚠️ User attempted to delete post they don't own", {
        postId: req.params.id,
        postCreatedBy: post.createdBy,
        userId: req.user._id,
        userRole: req.user.role
      });
      return res.status(403).json({ 
        message: 'You can only delete posts you created' 
      });
    }
    
    // Soft delete
    post.isDeleted = true;
    post.updatedBy = req.user._id;
    await post.save();
    
    logger.info("✅ Post soft deleted successfully", {
      postId: req.params.id,
      title: post.title,
      userId: req.user._id,
      userEmail: req.user.email
    });
    
    res.json({ 
      message: 'Post deleted successfully',
      postId: post._id,
      title: post.title
    });
  } catch (error) {
    logger.error("❌ Error deleting post:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Publish/unpublish post endpoint
router.put('/:id/publish', requireAuth, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { action } = req.body; // 'publish' or 'unpublish'
    
    logger.info("📢 Changing post publish status", {
      postId: req.params.id,
      action,
      userId: req.user._id,
      userRole: req.user.role
    });
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && 
        post.createdBy && 
        post.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only modify posts you created' 
      });
    }
    
    let newStatus;
    if (action === 'publish') {
      newStatus = 'published';
      post.publishedAt = new Date();
    } else if (action === 'unpublish') {
      newStatus = 'draft';
      post.publishedAt = null;
    } else {
      return res.status(400).json({ 
        message: 'Action must be "publish" or "unpublish"' 
      });
    }
    
    // Validate transition
    if (!isValidStatusTransition(post.status, newStatus, req.user.role)) {
      return res.status(400).json({
        message: `Cannot ${action} post with current status: ${post.status}`
      });
    }
    
    post.status = newStatus;
    post.updatedBy = req.user._id;
    await post.save();
    
    const updatedPost = await Post.findById(post._id)
      .populate('category')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    logger.info("✅ Post publish status changed successfully", {
      postId: req.params.id,
      action,
      newStatus,
      userId: req.user._id
    });
    
    res.json({
      message: `Post ${action}ed successfully`,
      post: updatedPost
    });
    
  } catch (error) {
    logger.error("❌ Error changing post publish status:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Like/unlike post endpoint
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Simple increment for now - in future we can track individual user likes
    post.likesCount = (post.likesCount || 0) + 1;
    await post.save();
    
    logger.info("👍 Post liked", {
      postId: req.params.id,
      newLikesCount: post.likesCount,
      ip: req.ip
    });
    
    res.json({
      message: 'Post liked successfully',
      likesCount: post.likesCount
    });
    
  } catch (error) {
    logger.error("❌ Error liking post:", {
      error: error.message,
      postId: req.params.id
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Publish/unpublish post
router.put('/:id/publish', requireAuth, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { publish = true, publishedAt } = req.body;
    
    logger.info("📰 Changing post publish status", {
      postId: req.params.id,
      publish,
      userId: req.user._id,
      userRole: req.user.role,
      ip: req.ip
    });

    const existingPost = await Post.findById(req.params.id);
    
    if (!existingPost) {
      logger.warn("⚠️ Post not found for publish status change", {
        postId: req.params.id,
        userId: req.user._id
      });
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user can edit this post
    if (req.user.role !== 'admin' && 
        existingPost.createdBy && 
        existingPost.createdBy.toString() !== req.user._id.toString()) {
      logger.warn("⚠️ User attempted to publish/unpublish post they don't own", {
        postId: req.params.id,
        postCreatedBy: existingPost.createdBy,
        userId: req.user._id,
        userRole: req.user.role
      });
      return res.status(403).json({ 
        message: 'You can only publish/unpublish posts you created' 
      });
    }
    
    const updateData = {
      status: publish ? 'published' : 'draft',
      updatedBy: req.user._id
    };
    
    if (publish) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
    } else {
      updateData.publishedAt = null;
    }
    
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category')
     .populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');
    
    logger.info("✅ Post publish status changed successfully", {
      postId: req.params.id,
      title: updatedPost.title,
      status: updatedPost.status,
      publishedAt: updatedPost.publishedAt,
      userId: req.user._id
    });
    
    res.json(updatedPost);
  } catch (error) {
    logger.error("❌ Error changing post publish status:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Like/unlike post (increment counter)
router.post('/:id/like', async (req, res) => {
  try {
    const { postId } = req.params;
    
    logger.info("👍 Incrementing post likes", {
      postId,
      ip: req.ip
    });

    const post = await Post.findById(postId);
    
    if (!post) {
      logger.warn("⚠️ Post not found for like", {
        postId
      });
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Simple increment - in a real app you'd track which users liked what
    post.likesCount = (post.likesCount || 0) + 1;
    await post.save();
    
    logger.info("✅ Post like incremented", {
      postId,
      newLikesCount: post.likesCount
    });
    
    res.json({ 
      likesCount: post.likesCount,
      message: 'Post liked successfully'
    });
  } catch (error) {
    logger.error("❌ Error liking post:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id
    });
    
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
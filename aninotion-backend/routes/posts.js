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
const { sanitizers } = require('../utils/helpers');
const logger = require('../config/logger');
const viewCounter = require('../utils/viewCounter');
const User = require('../models/User');

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
  const startTime = Date.now();
  
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
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.query.sessionId,
      requestId: req.id
    });
    
    // Build query based on user permissions
    const query = buildPostQuery(req.user);
    
    // Add optional filters - only admins and editors can filter by status
    // If no status filter is provided, editors and admins see all posts
    if (status && (req.user?.role === 'admin' || req.user?.role === 'editor')) {
      query.status = status;
    }
    // For non-admin/editor users, buildPostQuery already restricts to published only
    console.log(query);
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
    const validSortFields = ['publishedAt', 'createdAt', 'updatedAt', 'views', 'likesCount', 'bookmarksCount', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'publishedAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const posts = await Post.find(query)
      .populate('category', 'name slug color') // Only get essential category fields
      .populate('createdBy', 'name email') // Only get essential user fields
      .select('-content -__v') // Exclude heavy content field and __v
      .sort({ [sortField]: sortDirection })
      .limit(limitNum)
      .skip(skip)
      .maxTimeMS(10000) // Timeout after 10 seconds
      .lean();
    
    // Get total count for pagination
    const totalCount = await Post.countDocuments(query).maxTimeMS(5000); // Timeout after 5 seconds
    
    logger.info("✅ Posts fetched successfully", {
      count: posts.length,
      totalCount,
      page: pageNum,
      limit: limitNum,
      userId: req.user?._id,
      duration: Date.now() - startTime,
      requestId: req.id
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
      userId: req.user?._id,
      query: JSON.stringify(query),
      sortField,
      sortDirection,
      limitNum,
      pageNum,
      skip
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Get current user's posts (including drafts)
router.get('/users/me/posts', requireAuth, async (req, res) => {
  try {
    const { status, limit, page, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    logger.info("📝 Fetching user's own posts", {
      userId: req.user._id,
      userRole: req.user.role,
      status
    });
    
    // Build query - user can see all their own posts regardless of status
    const query = {
      createdBy: req.user._id,
      isDeleted: { $ne: true }
    };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    
    // Sort options
    const validSortFields = ['publishedAt', 'createdAt', 'updatedAt', 'views', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const posts = await Post.find(query)
      .populate('category', 'name slug color')
      .select('-__v')
      .sort({ [sortField]: sortDirection })
      .limit(limitNum)
      .skip(skip)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Post.countDocuments(query);
    
    // Get counts by status
    const draftCount = await Post.countDocuments({ 
      createdBy: req.user._id, 
      status: 'draft',
      isDeleted: { $ne: true }
    });
    const publishedCount = await Post.countDocuments({ 
      createdBy: req.user._id, 
      status: 'published',
      isDeleted: { $ne: true }
    });
    
    logger.info("✅ User's posts fetched successfully", {
      userId: req.user._id,
      count: posts.length,
      totalCount,
      draftCount,
      publishedCount
    });
    
    res.json({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      },
      counts: {
        draft: draftCount,
        published: publishedCount,
        total: totalCount
      }
    });
  } catch (error) {
    logger.error("❌ Error fetching user's posts:", {
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
    const validSortFields = ['publishedAt', 'createdAt', 'updatedAt', 'views', 'likesCount', 'bookmarksCount', 'title'];
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
    
    // Note: Views are now incremented via separate /:id/view endpoint for engaged viewing
    
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
router.post('/', requireAuth, requireRole('admin', 'editor', 'viewer'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      title, 
      animeName, 
      episodeNumber,
      seasonNumber,
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
      contentLength: content ? content.length : 0,
      userId: req.user._id,
      userRole: req.user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.id
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
    
    // Check post limit for viewers (users can only create one post per day)
    if (req.user.role === 'viewer') {
      // Get start of today (midnight)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const todaysPostsCount = await Post.countDocuments({ 
        createdBy: req.user._id,
        createdAt: { $gte: startOfToday }
      });
      
      if (todaysPostsCount >= 1) {
        logger.warn("Post creation failed: User has reached daily post limit", {
          userId: req.user._id,
          userRole: req.user.role,
          todaysPostsCount,
          ip: req.ip
        });
        return res.status(403).json({
          error: 'Daily post limit reached',
          message: 'Users can only create one post per day. Please try again tomorrow.'
        });
      }
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
    
    // Sanitize HTML content to prevent XSS attacks
    const sanitizedContent = sanitizers.html(content);
    
    // Create post object
    const postData = {
      title,
      slug,
      animeName,
      episodeNumber,
      seasonNumber,
      category,
      content: sanitizedContent,
      status,
      tags: processedTags,
      images: imageUrls,
      createdBy: req.user._id,
      excerpt: excerpt || generateExcerpt(sanitizedContent),
      readingTimeMinutes: calculateReadingTime(sanitizedContent)
    };
    
    // Set publishedAt if status is published
    if (status === 'published') {
      postData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
    }
    
    const post = new Post(postData);
    const savedPost = await post.save();
    
    // Add post to user's createdPosts array
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { createdPosts: savedPost._id } }
    );
    
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
      contentLength: content.length,
      readingTime: savedPost.readingTimeMinutes,
      userId: req.user._id,
      userEmail: req.user.email,
      duration: Date.now() - startTime,
      requestId: req.id
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
router.put('/:id', requireAuth, requireRole('admin', 'editor', 'viewer'), async (req, res) => {
  try {
    const { 
      title, 
      animeName, 
      episodeNumber,
      seasonNumber,
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
    // Admins and editors can edit any post
    // Viewers can only edit posts they created
    if ((req.user.role === 'viewer') && 
        existingPost.createdBy && 
        existingPost.createdBy.toString() !== req.user._id.toString()) {
      logger.warn("⚠️ Viewer attempted to edit post they don't own", {
        postId: req.params.id,
        postCreatedBy: existingPost.createdBy,
        userId: req.user._id,
        userRole: req.user.role
      });
      return res.status(403).json({ 
        message: 'You can only edit posts you created' 
      });
    }
    
    // Viewers can only edit their draft posts, not published ones
    // Admins and editors can edit any post status
    if (req.user.role === 'viewer' && existingPost.status !== 'draft') {
      logger.warn("⚠️ Viewer attempted to edit non-draft post", {
        postId: req.params.id,
        postStatus: existingPost.status,
        userId: req.user._id
      });
      return res.status(403).json({ 
        message: 'You can only edit your draft posts. Published posts cannot be edited.' 
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
    if (episodeNumber !== undefined) updateData.episodeNumber = episodeNumber;
    if (seasonNumber !== undefined) updateData.seasonNumber = seasonNumber;
    if (category !== undefined) updateData.category = category;
    if (content !== undefined) {
      // Sanitize HTML content to prevent XSS attacks
      const sanitizedContent = sanitizers.html(content);
      updateData.content = sanitizedContent;
      // Regenerate excerpt and reading time if content changed
      if (!excerpt) {
        updateData.excerpt = generateExcerpt(sanitizedContent);
      }
      updateData.readingTimeMinutes = calculateReadingTime(sanitizedContent);
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
    
    // Remove post from creator's createdPosts array
    if (post.createdBy) {
      await User.findByIdAndUpdate(
        post.createdBy,
        { $pull: { createdPosts: post._id } }
      );
    }
    
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

// Increment view count for a post (engaged view)
router.post('/:id/view', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    logger.info("👁️ Incrementing post view", {
      postId: id,
      userId: req.user?._id,
      sessionId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.id
    });

    const post = await Post.findById(id);

    if (!post) {
      logger.warn("⚠️ Post not found for view increment", {
        postId: id,
        userId: req.user?._id,
        sessionId,
        duration: Date.now() - startTime
      });
      return res.status(404).json({ message: 'Post not found' });
    }

    // Use Redis for view counting with session tracking
    const viewCounted = await viewCounter.incrementView(id, sessionId);

    if (viewCounted) {
      logger.info("✅ Post view counted", {
        postId: id,
        sessionId,
        wasNewView: true,
        duration: Date.now() - startTime
      });
    } else {
      logger.info("ℹ️ Post view already counted for this session", {
        postId: id,
        sessionId,
        wasNewView: false,
        duration: Date.now() - startTime
      });
    }

    // Get current counts
    const views = await viewCounter.getViewCount(id);
    const likes = await viewCounter.getLikesCount(id);

    res.json({
      viewCounted,
      views,
      likes
    });
  } catch (error) {
    logger.error("❌ Error incrementing view:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user?._id,
      duration: Date.now() - startTime
    });

    res.status(500).json({ message: error.message });
  }
});

// Toggle like for a post
router.post('/:id/like', requireAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const userId = req.user._id;

    logger.info("👍 Toggling post like", {
      postId: id,
      userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.id
    });

    const post = await Post.findById(id);

    if (!post) {
      logger.warn("⚠️ Post not found for like toggle", {
        postId: id,
        userId,
        duration: Date.now() - startTime
      });
      return res.status(404).json({ message: 'Post not found' });
    }

    // Use Redis for like tracking
    const { liked, likesCount } = await viewCounter.toggleLike(id, userId);

    // Update user's likedPosts array
    if (liked) {
      await User.findByIdAndUpdate(userId, { $addToSet: { likedPosts: id } });
    } else {
      await User.findByIdAndUpdate(userId, { $pull: { likedPosts: id } });
    }

    logger.info("✅ Post like toggled", {
      postId: id,
      userId,
      liked,
      likesCount,
      action: liked ? 'liked' : 'unliked',
      duration: Date.now() - startTime
    });

    res.json({
      liked,
      likesCount,
      message: liked ? 'Post liked' : 'Post unliked'
    });
  } catch (error) {
    logger.error("❌ Error toggling like:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user?._id,
      duration: Date.now() - startTime
    });

    res.status(500).json({ message: error.message });
  }
});

// Track detailed engagement metrics for a post
router.post('/:id/engagement/track', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { 
      sessionId, 
      action, 
      duration, 
      scrollDepth, 
      timeSpent,
      interactions 
    } = req.body;
    
    const userId = req.user?._id;

    logger.info("📊 Tracking engagement metrics", {
      postId: id,
      userId,
      sessionId,
      action,
      duration,
      scrollDepth,
      timeSpent,
      interactions: interactions ? interactions.length : 0,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.id
    });

    const post = await Post.findById(id);

    if (!post) {
      logger.warn("⚠️ Post not found for engagement tracking", {
        postId: id,
        userId,
        sessionId,
        duration: Date.now() - startTime
      });
      return res.status(404).json({ message: 'Post not found' });
    }

    // Store engagement metrics in Redis for analytics
    const engagementKey = `post:engagement:${id}:${userId || sessionId}`;
    const engagementData = {
      userId: userId || null,
      sessionId,
      action,
      duration: duration || timeSpent || 0,
      scrollDepth: scrollDepth || 0,
      interactions: interactions || [],
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    // Store as JSON string in Redis with TTL (24 hours)
    await viewCounter.redis.setex(engagementKey, 86400, JSON.stringify(engagementData));

    // Also add to a time-series list for the post
    const timeSeriesKey = `post:engagement:timeseries:${id}`;
    await viewCounter.redis.lpush(timeSeriesKey, JSON.stringify({
      ...engagementData,
      recordedAt: new Date().toISOString()
    }));
    
    // Keep only last 1000 entries per post
    await viewCounter.redis.ltrim(timeSeriesKey, 0, 999);

    logger.info("✅ Engagement metrics tracked", {
      postId: id,
      userId,
      sessionId,
      action,
      duration: engagementData.duration,
      scrollDepth: engagementData.scrollDepth,
      duration: Date.now() - startTime
    });

    res.json({
      message: 'Engagement metrics recorded',
      tracked: true
    });
  } catch (error) {
    logger.error("❌ Error tracking engagement:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user?._id,
      duration: Date.now() - startTime
    });

    res.status(500).json({ message: error.message });
  }
});

// Get engagement data for a post (views, likes, user's like status)
router.get('/:id/engagement', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;
    const userId = req.user?._id;

    // For anonymous users, require sessionId to check like status
    const likeIdentifier = userId || (sessionId ? `anon_${sessionId}` : null);

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get data from Redis
    const views = await viewCounter.getViewCount(id);
    const likesCount = await viewCounter.getLikesCount(id);
    const liked = likeIdentifier ? await viewCounter.hasLiked(id, likeIdentifier) : false;

    res.json({
      views: views || post.views || 0, // Fallback to DB if Redis not available
      likesCount: likesCount || post.likesCount || 0,
      liked
    });
  } catch (error) {
    logger.error("❌ Error getting engagement data:", {
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

// ----------------------
// Save a post, Delete a post and Get all saved posts.
// ----------------------

//save a post 
router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;

    //  Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if post is already saved by user
    const user = await User.findById(req.user._id).select('savedPosts');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wasAlreadySaved = user.savedPosts.some(id => id.toString() === postId);

    // Add post to user's savedPosts (prevent duplicates)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedPosts: postId } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    // Only increment bookmark count if post was not already saved
    let updatedPost;
    if (!wasAlreadySaved) {
      updatedPost = await Post.findByIdAndUpdate(
        postId, 
        { $inc: { bookmarksCount: 1 } }, 
        { new: true }
      );
    } else {
      // Post was already saved, just return current count
      updatedPost = await Post.findById(postId).select('bookmarksCount');
    }

    res.status(200).json({ 
      message: wasAlreadySaved ? 'Post was already saved!' : 'Post saved successfully!',
      savedPosts: updatedUser.savedPosts, // returns ObjectIds
      bookmarksCount: updatedPost.bookmarksCount
    });
  } catch (err) {
    console.error('Error saving post:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unsave a post
router.delete('/:id/save', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post is currently saved by user
    const user = await User.findById(req.user._id).select('savedPosts');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wasSaved = user.savedPosts.some(id => id.toString() === postId);

    // Pull the post from savedPosts
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedPosts: postId } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    // Only decrement bookmark count if post was actually saved
    let updatedPost;
    if (wasSaved) {
      updatedPost = await Post.findByIdAndUpdate(
        postId, 
        { $inc: { bookmarksCount: -1 } }, 
        { new: true }
      );
    } else {
      // Post was not saved, just return current count
      updatedPost = await Post.findById(postId).select('bookmarksCount');
    }

    res.status(200).json({ 
      message: wasSaved ? 'Post removed from saved posts!' : 'Post was not saved!',
      savedPosts: updatedUser.savedPosts,
      bookmarksCount: updatedPost.bookmarksCount
    });
  } catch (err) {
    console.error('Error unsaving post:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all saved posts
router.get('/users/me/saved', requireAuth, async (req, res) => {
  try {
    // First get the user's saved post IDs that match permissions
    const user = await User.findById(req.user._id).select('savedPosts');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Build query for saved posts with permission filtering
    const query = {
      ...buildPostQuery(req.user),
      _id: { $in: user.savedPosts }
    };

    // Get posts using same processing as regular posts route
    const posts = await Post.find(query)
      .populate('category', 'name slug color')
      .populate('createdBy', 'name email')
      .select('-content -__v') // Same as regular posts
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean(); // Same as regular posts

    res.status(200).json({ savedPosts: posts });
  } catch (err) {
    console.error('Error fetching saved posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all liked posts for current user
router.get('/users/me/liked', requireAuth, async (req, res) => {
  try {
    // First get the user's liked post IDs
    const user = await User.findById(req.user._id).select('likedPosts');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build query for liked posts with permission filtering
    const query = buildPostQuery(req.user, {
      _id: { $in: user.likedPosts }
    });

    const posts = await Post.find(query)
      .populate('category', 'name slug color')
      .populate('createdBy', 'name email')
      .select('-content -__v')
      .sort({ createdAt: -1 });

    res.status(200).json({ likedPosts: posts });
  } catch (err) {
    console.error('Error fetching liked posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if current user has liked a specific post
router.get('/:id/liked', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const hasLiked = await viewCounter.hasLiked(id, userId);

    res.json({ liked: hasLiked });
  } catch (error) {
    logger.error("❌ Error checking like status:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id,
      userId: req.user._id
    });

    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
const express = require('express');
const router = express.Router();
const PostLink = require('../models/PostLink');
const Post = require('../models/Post');
const { requireAuth } = require('../middleware/auth');
const logger = require('../config/logger');

// Get all links for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const links = await PostLink.find({
      post: postId,
      isDeleted: false
    })
    .populate('createdBy', 'username displayName')
    .sort({ createdAt: -1 });
    
    res.json(links);
  } catch (error) {
    logger.error('Error fetching post links:', error);
    res.status(500).json({ message: 'Error fetching links', error: error.message });
  }
});

// Add a new link (requires authentication)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { postId, title, url, type, platform } = req.body;
    
    // Validate required fields
    if (!postId || !title || !url) {
      return res.status(400).json({ message: 'Post ID, title, and URL are required' });
    }
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    
    const newLink = new PostLink({
      post: postId,
      title,
      url,
      type: type || 'anime',
      platform,
      createdBy: req.user._id
    });
    
    await newLink.save();
    await newLink.populate('createdBy', 'username displayName');
    
    logger.info('Post link created', {
      linkId: newLink._id,
      postId,
      userId: req.user._id,
      type
    });
    
    res.status(201).json(newLink);
  } catch (error) {
    logger.error('Error creating post link:', error);
    res.status(500).json({ message: 'Error creating link', error: error.message });
  }
});

// Update a link (requires authentication and ownership)
router.put('/:linkId', requireAuth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { title, url, type, platform } = req.body;
    
    const link = await PostLink.findById(linkId);
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }
    
    // Check if user is the creator
    if (link.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this link' });
    }
    
    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }
    }
    
    // Update fields
    if (title) link.title = title;
    if (url) link.url = url;
    if (type) link.type = type;
    if (platform !== undefined) link.platform = platform;
    
    await link.save();
    await link.populate('createdBy', 'username displayName');
    
    logger.info('Post link updated', {
      linkId,
      userId: req.user._id
    });
    
    res.json(link);
  } catch (error) {
    logger.error('Error updating post link:', error);
    res.status(500).json({ message: 'Error updating link', error: error.message });
  }
});

// Delete a link (soft delete, requires authentication and ownership)
router.delete('/:linkId', requireAuth, async (req, res) => {
  try {
    const { linkId } = req.params;
    
    const link = await PostLink.findById(linkId);
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }
    
    // Check if user is the creator
    if (link.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this link' });
    }
    
    link.isDeleted = true;
    await link.save();
    
    logger.info('Post link deleted', {
      linkId,
      userId: req.user._id
    });
    
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post link:', error);
    res.status(500).json({ message: 'Error deleting link', error: error.message });
  }
});

module.exports = router;

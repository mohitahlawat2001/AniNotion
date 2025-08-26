const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { v2: cloudinary } = require('cloudinary');
const { processImages } = require('../utils/imageProcessor');
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
router.get('/', async (req, res) => {
  try {
    logger.info("📝 Fetching all posts");
    
    const posts = await Post.find()
      .populate('category')
      .sort({ createdAt: -1 });
      
    logger.info("✅ Posts fetched successfully", {
      count: posts.length
    });
    
    res.json(posts);
  } catch (error) {
    logger.error("❌ Error fetching posts:", {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Get posts by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    logger.info("📂 Fetching posts by category", {
      categoryId: req.params.categoryId
    });
    
    const posts = await Post.find({ category: req.params.categoryId })
      .populate('category')
      .sort({ createdAt: -1 });
      
    logger.info("✅ Posts fetched by category successfully", {
      categoryId: req.params.categoryId,
      count: posts.length
    });
    
    res.json(posts);
  } catch (error) {
    logger.error("❌ Error fetching posts by category:", {
      error: error.message,
      stack: error.stack,
      categoryId: req.params.categoryId
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    logger.info("📄 Fetching single post", {
      postId: req.params.id
    });
    
    const post = await Post.findById(req.params.id)
      .populate('category');
      
    if (!post) {
      logger.warn("❌ Post not found", {
        postId: req.params.id
      });
      return res.status(404).json({ message: 'Post not found' });
    }
      
    logger.info("✅ Post fetched successfully", {
      postId: req.params.id,
      title: post.title
    });
    
    res.json(post);
  } catch (error) {
    logger.error("❌ Error fetching post:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id
    });
    
    res.status(500).json({ message: error.message });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    const { title, animeName, category, content, images, imageTypes } = req.body;
    
    logger.info("📝 Creating new post", {
      title,
      animeName,
      category,
      imageCount: images ? images.length : 0
    });
    
    let imageUrls = [];
    
    // Process images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        logger.info("🖼️ Processing images for post", {
          imageCount: images.length
        });
        
        // Use imageTypes array if provided, otherwise assume all are base64
        const types = imageTypes || new Array(images.length).fill(false);
        imageUrls = await processImages(images, types);
        
        logger.info("✅ Images processed successfully", {
          processedCount: imageUrls.length
        });
      } catch (uploadError) {
        logger.error("❌ Image processing failed:", {
          error: uploadError.message,
          stack: uploadError.stack
        });
        
        return res.status(400).json({ 
          message: 'Image processing failed', 
          error: uploadError.message 
        });
      }
    }
    
    const post = new Post({
      title,
      animeName,
      category,
      content,
      images: imageUrls // Store array of URLs (all uploaded to Cloudinary)
    });
    
    const savedPost = await post.save();
    const populatedPost = await Post.findById(savedPost._id).populate('category');
    
    logger.info("✅ Post created successfully", {
      postId: savedPost._id,
      title,
      animeName,
      imageCount: imageUrls.length
    });
    
    res.status(201).json(populatedPost);
  } catch (error) {
    logger.error("❌ Error creating post:", {
      error: error.message,
      stack: error.stack,
      requestBody: { title, animeName, category }
    });
    
    res.status(400).json({ message: error.message });
  }
});

// Update post
router.put('/:id', async (req, res) => {
  try {
    logger.info("✏️ Updating post", {
      postId: req.params.id
    });

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('category');
    
    if (!updatedPost) {
      logger.warn("⚠️ Post not found for update", {
        postId: req.params.id
      });
      return res.status(404).json({ message: 'Post not found' });
    }
    
    logger.info("✅ Post updated successfully", {
      postId: req.params.id,
      title: updatedPost.title
    });
    
    res.json(updatedPost);
  } catch (error) {
    logger.error("❌ Error updating post:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id
    });
    
    res.status(400).json({ message: error.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    logger.info("🗑️ Deleting post", {
      postId: req.params.id
    });

    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    
    if (!deletedPost) {
      logger.warn("⚠️ Post not found for deletion", {
        postId: req.params.id
      });
      return res.status(404).json({ message: 'Post not found' });
    }
    
    logger.info("✅ Post deleted successfully", {
      postId: req.params.id,
      title: deletedPost.title
    });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error("❌ Error deleting post:", {
      error: error.message,
      stack: error.stack,
      postId: req.params.id
    });
    
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
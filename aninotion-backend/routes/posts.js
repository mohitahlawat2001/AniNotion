const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { v2: cloudinary } = require('cloudinary');
const { processImages } = require('../utils/imageProcessor');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all posts (for home page)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('category')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get posts by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const posts = await Post.find({ category: req.params.categoryId })
      .populate('category')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    const { title, animeName, category, content, images, imageTypes } = req.body;
    
    let imageUrls = [];
    
    // Process images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        // Use imageTypes array if provided, otherwise assume all are base64
        const types = imageTypes || new Array(images.length).fill(false);
        imageUrls = await processImages(images, types);
      } catch (uploadError) {
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
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update post
router.put('/:id', async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('category');
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
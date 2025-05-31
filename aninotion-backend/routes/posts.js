const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

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
    const { title, animeName, category, content, image } = req.body;
    
    const post = new Post({
      title,
      animeName,
      category,
      content,
      image
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
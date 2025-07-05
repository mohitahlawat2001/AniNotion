const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { v2: cloudinary } = require('cloudinary');

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

// // Create new post
// router.post('/', async (req, res) => {
//   try {
//     const { title, animeName, category, content, image } = req.body;
    
//     const post = new Post({
//       title,
//       animeName,
//       category,
//       content,
//       image
//     });
    
//     const savedPost = await post.save();
//     const populatedPost = await Post.findById(savedPost._id).populate('category');
//     res.status(201).json(populatedPost);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });
// Create new post
// router.post('/', async (req, res) => {
//   try {
//     const { title, animeName, category, content, images } = req.body;
    
//     let imageUrls = [];
    
//     // Upload images to Cloudinary if provided
//     if (images && Array.isArray(images) && images.length > 0) {
//       try {
//         const uploadPromises = images.map(async (image, index) => {
//           const uploadResult = await cloudinary.uploader.upload(image, {
//             folder: 'aninotion-posts',
//             public_id: `post_${Date.now()}_${index}`, // Unique identifier with index
//             resource_type: 'auto'
//           });
          
//           // Return optimized URL
//           return cloudinary.url(uploadResult.public_id, {
//             fetch_format: 'auto',
//             quality: 'auto',
//             width: 800,
//             height: 600,
//             crop: 'limit'
//           });
//         });
        
//         imageUrls = await Promise.all(uploadPromises);
//       } catch (uploadError) {
//         return res.status(400).json({ 
//           message: 'Image upload failed', 
//           error: uploadError.message 
//         });
//       }
//     }
    
//     const post = new Post({
//       title,
//       animeName,
//       category,
//       content,
//       images: imageUrls // Store array of Cloudinary URLs
//     });
    
//     const savedPost = await post.save();
//     const populatedPost = await Post.findById(savedPost._id).populate('category');
//     res.status(201).json(populatedPost);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });
// ...existing code...

// Helper function to process images based on type
const processImages = async (images, imageTypes) => {
  const processedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    if (imageTypes[i]) {
      // It's a URL, save it directly
      processedImages.push(images[i]);
    } else {
      // It's base64, upload to Cloudinary
      try {
        const uploadResult = await cloudinary.uploader.upload(images[i], {
          folder: 'aninotion-posts',
          public_id: `post_${Date.now()}_${i}`,
          resource_type: 'auto'
        });
        
        // Return optimized URL
        const optimizedUrl = cloudinary.url(uploadResult.public_id, {
          fetch_format: 'auto',
          quality: 'auto',
          width: 800,
          height: 600,
          crop: 'limit'
        });
        
        processedImages.push(optimizedUrl);
      } catch (uploadError) {
        throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`);
      }
    }
  }
  
  return processedImages;
};

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
      images: imageUrls // Store array of URLs (both uploaded and direct links)
    });
    
    const savedPost = await post.save();
    const populatedPost = await Post.findById(savedPost._id).populate('category');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ...existing code...
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
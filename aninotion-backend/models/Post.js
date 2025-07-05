const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  animeName: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  images: [{
    type: String,
    required: false
  }], // Array of image URLs
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
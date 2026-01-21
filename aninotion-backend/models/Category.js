const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  minRole: {
    type: String,
    enum: ['viewer', 'paid', 'editor', 'admin', null],
    default: null, // null means visible to all (including non-authenticated users)
    required: false
  }
}, {
  timestamps: true
});

// Helper method to check if user can view this category
categorySchema.methods.canView = function(userRole) {
  // If no minRole is set, category is visible to everyone
  if (!this.minRole) return true;
  
  // If no user role provided (not authenticated), can only see categories with no minRole
  if (!userRole) return false;
  
  // Role hierarchy: admin > editor > paid > viewer
  const roleHierarchy = { 'viewer': 1, 'paid': 2, 'editor': 3, 'admin': 4 };
  
  return roleHierarchy[userRole] >= roleHierarchy[this.minRole];
};

module.exports = mongoose.model('Category', categorySchema);
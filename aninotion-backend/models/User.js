const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  passwordHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'disabled', 'deleted'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Virtual for password (write-only)
userSchema.virtual('password').set(function(password) {
  if (password) {
    try {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      console.log('Hashing password with rounds:', rounds);
      this.passwordHash = bcrypt.hashSync(password, rounds);
      console.log('Password hashed successfully');
    } catch (error) {
      console.error('Error hashing password:', error);
      throw error;
    }
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.passwordHash);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Don't return password hash in JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

module.exports = mongoose.model('User', userSchema);

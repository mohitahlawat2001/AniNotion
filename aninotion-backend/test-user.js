const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

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
    enum: ['active', 'disabled'],
    default: 'active'
  }
}, {
  timestamps: true
});

const TestUser = mongoose.model('TestUser', userSchema);

async function testUserCreation() {
  try {
    console.log('Testing user creation...');
    
    // Create user with manual password hashing
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = bcrypt.hashSync('test123', rounds);
    
    const user = new TestUser({
      email: 'testuser@example.com',
      name: 'Test User',
      role: 'viewer',
      passwordHash: hashedPassword
    });
    
    console.log('About to save user...');
    await user.save();
    console.log('User saved successfully:', user._id);
    
    // Clean up
    await TestUser.deleteOne({ _id: user._id });
    console.log('Test user cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('Error in test:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    process.exit(1);
  }
}

testUserCreation();

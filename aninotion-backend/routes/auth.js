const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/signup - Public user registration
router.post('/signup', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    logger.info("📝 User signup attempt", {
      email,
      name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Validation
    if (!email || !password) {
      logger.warn("Signup failed: Missing required fields", {
        email: !!email,
        password: !!password,
        ip: req.ip
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }
    
    if (password.length < 6) {
      logger.warn("Signup failed: Password too short", {
        email,
        ip: req.ip
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn("Signup failed: Invalid email format", {
        email,
        ip: req.ip
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please provide a valid email address'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn("Signup failed: User already exists", {
        email,
        ip: req.ip
      });
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }
    
    // Create user
    const user = new User({
      email: email.toLowerCase(),
      name: name || email.split('@')[0], // Use email username if name not provided
      role: 'viewer', // Default role for public signup
      authProvider: 'local',
      status: 'active'
    });

    // Hash password manually
    try {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      user.passwordHash = bcrypt.hashSync(password, rounds);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      throw new Error('Failed to hash password');
    }
    
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    logger.info("✅ User signed up successfully", {
      userId: user._id,
      email: user.email,
      name: user.name,
      ip: req.ip
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error("❌ Signup error:", error);
    
    logger.error("❌ Signup error:", {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    let errorMessage = 'Failed to create account';
    if (error.message.includes('duplicate key')) {
      errorMessage = 'An account with this email already exists';
    } else if (error.name === 'ValidationError') {
      errorMessage = `Validation failed: ${error.message}`;
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/register - Create new user (admin only)
router.post('/register', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    console.log("👤 Admin creating new user");
    const { email, name, password, role = 'viewer' } = req.body;
    
    logger.info("👤 Admin creating new user", {
      adminId: req.user._id,
      adminEmail: req.user.email,
      newUserEmail: email,
      newUserRole: role,
      ip: req.ip
    });
    
    // Validation
    if (!email || !password) {
      logger.warn("Registration failed: Missing required fields", {
        email: !!email,
        password: !!password,
        adminId: req.user._id
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }
    
    if (password.length < 6) {
      logger.warn("Registration failed: Password too short", {
        email,
        adminId: req.user._id
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn("Registration failed: User already exists", {
        email,
        adminId: req.user._id
      });
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }
    
    // Create user
    const user = new User({
      email: email.toLowerCase(),
      name,
      role
    });

    // Hash password manually
    try {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      console.log('Manually hashing password with rounds:', rounds);
      user.passwordHash = bcrypt.hashSync(password, rounds);
      console.log('Password hashed manually');
    } catch (hashError) {
      console.error('Error hashing password manually:', hashError);
      throw new Error('Failed to hash password');
    }

    console.log('About to save user:', { email: user.email, name: user.name, role: user.role, hasPasswordHash: !!user.passwordHash });
    
    try {
      await user.save();
      console.log('User saved successfully:', user._id);
    } catch (saveError) {
      console.error('Error saving user:', {
        message: saveError.message,
        code: saveError.code,
        name: saveError.name,
        errors: saveError.errors
      });
      throw saveError;
    }

    logger.info("✅ User created successfully", {
      userId: user._id,
      email: user.email,
      role: user.role,
      adminId: req.user._id
    });    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error("❌ Detailed Registration error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      adminId: req.user?._id,
      requestBody: { email, name, role }
    });
    
    logger.error("❌ Registration error:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      adminId: req.user?._id
    });
    
    // Send more specific error message
    let errorMessage = 'Failed to create user account';
    if (error.message.includes('duplicate key')) {
      errorMessage = 'User with this email already exists';
    } else if (error.name === 'ValidationError') {
      errorMessage = `Validation failed: ${error.message}`;
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info("🔐 User login attempt", {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Validation
    if (!email || !password) {
      logger.warn("Login failed: Missing credentials", {
        email: !!email,
        password: !!password,
        ip: req.ip
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn("Login failed: User not found", {
        email,
        ip: req.ip
      });
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (user.status === 'disabled') {
      logger.warn("Login failed: Account disabled", {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact an administrator.'
      });
    }
    
    // Verify password
    const isValidPassword = user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Login failed: Invalid password", {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }
    
    // Update last login
    await user.updateLastLogin();
    
    // Generate token
    const token = generateToken(user._id);
    
    logger.info("✅ User login successful", {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt
      }
    });
    
  } catch (error) {
    logger.error("❌ Login error:", {
      error: error.message,
      stack: error.stack,
      email: req.body?.email,
      ip: req.ip
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', requireAuth, async (req, res) => {
  try {
    logger.info("👤 User info requested", {
      userId: req.user._id,
      email: req.user.email,
      ip: req.ip
    });
    
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        status: req.user.status,
        lastLoginAt: req.user.lastLoginAt,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
    
  } catch (error) {
    logger.error("❌ Get user info error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user information'
    });
  }
});

// PUT /api/auth/me - Update current user info (name only)
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    logger.info("👤 User updating profile", {
      userId: req.user._id,
      email: req.user.email,
      newName: name,
      ip: req.ip
    });
    
    req.user.name = name;
    await req.user.save();
    
    logger.info("✅ User profile updated successfully", {
      userId: req.user._id,
      email: req.user.email
    });
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        status: req.user.status,
        lastLoginAt: req.user.lastLoginAt,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
    
  } catch (error) {
    logger.error("❌ Update profile error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile'
    });
  }
});

// GET /api/auth/users - List all users (admin only)
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    logger.info("👥 Admin listing users", {
      adminId: req.user._id,
      adminEmail: req.user.email,
      ip: req.ip
    });
    
    const users = await User.find({})
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    
    logger.info("✅ Users list retrieved", {
      count: users.length,
      adminId: req.user._id
    });
    
    res.json({
      users
    });
    
  } catch (error) {
    logger.error("❌ List users error:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?._id
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve users'
    });
  }
});

// PUT /api/auth/users/:id/status - Enable/disable user (admin only)
router.put('/users/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;
    
    logger.info("👤 Admin updating user status", {
      adminId: req.user._id,
      targetUserId: userId,
      newStatus: status,
      ip: req.ip
    });
    
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Status must be either "active" or "disabled"'
      });
    }
    
    // Prevent admin from disabling themselves
    if (userId === req.user._id.toString()) {
      logger.warn("Admin attempted to disable own account", {
        adminId: req.user._id,
        ip: req.ip
      });
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot disable your own account'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      logger.warn("User not found for status update", {
        userId,
        adminId: req.user._id
      });
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }
    
    user.status = status;
    await user.save();
    
    logger.info("✅ User status updated successfully", {
      userId: user._id,
      email: user.email,
      status: user.status,
      adminId: req.user._id
    });
    
    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
    
  } catch (error) {
    logger.error("❌ Update user status error:", {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
      adminId: req.user?._id
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user status'
    });
  }
});

// ============================================
// Google OAuth Routes
// ============================================

// GET /api/auth/google - Initiate Google OAuth flow
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false
  })
);

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login?error=oauth_failed` : '/login?error=oauth_failed'
  }),
  async (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateToken(req.user._id);
      
      logger.info('Google OAuth login successful', {
        userId: req.user._id,
        email: req.user.email,
        authProvider: req.user.authProvider
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      
    } catch (error) {
      logger.error('Google OAuth callback error', {
        error: error.message,
        stack: error.stack
      });
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=authentication_failed`);
    }
  }
);

// GET /api/auth/google/url - Get Google OAuth URL (for frontend to use)
router.get('/google/url', (req, res) => {
  try {
    const googleAuthUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/google`;
    
    res.json({
      url: googleAuthUrl,
      message: 'Redirect user to this URL to initiate Google OAuth'
    });
  } catch (error) {
    logger.error('Error generating Google OAuth URL', {
      error: error.message
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate OAuth URL'
    });
  }
});

module.exports = router;

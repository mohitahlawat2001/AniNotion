const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Middleware to verify JWT token
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn("Authentication failed: No token provided", {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Please provide a valid token' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database to ensure they still exist and are active
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        logger.warn("Authentication failed: User not found", {
          userId: decoded.userId,
          ip: req.ip,
          url: req.originalUrl
        });
        return res.status(401).json({ 
          error: 'Authentication failed', 
          message: 'User account not found' 
        });
      }
      
      if (user.status === 'disabled') {
        logger.warn("Authentication failed: User account disabled", {
          userId: user._id,
          email: user.email,
          ip: req.ip,
          url: req.originalUrl
        });
        return res.status(401).json({ 
          error: 'Authentication failed', 
          message: 'User account is disabled' 
        });
      }
      
      // Add user to request object
      req.user = user;
      next();
      
    } catch (jwtError) {
      logger.warn("Authentication failed: Invalid token", {
        error: jwtError.message,
        ip: req.ip,
        url: req.originalUrl
      });
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'Invalid or expired token' 
      });
    }
    
  } catch (error) {
    logger.error("Authentication middleware error:", {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      url: req.originalUrl
    });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Authentication check failed' 
    });
  }
};

// Middleware to require specific roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn("Role check failed: No user in request", {
        ip: req.ip,
        url: req.originalUrl
      });
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Please login first' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("Authorization failed: Insufficient permissions", {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        ip: req.ip,
        url: req.originalUrl
      });
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        message: `Required role: ${allowedRoles.join(' or ')}` 
      });
    }
    
    next();
  };
};

// Optional auth middleware - adds user to req if token is valid, but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch (jwtError) {
      // Invalid token, but continue without user
      logger.debug("Optional auth: Invalid token provided", {
        error: jwtError.message,
        ip: req.ip
      });
    }
    
    next();
    
  } catch (error) {
    logger.error("Optional auth middleware error:", {
      error: error.message,
      stack: error.stack
    });
    next(); // Continue even if there's an error
  }
};

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth
};

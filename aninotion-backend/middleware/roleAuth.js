const logger = require('../config/logger');

// Middleware to require specific roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user exists (should be set by authenticateToken middleware)
      if (!req.user) {
        logger.warn("❌ Role check failed: No user in request", {
          endpoint: req.path,
          method: req.method
        });
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn("❌ Role check failed: Insufficient permissions", {
          userId: req.user._id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          endpoint: req.path,
          method: req.method
        });
        return res.status(403).json({ 
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}` 
        });
      }

      logger.debug("✅ Role check passed", {
        userId: req.user._id,
        userRole: req.user.role,
        endpoint: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error("❌ Role middleware error", {
        error: error.message,
        endpoint: req.path,
        method: req.method,
        userId: req.user?._id
      });
      res.status(500).json({ message: 'Role authorization error' });
    }
  };
};

// Helper functions for common role checks
const requireAdmin = requireRole(['admin']);
const requireEditor = requireRole(['admin', 'editor']);
const requireAnyUser = requireRole(['admin', 'editor', 'viewer']);

module.exports = {
  requireRole,
  requireAdmin,
  requireEditor,
  requireAnyUser
};

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const logger = require('../config/logger');

// Default roles as fallback
const DEFAULT_ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'paid', label: 'Paid' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' }
];

// Get available user roles (admin only)
router.get('/roles', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    let roles = DEFAULT_ROLES;

    // Check if roles are defined in environment variable
    if (process.env.USER_ROLES) {
      try {
        // Expected format: "viewer:Viewer,paid:Paid,editor:Editor,admin:Admin"
        const envRoles = process.env.USER_ROLES.split(',').map(roleStr => {
          const [value, label] = roleStr.trim().split(':');
          return { value, label: label || value };
        });
        
        if (envRoles.length > 0) {
          roles = envRoles;
          logger.info("✅ Using roles from environment variable", {
            count: roles.length
          });
        }
      } catch (parseError) {
        logger.warn("⚠️ Failed to parse USER_ROLES from env, using default roles", {
          error: parseError.message
        });
      }
    }

    logger.info("✅ User roles fetched successfully", {
      userId: req.user._id,
      userRole: req.user.role,
      rolesCount: roles.length
    });

    res.json(roles);
  } catch (error) {
    logger.error("❌ Error fetching user roles", {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({ message: 'Error fetching user roles' });
  }
});

// Get all users (admin only)
router.get('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({ status: { $ne: 'deleted' } }) // Filter out deleted users
      .select('-passwordHash') // Exclude password hash
      .sort({ createdAt: -1 });

    logger.info("✅ Users fetched successfully", {
      userId: req.user._id,
      userRole: req.user.role,
      count: users.length
    });

    res.json(users);
  } catch (error) {
    logger.error("❌ Error fetching users", {
      error: error.message,
      userId: req.user._id,
      userRole: req.user.role
    });
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user role (admin only)
router.put('/:id/role', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // Validate role
    const validRoles = ['admin', 'editor', 'paid', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    user.updatedBy = req.user._id;
    await user.save();

    logger.info("✅ User role updated successfully", {
      targetUserId: userId,
      newRole: role,
      updatedBy: req.user._id,
      updatedByRole: req.user.role
    });

    res.json({
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    logger.error("❌ Error updating user role", {
      error: error.message,
      userId: req.params.id,
      requestedRole: req.body.role,
      updatedBy: req.user._id
    });
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting their own account
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete by updating status
    user.status = 'deleted';
    user.deletedBy = req.user._id;
    user.deletedAt = new Date();
    await user.save();

    // Or hard delete if preferred:
    // await User.findByIdAndDelete(userId);

    logger.info("✅ User deleted successfully", {
      deletedUserId: userId,
      deletedUserEmail: user.email,
      deletedBy: req.user._id,
      deletedByRole: req.user.role
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error("❌ Error deleting user", {
      error: error.message,
      userId: req.params.id,
      deletedBy: req.user._id
    });
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get user statistics (admin only)
router.get('/stats', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: { $ne: 'deleted' } });

    logger.info("✅ User statistics fetched", {
      requestedBy: req.user._id,
      totalUsers,
      activeUsers
    });

    res.json({
      totalUsers,
      activeUsers,
      roleDistribution: stats
    });
  } catch (error) {
    logger.error("❌ Error fetching user statistics", {
      error: error.message,
      requestedBy: req.user._id
    });
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
});

module.exports = router;

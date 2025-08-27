const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const backupMiddleware = require('../middleware/backup');
const logger = require('../config/logger');

/**
 * Example routes showing automatic backup integration
 */

// Bulk delete posts - automatically creates backup before operation
router.delete('/bulk-delete', 
  backupMiddleware.beforeBulkOperation(),
  async (req, res) => {
    try {
      const { postIds } = req.body;
      
      const result = await Post.deleteMany({
        _id: { $in: postIds }
      });
      
      logger.info('Bulk delete completed', {
        deletedCount: result.deletedCount,
        backupName: req.backupInfo?.name
      });
      
      res.json({
        success: true,
        deletedCount: result.deletedCount,
        backupCreated: req.backupInfo?.name
      });
    } catch (error) {
      logger.error('Bulk delete failed:', error);
      res.status(500).json({
        error: 'Bulk delete operation failed',
        message: error.message
      });
    }
  }
);

// Migrate all posts - creates backup before schema changes
router.post('/migrate-schema',
  backupMiddleware.beforeSchemaChange(),
  async (req, res) => {
    try {
      // Example: Add new field to all posts
      const result = await Post.updateMany(
        {},
        { 
          $set: { 
            newField: 'defaultValue',
            updatedAt: new Date()
          }
        }
      );
      
      logger.info('Schema migration completed', {
        modifiedCount: result.modifiedCount,
        backupName: req.backupInfo?.name
      });
      
      res.json({
        success: true,
        modifiedCount: result.modifiedCount,
        backupCreated: req.backupInfo?.name
      });
    } catch (error) {
      logger.error('Schema migration failed:', error);
      res.status(500).json({
        error: 'Schema migration failed',
        message: error.message
      });
    }
  }
);

// Manual backup trigger
router.post('/trigger-backup',
  backupMiddleware.triggerScheduledBackup(),
  async (req, res) => {
    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: req.backupInfo
    });
  }
);

// Get backup status
router.get('/backup-status', async (req, res) => {
  try {
    const BackupSystem = require('../utils/backupSystem');
    const backupSystem = new BackupSystem();
    await backupSystem.initialize();
    
    const backups = await backupSystem.listBackups();
    
    res.json({
      totalBackups: backups.length,
      latestBackup: backups[0] || null,
      backups: backups.slice(0, 5) // Latest 5 backups
    });
  } catch (error) {
    logger.error('Failed to get backup status:', error);
    res.status(500).json({
      error: 'Failed to retrieve backup status',
      message: error.message
    });
  }
});

module.exports = router;

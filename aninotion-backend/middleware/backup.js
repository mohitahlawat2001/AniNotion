const BackupSystem = require('../utils/backupSystem');
const logger = require('../config/logger');
const environment = require('../config/environment');

/**
 * Backup Middleware
 * Automatically creates backups before critical operations
 */
class BackupMiddleware {
  constructor() {
    this.backupSystem = new BackupSystem();
    this.initialized = false;
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    if (!this.initialized) {
      await this.backupSystem.initialize();
      this.initialized = true;
    }
  }

  /**
   * Middleware to create backup before dangerous operations
   */
  beforeCriticalOperation(operationName) {
    return async (req, res, next) => {
      // Only create backups in production or if explicitly enabled
      const shouldBackup = environment.env === 'production' || 
                          environment.getFeatures().enablePreOperationBackups;
      
      if (!shouldBackup) {
        return next();
      }

      try {
        await this.initialize();
        
        logger.info(`Creating pre-operation backup for: ${operationName}`);
        
        const backupInfo = await this.backupSystem.createBackup({
          compress: true,
          includeIndexes: true,
          metadata: {
            reason: `Pre-operation backup for: ${operationName}`,
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString(),
            environment: environment.env
          }
        });
        
        // Add backup info to request for potential rollback
        req.backupInfo = backupInfo;
        
        logger.info('Pre-operation backup completed successfully', {
          operation: operationName,
          backupName: backupInfo.name
        });
        
        next();
      } catch (error) {
        logger.error(`Pre-operation backup failed for ${operationName}:`, error);
        
        // Decide whether to continue or stop based on configuration
        const failOnBackupError = environment.getFeatures().failOnBackupError;
        
        if (failOnBackupError) {
          return res.status(500).json({
            error: 'Pre-operation backup failed',
            message: 'Operation cancelled for safety',
            operation: operationName
          });
        } else {
          // Log error but continue with operation
          logger.warn('Continuing operation despite backup failure');
          next();
        }
      }
    };
  }

  /**
   * Middleware for bulk operations
   */
  beforeBulkOperation() {
    return this.beforeCriticalOperation('bulk-data-operation');
  }

  /**
   * Middleware for schema changes
   */
  beforeSchemaChange() {
    return this.beforeCriticalOperation('schema-modification');
  }

  /**
   * Middleware for data migrations
   */
  beforeMigration() {
    return this.beforeCriticalOperation('data-migration');
  }

  /**
   * Scheduled backup trigger middleware
   */
  triggerScheduledBackup() {
    return async (req, res, next) => {
      try {
        await this.initialize();
        
        const backupInfo = await this.backupSystem.createBackup({
          compress: true,
          includeIndexes: true,
          metadata: {
            reason: 'Scheduled backup via API',
            triggeredBy: req.ip,
            timestamp: new Date().toISOString()
          }
        });
        
        req.backupInfo = backupInfo;
        next();
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
        res.status(500).json({
          error: 'Backup operation failed',
          message: error.message
        });
      }
    };
  }
}

module.exports = new BackupMiddleware();

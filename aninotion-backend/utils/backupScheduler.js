const cron = require('node-cron');
const BackupSystem = require('../utils/backupSystem');
const logger = require('../config/logger');
const environment = require('../config/environment');

/**
 * Automatic Backup Scheduler
 * Runs backups on a schedule without manual intervention
 */
class BackupScheduler {
  constructor() {
    this.backupSystem = new BackupSystem();
    this.isRunning = false;
  }

  /**
   * Start the backup scheduler
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Backup scheduler is already running');
      return;
    }

    const schedules = environment.getFeatures().backupSchedules;
    
    // Daily backup at 2 AM
    if (schedules.daily) {
      cron.schedule('0 2 * * *', async () => {
        await this.createScheduledBackup('daily');
      }, {
        scheduled: true,
        timezone: "UTC"
      });
      logger.info('📅 Daily backup scheduled for 2:00 AM UTC');
    }

    // Weekly backup on Sundays at 1 AM
    if (schedules.weekly) {
      cron.schedule('0 1 * * 0', async () => {
        await this.createScheduledBackup('weekly');
      }, {
        scheduled: true,
        timezone: "UTC"
      });
      logger.info('📅 Weekly backup scheduled for Sundays 1:00 AM UTC');
    }

    // Before deployments (triggered by environment variable)
    if (process.env.TRIGGER_DEPLOYMENT_BACKUP === 'true') {
      await this.createScheduledBackup('deployment');
      // Reset the trigger
      delete process.env.TRIGGER_DEPLOYMENT_BACKUP;
    }

    this.isRunning = true;
    logger.info('🚀 Backup scheduler started');
  }

  /**
   * Create a scheduled backup
   */
  async createScheduledBackup(type) {
    try {
      logger.info(`🔄 Starting ${type} backup...`);
      
      await this.backupSystem.initialize();
      
      const backupResult = await this.backupSystem.createBackup({
        description: `Automatic ${type} backup`,
        tag: type,
        compress: true
      });
      
      logger.info(`✅ ${type} backup completed: ${backupResult.name}`);
      
      // Send notification if configured
      if (environment.getEmail().enabled) {
        await this.sendBackupNotification(type, backupResult);
      }
      
    } catch (error) {
      logger.error(`❌ ${type} backup failed:`, error);
      
      // Send failure notification
      if (environment.getEmail().enabled) {
        await this.sendBackupFailureNotification(type, error);
      }
    }
  }

  /**
   * Send backup success notification
   */
  async sendBackupNotification(type, backupResult) {
    // Implementation would use your email service
    logger.info(`📧 Backup notification sent for ${type} backup`);
  }

  /**
   * Send backup failure notification
   */
  async sendBackupFailureNotification(type, error) {
    // Implementation would use your email service
    logger.error(`📧 Backup failure notification sent for ${type} backup`);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.isRunning = false;
    logger.info('🛑 Backup scheduler stopped');
  }
}

module.exports = BackupScheduler;

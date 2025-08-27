const BackupSystem = require('../utils/backupSystem');
const logger = require('../config/logger');

/**
 * Migration Runner with Automatic Backup Integration
 * Automatically creates backups before running migrations
 */
class MigrationRunner {
  constructor() {
    this.backupSystem = new BackupSystem();
    this.migrationsDir = path.join(__dirname, '../migrations');
  }

  /**
   * Run migrations with automatic backup
   */
  async runMigrations() {
    try {
      // 1. Create automatic backup before migrations
      logger.info('🔄 Creating automatic backup before migrations...');
      await this.backupSystem.initialize();
      
      const backupResult = await this.backupSystem.createBackup({
        description: 'Pre-migration automatic backup',
        tag: 'migration'
      });
      
      logger.info(`✅ Automatic backup created: ${backupResult.name}`);
      
      // 2. Run migrations
      const migrations = await this.getPendingMigrations();
      
      for (const migration of migrations) {
        logger.info(`🔄 Running migration: ${migration.name}`);
        await this.runMigration(migration);
      }
      
      logger.info('✅ All migrations completed successfully');
      
    } catch (error) {
      logger.error('❌ Migration failed:', error);
      
      // Automatic rollback option
      const shouldRollback = process.env.AUTO_ROLLBACK_ON_MIGRATION_FAIL === 'true';
      if (shouldRollback && backupResult) {
        logger.info('🔄 Auto-rolling back due to migration failure...');
        await this.backupSystem.restoreBackup(backupResult.name);
        logger.info('✅ Database rolled back to pre-migration state');
      }
      
      throw error;
    }
  }
}

module.exports = MigrationRunner;

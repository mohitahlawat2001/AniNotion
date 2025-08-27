#!/usr/bin/env node

/**
 * AniNotion Backend CLI
 * Command-line interface for managing the backend system
 */

const { program } = require('commander');
const BackupSystem = require('../utils/backupSystem');
const MigrationRunner = require('../utils/migrationRunner');
const environment = require('../config/environment');

program
  .name('aninotion-cli')
  .description('AniNotion Backend Management CLI')
  .version('1.0.0');

// Backup commands
const backupCmd = program
  .command('backup')
  .description('Database backup operations');

backupCmd
  .command('create')
  .description('Create a database backup')
  .option('-c, --compress', 'Compress backup files', true)
  .option('--no-indexes', 'Exclude indexes from backup')
  .option('--collections <collections>', 'Comma-separated list of collections to backup')
  .action(async (options) => {
    try {
      const backupSystem = new BackupSystem();
      const collections = options.collections ? options.collections.split(',') : null;
      
      console.log('🔄 Creating backup...');
      const result = await backupSystem.createBackup({
        compress: options.compress,
        includeIndexes: !options.noIndexes,
        collections
      });
      
      console.log('✅ Backup created successfully:');
      console.log(`   Name: ${result.name}`);
      console.log(`   Path: ${result.path}`);
      console.log(`   Collections: ${result.manifest.collections.length}`);
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    }
  });

backupCmd
  .command('restore <backupName>')
  .description('Restore from a backup')
  .option('--collections <collections>', 'Comma-separated list of collections to restore')
  .option('--drop-existing', 'Drop existing collections before restore')
  .option('--dry-run', 'Show what would be restored without making changes')
  .action(async (backupName, options) => {
    try {
      const backupSystem = new BackupSystem();
      const collections = options.collections ? options.collections.split(',') : null;
      
      console.log(`🔄 Restoring backup: ${backupName}`);
      const result = await backupSystem.restoreBackup(backupName, {
        collections,
        dropExisting: options.dropExisting,
        dryRun: options.dryRun
      });
      
      console.log('✅ Restore completed:');
      console.log(`   Restored: ${result.restored.length} collections`);
      console.log(`   Skipped: ${result.skipped.length} collections`);
      console.log(`   Errors: ${result.errors.length} collections`);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => {
          console.log(`   ${error.collection}: ${error.error}`);
        });
      }
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      process.exit(1);
    }
  });

backupCmd
  .command('list')
  .description('List available backups')
  .action(async () => {
    try {
      const backupSystem = new BackupSystem();
      const backups = await backupSystem.listBackups();
      
      if (backups.length === 0) {
        console.log('No backups found');
        return;
      }
      
      console.log('📦 Available backups:');
      backups.forEach(backup => {
        console.log(`   ${backup.name}`);
        console.log(`     Created: ${backup.timestamp}`);
        console.log(`     Environment: ${backup.environment}`);
        console.log(`     Collections: ${backup.collections}`);
        console.log(`     Compressed: ${backup.compressed ? 'Yes' : 'No'}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      process.exit(1);
    }
  });

backupCmd
  .command('verify <backupName>')
  .description('Verify backup integrity')
  .action(async (backupName) => {
    try {
      const backupSystem = new BackupSystem();
      console.log(`🔍 Verifying backup: ${backupName}`);
      
      const verification = await backupSystem.verifyBackup(backupName);
      
      if (verification.valid) {
        console.log('✅ Backup is valid');
      } else {
        console.log('❌ Backup verification failed:');
        verification.errors.forEach(error => {
          console.log(`   ${error}`);
        });
      }
      
      console.log('\n📊 Collections:');
      verification.collections.forEach(collection => {
        const status = collection.valid ? '✅' : '❌';
        console.log(`   ${status} ${collection.name}: ${collection.documentCount} documents`);
        if (collection.error) {
          console.log(`     Error: ${collection.error}`);
        }
      });
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  });

backupCmd
  .command('cleanup')
  .description('Delete old backups')
  .option('-d, --days <days>', 'Retention period in days', '30')
  .action(async (options) => {
    try {
      const backupSystem = new BackupSystem();
      const retentionDays = parseInt(options.days);
      
      console.log(`🧹 Cleaning up backups older than ${retentionDays} days...`);
      const result = await backupSystem.cleanupBackups(retentionDays);
      
      console.log('✅ Cleanup completed:');
      console.log(`   Deleted: ${result.deleted} backups`);
      console.log(`   Remaining: ${result.remaining} backups`);
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  });

// Migration commands
const migrationCmd = program
  .command('migration')
  .alias('migrate')
  .description('Database migration operations');

migrationCmd
  .command('create <name>')
  .description('Create a new migration')
  .option('-d, --description <description>', 'Migration description')
  .action(async (name, options) => {
    try {
      const migrationRunner = new MigrationRunner();
      console.log(`📝 Creating migration: ${name}`);
      
      const result = await migrationRunner.createMigration(name, options.description);
      
      console.log('✅ Migration created:');
      console.log(`   File: ${result.fileName}`);
      console.log(`   Path: ${result.filePath}`);
    } catch (error) {
      console.error('❌ Migration creation failed:', error.message);
      process.exit(1);
    }
  });

migrationCmd
  .command('run')
  .description('Run pending migrations')
  .option('-t, --target <migration>', 'Run up to specific migration')
  .option('--dry-run', 'Show what would be migrated without making changes')
  .option('--batch-size <size>', 'Batch size for processing', '1000')
  .option('--continue-on-error', 'Continue running migrations even if one fails')
  .action(async (options) => {
    try {
      const migrationRunner = new MigrationRunner();
      console.log('🔄 Running migrations...');
      
      const result = await migrationRunner.runMigrations({
        target: options.target,
        dryRun: options.dryRun,
        batchSize: parseInt(options.batchSize),
        continueOnError: options.continueOnError
      });
      
      console.log('✅ Migration run completed:');
      console.log(`   Executed: ${result.executed.length} migrations`);
      console.log(`   Skipped: ${result.skipped.length} migrations`);
      console.log(`   Errors: ${result.errors.length} migrations`);
      
      if (result.executed.length > 0) {
        console.log('\n✅ Executed migrations:');
        result.executed.forEach(name => console.log(`   ${name}`));
      }
      
      if (result.errors.length > 0) {
        console.log('\n❌ Failed migrations:');
        result.errors.forEach(error => {
          console.log(`   ${error.migration}: ${error.error}`);
        });
      }
    } catch (error) {
      console.error('❌ Migration run failed:', error.message);
      process.exit(1);
    }
  });

migrationCmd
  .command('rollback')
  .description('Rollback migrations')
  .option('-t, --target <migration>', 'Rollback to specific migration')
  .option('-s, --steps <steps>', 'Number of migrations to rollback', '1')
  .option('--dry-run', 'Show what would be rolled back without making changes')
  .action(async (options) => {
    try {
      const migrationRunner = new MigrationRunner();
      console.log('🔄 Rolling back migrations...');
      
      const result = await migrationRunner.rollbackMigrations({
        target: options.target,
        steps: parseInt(options.steps),
        dryRun: options.dryRun
      });
      
      console.log('✅ Rollback completed:');
      console.log(`   Rolled back: ${result.rolledBack.length} migrations`);
      console.log(`   Errors: ${result.errors.length} migrations`);
      
      if (result.rolledBack.length > 0) {
        console.log('\n✅ Rolled back migrations:');
        result.rolledBack.forEach(name => console.log(`   ${name}`));
      }
      
      if (result.errors.length > 0) {
        console.log('\n❌ Rollback errors:');
        result.errors.forEach(error => {
          console.log(`   ${error.migration}: ${error.error}`);
        });
      }
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      process.exit(1);
    }
  });

migrationCmd
  .command('status')
  .description('Show migration status')
  .action(async () => {
    try {
      const migrationRunner = new MigrationRunner();
      const { status, summary } = await migrationRunner.getStatus();
      
      console.log('📊 Migration Status:');
      console.log(`   Total: ${summary.total}`);
      console.log(`   Executed: ${summary.executed}`);
      console.log(`   Pending: ${summary.pending}`);
      console.log(`   Failed: ${summary.failed}`);
      console.log('');
      
      if (status.length > 0) {
        console.log('📝 Migration Details:');
        status.forEach(migration => {
          const statusIcon = migration.executed ? '✅' : 
                           migration.error ? '❌' : '⏳';
          console.log(`   ${statusIcon} ${migration.name}`);
          if (migration.executedAt) {
            console.log(`     Executed: ${migration.executedAt.toISOString()}`);
          }
          if (migration.duration) {
            console.log(`     Duration: ${migration.duration}ms`);
          }
          if (migration.totalProcessed) {
            console.log(`     Processed: ${migration.totalProcessed} documents`);
          }
          if (migration.error) {
            console.log(`     Error: ${migration.error}`);
          }
          console.log('');
        });
      }
    } catch (error) {
      console.error('❌ Failed to get migration status:', error.message);
      process.exit(1);
    }
  });

migrationCmd
  .command('reset <migrationName>')
  .description('Reset migration state (use with caution)')
  .action(async (migrationName) => {
    try {
      const migrationRunner = new MigrationRunner();
      console.log(`⚠️  Resetting migration: ${migrationName}`);
      
      await migrationRunner.resetMigration(migrationName);
      console.log('✅ Migration state reset');
    } catch (error) {
      console.error('❌ Migration reset failed:', error.message);
      process.exit(1);
    }
  });

// Environment commands
const envCmd = program
  .command('env')
  .description('Environment configuration');

envCmd
  .command('check')
  .description('Check environment configuration')
  .action(() => {
    try {
      console.log('🔧 Environment Configuration Check:');
      environment.printSummary();
      console.log('\n✅ Environment configuration is valid');
    } catch (error) {
      console.error('❌ Environment configuration error:', error.message);
      process.exit(1);
    }
  });

envCmd
  .command('info')
  .description('Show environment information')
  .action(() => {
    const config = environment.getAll();
    
    console.log('🔧 Environment Information:');
    console.log(`   Environment: ${config.env}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.database ? 'Configured' : 'Not configured'}`);
    console.log(`   Redis: ${config.redis.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Email: ${config.email.enabled ? 'Enabled' : 'Disabled'}`);
    console.log('');
    
    console.log('🚀 Feature Flags:');
    Object.entries(config.features).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${key}`);
    });
  });

// Health check command
program
  .command('health')
  .description('Perform system health check')
  .action(async () => {
    try {
      console.log('🏥 System Health Check:');
      
      // Check environment
      try {
        environment.getAll();
        console.log('   ✅ Environment configuration');
      } catch (error) {
        console.log('   ❌ Environment configuration:', error.message);
      }
      
      // Check database connection
      try {
        const mongoose = require('mongoose');
        await mongoose.connect(environment.getDatabase());
        console.log('   ✅ Database connection');
        await mongoose.disconnect();
      } catch (error) {
        console.log('   ❌ Database connection:', error.message);
      }
      
      // Check Redis connection (if enabled)
      const redisConfig = environment.getRedis();
      if (redisConfig.enabled) {
        try {
          const { Redis } = require('@upstash/redis');
          const redis = new Redis({
            url: redisConfig.url,
            token: redisConfig.token
          });
          await redis.ping();
          console.log('   ✅ Redis connection');
        } catch (error) {
          console.log('   ❌ Redis connection:', error.message);
        }
      } else {
        console.log('   ⏭️  Redis (disabled)');
      }
      
      console.log('\n✅ Health check completed');
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  });

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(`❌ ${str}`)
});

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

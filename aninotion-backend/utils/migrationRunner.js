const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const environment = require('../config/environment');
const logger = require('../config/logger');

/**
 * Migration Schema
 */
const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  version: { type: String, required: true },
  executed: { type: Boolean, default: false },
  executedAt: { type: Date },
  duration: { type: Number }, // milliseconds
  checksum: { type: String },
  error: { type: String },
  batchSize: { type: Number, default: 1000 },
  totalProcessed: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Migration = mongoose.model('Migration', migrationSchema);

/**
 * Batched, Resumable Migration System
 */
class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../migrations');
    this.batchSize = 1000;
    this.connected = false;
  }

  /**
   * Initialize migration system
   */
  async initialize() {
    try {
      if (!this.connected) {
        await mongoose.connect(environment.getDatabase());
        this.connected = true;
      }
      
      // Ensure migrations directory exists
      await fs.mkdir(this.migrationsDir, { recursive: true });
      
      logger.info('Migration system initialized');
    } catch (error) {
      logger.error('Failed to initialize migration system:', error);
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  async createMigration(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.js`;
    const filePath = path.join(this.migrationsDir, fileName);

    const template = `/**
 * Migration: ${name}
 * Description: ${description}
 * Created: ${new Date().toISOString()}
 */

const logger = require('../config/logger');

module.exports = {
  version: '1.0.0',
  
  /**
   * Run the migration
   * @param {Object} db - MongoDB database instance
   * @param {Object} options - Migration options
   * @param {Function} progress - Progress callback
   */
  async up(db, options = {}, progress = () => {}) {
    const { batchSize = 1000, resume = false } = options;
    
    try {
      logger.info('Starting migration: ${name}');
      
      // Example: Update all posts to add new field
      /*
      const collection = db.collection('posts');
      const totalCount = await collection.countDocuments();
      let processed = 0;
      
      const cursor = collection.find({});
      const batch = [];
      
      for await (const doc of cursor) {
        // Add your migration logic here
        batch.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { 
              $set: { 
                newField: 'defaultValue'
              }
            }
          }
        });
        
        if (batch.length >= batchSize) {
          await collection.bulkWrite(batch);
          processed += batch.length;
          batch.length = 0;
          
          progress({
            processed,
            total: totalCount,
            percentage: Math.round((processed / totalCount) * 100)
          });
          
          // Small delay to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // Process remaining batch
      if (batch.length > 0) {
        await collection.bulkWrite(batch);
        processed += batch.length;
      }
      
      logger.info(\`Migration completed: \${processed} documents processed\`);
      */
      
      logger.info('Migration ${name} completed successfully');
      return { success: true, processed: 0 };
      
    } catch (error) {
      logger.error('Migration ${name} failed:', error);
      throw error;
    }
  },

  /**
   * Rollback the migration
   * @param {Object} db - MongoDB database instance
   * @param {Object} options - Migration options
   * @param {Function} progress - Progress callback
   */
  async down(db, options = {}, progress = () => {}) {
    const { batchSize = 1000 } = options;
    
    try {
      logger.info('Rolling back migration: ${name}');
      
      // Add rollback logic here
      // This should reverse the changes made in the up() method
      
      logger.info('Migration ${name} rolled back successfully');
      return { success: true, processed: 0 };
      
    } catch (error) {
      logger.error('Migration ${name} rollback failed:', error);
      throw error;
    }
  },

  /**
   * Validate the migration
   * @param {Object} db - MongoDB database instance
   */
  async validate(db) {
    try {
      // Add validation logic here
      // This should check if the migration was applied correctly
      
      return { valid: true, message: 'Migration validation passed' };
      
    } catch (error) {
      logger.error('Migration ${name} validation failed:', error);
      return { valid: false, message: error.message };
    }
  }
};`;

    await fs.writeFile(filePath, template);
    logger.info(`Migration created: ${fileName}`);
    
    return {
      fileName,
      filePath,
      name
    };
  }

  /**
   * Get all migration files
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrations = files
        .filter(file => file.endsWith('.js'))
        .sort()
        .map(file => ({
          fileName: file,
          filePath: path.join(this.migrationsDir, file),
          name: file.replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_/, '').replace(/\.js$/, '')
        }));
      
      return migrations;
    } catch (error) {
      logger.error('Failed to get migration files:', error);
      throw error;
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(options = {}) {
    const { 
      target = null, // Run up to specific migration
      dryRun = false,
      batchSize = this.batchSize,
      resume = true
    } = options;

    try {
      await this.initialize();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await Migration.find({ executed: true });
      const executedNames = new Set(executedMigrations.map(m => m.name));
      
      // Find pending migrations
      let pendingMigrations = migrationFiles.filter(m => !executedNames.has(m.name));
      
      if (target) {
        const targetIndex = pendingMigrations.findIndex(m => m.name === target);
        if (targetIndex === -1) {
          throw new Error(`Target migration not found: ${target}`);
        }
        pendingMigrations = pendingMigrations.slice(0, targetIndex + 1);
      }

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return { executed: [], skipped: [], errors: [] };
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      if (dryRun) {
        logger.info('DRY RUN - No changes will be made');
        return { 
          executed: [], 
          skipped: pendingMigrations.map(m => m.name), 
          errors: [] 
        };
      }

      const results = {
        executed: [],
        skipped: [],
        errors: []
      };

      // Run each migration
      for (const migrationFile of pendingMigrations) {
        try {
          await this.runSingleMigration(migrationFile, { batchSize, resume });
          results.executed.push(migrationFile.name);
        } catch (error) {
          logger.error(`Migration failed: ${migrationFile.name}`, error);
          results.errors.push({
            migration: migrationFile.name,
            error: error.message
          });
          
          // Stop on first error unless configured otherwise
          if (!options.continueOnError) {
            break;
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Migration run failed:', error);
      throw error;
    }
  }

  /**
   * Run a single migration
   */
  async runSingleMigration(migrationFile, options = {}) {
    const { batchSize = this.batchSize, resume = true } = options;
    
    const startTime = Date.now();
    
    try {
      // Check if migration record exists
      let migrationRecord = await Migration.findOne({ name: migrationFile.name });
      
      if (migrationRecord && migrationRecord.executed) {
        logger.info(`Migration already executed: ${migrationFile.name}`);
        return;
      }

      // Load migration module
      delete require.cache[migrationFile.filePath]; // Clear cache
      const migration = require(migrationFile.filePath);
      
      // Calculate checksum
      const migrationContent = await fs.readFile(migrationFile.filePath, 'utf8');
      const checksum = require('crypto')
        .createHash('md5')
        .update(migrationContent)
        .digest('hex');

      // Create or update migration record
      if (!migrationRecord) {
        migrationRecord = new Migration({
          name: migrationFile.name,
          version: migration.version || '1.0.0',
          checksum,
          batchSize
        });
      }

      logger.info(`Running migration: ${migrationFile.name}`);
      
      // Progress tracking
      let lastProgress = { processed: 0, total: 0 };
      const progressCallback = (progress) => {
        lastProgress = progress;
        migrationRecord.totalProcessed = progress.processed;
        
        logger.info(`Migration progress: ${progress.processed}/${progress.total} (${progress.percentage}%)`);
      };

      // Get database instance
      const db = mongoose.connection.db;
      
      // Run migration
      const result = await migration.up(db, { batchSize, resume }, progressCallback);
      
      // Update migration record
      migrationRecord.executed = true;
      migrationRecord.executedAt = new Date();
      migrationRecord.duration = Date.now() - startTime;
      migrationRecord.totalProcessed = result.processed || lastProgress.processed;
      migrationRecord.error = null;
      
      await migrationRecord.save();
      
      logger.info(`Migration completed: ${migrationFile.name} (${migrationRecord.duration}ms)`);
      
      // Validate migration if validation method exists
      if (migration.validate) {
        const validation = await migration.validate(db);
        if (!validation.valid) {
          throw new Error(`Migration validation failed: ${validation.message}`);
        }
        logger.info(`Migration validation passed: ${migrationFile.name}`);
      }
      
    } catch (error) {
      // Update migration record with error
      const migrationRecord = await Migration.findOne({ name: migrationFile.name });
      if (migrationRecord) {
        migrationRecord.error = error.message;
        migrationRecord.duration = Date.now() - startTime;
        await migrationRecord.save();
      }
      
      throw error;
    }
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations(options = {}) {
    const { target = null, steps = 1, dryRun = false } = options;

    try {
      await this.initialize();
      
      // Get executed migrations in reverse order
      const executedMigrations = await Migration
        .find({ executed: true })
        .sort({ executedAt: -1 });

      if (executedMigrations.length === 0) {
        logger.info('No migrations to rollback');
        return { rolledBack: [], errors: [] };
      }

      let migrationsToRollback = [];
      
      if (target) {
        // Rollback to specific migration
        const targetIndex = executedMigrations.findIndex(m => m.name === target);
        if (targetIndex === -1) {
          throw new Error(`Target migration not found: ${target}`);
        }
        migrationsToRollback = executedMigrations.slice(0, targetIndex);
      } else {
        // Rollback specified number of steps
        migrationsToRollback = executedMigrations.slice(0, steps);
      }

      if (dryRun) {
        logger.info('DRY RUN - No changes will be made');
        return { 
          rolledBack: migrationsToRollback.map(m => m.name), 
          errors: [] 
        };
      }

      const results = {
        rolledBack: [],
        errors: []
      };

      // Rollback each migration
      for (const migrationRecord of migrationsToRollback) {
        try {
          await this.rollbackSingleMigration(migrationRecord);
          results.rolledBack.push(migrationRecord.name);
        } catch (error) {
          logger.error(`Rollback failed: ${migrationRecord.name}`, error);
          results.errors.push({
            migration: migrationRecord.name,
            error: error.message
          });
          break; // Stop on first error
        }
      }

      return results;
    } catch (error) {
      logger.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Rollback a single migration
   */
  async rollbackSingleMigration(migrationRecord) {
    try {
      // Find migration file
      const migrationFiles = await this.getMigrationFiles();
      const migrationFile = migrationFiles.find(f => f.name === migrationRecord.name);
      
      if (!migrationFile) {
        throw new Error(`Migration file not found: ${migrationRecord.name}`);
      }

      // Load migration module
      delete require.cache[migrationFile.filePath];
      const migration = require(migrationFile.filePath);
      
      if (!migration.down) {
        throw new Error(`Migration ${migrationRecord.name} does not support rollback`);
      }

      logger.info(`Rolling back migration: ${migrationRecord.name}`);
      
      // Get database instance
      const db = mongoose.connection.db;
      
      // Run rollback
      await migration.down(db, { batchSize: migrationRecord.batchSize });
      
      // Update migration record
      migrationRecord.executed = false;
      migrationRecord.executedAt = null;
      migrationRecord.error = null;
      
      await migrationRecord.save();
      
      logger.info(`Migration rolled back: ${migrationRecord.name}`);
      
    } catch (error) {
      logger.error(`Rollback failed for ${migrationRecord.name}:`, error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus() {
    try {
      await this.initialize();
      
      const migrationFiles = await this.getMigrationFiles();
      const migrationRecords = await Migration.find().sort({ name: 1 });
      
      const recordMap = new Map(migrationRecords.map(r => [r.name, r]));
      
      const status = migrationFiles.map(file => {
        const record = recordMap.get(file.name);
        return {
          name: file.name,
          fileName: file.fileName,
          executed: record ? record.executed : false,
          executedAt: record ? record.executedAt : null,
          duration: record ? record.duration : null,
          totalProcessed: record ? record.totalProcessed : null,
          error: record ? record.error : null
        };
      });

      const summary = {
        total: migrationFiles.length,
        executed: status.filter(s => s.executed).length,
        pending: status.filter(s => !s.executed).length,
        failed: status.filter(s => s.error).length
      };

      return { status, summary };
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Reset migration state (use with caution)
   */
  async resetMigration(migrationName) {
    try {
      await this.initialize();
      
      const migrationRecord = await Migration.findOne({ name: migrationName });
      if (!migrationRecord) {
        throw new Error(`Migration not found: ${migrationName}`);
      }

      migrationRecord.executed = false;
      migrationRecord.executedAt = null;
      migrationRecord.error = null;
      migrationRecord.totalProcessed = 0;
      
      await migrationRecord.save();
      
      logger.info(`Migration state reset: ${migrationName}`);
    } catch (error) {
      logger.error(`Failed to reset migration ${migrationName}:`, error);
      throw error;
    }
  }
}

module.exports = MigrationRunner;

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const environment = require('../config/environment');
const logger = require('../config/logger');
const CloudBackupStorage = require('./cloudBackupStorage');

/**
 * MongoDB Backup and Restore System
 * Provides safe backup/restore operations with verification
 */
class BackupSystem {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.cloudStorage = new CloudBackupStorage();
    this.client = null;
    this.db = null;
    this.useCloudStorage = process.env.USE_CLOUD_BACKUP === 'true' || environment.env === 'production';
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Connect to MongoDB
      this.client = new MongoClient(environment.getDatabase());
      await this.client.connect();
      this.db = this.client.db();
      
      logger.info('Backup system initialized');
    } catch (error) {
      logger.error('Failed to initialize backup system:', error);
      throw error;
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(options = {}) {
    const {
      compress = true,
      includeIndexes = true,
      collections = null // null means all collections
    } = options;

    try {
      await this.initialize();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      await fs.mkdir(backupPath, { recursive: true });
      
      logger.info(`Creating backup: ${backupName}`);
      
      // Get collections to backup
      const collectionsToBackup = collections || await this.getCollectionNames();
      
      const manifest = {
        timestamp: new Date().toISOString(),
        environment: environment.env,
        collections: [],
        compressed: compress,
        includeIndexes
      };

      // Backup each collection
      for (const collectionName of collectionsToBackup) {
        logger.info(`Backing up collection: ${collectionName}`);
        
        const collection = this.db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        
        // Get collection stats (using countDocuments instead of deprecated stats)
        const documentCount = await collection.countDocuments();
        
        // Get indexes if requested
        let indexes = [];
        if (includeIndexes) {
          indexes = await collection.listIndexes().toArray();
        }

        const collectionData = {
          name: collectionName,
          documents,
          indexes,
          stats: {
            count: documentCount,
            size: JSON.stringify(documents).length // Approximate size
          }
        };

        // Save collection data
        const fileName = `${collectionName}.json`;
        const filePath = path.join(backupPath, fileName);
        
        let data = JSON.stringify(collectionData, null, 2);
        
        if (compress) {
          data = await gzip(data);
          await fs.writeFile(filePath + '.gz', data);
        } else {
          await fs.writeFile(filePath, data);
        }

        manifest.collections.push({
          name: collectionName,
          file: compress ? fileName + '.gz' : fileName,
          documentCount: documents.length,
          indexCount: indexes.length
        });
      }

      // Save manifest
      await fs.writeFile(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Upload to cloud storage if enabled
      let cloudInfo = null;
      if (this.useCloudStorage) {
        try {
          await this.cloudStorage.ensureTempDir();
          
          // Create compressed archive for cloud upload
          const archiveName = `${backupName}.tar.gz`;
          const archivePath = this.cloudStorage.getTempPath(archiveName);
          
          // Create tar.gz archive (simpler approach - just zip the manifest for now)
          const manifestData = JSON.stringify(manifest, null, 2);
          const compressedManifest = await gzip(manifestData);
          await fs.writeFile(archivePath, compressedManifest);
          
          // Upload to cloud
          cloudInfo = await this.cloudStorage.uploadBackup(archivePath, archiveName);
          logger.info('Backup uploaded to cloud storage successfully', cloudInfo);
          
          // Clean up temporary file
          await fs.unlink(archivePath);
        } catch (cloudError) {
          logger.error('Failed to upload backup to cloud storage:', cloudError);
          // Don't fail the entire backup if cloud upload fails
        }
      }

      logger.info(`Backup created successfully: ${backupName}`);
      
      return {
        name: backupName,
        path: backupPath,
        manifest,
        cloudInfo,
        useCloudStorage: this.useCloudStorage
      };

    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    } finally {
      if (this.client) {
        await this.client.close();
      }
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupName, options = {}) {
    const {
      collections = null, // null means all collections
      dropExisting = false,
      dryRun = false
    } = options;

    try {
      await this.initialize();
      
      const backupPath = path.join(this.backupDir, backupName);
      const manifestPath = path.join(backupPath, 'manifest.json');
      
      // Verify backup exists
      try {
        await fs.access(manifestPath);
      } catch {
        throw new Error(`Backup not found: ${backupName}`);
      }

      // Load manifest
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);
      
      logger.info(`Starting restore from backup: ${backupName}`);
      logger.info(`Backup created: ${manifest.timestamp}`);
      
      if (dryRun) {
        logger.info('DRY RUN - No changes will be made');
      }

      // Determine collections to restore
      const collectionsToRestore = collections || manifest.collections.map(c => c.name);
      
      const results = {
        restored: [],
        skipped: [],
        errors: []
      };

      for (const collectionInfo of manifest.collections) {
        if (!collectionsToRestore.includes(collectionInfo.name)) {
          results.skipped.push(collectionInfo.name);
          continue;
        }

        try {
          logger.info(`Restoring collection: ${collectionInfo.name}`);
          
          const filePath = path.join(backupPath, collectionInfo.file);
          let data = await fs.readFile(filePath);
          
          // Decompress if needed
          if (collectionInfo.file.endsWith('.gz')) {
            data = await gunzip(data);
          }
          
          const collectionData = JSON.parse(data.toString());
          
          if (!dryRun) {
            const collection = this.db.collection(collectionInfo.name);
            
            // Drop existing collection if requested
            if (dropExisting) {
              await collection.drop().catch(() => {}); // Ignore if doesn't exist
            }
            
            // Insert documents
            if (collectionData.documents.length > 0) {
              await collection.insertMany(collectionData.documents);
            }
            
            // Restore indexes
            if (manifest.includeIndexes && collectionData.indexes.length > 0) {
              for (const index of collectionData.indexes) {
                if (index.name !== '_id_') { // Skip default _id index
                  await collection.createIndex(index.key, {
                    name: index.name,
                    ...index
                  }).catch(err => {
                    logger.warn(`Failed to create index ${index.name}:`, err.message);
                  });
                }
              }
            }
          }
          
          results.restored.push({
            name: collectionInfo.name,
            documentCount: collectionData.documents.length,
            indexCount: collectionData.indexes.length
          });
          
        } catch (error) {
          logger.error(`Failed to restore collection ${collectionInfo.name}:`, error);
          results.errors.push({
            collection: collectionInfo.name,
            error: error.message
          });
        }
      }

      logger.info('Restore completed:', {
        restored: results.restored.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      });

      return results;

    } catch (error) {
      logger.error('Restore failed:', error);
      throw error;
    } finally {
      if (this.client) {
        await this.client.close();
      }
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const backups = [];
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifestPath = path.join(this.backupDir, entry.name, 'manifest.json');
          
          try {
            const manifestData = await fs.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestData);
            
            backups.push({
              name: entry.name,
              timestamp: manifest.timestamp,
              environment: manifest.environment,
              collections: manifest.collections.length,
              compressed: manifest.compressed
            });
          } catch {
            // Skip invalid backups
          }
        }
      }
      
      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      const manifestPath = path.join(backupPath, 'manifest.json');
      
      // Check manifest exists
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);
      
      const verification = {
        valid: true,
        errors: [],
        collections: []
      };

      // Verify each collection file
      for (const collectionInfo of manifest.collections) {
        const filePath = path.join(backupPath, collectionInfo.file);
        
        try {
          let data = await fs.readFile(filePath);
          
          // Test decompression if compressed
          if (collectionInfo.file.endsWith('.gz')) {
            data = await gunzip(data);
          }
          
          // Test JSON parsing
          const collectionData = JSON.parse(data.toString());
          
          // Verify document count
          const actualCount = collectionData.documents.length;
          if (actualCount !== collectionInfo.documentCount) {
            verification.errors.push(
              `Collection ${collectionInfo.name}: expected ${collectionInfo.documentCount} documents, found ${actualCount}`
            );
            verification.valid = false;
          }
          
          verification.collections.push({
            name: collectionInfo.name,
            valid: true,
            documentCount: actualCount
          });
          
        } catch (error) {
          verification.errors.push(`Collection ${collectionInfo.name}: ${error.message}`);
          verification.valid = false;
          verification.collections.push({
            name: collectionInfo.name,
            valid: false,
            error: error.message
          });
        }
      }

      return verification;
    } catch (error) {
      logger.error(`Failed to verify backup ${backupName}:`, error);
      throw error;
    }
  }

  /**
   * Delete old backups
   */
  async cleanupBackups(retentionDays = 30) {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const toDelete = backups.filter(backup => 
        new Date(backup.timestamp) < cutoffDate
      );

      for (const backup of toDelete) {
        const backupPath = path.join(this.backupDir, backup.name);
        await fs.rmdir(backupPath, { recursive: true });
        logger.info(`Deleted old backup: ${backup.name}`);
      }

      return {
        deleted: toDelete.length,
        remaining: backups.length - toDelete.length
      };
    } catch (error) {
      logger.error('Failed to cleanup backups:', error);
      throw error;
    }
  }

  /**
   * Get collection names
   */
  async getCollectionNames() {
    const collections = await this.db.listCollections().toArray();
    return collections.map(c => c.name);
  }
}

module.exports = BackupSystem;

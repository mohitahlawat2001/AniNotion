const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/environment');

/**
 * MongoDB Backup and Restore Utility
 * Handles database backup, verification, and restoration
 */
class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.maxBackups = parseInt(process.env.MAX_BACKUPS) || 10;
    this.dbUrl = config.getDatabase();
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Generate backup filename with timestamp
   */
  generateBackupName() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    return `backup_${config.env}_${timestamp}.gz`;
  }

  /**
   * Create database backup
   */
  async createBackup(name = null) {
    await this.ensureBackupDir();
    
    const backupName = name || this.generateBackupName();
    const backupPath = path.join(this.backupDir, backupName);
    
    console.log(`Creating backup: ${backupName}`);
    console.log(`Database: ${this.dbUrl}`);
    console.log(`Output: ${backupPath}`);
    
    return new Promise((resolve, reject) => {
      // Extract database name from MongoDB URI
      const dbName = this.extractDbName(this.dbUrl);
      
      const mongodump = spawn('mongodump', [
        '--uri', this.dbUrl,
        '--archive', backupPath,
        '--gzip'
      ]);

      mongodump.stdout.on('data', (data) => {
        console.log(`mongodump: ${data}`);
      });

      mongodump.stderr.on('data', (data) => {
        console.error(`mongodump error: ${data}`);
      });

      mongodump.on('close', async (code) => {
        if (code === 0) {
          console.log(`✅ Backup created successfully: ${backupName}`);
          
          // Verify backup
          const isValid = await this.verifyBackup(backupPath);
          if (isValid) {
            // Cleanup old backups
            await this.cleanupOldBackups();
            resolve(backupPath);
          } else {
            reject(new Error('Backup verification failed'));
          }
        } else {
          reject(new Error(`mongodump exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Extract database name from MongoDB URI
   */
  extractDbName(uri) {
    try {
      const url = new URL(uri);
      return url.pathname.slice(1) || 'test';
    } catch (error) {
      console.warn('Could not extract database name, using default');
      return 'aninotion';
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath) {
    try {
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        console.error('❌ Backup file is empty');
        return false;
      }
      
      console.log(`✅ Backup verified: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      return true;
    } catch (error) {
      console.error('❌ Backup verification failed:', error.message);
      return false;
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    await this.ensureBackupDir();
    
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = files
        .filter(file => file.endsWith('.gz'))
        .map(async (file) => {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            path: filePath
          };
        });
      
      return Promise.all(backups);
    } catch (error) {
      console.error('Error listing backups:', error.message);
      return [];
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupName) {
    const backupPath = path.join(this.backupDir, backupName);
    
    try {
      await fs.access(backupPath);
    } catch (error) {
      throw new Error(`Backup file not found: ${backupName}`);
    }

    console.log(`🔄 Restoring from backup: ${backupName}`);
    console.log(`Target database: ${this.dbUrl}`);
    
    return new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', [
        '--uri', this.dbUrl,
        '--archive', backupPath,
        '--gzip',
        '--drop' // Drop existing collections before restore
      ]);

      mongorestore.stdout.on('data', (data) => {
        console.log(`mongorestore: ${data}`);
      });

      mongorestore.stderr.on('data', (data) => {
        console.error(`mongorestore error: ${data}`);
      });

      mongorestore.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Database restored successfully from: ${backupName}`);
          resolve();
        } else {
          reject(new Error(`mongorestore exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    const backups = await this.listBackups();
    
    if (backups.length <= this.maxBackups) {
      return;
    }

    // Sort by creation date, oldest first
    backups.sort((a, b) => a.created - b.created);
    
    // Remove oldest backups
    const toRemove = backups.slice(0, backups.length - this.maxBackups);
    
    for (const backup of toRemove) {
      try {
        await fs.unlink(backup.path);
        console.log(`🗑️  Removed old backup: ${backup.name}`);
      } catch (error) {
        console.error(`Failed to remove backup ${backup.name}:`, error.message);
      }
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDirectory() {
    return this.backupDir;
  }

  /**
   * Check if MongoDB tools are available
   */
  async checkMongoTools() {
    return new Promise((resolve) => {
      const mongodump = spawn('mongodump', ['--version']);
      
      mongodump.on('close', (code) => {
        resolve(code === 0);
      });
      
      mongodump.on('error', () => {
        resolve(false);
      });
    });
  }
}

module.exports = BackupManager;

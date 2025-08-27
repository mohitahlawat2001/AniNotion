const { v2: cloudinary } = require('cloudinary');
const fs = require('fs').promises;
const path = require('path');
const environment = require('../config/environment');
const logger = require('../config/logger');

/**
 * Cloud Backup Storage
 * Stores backups in cloud storage instead of local filesystem
 */
class CloudBackupStorage {
  constructor() {
    this.localTempDir = '/tmp/backups'; // Temporary local storage
    this.cloudProvider = process.env.BACKUP_CLOUD_PROVIDER || 'cloudinary';
    this.initializeCloudProvider();
  }

  /**
   * Initialize cloud storage provider
   */
  initializeCloudProvider() {
    switch (this.cloudProvider) {
      case 'cloudinary':
        // Configure Cloudinary
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        // Test configuration
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          throw new Error('Cloudinary configuration missing. Please check your environment variables.');
        }
        
        logger.info('Cloudinary configured for backup storage', {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME
        });
        break;
      case 's3':
        // AWS S3 configuration would go here
        break;
      case 'gcs':
        // Google Cloud Storage configuration would go here
        break;
      default:
        logger.warn(`Unknown cloud provider: ${this.cloudProvider}, falling back to cloudinary`);
        this.cloudProvider = 'cloudinary';
    }
  }

  /**
   * Ensure temporary directory exists
   */
  async ensureTempDir() {
    try {
      await fs.access(this.localTempDir);
    } catch (error) {
      await fs.mkdir(this.localTempDir, { recursive: true });
      logger.info(`Created temporary backup directory: ${this.localTempDir}`);
    }
  }

  /**
   * Upload backup to cloud storage
   */
  async uploadBackup(localPath, backupName) {
    try {
      switch (this.cloudProvider) {
        case 'cloudinary':
          return await this.uploadToCloudinary(localPath, backupName);
        case 's3':
          return await this.uploadToS3(localPath, backupName);
        case 'gcs':
          return await this.uploadToGCS(localPath, backupName);
        default:
          throw new Error(`Unsupported cloud provider: ${this.cloudProvider}`);
      }
    } catch (error) {
      logger.error('Failed to upload backup to cloud:', error);
      throw error;
    }
  }

  /**
   * Upload to Cloudinary (using your existing config)
   */
  async uploadToCloudinary(localPath, backupName) {
    try {
      logger.info(`Uploading backup to Cloudinary: ${backupName}`);
      
      const result = await cloudinary.uploader.upload(localPath, {
        resource_type: 'raw',
        public_id: `aninotion-backups/${backupName}`,
        folder: 'aninotion-backups',
        tags: ['backup', 'database', environment.env],
        context: {
          created_at: new Date().toISOString(),
          environment: environment.env,
          type: 'database_backup'
        }
      });

      logger.info('Backup uploaded to Cloudinary successfully', {
        public_id: result.public_id,
        url: result.secure_url,
        bytes: result.bytes
      });

      return {
        provider: 'cloudinary',
        public_id: result.public_id,
        url: result.secure_url,
        size: result.bytes,
        uploaded_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Cloudinary upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload to AWS S3 (if configured)
   */
  async uploadToS3(localPath, backupName) {
    // AWS S3 implementation would go here
    throw new Error('S3 upload not yet implemented');
  }

  /**
   * Upload to Google Cloud Storage (if configured)
   */
  async uploadToGCS(localPath, backupName) {
    // Google Cloud Storage implementation would go here
    throw new Error('GCS upload not yet implemented');
  }

  /**
   * Download backup from cloud storage
   */
  async downloadBackup(cloudInfo, localPath) {
    try {
      switch (cloudInfo.provider) {
        case 'cloudinary':
          return await this.downloadFromCloudinary(cloudInfo, localPath);
        case 's3':
          return await this.downloadFromS3(cloudInfo, localPath);
        case 'gcs':
          return await this.downloadFromGCS(cloudInfo, localPath);
        default:
          throw new Error(`Unsupported cloud provider: ${cloudInfo.provider}`);
      }
    } catch (error) {
      logger.error('Failed to download backup from cloud:', error);
      throw error;
    }
  }

  /**
   * Download from Cloudinary
   */
  async downloadFromCloudinary(cloudInfo, localPath) {
    try {
      const axios = require('axios');
      const response = await axios({
        method: 'GET',
        url: cloudInfo.url,
        responseType: 'stream'
      });

      const writer = require('fs').createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      logger.error('Cloudinary download failed:', error);
      throw error;
    }
  }

  /**
   * List all cloud backups
   */
  async listCloudBackups() {
    try {
      switch (this.cloudProvider) {
        case 'cloudinary':
          return await this.listCloudinaryBackups();
        case 's3':
          return await this.listS3Backups();
        case 'gcs':
          return await this.listGCSBackups();
        default:
          throw new Error(`Unsupported cloud provider: ${this.cloudProvider}`);
      }
    } catch (error) {
      logger.error('Failed to list cloud backups:', error);
      throw error;
    }
  }

  /**
   * List Cloudinary backups
   */
  async listCloudinaryBackups() {
    try {
      const result = await cloudinary.search
        .expression('folder:aninotion-backups AND tags:backup')
        .sort_by([['created_at', 'desc']])
        .max_results(50)
        .execute();

      return result.resources.map(resource => ({
        name: path.basename(resource.public_id),
        provider: 'cloudinary',
        public_id: resource.public_id,
        url: resource.secure_url,
        size: resource.bytes,
        created_at: resource.created_at,
        environment: resource.context?.environment || 'unknown'
      }));
    } catch (error) {
      logger.error('Failed to list Cloudinary backups:', error);
      throw error;
    }
  }

  /**
   * Delete old cloud backups
   */
  async deleteCloudBackup(cloudInfo) {
    try {
      switch (cloudInfo.provider) {
        case 'cloudinary':
          await cloudinary.uploader.destroy(cloudInfo.public_id, {
            resource_type: 'raw'
          });
          logger.info(`Deleted Cloudinary backup: ${cloudInfo.public_id}`);
          break;
        default:
          throw new Error(`Delete not implemented for provider: ${cloudInfo.provider}`);
      }
    } catch (error) {
      logger.error('Failed to delete cloud backup:', error);
      throw error;
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanupTempFiles() {
    try {
      const files = await fs.readdir(this.localTempDir);
      for (const file of files) {
        const filePath = path.join(this.localTempDir, file);
        await fs.unlink(filePath);
      }
      logger.info('Temporary backup files cleaned up');
    } catch (error) {
      logger.warn('Failed to cleanup temporary files:', error);
    }
  }

  /**
   * Get temporary file path
   */
  getTempPath(filename) {
    return path.join(this.localTempDir, filename);
  }
}

module.exports = CloudBackupStorage;

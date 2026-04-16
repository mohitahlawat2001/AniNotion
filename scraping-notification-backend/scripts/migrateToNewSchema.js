#!/usr/bin/env node

/**
 * Migration Script
 * Migrates data from old AnimeRelease schema to new Anime + Episode schema
 * 
 * Usage:
 *   node scripts/migrateToNewSchema.js [command]
 * 
 * Commands:
 *   migrate  - Run the migration (default)
 *   verify   - Verify migration results
 *   rollback - Delete new data and keep old schema
 */

require('dotenv').config();
const mongoose = require('mongoose');
const migrationService = require('../services/migrationService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aninotion';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrate() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Anime Schema Migration Tool              ║');
  console.log('║  AnimeRelease → Anime + Episode           ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  await connectDB();
  
  const command = process.argv[2] || 'migrate';
  
  try {
    switch (command) {
      case 'migrate':
        console.log('🚀 Starting migration...\n');
        const result = await migrationService.migrateToNewSchema();
        console.log('\n✅ Migration successful!');
        console.log('\nNext steps:');
        console.log('1. Run verification: node scripts/migrateToNewSchema.js verify');
        console.log('2. Update frontend to use new API endpoints');
        console.log('3. Test the new schema thoroughly');
        console.log('4. Once verified, you can optionally remove AnimeRelease collection');
        break;
        
      case 'verify':
        console.log('🔍 Verifying migration...\n');
        const verifyResult = await migrationService.verifyMigration();
        console.log('\n✅ Verification complete!');
        
        if (verifyResult.orphans > 0) {
          console.log('\n⚠️  Warning: Found orphaned episodes!');
          console.log('   Run migration again or manually fix data.');
        } else {
          console.log('\n✅ No issues found!');
        }
        break;
        
      case 'rollback':
        console.log('⚠️  Rolling back migration...\n');
        console.log('This will delete all Anime and Episode documents.');
        console.log('AnimeRelease data will be preserved.\n');
        
        // Confirmation in production
        if (process.env.NODE_ENV === 'production') {
          console.log('❌ Rollback blocked in production!');
          console.log('   Set NODE_ENV to development if you really want to rollback.');
          process.exit(1);
        }
        
        const rollbackResult = await migrationService.rollback();
        console.log('\n✅ Rollback complete!');
        break;
        
      case 'help':
      default:
        console.log('Usage: node scripts/migrateToNewSchema.js [command]\n');
        console.log('Commands:');
        console.log('  migrate  - Migrate AnimeRelease to Anime + Episode schema');
        console.log('  verify   - Verify migration integrity');
        console.log('  rollback - Remove migrated data (keeps AnimeRelease)');
        console.log('  help     - Show this help message\n');
        break;
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run migration
migrate();

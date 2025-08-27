# Automatic vs Manual Backup Usage Guide

## 🔄 **Automatic Backend Integration** (Now Available)

### 1. **Server Startup Backups**
✅ **Automatically enabled** when server starts
- Scheduled daily backups at 2:00 AM
- Weekly backups on Sundays at 1:00 AM
- Configurable via environment variables

### 2. **Pre-Operation Backups**
✅ **Automatically triggered** before dangerous operations
```javascript
// Example: Automatic backup before bulk operations
router.delete('/bulk-delete', 
  backupMiddleware.beforeBulkOperation(),  // ← Automatic backup here
  async (req, res) => {
    // Your operation code
  }
);
```

### 3. **Middleware Integration**
✅ **Available middleware** for different scenarios:
- `beforeBulkOperation()` - For bulk data changes
- `beforeSchemaChange()` - For database schema modifications  
- `beforeMigration()` - For data migrations
- `triggerScheduledBackup()` - For manual API triggers

## 👨‍💻 **Manual Developer Use** (Previously Available)

### Command Line Tools
```bash
# Create backup manually
npm run backup create

# List backups
npm run cli backup list

# Restore from backup
npm run cli backup restore backup-name

# Clean old backups
npm run cli backup cleanup
```

## ⚙️ **Configuration (Environment Variables)**

Add to your `.env` file:
```bash
# Enable automatic features
ENABLE_SCHEDULED_BACKUPS=true
ENABLE_WEEKLY_BACKUPS=true
ENABLE_PRE_OPERATION_BACKUPS=true

# Safety settings
FAIL_ON_BACKUP_ERROR=false  # Continue operation if backup fails
MAX_BACKUPS=10              # Keep only 10 most recent backups
BACKUP_RETENTION_DAYS=30    # Delete backups older than 30 days
```

## 📅 **Automatic Backup Schedule**

| Backup Type | When | Purpose |
|-------------|------|---------|
| **Daily** | 2:00 AM UTC | Regular data protection |
| **Weekly** | Sunday 1:00 AM UTC | Long-term retention |
| **Pre-Operation** | Before critical operations | Safety before changes |

## 🚀 **Real-World Examples**

### Example 1: API Route with Automatic Backup
```javascript
// This route automatically creates a backup before deleting data
app.delete('/api/posts/bulk-delete', 
  backupMiddleware.beforeBulkOperation(),  // ← Backup happens here
  async (req, res) => {
    // Safe to delete - backup was created automatically
    const result = await Post.deleteMany({_id: {$in: req.body.postIds}});
    res.json({
      deletedCount: result.deletedCount,
      backupCreated: req.backupInfo.name  // ← Backup info available
    });
  }
);
```

### Example 2: Starting Server with Automatic Backups
```bash
# Start server - backups are automatically scheduled
npm start

# Check logs to see backup scheduler initialized
# ✅ Automatic backup scheduler initialized
# 📅 Daily backup scheduled for 2:00 AM UTC
# 📅 Weekly backup scheduled for Sundays 1:00 AM UTC
```

### Example 3: Manual Backup via API
```bash
# Trigger backup via API call
curl -X POST http://localhost:5000/api/backup-examples/trigger-backup

# Response includes backup info:
{
  "success": true,
  "message": "Backup created successfully",
  "backup": {
    "name": "backup-2025-08-27T14-23-45-123Z",
    "collections": 4
  }
}
```

## 🎯 **When to Use Each Method**

### Use **Automatic Backups** for:
- ✅ Production environments
- ✅ Critical operations (bulk deletes, schema changes)
- ✅ Regular protection without manual intervention
- ✅ API operations that modify large amounts of data

### Use **Manual Backups** for:
- ✅ Development testing
- ✅ Before major feature deployments
- ✅ One-time operations
- ✅ Debugging and troubleshooting

## 🛡️ **Safety Features**

1. **Non-blocking**: Backup failures won't stop your application
2. **Configurable**: Enable/disable features via environment variables
3. **Logging**: All backup operations are logged for monitoring
4. **Metadata**: Each backup includes operation context and timestamps
5. **Retention**: Automatic cleanup of old backups

## 🔥 **Ready to Use Right Now**

Your backup system is now fully integrated and will:
- ✅ Create scheduled backups automatically
- ✅ Backup before dangerous operations
- ✅ Provide manual backup controls
- ✅ Keep your data safe during feature development

The system works in the background without requiring any action from you, while still giving you full manual control when needed!

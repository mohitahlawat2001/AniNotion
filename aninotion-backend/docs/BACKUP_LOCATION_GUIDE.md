# Where to Find Your Backups

## 📁 Backup Location

Your backups are stored in:
```
/workspaces/AniNotion/aninotion-backend/backups/
```

## 📦 Backup Structure

Each backup creates a timestamped folder containing:

```
backups/
├── backup-2025-08-27T13-48-07-354Z/          # Timestamp folder
│   ├── manifest.json                          # Backup metadata
│   ├── animes.json.gz                         # Compressed collection data
│   ├── categories.json.gz                     # Compressed collection data
│   ├── posts.json.gz                          # Compressed collection data
│   └── users.json.gz                          # Compressed collection data
└── backup-2025-08-27T13-47-03-607Z/          # Previous backup (failed)
```

## 🔍 How to View Backups

### 1. List All Backups
```bash
cd aninotion-backend
npm run cli backup list
```

### 2. Navigate to Backup Directory
```bash
cd aninotion-backend/backups
ls -la
```

### 3. View Specific Backup Contents
```bash
cd backups/backup-2025-08-27T13-48-07-354Z
ls -la
```

### 4. Check Backup Manifest (metadata)
```bash
cat backups/backup-2025-08-27T13-48-07-354Z/manifest.json
```

## 📋 Available Commands

### Create New Backup
```bash
npm run backup create
# or
npm run cli backup create
```

### List All Backups
```bash
npm run cli backup list
```

### Restore from Backup (when needed)
```bash
npm run cli backup restore backup-2025-08-27T13-48-07-354Z
```

### Clean Old Backups
```bash
npm run cli backup cleanup
```

## 🛡️ Backup Safety

- ✅ Backups are compressed to save space
- ✅ Each backup includes metadata (manifest.json)
- ✅ Collections are backed up individually
- ✅ Indexes are preserved for restoration
- ✅ Automatic cleanup keeps only recent backups (configurable)

## 📊 Current Status

You now have:
- ✅ 1 successful backup: `backup-2025-08-27T13-48-07-354Z`
- ✅ 4 collections backed up: animes, categories, users, posts
- ✅ Backup system working correctly

## 🔄 Next Steps

Before making any major changes:
1. Always create a backup: `npm run backup create`
2. Proceed with your changes
3. If something goes wrong, restore: `npm run cli backup restore [backup-name]`

Your data is now protected! 🛡️

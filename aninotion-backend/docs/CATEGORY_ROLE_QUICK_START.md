# Category Role-Based Visibility - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Migration
Update existing categories to support the new feature:

```bash
cd aninotion-backend
node scripts/migrate-add-minrole.js
```

**Expected Output:**
```
Connected to MongoDB
Found X categories without minRole field
Updated category: Anime (xxx) - minRole set to null
Updated category: Manga (xxx) - minRole set to null
✅ Migration completed successfully
```

### Step 2: Test the Feature

#### As an Editor or Admin:

1. **Log in** to your account
2. **Open the sidebar**
3. **Click "Add Category"** button
4. **Enter category name** (e.g., "Staff Only")
5. **Select visibility**:
   - "Visible to all (public)" - Everyone can see
   - "Viewer and above" - Logged-in users only
   - "Editor and above" - Editors and admins only
   - "Admin only" - Admins only
6. **Click "Add"**

#### Verify Filtering:

1. Log out → See only public categories
2. Log in as viewer → See public + viewer categories
3. Log in as editor → See public + viewer + editor categories
4. Log in as admin → See all categories

## 📋 Common Use Cases

### Use Case 1: Community Content (Authenticated Users Only)
```
Category Name: "Community Discussions"
Visibility: "Viewer and above"
```
Perfect for content that requires users to be logged in.

### Use Case 2: Editorial Content
```
Category Name: "Draft Reviews"
Visibility: "Editor and above"
```
Great for work-in-progress content only staff should see.

### Use Case 3: Internal Announcements
```
Category Name: "Admin News"
Visibility: "Admin only"
```
Ideal for administrative content.

### Use Case 4: Public Content (Default)
```
Category Name: "Latest Anime"
Visibility: "Visible to all (public)"
```
Standard public categories everyone can see.

## 🔍 Testing Checklist

- [ ] Run migration script successfully
- [ ] Create a public category (visible to all)
- [ ] Create a viewer-restricted category
- [ ] Create an editor-restricted category
- [ ] Log out and verify only public categories show
- [ ] Log in as viewer and verify correct categories show
- [ ] Log in as editor and verify correct categories show
- [ ] Verify existing categories still work

## 🎯 Key Points

✅ **Backward Compatible**: All existing categories default to public visibility
✅ **No Breaking Changes**: Current functionality remains intact
✅ **Secure**: Filtering happens on the backend (server-side)
✅ **Flexible**: Can change visibility anytime by editing category

## ⚡ Quick Commands

```bash
# Run migration
npm run migrate:categories

# Or manually:
node scripts/migrate-add-minrole.js

# Test with curl (create viewer-only category)
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Members Only","minRole":"viewer"}'

# Get categories (as authenticated user)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/categories

# Get categories (as anonymous user)
curl http://localhost:5000/api/categories
```

## 🐛 Quick Troubleshooting

**Problem**: Categories not showing
- **Solution**: Check your role and category's minRole setting

**Problem**: Can't create restricted categories
- **Solution**: Ensure you're logged in as editor or admin

**Problem**: All users see all categories
- **Solution**: Verify `optionalAuth` middleware is applied to GET route

## 📚 Next Steps

- Read full documentation: `docs/CATEGORY_ROLE_VISIBILITY.md`
- Customize role hierarchy if needed
- Add visual indicators for restricted categories (future enhancement)
- Consider implementing category update endpoint

## 💡 Pro Tips

1. **Start Conservative**: Begin with public categories, add restrictions as needed
2. **Test Thoroughly**: Always test as different user roles before deploying
3. **Document Restrictions**: Keep track of which categories are restricted and why
4. **Monitor Usage**: Track which categories are most accessed by role
5. **Plan Migrations**: When changing restrictions, communicate with users

---

**Need Help?** Check the full documentation or open an issue on GitHub.

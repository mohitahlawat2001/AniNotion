# Category Role-Based Visibility Feature

## Overview
This feature allows categories to be restricted based on user roles. Categories can be configured to be visible only to users with specific role levels or higher, or be visible to everyone (including non-authenticated users).

## Features

### Backend Changes

1. **Category Model Enhancement** (`models/Category.js`)
   - Added `minRole` field with possible values:
     - `null` (default): Visible to everyone, including non-authenticated users
     - `'viewer'`: Visible to authenticated users with viewer role or higher
     - `'editor'`: Visible to authenticated users with editor role or higher
     - `'admin'`: Visible only to admin users
   - Added `canView(userRole)` method to check if a user can view the category

2. **Categories Route Updates** (`routes/categories.js`)
   - Added `optionalAuth` middleware to GET route to capture user role if authenticated
   - Implemented role-based filtering in GET `/categories` endpoint
   - Updated POST `/categories` endpoint to accept `minRole` parameter
   - Added validation for `minRole` values

3. **Role Hierarchy**
   ```
   admin (level 3) > editor (level 2) > viewer (level 1) > anonymous (level 0)
   ```

### Frontend Changes

1. **Sidebar Component Enhancement** (`src/components/Sidebar.jsx`)
   - Added role selector dropdown when creating new categories
   - Options available:
     - "Visible to all (public)" - No role restriction
     - "Viewer and above" - Requires at least viewer role
     - "Editor and above" - Requires at least editor role
     - "Admin only" - Requires admin role
   - Categories are automatically filtered based on user's role

2. **API Integration**
   - Updated `categoriesAPI.create()` to send `minRole` parameter
   - Categories list automatically refreshed to reflect role-based filtering

## Usage

### Creating a Role-Restricted Category

**Backend API:**
```bash
POST /api/categories
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Premium Content",
  "minRole": "editor"
}
```

**Frontend:**
1. Click "Add Category" button in sidebar (requires editor role or higher)
2. Enter category name
3. Select visibility level from dropdown:
   - "Visible to all (public)" - Default, no restrictions
   - "Viewer and above" - Authenticated users only
   - "Editor and above" - Only editors and admins
   - "Admin only" - Only admins
4. Click "Add" button

### Viewing Categories

Categories are automatically filtered based on the user's role:
- **Anonymous users**: See only categories with `minRole: null`
- **Viewer users**: See categories with `minRole: null` or `minRole: 'viewer'`
- **Editor users**: See categories with `minRole: null`, `'viewer'`, or `'editor'`
- **Admin users**: See all categories

### Examples

1. **Public Category** (default behavior):
   ```json
   {
     "name": "Anime",
     "minRole": null
   }
   ```
   Visible to: Everyone (including non-authenticated users)

2. **Authenticated-Only Category**:
   ```json
   {
     "name": "Community Discussions",
     "minRole": "viewer"
   }
   ```
   Visible to: All authenticated users

3. **Editor-Only Category**:
   ```json
   {
     "name": "Draft Reviews",
     "minRole": "editor"
   }
   ```
   Visible to: Editors and admins only

4. **Admin-Only Category**:
   ```json
   {
     "name": "Internal News",
     "minRole": "admin"
   }
   ```
   Visible to: Admins only

## Migration

### Migrating Existing Categories

Run the migration script to add the `minRole` field to existing categories:

```bash
cd aninotion-backend
node scripts/migrate-add-minrole.js
```

This script:
- Connects to your MongoDB database
- Finds all categories without the `minRole` field
- Sets `minRole: null` for all existing categories (maintains backward compatibility)
- Logs progress for each category updated

**Note**: All existing categories will be set to `minRole: null`, making them visible to everyone. You can manually update specific categories afterward if needed.

## Backward Compatibility

✅ **Fully backward compatible**:
- Existing categories without `minRole` field will default to `null` (visible to all)
- No breaking changes to existing functionality
- Categories without role restrictions continue to work as before
- The migration script ensures smooth transition

## Testing

### Manual Testing Steps

1. **Test as Anonymous User**:
   - Create categories with different `minRole` values
   - Log out and verify only `null` minRole categories are visible

2. **Test as Viewer**:
   - Log in as viewer
   - Verify you can see categories with `minRole: null` and `minRole: 'viewer'`
   - Verify you cannot see editor or admin-only categories

3. **Test as Editor**:
   - Log in as editor
   - Verify you can see categories with `minRole: null`, `'viewer'`, and `'editor'`
   - Verify you cannot see admin-only categories
   - Test creating categories with different role restrictions

4. **Test as Admin**:
   - Log in as admin
   - Verify you can see all categories regardless of `minRole`
   - Test creating categories with all role restrictions

### API Testing

```bash
# Get all categories (anonymous)
curl http://localhost:5000/api/categories

# Get all categories (authenticated)
curl -H "Authorization: Bearer <token>" \
     http://localhost:5000/api/categories

# Create viewer-restricted category
curl -X POST http://localhost:5000/api/categories \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"Members Only","minRole":"viewer"}'

# Create editor-restricted category
curl -X POST http://localhost:5000/api/categories \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"Staff Content","minRole":"editor"}'
```

## Security Considerations

1. **Client-Side Filtering**: Categories are filtered on the backend, ensuring users cannot bypass restrictions by manipulating frontend code
2. **Optional Authentication**: The GET endpoint uses `optionalAuth` middleware, allowing both authenticated and anonymous access while still applying role-based filtering
3. **Validation**: The POST endpoint validates `minRole` values to prevent invalid data
4. **Role Hierarchy**: Properly enforced role hierarchy ensures users can only see categories they have permission to view

## Future Enhancements

Potential improvements for future versions:
- [ ] Category update endpoint to modify `minRole` of existing categories
- [ ] Bulk category role management interface
- [ ] Category role visibility indicators in UI (e.g., lock icons for restricted categories)
- [ ] Analytics on category visibility and access patterns
- [ ] Custom role groups beyond the three default roles
- [ ] Per-post role overrides within categories

## Troubleshooting

### Categories not showing up
- Check user authentication status
- Verify user role in database
- Check category `minRole` settings
- Review server logs for filtering details

### Cannot create restricted categories
- Ensure user has editor role or higher
- Verify JWT token is valid
- Check `minRole` value is one of: null, 'viewer', 'editor', 'admin'

### Migration issues
- Ensure MongoDB connection string is correct in `.env`
- Check database user has write permissions
- Review migration script logs for specific errors

## Related Files

### Backend
- `models/Category.js` - Category model with minRole field
- `routes/categories.js` - API routes with role-based filtering
- `middleware/auth.js` - Authentication middleware (optionalAuth)
- `scripts/migrate-add-minrole.js` - Migration script

### Frontend
- `src/components/Sidebar.jsx` - Category creation UI with role selector
- `src/services/api.js` - API service methods

## API Reference

### GET /api/categories
Returns categories filtered by user's role.

**Authentication**: Optional (uses `optionalAuth` middleware)

**Response**: Array of category objects visible to the user

**Example Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Anime",
    "slug": "anime",
    "isDefault": true,
    "minRole": null,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
]
```

### POST /api/categories
Creates a new category with optional role restriction.

**Authentication**: Required (editor role or higher)

**Request Body**:
```json
{
  "name": "Category Name",
  "minRole": "editor" // optional: null, "viewer", "editor", or "admin"
}
```

**Response**: Created category object

**Example Response**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Staff Content",
  "slug": "staff-content",
  "isDefault": false,
  "minRole": "editor",
  "createdAt": "2025-01-15T11:00:00.000Z",
  "updatedAt": "2025-01-15T11:00:00.000Z"
}
```

## Changelog

### Version 1.0.0 (2025-01-15)
- Initial implementation of role-based category visibility
- Added `minRole` field to Category model
- Implemented role-based filtering in categories API
- Added role selector UI in category creation form
- Created migration script for existing categories
- Full backward compatibility maintained

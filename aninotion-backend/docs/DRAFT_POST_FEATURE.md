# Draft Post Feature Documentation

## Overview
This document explains how draft posts work in the AniNotion system, including visibility rules, edit permissions, and status transitions for different user roles.

## Current Implementation

### 1. **Post Storage & Ownership**

Every post has a `createdBy` field that stores the user ID of the creator:

```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}
```

This field is automatically set when a post is created and **never changes** (even when edited by admins).

### 2. **Post Status**

Posts can have three status values:
- `draft` - Not visible to public, work in progress
- `published` - Publicly visible to all users
- `scheduled` - Scheduled for future publication

### 3. **Draft Post Visibility Rules**

| User Role | Can See Published Posts | Can See Own Drafts | Can See Others' Drafts |
|-----------|------------------------|-------------------|----------------------|
| Anonymous | ✅ Yes | ❌ No | ❌ No |
| Viewer | ✅ Yes | ✅ Yes | ❌ No |
| Editor | ✅ Yes | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes |

**Implementation in `buildPostQuery`:**

```javascript
// Anonymous users can only see published posts
if (!user) {
  query.status = 'published';
}
// Viewers can see published posts OR their own drafts
else if (user.role === 'viewer') {
  query.$or = [
    { status: 'published' },
    { status: 'draft', createdBy: user._id }
  ];
}
// Admins and editors can see all posts
else if (user.role === 'admin' || user.role === 'editor') {
  // No status restriction
}
```

### 4. **Edit Permissions**

| User Role | Can Edit Own Posts | Can Edit Others' Posts | Can Edit Draft Posts | Can Edit Published Posts |
|-----------|-------------------|----------------------|---------------------|------------------------|
| Viewer | ✅ Yes (drafts only) | ❌ No | ✅ Yes (own only) | ❌ No |
| Editor | ✅ Yes | ❌ No | ✅ Yes (own) | ✅ Yes (own) |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Key Constraints for Viewers:**
1. Can only edit posts they created
2. Can only edit posts with `draft` status
3. Cannot edit published posts (even their own)

**Implementation in PUT endpoint:**

```javascript
// Check ownership (except for admins)
if (req.user.role !== 'admin' && 
    existingPost.createdBy && 
    existingPost.createdBy.toString() !== req.user._id.toString()) {
  return res.status(403).json({ 
    message: 'You can only edit posts you created' 
  });
}

// Viewers can only edit their draft posts
if (req.user.role === 'viewer' && existingPost.status !== 'draft') {
  return res.status(403).json({ 
    message: 'You can only edit your draft posts. Published posts cannot be edited.' 
  });
}
```

### 5. **Status Transitions**

| Current Status | Allowed Next Status | Viewer | Editor | Admin |
|---------------|-------------------|--------|--------|-------|
| draft | published | ✅ Yes | ✅ Yes | ✅ Yes |
| draft | scheduled | ✅ Yes | ✅ Yes | ✅ Yes |
| published | draft | ✅ Yes | ✅ Yes | ✅ Yes |
| scheduled | draft | ✅ Yes | ✅ Yes | ✅ Yes |
| scheduled | published | ✅ Yes | ✅ Yes | ✅ Yes |

**Implementation:**

```javascript
const isValidStatusTransition = (currentStatus, newStatus, userRole) => {
  const allowedTransitions = {
    'draft': ['published', 'scheduled'],
    'published': ['draft'],
    'scheduled': ['draft', 'published']
  };
  
  if (userRole === 'admin') return true;
  
  if (userRole === 'editor' || userRole === 'viewer') {
    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }
  
  return false;
};
```

## API Endpoints

### GET /api/posts
**Behavior:**
- Anonymous users see only published posts
- Viewers see published posts + their own drafts
- Editors/Admins see all posts

**Example Response for Viewer:**
```json
[
  {
    "_id": "123",
    "title": "My Draft Post",
    "status": "draft",
    "createdBy": {
      "_id": "viewer_id",
      "name": "Viewer Name"
    },
    ...
  },
  {
    "_id": "456",
    "title": "Someone's Published Post",
    "status": "published",
    ...
  }
]
```

### GET /api/posts/:id
**Behavior:**
- Uses same visibility rules as GET /api/posts
- Viewers can access their own draft posts by ID
- Returns 404 if post doesn't exist or user doesn't have permission

### POST /api/posts
**Permissions:** All authenticated users (viewer, editor, admin)

**Create Draft Example:**
```json
{
  "title": "My Draft Post",
  "animeName": "One Piece",
  "category": "category_id",
  "content": "Post content...",
  "status": "draft"
}
```

**Notes:**
- Viewers have a daily post limit (1 post per day)
- `createdBy` is automatically set to the authenticated user

### PUT /api/posts/:id
**Permissions:** 
- Viewers: Can edit their own draft posts only
- Editors: Can edit their own posts (any status)
- Admins: Can edit any post

**Edit Draft Example:**
```json
{
  "title": "Updated Draft Title",
  "content": "Updated content...",
  "status": "published"
}
```

**Error Responses:**

1. **Viewer trying to edit someone else's post:**
```json
{
  "message": "You can only edit posts you created"
}
```

2. **Viewer trying to edit their own published post:**
```json
{
  "message": "You can only edit your draft posts. Published posts cannot be edited."
}
```

3. **Invalid status transition:**
```json
{
  "message": "Cannot change status from published to scheduled"
}
```

## Testing

Run the test script to verify the draft post functionality:

```bash
node scripts/test-draft-posts.js
```

This will test:
- ✅ Viewer can create draft posts
- ✅ Viewer can see their own draft posts
- ✅ Viewer cannot see other users' draft posts
- ✅ Viewer can edit their own draft posts
- ✅ Viewer can publish their draft posts

## User Workflows

### Viewer Workflow: Creating and Publishing a Post

1. **Create Draft:**
   ```
   POST /api/posts
   {
     "title": "My Post",
     "animeName": "Naruto",
     "category": "reviews",
     "content": "Content...",
     "status": "draft"
   }
   ```

2. **View Own Drafts:**
   ```
   GET /api/posts
   // Returns published posts + own drafts
   ```

3. **Edit Draft:**
   ```
   PUT /api/posts/:id
   {
     "title": "Updated Title",
     "content": "Updated content..."
   }
   ```

4. **Publish Draft:**
   ```
   PUT /api/posts/:id
   {
     "status": "published"
   }
   ```

5. **After Publishing:**
   - Post becomes visible to all users
   - Viewer can no longer edit the post
   - Only admins can edit published posts

### Editor/Admin Workflow

Editors and Admins have full access to:
- All draft posts (including others')
- Edit any post they created
- Change status of their own posts
- (Admins only) Edit any post from any user

## Database Schema Changes

No schema changes were required. The existing schema already supports this feature:

```javascript
// Post.js
{
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'published'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}
```

## Files Modified

1. **`utils/postHelpers.js`:**
   - Updated `buildPostQuery()` to allow viewers to see their own drafts
   - Updated `isValidStatusTransition()` to allow viewers to change status

2. **`routes/posts.js`:**
   - Updated PUT endpoint to allow viewers to edit their own draft posts
   - Added check to prevent viewers from editing published posts

3. **`scripts/test-draft-posts.js`:** (New file)
   - Comprehensive test script for draft post functionality

4. **`docs/DRAFT_POST_FEATURE.md`:** (This file)
   - Complete documentation of the feature

## Security Considerations

✅ **Implemented:**
- Users can only see their own drafts
- Users cannot access other users' drafts via API
- Viewers cannot edit published posts
- Viewers cannot edit posts created by others
- Role-based access control enforced at query level

❌ **Not Implemented (Future Enhancements):**
- Draft post sharing/collaboration
- Draft expiration/cleanup
- Draft version history
- Draft auto-save functionality

## Future Enhancements

1. **Draft Management Dashboard:**
   - Show list of all user's drafts
   - Sort by last updated
   - Bulk actions (delete, publish)

2. **Auto-save:**
   - Periodically save draft changes
   - Prevent data loss

3. **Draft Expiration:**
   - Automatically delete old drafts (e.g., 90 days)
   - Warning before deletion

4. **Collaborative Drafts:**
   - Share drafts with other users
   - Co-editing functionality

5. **Draft Preview:**
   - Preview how draft will look when published
   - SEO preview

## Support

For issues or questions about draft posts:
1. Check the test script: `node scripts/test-draft-posts.js`
2. Review the logs for detailed error messages
3. Ensure MongoDB indexes are in place: `postSchema.index({ createdBy: 1 })`

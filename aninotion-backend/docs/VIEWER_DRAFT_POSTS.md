# Viewer Draft Posts Feature

## Overview

This feature allows regular viewers (non-admin, non-editor users) to:
1. Create draft posts
2. View their own draft posts
3. Edit their own draft posts
4. **NOT** see or edit other users' draft posts

## Implementation Details

### Database Schema

The `Post` model already includes a `createdBy` field that stores which user created the post:

```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
```

This field is automatically populated when a post is created.

### Key Changes

#### 1. Post Query Building (`utils/postHelpers.js`)

The `buildPostQuery` function now handles viewers differently:

```javascript
function buildPostQuery(user, additionalFilters = {}) {
  let query = { ...additionalFilters };

  if (!user || user.role === 'viewer') {
    // Viewers can see:
    // 1. All published posts
    // 2. Their own draft posts (if authenticated)
    if (user) {
      query.$or = [
        { status: 'published' },
        { status: 'draft', createdBy: user._id }
      ];
    } else {
      // Unauthenticated users only see published posts
      query.status = 'published';
    }
  } else if (user.role === 'editor') {
    // Editors see published posts and their own drafts
    query.$or = [
      { status: 'published' },
      { status: 'draft', createdBy: user._id }
    ];
  }
  // Admins see everything (no status filter)

  return query;
}
```

**Key Logic:**
- **Unauthenticated users**: Only see `status: 'published'` posts
- **Viewers (authenticated)**: See all published posts + their own draft posts
- **Editors**: See all published posts + their own draft posts
- **Admins**: See all posts (no filtering)

#### 2. Edit Permissions (`routes/posts.js`)

The PUT endpoint now allows viewers to edit their own posts:

```javascript
router.put('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user can edit this post
    const isAdmin = req.user.role === 'admin';
    const isOwner = post.createdBy.toString() === req.user._id.toString();
    const isEditor = req.user.role === 'editor';

    // Viewers can only edit their own posts
    // Editors can edit their own posts
    // Admins can edit any post
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ 
        message: 'You do not have permission to edit this post' 
      });
    }

    // ... rest of update logic
  }
});
```

**Permission Logic:**
- **Admins**: Can edit any post
- **Editors**: Can only edit their own posts
- **Viewers**: Can only edit their own posts
- **Anyone else**: Forbidden (403)

#### 3. Status Transitions

The `isValidStatusTransition` function enforces proper workflow:

```javascript
function isValidStatusTransition(currentStatus, newStatus, userRole) {
  // Viewers and editors can only keep posts as draft or publish them
  if (userRole === 'viewer' || userRole === 'editor') {
    // Can't unpublish or archive
    if (currentStatus === 'published' && newStatus !== 'published') {
      return false;
    }
    // Can only transition from draft to published or stay as draft
    if (newStatus !== 'draft' && newStatus !== 'published') {
      return false;
    }
  }
  
  return true;
}
```

**Viewer/Editor Rules:**
- Can create posts as `draft`
- Can transition `draft` → `published`
- Can keep posts as `draft`
- **Cannot** unpublish posts (`published` → `draft`)
- **Cannot** archive posts

## API Examples

### 1. Create a Draft Post (Viewer)

```bash
POST /api/posts
Authorization: Bearer <viewer_token>

{
  "title": "My Draft Post",
  "content": "This is my draft content",
  "status": "draft",
  "slug": "my-draft-post"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "My Draft Post",
  "content": "This is my draft content",
  "status": "draft",
  "createdBy": "507f1f77bcf86cd799439012",
  "slug": "my-draft-post",
  ...
}
```

### 2. View Own Draft Posts (Viewer)

```bash
GET /api/posts
Authorization: Bearer <viewer_token>
```

**Response:**
```json
{
  "posts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "My Draft Post",
      "status": "draft",
      "createdBy": "507f1f77bcf86cd799439012"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Published Post by Someone Else",
      "status": "published",
      "createdBy": "507f1f77bcf86cd799439099"
    }
  ],
  "total": 2
}
```

### 3. Edit Own Draft Post (Viewer)

```bash
PUT /api/posts/507f1f77bcf86cd799439011
Authorization: Bearer <viewer_token>

{
  "title": "My Updated Draft Post",
  "content": "Updated content"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "My Updated Draft Post",
  "content": "Updated content",
  "status": "draft",
  ...
}
```

### 4. Attempt to Edit Another User's Draft (Viewer)

```bash
PUT /api/posts/507f1f77bcf86cd799439099
Authorization: Bearer <viewer_token>

{
  "title": "Trying to hack this post"
}
```

**Response:**
```json
{
  "message": "You do not have permission to edit this post"
}
```
**Status Code:** 403 Forbidden

### 5. Publish Own Draft (Viewer)

```bash
PUT /api/posts/507f1f77bcf86cd799439011
Authorization: Bearer <viewer_token>

{
  "status": "published"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "published",
  ...
}
```

## Security Considerations

### 1. **Isolation**
- Viewers can only see their own drafts
- No viewer can access another viewer's draft posts
- This is enforced at the query level using `createdBy` field

### 2. **Edit Protection**
- Ownership is verified before allowing edits
- Uses MongoDB ObjectId comparison: `post.createdBy.toString() === req.user._id.toString()`
- Returns 403 Forbidden if user doesn't own the post

### 3. **Status Transition Control**
- Viewers cannot unpublish posts
- Viewers cannot archive posts
- Viewers can only: `draft` → `published` or stay `draft`

### 4. **Admin Override**
- Admins can always view and edit any post
- This allows moderation and content management

## Testing

Run the comprehensive test suite:

```bash
cd aninotion-backend
node scripts/test-viewer-drafts.js
```

### Test Coverage

The test suite includes:

1. ✅ Viewers can create draft posts
2. ✅ Viewers can see their own draft posts in listings
3. ✅ Viewers cannot see other users' draft posts
4. ✅ Viewers can edit their own draft posts
5. ✅ Viewers cannot edit other users' draft posts
6. ✅ Viewers can access their own draft by ID
7. ✅ Viewers cannot access other users' drafts by ID
8. ✅ Admins can see all drafts from all users

## User Roles Summary

| Role     | View Own Drafts | View Others' Drafts | Edit Own Posts | Edit Others' Posts | Unpublish Posts |
|----------|----------------|---------------------|----------------|-------------------|----------------|
| Viewer   | ✅             | ❌                  | ✅             | ❌                | ❌             |
| Editor   | ✅             | ❌                  | ✅             | ❌                | ❌             |
| Admin    | ✅             | ✅                  | ✅             | ✅                | ✅             |

## Migration Notes

**No database migration required!** 

The `createdBy` field already exists in the Post model and is automatically populated on post creation. This feature simply leverages existing data.

## Troubleshooting

### Issue: Viewer cannot see their draft post

**Check:**
1. Is the post status actually 'draft'?
2. Does `post.createdBy` match the viewer's user ID?
3. Is the viewer authenticated (has valid token)?

**Debug Query:**
```javascript
console.log('User ID:', req.user._id);
console.log('Query:', buildPostQuery(req.user));
```

### Issue: Viewer can edit but changes don't save

**Check:**
1. Is the status transition valid?
2. Check console for `isValidStatusTransition` errors
3. Verify request body contains valid fields

### Issue: 403 Forbidden when editing own post

**Check:**
1. Token is valid and not expired
2. User ID in token matches `createdBy` field
3. Post actually exists in database

## Future Enhancements

Potential improvements:

1. **Draft Expiration**: Auto-delete drafts older than X days
2. **Draft Limit**: Limit number of drafts per user
3. **Draft Sharing**: Allow viewers to share draft links with specific users
4. **Draft Versioning**: Keep version history of drafts
5. **Collaborative Drafts**: Multiple users working on same draft

## Related Documentation

- [Post API Documentation](./API_V0.5.md)
- [Draft Post Feature](./DRAFT_POST_FEATURE.md)
- [Authentication](./AUTH_COMPLETE_SUMMARY.md)

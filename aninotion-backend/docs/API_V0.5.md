# AniNotion API v0.5 - Authentication & Enhanced Posts

## Overview

AniNotion v0.5 introduces user authentication, role-based access control, and enhanced post management with lifecycle features. The API maintains backward compatibility for read operations while securing write operations behind authentication.

## Authentication

### JWT Token Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **Admin**: Full access to all operations, user management
- **Editor**: Can create, edit, delete own posts, view all posts
- **Viewer**: Read-only access (same as anonymous users for posts)

## Authentication Endpoints

### POST /api/auth/register

Create a new user account (Admin only).

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123",
  "role": "editor" // "admin", "editor", or "viewer"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "editor",
    "status": "active",
    "createdAt": "2025-08-27T10:00:00Z"
  }
}
```

### POST /api/auth/login

User login to get JWT token.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "editor",
    "status": "active",
    "lastLoginAt": "2025-08-27T10:00:00Z"
  }
}
```

### GET /api/auth/me

Get current user information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "editor",
    "status": "active",
    "lastLoginAt": "2025-08-27T10:00:00Z",
    "createdAt": "2025-08-27T09:00:00Z",
    "updatedAt": "2025-08-27T10:00:00Z"
  }
}
```

### PUT /api/auth/me

Update current user profile (name only).

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "New Name"
}
```

### PUT /api/auth/change-password

Change current user's password.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

### GET /api/auth/users

List all users (Admin only).

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

### PUT /api/auth/users/:id/status

Enable/disable user account (Admin only).

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "disabled" // "active" or "disabled"
}
```

## Post Endpoints

### GET /api/posts

Get all posts with pagination and filtering.

**Query Parameters:**
- `status` - Filter by status (admin/editor only): "draft", "published", "scheduled"
- `category` - Filter by category ID
- `tags` - Comma-separated list of tags
- `limit` - Number of posts per page (default: 20)
- `page` - Page number (default: 1)
- `sortBy` - Sort field: "publishedAt", "createdAt", "updatedAt", "views", "likesCount", "title"
- `sortOrder` - Sort direction: "asc" or "desc" (default: "desc")

**Response:**
```json
{
  "posts": [
    {
      "_id": "post_id",
      "title": "Post Title",
      "slug": "post-title",
      "animeName": "Anime Name",
      "category": {
        "_id": "category_id",
        "name": "Category Name"
      },
      "content": "Post content...",
      "status": "published",
      "publishedAt": "2025-08-27T10:00:00Z",
      "createdBy": {
        "_id": "user_id",
        "name": "Author Name",
        "email": "author@example.com"
      },
      "views": 42,
      "likesCount": 5,
      "tags": ["tag1", "tag2"],
      "excerpt": "Brief description...",
      "readingTimeMinutes": 3,
      "images": ["image_url1", "image_url2"],
      "createdAt": "2025-08-27T09:00:00Z",
      "updatedAt": "2025-08-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### GET /api/posts/:identifier

Get single post by ID or slug. Views are automatically incremented for published posts.

**Query Parameters:**
- `incrementViews` - Set to "false" to disable view increment

### POST /api/posts

Create a new post (Admin/Editor only).

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Post Title",
  "animeName": "Anime Name",
  "category": "category_id",
  "content": "Post content...",
  "status": "published", // "draft", "published", "scheduled"
  "tags": ["tag1", "tag2"],
  "excerpt": "Custom excerpt...", // Optional, auto-generated if not provided
  "publishedAt": "2025-08-27T15:00:00Z", // Optional, for scheduling
  "images": ["base64_image_data"],
  "imageTypes": [false] // true for URLs, false for base64
}
```

### PUT /api/posts/:id

Update an existing post (Admin/Editor only, editors can only edit their own posts).

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Body:** Same as POST, all fields optional

### PUT /api/posts/:id/publish

Quick publish/unpublish a post (Admin/Editor only).

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "publish": true, // true to publish, false to unpublish
  "publishedAt": "2025-08-27T15:00:00Z" // Optional custom publish date
}
```

### DELETE /api/posts/:id

Soft delete a post (Admin/Editor only, editors can only delete their own posts).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### POST /api/posts/:id/like

Increment the like counter for a post (no authentication required).

**Response:**
```json
{
  "likesCount": 6,
  "message": "Post liked successfully"
}
```

## Post Fields Explained

### New Fields in v0.5

- **slug**: SEO-friendly URL identifier, auto-generated from title
- **status**: Post lifecycle status ("draft", "published", "scheduled")
- **publishedAt**: When the post was published (null for drafts)
- **createdBy/updatedBy**: User references for ownership tracking
- **views**: View counter, incremented on each read
- **likesCount**: Like counter
- **tags**: Array of searchable tags
- **excerpt**: Brief description, auto-generated from content
- **readingTimeMinutes**: Estimated reading time
- **isDeleted**: Soft delete flag

### Status Transitions

- **Draft → Published**: Available to editors and admins
- **Published → Draft**: Available to editors and admins  
- **Draft → Scheduled**: Available to editors and admins
- **Scheduled → Published/Draft**: Available to editors and admins

## Error Responses

### Authentication Errors

```json
{
  "error": "Authentication required",
  "message": "Please provide a valid token"
}
```

### Authorization Errors

```json
{
  "error": "Insufficient permissions",
  "message": "Required role: admin or editor"
}
```

### Validation Errors

```json
{
  "error": "Validation failed",
  "message": "Title, anime name, category, and content are required"
}
```

## Migration

To upgrade from v0.4 to v0.5, run the migration script:

```bash
npm run migrate:v0.5
```

This will:
1. Add new fields to existing posts
2. Generate slugs for all posts
3. Set default values for counters and status
4. Create a default admin user if none exists

## Default Admin Account

After migration, a default admin account is created:

- **Email**: admin@aninotion.com
- **Password**: admin123456

⚠️ **Important**: Change this password immediately after first login!

## Backward Compatibility

- All existing GET endpoints work without authentication
- Anonymous users see only published posts
- Existing frontend code will continue to work
- New features are additive and optional

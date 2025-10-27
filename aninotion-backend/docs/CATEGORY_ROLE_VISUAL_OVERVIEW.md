# Category Role-Based Visibility - Visual Overview

## 🎨 Feature Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CATEGORY CREATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

Editor/Admin User
      │
      ├─ Clicks "Add Category" in Sidebar
      │
      ├─ Enters Category Name: "Premium Content"
      │
      ├─ Selects Visibility:
      │   ┌──────────────────────────────────────┐
      │   │ [ ] Visible to all (public)          │
      │   │ [ ] Viewer and above                 │
      │   │ [✓] Editor and above  ← Selected     │
      │   │ [ ] Admin only                       │
      │   └──────────────────────────────────────┘
      │
      ├─ Clicks "Add" Button
      │
      ├─ POST /api/categories
      │   Body: {
      │     "name": "Premium Content",
      │     "minRole": "editor"
      │   }
      │
      ├─ Backend creates category with minRole
      │
      └─ Category appears in sidebar (for editor+ only)
```

## 👥 User Role Visibility Matrix

```
┌────────────────────┬──────────┬─────────┬─────────┬────────┐
│    Category        │ Public   │ Viewer  │ Editor  │ Admin  │
│    minRole →       │ (null)   │ viewer  │ editor  │ admin  │
├────────────────────┼──────────┼─────────┼─────────┼────────┤
│ Anonymous User     │    ✓     │    ✗    │    ✗    │   ✗    │
├────────────────────┼──────────┼─────────┼─────────┼────────┤
│ Viewer Role        │    ✓     │    ✓    │    ✗    │   ✗    │
├────────────────────┼──────────┼─────────┼─────────┼────────┤
│ Editor Role        │    ✓     │    ✓    │    ✓    │   ✗    │
├────────────────────┼──────────┼─────────┼─────────┼────────┤
│ Admin Role         │    ✓     │    ✓    │    ✓    │   ✓    │
└────────────────────┴──────────┴─────────┴─────────┴────────┘

✓ = Can view    ✗ = Cannot view
```

## 🔄 Category Filtering Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GET /api/categories FLOW                     │
└─────────────────────────────────────────────────────────────────┘

User Request
      │
      ├─ Authorization Header (Optional)
      │    - If present: optionalAuth extracts user info
      │    - If absent: Continue as anonymous
      │
      ├─ Fetch all categories from database
      │    Categories: [
      │      { name: "Anime", minRole: null },
      │      { name: "Members", minRole: "viewer" },
      │      { name: "Staff", minRole: "editor" },
      │      { name: "Internal", minRole: "admin" }
      │    ]
      │
      ├─ Apply Role-Based Filter
      │    User Role: "editor"
      │    
      │    For each category:
      │    ┌─────────────────────────────────────┐
      │    │ 1. Check if minRole is null         │
      │    │    → Yes: Include (public)          │
      │    │    → No: Check role hierarchy       │
      │    │                                     │
      │    │ 2. Compare user role vs minRole     │
      │    │    getRoleValue("editor") = 2       │
      │    │    getRoleValue(minRole) = ?        │
      │    │    → If user ≥ minRole: Include    │
      │    │    → Otherwise: Exclude             │
      │    └─────────────────────────────────────┘
      │
      ├─ Filtered Results for "editor":
      │    [
      │      { name: "Anime", minRole: null },     ✓
      │      { name: "Members", minRole: "viewer" },  ✓
      │      { name: "Staff", minRole: "editor" },  ✓
      │      { name: "Internal", minRole: "admin" }  ✗
      │    ]
      │
      └─ Return filtered categories to client
```

## 🗂️ Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Category Schema                          │
└─────────────────────────────────────────────────────────────────┘

{
  _id: ObjectId,
  name: String (required, unique),
  slug: String (required, unique),
  isDefault: Boolean (default: false),
  minRole: String | null (NEW!)
           ├─ null: Public (default)
           ├─ "viewer": Authenticated users
           ├─ "editor": Editors and admins
           └─ "admin": Admins only
  createdAt: Date,
  updatedAt: Date
}

Instance Methods:
  └─ canView(userRole): Boolean
     Returns true if user can view this category
```

## 🎨 Frontend UI Components

```
┌────────────────────────────────────────────────────────────────┐
│                        Sidebar Component                        │
└────────────────────────────────────────────────────────────────┘

╔════════════════════════════════╗
║         AniAlpha               ║
╠════════════════════════════════╣
║ 🏠 Home                        ║
║ 📁 Anime                       ║  ← Public category
║ 📁 Manga                       ║  ← Public category
║ 📁 Community                   ║  ← Viewer+ category
║ 📁 Staff Content               ║  ← Editor+ category
║                                ║
║ ┌────────────────────────────┐ ║
║ │ + Add Category             │ ║  ← Click to expand
║ └────────────────────────────┘ ║
╚════════════════════════════════╝

When "Add Category" clicked:

╔════════════════════════════════╗
║ ┌────────────────────────────┐ ║
║ │ Category name              │ ║
║ │ [                        ] │ ║
║ └────────────────────────────┘ ║
║                                ║
║ ┌────────────────────────────┐ ║
║ │ Visibility                 │ ║
║ │ [▼ Editor and above      ] │ ║
║ │    Visible to all (public) │ ║
║ │    Viewer and above        │ ║
║ │  ✓ Editor and above        │ ║
║ │    Admin only              │ ║
║ └────────────────────────────┘ ║
║                                ║
║ [ Add ]  [ Cancel ]            ║
╚════════════════════════════════╝
```

## 📊 Role Hierarchy Visualization

```
        ┌─────────────────┐
        │  🔴 ADMIN       │  Level 3
        │  Can see: ALL   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  🟡 EDITOR      │  Level 2
        │  Can see: 3/4   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  🟢 VIEWER      │  Level 1
        │  Can see: 2/4   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  ⚪ ANONYMOUS   │  Level 0
        │  Can see: 1/4   │
        └─────────────────┘

Example with 4 categories:
1. "Anime" (minRole: null) ← All can see
2. "Members" (minRole: viewer) ← Viewer+ can see
3. "Staff" (minRole: editor) ← Editor+ can see
4. "Internal" (minRole: admin) ← Admin only
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Layers                             │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Client-Side (UI)
         ├─ Only editors+ see "Add Category" button
         └─ Categories filtered by received data

                        ↓

Layer 2: API Middleware (optionalAuth)
         ├─ Extracts JWT token if present
         ├─ Validates token signature
         ├─ Attaches user object to request
         └─ Continues without error if no token

                        ↓

Layer 3: Route Handler
         ├─ Receives all categories from database
         ├─ Gets user role from req.user
         ├─ Applies server-side filtering
         └─ Returns only visible categories

                        ↓

Layer 4: Database Schema
         ├─ Validates minRole enum values
         ├─ Prevents invalid role assignments
         └─ Enforces data integrity

Result: 🔒 Client cannot bypass role restrictions
```

## 📝 Example Use Cases

```
┌─────────────────────────────────────────────────────────────────┐
│                        Use Case 1                               │
│                   Public Content (Default)                      │
└─────────────────────────────────────────────────────────────────┘

Category: "Latest Anime"
minRole: null
Visible to: Everyone ✓

Use for: General content, main categories, public posts


┌─────────────────────────────────────────────────────────────────┐
│                        Use Case 2                               │
│                  Community Content                              │
└─────────────────────────────────────────────────────────────────┘

Category: "Discussions"
minRole: "viewer"
Visible to: Logged-in users ✓

Use for: User forums, community posts, member content


┌─────────────────────────────────────────────────────────────────┐
│                        Use Case 3                               │
│                  Editorial Content                              │
└─────────────────────────────────────────────────────────────────┘

Category: "Draft Reviews"
minRole: "editor"
Visible to: Staff members ✓

Use for: Work-in-progress, internal reviews, staff content


┌─────────────────────────────────────────────────────────────────┐
│                        Use Case 4                               │
│                  Admin Content                                  │
└─────────────────────────────────────────────────────────────────┘

Category: "System Updates"
minRole: "admin"
Visible to: Admins only ✓

Use for: Internal announcements, admin-only info
```

## 🧪 Testing Scenarios

```
Test Scenario 1: Anonymous User
┌──────────────────────────────────────┐
│ Input:  GET /api/categories          │
│ Auth:   None                         │
│ Result: Only minRole=null categories │
│ Status: ✅ PASS                      │
└──────────────────────────────────────┘

Test Scenario 2: Viewer User
┌──────────────────────────────────────┐
│ Input:  GET /api/categories          │
│ Auth:   Bearer <viewer-token>        │
│ Result: null + viewer categories     │
│ Status: ✅ PASS                      │
└──────────────────────────────────────┘

Test Scenario 3: Editor Creating Category
┌──────────────────────────────────────┐
│ Input:  POST /api/categories         │
│         { name: "Test",              │
│           minRole: "editor" }        │
│ Auth:   Bearer <editor-token>        │
│ Result: Category created with editor │
│         minRole                      │
│ Status: ✅ PASS                      │
└──────────────────────────────────────┘

Test Scenario 4: Invalid minRole
┌──────────────────────────────────────┐
│ Input:  POST /api/categories         │
│         { name: "Test",              │
│           minRole: "superuser" }     │
│ Result: 400 Bad Request              │
│         "Invalid minRole..."         │
│ Status: ✅ PASS                      │
└──────────────────────────────────────┘
```

## 📦 File Structure

```
aninotion-backend/
├── models/
│   └── Category.js ...................... ✅ Updated with minRole
├── routes/
│   └── categories.js .................... ✅ Updated with filtering
├── middleware/
│   └── auth.js .......................... ✅ Has optionalAuth
├── scripts/
│   ├── migrate-add-minrole.js ........... ✅ NEW Migration script
│   └── test-category-roles.js ........... ✅ NEW Test script
├── docs/
│   ├── CATEGORY_ROLE_VISIBILITY.md ...... ✅ NEW Full docs
│   ├── CATEGORY_ROLE_QUICK_START.md ..... ✅ NEW Quick guide
│   ├── CATEGORY_ROLE_IMPLEMENTATION_SUMMARY.md .. ✅ NEW Summary
│   └── CATEGORY_ROLE_VISUAL_OVERVIEW.md . ✅ NEW This file
└── package.json ......................... ✅ Added npm scripts

aninotion-frontend/
└── src/
    └── components/
        └── Sidebar.jsx .................. ✅ Updated with role selector
```

---

**Status**: ✅ Complete & Production Ready
**Version**: 1.0.0

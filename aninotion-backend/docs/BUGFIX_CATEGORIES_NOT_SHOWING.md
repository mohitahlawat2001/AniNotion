# Bug Fix: Categories Not Showing After Login

## 🐛 Issue Description

Categories created from the UI were visible immediately after creation but disappeared after logging out and logging back in. The categories were present in the database but not showing in the UI.

## 🔍 Root Cause

The `categoriesAPI.getAll()` function was using a plain `fetch()` call without including the authentication token. This caused the backend's `optionalAuth` middleware to treat all requests as anonymous, filtering out categories with role restrictions.

## ✅ Fix Applied

### 1. Updated Frontend API Call (`src/services/api.js`)

**Before:**
```javascript
getAll: async () => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}
```

**After:**
```javascript
getAll: async () => {
  // Include auth token if available for proper role-based filtering
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  const response = await fetch(`${API_BASE_URL}/categories`, { headers });
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}
```

### 2. Updated Sidebar Component (`src/components/Sidebar.jsx`)

**Before:**
```javascript
useEffect(() => {
  fetchCategories();
}, []);
```

**After:**
```javascript
useEffect(() => {
  fetchCategories();
}, [isAuthenticated]); // Refetch categories when authentication state changes
```

## 🎯 What This Fixes

1. **Categories now send auth token**: The API call now includes the JWT token when fetching categories
2. **Backend applies correct filtering**: The backend can now identify the user's role and show appropriate categories
3. **Auto-refresh on login/logout**: Categories automatically refresh when authentication state changes

## 🧪 Testing

### Test Scenario 1: Create and View Category
1. Log in as editor/admin
2. Create a new category with any visibility level
3. Category should appear immediately ✅
4. Log out and log back in
5. Category should still be visible ✅

### Test Scenario 2: Role-Based Visibility
1. Create a category with "Editor and above" visibility
2. Log out (or test as viewer)
3. Category should not be visible to viewers/anonymous users ✅
4. Log in as editor
5. Category should be visible ✅

### Test Scenario 3: Public Categories
1. Create a category with "Visible to all (public)" 
2. Category should be visible to all users regardless of auth state ✅

## 📝 Files Changed

- ✅ `/workspaces/AniNotion/aninotion-frontend/src/services/api.js` - Updated `categoriesAPI.getAll()`
- ✅ `/workspaces/AniNotion/aninotion-frontend/src/components/Sidebar.jsx` - Added `isAuthenticated` dependency

## 🎉 Result

Categories now work correctly with role-based visibility:
- Anonymous users see only public categories
- Authenticated users see categories based on their role
- Categories persist across login/logout cycles
- No breaking changes to existing functionality

---

**Status**: ✅ Fixed  
**Date**: October 27, 2025  
**Impact**: High (core functionality)  
**Breaking Changes**: None

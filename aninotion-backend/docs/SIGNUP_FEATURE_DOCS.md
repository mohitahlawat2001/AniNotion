# Public Signup Feature Documentation

## 🎉 Overview

Users can now create their own accounts using email and password! This feature allows anyone to sign up for AniNotion without requiring admin approval.

---

## 📦 Implementation Summary

### Backend Changes

**New Endpoint**: `POST /api/auth/signup`
- Public endpoint (no authentication required)
- Creates new user with "viewer" role by default
- Returns JWT token upon successful registration
- Validates email format and password strength

### Frontend Changes

**New Component**: `SignupModal.jsx`
- Email, name, and password fields
- Password confirmation validation
- Google OAuth option
- Switch to login link

**Updated Components**:
- `AuthButton.jsx` - Now manages both login and signup modals
- `LoginModal.jsx` - Added "Sign up here" link

**New API Method**: `authAPI.signup()`

---

## 🚀 API Documentation

### Signup Endpoint

**URL**: `POST /api/auth/signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123"
}
```

**Response** (Success - 201):
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer",
    "status": "active",
    "createdAt": "2025-10-09T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- ✅ Email: Required, valid email format
- ✅ Password: Required, minimum 6 characters
- ✅ Name: Optional (uses email username if not provided)

**Error Responses**:

```json
// 400 - Missing fields
{
  "error": "Validation failed",
  "message": "Email and password are required"
}

// 400 - Password too short
{
  "error": "Validation failed",
  "message": "Password must be at least 6 characters long"
}

// 400 - Invalid email
{
  "error": "Validation failed",
  "message": "Please provide a valid email address"
}

// 409 - User exists
{
  "error": "User already exists",
  "message": "An account with this email already exists"
}

// 500 - Server error
{
  "error": "Internal server error",
  "message": "Failed to create account"
}
```

---

## 🎨 Frontend Usage

### SignupModal Component

```jsx
import SignupModal from './components/SignupModal';

<SignupModal
  isOpen={showSignup}
  onClose={() => setShowSignup(false)}
  onSuccess={() => console.log('Signup successful!')}
  onSwitchToLogin={() => {
    setShowSignup(false);
    setShowLogin(true);
  }}
/>
```

### Using AuthButton (Automatic)

The `AuthButton` component automatically manages both modals:

```jsx
import AuthButton from './components/AuthButton';

<AuthButton
  requireAuth={true}
  onClick={() => createPost()}
  className="btn-primary"
>
  Create Post
</AuthButton>
```

When a user clicks and isn't authenticated:
1. Login modal appears
2. User can click "Sign up here"
3. Signup modal appears
4. User can switch back to login

---

## 🔧 User Flow

### New User Signup Flow

```
1. User clicks protected action
   ↓
2. Login modal appears
   ↓
3. User clicks "Sign up here"
   ↓
4. Signup modal appears
   ├─ Option 1: Sign up with Google (OAuth)
   ├─ Option 2: Sign up with email/password
   ↓
5. User enters details:
   - Email *
   - Name (optional)
   - Password * (min 6 chars)
   - Confirm Password *
   ↓
6. Click "Sign Up"
   ↓
7. Backend validates and creates user
   ↓
8. JWT token returned
   ↓
9. Token stored in localStorage
   ↓
10. User logged in automatically
   ↓
11. Original action executes
```

### Visual Flow

```
┌─────────────────────┐
│   Click Action      │
│   (Protected)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Login Modal       │
│  "Sign up here" →   │──┐
└─────────────────────┘  │
                         │
           ┌─────────────┘
           │
           ▼
┌──────────────────────────┐
│   Signup Modal           │
│  ┌────────────────────┐  │
│  │ [G] Google Signup  │  │
│  └────────────────────┘  │
│                          │
│  ─── Or with email ───   │
│                          │
│  Email: [___________]    │
│  Name:  [___________]    │
│  Pass:  [___________]    │
│  Conf:  [___________]    │
│                          │
│  [Sign Up] [Cancel]      │
│                          │
│  "Log in here" ←─────────┤
└──────────────────────────┘
           │
           ▼
┌──────────────────────┐
│   Account Created!   │
│   (Auto Login)       │
└──────────────────────┘
```

---

## ✨ Features

### Signup Features
✅ Email/password registration
✅ Google OAuth signup
✅ Password strength validation (min 6 chars)
✅ Password confirmation check
✅ Email format validation
✅ Duplicate email detection
✅ Automatic login after signup
✅ Name optional (uses email if empty)

### User Experience
✅ Clear validation messages
✅ Loading states
✅ Error handling
✅ Easy switch between login/signup
✅ Professional UI
✅ Mobile responsive

### Security
✅ Password hashing (bcrypt)
✅ JWT token generation
✅ Email validation
✅ Duplicate prevention
✅ Secure token storage
✅ Audit logging

---

## 🧪 Testing

### Backend Testing

```bash
# Test signup endpoint
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'
```

**Expected Response**:
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

### Frontend Testing

1. **Open app**: http://localhost:3000
2. **Trigger protected action** (e.g., Create Post)
3. **Click "Sign up here"** in login modal
4. **Fill form**:
   - Email: `newuser@example.com`
   - Name: `New User`
   - Password: `password123`
   - Confirm: `password123`
5. **Click "Sign Up"**
6. **Verify**:
   - Account created
   - Automatically logged in
   - Can perform actions

### Error Testing

Test these scenarios:

```javascript
// Missing email
{ "password": "test123" }
// → "Email and password are required"

// Short password
{ "email": "test@test.com", "password": "123" }
// → "Password must be at least 6 characters long"

// Invalid email
{ "email": "notanemail", "password": "test123" }
// → "Please provide a valid email address"

// Duplicate email
{ "email": "existing@test.com", "password": "test123" }
// → "An account with this email already exists"

// Password mismatch (frontend only)
password: "test123", confirmPassword: "test456"
// → "Passwords do not match"
```

---

## 🔒 Security Considerations

### Password Security
- ✅ Minimum 6 characters (configurable)
- ✅ Hashed with bcrypt (12 rounds)
- ✅ Never stored in plain text
- ✅ Never returned in API responses

### Email Security
- ✅ Case-insensitive storage
- ✅ Format validation
- ✅ Uniqueness enforced
- ✅ Trimmed whitespace

### Token Security
- ✅ JWT signed with secret
- ✅ 7-day expiration
- ✅ Stored in localStorage
- ✅ Validated on each request

### Rate Limiting
- ⚠️ **Recommended**: Add rate limiting to prevent abuse
- Consider: Max 5 signup attempts per IP per hour

---

## 📊 Database Schema

### User Model

```javascript
{
  email: String,           // Required, unique, lowercase
  name: String,            // Optional
  passwordHash: String,    // Required for local auth
  role: String,            // Default: 'viewer'
  status: String,          // Default: 'active'
  authProvider: String,    // 'local' for signup
  googleId: String,        // null for local signup
  profilePicture: String,  // null for local signup
  createdAt: Date,         // Auto-generated
  updatedAt: Date,         // Auto-generated
  lastLoginAt: Date        // Set on signup
}
```

---

## 🎯 Default Settings

### New User Defaults

When a user signs up:
- **Role**: `viewer` (can view content)
- **Status**: `active` (account enabled)
- **Auth Provider**: `local` (email/password)
- **Name**: Email username if not provided

### Permissions

**Viewer Role** (default for new users):
- ✅ View all content
- ✅ Create posts (if enabled)
- ✅ Comment on posts (if enabled)
- ❌ Cannot manage users
- ❌ Cannot change roles
- ❌ Cannot delete others' content

To upgrade permissions, an admin must change the user's role to `editor` or `admin`.

---

## 🐛 Common Issues

### Issue: "User already exists"
**Cause**: Email is already registered
**Fix**: User should use "Log in here" link

### Issue: "Password must be at least 6 characters"
**Cause**: Password too short
**Fix**: Enter longer password

### Issue: "Passwords do not match"
**Cause**: Password and confirmation don't match
**Fix**: Re-enter passwords carefully

### Issue: Signup succeeds but not logged in
**Cause**: Token not saved or page not refreshed
**Fix**: Check localStorage for token, try manual refresh

---

## 📈 Next Steps (Optional Enhancements)

### Short-term
- [ ] Add password strength indicator
- [ ] Add email verification
- [ ] Add "Remember me" option
- [ ] Add "Forgot password" feature

### Medium-term
- [ ] Add captcha for bot prevention
- [ ] Add rate limiting
- [ ] Add account activation emails
- [ ] Add profile completion wizard

### Long-term
- [ ] Add two-factor authentication
- [ ] Add social profile linking
- [ ] Add account settings page
- [ ] Add account deletion option

---

## 📚 Related Documentation

- **OAuth Implementation**: `../aninotion-backend/README_OAUTH.md`
- **Auth API**: `../aninotion-backend/docs/GOOGLE_OAUTH_API.md`
- **User Management**: Check admin dashboard docs

---

## ✅ Summary

### Backend ✅
- [x] Public signup endpoint created
- [x] Email validation added
- [x] Password validation added
- [x] Duplicate check implemented
- [x] JWT token generation
- [x] Logging added

### Frontend ✅
- [x] SignupModal component created
- [x] Form validation added
- [x] Google OAuth integration
- [x] Switch login/signup
- [x] API method added
- [x] AuthButton updated

### Features ✅
- [x] Email/password signup
- [x] Google OAuth signup
- [x] Automatic login
- [x] Error handling
- [x] Loading states
- [x] Mobile responsive

---

## 🎉 Status

**Implementation**: ✅ **COMPLETE**
**Testing**: Ready for QA
**Documentation**: Complete
**Production Ready**: Yes

Users can now:
- ✨ Sign up with email/password
- 🚀 Sign up with Google
- 🔄 Switch between login/signup
- 💼 Start using the app immediately

---

**Last Updated**: October 9, 2025
**Version**: 1.0.0

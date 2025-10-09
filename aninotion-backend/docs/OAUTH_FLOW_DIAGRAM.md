# Google OAuth2 Flow Diagram

## Complete Authentication Flow

```
┌─────────────┐
│   Browser   │
│   (User)    │
└──────┬──────┘
       │
       │ 1. Click "Sign in with Google"
       │
       ▼
┌─────────────┐
│  Frontend   │
│  React App  │
└──────┬──────┘
       │
       │ 2. Redirect to
       │    /api/auth/google
       ▼
┌─────────────────────────────────────────────┐
│          Backend Express Server              │
│  ┌─────────────────────────────────────┐   │
│  │  GET /api/auth/google               │   │
│  │  - Passport authenticates           │   │
│  │  - Generates OAuth URL              │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼──────────────────────────┘
                  │
                  │ 3. Redirect to
                  │    Google OAuth
                  ▼
       ┌─────────────────────┐
       │   Google OAuth      │
       │   Consent Screen    │
       └──────────┬──────────┘
                  │
                  │ 4. User signs in
                  │    and grants permissions
                  │
                  │ 5. Google redirects with
                  │    authorization code
                  ▼
┌─────────────────────────────────────────────┐
│          Backend Express Server              │
│  ┌─────────────────────────────────────┐   │
│  │  GET /api/auth/google/callback     │   │
│  │                                      │   │
│  │  Step 6: Passport receives code     │   │
│  │  Step 7: Exchange code for profile  │   │
│  │                                      │   │
│  │  Step 8: Check User in Database     │   │
│  │  ┌─────────────┐                    │   │
│  │  │  New User?  │                    │   │
│  │  └──┬──────┬───┘                    │   │
│  │     │ Yes  │ No                     │   │
│  │     ▼      ▼                        │   │
│  │  Create  Find                       │   │
│  │  User    User                       │   │
│  │     │      │                        │   │
│  │     └──┬───┘                        │   │
│  │        │                            │   │
│  │  Step 9: Generate JWT Token        │   │
│  │        │                            │   │
│  └────────┼────────────────────────────┘   │
└───────────┼──────────────────────────────┘
            │
            │ 10. Redirect to frontend
            │     with token
            ▼
     ┌─────────────────────────┐
     │  Frontend Callback Page │
     │  /auth/callback?token=  │
     │                         │
     │  Step 11: Save token    │
     │  Step 12: Fetch user    │
     │  Step 13: Redirect to   │
     │           dashboard     │
     └─────────────────────────┘
```

## User Database States

### Scenario 1: New Google User
```
Before:
  Database: No user with email@gmail.com

After OAuth:
  Database: {
    email: "email@gmail.com",
    name: "John Doe",
    googleId: "103745182734659283746",
    profilePicture: "https://...",
    authProvider: "google",
    role: "viewer",
    passwordHash: null  // ← Not required!
  }
```

### Scenario 2: Existing Local User (Account Linking)
```
Before:
  Database: {
    email: "email@gmail.com",
    passwordHash: "$2a$12$...",
    authProvider: "local",
    googleId: null
  }

After OAuth:
  Database: {
    email: "email@gmail.com",
    passwordHash: "$2a$12$...",  // ← Preserved!
    authProvider: "google",       // ← Updated
    googleId: "103745182734659283746",  // ← Added
    profilePicture: "https://..."       // ← Added
  }
```

### Scenario 3: Returning Google User
```
Before & After:
  Database: {
    email: "email@gmail.com",
    googleId: "103745182734659283746",
    lastLoginAt: "2025-01-09T10:30:00Z",  // ← Updated
    // ... other fields unchanged
  }
```

## API Endpoint Details

### 1. GET /api/auth/google/url
```
Request:
  GET /api/auth/google/url

Response:
  200 OK
  {
    "url": "http://localhost:5000/api/auth/google",
    "message": "Redirect user to this URL to initiate Google OAuth"
  }
```

### 2. GET /api/auth/google
```
Request:
  GET /api/auth/google

Response:
  302 Redirect
  Location: https://accounts.google.com/o/oauth2/v2/auth?
    response_type=code&
    redirect_uri=http://localhost:5000/api/auth/google/callback&
    scope=profile%20email&
    client_id=186552104761-8os...
```

### 3. GET /api/auth/google/callback
```
Request:
  GET /api/auth/google/callback?code=4/0AY0e-g7X...

Response:
  302 Redirect
  Location: http://localhost:3000/auth/callback?token=eyJhbGc...
```

## Error Handling Flow

```
┌─────────────┐
│   OAuth     │
│   Process   │
└──────┬──────┘
       │
       ├─── ✅ Success
       │     │
       │     └──> Redirect: /auth/callback?token=xxx
       │
       ├─── ❌ No email from Google
       │     │
       │     └──> Redirect: /login?error=oauth_failed
       │
       ├─── ❌ User account disabled
       │     │
       │     └──> Redirect: /login?error=account_disabled
       │
       └─── ❌ Server error
             │
             └──> Redirect: /login?error=authentication_failed
```

## Frontend Implementation Checklist

### Required Components

✅ **Google Sign-in Button**
```jsx
<button onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}>
  Sign in with Google
</button>
```

✅ **Auth Callback Route** (`/auth/callback`)
```jsx
- Extract token from URL params
- Save to localStorage/context
- Fetch user data
- Redirect to dashboard
```

✅ **Error Handling**
```jsx
- Check for error param in URL
- Display appropriate error message
- Provide retry option
```

### Files to Create/Modify

1. **Login Page** - Add Google button
2. **Signup Page** - Add Google button  
3. **Auth Callback** - New page/component
4. **Auth Context** - Handle OAuth token
5. **API Service** - Token management

## Security Checklist

✅ Environment Variables
  - GOOGLE_CLIENT_SECRET not exposed to frontend
  - All sensitive data in .env

✅ Redirect URIs
  - Configured in Google Cloud Console
  - Match exactly with GOOGLE_CALLBACK_URL

✅ JWT Tokens
  - Expiration set (7 days)
  - Stored securely (localStorage or httpOnly cookies)
  - Validated on each request

✅ User Permissions
  - Only request necessary scopes (profile, email)
  - Email is required for account creation

✅ HTTPS in Production
  - All OAuth redirects use HTTPS
  - Secure cookies if using cookie storage

## Testing Checklist

### Backend Tests
- [ ] GET /api/auth/google/url returns valid URL
- [ ] GET /api/auth/google redirects to Google
- [ ] Callback creates new user correctly
- [ ] Callback links existing user correctly
- [ ] Callback updates lastLoginAt
- [ ] Error handling works for edge cases

### Integration Tests
- [ ] Complete OAuth flow with test Google account
- [ ] Token is passed to frontend correctly
- [ ] User can access protected routes with OAuth token
- [ ] Profile picture is saved and accessible
- [ ] Account linking works (local → Google)

### Frontend Tests (After Implementation)
- [ ] Google button triggers OAuth flow
- [ ] Callback page extracts and saves token
- [ ] User is redirected to correct page after auth
- [ ] Error messages display correctly
- [ ] Loading states work properly

## Production Deployment

### Update Environment Variables
```env
# Production values
GOOGLE_CALLBACK_URL=https://api.yourapp.com/api/auth/google/callback
FRONTEND_URL=https://yourapp.com
API_BASE_URL=https://api.yourapp.com
```

### Update Google Cloud Console
1. Add production redirect URI
2. Add production authorized origins
3. Consider separate OAuth credentials for production

### Monitoring
- Log all OAuth attempts
- Track success/failure rates
- Monitor token generation
- Alert on unusual patterns

---

**Implementation Status**: ✅ Backend Complete
**Next Step**: Frontend Integration

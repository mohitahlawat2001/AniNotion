# Google OAuth2 Implementation - Quick Start Guide

## ✅ Backend Implementation Complete

The backend has been successfully configured with Google OAuth2 authentication!

## 🔑 What Was Implemented

### 1. **Packages Installed**
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth2 strategy
- `googleapis` - Google API client

### 2. **Files Created/Modified**

#### New Files:
- `config/passport.js` - Passport.js configuration with Google strategy
- `docs/GOOGLE_OAUTH_API.md` - Complete API documentation
- `scripts/check-oauth.sh` - OAuth setup verification script

#### Modified Files:
- `models/User.js` - Added OAuth fields (googleId, profilePicture, authProvider)
- `routes/auth.js` - Added 3 new OAuth endpoints
- `server.js` - Integrated Passport middleware
- `.env` - Added Google OAuth credentials
- `.env.example` - Added OAuth configuration template

### 3. **Database Schema Updates**

User model now includes:
```javascript
{
  googleId: String,          // Google's unique user ID
  profilePicture: String,    // User's Google profile picture URL
  authProvider: String,      // 'local' or 'google'
  passwordHash: String,      // Now optional for OAuth users
}
```

### 4. **New API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google/url` | GET | Returns OAuth URL for frontend |
| `/api/auth/google` | GET | Initiates Google OAuth flow |
| `/api/auth/google/callback` | GET | Handles OAuth callback |

## 🚀 How It Works

### User Flow

1. **User clicks "Sign in with Google"** on frontend
2. **Frontend redirects** to `/api/auth/google`
3. **User authenticates** with Google
4. **Google redirects back** to `/api/auth/google/callback`
5. **Backend processes OAuth**:
   - Finds or creates user
   - Links account if email exists
   - Generates JWT token
6. **Backend redirects** to frontend with token: `{FRONTEND_URL}/auth/callback?token={JWT}`
7. **Frontend saves token** and logs user in

### Account Types

**New Google User:**
- Creates new account automatically
- No password required
- Profile picture from Google
- Default role: 'viewer'

**Existing Email/Password User:**
- Automatically links Google account
- Can use either login method
- Keeps existing role and data

## 🔧 Configuration

### Environment Variables (Already Set)

```env
# In your .env file:
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### Google Cloud Console Setup Required

⚠️ **Important**: Configure authorized redirect URIs in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** > **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add to **Authorized redirect URIs**:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - Add production URL when deploying

## 🧪 Testing the Implementation

### Test Locally

1. **Start your backend server:**
   ```bash
   cd /workspaces/AniNotion/aninotion-backend
   npm start
   ```

2. **Test OAuth URL endpoint:**
   ```bash
   curl http://localhost:5000/api/auth/google/url
   ```

3. **Test full OAuth flow:**
   - Open browser: `http://localhost:5000/api/auth/google`
   - Sign in with Google
   - Check redirect to frontend with token

### Verify Setup

Run the verification script:
```bash
./scripts/check-oauth.sh
```

## 📱 Frontend Integration (Next Step)

### React Example - Login Button

```jsx
const GoogleAuthButton = () => {
  const handleLogin = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <button onClick={handleLogin} className="google-btn">
      <img src="/google-icon.svg" alt="" />
      Continue with Google
    </button>
  );
};
```

### Auth Callback Handler

Create route at `/auth/callback`:

```jsx
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('authToken', token);
      navigate('/dashboard');
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate]);

  return <div>Authenticating...</div>;
};
```

## 🔒 Security Features

✅ **JWT Token Authentication** - 7-day expiration
✅ **Account Linking** - Secure email-based linking
✅ **Profile Verification** - Email required from Google
✅ **Role-Based Access** - Maintains existing RBAC system
✅ **Audit Logging** - All OAuth events logged

## 📊 Database Changes

The User schema is backward compatible:
- Existing users: Work normally
- New OAuth users: passwordHash not required
- Account linking: Happens automatically

**No migration needed** - schema changes are additive only.

## 🐛 Troubleshooting

### "redirect_uri_mismatch" error
- **Cause**: Mismatch between .env and Google Console
- **Fix**: Update redirect URI in Google Cloud Console

### Token not passed to frontend
- **Cause**: FRONTEND_URL not set correctly
- **Fix**: Check `.env` file for correct frontend URL

### User created but no profile picture
- **Cause**: Google account has no profile picture
- **Fix**: This is normal, field will be null

### OAuth callback fails silently
- **Cause**: Missing scopes or permissions
- **Fix**: Check Passport config requests 'profile' and 'email' scopes

## 📚 Documentation

Complete documentation: `docs/GOOGLE_OAUTH_API.md`

Includes:
- Detailed API reference
- Frontend implementation examples
- Security best practices
- Error handling guide
- Production deployment tips

## ✨ Features

✅ **Sign up with Google** - One-click account creation
✅ **Login with Google** - Passwordless authentication
✅ **Account linking** - Connect Google to existing accounts
✅ **Profile sync** - Automatic profile picture import
✅ **Secure tokens** - JWT-based session management
✅ **Flexible auth** - Works alongside email/password auth

## 🚀 Next Steps

1. ✅ Backend OAuth implemented
2. ⏭️ Update frontend login page
3. ⏭️ Add Google sign-in button
4. ⏭️ Create auth callback page
5. ⏭️ Test complete flow
6. ⏭️ Deploy to production
7. ⏭️ Update production redirect URLs

## 📞 Support

For issues or questions:
- Check: `docs/GOOGLE_OAUTH_API.md`
- Review: Google OAuth logs in console
- Debug: Check browser network tab for redirect URLs

---

**Status**: ✅ Backend Implementation Complete
**Ready for**: Frontend Integration

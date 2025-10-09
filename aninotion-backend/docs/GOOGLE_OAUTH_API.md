# Google OAuth2 Authentication API Documentation

## Overview

This API implements Google OAuth2 authentication for user sign-up and login. Users can authenticate using their Google account, which creates or links their account automatically.

## Features

- **Sign Up with Google**: New users can create an account using their Google credentials
- **Login with Google**: Existing users can log in using their Google account
- **Account Linking**: If a user signs up with email/password first, they can later link their Google account
- **Automatic Profile Picture**: User's Google profile picture is automatically saved
- **JWT Token Generation**: After successful OAuth, a JWT token is generated for API access

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000

# API Base URL (for OAuth URL generation)
API_BASE_URL=http://localhost:5000
```

### Production Configuration

For production (e.g., deployed on Render, Vercel, etc.):

```env
GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/auth/google/callback
FRONTEND_URL=https://your-frontend-domain.com
API_BASE_URL=https://your-api-domain.com
```

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Configure:
   - **Authorized JavaScript origins**: 
     - `http://localhost:5000` (development)
     - `https://your-api-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback` (development)
     - `https://your-api-domain.com/api/auth/google/callback` (production)

7. Copy the **Client ID** and **Client Secret** to your `.env` file

### 2. Enable Google+ API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "People API"
3. Click **Enable**

## API Endpoints

### 1. Get Google OAuth URL

**Endpoint**: `GET /api/auth/google/url`

**Description**: Returns the Google OAuth URL that the frontend should redirect to.

**Response**:
```json
{
  "url": "http://localhost:5000/api/auth/google",
  "message": "Redirect user to this URL to initiate Google OAuth"
}
```

**Frontend Usage**:
```javascript
// Fetch the OAuth URL
const response = await fetch('http://localhost:5000/api/auth/google/url');
const { url } = await response.json();

// Redirect user to Google OAuth
window.location.href = url;
```

### 2. Initiate Google OAuth Flow

**Endpoint**: `GET /api/auth/google`

**Description**: Redirects user to Google's OAuth consent screen.

**Usage**: User should be redirected to this URL to start the authentication process.

```html
<!-- Simple link approach -->
<a href="http://localhost:5000/api/auth/google">
  Sign in with Google
</a>

<!-- Or using JavaScript -->
<button onclick="window.location.href='http://localhost:5000/api/auth/google'">
  Sign in with Google
</button>
```

### 3. Google OAuth Callback

**Endpoint**: `GET /api/auth/google/callback`

**Description**: Google redirects here after user grants permission. This endpoint is handled automatically by Passport.js.

**Flow**:
1. User grants permission on Google's page
2. Google redirects to this callback URL
3. Backend verifies the OAuth code
4. Creates or finds user in database
5. Generates JWT token
6. Redirects to frontend with token

**Success Redirect**: 
```
{FRONTEND_URL}/auth/callback?token={JWT_TOKEN}
```

**Error Redirect**: 
```
{FRONTEND_URL}/login?error=oauth_failed
```

## User Model Changes

The User model has been updated to support OAuth authentication:

```javascript
{
  email: String,           // User's email (from Google)
  name: String,            // User's display name
  passwordHash: String,    // Optional (not required for OAuth users)
  googleId: String,        // Google's unique user ID
  profilePicture: String,  // Google profile picture URL
  authProvider: String,    // 'local' or 'google'
  role: String,            // 'admin', 'editor', 'viewer'
  status: String,          // 'active', 'disabled', 'deleted'
  lastLoginAt: Date,       // Last login timestamp
  // ... other fields
}
```

## Authentication Flow

### New User Sign Up with Google

1. User clicks "Sign in with Google" button
2. Frontend redirects to `/api/auth/google`
3. User signs in with Google and grants permissions
4. Backend receives user profile from Google
5. Backend creates new user:
   - `googleId`: Set from Google profile
   - `email`: Set from Google profile
   - `name`: Set from Google display name
   - `profilePicture`: Set from Google profile picture
   - `authProvider`: Set to 'google'
   - `role`: Default to 'viewer'
   - `passwordHash`: Not required
6. Backend generates JWT token
7. Backend redirects to frontend with token
8. Frontend saves token and logs user in

### Existing User Login with Google

1. User with Google account clicks "Sign in with Google"
2. Backend finds user by `googleId`
3. Updates `lastLoginAt`
4. Generates JWT token
5. Redirects to frontend with token

### Account Linking (Local to Google)

If a user previously created an account with email/password:

1. User signs in with Google using the same email
2. Backend finds existing user by email
3. Backend links Google account:
   - Sets `googleId`
   - Updates `authProvider` to 'google'
   - Adds `profilePicture` if not set
4. User can now sign in with either method

## Frontend Implementation

### React Example

```jsx
import React from 'react';

const GoogleAuthButton = () => {
  const handleGoogleLogin = () => {
    // Direct redirect approach
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <button 
      onClick={handleGoogleLogin}
      className="google-auth-button"
    >
      <img src="/google-icon.svg" alt="Google" />
      Sign in with Google
    </button>
  );
};

export default GoogleAuthButton;
```

### Callback Handler

Create a callback page at `/auth/callback`:

```jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // Save token to localStorage or context
      localStorage.setItem('authToken', token);
      
      // Fetch user data with the token
      fetchUserData(token).then(() => {
        // Redirect to dashboard or home
        navigate('/dashboard');
      });
    } else if (error) {
      // Handle error
      console.error('OAuth error:', error);
      navigate('/login?error=' + error);
    }
  }, [searchParams, navigate]);

  return <div>Authenticating...</div>;
};

async function fetchUserData(token) {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const user = await response.json();
  // Save user data to state/context
  return user;
}

export default AuthCallback;
```

## Security Considerations

### 1. JWT Token Security
- Tokens are generated with expiration (default: 7 days)
- Store tokens securely in localStorage or httpOnly cookies
- Always use HTTPS in production

### 2. OAuth Configuration
- Keep `GOOGLE_CLIENT_SECRET` secure and never expose it to frontend
- Use environment variables for all sensitive data
- Whitelist redirect URLs in Google Cloud Console

### 3. User Data
- Only request necessary scopes (profile, email)
- User profile pictures are URLs, not stored locally
- Account linking is automatic based on email match

## Error Handling

### Common Errors

1. **"No email provided by Google"**
   - User denied email permission
   - Solution: Request email scope explicitly

2. **OAuth failed redirect**
   - Invalid client ID/secret
   - Misconfigured redirect URI
   - Check Google Cloud Console settings

3. **Account disabled**
   - User account status is 'disabled'
   - Contact admin to reactivate

## Testing

### Test OAuth Flow

1. Start backend: `npm start`
2. Navigate to: `http://localhost:5000/api/auth/google`
3. Sign in with Google test account
4. Check redirect to frontend with token
5. Verify user created in database

### Test API Endpoint

```bash
# Get OAuth URL
curl http://localhost:5000/api/auth/google/url

# Expected Response:
{
  "url": "http://localhost:5000/api/auth/google",
  "message": "Redirect user to this URL to initiate Google OAuth"
}
```

## Migration from Local Auth

Existing users with email/password accounts can seamlessly add Google authentication:

1. User signs in with Google using the same email
2. Backend automatically links accounts
3. User can now use either authentication method
4. Original password still works for login

## Troubleshooting

### Issue: "redirect_uri_mismatch" error

**Solution**: 
- Verify redirect URI in `.env` matches Google Cloud Console
- Check for trailing slashes
- Ensure protocol (http/https) matches

### Issue: User created but no profile picture

**Solution**: 
- Check Google account has a profile picture set
- Verify `profile` scope is requested
- Check network logs for Google API response

### Issue: Token not being passed to frontend

**Solution**:
- Check `FRONTEND_URL` is set correctly in `.env`
- Verify frontend callback route exists
- Check browser console for redirect errors

## API Reference Summary

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/google/url` | GET | No | Get OAuth URL |
| `/api/auth/google` | GET | No | Start OAuth flow |
| `/api/auth/google/callback` | GET | No | OAuth callback (automatic) |

## Next Steps

After implementing the backend:

1. ✅ Backend OAuth routes configured
2. ⏭️ Frontend: Add "Sign in with Google" button
3. ⏭️ Frontend: Create auth callback handler
4. ⏭️ Frontend: Update login/signup pages
5. ⏭️ Test complete OAuth flow
6. ⏭️ Deploy and update redirect URLs for production

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

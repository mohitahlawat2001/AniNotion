# Google Cloud Console Configuration Guide

## Step-by-Step Setup Instructions

### Prerequisites
- Google Account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## Part 1: Create Google Cloud Project

### 1. Create New Project

1. Go to https://console.cloud.google.com/
2. Click on the project dropdown (top left, next to "Google Cloud")
3. Click **"New Project"**
4. Enter project details:
   - **Project Name**: `AniNotion` (or your app name)
   - **Organization**: Leave default or select your org
5. Click **"Create"**
6. Wait for project creation (takes a few seconds)
7. Select your new project from the dropdown

---

## Part 2: Configure OAuth Consent Screen

### 2. Set Up OAuth Consent Screen

1. In the left sidebar, navigate to:
   ```
   APIs & Services → OAuth consent screen
   ```

2. Choose **User Type**:
   - **External** - For any Google user (recommended for testing)
   - **Internal** - Only for Google Workspace users
   - Click **"Create"**

3. **Configure OAuth Consent Screen**:

   **App Information**:
   - **App name**: `AniNotion`
   - **User support email**: Your email
   - **App logo**: (Optional) Upload your app logo

   **App Domain**:
   - **Application home page**: `https://yourapp.com` or `http://localhost:3000`
   - **Application privacy policy**: Your privacy policy URL
   - **Application terms of service**: Your terms URL

   **Developer Contact Information**:
   - **Email addresses**: Your email

4. Click **"Save and Continue"**

5. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - Select these scopes:
     - ✅ `./auth/userinfo.email`
     - ✅ `./auth/userinfo.profile`
     - ✅ `openid`
   - Click **"Update"**
   - Click **"Save and Continue"**

6. **Test Users** (Step 3):
   - While in development, add test users:
   - Click **"Add Users"**
   - Enter email addresses of people who can test
   - Click **"Add"**
   - Click **"Save and Continue"**

7. **Summary** (Step 4):
   - Review your settings
   - Click **"Back to Dashboard"**

---

## Part 3: Create OAuth 2.0 Credentials

### 3. Create OAuth Client ID

1. In the left sidebar, navigate to:
   ```
   APIs & Services → Credentials
   ```

2. Click **"+ Create Credentials"** (top of page)

3. Select **"OAuth client ID"**

4. Choose **Application Type**:
   - Select: **"Web application"**

5. Configure OAuth Client:

   **Name**:
   ```
   AniNotion Web Client
   ```

   **Authorized JavaScript origins**:
   ```
   http://localhost:5000
   http://localhost:3000
   ```
   *(Add production URLs later)*

   **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
   *(Add production URL later)*

6. Click **"Create"**

7. **Save Your Credentials**:
   - A popup appears with:
     - **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
     - **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET`
   - Click **"Download JSON"** (optional, for backup)
   - Click **"OK"**

8. **Copy to .env file**:
   ```env
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
   ```

---

## Part 4: Enable Required APIs

### 4. Enable Google+ API

1. In the left sidebar, navigate to:
   ```
   APIs & Services → Library
   ```

2. Search for: **"Google+ API"** or **"People API"**

3. Click on the API

4. Click **"Enable"**

5. Wait for activation (takes a few seconds)

---

## Part 5: Verify Configuration

### 5. Test Your Setup

1. **Check OAuth Consent Screen**:
   ```
   APIs & Services → OAuth consent screen
   ```
   - Status should be: "Testing" or "Published"
   - Make sure test users are added if in "Testing"

2. **Check Credentials**:
   ```
   APIs & Services → Credentials
   ```
   - Your OAuth 2.0 Client ID should be listed
   - Redirect URIs should match your `.env` file

3. **Test OAuth Flow**:
   - Start your backend server
   - Open: http://localhost:5000/api/auth/google
   - You should be redirected to Google sign-in

---

## Configuration Summary

### ✅ Completed Setup

| Item | Status | Value |
|------|--------|-------|
| Project Created | ✅ | AniNotion |
| OAuth Consent Screen | ✅ | External, Testing |
| Scopes Configured | ✅ | email, profile, openid |
| OAuth Client ID | ✅ | 186552104761-... |
| Client Secret | ✅ | GOCSPX-... |
| Redirect URI | ✅ | /api/auth/google/callback |
| Google+ API | ✅ | Enabled |

---

## Common Configuration Issues

### Issue 1: "redirect_uri_mismatch"

**Error Message**:
```
Error 400: redirect_uri_mismatch
The redirect URI in the request: http://localhost:5000/api/auth/google/callback
does not match the ones authorized for the OAuth client.
```

**Solution**:
1. Go to: **APIs & Services → Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", verify:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
4. Make sure there are no:
   - Extra spaces
   - Trailing slashes
   - Protocol mismatches (http vs https)
5. Click **"Save"**
6. Wait 5 minutes for changes to propagate

### Issue 2: "Access blocked: This app's request is invalid"

**Error Message**:
```
Access blocked: This app's request is invalid
You can't sign in because this app sent an invalid request.
```

**Possible Causes**:
1. OAuth consent screen not configured
2. Missing required scopes
3. Invalid client ID or secret

**Solution**:
1. Complete OAuth consent screen configuration
2. Add required scopes (email, profile)
3. Verify client ID in `.env` matches Google Console

### Issue 3: "This app isn't verified"

**Warning Screen**:
```
This app isn't verified
This app hasn't been verified by Google yet.
```

**This is normal during development!**

**Options**:
1. **For Testing**: Click "Advanced" → "Go to [Your App] (unsafe)"
2. **For Production**: Submit app for verification (takes 4-6 weeks)

**Development Workaround**:
- Add test users to OAuth consent screen
- Test users can access without verification warning

### Issue 4: "Account has not been granted access"

**Error Message**:
```
Access blocked: [email] has not been granted access to this app
```

**Solution**:
1. Go to: **APIs & Services → OAuth consent screen**
2. Scroll to "Test users"
3. Click **"Add Users"**
4. Add the email address
5. Click **"Save"**

---

## Production Deployment Changes

### When Deploying to Production

1. **Update Authorized Origins**:
   ```
   https://api.yourapp.com
   https://yourapp.com
   ```

2. **Update Redirect URIs**:
   ```
   https://api.yourapp.com/api/auth/google/callback
   ```

3. **Update .env**:
   ```env
   GOOGLE_CALLBACK_URL=https://api.yourapp.com/api/auth/google/callback
   FRONTEND_URL=https://yourapp.com
   API_BASE_URL=https://api.yourapp.com
   ```

4. **Consider Verification**:
   - If your app will have many users
   - Submit for Google verification
   - Process: **APIs & Services → OAuth consent screen → Publish App**

5. **Use Separate Credentials** (Recommended):
   - Create separate OAuth client for production
   - Keep development and production credentials separate

---

## Security Best Practices

### ✅ Do's
- ✅ Keep client secret in `.env` file
- ✅ Never commit `.env` to Git
- ✅ Use different credentials for dev/prod
- ✅ Regularly rotate client secrets
- ✅ Monitor OAuth usage in Google Console

### ❌ Don'ts
- ❌ Don't expose client secret in frontend
- ❌ Don't share credentials publicly
- ❌ Don't use production creds in development
- ❌ Don't disable security warnings without understanding

---

## Monitoring and Analytics

### View OAuth Statistics

1. Go to: **APIs & Services → Dashboard**
2. View:
   - API requests per day
   - Quota usage
   - Error rates

### OAuth Consent Screen Analytics

1. Go to: **APIs & Services → OAuth consent screen**
2. View:
   - Number of users
   - Consent rates
   - Verification status

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Consent Screen Guide](https://support.google.com/cloud/answer/10311615)

---

## Quick Reference

### Your Configuration (Current)

```
Project: AniNotion (or similar)
Client ID: YOUR_GOOGLE_CLIENT_ID
Client Secret: YOUR_GOOGLE_CLIENT_SECRET
Callback URL: http://localhost:5000/api/auth/google/callback
Scopes: email, profile, openid
Status: Testing Mode
```

### Test URL

After configuration, test here:
```
http://localhost:5000/api/auth/google
```

---

**Configuration Status**: ✅ Complete
**Next Step**: Test OAuth Flow

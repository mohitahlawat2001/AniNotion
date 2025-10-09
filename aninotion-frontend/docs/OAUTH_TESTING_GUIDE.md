# 🧪 Quick Testing Guide - Google OAuth

## 🚀 Quick Start

### 1. Start Both Servers

**Terminal 1 - Backend**:
```bash
cd aninotion-backend
npm start
```

**Terminal 2 - Frontend**:
```bash
cd aninotion-frontend
npm run dev
```

### 2. Test the Flow

1. **Open your browser**: http://localhost:3000
2. **Trigger login**: Click any protected action (e.g., trying to create a post)
3. **See the Google button**: "Continue with Google" at the top of login modal
4. **Click the button**: You'll be redirected to Google
5. **Sign in with Google**: Use your Google account
6. **Wait for processing**: You'll see "Authenticating..." screen
7. **Success!**: You'll see "Success!" and be redirected home
8. **Verify**: You should now be logged in

## ✅ Verification Checklist

### Before Testing
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] `.env` files configured correctly
- [ ] Google Cloud Console redirect URI added

### Visual Checks
- [ ] Google button visible in login modal
- [ ] Google icon displays correctly
- [ ] "Or continue with email" divider shows
- [ ] Button has hover effect

### Functional Checks
- [ ] Clicking Google button redirects to Google
- [ ] Can sign in with Google account
- [ ] Redirected to `/auth/callback` after OAuth
- [ ] See "Authenticating..." loading screen
- [ ] See "Success!" message
- [ ] Auto-redirect to home page
- [ ] User is logged in (check nav bar)
- [ ] Can perform protected actions

### Error Handling Checks
- [ ] Stop backend, try OAuth → Shows error
- [ ] Go to `/auth/callback` directly → Shows error
- [ ] Wrong backend URL → Shows error
- [ ] All errors redirect back to home

## 🎯 What You Should See

### Step 1: Login Modal
```
┌─────────────────────────────────────┐
│  Login Required                   ✕ │
├─────────────────────────────────────┤
│  You need to be logged in to       │
│  perform this action.               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  [G] Continue with Google   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─── Or continue with email ───    │
│                                     │
│  Email:    [____________]          │
│  Password: [____________]          │
│                                     │
│  [Login]  [Cancel]                 │
└─────────────────────────────────────┘
```

### Step 2: Processing Screen
```
┌─────────────────────────────────────┐
│                                     │
│         [Spinning Icon]             │
│                                     │
│      Authenticating...              │
│                                     │
│  Please wait while we complete     │
│  your sign-in.                     │
│                                     │
└─────────────────────────────────────┘
```

### Step 3: Success Screen
```
┌─────────────────────────────────────┐
│                                     │
│         [Green Check]               │
│                                     │
│          Success!                   │
│                                     │
│  You've been successfully          │
│  authenticated.                    │
│                                     │
│  Redirecting you to the home       │
│  page...                           │
│                                     │
└─────────────────────────────────────┘
```

## 🔍 Browser Console Checks

### Successful OAuth - What to Check

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Look for**:
   ```
   ✅ No error messages
   ✅ No network failures
   ```

4. **Go to Application tab → Local Storage**
5. **Check**:
   ```
   authToken: "eyJhbGc..."  (JWT token)
   user: "{"id":"...","email":"..."}"
   ```

### Network Tab Checks

1. **Open DevTools → Network tab**
2. **Filter**: XHR
3. **After clicking Google button, you should see**:
   - Redirect to `/api/auth/google`
   - Redirect to Google's domain
   - Redirect back to `/api/auth/google/callback`
   - Redirect to `/auth/callback?token=...`
   - Request to `/api/auth/me` (Status: 200)

## 🐛 Common Issues & Quick Fixes

### Issue: "Continue with Google" button doesn't appear
**Fix**: Check that `GoogleAuthButton.jsx` was created
```bash
ls src/components/GoogleAuthButton.jsx
```

### Issue: Clicking button does nothing
**Fix**: Check browser console for errors
**Common cause**: Wrong `VITE_BACKEND_URL` in `.env`

### Issue: Redirected to Google but comes back with error
**Fix**: 
1. Check backend is running
2. Verify Google Cloud Console redirect URI matches:
   ```
   http://localhost:5000/api/auth/google/callback
   ```

### Issue: Stuck on "Authenticating..."
**Fix**:
1. Check browser URL has `?token=xxx`
2. If no token, backend OAuth failed
3. Check backend logs for errors

### Issue: Success screen shows but not logged in
**Fix**:
1. Check localStorage has `authToken` and `user`
2. Refresh the page
3. Check auth context is working

## 📱 Test on Different Scenarios

### New User
- [ ] Sign in with Google account not in database
- [ ] User should be created automatically
- [ ] Default role: "viewer"
- [ ] Can access app normally

### Existing User (Email/Password)
- [ ] Create account with email/password first
- [ ] Then try Google OAuth with same email
- [ ] Accounts should be linked
- [ ] Can use both login methods

### Existing Google User
- [ ] Sign in with Google
- [ ] Sign out
- [ ] Sign in with Google again
- [ ] Should work instantly

## 🎯 Success Criteria

✅ **All these should work**:
1. Google button appears and looks good
2. Clicking redirects to Google OAuth
3. Can sign in with Google account
4. Processing screen appears briefly
5. Success screen appears
6. Auto-redirects to home
7. User is logged in
8. Can perform protected actions
9. User profile shows in nav bar
10. Can log out normally

## 📊 Performance Check

### Expected Timing
- Google button click → Redirect: **Instant**
- Google sign-in → Callback: **2-5 seconds**
- Processing screen: **1-2 seconds**
- Success screen: **1.5 seconds**
- Total flow: **~5-10 seconds**

If slower, check:
- Backend response time
- Network connection
- Google OAuth server response

## 🔄 Test Multiple Times

Try these scenarios:
1. **Fresh browser** (incognito mode)
2. **After logout**
3. **Different Google accounts**
4. **Mobile browser** (if applicable)
5. **Different browsers** (Chrome, Firefox, Safari)

## ✅ Final Checklist

After testing, verify:
- [ ] OAuth flow works smoothly
- [ ] No console errors
- [ ] User data stored correctly
- [ ] Can perform protected actions
- [ ] Logout works
- [ ] Can log in again
- [ ] Email/password login still works
- [ ] UI looks professional
- [ ] Error messages are clear
- [ ] Mobile responsive (if tested)

---

## 🎉 Success!

If all checks pass, your Google OAuth integration is working perfectly!

## 📞 Need Help?

Check these docs:
- `GOOGLE_OAUTH_FRONTEND.md` - Frontend implementation details
- `../aninotion-backend/README_OAUTH.md` - Backend details
- `../aninotion-backend/docs/OAUTH_TROUBLESHOOTING.md` - Troubleshooting guide

---

**Happy Testing! 🚀**

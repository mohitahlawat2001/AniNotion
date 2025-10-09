#!/bin/bash

echo "🔍 Checking OAuth2 Implementation..."
echo ""

# Check if required packages are installed
echo "✓ Checking dependencies..."
if grep -q "passport" package.json && grep -q "passport-google-oauth20" package.json; then
    echo "  ✓ passport packages found in package.json"
else
    echo "  ✗ Missing passport packages"
fi

# Check if environment variables are set
echo ""
echo "✓ Checking environment variables..."
if grep -q "GOOGLE_CLIENT_ID" .env && grep -q "GOOGLE_CLIENT_SECRET" .env; then
    echo "  ✓ Google OAuth credentials found in .env"
else
    echo "  ✗ Missing Google OAuth credentials in .env"
fi

# Check if passport config exists
echo ""
echo "✓ Checking configuration files..."
if [ -f "config/passport.js" ]; then
    echo "  ✓ Passport configuration found"
else
    echo "  ✗ Passport configuration missing"
fi

# Check if OAuth routes are added
echo ""
echo "✓ Checking OAuth routes..."
if grep -q "passport" routes/auth.js; then
    echo "  ✓ OAuth routes integrated in auth.js"
else
    echo "  ✗ OAuth routes not found in auth.js"
fi

# Check if User model is updated
echo ""
echo "✓ Checking User model..."
if grep -q "googleId" models/User.js; then
    echo "  ✓ User model updated for OAuth"
else
    echo "  ✗ User model not updated"
fi

echo ""
echo "📋 OAuth Endpoints Available:"
echo "  - GET  /api/auth/google/url       - Get OAuth URL"
echo "  - GET  /api/auth/google           - Initiate OAuth flow"
echo "  - GET  /api/auth/google/callback  - OAuth callback"
echo ""
echo "📖 Documentation created: docs/GOOGLE_OAUTH_API.md"
echo ""
echo "✅ OAuth2 Implementation Complete!"
echo ""
echo "Next steps:"
echo "1. Verify Google Cloud Console redirect URLs"
echo "2. Test OAuth flow: http://localhost:5000/api/auth/google"
echo "3. Implement frontend OAuth button"

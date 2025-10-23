#!/bin/bash

# SEO Setup Script for AniNotion
# This script installs dependencies and sets up SEO features

echo "🚀 Setting up SEO for AniNotion..."

# Navigate to frontend directory
cd "$(dirname "$0")/aninotion-frontend" || exit

echo "📦 Installing frontend dependencies..."
npm install react-helmet-async --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Check if .env exists, create if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual domain and API URLs"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "✨ SEO Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update aninotion-frontend/.env with your production domain"
echo "2. Update aninotion-backend/.env with FRONTEND_URL"
echo "3. Update robots.txt with your domain"
echo "4. Restart both frontend and backend servers"
echo "5. Test sitemap at: http://localhost:5000/api/sitemap.xml"
echo "6. After deployment, submit sitemap to Google Search Console"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - SEO_QUICK_START.md"
echo "   - SEO_IMPLEMENTATION_GUIDE.md"
echo ""

#!/bin/bash

echo "🧪 Testing Email/Password Signup Feature"
echo "=========================================="
echo ""

# Check if backend is running
echo "1. Checking backend server..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is NOT running"
    echo "   Please start: cd aninotion-backend && npm start"
    exit 1
fi

echo ""
echo "2. Testing signup endpoint..."

# Test signup with curl
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "name": "Test User",
    "password": "password123"
  }')

if echo "$RESPONSE" | grep -q "Account created successfully"; then
    echo "   ✅ Signup endpoint works!"
    echo "   Response: Account created with JWT token"
else
    echo "   ❌ Signup endpoint failed"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "3. Testing validation..."

# Test missing password
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }')

if echo "$RESPONSE" | grep -q "Email and password are required"; then
    echo "   ✅ Missing password validation works"
else
    echo "   ⚠️  Validation check: $RESPONSE"
fi

# Test short password
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123"
  }')

if echo "$RESPONSE" | grep -q "at least 6 characters"; then
    echo "   ✅ Password length validation works"
else
    echo "   ⚠️  Password validation: $RESPONSE"
fi

# Test invalid email
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notanemail",
    "password": "password123"
  }')

if echo "$RESPONSE" | grep -q "valid email"; then
    echo "   ✅ Email format validation works"
else
    echo "   ⚠️  Email validation: $RESPONSE"
fi

echo ""
echo "=========================================="
echo "✅ Backend Signup Tests Complete!"
echo ""
echo "📋 Next: Test Frontend"
echo "   1. Open: http://localhost:3000"
echo "   2. Click protected action"
echo "   3. Click 'Sign up here'"
echo "   4. Fill form and submit"
echo ""

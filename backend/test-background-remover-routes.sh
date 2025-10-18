#!/bin/bash

# Test Background Remover Routes
# This script tests the three routes that were failing in production

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api/background-remover"

echo "=================================="
echo "Testing Background Remover Routes"
echo "=================================="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
curl -s -f "$BASE_URL/health" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Server is not running at $BASE_URL"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Test 1: Subscription endpoint (should return null or subscription data)
echo "2. Testing /api/background-remover/subscription"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/subscription" \
  -H "Authorization: Bearer test-token")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   Status Code: $HTTP_CODE"
echo "   Response: $BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Subscription endpoint working"
else
    echo "   ❌ Subscription endpoint failed with status $HTTP_CODE"
fi
echo ""

# Test 2: Jobs endpoint (should return empty array or jobs)
echo "3. Testing /api/background-remover/jobs"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/jobs" \
  -H "Authorization: Bearer test-token")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   Status Code: $HTTP_CODE"
echo "   Response: $BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Jobs endpoint working"
else
    echo "   ❌ Jobs endpoint failed with status $HTTP_CODE"
fi
echo ""

# Test 3: Stats endpoint (should return stats with zeros)
echo "4. Testing /api/background-remover/stats"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/stats" \
  -H "Authorization: Bearer test-token")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   Status Code: $HTTP_CODE"
echo "   Response: $BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Stats endpoint working"
else
    echo "   ❌ Stats endpoint failed with status $HTTP_CODE"
fi
echo ""

echo "=================================="
echo "Test Summary"
echo "=================================="
echo ""
echo "All routes should return either:"
echo "  - 200 OK with data (if authenticated)"
echo "  - 401 Unauthorized (if not authenticated)"
echo "  - NOT 500 Internal Server Error"
echo ""
echo "If you see 401 errors, that's expected without a valid auth token."
echo "The important thing is that we're NOT seeing 500 errors anymore."

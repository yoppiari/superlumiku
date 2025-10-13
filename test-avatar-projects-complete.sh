#!/bin/bash
# Complete test script for Avatar Projects functionality on dev.lumiku.com
# Run this after deployment completes

echo "🧪 Testing Avatar Creator Projects on dev.lumiku.com"
echo "=================================================="
echo ""

# Step 1: Health check
echo "1️⃣ Testing health endpoint..."
HEALTH=$(curl -s https://dev.lumiku.com/health)
echo "Response: $HEALTH"
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed!"
    exit 1
fi
echo ""

# Step 2: Get auth token (you need to provide this)
echo "2️⃣ Testing authentication..."
echo "⚠️  You need to get your auth token from browser localStorage first!"
echo "   1. Open https://dev.lumiku.com in browser"
echo "   2. Open DevTools (F12)"
echo "   3. Go to Console tab"
echo "   4. Run: localStorage.getItem('token')"
echo "   5. Copy the token and export it:"
echo "      export AUTH_TOKEN='your_token_here'"
echo ""

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ AUTH_TOKEN not set. Please set it first:"
    echo "   export AUTH_TOKEN='your_token_here'"
    echo ""
    echo "For now, testing public endpoints only..."
    echo ""
else
    echo "✅ AUTH_TOKEN is set"
    echo ""
fi

# Step 3: Test GET projects (requires auth)
if [ ! -z "$AUTH_TOKEN" ]; then
    echo "3️⃣ Testing GET /api/apps/avatar-creator/projects..."
    GET_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        https://dev.lumiku.com/api/apps/avatar-creator/projects)

    HTTP_STATUS=$(echo "$GET_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    BODY=$(echo "$GET_RESPONSE" | sed '/HTTP_STATUS:/d')

    echo "Status: $HTTP_STATUS"
    echo "Response: $BODY"

    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ GET projects successful"
    else
        echo "❌ GET projects failed with status $HTTP_STATUS"
    fi
    echo ""

    # Step 4: Test CREATE project
    echo "4️⃣ Testing POST /api/apps/avatar-creator/projects..."
    PROJECT_NAME="Test Project $(date +%s)"

    CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$PROJECT_NAME\",\"description\":\"Automated test from bash script\"}" \
        https://dev.lumiku.com/api/apps/avatar-creator/projects)

    HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    BODY=$(echo "$CREATE_RESPONSE" | sed '/HTTP_STATUS:/d')

    echo "Status: $HTTP_STATUS"
    echo "Response: $BODY"

    if [ "$HTTP_STATUS" = "201" ]; then
        echo "✅ CREATE project successful!"
        echo "🎉 Avatar Creator Projects is working correctly!"

        # Extract project ID for cleanup
        PROJECT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   Created project ID: $PROJECT_ID"
    else
        echo "❌ CREATE project failed with status $HTTP_STATUS"
        echo ""
        echo "🔍 Troubleshooting:"
        echo "   - Check if avatar_projects table exists in database"
        echo "   - Check backend logs in Coolify"
        echo "   - Run SQL migration manually if needed"
    fi
    echo ""
else
    echo "3️⃣ Skipped (AUTH_TOKEN not set)"
    echo "4️⃣ Skipped (AUTH_TOKEN not set)"
    echo ""
fi

# Step 5: Database check (requires psql)
echo "5️⃣ Database table check (optional - requires database access)..."
echo "To check if avatar_projects table exists, run:"
echo "   psql \"\$DATABASE_URL\" -c \"SELECT COUNT(*) FROM avatar_projects;\""
echo ""

echo "=================================================="
echo "Test complete!"
echo ""
echo "Summary:"
echo "- Health check: ✅"
if [ ! -z "$AUTH_TOKEN" ]; then
    echo "- API tests: Check results above"
else
    echo "- API tests: ⏭️  Skipped (need AUTH_TOKEN)"
fi
echo ""
echo "Next steps if tests failed:"
echo "1. Check deployment logs in Coolify"
echo "2. Verify Prisma migration ran during deployment"
echo "3. Run manual SQL migration if needed:"
echo "   psql \"\$DATABASE_URL\" < fix-avatar-projects-table.sql"

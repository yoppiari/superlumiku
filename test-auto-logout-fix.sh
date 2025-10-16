#!/bin/bash

# Test Script for Auto-Logout Bug Fix
# This script helps verify that the login flow works correctly

echo "======================================"
echo "Auto-Logout Bug Fix - Test Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"
TEST_EMAIL="test@lumiku.com"
TEST_PASSWORD="password123"

echo "Configuration:"
echo "  Backend URL: $BACKEND_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Test User: $TEST_EMAIL"
echo ""

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2

    if curl -s -f -o /dev/null "$url/health" || curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✓${NC} $name is running"
        return 0
    else
        echo -e "${RED}✗${NC} $name is NOT running"
        return 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local token=$3
    local expected_status=$4
    local description=$5

    echo -n "  Testing $description... "

    if [ -n "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "$BACKEND_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            "$BACKEND_URL$endpoint")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} ($status_code)"
        return 0
    else
        echo -e "${RED}✗${NC} Expected $expected_status, got $status_code"
        echo "  Response: $body"
        return 1
    fi
}

echo "======================================"
echo "Step 1: Checking Services"
echo "======================================"
echo ""

backend_running=0
frontend_running=0

if check_service "$BACKEND_URL" "Backend"; then
    backend_running=1
fi

if check_service "$FRONTEND_URL" "Frontend"; then
    frontend_running=1
fi

echo ""

if [ $backend_running -eq 0 ]; then
    echo -e "${RED}ERROR: Backend is not running!${NC}"
    echo "Please start the backend with: cd backend && bun run dev"
    exit 1
fi

if [ $frontend_running -eq 0 ]; then
    echo -e "${YELLOW}WARNING: Frontend is not running${NC}"
    echo "Please start the frontend with: cd frontend && npm run dev"
    echo ""
fi

echo "======================================"
echo "Step 2: Testing Login Flow"
echo "======================================"
echo ""

echo "Attempting login..."
login_response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

# Check if login was successful
if echo "$login_response" | grep -q "token"; then
    echo -e "${GREEN}✓${NC} Login successful"

    # Extract token
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

    if [ -n "$token" ]; then
        echo -e "${GREEN}✓${NC} Token extracted: ${token:0:20}..."
    else
        echo -e "${RED}✗${NC} Failed to extract token"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Login failed"
    echo "Response: $login_response"
    exit 1
fi

echo ""

echo "======================================"
echo "Step 3: Testing Protected Endpoints"
echo "======================================"
echo ""

# Test protected endpoints that dashboard would call
test_endpoint "GET" "/api/credits/balance" "$token" "200" "Credit Balance"
test_endpoint "GET" "/api/apps" "$token" "200" "Apps List"
test_endpoint "GET" "/api/stats/dashboard" "$token" "200" "Dashboard Stats"

echo ""

echo "======================================"
echo "Step 4: Testing Token Validity"
echo "======================================"
echo ""

# Test with no token (should get 401)
test_endpoint "GET" "/api/credits/balance" "" "401" "No Token (should fail)"

# Test with invalid token (should get 401)
test_endpoint "GET" "/api/credits/balance" "invalid_token_here" "401" "Invalid Token (should fail)"

echo ""

echo "======================================"
echo "Step 5: Testing Parallel Requests"
echo "======================================"
echo ""
echo "Simulating dashboard's parallel API calls..."

# Make 3 parallel requests like dashboard does
pids=()

curl -s -X GET "$BACKEND_URL/api/credits/balance" \
    -H "Authorization: Bearer $token" \
    -w "\n%{http_code}" > /tmp/test_balance.txt &
pids+=($!)

curl -s -X GET "$BACKEND_URL/api/apps" \
    -H "Authorization: Bearer $token" \
    -w "\n%{http_code}" > /tmp/test_apps.txt &
pids+=($!)

curl -s -X GET "$BACKEND_URL/api/stats/dashboard" \
    -H "Authorization: Bearer $token" \
    -w "\n%{http_code}" > /tmp/test_stats.txt &
pids+=($!)

# Wait for all requests to complete
for pid in "${pids[@]}"; do
    wait $pid
done

# Check results
balance_status=$(tail -n1 /tmp/test_balance.txt)
apps_status=$(tail -n1 /tmp/test_apps.txt)
stats_status=$(tail -n1 /tmp/test_stats.txt)

echo "  Balance endpoint: $balance_status $([ "$balance_status" = "200" ] && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}")"
echo "  Apps endpoint: $apps_status $([ "$apps_status" = "200" ] && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}")"
echo "  Stats endpoint: $stats_status $([ "$stats_status" = "200" ] && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}")"

# Cleanup
rm -f /tmp/test_*.txt

echo ""

echo "======================================"
echo "Test Results Summary"
echo "======================================"
echo ""

all_passed=1

if [ "$balance_status" = "200" ] && [ "$apps_status" = "200" ] && [ "$stats_status" = "200" ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "The auto-logout bug appears to be fixed!"
    echo ""
    echo "Next steps:"
    echo "1. Test manually in browser at $FRONTEND_URL/login"
    echo "2. Open DevTools Network tab"
    echo "3. Login and verify no 401 errors"
    echo "4. Verify you stay logged in on dashboard"
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the following:"
    echo "1. Backend logs for errors"
    echo "2. Token expiration settings"
    echo "3. Database connection"
    all_passed=0
fi

echo ""

exit $all_passed

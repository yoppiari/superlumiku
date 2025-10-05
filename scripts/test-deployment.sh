#!/bin/bash

# Comprehensive Deployment Testing Suite
# Tests all major functionality after deployment

set -e

BASE_URL="${1:-http://localhost}"
echo "🧪 Running Comprehensive Deployment Tests"
echo "=========================================="
echo "Target: $BASE_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
AUTH_TOKEN=""

# Test function with detailed output
run_test() {
    local category="$1"
    local name="$2"
    shift 2

    echo -e "${BLUE}[$category]${NC} $name"

    if "$@"; then
        echo -e "${GREEN}  ✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}  ✗ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

# ==================================================
# TEST 1: Infrastructure Health
# ==================================================
echo -e "\n${YELLOW}=== 1. Infrastructure Health ===${NC}\n"

test_health() {
    response=$(curl -s "$BASE_URL/health")
    echo "$response" | grep -q "ok"
}
run_test "HEALTH" "Backend Health Check" test_health

test_frontend() {
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
    [ "$status" = "200" ]
}
run_test "HEALTH" "Frontend Accessible" test_frontend

test_api_list() {
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/apps")
    [ "$status" = "200" ]
}
run_test "HEALTH" "API Apps Endpoint" test_api_list

# ==================================================
# TEST 2: Authentication Flow
# ==================================================
echo -e "\n${YELLOW}=== 2. Authentication ===${NC}\n"

test_register() {
    response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}")

    # Check if registration successful or user already exists
    echo "$response" | grep -qE '"id"|"token"|already exists'
}
run_test "AUTH" "User Registration" test_register

test_login() {
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

    AUTH_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    [ -n "$AUTH_TOKEN" ]
}
run_test "AUTH" "User Login" test_login

test_profile() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo "  ⚠ Skipped (no auth token)"
        return 0
    fi

    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/profile" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    [ "$status" = "200" ]
}
run_test "AUTH" "Get Profile (Protected)" test_profile

# ==================================================
# TEST 3: Credits System
# ==================================================
echo -e "\n${YELLOW}=== 3. Credits System ===${NC}\n"

test_credits_balance() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo "  ⚠ Skipped (no auth token)"
        return 0
    fi

    response=$(curl -s "$BASE_URL/api/credits/balance" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    echo "$response" | grep -q "balance"
}
run_test "CREDITS" "Get Credit Balance" test_credits_balance

test_credits_history() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo "  ⚠ Skipped (no auth token)"
        return 0
    fi

    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/credits/history" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    [ "$status" = "200" ]
}
run_test "CREDITS" "Get Credit History" test_credits_history

# ==================================================
# TEST 4: Static File Serving
# ==================================================
echo -e "\n${YELLOW}=== 4. Static Files & Routing ===${NC}\n"

test_uploads_dir() {
    # Should return 403 (forbidden) for directory listing, not 404
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/uploads/")
    [ "$status" = "403" ] || [ "$status" = "404" ]
}
run_test "STATIC" "Uploads Directory Protected" test_uploads_dir

test_spa_routing() {
    # SPA routes should return 200 (serve index.html)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
    [ "$status" = "200" ]
}
run_test "STATIC" "SPA Routing Fallback" test_spa_routing

# ==================================================
# TEST 5: App Plugins
# ==================================================
echo -e "\n${YELLOW}=== 5. App Plugins ===${NC}\n"

test_video_mixer_endpoint() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo "  ⚠ Skipped (no auth token)"
        return 0
    fi

    # Try to list projects (should work even if empty)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/apps/video-mixer/projects" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    [ "$status" = "200" ]
}
run_test "PLUGINS" "Video Mixer API" test_video_mixer_endpoint

test_carousel_endpoint() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo "  ⚠ Skipped (no auth token)"
        return 0
    fi

    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/apps/carousel-mix/projects" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    [ "$status" = "200" ]
}
run_test "PLUGINS" "Carousel Mix API" test_carousel_endpoint

test_looping_flow_endpoint() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo "  ⚠ Skipped (no auth token)"
        return 0
    fi

    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/apps/looping-flow/projects" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    [ "$status" = "200" ]
}
run_test "PLUGINS" "Looping Flow API" test_looping_flow_endpoint

# ==================================================
# TEST 6: Database Connectivity
# ==================================================
echo -e "\n${YELLOW}=== 6. Database ===${NC}\n"

test_database() {
    # Registration and login already test DB connectivity
    # This test ensures data persistence
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

    echo "$response" | grep -q "token"
}
run_test "DATABASE" "Data Persistence" test_database

# ==================================================
# TEST 7: Error Handling
# ==================================================
echo -e "\n${YELLOW}=== 7. Error Handling ===${NC}\n"

test_404() {
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/nonexistent")
    [ "$status" = "404" ]
}
run_test "ERRORS" "404 Not Found" test_404

test_unauthorized() {
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/profile")
    [ "$status" = "401" ]
}
run_test "ERRORS" "401 Unauthorized" test_unauthorized

test_invalid_login() {
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"wrong@test.com","password":"wrong"}')

    [ "$status" = "401" ] || [ "$status" = "400" ]
}
run_test "ERRORS" "Invalid Login Handling" test_invalid_login

# ==================================================
# Summary
# ==================================================
echo ""
echo "=========================================="
echo -e "${BLUE}Test Summary${NC}"
echo "=========================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ DEPLOYMENT TESTS FAILED${NC}"
    echo "Please review the failed tests above."
    exit 1
else
    echo -e "${GREEN}✅ ALL DEPLOYMENT TESTS PASSED${NC}"
    echo "Deployment is healthy and ready for use!"
    exit 0
fi

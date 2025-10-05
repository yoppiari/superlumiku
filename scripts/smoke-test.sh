#!/bin/bash

# Smoke Test - Quick sanity check for deployment
# Run this after deployment to verify basic functionality

set -e

BASE_URL="${1:-http://localhost}"
echo "🧪 Running Smoke Tests on $BASE_URL"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"

    echo -n "Testing $name... "

    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $status)"
        ((FAILED++))
        return 1
    fi
}

# Test with JSON data
test_post_json() {
    local name="$1"
    local url="$2"
    local data="$3"
    local expected_status="${4:-200}"

    echo -n "Testing $name... "

    status=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url" || echo "000")

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $status)"
        ((FAILED++))
        return 1
    fi
}

echo ""
echo "1. Frontend & Static Files"
echo "----------------------------"
test_endpoint "Homepage" "$BASE_URL/"
test_endpoint "Static Assets (check if SPA loads)" "$BASE_URL/" 200

echo ""
echo "2. Backend Health"
echo "----------------------------"
test_endpoint "Health Check" "$BASE_URL/health"
test_endpoint "API Base" "$BASE_URL/api/apps"

echo ""
echo "3. Authentication Endpoints"
echo "----------------------------"
test_post_json "Register Endpoint" "$BASE_URL/api/auth/register" \
    '{"email":"test@example.com","password":"test123"}' "400|201|409"

echo ""
echo "4. Static File Serving"
echo "----------------------------"
test_endpoint "Uploads Directory" "$BASE_URL/uploads/" 403
test_endpoint "Outputs Directory" "$BASE_URL/outputs/" 403

echo ""
echo "========================================"
echo -e "Results: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Smoke tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All smoke tests PASSED${NC}"
    exit 0
fi

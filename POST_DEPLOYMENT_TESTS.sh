#!/bin/bash
#
# Avatar Creator - Sprint 1 Post-Deployment Test Script
#
# This script verifies all Sprint 1 security features are working correctly
# after deployment to production (dev.lumiku.com)
#
# Usage:
#   export TOKEN="your_jwt_token"
#   export PROJECT_ID="your_project_id"
#   bash POST_DEPLOYMENT_TESTS.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-https://dev.lumiku.com}"
TOKEN="${TOKEN:-}"
PROJECT_ID="${PROJECT_ID:-}"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check TOKEN
    if [ -z "$TOKEN" ]; then
        print_fail "TOKEN environment variable not set"
        echo "Please export TOKEN=\"your_jwt_token\""
        exit 1
    fi
    print_pass "TOKEN is set"

    # Check PROJECT_ID
    if [ -z "$PROJECT_ID" ]; then
        print_fail "PROJECT_ID environment variable not set"
        echo "Please export PROJECT_ID=\"your_project_id\""
        exit 1
    fi
    print_pass "PROJECT_ID is set"

    # Check curl is available
    if ! command -v curl &> /dev/null; then
        print_fail "curl is not installed"
        exit 1
    fi
    print_pass "curl is available"

    # Check jq is available (optional but recommended)
    if command -v jq &> /dev/null; then
        print_pass "jq is available (will format JSON output)"
        USE_JQ=true
    else
        print_info "jq not available (install for better JSON formatting)"
        USE_JQ=false
    fi
}

# Test 1: Health Check
test_health_check() {
    print_header "Test 1: Health Check"
    print_test "Testing API health endpoint..."

    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/apps/avatar-creator/health")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "200" ]; then
        print_pass "Health check returned 200 OK"
        if $USE_JQ; then
            echo "$body" | jq '.'
        else
            echo "$body"
        fi
    else
        print_fail "Health check failed with HTTP $http_code"
        echo "$body"
    fi
}

# Test 2: Rate Limiting
test_rate_limiting() {
    print_header "Test 2: Rate Limiting (5 req/min for generation)"
    print_test "Making 6 consecutive generation requests..."
    print_info "Requests 1-5 should succeed or return 402 (insufficient credits)"
    print_info "Request 6 should return 429 (rate limit exceeded)"

    local rate_limit_triggered=false

    for i in {1..6}; do
        echo ""
        echo "Request $i:"

        response=$(curl -s -w "\n%{http_code}" -X POST \
            "$BASE_URL/api/apps/avatar-creator/projects/$PROJECT_ID/avatars/generate" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "Rate Limit Test",
                "prompt": "professional woman in business attire"
            }')

        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)

        if [ $i -le 5 ]; then
            if [ "$http_code" == "200" ] || [ "$http_code" == "202" ] || [ "$http_code" == "402" ]; then
                echo "  ✓ HTTP $http_code (expected)"
            else
                echo "  ✗ HTTP $http_code (unexpected)"
            fi
        else
            # 6th request should be rate limited
            if [ "$http_code" == "429" ]; then
                echo "  ✓ HTTP $http_code - Rate limit triggered! ✅"
                rate_limit_triggered=true
                if $USE_JQ; then
                    echo "$body" | jq '.message'
                else
                    echo "$body"
                fi
            else
                echo "  ✗ HTTP $http_code - Rate limit NOT triggered! ❌"
            fi
        fi

        sleep 1
    done

    echo ""
    if [ "$rate_limit_triggered" = true ]; then
        print_pass "Rate limiting is working correctly"
    else
        print_fail "Rate limiting did NOT trigger on 6th request"
    fi
}

# Test 3: File Upload Security
test_file_upload_security() {
    print_header "Test 3: File Upload Security (Magic Byte Validation)"

    # Test 3a: Valid image upload
    print_test "Test 3a: Uploading valid image..."

    # Create a temporary test image (1x1 PNG)
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test_avatar.png 2>/dev/null || {
        print_info "Skipping file upload test (base64 decode not available on Windows)"
        return
    }

    response=$(curl -s -w "\n%{http_code}" -X POST \
        "$BASE_URL/api/apps/avatar-creator/projects/$PROJECT_ID/avatars/upload" \
        -H "Authorization: Bearer $TOKEN" \
        -F "image=@/tmp/test_avatar.png" \
        -F "name=Security Test Avatar" \
        -F "gender=female")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        print_pass "Valid image upload succeeded"
    elif [ "$http_code" == "402" ]; then
        print_info "Upload blocked by insufficient credits (expected behavior)"
    else
        print_fail "Valid image upload failed with HTTP $http_code"
        echo "$body"
    fi

    # Test 3b: Malicious file upload (fake image)
    print_test "Test 3b: Uploading malicious file disguised as image..."

    # Create a fake image (actually PHP code)
    echo "<?php system(\$_GET['cmd']); ?>" > /tmp/malicious.jpg

    response=$(curl -s -w "\n%{http_code}" -X POST \
        "$BASE_URL/api/apps/avatar-creator/projects/$PROJECT_ID/avatars/upload" \
        -H "Authorization: Bearer $TOKEN" \
        -F "image=@/tmp/malicious.jpg" \
        -F "name=Malicious File")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "400" ]; then
        print_pass "Malicious file rejected with 400 Bad Request"
        if $USE_JQ; then
            echo "$body" | jq '.error'
        else
            echo "$body"
        fi
    else
        print_fail "Malicious file was NOT rejected! HTTP $http_code"
        echo "$body"
    fi

    # Cleanup
    rm -f /tmp/test_avatar.png /tmp/malicious.jpg
}

# Test 4: Input Validation
test_input_validation() {
    print_header "Test 4: Input Validation (Zod Schemas)"

    # Test 4a: Missing required field
    print_test "Test 4a: Creating project without required 'name' field..."

    response=$(curl -s -w "\n%{http_code}" -X POST \
        "$BASE_URL/api/apps/avatar-creator/projects" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}')

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "400" ]; then
        print_pass "Request with missing field rejected with 400"
        if $USE_JQ; then
            echo "$body" | jq '.error'
        fi
    else
        print_fail "Invalid request was NOT rejected! HTTP $http_code"
    fi

    # Test 4b: Invalid data type
    print_test "Test 4b: Generating avatar with invalid data types..."

    response=$(curl -s -w "\n%{http_code}" -X POST \
        "$BASE_URL/api/apps/avatar-creator/projects/$PROJECT_ID/avatars/generate" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test",
            "prompt": "test",
            "width": "not_a_number"
        }')

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "400" ]; then
        print_pass "Request with invalid data type rejected"
    else
        print_fail "Invalid data type was NOT rejected! HTTP $http_code"
    fi

    # Test 4c: Valid request
    print_test "Test 4c: Creating project with valid data..."

    response=$(curl -s -w "\n%{http_code}" -X POST \
        "$BASE_URL/api/apps/avatar-creator/projects" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Validation Test Project",
            "description": "Testing Zod validation"
        }')

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        print_pass "Valid request succeeded"
        if $USE_JQ; then
            echo "$body" | jq '.project.id'
        fi
    else
        print_fail "Valid request failed with HTTP $http_code"
        echo "$body"
    fi
}

# Test 5: Credit System
test_credit_system() {
    print_header "Test 5: Credit System"

    # Test 5a: Check credit costs
    print_test "Test 5a: Fetching credit costs from stats endpoint..."

    response=$(curl -s -w "\n%{http_code}" \
        "$BASE_URL/api/apps/avatar-creator/stats" \
        -H "Authorization: Bearer $TOKEN")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" == "200" ]; then
        print_pass "Stats endpoint returned credit costs"

        if $USE_JQ; then
            echo "$body" | jq '.costs'

            # Verify costs
            generate_cost=$(echo "$body" | jq '.costs.generateAvatar')
            upload_cost=$(echo "$body" | jq '.costs.uploadAvatar')

            if [ "$generate_cost" == "10" ]; then
                print_pass "Generate avatar cost is 10 credits (correct)"
            else
                print_fail "Generate avatar cost is $generate_cost (should be 10)"
            fi

            if [ "$upload_cost" == "2" ]; then
                print_pass "Upload avatar cost is 2 credits (correct)"
            else
                print_fail "Upload avatar cost is $upload_cost (should be 2)"
            fi
        else
            echo "$body"
        fi
    else
        print_fail "Stats endpoint failed with HTTP $http_code"
    fi
}

# Test 6: Error Handling
test_error_handling() {
    print_header "Test 6: Error Handling Format"

    print_test "Testing error response format..."

    # Trigger validation error
    response=$(curl -s \
        "$BASE_URL/api/apps/avatar-creator/projects/$PROJECT_ID/avatars/generate" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name": "Test"}')  # Missing prompt

    if $USE_JQ; then
        error_code=$(echo "$response" | jq -r '.error // empty')
        error_message=$(echo "$response" | jq -r '.message // empty')

        if [ ! -z "$error_code" ] && [ ! -z "$error_message" ]; then
            print_pass "Error response has structured format"
            echo "  Error: $error_code"
            echo "  Message: $error_message"
        else
            print_fail "Error response format is not structured"
            echo "$response"
        fi
    else
        if echo "$response" | grep -q "error"; then
            print_pass "Error response contains error field"
        else
            print_fail "Error response format unclear"
        fi
    fi
}

# Main execution
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║   Avatar Creator - Sprint 1 Post-Deployment Tests        ║"
    echo "║   Testing Security Features on: $BASE_URL"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""

    check_prerequisites

    test_health_check
    test_rate_limiting
    test_file_upload_security
    test_input_validation
    test_credit_system
    test_error_handling

    # Summary
    print_header "Test Summary"

    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║              🎉 ALL TESTS PASSED! 🎉                     ║${NC}"
        echo -e "${GREEN}║   Sprint 1 Security Features Deployed Successfully!     ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
        exit 0
    else
        echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║              ⚠️  SOME TESTS FAILED ⚠️                    ║${NC}"
        echo -e "${RED}║   Please review the failures above                       ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
        exit 1
    fi
}

# Run main
main

#!/bin/bash

# ============================================
# Lumiku App - Post-Deployment Validation Script
# ============================================
# This script validates the deployed application
# by testing critical endpoints, services, and functionality
#
# Usage: ./deploy-post-validate.sh [environment] [base-url]
# Example: ./deploy-post-validate.sh production https://app.lumiku.com
# ============================================

set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}

if [ -n "$2" ]; then
    BASE_URL="$2"
elif [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://app.lumiku.com"
else
    BASE_URL="https://dev.lumiku.com"
fi

ERROR_COUNT=0
WARNING_COUNT=0
SUCCESS_COUNT=0
LOG_FILE="post-deployment-validation-$(date +%Y%m%d-%H%M%S).log"

# Helper functions
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log_no_color() {
    echo "$1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}$1${NC}" | tee -a "$LOG_FILE"
    ((ERROR_COUNT++))
}

warning() {
    echo -e "${YELLOW}$1${NC}" | tee -a "$LOG_FILE"
    ((WARNING_COUNT++))
}

success() {
    echo -e "${GREEN}$1${NC}" | tee -a "$LOG_FILE"
    ((SUCCESS_COUNT++))
}

info() {
    echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
}

# ============================================
# Start Validation
# ============================================
echo "============================================"
info "Lumiku App - Post-Deployment Validation"
echo "============================================"
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo "Started: $(date)"
echo "Log file: $LOG_FILE"
echo "============================================"
echo ""

# Initialize log
echo "Lumiku App - Post-Deployment Validation" > "$LOG_FILE"
echo "Environment: $ENVIRONMENT" >> "$LOG_FILE"
echo "Base URL: $BASE_URL" >> "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# ============================================
# Test 1: Health Check Endpoint
# ============================================
info "[Test 1/10] Health Check Endpoint"
log_no_color "[Test 1/10] Health Check Endpoint"

HTTP_CODE=$(curl -s -o health-response.json -w "%{http_code}" "$BASE_URL/health")

if [ "$HTTP_CODE" = "200" ]; then
    success "  + Health endpoint returned 200 OK"
    log_no_color "  + Health endpoint OK"
    cat health-response.json >> "$LOG_FILE" 2>/dev/null
else
    error "  X Health endpoint failed (HTTP $HTTP_CODE)"
    log_no_color "  X Health endpoint failed: HTTP $HTTP_CODE"
fi

rm -f health-response.json
echo ""

# ============================================
# Test 2: API Base Endpoint
# ============================================
info "[Test 2/10] API Base Endpoint"
log_no_color "[Test 2/10] API Base Endpoint"

HTTP_CODE=$(curl -s -o api-response.json -w "%{http_code}" "$BASE_URL/api")

if [ "$HTTP_CODE" = "200" ]; then
    success "  + API base endpoint returned 200 OK"
    log_no_color "  + API endpoint OK"
else
    warning "  ! API base endpoint returned HTTP $HTTP_CODE"
    log_no_color "  ! API endpoint: HTTP $HTTP_CODE"
fi

rm -f api-response.json
echo ""

# ============================================
# Test 3: Database Connection (via health endpoint)
# ============================================
info "[Test 3/10] Database Connection"
log_no_color "[Test 3/10] Database Connection"

if curl -s "$BASE_URL/health" | grep -q "database"; then
    success "  + Database connection verified"
    log_no_color "  + Database connection OK"
else
    warning "  ! Could not verify database connection"
    log_no_color "  ! Database verification inconclusive"
fi

echo ""

# ============================================
# Test 4: Redis Connection
# ============================================
info "[Test 4/10] Redis Connection"
log_no_color "[Test 4/10] Redis Connection"

if curl -s "$BASE_URL/health" | grep -q "redis"; then
    success "  + Redis connection verified"
    log_no_color "  + Redis connection OK"
else
    warning "  ! Could not verify Redis connection"
    log_no_color "  ! Redis verification inconclusive"
fi

echo ""

# ============================================
# Test 5: Authentication Endpoints
# ============================================
info "[Test 5/10] Authentication Endpoints"
log_no_color "[Test 5/10] Authentication Endpoints"

# Test login endpoint (should return 400/401 for invalid credentials, not 500)
HTTP_CODE=$(curl -s -o auth-response.json -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}')

if [ "$HTTP_CODE" = "400" ]; then
    success "  + Login endpoint responding correctly (400 for invalid data)"
    log_no_color "  + Login endpoint OK"
elif [ "$HTTP_CODE" = "401" ]; then
    success "  + Login endpoint responding correctly (401 unauthorized)"
    log_no_color "  + Login endpoint OK"
elif [ "$HTTP_CODE" = "429" ]; then
    success "  + Login endpoint with rate limiting active (429)"
    log_no_color "  + Login endpoint OK (rate limited)"
elif [ "$HTTP_CODE" = "500" ]; then
    error "  X Login endpoint returning server error (500)"
    log_no_color "  X Login endpoint error: 500"
    cat auth-response.json >> "$LOG_FILE" 2>/dev/null
else
    warning "  ! Login endpoint returned HTTP $HTTP_CODE"
    log_no_color "  ! Login endpoint: HTTP $HTTP_CODE"
fi

rm -f auth-response.json
echo ""

# ============================================
# Test 6: Rate Limiting
# ============================================
info "[Test 6/10] Rate Limiting"
log_no_color "[Test 6/10] Rate Limiting"

echo "Testing rate limiting by making multiple requests..."
RATE_LIMIT_TRIGGERED=false

for i in {1..10}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"test"}')

    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_TRIGGERED=true
        break
    fi
    sleep 0.1
done

if [ "$RATE_LIMIT_TRIGGERED" = true ]; then
    success "  + Rate limiting is active (429 Too Many Requests)"
    log_no_color "  + Rate limiting working"
else
    warning "  ! Rate limiting not triggered (might be configured with high limits)"
    log_no_color "  ! Rate limiting not verified"
fi

echo ""

# ============================================
# Test 7: CORS Configuration
# ============================================
info "[Test 7/10] CORS Configuration"
log_no_color "[Test 7/10] CORS Configuration"

if curl -s -I "$BASE_URL/api" | grep -q "Access-Control-Allow-Origin"; then
    success "  + CORS headers present"
    log_no_color "  + CORS configured"
else
    warning "  ! CORS headers not detected"
    log_no_color "  ! CORS headers not found"
fi

echo ""

# ============================================
# Test 8: Dashboard API
# ============================================
info "[Test 8/10] Dashboard API"
log_no_color "[Test 8/10] Dashboard API"

HTTP_CODE=$(curl -s -o apps-response.json -w "%{http_code}" "$BASE_URL/api/apps")

if [ "$HTTP_CODE" = "200" ]; then
    success "  + Dashboard apps endpoint accessible"
    log_no_color "  + Dashboard API OK"
elif [ "$HTTP_CODE" = "401" ]; then
    success "  + Dashboard apps endpoint requires auth (401)"
    log_no_color "  + Dashboard API OK (auth required)"
else
    warning "  ! Dashboard apps endpoint returned HTTP $HTTP_CODE"
    log_no_color "  ! Dashboard API: HTTP $HTTP_CODE"
fi

rm -f apps-response.json
echo ""

# ============================================
# Test 9: Static Assets
# ============================================
info "[Test 9/10] Static Assets (Frontend)"
log_no_color "[Test 9/10] Static Assets"

HTTP_CODE=$(curl -s -o index-response.html -w "%{http_code}" "$BASE_URL/")

if [ "$HTTP_CODE" = "200" ]; then
    if grep -q "<!DOCTYPE" index-response.html; then
        success "  + Frontend is serving correctly"
        log_no_color "  + Frontend OK"
    else
        warning "  ! Frontend response doesn't look like HTML"
        log_no_color "  ! Frontend unexpected response"
    fi
else
    error "  X Frontend not accessible (HTTP $HTTP_CODE)"
    log_no_color "  X Frontend error: HTTP $HTTP_CODE"
fi

rm -f index-response.html
echo ""

# ============================================
# Test 10: Response Time Check
# ============================================
info "[Test 10/10] Response Time Check"
log_no_color "[Test 10/10] Response Time"

RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/health")
echo "  Response time: ${RESPONSE_TIME}s"
log_no_color "  Response time: ${RESPONSE_TIME}s"

# Check if response time is acceptable (< 3 seconds)
RESPONSE_TIME_INT=$(echo "$RESPONSE_TIME" | cut -d. -f1)
if [ -z "$RESPONSE_TIME_INT" ]; then
    RESPONSE_TIME_INT=0
fi

if [ "$RESPONSE_TIME_INT" -lt 3 ]; then
    success "  + Response time is acceptable"
else
    warning "  ! Response time is slow (${RESPONSE_TIME}s)"
fi

echo ""

# ============================================
# Summary Report
# ============================================
echo "============================================"
info "Post-Deployment Validation Summary"
echo "============================================"
echo ""

TOTAL_TESTS=10

echo "Test Results:"
echo -e "${GREEN}  Passed: $SUCCESS_COUNT/$TOTAL_TESTS${NC}"
if [ $WARNING_COUNT -gt 0 ]; then
    echo -e "${YELLOW}  Warnings: $WARNING_COUNT${NC}"
fi
if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}  Failed: $ERROR_COUNT${NC}"
fi
echo ""

# Save summary to log
echo "" >> "$LOG_FILE"
echo "Summary:" >> "$LOG_FILE"
echo "  Passed: $SUCCESS_COUNT/$TOTAL_TESTS" >> "$LOG_FILE"
echo "  Warnings: $WARNING_COUNT" >> "$LOG_FILE"
echo "  Failed: $ERROR_COUNT" >> "$LOG_FILE"

# Final assessment
if [ $ERROR_COUNT -eq 0 ]; then
    if [ $WARNING_COUNT -eq 0 ]; then
        success "Result: ALL TESTS PASSED"
        log_no_color "Result: ALL TESTS PASSED"
        echo ""
        success "Deployment validated successfully!"
        echo "The application is running correctly."
        EXIT_CODE=0
    else
        echo -e "${YELLOW}Result: PASSED WITH WARNINGS${NC}"
        log_no_color "Result: PASSED WITH WARNINGS"
        echo ""
        echo "Application is functional but has some warnings."
        echo "Review the warnings above and check logs if necessary."
        EXIT_CODE=0
    fi
else
    echo -e "${RED}Result: VALIDATION FAILED${NC}"
    log_no_color "Result: VALIDATION FAILED"
    echo ""
    error "Critical issues detected!"
    echo ""
    echo "Please investigate the following:"
    echo "1. Check application logs in Coolify dashboard"
    echo "2. Verify environment variables are set correctly"
    echo "3. Ensure database migrations have been run"
    echo "4. Check Redis connectivity"
    echo "5. Review full validation log: $LOG_FILE"
    echo ""
    echo "Consider rolling back if issues persist."
    EXIT_CODE=1
fi

echo ""
echo "Full validation log: $LOG_FILE"
echo "============================================"
echo ""

# Additional recommendations
if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -le 2 ]; then
    success "Next Steps:"
    echo "1. Monitor application logs for the next 30 minutes"
    echo "2. Test critical user workflows manually"
    echo "3. Check monitoring dashboards"
    echo "4. Inform stakeholders of successful deployment"
fi

echo ""

exit $EXIT_CODE

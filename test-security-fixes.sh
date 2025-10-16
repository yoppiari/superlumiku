#!/bin/bash

# API Security Fixes - Manual Test Script
# This script provides examples of how to test the security fixes

BASE_URL="http://localhost:3000/api/apps/pose-generator"

echo "=========================================="
echo "API Security Fixes - Test Examples"
echo "=========================================="
echo ""
echo "NOTE: Replace YOUR_AUTH_TOKEN with actual JWT token"
echo "NOTE: Replace YOUR_ADMIN_TOKEN with admin JWT token"
echo ""

# Test 1: Admin Authorization (Should fail for non-admin)
echo "Test 1: Admin Authorization - Non-admin accessing metrics"
echo "curl -H \"Authorization: Bearer YOUR_AUTH_TOKEN\" \\"
echo "     $BASE_URL/metrics"
echo ""
echo "Expected: 403 Forbidden"
echo "----------------------------------------"
echo ""

# Test 2: Admin Authorization (Should succeed for admin)
echo "Test 2: Admin Authorization - Admin accessing metrics"
echo "curl -H \"Authorization: Bearer YOUR_ADMIN_TOKEN\" \\"
echo "     $BASE_URL/metrics?period=week"
echo ""
echo "Expected: 200 OK with metrics data"
echo "----------------------------------------"
echo ""

# Test 3: Invalid Period Parameter
echo "Test 3: Period Validation - Invalid period"
echo "curl -H \"Authorization: Bearer YOUR_ADMIN_TOKEN\" \\"
echo "     $BASE_URL/metrics?period=invalid_period"
echo ""
echo "Expected: 400 Bad Request with validValues"
echo "Response: {"
echo "  \"error\": \"Bad Request\","
echo "  \"message\": \"Invalid period\","
echo "  \"validValues\": [\"day\", \"week\", \"month\", \"year\", \"all\"]"
echo "}"
echo "----------------------------------------"
echo ""

# Test 4: Valid Period Parameter
echo "Test 4: Period Validation - Valid period"
echo "curl -H \"Authorization: Bearer YOUR_ADMIN_TOKEN\" \\"
echo "     $BASE_URL/metrics?period=week"
echo ""
echo "Expected: 200 OK with metrics data"
echo "----------------------------------------"
echo ""

# Test 5: Limit Validation - Over maximum
echo "Test 5: Limit Validation - Over maximum (200 > 100)"
echo "curl -H \"Authorization: Bearer YOUR_ADMIN_TOKEN\" \\"
echo "     $BASE_URL/metrics/top-users?limit=200"
echo ""
echo "Expected: 200 OK with max 100 users (capped, not error)"
echo "----------------------------------------"
echo ""

# Test 6: Limit Validation - Invalid value
echo "Test 6: Limit Validation - Invalid value"
echo "curl -H \"Authorization: Bearer YOUR_ADMIN_TOKEN\" \\"
echo "     $BASE_URL/metrics/top-users?limit=abc"
echo ""
echo "Expected: 200 OK with default 10 users"
echo "----------------------------------------"
echo ""

# Test 7: Format Validation - Invalid format
echo "Test 7: Format Validation - Invalid format"
echo "curl -H \"Authorization: Bearer YOUR_AUTH_TOKEN\" \\"
echo "     -X POST \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"format\": \"invalid_format\"}' \\"
echo "     $BASE_URL/poses/POSE_ID/regenerate-export"
echo ""
echo "Expected: 400 Bad Request with validValues"
echo "Response: {"
echo "  \"error\": \"Bad Request\","
echo "  \"message\": \"Invalid format name\","
echo "  \"validValues\": [\"instagram_post\", \"tiktok\", ...]"
echo "}"
echo "----------------------------------------"
echo ""

# Test 8: Format Validation - Valid format
echo "Test 8: Format Validation - Valid format"
echo "curl -H \"Authorization: Bearer YOUR_AUTH_TOKEN\" \\"
echo "     -X POST \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"format\": \"instagram_post\"}' \\"
echo "     $BASE_URL/poses/POSE_ID/regenerate-export"
echo ""
echo "Expected: 200 OK with export URL"
echo "----------------------------------------"
echo ""

# Test 9: Export ZIP - Invalid formats
echo "Test 9: Export ZIP Validation - Invalid formats"
echo "curl -H \"Authorization: Bearer YOUR_AUTH_TOKEN\" \\"
echo "     $BASE_URL/generations/GEN_ID/export-zip?formats=invalid1,invalid2"
echo ""
echo "Expected: 400 Bad Request with validValues"
echo "----------------------------------------"
echo ""

# Test 10: Export ZIP - Valid formats
echo "Test 10: Export ZIP Validation - Valid formats"
echo "curl -H \"Authorization: Bearer YOUR_AUTH_TOKEN\" \\"
echo "     $BASE_URL/generations/GEN_ID/export-zip?formats=instagram_post,tiktok"
echo ""
echo "Expected: 200 OK with ZIP file"
echo "----------------------------------------"
echo ""

# Test 11: Popular Poses - Non-admin (NEW - Should fail now)
echo "Test 11: Popular Poses - Non-admin access"
echo "curl -H \"Authorization: Bearer YOUR_AUTH_TOKEN\" \\"
echo "     $BASE_URL/metrics/popular-poses"
echo ""
echo "Expected: 403 Forbidden (NEW BEHAVIOR)"
echo "----------------------------------------"
echo ""

# Test 12: Popular Poses - Admin (Should succeed)
echo "Test 12: Popular Poses - Admin access"
echo "curl -H \"Authorization: Bearer YOUR_ADMIN_TOKEN\" \\"
echo "     $BASE_URL/metrics/popular-poses?limit=20"
echo ""
echo "Expected: 200 OK with popular poses"
echo "----------------------------------------"
echo ""

echo "=========================================="
echo "Performance Tests"
echo "=========================================="
echo ""

# Test 13: Performance - Admin endpoints should be faster
echo "Test 13: Performance Test - Admin endpoints"
echo "# Before fix: Had extra DB query (~10-50ms overhead)"
echo "# After fix: Uses context (no extra DB query)"
echo ""
echo "Run with timing:"
echo "time curl -H \"Authorization: Bearer YOUR_ADMIN_TOKEN\" \\"
echo "     $BASE_URL/metrics"
echo ""
echo "Expected: Faster response time than before"
echo "----------------------------------------"
echo ""

echo "=========================================="
echo "Summary of Fixes"
echo "=========================================="
echo ""
echo "1. Admin Authorization - 6 endpoints now use context (not DB)"
echo "2. Period Validation - Invalid periods return 400"
echo "3. Limit Validation - Limits capped at 100"
echo "4. Format Validation - Invalid formats return 400"
echo "5. Popular Poses - Now requires admin role"
echo ""
echo "All fixes are backward compatible for valid requests!"
echo "=========================================="

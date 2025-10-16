# Avatar Creator Security Testing Guide

This guide provides comprehensive test cases for the security features implemented in the Avatar Creator application, specifically focusing on **rate limiting** and **file upload security**.

## Table of Contents

1. [Overview](#overview)
2. [Rate Limiting Tests](#rate-limiting-tests)
3. [File Upload Security Tests](#file-upload-security-tests)
4. [Manual Testing Instructions](#manual-testing-instructions)
5. [Automated Testing Scripts](#automated-testing-scripts)

---

## Overview

The Avatar Creator has two critical security layers:

1. **Rate Limiting**: Prevents abuse of expensive FLUX AI API calls and resource exhaustion
2. **File Upload Security**: Prevents malicious file uploads through magic byte validation and path traversal protection

### Protected Endpoints

| Endpoint | Rate Limit | Purpose |
|----------|------------|---------|
| `POST /projects` | 20/hour per user | Create new project |
| `POST /projects/:id/avatars/upload` | 10/min per user | Upload avatar image |
| `POST /projects/:id/avatars/generate` | 5/min per user | Generate avatar with AI (FLUX) |
| `POST /projects/:id/avatars/from-preset` | 8/min per user | Create avatar from preset |

---

## Rate Limiting Tests

### Test 1: Avatar Generation Rate Limit (5 requests/minute)

**Objective**: Verify that users cannot spam expensive FLUX AI generation requests.

**Steps**:
```bash
# Set your auth token and project ID
export TOKEN="your_jwt_token"
export PROJECT_ID="your_project_id"
export API_URL="http://localhost:3001/api/apps/avatar-creator"

# Send 6 requests rapidly (should succeed for 5, fail on 6th)
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/generate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Avatar '$i'",
      "prompt": "A professional business avatar",
      "width": 1024,
      "height": 1024
    }' | jq
  sleep 1
done
```

**Expected Results**:
- Requests 1-5: `200 OK` with generation started
- Request 6: `429 Too Many Requests` with error message:
  ```json
  {
    "error": "Rate limit exceeded",
    "message": "Too many avatar generation requests. Please wait 1 minute before generating more avatars.",
    "retryAfter": 60
  }
  ```
- Response headers include:
  - `X-RateLimit-Limit: 5`
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: <timestamp>`
  - `Retry-After: <seconds>`

**Wait 1 minute, then verify reset**:
```bash
# After waiting 60 seconds, this should succeed
curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test After Reset",
    "prompt": "A professional business avatar"
  }'
```

**Expected**: `200 OK` - Rate limit has reset

---

### Test 2: File Upload Rate Limit (10 requests/minute)

**Objective**: Verify file upload rate limiting.

**Steps**:
```bash
# Create a test image
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test.png

# Send 11 upload requests rapidly
for i in {1..11}; do
  echo "Upload $i:"
  curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "image=@test.png" \
    -F "name=Upload Test $i" | jq '.error // .message'
  sleep 0.5
done
```

**Expected Results**:
- Uploads 1-10: Success
- Upload 11: `429 Too Many Requests`

---

### Test 3: Project Creation Rate Limit (20 requests/hour)

**Objective**: Verify project creation rate limiting.

**Steps**:
```bash
# Send 21 project creation requests
for i in {1..21}; do
  echo "Project $i:"
  curl -X POST "$API_URL/projects" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Project '$i'",
      "description": "Rate limit test"
    }' | jq '.error // .message'
done
```

**Expected Results**:
- Projects 1-20: Success
- Project 21: `429 Too Many Requests`

---

### Test 4: Rate Limit Isolation (Different Users)

**Objective**: Verify that rate limits are per-user, not global.

**Steps**:
```bash
# User 1 makes 5 generation requests (hits limit)
export TOKEN_USER1="user1_jwt_token"
for i in {1..5}; do
  curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/generate" \
    -H "Authorization: Bearer $TOKEN_USER1" \
    -H "Content-Type: application/json" \
    -d '{"name": "User1 Avatar", "prompt": "test"}' | jq '.error // .message'
done

# User 2 should still be able to make requests
export TOKEN_USER2="user2_jwt_token"
curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/generate" \
  -H "Authorization: Bearer $TOKEN_USER2" \
  -H "Content-Type: application/json" \
  -d '{"name": "User2 Avatar", "prompt": "test"}'
```

**Expected Results**:
- User 1's 6th request: `429 Too Many Requests`
- User 2's 1st request: `200 OK` (not affected by User 1's rate limit)

---

### Test 5: Rate Limit Headers

**Objective**: Verify correct rate limit headers are returned.

**Steps**:
```bash
curl -i -X POST "$API_URL/projects/$PROJECT_ID/avatars/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "prompt": "test"}'
```

**Expected Response Headers**:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1234567890
```

After hitting limit:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890
Retry-After: 60
```

---

## File Upload Security Tests

### Test 6: Valid Image Upload

**Objective**: Verify legitimate images are accepted.

**Test Cases**:

#### 6.1: Valid JPEG
```bash
# Create valid JPEG (100x100 red square)
convert -size 512x512 xc:red test.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test.jpg" \
  -F "name=Valid JPEG"
```
**Expected**: `200 OK` - Upload successful

#### 6.2: Valid PNG
```bash
convert -size 512x512 xc:blue test.png

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test.png" \
  -F "name=Valid PNG"
```
**Expected**: `200 OK` - Upload successful

#### 6.3: Valid WebP
```bash
convert -size 512x512 xc:green test.webp

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test.webp" \
  -F "name=Valid WebP"
```
**Expected**: `200 OK` - Upload successful

---

### Test 7: MIME Type Spoofing Attack

**Objective**: Verify that magic byte validation prevents MIME type spoofing.

**Attack Vector**: Upload a PHP/executable file with .jpg extension.

**Steps**:
```bash
# Create a fake "image" that's actually a PHP script
echo "<?php system(\$_GET['cmd']); ?>" > malicious.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@malicious.jpg" \
  -F "name=Malicious PHP as JPG"
```

**Expected Result**:
```json
{
  "error": "Invalid image format. Only image/jpeg, image/png, image/webp are allowed. Detected: text/plain"
}
```
**Status**: `400 Bad Request`

**Security Log**: Should contain `[FILE_SECURITY_VIOLATION]` entry.

---

### Test 8: Path Traversal Attack

**Objective**: Verify that filename sanitization prevents path traversal.

**Attack Vector**: Upload file with malicious filename like `../../etc/passwd.jpg`.

**Steps**:
```bash
# Create valid image with malicious filename
convert -size 512x512 xc:red valid.jpg

# Try to upload with path traversal in filename
curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@valid.jpg;filename=../../etc/passwd.jpg" \
  -F "name=Path Traversal Test"
```

**Expected Result**:
- Upload succeeds (image is valid)
- File is saved with sanitized name: `avatar_<timestamp>_<random>.jpg`
- File is NOT saved to `/etc/passwd.jpg` or outside upload directory
- Original path components (`../../`) are stripped

**Verification**:
```bash
# Check that file was saved in correct directory
ls uploads/avatar-creator/<user_id>/
# Should show: avatar_1234567890_abc123.jpg (not ../../etc/passwd.jpg)
```

---

### Test 9: File Size Validation

**Objective**: Verify files over 10MB are rejected.

**Steps**:
```bash
# Create 11MB image
dd if=/dev/zero of=large.jpg bs=1M count=11

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@large.jpg" \
  -F "name=Oversized Image"
```

**Expected Result**:
```json
{
  "error": "File too large. Maximum size is 10MB"
}
```
**Status**: `400 Bad Request`

---

### Test 10: Image Dimension Validation

**Objective**: Verify dimension constraints are enforced.

#### 10.1: Image Too Small (< 256x256)
```bash
convert -size 100x100 xc:red tiny.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@tiny.jpg" \
  -F "name=Too Small"
```

**Expected Result**:
```json
{
  "error": "Image too small. Minimum dimensions are 256x256 pixels"
}
```

#### 10.2: Image Too Large (> 4096x4096)
```bash
convert -size 5000x5000 xc:red huge.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@huge.jpg" \
  -F "name=Too Large"
```

**Expected Result**:
```json
{
  "error": "Image too large. Maximum dimensions are 4096x4096 pixels"
}
```

---

### Test 11: Extension Mismatch Attack

**Objective**: Verify extension-MIME cross-validation.

**Attack Vector**: Rename PNG as JPG.

**Steps**:
```bash
# Create PNG file
convert -size 512x512 xc:blue test.png

# Rename to .jpg
mv test.png fake.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@fake.jpg" \
  -F "name=PNG Renamed as JPG"
```

**Expected Result**:
```json
{
  "error": "File extension .jpg does not match actual file type image/png. This may indicate a spoofed file."
}
```
**Status**: `400 Bad Request`

---

### Test 12: Decompression Bomb Detection

**Objective**: Verify protection against decompression bombs.

**Attack Vector**: Create image with extreme compression ratio.

**Steps**:
```bash
# Create image that would decompress to > 100MB
# 10000x10000 pixels = 400MB uncompressed (4 bytes per pixel RGBA)
convert -size 10000x10000 xc:white -quality 1 bomb.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@bomb.jpg" \
  -F "name=Decompression Bomb"
```

**Expected Result**:
```json
{
  "error": "Image would require too much memory to process. Please use a smaller image."
}
```
**Status**: `400 Bad Request`

---

### Test 13: Empty File Upload

**Objective**: Verify empty files are rejected.

**Steps**:
```bash
# Create empty file
touch empty.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@empty.jpg" \
  -F "name=Empty File"
```

**Expected Result**:
```json
{
  "error": "File is empty"
}
```

---

### Test 14: Corrupted Image File

**Objective**: Verify corrupted images are rejected.

**Steps**:
```bash
# Create corrupted "image" file
echo "This is not a valid image" > corrupted.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@corrupted.jpg" \
  -F "name=Corrupted Image"
```

**Expected Result**:
```json
{
  "error": "Could not determine file type. The file may be corrupted or not a valid image"
}
```

---

## Manual Testing Instructions

### Prerequisites

1. **Install ImageMagick** (for creating test images):
   ```bash
   # macOS
   brew install imagemagick

   # Ubuntu/Debian
   sudo apt-get install imagemagick

   # Windows
   # Download from https://imagemagick.org/script/download.php
   ```

2. **Set up environment variables**:
   ```bash
   export API_URL="http://localhost:3001/api/apps/avatar-creator"
   export TOKEN="your_jwt_token_here"
   export PROJECT_ID="your_project_id_here"
   ```

3. **Get JWT Token**:
   ```bash
   # Login to get token
   curl -X POST "http://localhost:3001/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "your_password"
     }' | jq -r '.token'
   ```

4. **Create Test Project**:
   ```bash
   curl -X POST "$API_URL/projects" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Security Test Project",
       "description": "For testing security features"
     }' | jq -r '.project.id'
   ```

### Running All Tests

Execute the automated test script (see next section).

---

## Automated Testing Scripts

### Complete Test Suite Script

Save as `test_avatar_security.sh`:

```bash
#!/bin/bash

# Avatar Creator Security Test Suite
# Tests rate limiting and file upload security

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3001/api/apps/avatar-creator}"
TOKEN="${TOKEN:-}"
PROJECT_ID="${PROJECT_ID:-}"

if [ -z "$TOKEN" ] || [ -z "$PROJECT_ID" ]; then
  echo "Error: Set TOKEN and PROJECT_ID environment variables"
  exit 1
fi

echo "========================================="
echo "Avatar Creator Security Test Suite"
echo "========================================="
echo ""

# Test 1: Rate Limiting - Generation
echo "Test 1: Avatar Generation Rate Limit (5/min)"
echo "Sending 6 requests rapidly..."
success_count=0
for i in {1..6}; do
  response=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/avatars/generate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Test $i\", \"prompt\": \"test\"}" \
    -w "\n%{http_code}")

  http_code=$(echo "$response" | tail -1)

  if [ "$http_code" -eq 200 ]; then
    ((success_count++))
    echo "  Request $i: ✓ Success (200)"
  elif [ "$http_code" -eq 429 ]; then
    echo "  Request $i: ✓ Rate limited (429)"
  else
    echo "  Request $i: ✗ Unexpected ($http_code)"
  fi
done

if [ "$success_count" -eq 5 ]; then
  echo "✓ Test 1 PASSED: Exactly 5 requests succeeded"
else
  echo "✗ Test 1 FAILED: Expected 5 successes, got $success_count"
fi

echo ""

# Test 2: File Upload Security - MIME Spoofing
echo "Test 2: MIME Type Spoofing Protection"
echo "Creating malicious.jpg (actually PHP)..."
echo "<?php system(\$_GET['cmd']); ?>" > /tmp/malicious.jpg

response=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/malicious.jpg" \
  -F "name=Malicious" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -1)

if [ "$http_code" -eq 400 ]; then
  echo "✓ Test 2 PASSED: Malicious file rejected (400)"
else
  echo "✗ Test 2 FAILED: Expected 400, got $http_code"
fi

echo ""

# Test 3: Valid Image Upload
echo "Test 3: Valid Image Upload"
echo "Creating valid test.jpg..."
convert -size 512x512 xc:red /tmp/test.jpg 2>/dev/null || {
  echo "Warning: ImageMagick not installed, skipping image tests"
  exit 0
}

response=$(curl -s -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/test.jpg" \
  -F "name=Valid Test" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -1)

if [ "$http_code" -eq 200 ]; then
  echo "✓ Test 3 PASSED: Valid image accepted (200)"
else
  echo "✗ Test 3 FAILED: Expected 200, got $http_code"
fi

echo ""
echo "========================================="
echo "Test Suite Complete"
echo "========================================="

# Cleanup
rm -f /tmp/malicious.jpg /tmp/test.jpg
```

### Running the Test Suite

```bash
chmod +x test_avatar_security.sh

export TOKEN="your_jwt_token"
export PROJECT_ID="your_project_id"

./test_avatar_security.sh
```

---

## Security Monitoring

### Checking Security Logs

**Rate Limit Violations**:
```bash
# Check backend logs for rate limit violations
grep "RATE_LIMIT_VIOLATION" logs/backend.log
```

Expected format:
```
[RATE_LIMIT_VIOLATION] 2025-01-15T10:30:00.000Z - IP: 192.168.1.100, Endpoint: /projects/123/avatars/generate, Attempts: 6/5
```

**File Security Violations**:
```bash
# Check for file security violations
grep "FILE_SECURITY_VIOLATION" logs/backend.log
```

Expected format:
```
[FILE_SECURITY_VIOLATION] 2025-01-15T10:30:00.000Z - MIME_TYPE_MISMATCH {
  "detectedType": "text/plain",
  "expectedType": "image/jpeg",
  "userId": "user_123"
}
```

---

## Production Monitoring

### Key Metrics to Monitor

1. **Rate Limit Violations per Hour**
   - Alert if > 100 violations/hour (potential attack)

2. **File Upload Rejection Rate**
   - Track percentage of rejected uploads
   - Investigate if > 10% rejection rate

3. **Common Attack Patterns**
   - MIME spoofing attempts
   - Path traversal attempts
   - Oversized file uploads

### Sentry Integration

Rate limit and file security violations are automatically logged with Sentry when configured:

```typescript
// Automatically logged to Sentry
- RateLimitError (429 responses)
- ValidationError (file upload failures)
```

---

## Troubleshooting

### Rate Limiting Not Working

**Problem**: Rate limits not being enforced.

**Solutions**:
1. Check Redis connection:
   ```bash
   redis-cli ping
   ```
2. Verify middleware order in routes (authMiddleware must come before rate limiter)
3. Check rate limiter logs for errors

### File Uploads Being Rejected

**Problem**: Valid images being rejected.

**Solutions**:
1. Check image dimensions (must be 256-4096 pixels)
2. Check file size (must be < 10MB)
3. Ensure file is valid JPEG/PNG/WebP
4. Check server logs for specific validation error

---

## Conclusion

This test suite ensures that:
- ✅ Rate limiting prevents API abuse
- ✅ Magic byte validation prevents MIME spoofing
- ✅ Path traversal is prevented
- ✅ File size and dimension limits are enforced
- ✅ Security violations are logged for monitoring

Regular execution of these tests helps maintain the security posture of the Avatar Creator application.

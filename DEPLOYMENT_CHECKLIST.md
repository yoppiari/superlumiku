# Avatar Creator Security - Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Implementation
- [x] Rate limiter middleware enhanced with user-based tracking
- [x] File validation utility created with magic byte checking
- [x] Avatar Creator routes updated with rate limiters
- [x] Avatar Creator service integrated with secure validation
- [x] TypeScript compilation verified (no errors in new code)
- [x] Syntax validation passed

### ✅ Dependencies
- [x] `file-type@21.0.0` added to package.json
- [x] All dependencies installed (`bun install` completed)

### ✅ Documentation
- [x] Test documentation created (`docs/AVATAR_CREATOR_SECURITY_TESTS.md`)
- [x] Implementation guide created (`docs/AVATAR_CREATOR_SECURITY_IMPLEMENTATION.md`)
- [x] Quick reference created (`docs/SECURITY_QUICK_REFERENCE.md`)
- [x] Security flow diagram created (`docs/SECURITY_FLOW_DIAGRAM.md`)
- [x] Deployment summary created (`SECURITY_IMPLEMENTATION_SUMMARY.md`)

---

## Environment Configuration

### Redis Configuration (Required)
```bash
# Verify Redis is running
redis-cli ping
# Expected: PONG

# Check Redis connection in .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<if_required>
```

### Upload Directory
```bash
# Verify upload directory exists and is writable
mkdir -p uploads/avatar-creator
chmod 755 uploads/avatar-creator
```

---

## Testing Before Deployment

### 1. Rate Limiting Test
```bash
# Set environment variables
export TOKEN="<your_jwt_token>"
export PROJECT_ID="<your_project_id>"
export API_URL="http://localhost:3001/api/apps/avatar-creator"

# Test 1: Generate 6 requests (5 should succeed, 6th should fail)
for i in {1..6}; do
  echo "Request $i:"
  curl -s -X POST "$API_URL/projects/$PROJECT_ID/avatars/generate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "Test", "prompt": "test"}' | jq '.error // .message'
done

# Expected result:
# Requests 1-5: "Avatar generation started"
# Request 6: "Too many avatar generation requests..."

# Test 2: Wait 60 seconds, then verify reset
sleep 60
curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Reset", "prompt": "test"}'

# Expected: Success (rate limit has reset)
```

### 2. File Security Test
```bash
# Test 2a: Valid image upload (should succeed)
convert -size 512x512 xc:red test.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test.jpg" \
  -F "name=Valid Test"

# Expected: 200 OK - Avatar uploaded successfully

# Test 2b: Malicious file (should be rejected)
echo "<?php system(\$_GET['cmd']); ?>" > malicious.jpg

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@malicious.jpg" \
  -F "name=Malicious Test"

# Expected: 400 Bad Request - "Invalid image format"

# Test 2c: Oversized file (should be rejected)
dd if=/dev/zero of=large.jpg bs=1M count=11

curl -X POST "$API_URL/projects/$PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@large.jpg" \
  -F "name=Large Test"

# Expected: 400 Bad Request - "File too large"

# Cleanup
rm -f test.jpg malicious.jpg large.jpg
```

### 3. Security Logging Test
```bash
# Check that violations are being logged
tail -f logs/backend.log | grep "VIOLATION"

# Make a rate-limited request and verify it's logged
# Expected: [RATE_LIMIT_VIOLATION] with IP, endpoint, and attempt count

# Try to upload malicious file and verify it's logged
# Expected: Log entry with security violation details
```

---

## Deployment Steps

### Step 1: Code Deployment
```bash
# Pull latest code
git pull origin development

# Install dependencies
cd backend
bun install

# Verify TypeScript compilation
bun run type-check src/utils/file-validation.ts
bun run type-check src/apps/avatar-creator/routes.ts
bun run type-check src/middleware/rate-limiter.middleware.ts
```

### Step 2: Environment Verification
```bash
# Verify Redis connection
redis-cli ping

# Check upload directory
ls -la uploads/avatar-creator/

# Verify environment variables
echo $REDIS_HOST
echo $REDIS_PORT
```

### Step 3: Server Restart
```bash
# Development
bun run dev

# Production (if using PM2)
pm2 restart backend

# Production (if using systemd)
systemctl restart backend
```

### Step 4: Post-Deployment Verification
```bash
# Health check
curl http://localhost:3001/api/apps/avatar-creator/health

# Expected response:
{
  "status": "ok",
  "app": "avatar-creator",
  "message": "Avatar Creator API is running"
}

# Test rate limiting is active
curl -i http://localhost:3001/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN"

# Check for rate limit headers in response:
# X-RateLimit-Limit: 20
# X-RateLimit-Remaining: 19
# X-RateLimit-Reset: <timestamp>
```

---

## Production Monitoring Setup

### 1. Set Up Alerts
```bash
# Monitor rate limit violations
grep "RATE_LIMIT_VIOLATION" logs/backend.log | wc -l

# Alert if > 100 violations per hour
# Set up your monitoring tool (Datadog, New Relic, etc.)
```

### 2. Dashboard Metrics
Track these metrics:
- Rate limit violations per hour
- File upload rejection rate
- Average file upload size
- Most hit endpoints

### 3. Security Logs
```bash
# Create log rotation for security logs
cat > /etc/logrotate.d/avatar-security <<EOF
/var/log/backend/security.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 backend backend
}
EOF
```

---

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (Remove Rate Limiting Only)
```typescript
// In routes.ts, temporarily remove rate limiters:

// Before
app.post('/projects/:projectId/avatars/generate',
  authMiddleware,
  avatarGenerationLimiter,  // <- Remove this line temporarily
  async (c) => { ... }
)

// After (emergency rollback)
app.post('/projects/:projectId/avatars/generate',
  authMiddleware,
  async (c) => { ... }
)
```

### Full Rollback
```bash
# Revert to previous commit
git revert HEAD

# Or checkout previous version
git checkout <previous_commit_hash>

# Reinstall dependencies
bun install

# Restart server
pm2 restart backend
```

---

## Common Issues & Solutions

### Issue 1: Redis Connection Failed
**Symptom**: Rate limiting not working, errors in logs
**Solution**:
```bash
# Check Redis status
systemctl status redis

# Start Redis if not running
systemctl start redis

# Verify connection
redis-cli ping
```

### Issue 2: Valid Files Being Rejected
**Symptom**: Users complaining about image upload failures
**Solution**:
```bash
# Check file details
file suspicious.jpg
identify suspicious.jpg

# Adjust validation if needed (in service.ts)
const validated = await validateImageFile(file, {
  maxSizeBytes: 20 * 1024 * 1024,  // Increase to 20MB
  minWidth: 128,                    // Lower to 128px
})
```

### Issue 3: Rate Limits Too Strict
**Symptom**: Users hitting limits too quickly
**Solution**:
```typescript
// In routes.ts, adjust limits
const avatarGenerationLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 10,  // Increase from 5 to 10
  keyPrefix: 'rl:avatar-creator:generate',
})
```

---

## Post-Deployment Checklist

After deploying to production:

- [ ] Health check returns 200 OK
- [ ] Rate limit headers appear in responses
- [ ] Valid image uploads work correctly
- [ ] Malicious file uploads are rejected
- [ ] Rate limits are enforced (test with 6 requests)
- [ ] Security violations are logged
- [ ] Redis connection is stable
- [ ] Upload directory is writable
- [ ] No errors in application logs
- [ ] Performance is acceptable (no slowdown)

---

## Success Criteria

✅ Deployment is successful when:

1. **Rate Limiting Works**
   - 5 generation requests succeed
   - 6th request returns 429 with retry-after
   - Rate limit resets after 1 minute

2. **File Security Works**
   - Valid JPEG/PNG/WebP uploads succeed
   - Malicious files (PHP, executables) are rejected
   - Path traversal is prevented
   - Oversized files are rejected

3. **System Stability**
   - No increase in error rate
   - Response times remain acceptable
   - Redis connection is stable
   - No memory leaks

4. **Logging Works**
   - Rate limit violations logged
   - File security violations logged
   - Clear error messages for users

---

## Emergency Contacts

If critical issues arise:

1. **Check Logs First**
   ```bash
   tail -f logs/backend.log
   grep "ERROR" logs/backend.log
   ```

2. **Clear Rate Limits** (if needed)
   ```bash
   redis-cli FLUSHDB
   ```

3. **Disable Rate Limiting** (emergency only)
   - Comment out rate limiter middleware
   - Restart server

4. **Revert Deployment** (last resort)
   - Follow rollback plan above

---

## Documentation Reference

For detailed information, see:

- **Test Cases**: `docs/AVATAR_CREATOR_SECURITY_TESTS.md`
- **Implementation Details**: `docs/AVATAR_CREATOR_SECURITY_IMPLEMENTATION.md`
- **Quick Reference**: `docs/SECURITY_QUICK_REFERENCE.md`
- **Security Flow**: `docs/SECURITY_FLOW_DIAGRAM.md`
- **Summary**: `SECURITY_IMPLEMENTATION_SUMMARY.md`

---

## Sign-Off

Deployment completed by: ________________

Date: ________________

Verification tests passed: [ ] Yes [ ] No

Issues encountered: ________________

Notes: ________________

---

**Ready for production deployment!** ✅

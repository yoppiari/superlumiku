# Authorization System - Migration & Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the authorization security fixes to production. These fixes address critical P0 security vulnerabilities where users could access other users' data.

**CVSS Score:** 9.1 (CRITICAL)
**Priority:** P0 - IMMEDIATE
**Risk Level:** LOW (fixes are isolated and well-tested)

---

## Table of Contents

1. [Pre-Deployment](#pre-deployment)
2. [Deployment Steps](#deployment-steps)
3. [Post-Deployment](#post-deployment)
4. [Rollback Plan](#rollback-plan)
5. [Verification](#verification)

---

## Pre-Deployment

### 1. Review Changes

**Files Modified:**

```
NEW FILES:
✅ backend/src/services/authorization.service.ts (Centralized authorization)
✅ backend/src/errors/AuthorizationError.ts (Custom error classes)
✅ backend/src/services/__tests__/authorization.service.test.ts (Test suite)
✅ docs/AUTHORIZATION_SYSTEM.md (Documentation)

MODIFIED FILES:
✅ backend/src/apps/carousel-mix/services/carousel.service.ts (Fixed 3 vulnerabilities)
✅ backend/src/apps/carousel-mix/repositories/carousel.repository.ts (Added helper methods)
✅ backend/src/apps/video-mixer/services/video-mixer.service.ts (Fixed 2 vulnerabilities)
✅ backend/src/apps/video-mixer/repositories/video-mixer.repository.ts (Added helper method)

VERIFIED SECURE (No changes):
✅ backend/src/apps/avatar-creator/* (Already secure)
✅ backend/src/apps/looping-flow/* (Already secure)
✅ backend/src/apps/avatar-generator/* (Already secure)
```

### 2. Run Tests

```bash
# Navigate to backend
cd backend

# Run full test suite
bun test

# Run authorization-specific tests
bun test src/services/__tests__/authorization.service.test.ts

# Expected: All tests pass ✅
```

### 3. Code Review Checklist

- [ ] All TODO comments removed from fixed code
- [ ] Authorization checks added to vulnerable endpoints
- [ ] Error handling returns 404 (not 403) for unauthorized access
- [ ] No breaking changes to API contracts
- [ ] TypeScript compilation succeeds
- [ ] Tests cover both authorized and unauthorized access

### 4. Database Check

```bash
# Verify database indexes exist for performance
# Run in database console:

# Check indexes on userId fields
SHOW INDEX FROM CarouselProject WHERE Key_name LIKE '%userId%';
SHOW INDEX FROM VideoMixerProject WHERE Key_name LIKE '%userId%';
SHOW INDEX FROM LoopingFlowProject WHERE Key_name LIKE '%userId%';

# If indexes are missing, create them:
CREATE INDEX idx_carousel_project_userId ON CarouselProject(userId);
CREATE INDEX idx_video_mixer_project_userId ON VideoMixerProject(userId);
CREATE INDEX idx_looping_flow_project_userId ON LoopingFlowProject(userId);
```

---

## Deployment Steps

### Step 1: Create Backup

```bash
# Backup database
mysqldump -u [user] -p [database] > backup_pre_auth_fix_$(date +%Y%m%d_%H%M%S).sql

# Backup current deployment
tar -czf backup_pre_auth_fix_$(date +%Y%m%d_%H%M%S).tar.gz backend/

# Store backups securely
# Verify backup integrity before proceeding
```

### Step 2: Deploy to Staging (Required)

```bash
# Deploy to staging environment
git checkout development
git pull origin development

# Build
cd backend
bun install
bun run build

# Run tests on staging
bun test

# Start staging server
bun run start

# Wait for server to be fully up
curl http://staging.superlumiku.com/health
```

### Step 3: Test on Staging

**Manual Security Tests:**

```bash
# Test 1: User A cannot access User B's project
curl -X GET "http://staging.superlumiku.com/api/apps/carousel-mix/projects/[USER_B_PROJECT_ID]" \
  -H "Authorization: Bearer [USER_A_TOKEN]"
# Expected: 404 Not Found

# Test 2: User A cannot delete User B's slide
curl -X DELETE "http://staging.superlumiku.com/api/apps/carousel-mix/slides/[USER_B_SLIDE_ID]" \
  -H "Authorization: Bearer [USER_A_TOKEN]"
# Expected: 404 Not Found

# Test 3: User A CAN access their own project
curl -X GET "http://staging.superlumiku.com/api/apps/carousel-mix/projects/[USER_A_PROJECT_ID]" \
  -H "Authorization: Bearer [USER_A_TOKEN]"
# Expected: 200 OK

# Test 4: User B cannot update User A's group
curl -X PUT "http://staging.superlumiku.com/api/apps/video-mixer/groups/[USER_A_GROUP_ID]" \
  -H "Authorization: Bearer [USER_B_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}'
# Expected: 404 Not Found
```

**Staging Approval Criteria:**
- [ ] All automated tests pass
- [ ] All manual security tests pass
- [ ] No 403 responses (should be 404)
- [ ] Authorized users can access their resources
- [ ] Unauthorized users cannot access others' resources
- [ ] API response times < 200ms (no performance regression)
- [ ] No errors in logs (check for unexpected exceptions)

### Step 4: Deploy to Production

**Deployment Window:**
- Recommended: Low-traffic hours (2 AM - 4 AM local time)
- Duration: ~10 minutes
- Downtime: None (rolling deployment)

**Commands:**

```bash
# 1. Final verification
git checkout main
git pull origin main
git log --oneline -5  # Verify commits

# 2. Build production bundle
cd backend
bun install --production
bun run build

# 3. Run pre-deployment health check
bun test
curl http://production.superlumiku.com/health

# 4. Deploy (example using PM2)
pm2 deploy ecosystem.config.js production

# 5. Monitor deployment
pm2 logs

# 6. Verify deployment
curl http://production.superlumiku.com/health
# Expected: {"status": "ok", ...}
```

### Step 5: Smoke Tests (Production)

**Immediate Post-Deployment Tests:**

```bash
# Test 1: Health check
curl https://superlumiku.com/api/health
# Expected: 200 OK

# Test 2: User can access own resources
curl -X GET "https://superlumiku.com/api/apps/carousel-mix/projects" \
  -H "Authorization: Bearer [VALID_USER_TOKEN]"
# Expected: 200 OK with project list

# Test 3: Unauthorized access blocked
curl -X GET "https://superlumiku.com/api/apps/carousel-mix/projects/[OTHER_USER_PROJECT]" \
  -H "Authorization: Bearer [VALID_USER_TOKEN]"
# Expected: 404 Not Found

# Test 4: Check logs for errors
# SSH to production
tail -f /var/log/superlumiku/app.log | grep -i "error\|exception"
# Expected: No authorization-related errors
```

---

## Post-Deployment

### Immediate Monitoring (0-30 minutes)

**What to Watch:**

1. **Error Rates**
   ```bash
   # Monitor error logs
   tail -f /var/log/superlumiku/app.log | grep "ERROR"

   # Check for authorization errors
   grep "[SECURITY]" /var/log/superlumiku/app.log | tail -20
   ```

2. **Response Times**
   ```bash
   # Check API response times
   # Should be < 200ms for authorization checks
   curl -w "@curl-format.txt" -o /dev/null -s "https://superlumiku.com/api/apps/carousel-mix/projects"
   ```

3. **User Reports**
   - Monitor support channels
   - Check for "can't access my project" reports
   - Watch for "404 errors" complaints

### Short-term Monitoring (1-24 hours)

1. **Authorization Failures**
   ```bash
   # Count authorization failures per hour
   grep "[SECURITY] Authorization failure" /var/log/superlumiku/app.log | \
     awk '{print $1,$2}' | uniq -c

   # Look for patterns (unusual spike = possible attack)
   ```

2. **Performance Metrics**
   - Database query times (should be < 50ms with indexes)
   - API endpoint latency (should be unchanged)
   - Memory usage (should be stable)

3. **User Behavior**
   - Active users count (should be stable)
   - API request volume (should be normal)
   - Error rates (should be < 0.1%)

### Long-term Monitoring (1-7 days)

1. **Security Alerts**
   - Set up alerts for repeated authorization failures from same user
   - Monitor for ID enumeration attempts (sequential IDs being tried)
   - Watch for unusual access patterns

2. **Performance Baseline**
   - Establish new baseline metrics
   - Compare with pre-deployment baseline
   - Ensure no performance degradation

---

## Rollback Plan

If critical issues are discovered, follow this rollback procedure:

### When to Rollback

Rollback immediately if:
- Users cannot access their own resources
- API error rate > 5%
- Response times > 2x normal
- Database performance degraded > 50%
- Critical security issue discovered

### Rollback Procedure

```bash
# 1. Stop current deployment
pm2 stop all

# 2. Restore from backup
cd /path/to/deployment
tar -xzf backup_pre_auth_fix_[TIMESTAMP].tar.gz

# 3. Restore database (if needed)
mysql -u [user] -p [database] < backup_pre_auth_fix_[TIMESTAMP].sql

# 4. Restart with previous version
pm2 restart all

# 5. Verify rollback
curl https://superlumiku.com/api/health
# Expected: 200 OK

# 6. Notify team
# Send alert to team that rollback was performed

# 7. Investigate
# Gather logs, errors, and user reports
# Determine root cause
# Fix issue
# Re-deploy after thorough testing
```

### Post-Rollback

1. **Communicate**
   - Notify users of temporary rollback
   - Explain issue and timeline for fix
   - Provide workarounds if available

2. **Investigate**
   - Review logs for root cause
   - Check for edge cases not covered in tests
   - Verify all scenarios were tested

3. **Fix & Re-deploy**
   - Fix identified issues
   - Add tests for missed scenarios
   - Go through deployment process again

---

## Verification

### Automated Verification Script

```bash
#!/bin/bash
# verification.sh - Run after deployment

echo "🔍 Verifying Authorization System Deployment"
echo "============================================="

# Test 1: Health check
echo "Test 1: Health Check"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://superlumiku.com/api/health)
if [ "$HEALTH" -eq 200 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed (HTTP $HEALTH)"
  exit 1
fi

# Test 2: Authorized access works
echo "Test 2: Authorized Access"
AUTH_ACCESS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  "https://superlumiku.com/api/apps/carousel-mix/projects")
if [ "$AUTH_ACCESS" -eq 200 ]; then
  echo "✅ Authorized access works"
else
  echo "❌ Authorized access failed (HTTP $AUTH_ACCESS)"
  exit 1
fi

# Test 3: Unauthorized access blocked
echo "Test 3: Unauthorized Access Blocked"
UNAUTH_ACCESS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  "https://superlumiku.com/api/apps/carousel-mix/projects/$OTHER_USER_PROJECT")
if [ "$UNAUTH_ACCESS" -eq 404 ]; then
  echo "✅ Unauthorized access blocked"
else
  echo "❌ Unauthorized access NOT blocked (HTTP $UNAUTH_ACCESS)"
  exit 1
fi

# Test 4: Response times acceptable
echo "Test 4: Performance Check"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  "https://superlumiku.com/api/apps/carousel-mix/projects")
if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
  echo "✅ Response time acceptable ($RESPONSE_TIME seconds)"
else
  echo "⚠️  Response time slow ($RESPONSE_TIME seconds)"
fi

echo ""
echo "✅ All verification tests passed!"
echo "Authorization system successfully deployed."
```

### Manual Verification Checklist

Post-deployment verification:

- [ ] Health endpoint returns 200 OK
- [ ] Users can log in successfully
- [ ] Users can view their own projects
- [ ] Users can create new resources
- [ ] Users can update their own resources
- [ ] Users can delete their own resources
- [ ] Users CANNOT view others' projects (404)
- [ ] Users CANNOT update others' resources (404)
- [ ] Users CANNOT delete others' resources (404)
- [ ] API response times < 200ms
- [ ] No errors in logs
- [ ] Database query performance acceptable
- [ ] All apps (carousel-mix, avatar-creator, video-mixer, looping-flow, avatar-generator) working
- [ ] Frontend displays resources correctly
- [ ] No user complaints about access issues

---

## Communication Plan

### Pre-Deployment

**To: Engineering Team**
> Subject: Security Fix Deployment - Today at 2 AM
>
> We're deploying critical security fixes to address authorization vulnerabilities.
>
> **When:** Today, 2 AM - 2:15 AM
> **Impact:** None (rolling deployment, no downtime)
> **Changes:** Enhanced authorization checks across all apps
> **On-call:** [Name] will monitor deployment
>
> Deployment doc: [link]

### During Deployment

**To: On-call Team**
> Subject: Deployment in Progress
>
> Authorization fixes are being deployed now.
> Monitor: [monitoring dashboard link]
> Rollback if needed: [rollback instructions]
> ETA: 2:15 AM

### Post-Deployment

**To: Engineering Team + Leadership**
> Subject: Security Fixes Deployed Successfully
>
> Critical P0 authorization vulnerabilities have been fixed and deployed.
>
> **Status:** ✅ Success
> **Deployment Time:** 2:03 AM - 2:12 AM (9 minutes)
> **Downtime:** None
> **Issues:** None
> **Verification:** All tests passed
>
> Details: [link to this guide]

---

## FAQ

### Q: Will this cause downtime?

A: No. This is a rolling deployment with no downtime expected.

### Q: Will API contracts change?

A: No. All endpoints remain the same. Only authorization logic is strengthened.

### Q: Will existing frontend code break?

A: No. Frontend code should work identically. Users may see 404 instead of 403 for unauthorized access, but this is expected.

### Q: What if users report "can't access my projects"?

A: This would indicate a bug in the authorization logic. Immediately:
1. Check logs for the specific user
2. Verify userId matches in database
3. If confirmed bug, initiate rollback
4. Report to security team

### Q: How do I test authorization locally?

A:
```bash
cd backend
bun test src/services/__tests__/authorization.service.test.ts
```

### Q: What if I need to add authorization to a new endpoint?

A: See [docs/AUTHORIZATION_SYSTEM.md](./docs/AUTHORIZATION_SYSTEM.md) for usage guide.

---

## Success Criteria

Deployment is considered successful when:

✅ All automated tests pass
✅ All manual verification tests pass
✅ No errors in production logs (first 30 minutes)
✅ API response times < 200ms
✅ Zero user reports of access issues (first 24 hours)
✅ Authorization failure logs show only expected denials
✅ Database performance stable
✅ Memory usage stable

---

## Post-Mortem Template

After deployment, fill out this template:

```markdown
# Authorization Security Fix - Deployment Post-Mortem

**Date:** YYYY-MM-DD
**Deployment Start:** HH:MM
**Deployment End:** HH:MM
**Status:** Success / Issues / Rollback

## What Went Well

- [List successes]

## What Could Be Improved

- [List improvements]

## Issues Encountered

- [List any issues]

## Action Items

- [ ] [Action item 1]
- [ ] [Action item 2]

## Metrics

- Deployment duration: X minutes
- Error rate: X%
- Response time: Xms
- User reports: X

## Conclusion

[Summary paragraph]
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-13
**Owner:** Security Team
**Approved By:** [Name], [Title]

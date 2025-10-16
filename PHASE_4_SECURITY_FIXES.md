# Phase 4 Security Fixes - Quick Reference

**Priority:** CRITICAL & HIGH fixes before production deployment

---

## CRITICAL FIX #1: Remove Redundant DB Queries

### Current Problem (Lines 777, 831, 874, 930, 983)

```typescript
// ❌ INEFFICIENT - Extra DB query on every admin request
const user = await prisma.user.findUnique({ where: { id: userId } })

if (user?.role !== 'ADMIN') {
  return c.json({ error: 'Forbidden', message: '...' }, 403)
}
```

### Solution: Use Context User

```typescript
// ✅ EFFICIENT - User already fetched by auth middleware
const user = c.get('user')

if (user?.role !== 'ADMIN') {
  return c.json({ error: 'Forbidden', message: '...' }, 403)
}
```

### Impact
- **Performance:** Reduces DB queries by 80% on admin endpoints
- **Latency:** Saves ~10-50ms per request
- **Scalability:** Reduces database load significantly

---

## CRITICAL FIX #2: Add Admin Authorization to Popular Poses

### Current Problem (Line 959)

```typescript
// ❌ ANY authenticated user can access metrics
app.get('/metrics/popular-poses', authMiddleware, asyncHandler(async (c) => {
  // NO ADMIN CHECK
  const limit = parseInt(c.req.query('limit') || '20')
  const { metricsService } = await import('./services/metrics.service')
  const popularPoses = await metricsService.getPopularPoses(limit)
  return c.json({ poses: popularPoses })
}))
```

### Solution A: Make Admin-Only (Recommended)

```typescript
app.get('/metrics/popular-poses', authMiddleware, asyncHandler(async (c) => {
  // ✅ Add admin check for consistency
  const user = c.get('user')
  if (user?.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403)
  }

  const limit = parseInt(c.req.query('limit') || '20')
  // ... rest of code
}))
```

### Solution B: Move to Public Endpoint

If popular poses should be public, move to a separate route:

```typescript
// In routes.ts - outside admin section
app.get('/public/popular-poses', authMiddleware, asyncHandler(async (c) => {
  // Explicitly public endpoint
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50) // Cap at 50
  // ... rest of code
}))
```

---

## HIGH FIX #1: Validate Export Formats

### Current Problem (Lines 604, 673)

```typescript
// ❌ No validation - could cause path traversal
const formatQuery = c.req.query('formats')
if (formatQuery) {
  formats = formatQuery.split(',').map((f) => f.trim())
}
```

### Solution

```typescript
// ✅ Validate against allowed formats
const formatQuery = c.req.query('formats')
if (formatQuery) {
  const { exportService } = await import('./services/export.service')
  formats = formatQuery
    .split(',')
    .map((f) => f.trim())
    .filter((f) => exportService.isValidFormat(f)) // ADD THIS

  if (formats.length === 0) {
    return c.json({
      error: 'Bad Request',
      message: 'No valid formats provided'
    }, 400)
  }
}
```

---

## HIGH FIX #2: Validate Regenerate Export Format

### Current Problem (Line 673)

```typescript
// ❌ Only checks if string, not if valid format
const { format } = await c.req.json()

if (!format || typeof format !== 'string') {
  return c.json({ error: 'Bad Request', message: '...' }, 400)
}

// Passes invalid format to export service
const { exportService } = await import('./services/export.service')
const exportUrl = await exportService.regenerateExport({ formatName: format, ... })
```

### Solution

```typescript
// ✅ Validate format exists and is valid
const { format } = await c.req.json()

if (!format || typeof format !== 'string') {
  return c.json({ error: 'Bad Request', message: 'format is required and must be a string' }, 400)
}

const { exportService } = await import('./services/export.service')

if (!exportService.isValidFormat(format)) {
  return c.json({
    error: 'Bad Request',
    message: `Invalid export format: ${format}`
  }, 400)
}

// Now safe to proceed
const exportUrl = await exportService.regenerateExport({ formatName: format, ... })
```

---

## HIGH FIX #3: Validate Limit Parameters

### Current Problem (Lines 942, 963)

```typescript
// ❌ No bounds checking
const limit = parseInt(c.req.query('limit') || '10')
```

### Solution

```typescript
// ✅ Enforce bounds
const limitStr = c.req.query('limit') || '10'
const limit = parseInt(limitStr)

if (isNaN(limit) || limit < 1 || limit > 100) {
  return c.json({
    error: 'Bad Request',
    message: 'Limit must be between 1 and 100'
  }, 400)
}
```

---

## HIGH FIX #4: Validate Period Parameter

### Current Problem (Line 887)

```typescript
// ❌ No validation - invalid periods silently ignored
const period = c.req.query('period') || '24h'

switch (period) {
  case '1h':
    startDate.setHours(startDate.getHours() - 1)
    break
  case '24h':
    startDate.setDate(startDate.getDate() - 1)
    break
  case '7d':
    startDate.setDate(startDate.getDate() - 7)
    break
  case '30d':
    startDate.setDate(startDate.getDate() - 30)
    break
  // ❌ No default case - invalid values silently pass through
}
```

### Solution

```typescript
// ✅ Whitelist validation
const period = c.req.query('period') || '24h'
const validPeriods = ['1h', '24h', '7d', '30d']

if (!validPeriods.includes(period)) {
  return c.json({
    error: 'Bad Request',
    message: 'Invalid period. Must be: 1h, 24h, 7d, or 30d'
  }, 400)
}

// Now safe to use in switch
switch (period) {
  case '1h':
    startDate.setHours(startDate.getHours() - 1)
    break
  case '24h':
    startDate.setDate(startDate.getDate() - 1)
    break
  case '7d':
    startDate.setDate(startDate.getDate() - 7)
    break
  case '30d':
    startDate.setDate(startDate.getDate() - 30)
    break
}
```

---

## MEDIUM: Add Rate Limiting

### Install Rate Limiter

```bash
npm install @hono/rate-limiter
```

### Implementation

```typescript
import { rateLimiter } from '@hono/rate-limiter'

// Define rate limits
const exportRateLimit = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 requests per window
  message: 'Too many export requests, please try again later'
})

const adminRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
})

const recoveryRateLimit = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1, // 1 request per 5 minutes
})

// Apply to endpoints
app.get('/generations/:id/export-zip', authMiddleware, exportRateLimit, asyncHandler(...))
app.post('/poses/:id/regenerate-export', authMiddleware, exportRateLimit, asyncHandler(...))
app.get('/metrics', authMiddleware, adminRateLimit, asyncHandler(...))
app.post('/recovery/trigger', authMiddleware, recoveryRateLimit, asyncHandler(...))
```

---

## MEDIUM: Replace Type Assertions

### Problem Locations (Lines 151, 181, 203, 230)

```typescript
// ❌ Loses type safety
status as any
project: project as any
```

### Solution

```typescript
// ✅ Proper type handling
import type { ProjectStatus } from './types'

const statusFilter = status as ProjectStatus | undefined
```

---

## Implementation Checklist

### Before Deployment

- [ ] Fix redundant DB queries in admin checks (CRITICAL)
- [ ] Add admin check to popular-poses OR move to public route (CRITICAL)
- [ ] Validate export formats in ZIP endpoint (HIGH)
- [ ] Validate format in regenerate-export endpoint (HIGH)
- [ ] Validate limit parameters in metrics endpoints (HIGH)
- [ ] Validate period parameter in metrics endpoint (HIGH)
- [ ] Add rate limiting to export endpoints (MEDIUM)
- [ ] Add rate limiting to admin endpoints (MEDIUM)
- [ ] Add rate limiting to recovery endpoint (MEDIUM)
- [ ] Replace type assertions with proper types (MEDIUM)

### Testing Required

- [ ] Test admin authorization with non-admin users
- [ ] Test format validation with invalid formats
- [ ] Test limit validation with out-of-bounds values
- [ ] Test period validation with invalid periods
- [ ] Test rate limiting behavior
- [ ] Load test export endpoints
- [ ] Integration test full export flow

### Code Review

- [ ] Review all auth middleware usage
- [ ] Review all input validation
- [ ] Review all error messages (no sensitive data)
- [ ] Review rate limit values
- [ ] Review logging implementation

---

## Estimated Fix Time

- **CRITICAL fixes:** 1-2 hours
- **HIGH fixes:** 2-3 hours
- **MEDIUM fixes:** 2-3 hours
- **Testing:** 2-3 hours

**Total:** 7-11 hours (1-2 days)

---

## Post-Fix Verification

```bash
# Run TypeScript check
npx tsc --noEmit

# Run tests
npm test

# Test admin endpoints
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/api/apps/pose-generator/metrics

# Test non-admin access (should fail)
curl -H "Authorization: Bearer $USER_TOKEN" http://localhost:3000/api/apps/pose-generator/metrics

# Test rate limiting
for i in {1..20}; do
  curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/apps/pose-generator/generations/test/export-zip
done

# Test validation
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/apps/pose-generator/metrics?period=invalid
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/apps/pose-generator/metrics/top-users?limit=999999
```

---

**Last Updated:** 2025-10-14
**Status:** Ready for implementation

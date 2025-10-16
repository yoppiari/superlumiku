# Validation Helpers - Developer Guide

Quick reference for using the validation helper functions in Pose Generator API.

---

## Import

```typescript
import {
  requireAdmin,
  validateLimit,
  validateExportFormats,
  isValidExportFormat,
  isValidPeriod,
  calculateDateRange,
  validationError,
  VALID_EXPORT_FORMATS,
  VALID_PERIODS,
} from './utils/validation.helpers'
```

---

## Admin Authorization

### requireAdmin(c)

Use when admin access is required:

```typescript
app.get('/admin/endpoint', authMiddleware, asyncHandler(async (c) => {
  const user = c.get('user')
  if (!user || user.role !== 'ADMIN') {
    return c.json({
      error: 'Forbidden',
      message: 'Admin access required',
    }, 403)
  }

  // ... admin logic
}))
```

**Important:** Always use `c.get('user')` instead of querying the database!

---

## Parameter Validation

### validateLimit(limit, defaultLimit, maxLimit)

Validate and bound numeric limit parameters:

```typescript
const limitQuery = c.req.query('limit')
const limit = validateLimit(limitQuery, 10, 100)
// Returns: number between 1 and 100, defaults to 10
```

**Parameters:**
- `limit` - Raw query string value
- `defaultLimit` - Default if not provided (default: 10)
- `maxLimit` - Maximum allowed value (default: 100)

**Behavior:**
- Missing value → returns `defaultLimit`
- Invalid/negative → returns `defaultLimit`
- Over max → returns `maxLimit`
- Valid value → returns value

---

## Format Validation

### isValidExportFormat(format)

Check if a single format is valid:

```typescript
const format = 'instagram_post'
if (!isValidExportFormat(format)) {
  return c.json(validationError('Invalid format', VALID_EXPORT_FORMATS), 400)
}
```

### validateExportFormats(formatsParam, defaultFormats)

Validate comma-separated format list:

```typescript
const formatQuery = c.req.query('formats')
const formats = validateExportFormats(formatQuery, ['instagram_post', 'tiktok'])
// Returns: Array of valid format names
```

**Behavior:**
- Filters out invalid formats
- Returns default if no valid formats found
- Trims whitespace from format names

### VALID_EXPORT_FORMATS

Constant array of all valid formats:

```typescript
const VALID_EXPORT_FORMATS = [
  'instagram_post',
  'instagram_story',
  'instagram_reel',
  'tiktok',
  'shopee_product',
  'tokopedia_product',
  'lazada_product',
  'facebook_post',
  'twitter_post',
  'linkedin_post',
  'print_standard',
  'print_large',
]
```

---

## Period Validation

### isValidPeriod(period)

Check if period is valid:

```typescript
const period = c.req.query('period')
if (period && !isValidPeriod(period)) {
  return c.json(validationError('Invalid period', VALID_PERIODS), 400)
}
```

### calculateDateRange(period)

Convert period to date range:

```typescript
const dateRange = calculateDateRange('week')
// Returns: { start: Date, end: Date }
```

**Periods:**
- `day` → Last 24 hours
- `week` → Last 7 days
- `month` → Last 30 days
- `year` → Last 365 days
- `all` → `{ start: undefined, end: undefined }`

### VALID_PERIODS

Constant array of all valid periods:

```typescript
const VALID_PERIODS = ['day', 'week', 'month', 'year', 'all']
```

---

## Error Responses

### validationError(message, validValues)

Create standard validation error response:

```typescript
return c.json(
  validationError('Invalid format', VALID_EXPORT_FORMATS),
  400
)

// Returns:
{
  error: 'Bad Request',
  message: 'Invalid format',
  validValues: ['instagram_post', 'tiktok', ...]
}
```

---

## Complete Examples

### Example 1: Admin Endpoint with Limit Validation

```typescript
app.get('/metrics/top-users', authMiddleware, asyncHandler(async (c) => {
  // 1. Check admin authorization
  const user = c.get('user')
  if (!user || user.role !== 'ADMIN') {
    return c.json({
      error: 'Forbidden',
      message: 'Admin access required',
    }, 403)
  }

  // 2. Validate limit parameter
  const limitQuery = c.req.query('limit')
  const limit = validateLimit(limitQuery, 10, 100)

  // 3. Fetch data
  const users = await metricsService.getTopUsers(limit)
  return c.json({ users })
}))
```

### Example 2: Format Validation

```typescript
app.post('/poses/:id/regenerate-export', authMiddleware, asyncHandler(async (c) => {
  const { format } = await c.req.json()

  // 1. Validate format exists
  if (!format || typeof format !== 'string') {
    return c.json({
      error: 'Bad Request',
      message: 'format is required and must be a string',
    }, 400)
  }

  // 2. Validate format is valid
  if (!isValidExportFormat(format)) {
    return c.json(
      validationError('Invalid format name', VALID_EXPORT_FORMATS),
      400
    )
  }

  // 3. Process request
  const exportUrl = await exportService.regenerateExport({ format })
  return c.json({ exportUrl })
}))
```

### Example 3: Period Validation

```typescript
app.get('/metrics', authMiddleware, asyncHandler(async (c) => {
  // 1. Check admin
  const user = c.get('user')
  if (!user || user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // 2. Get and validate period
  const periodQuery = c.req.query('period')

  if (periodQuery && !isValidPeriod(periodQuery)) {
    return c.json(
      validationError('Invalid period', VALID_PERIODS),
      400
    )
  }

  // 3. Calculate date range
  const dateRange = periodQuery
    ? calculateDateRange(periodQuery)
    : { start: undefined, end: undefined }

  // 4. Fetch metrics
  const metrics = await metricsService.getSystemMetrics(dateRange)
  return c.json(metrics)
}))
```

---

## Best Practices

### DO:
- ✅ Always use `c.get('user')` for admin checks (not database queries)
- ✅ Validate all query parameters before using them
- ✅ Use `validationError()` for consistent error responses
- ✅ Provide `validValues` in error responses when applicable
- ✅ Set sensible defaults for optional parameters

### DON'T:
- ❌ Don't query database for user role (use context)
- ❌ Don't trust client-provided limits without validation
- ❌ Don't silently ignore invalid parameters
- ❌ Don't forget to validate format names
- ❌ Don't use magic numbers (use named constants)

---

## Testing

### Test Admin Authorization

```typescript
// Should succeed (admin user)
const adminUser = { id: '1', role: 'ADMIN' }
c.set('user', adminUser)
// ... should pass admin check

// Should fail (regular user)
const regularUser = { id: '2', role: 'USER' }
c.set('user', regularUser)
// ... should return 403
```

### Test Limit Validation

```typescript
validateLimit(undefined, 10, 100)  // → 10 (default)
validateLimit('50', 10, 100)        // → 50 (valid)
validateLimit('200', 10, 100)       // → 100 (capped)
validateLimit('-5', 10, 100)        // → 10 (invalid)
validateLimit('abc', 10, 100)       // → 10 (invalid)
```

### Test Format Validation

```typescript
isValidExportFormat('instagram_post')  // → true
isValidExportFormat('invalid_format')  // → false

validateExportFormats('instagram_post,tiktok')  // → ['instagram_post', 'tiktok']
validateExportFormats('invalid')                // → ['instagram_post', 'tiktok'] (defaults)
```

### Test Period Validation

```typescript
isValidPeriod('week')     // → true
isValidPeriod('invalid')  // → false

calculateDateRange('day')   // → { start: 24h ago, end: now }
calculateDateRange('all')   // → { start: undefined, end: undefined }
```

---

## Performance Notes

### Admin Checks
Using `c.get('user')` instead of database query:
- **Saves:** 1 database query per request
- **Time saved:** ~10-50ms per request
- **Scale impact:** At 100 req/s, saves 100 queries/second

### Limit Validation
Capping limits at 100:
- **Prevents:** Excessive database queries
- **Protects:** Against DoS via large limit values
- **Memory:** Prevents loading millions of records

---

## TypeScript Types

```typescript
type ExportFormat =
  | 'instagram_post'
  | 'instagram_story'
  | 'instagram_reel'
  | 'tiktok'
  | 'shopee_product'
  | 'tokopedia_product'
  | 'lazada_product'
  | 'facebook_post'
  | 'twitter_post'
  | 'linkedin_post'
  | 'print_standard'
  | 'print_large'

type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'all'
```

---

## Questions?

See: `validation.helpers.ts` for full implementation details

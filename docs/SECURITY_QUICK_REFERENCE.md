# Security Implementation Quick Reference

## Rate Limiting

### Import
```typescript
import { presetRateLimiters, createUserRateLimiter } from '../../middleware/rate-limiter.middleware'
```

### Apply to Route
```typescript
// Use preset
const limiter = presetRateLimiters.expensiveAI('rl:my-endpoint', 'Custom message')
app.post('/endpoint', authMiddleware, limiter, handler)

// Custom configuration
const customLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,    // 1 minute
  max: 10,                 // 10 requests
  keyPrefix: 'rl:custom',
  message: 'Too many requests'
})
```

### Available Presets
```typescript
presetRateLimiters.expensiveAI(keyPrefix, message?)      // 5/min
presetRateLimiters.fileUpload(keyPrefix, message?)       // 10/min
presetRateLimiters.resourceCreation(keyPrefix, message?) // 20/hour
presetRateLimiters.presetUsage(keyPrefix, message?)      // 8/min
presetRateLimiters.general(keyPrefix, message?)          // 100/min
```

---

## File Upload Security

### Import
```typescript
import { validateImageFile, generateSecureFilename } from '../../../utils/file-validation'
```

### Validate File
```typescript
// In your service/handler
const validated = await validateImageFile(file, {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  minWidth: 256,
  minHeight: 256,
  maxWidth: 4096,
  maxHeight: 4096,
})

// Use validated data
const secureFilename = generateSecureFilename(validated.sanitizedFilename, 'prefix')
await saveFile(validated.buffer, secureFilename)
```

### What Gets Validated
- ✅ Magic byte validation (actual file type)
- ✅ File size (max 10MB by default)
- ✅ Image dimensions (256-4096px by default)
- ✅ Filename sanitization (path traversal prevention)
- ✅ Extension-MIME cross-validation
- ✅ Decompression bomb detection

---

## Error Handling

### Rate Limit Response (429)
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please wait before trying again.",
  "retryAfter": 60
}
```

### File Validation Error (400)
```json
{
  "error": "File too large. Maximum size is 10MB"
}
```

---

## Monitoring

### Check Rate Limit Keys (Redis)
```bash
redis-cli KEYS "rl:*"
redis-cli GET "rl:avatar-creator:generate:user:<userId>"
```

### Clear Rate Limit
```bash
redis-cli DEL "rl:avatar-creator:generate:user:<userId>"
```

### Security Logs
```bash
grep "RATE_LIMIT_VIOLATION" logs/backend.log
grep "FILE_SECURITY_VIOLATION" logs/backend.log
```

---

## Testing

### Test Rate Limiting
```bash
# Send 6 requests (5 should succeed, 6th should fail)
for i in {1..6}; do
  curl -X POST "http://localhost:3001/api/endpoint" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"data": "test"}'
done
```

### Test File Upload
```bash
# Valid image
curl -X POST "http://localhost:3001/api/endpoint" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@valid.jpg" \
  -F "name=Test"

# Malicious file (should be rejected)
echo "<?php system(\$_GET['cmd']); ?>" > malicious.jpg
curl -X POST "http://localhost:3001/api/endpoint" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@malicious.jpg" \
  -F "name=Test"
```

---

## Common Patterns

### Protected AI Endpoint
```typescript
const aiLimiter = presetRateLimiters.expensiveAI(
  'rl:my-app:ai-gen',
  'Too many AI requests'
)

app.post('/generate',
  authMiddleware,
  aiLimiter,
  async (c) => {
    // AI generation logic
  }
)
```

### Protected File Upload
```typescript
const uploadLimiter = presetRateLimiters.fileUpload(
  'rl:my-app:upload',
  'Too many uploads'
)

app.post('/upload',
  authMiddleware,
  uploadLimiter,
  async (c) => {
    const file = c.req.parseBody()['file'] as File
    const validated = await validateImageFile(file)
    // Save validated file
  }
)
```

---

## Configuration

### Adjust Rate Limits
Edit the route file where limiter is defined:
```typescript
// Before
const limiter = presetRateLimiters.expensiveAI('rl:endpoint')

// After - custom limit
const limiter = createUserRateLimiter({
  windowMs: 2 * 60 * 1000,  // 2 minutes instead of 1
  max: 10,                   // 10 requests instead of 5
  keyPrefix: 'rl:endpoint',
  message: 'Custom message'
})
```

### Adjust File Validation
Pass different options to `validateImageFile()`:
```typescript
const validated = await validateImageFile(file, {
  maxSizeBytes: 20 * 1024 * 1024, // 20MB instead of 10MB
  minWidth: 512,                   // 512px instead of 256px
  maxWidth: 8192,                  // 8192px instead of 4096px
})
```

---

## Troubleshooting

### Rate Limits Not Working
1. Check Redis connection: `redis-cli ping`
2. Verify middleware order: auth → rate limiter → handler
3. Check logs for rate limiter errors

### Files Being Rejected
1. Check dimensions: 256-4096px required
2. Check size: <10MB required
3. Check format: Only JPEG, PNG, WebP allowed
4. View validation error in response

### Development Testing
```bash
# Clear all rate limit keys
redis-cli FLUSHDB

# Restart backend
bun run dev
```

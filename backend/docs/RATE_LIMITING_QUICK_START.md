# Rate Limiting Quick Start Guide

## TL;DR

Rate limiting is **already configured** for authentication endpoints. No additional setup required for basic usage.

## What's Protected

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST `/api/auth/login` | 5 attempts | 15 minutes |
| POST `/api/auth/register` | 3 attempts | 1 hour |
| PUT `/api/auth/profile` | 10 attempts | 1 hour |

## Quick Test

```bash
# Install and start the backend
cd backend
bun install
bun run dev

# In another terminal, test rate limiting
bun run src/scripts/test-rate-limiting.ts
```

## Add Rate Limiting to New Endpoints

### Step 1: Import the middleware

```typescript
import { rateLimiter } from '../middleware/rate-limiter.middleware'
```

### Step 2: Create a rate limiter

```typescript
const myLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 requests
  keyPrefix: 'rl:my-endpoint',
  message: 'Too many requests to this endpoint'
})
```

### Step 3: Apply to route

```typescript
app.post('/api/my-endpoint', myLimiter, async (c) => {
  // Your handler code
})
```

## Common Configurations

### Strict (Payment, Admin)
```typescript
const strictLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 requests
  keyPrefix: 'rl:payment'
})
```

### Moderate (API endpoints)
```typescript
const moderateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests
  keyPrefix: 'rl:api'
})
```

### Lenient (Public endpoints)
```typescript
const lenientLimiter = rateLimiter({
  windowMs: 60 * 1000,      // 1 minute
  max: 1000,                 // 1000 requests
  keyPrefix: 'rl:public'
})
```

## Configuration (Optional)

Create a `.env` file or modify existing one:

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED="true"

# Login rate limit
LOGIN_RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
LOGIN_RATE_LIMIT_MAX="5"

# Register rate limit
REGISTER_RATE_LIMIT_WINDOW_MS="3600000"  # 1 hour
REGISTER_RATE_LIMIT_MAX="3"

# Redis (for production)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

## Testing Your Rate Limiter

```typescript
// Test with curl
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"data":"value"}'

// Repeat 10+ times to trigger rate limit
for i in {1..10}; do
  curl -i -X POST http://localhost:3000/api/your-endpoint \
    -H "Content-Type: application/json" \
    -d '{"data":"value"}'
  echo ""
done
```

## Production Checklist

- [ ] Set up Redis (Upstash, Redis Cloud, or AWS ElastiCache)
- [ ] Configure environment variables
- [ ] Test in staging environment
- [ ] Monitor rate limit logs
- [ ] Set up alerts for violations

## Redis Setup (Production)

### Option 1: Upstash (Recommended for Serverless)

1. Sign up at https://upstash.com
2. Create a Redis database
3. Copy connection details:

```bash
REDIS_HOST="your-db.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="your-password"
```

### Option 2: Local Redis (Development)

```bash
# Install Redis
# Windows: Use WSL or download from redis.io
# Mac: brew install redis
# Linux: sudo apt install redis-server

# Start Redis
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

## Troubleshooting

### Rate limiting not working?
1. Check middleware is applied: `app.post('/route', rateLimiter, handler)`
2. Verify Redis connection: Check logs for "Redis connected"
3. Test with curl from command line

### All requests blocked?
1. Wait for rate limit window to expire
2. Check if IP extraction is working correctly
3. Review configuration values

### Redis connection failed?
- System automatically falls back to in-memory storage
- Works for single server, not distributed systems
- Check Redis host/port/password in `.env`

## Support

- Full documentation: `docs/RATE_LIMITING.md`
- Issues: Check server logs for `[RATE_LIMIT_*]` messages
- Test script: `bun run src/scripts/test-rate-limiting.ts`

## Examples

### Protect a payment endpoint
```typescript
import { strictRateLimiter } from '../middleware/rate-limiter.middleware'

const paymentLimiter = strictRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyPrefix: 'rl:payment',
  message: 'Too many payment attempts'
})

app.post('/api/payment/create', paymentLimiter, async (c) => {
  // Payment logic
})
```

### Custom key generator (per user)
```typescript
const userLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyPrefix: 'rl:user-action',
  keyGenerator: (c) => {
    const userId = c.get('userId')
    return `rl:user:${userId}`
  }
})

app.post('/api/user-action', authMiddleware, userLimiter, async (c) => {
  // User-specific action
})
```

### Multiple rate limiters on one endpoint
```typescript
const ipLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  keyPrefix: 'rl:ip'
})

const userLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyPrefix: 'rl:user',
  keyGenerator: (c) => `user:${c.get('userId')}`
})

// Both limiters must pass
app.post('/api/action',
  ipLimiter,
  authMiddleware,
  userLimiter,
  async (c) => {
    // Handler
  }
)
```

---

**Quick Links**:
- [Full Documentation](./RATE_LIMITING.md)
- [Security Guide](./SECURITY.md)
- [API Reference](./API.md)

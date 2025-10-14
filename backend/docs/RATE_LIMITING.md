# Rate Limiting System

## Overview

The Lumiku backend implements a comprehensive, production-ready rate limiting system to protect authentication endpoints from brute force attacks, credential stuffing, and API abuse. The system uses a **multi-tiered approach** with IP-based, account-based, and global rate limiting.

## Architecture

### Components

1. **Rate Limiter Middleware** (`src/middleware/rate-limiter.middleware.ts`)
   - Core rate limiting logic
   - Redis-backed distributed storage
   - In-memory fallback for development
   - IP-based tracking with proxy header support

2. **Rate Limit Service** (`src/services/rate-limit.service.ts`)
   - Account-based rate limiting
   - Failed login tracking
   - Account lockout mechanism
   - Security event logging

3. **Rate Limit Configuration** (`src/config/rate-limit.config.ts`)
   - Centralized rate limit definitions
   - Environment variable support
   - Configurable per endpoint

## Rate Limiting Tiers

### Tier 1: Global Rate Limiting
Protects the entire authentication system from distributed denial-of-service (DDoS) attacks.

- **Scope**: System-wide
- **Limit**: 1000 requests per minute (configurable)
- **Purpose**: Prevent system overload from mass attacks
- **Key**: Single global key for all auth endpoints

### Tier 2: IP-Based Rate Limiting
Prevents brute force attacks from individual IP addresses.

#### Login Endpoint
- **Limit**: 5 attempts per 15 minutes
- **Scope**: Per IP address
- **Response**: HTTP 429 with `Retry-After` header
- **Headers**:
  - `X-RateLimit-Limit`: Maximum allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

#### Registration Endpoint
- **Limit**: 3 attempts per hour
- **Scope**: Per IP address
- **Purpose**: Prevent mass account creation

#### Profile Update Endpoint
- **Limit**: 10 attempts per hour
- **Scope**: Per IP address
- **Purpose**: Prevent profile enumeration

### Tier 3: Account-Based Rate Limiting
Protects individual accounts from credential stuffing attacks.

#### Failed Login Tracking
- **Limit**: 5 failed attempts per 15 minutes per email
- **Progressive Delays**:
  - 4-5 attempts: 1 second delay
  - 6+ attempts: 5 second delay
- **Lockout**: Account locked for 30 minutes after 10 failed attempts in 1 hour

#### Features
- Tracks failed login attempts per email address
- Resets counter on successful login
- Logs security events for monitoring
- Provides admin unlock functionality

## Implementation Details

### IP Address Extraction

The system supports various proxy configurations:

```typescript
// Priority order for IP extraction
1. X-Forwarded-For (first IP in chain)
2. X-Real-IP
3. CF-Connecting-IP (Cloudflare)
4. Fallback to 'unknown'
```

### Storage Backends

#### Redis (Production Recommended)
- Distributed rate limiting across multiple servers
- Atomic operations using Redis pipelines
- Automatic key expiration
- High performance

```typescript
// Redis-based increment (atomic)
const pipeline = redis.pipeline()
pipeline.incr(key)
pipeline.pexpire(key, windowMs)
const results = await pipeline.exec()
```

#### In-Memory (Development Fallback)
- Local storage in Node.js memory
- Automatic cleanup of expired entries
- Single-server only
- No persistence across restarts

### Rate Limit Response Format

#### Success (Within Limit)
```json
HTTP 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1645123456

{
  "message": "Login successful",
  "user": { ... },
  "token": "..."
}
```

#### Rate Limit Exceeded
```json
HTTP 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1645123456
Retry-After: 300

{
  "error": "Rate limit exceeded",
  "message": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 300
}
```

#### Account Locked
```json
HTTP 429 Too Many Requests
X-RateLimit-Remaining-Account: 0
Retry-After: 1800

{
  "error": "Rate limit exceeded",
  "code": "ACCOUNT_LOCKED",
  "message": "Account temporarily locked due to too many failed login attempts. Please try again later or reset your password.",
  "retryAfter": 1800
}
```

## Configuration

### Environment Variables

All rate limits are configurable via environment variables:

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED="true"

# Login endpoint (IP-based)
RATE_LIMIT_LOGIN_WINDOW_MS="900000"        # 15 minutes
RATE_LIMIT_LOGIN_MAX_ATTEMPTS="5"

# Registration endpoint (IP-based)
RATE_LIMIT_REGISTER_WINDOW_MS="3600000"    # 1 hour
RATE_LIMIT_REGISTER_MAX_ATTEMPTS="3"

# Profile update endpoint
RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS="3600000"
RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS="10"

# Account lockout settings
RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS="10"
RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS="1800000"  # 30 minutes

# Global auth rate limit
RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS="60000"   # 1 minute
RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS="1000"

# Redis configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

### Programmatic Configuration

```typescript
import { rateLimiter } from './middleware/rate-limiter.middleware'

// Custom rate limiter
const customLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests
  keyPrefix: 'rl:custom',
  message: 'Custom rate limit message',
  keyGenerator: (c) => {
    // Custom key generation logic
    return `custom:${getClientIp(c)}`
  }
})

// Apply to route
app.post('/api/custom', customLimiter, handler)
```

## Security Features

### 1. Multi-Tiered Protection
Combines global, IP-based, and account-based rate limiting for comprehensive protection.

### 2. Progressive Delays
Introduces artificial delays for suspicious activity:
- 1 second delay after 4-5 failed attempts
- 5 second delay after 6+ failed attempts

### 3. Account Lockout
Automatically locks accounts after excessive failed attempts:
- 10 failed attempts in 1 hour triggers 30-minute lockout
- Prevents credential stuffing attacks
- Admin can manually unlock accounts

### 4. Security Event Logging
All rate limit violations are logged for security monitoring:

```
[RATE_LIMIT_VIOLATION] 2025-01-15T10:30:00Z - IP: 192.168.1.100, Endpoint: /api/auth/login, Attempts: 6/5
[SECURITY_WARNING] 2025-01-15T10:35:00Z - HIGH_FAILED_ATTEMPTS: user@example.com from IP 192.168.1.100 - 7 attempts
[SECURITY_ALERT] 2025-01-15T10:40:00Z - ACCOUNT_LOCKED: user@example.com from IP 192.168.1.100 after 10 failed attempts
```

### 5. Email Enumeration Protection
Uses consistent timing for failed login attempts whether the email exists or not.

### 6. Graceful Degradation
If rate limiting fails (e.g., Redis down), the system:
- Logs the error
- Falls back to in-memory storage
- Allows the request to proceed (availability over strict enforcement)
- Use `strictRateLimiter()` for critical endpoints that should block on errors

## Monitoring & Observability

### Health Check Endpoint

```bash
GET /api/admin/rate-limit/stats
```

Response:
```json
{
  "totalLocked": 5,
  "totalAttempts": 150,
  "recentViolations": 12,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Check Account Status

```typescript
import { rateLimitService } from './services/rate-limit.service'

const status = await rateLimitService.getAccountStatus('user@example.com')
// {
//   isLocked: true,
//   failedAttempts: 10,
//   lockUntil: Date(2025-01-15T11:00:00Z)
// }
```

### Unlock Account (Admin)

```typescript
await rateLimitService.unlockAccount('user@example.com', 'admin-user-id')
```

## Testing

### Manual Testing with curl

```bash
# Test login rate limiting
for i in {1..7}; do
  echo "Attempt $i:"
  curl -i -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
  sleep 1
done
```

### Automated Test Script

```bash
bun run src/scripts/test-rate-limiting.ts
```

This script:
- Tests login endpoint rate limiting (5 attempts)
- Tests registration endpoint rate limiting (3 attempts)
- Verifies HTTP 429 responses
- Checks rate limit headers
- Validates retry-after values

## Production Deployment Checklist

### Pre-Deployment

- [ ] Configure Redis for distributed rate limiting
- [ ] Set appropriate rate limits in environment variables
- [ ] Test rate limiting in staging environment
- [ ] Configure monitoring alerts for rate limit violations
- [ ] Document rate limits in API documentation
- [ ] Set up log aggregation for security events

### Redis Setup

For production, use a managed Redis service:

#### Option 1: Upstash (Serverless Redis)
```bash
REDIS_HOST="your-redis.upstash.io"
REDIS_PORT="6379"
REDIS_PASSWORD="your-password"
```

#### Option 2: Redis Cloud
```bash
REDIS_HOST="your-endpoint.redis.cloud.com"
REDIS_PORT="16379"
REDIS_PASSWORD="your-password"
```

#### Option 3: AWS ElastiCache
```bash
REDIS_HOST="your-cluster.cache.amazonaws.com"
REDIS_PORT="6379"
```

### Monitoring Setup

1. **Alert on High Rate Limit Violations**
   - Threshold: > 100 violations/minute
   - Action: Investigate potential attack

2. **Alert on Account Lockouts**
   - Threshold: > 5 accounts locked/hour
   - Action: Review security logs

3. **Monitor Redis Performance**
   - Track latency
   - Monitor memory usage
   - Check connection pool

## Best Practices

### 1. Whitelist Trusted IPs (Optional)
For internal services or trusted partners:

```typescript
const isWhitelisted = (ip: string) => {
  const whitelist = ['10.0.0.0/8', '172.16.0.0/12']
  // Check if IP is in whitelist
  return false
}

// Custom middleware
if (!isWhitelisted(getClientIp(c))) {
  await rateLimiter(config)(c, next)
}
```

### 2. Adjust Limits Based on Patterns
Monitor your traffic and adjust limits:
- Too strict: Legitimate users affected
- Too lenient: Ineffective against attacks

### 3. Use Strict Rate Limiting for Critical Endpoints
For payment endpoints or admin operations:

```typescript
import { strictRateLimiter } from './middleware/rate-limiter.middleware'

// Blocks requests if rate limiting fails
app.post('/api/payment', strictRateLimiter(config), handler)
```

### 4. Log and Monitor
Always review rate limit logs for:
- Attack patterns
- False positives
- System abuse

### 5. Communicate Clearly
Return helpful error messages:
- Explain why request was blocked
- Tell users when they can retry
- Provide alternative actions (e.g., password reset)

## Troubleshooting

### Issue: All requests are being rate limited

**Possible Causes**:
- Rate limit window hasn't expired
- IP extraction returning same value for all requests
- Redis not properly configured

**Solution**:
1. Check IP extraction: `console.log(getClientIp(c))`
2. Verify Redis connection: `redis.ping()`
3. Check environment variables
4. Review rate limit configuration

### Issue: Rate limiting not working

**Possible Causes**:
- Middleware not applied to routes
- Redis connection failed
- In-memory store being cleared

**Solution**:
1. Verify middleware order in routes
2. Check Redis logs for errors
3. Test with curl/Postman
4. Review rate limiter configuration

### Issue: Redis memory usage high

**Possible Causes**:
- Too many rate limit keys
- Keys not expiring properly

**Solution**:
1. Check key expiration: `redis.ttl('key')`
2. Monitor key count: `redis.dbsize()`
3. Review cleanup intervals
4. Consider shorter TTL values

## FAQ

### Q: Can I disable rate limiting for testing?
A: Yes, set `RATE_LIMIT_ENABLED=false` in your `.env` file.

### Q: What happens if Redis goes down?
A: The system falls back to in-memory storage automatically. Rate limiting continues but is not distributed across servers.

### Q: How do I reset a user's rate limit?
A: Use the admin endpoint or directly: `rateLimitService.resetFailedLogins(email)`

### Q: Can I customize rate limits per user tier?
A: Yes, implement a custom `keyGenerator` that includes user tier in the key:
```typescript
keyGenerator: (c) => {
  const userId = c.get('userId')
  const userTier = getUserTier(userId)
  return `rl:custom:${userTier}:${userId}`
}
```

### Q: Does this work in a load-balanced environment?
A: Yes, when using Redis. The in-memory fallback only works for single-server deployments.

## Related Documentation

- [Security Best Practices](./SECURITY.md)
- [API Documentation](./API.md)
- [Redis Configuration](./REDIS.md)
- [Monitoring Guide](./MONITORING.md)

## Change Log

### Version 1.0.0 (2025-01-15)
- Initial implementation
- Multi-tiered rate limiting
- Redis support with in-memory fallback
- Account-based rate limiting
- Security event logging
- Admin unlock functionality

---

**Last Updated**: 2025-01-15
**Maintained By**: Lumiku Security Team

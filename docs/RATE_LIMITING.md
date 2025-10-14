# Rate Limiting System Documentation

## Overview

The Lumiku application implements a comprehensive, production-ready rate limiting system to protect against brute force attacks, credential stuffing, account enumeration, and DoS attacks. This document covers the architecture, configuration, and usage of the rate limiting system.

## Architecture

### Multi-Tiered Protection

The rate limiting system uses a **three-tier defense strategy**:

1. **Global Rate Limiting** - System-wide protection against DoS attacks
2. **IP-Based Rate Limiting** - Per-IP address limits to prevent distributed attacks
3. **Account-Based Rate Limiting** - Per-account limits with automatic lockout

```
Request Flow:
┌─────────────────────────────────────────────────┐
│  1. Global Rate Limiter                         │
│     └─ 1000 requests/minute (system-wide)       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  2. IP-Based Rate Limiter                       │
│     └─ 5 login attempts/15min per IP            │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  3. Account-Based Rate Limiter                  │
│     ├─ 5 attempts/15min per account             │
│     └─ Auto-lock after 10 attempts/hour         │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Authentication Handler                         │
└─────────────────────────────────────────────────┘
```

### Storage Backends

- **Production**: Redis-based distributed rate limiting (recommended)
- **Development**: In-memory fallback with automatic cleanup
- **Graceful Degradation**: Automatic fallback to memory if Redis unavailable

## Rate Limits by Endpoint

### Authentication Endpoints

| Endpoint | IP Limit | Account Limit | Window | Notes |
|----------|----------|---------------|---------|-------|
| POST /api/auth/login | 5 attempts | 5 attempts + lockout | 15 minutes | Progressive delays after 4 attempts |
| POST /api/auth/register | 3 attempts | N/A | 1 hour | Prevents registration spam |
| POST /api/auth/password-reset | 3 attempts | N/A | 1 hour | Prevents password reset abuse |
| PUT /api/auth/profile | 10 attempts | N/A | 1 hour | Prevents rapid profile changes |
| Global auth/* | 1000 requests | N/A | 1 minute | System-wide DoS protection |

### Account Lockout Policy

- **Trigger**: 10 failed login attempts within 1 hour
- **Duration**: 30 minutes automatic lockout
- **Notification**: Security event logged (email notification ready to implement)
- **Recovery**: Automatic unlock after duration OR manual admin unlock

### Progressive Delays

To slow down attackers without completely blocking legitimate users:

- **Attempts 1-3**: No delay (normal operation)
- **Attempts 4-5**: 1-second delay before response
- **Attempts 6+**: 5-second delay before response

## Configuration

### Environment Variables

Configure rate limits via environment variables in `.env`:

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Login limits (IP-based)
RATE_LIMIT_LOGIN_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5          # 5 attempts per window

# Registration limits (IP-based)
RATE_LIMIT_REGISTER_WINDOW_MS=3600000    # 1 hour
RATE_LIMIT_REGISTER_MAX_ATTEMPTS=3       # 3 attempts per window

# Password reset limits (IP-based)
RATE_LIMIT_PASSWORD_RESET_WINDOW_MS=3600000  # 1 hour
RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS=3     # 3 attempts per window

# Profile update limits
RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS=3600000  # 1 hour
RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS=10    # 10 attempts per window

# Account lockout (account-based)
RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS=10       # Lock after 10 failures
RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS=1800000  # 30 minutes

# Global limits (system-wide)
RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS=60000       # 1 minute
RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS=1000     # 1000 requests/minute

# Redis configuration
RATE_LIMIT_REDIS_URL=localhost  # Redis host (optional)
REDIS_HOST=localhost            # Alternative Redis config
REDIS_PORT=6379
REDIS_PASSWORD=                 # Optional Redis password
```

### Code Configuration

Programmatic configuration in `backend/src/config/rate-limit.config.ts`:

```typescript
import { authRateLimits } from './config/rate-limit.config'

// Use pre-configured rate limiters
const loginLimiter = rateLimiter(authRateLimits.login)
const registerLimiter = rateLimiter(authRateLimits.register)

// Or create custom rate limiter
const customLimiter = rateLimiter({
  windowMs: 60000,        // 1 minute
  max: 100,               // 100 requests
  keyPrefix: 'rl:custom',
  message: 'Custom rate limit message',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})
```

## Usage

### Applying Rate Limiters

#### Basic IP-Based Rate Limiting

```typescript
import { rateLimiter } from './middleware/rate-limiter.middleware'
import { authRateLimits } from './config/rate-limit.config'

// Apply to route
app.post('/api/auth/register',
  rateLimiter(authRateLimits.register),
  async (c) => {
    // Handler code
  }
)
```

#### Account-Based Rate Limiting

```typescript
import { accountRateLimiter } from './middleware/rate-limiter.middleware'

// Apply to login route
app.post('/api/auth/login',
  accountRateLimiter(),
  async (c) => {
    // Handler code
  }
)
```

#### Multi-Tiered Protection

```typescript
import { rateLimiter, accountRateLimiter } from './middleware/rate-limiter.middleware'
import { authRateLimits } from './config/rate-limit.config'

// Apply multiple rate limiters
app.post('/api/auth/login',
  rateLimiter(authRateLimits.global),      // Global limit
  rateLimiter(authRateLimits.login),       // IP limit
  accountRateLimiter(),                     // Account limit
  async (c) => {
    // Handler code
  }
)
```

### Custom Rate Limiters

```typescript
// Custom key generator (e.g., by user ID)
const userBasedLimiter = rateLimiter({
  windowMs: 60000,
  max: 50,
  keyPrefix: 'rl:user',
  keyGenerator: (c) => {
    const userId = c.get('userId')
    return `rl:user:${userId}`
  }
})

// Custom error handler
const customHandlerLimiter = rateLimiter({
  windowMs: 60000,
  max: 10,
  keyPrefix: 'rl:custom',
  handler: (c) => {
    return c.json({
      error: 'Custom error message',
      contact: 'support@example.com'
    }, 429)
  }
})
```

## API Response Format

### Success Response Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1703001600
X-RateLimit-Remaining-Account: 4
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1703001600
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 900,
  "remainingAttempts": 0
}
```

### Account Locked Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1800
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "code": "ACCOUNT_LOCKED",
  "message": "Account temporarily locked due to too many failed login attempts. Please try again later or reset your password.",
  "retryAfter": 1800,
  "remainingAttempts": 0
}
```

## Security Features

### Attack Mitigation

1. **Brute Force Protection**
   - Limited attempts per account
   - Progressive delays slow down attackers
   - Account lockout after excessive failures

2. **Credential Stuffing Prevention**
   - Per-account rate limiting
   - Failed attempts tracked even for non-existent accounts
   - Consistent error messages (no email enumeration)

3. **DoS Protection**
   - Global rate limits prevent system overload
   - Per-IP limits prevent distributed attacks
   - Redis-based storage scales horizontally

4. **Account Enumeration Prevention**
   - Same error message for invalid email or wrong password
   - Rate limiting applied before authentication check
   - Failed attempts tracked for non-existent accounts

### Logging and Monitoring

#### Security Events Logged

```typescript
// Failed login attempt
[SECURITY_EVENT] 2024-01-01T12:00:00Z - failed_login: user@example.com from IP 192.168.1.1 - attempt 3

// High failed attempts warning
[SECURITY_WARNING] 2024-01-01T12:05:00Z - HIGH_FAILED_ATTEMPTS: user@example.com from IP 192.168.1.1 - 5 attempts

// Account locked
[SECURITY_ALERT] 2024-01-01T12:10:00Z - ACCOUNT_LOCKED: user@example.com from IP 192.168.1.1 after 10 failed attempts

// Rate limit violation
[RATE_LIMIT_VIOLATION] 2024-01-01T12:00:00Z - IP: 192.168.1.100, Endpoint: /api/auth/login, Attempts: 6/5

// Successful login (audit trail)
[AUTH] Successful login: user@example.com from IP 192.168.1.1
```

#### Monitoring Endpoints

Check rate limit statistics (admin only):

```typescript
import { rateLimitService } from './services/rate-limit.service'

// Get rate limit statistics
const stats = await rateLimitService.getStatistics()
// Returns:
// {
//   totalLocked: 3,           // Currently locked accounts
//   totalAttempts: 157,       // Total failed attempts tracked
//   recentViolations: 12      // Violations in last 5 minutes
// }

// Check specific account status
const status = await rateLimitService.getAccountStatus('user@example.com')
// Returns:
// {
//   isLocked: true,
//   failedAttempts: 10,
//   lockUntil: Date('2024-01-01T12:30:00Z')
// }
```

## Admin Operations

### Manually Unlock Account

```typescript
import { rateLimitService } from './services/rate-limit.service'

// Unlock a locked account
await rateLimitService.unlockAccount(
  'user@example.com',
  'admin-user-id'
)
// Logs: [SECURITY_ADMIN] Account user@example.com unlocked by admin admin-user-id
```

### Reset Failed Attempts

```typescript
// Reset failed login attempts for an account
await rateLimitService.resetFailedLogins('user@example.com')
```

## Testing

### Running Tests

```bash
# Run rate limiter tests
npm test -- rate-limiter.test.ts

# Run with coverage
npm test -- --coverage rate-limiter.test.ts
```

### Test Scenarios Covered

- ✅ IP-based rate limiting (within and exceeding limits)
- ✅ Account-based rate limiting
- ✅ Account lockout after excessive attempts
- ✅ Progressive delays
- ✅ Different IPs tracked independently
- ✅ Rate limit headers correctness
- ✅ Custom key generators
- ✅ Redis fallback to memory
- ✅ Graceful error handling
- ✅ Skip successful/failed requests options
- ✅ Custom handlers

### Manual Testing

```bash
# Test login rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -i
done

# Check rate limit headers
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -i | grep "X-RateLimit"
```

## Deployment Considerations

### Redis Setup (Production)

1. **Install Redis**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server

   # macOS
   brew install redis

   # Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Configure Redis**:
   ```bash
   # .env
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-secure-password
   ```

3. **Verify Connection**:
   ```bash
   redis-cli -h your-redis-host -p 6379 -a your-password ping
   # Should return: PONG
   ```

### Horizontal Scaling

The rate limiting system is designed for horizontal scaling:

- **Redis-based storage**: Shared state across all application instances
- **Atomic operations**: Redis pipelines ensure consistency
- **No single point of failure**: Graceful fallback to in-memory if Redis unavailable

### Monitoring Setup

1. **Log Aggregation**: Collect rate limit logs in centralized logging system
2. **Alerting**: Set up alerts for:
   - High rate limit violations (>100/minute)
   - Account lockouts (>10/hour)
   - Redis connection failures
3. **Dashboards**: Track metrics:
   - Rate limit hit rate
   - Failed login attempts
   - Locked accounts over time

### Performance Optimization

- **Redis Connection Pooling**: Already configured in `backend/src/lib/redis.ts`
- **Pipeline Operations**: Atomic increment + expiry in single Redis call
- **Memory Cleanup**: Automatic cleanup of expired entries every 60 seconds

## Troubleshooting

### Common Issues

#### Rate Limiting Not Working

**Symptoms**: Requests not being rate limited

**Solutions**:
1. Check `RATE_LIMIT_ENABLED` environment variable
2. Verify rate limiters are applied to routes
3. Check Redis connection: `redis.ping()`

#### Too Aggressive Rate Limiting

**Symptoms**: Legitimate users getting blocked

**Solutions**:
1. Increase limits via environment variables
2. Implement whitelisting for trusted IPs
3. Reduce window duration

#### Redis Connection Failures

**Symptoms**: Logs show Redis errors but app still works

**Expected**: System automatically falls back to in-memory storage

**To Fix**:
1. Check Redis server is running
2. Verify network connectivity
3. Check Redis credentials

### Debug Mode

Enable detailed logging:

```typescript
// In rate-limiter.middleware.ts
const DEBUG = process.env.RATE_LIMIT_DEBUG === 'true'

if (DEBUG) {
  console.log('[RATE_LIMIT_DEBUG]', {
    key,
    count,
    max,
    remaining,
    resetTime,
  })
}
```

## Security Best Practices

1. **Never Disable in Production**: Always keep `RATE_LIMIT_ENABLED=true`
2. **Use Redis in Production**: In-memory storage doesn't scale across instances
3. **Monitor Logs**: Set up alerts for suspicious patterns
4. **Tune Limits**: Adjust based on legitimate user behavior
5. **Document Exceptions**: If whitelisting IPs, document why
6. **Regular Audits**: Review locked accounts and high violation IPs
7. **Backup Strategy**: Keep Redis data backed up for forensics

## Future Enhancements

### Planned Features

- [ ] CAPTCHA integration after N failed attempts
- [ ] Email notifications on account lockout
- [ ] Admin dashboard for rate limit monitoring
- [ ] Automatic IP blacklisting for persistent attackers
- [ ] Geolocation-based risk scoring
- [ ] Machine learning-based anomaly detection

### CAPTCHA Integration (Architecture Ready)

```typescript
// Hook points already available
if (attempt.count >= 6) {
  // TODO: Require CAPTCHA verification
  // const captchaRequired = true
  // return { ...rateLimitInfo, captchaRequired }
}
```

## Support and Contact

For questions or issues:
- **Internal**: Contact security team
- **Documentation**: See additional docs in `/docs`
- **Code**: `backend/src/middleware/rate-limiter.middleware.ts`

## Version History

- **v1.0** (2024-01-01): Initial implementation with multi-tiered rate limiting
  - IP-based rate limiting
  - Account-based rate limiting
  - Account lockout
  - Progressive delays
  - Redis + memory fallback

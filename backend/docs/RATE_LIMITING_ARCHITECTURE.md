# Rate Limiting Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 1: Global Rate Limit                    │
│                  (1000 req/min system-wide)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Key: "rl:auth:global"                                   │  │
│  │  Scope: All authentication requests                      │  │
│  │  Purpose: DDoS protection                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Pass
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TIER 2: IP-Based Rate Limit                   │
│                    (5 req/15min per IP)                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Key: "rl:auth:login:{IP}"                               │  │
│  │  Scope: Per IP address                                   │  │
│  │  Purpose: Brute force protection                         │  │
│  │                                                           │  │
│  │  IP Extraction:                                          │  │
│  │  1. X-Forwarded-For (first IP)                          │  │
│  │  2. X-Real-IP                                            │  │
│  │  3. CF-Connecting-IP (Cloudflare)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Pass
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                TIER 3: Account-Based Rate Limit                 │
│                   (5 req/15min per email)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Key: "failed_login:{email}"                             │  │
│  │  Scope: Per email address                                │  │
│  │  Purpose: Credential stuffing protection                 │  │
│  │                                                           │  │
│  │  Features:                                               │  │
│  │  • Progressive delays (1-5 seconds)                      │  │
│  │  • Account lockout (10 failures in 1 hour)              │  │
│  │  • 30-minute lockout duration                           │  │
│  │  • Auto-reset on successful login                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Pass
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Handler                        │
│                      (Login/Register)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Response with Headers                       │
│                                                                  │
│  X-RateLimit-Limit: 5                                          │
│  X-RateLimit-Remaining: 3                                      │
│  X-RateLimit-Reset: 1645123456                                 │
│  X-RateLimit-Remaining-Account: 4                              │
└─────────────────────────────────────────────────────────────────┘
```

## Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Rate Limiter Middleware                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │  Redis Available?│      │  Redis Unavailable│
    │  (Production)    │      │  (Development)   │
    └────────┬─────────┘      └────────┬─────────┘
             │                         │
             ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │   Redis Store    │      │  Memory Store    │
    │                  │      │                  │
    │ • Distributed    │      │ • Single server  │
    │ • Persistent     │      │ • In-memory      │
    │ • Scalable       │      │ • Auto-cleanup   │
    │ • Atomic ops     │      │ • Fallback only  │
    └──────────────────┘      └──────────────────┘
```

## Request Flow Diagram

```
                        ┌─────────────┐
                        │   Client    │
                        └──────┬──────┘
                               │
                               │ POST /api/auth/login
                               │ { email, password }
                               ▼
                        ┌──────────────┐
                        │ Hono Router  │
                        └──────┬───────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Middleware Chain:                                                │
│                                                                  │
│ 1. Logger                                                        │
│ 2. CORS                                                          │
│ 3. Global Auth Limiter  ──────► Check: "rl:auth:global"        │
│ 4. Login IP Limiter     ──────► Check: "rl:auth:login:{IP}"    │
│ 5. Login Account Limiter ─────► Check: "failed_login:{email}"  │
│ 6. Auth Handler                                                  │
└──────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
    ┌─────────┐          ┌─────────┐         ┌─────────┐
    │ Redis   │          │ Prisma  │         │  Logs   │
    │  Incr   │          │  Query  │         │ Security│
    │  Key    │          │  User   │         │  Events │
    └─────────┘          └─────────┘         └─────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Response   │
                        │              │
                        │ Success: 200 │
                        │ Rate Limit:  │
                        │   429        │
                        │ Auth Error:  │
                        │   401        │
                        └──────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                       auth.routes.ts                            │
│                                                                  │
│  POST /login → [globalLimiter] → [loginIpLimiter] →           │
│                [loginAccountLimiter] → handler                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ imports
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│               rate-limiter.middleware.ts                        │
│                                                                  │
│  • rateLimiter()         - IP-based rate limiting              │
│  • accountRateLimiter()  - Account-based rate limiting         │
│  • strictRateLimiter()   - Fail-hard rate limiting             │
│  • getClientIp()         - IP extraction                       │
│  • MemoryStore           - Fallback storage                    │
│  • RedisStore            - Production storage                  │
└────────────────┬────────────────┬───────────────────────────────┘
                 │                │
                 │ uses           │ imports
                 ▼                ▼
┌────────────────────────┐  ┌────────────────────────┐
│  rate-limit.config.ts  │  │ rate-limit.service.ts │
│                        │  │                        │
│  • authRateLimits      │  │  • trackFailedLogin()  │
│  • apiRateLimits       │  │  • checkLoginAllowed() │
│  • paymentRateLimits   │  │  • resetFailedLogins() │
│  • adminRateLimits     │  │  • unlockAccount()     │
└────────────────────────┘  └────────────┬───────────┘
                                         │
                                         │ uses
                                         ▼
                            ┌────────────────────────┐
                            │    auth.service.ts     │
                            │                        │
                            │  • login()             │
                            │  • register()          │
                            │  • updateProfile()     │
                            └────────────────────────┘
```

## Data Flow: Failed Login

```
1. Login Attempt
   └──> POST /api/auth/login
        └──> { email: "user@example.com", password: "wrong" }

2. Middleware Checks
   └──> Global Limiter (Pass)
        └──> IP Limiter (Pass)
             └──> Account Limiter
                  └──> Check: "failed_login:user@example.com"
                       └──> Current attempts: 2/5 (Pass with 1s delay)

3. Auth Service
   └──> Find user in database
        └──> Verify password (FAIL)
             └──> rateLimitService.trackFailedLogin()
                  └──> Increment counter to 3
                       └──> Store in Redis: "failed_login:user@example.com"
                            {
                              count: 3,
                              firstAttempt: 1645123400000,
                              lastAttempt: 1645123456000,
                              locked: false
                            }

4. Response
   └──> 401 Unauthorized
        └──> { error: "Invalid email or password" }

5. Security Log
   └──> [SECURITY_EVENT] 2025-01-15T10:30:00Z - failed_login:
        user@example.com from IP 192.168.1.100 - attempt 3
```

## Data Flow: Successful Login (Reset)

```
1. Login Attempt
   └──> POST /api/auth/login
        └──> { email: "user@example.com", password: "correct" }

2. Middleware Checks
   └──> Global Limiter (Pass)
        └──> IP Limiter (Pass)
             └──> Account Limiter (Pass - has 2 remaining attempts)

3. Auth Service
   └──> Find user in database
        └──> Verify password (SUCCESS)
             └──> rateLimitService.resetFailedLogins()
                  └──> Delete key: "failed_login:user@example.com"

4. Response
   └──> 200 OK
        └──> { message: "Login successful", user: {...}, token: "..." }

5. Security Log
   └──> [AUTH] Successful login: user@example.com from IP 192.168.1.100
```

## Data Flow: Rate Limit Exceeded

```
1. Login Attempt #6
   └──> POST /api/auth/login

2. Middleware Checks
   └──> Global Limiter (Pass)
        └──> IP Limiter (FAIL - 5/5 attempts used)
             └──> count: 6
                  └──> remaining: 0
                       └──> resetTime: 1645124256

3. Response
   └──> 429 Too Many Requests
        └──> Headers:
             X-RateLimit-Limit: 5
             X-RateLimit-Remaining: 0
             X-RateLimit-Reset: 1645124256
             Retry-After: 800
        └──> Body:
             {
               error: "Rate limit exceeded",
               message: "Too many login attempts. Please try again in 15 minutes.",
               retryAfter: 800
             }

4. Security Log
   └──> [RATE_LIMIT_VIOLATION] 2025-01-15T10:30:00Z - IP: 192.168.1.100,
        Endpoint: /api/auth/login, Attempts: 6/5
```

## Data Flow: Account Lockout

```
1. Failed Login Attempt #10 (in 1 hour)
   └──> POST /api/auth/login

2. Middleware Checks
   └──> Global Limiter (Pass)
        └──> IP Limiter (Pass - different IP)
             └──> Account Limiter
                  └──> Check: "failed_login:user@example.com"
                       └──> count: 9 → increment to 10
                            └──> locked: false → set to true
                                 └──> lockUntil: now + 30 minutes

3. Response
   └──> 429 Too Many Requests
        └──> Body:
             {
               error: "Rate limit exceeded",
               code: "ACCOUNT_LOCKED",
               message: "Account temporarily locked due to too many failed
                        login attempts. Please try again later or reset
                        your password.",
               retryAfter: 1800
             }

4. Security Log
   └──> [SECURITY_ALERT] 2025-01-15T10:30:00Z - ACCOUNT_LOCKED:
        user@example.com from IP 192.168.1.100 after 10 failed attempts
```

## Redis Key Structure

```
Redis Keys:

┌─────────────────────────────────────────────────────────┐
│  IP-Based Rate Limiting                                 │
├─────────────────────────────────────────────────────────┤
│  rl:auth:global                                         │
│  rl:auth:login:192.168.1.100                           │
│  rl:auth:login:10.0.0.5                                │
│  rl:auth:register:192.168.1.100                        │
│  rl:auth:profile-update:192.168.1.100                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Account-Based Rate Limiting                            │
├─────────────────────────────────────────────────────────┤
│  failed_login:user@example.com                          │
│  failed_login:admin@example.com                         │
│  failed_login:test@example.com                          │
└─────────────────────────────────────────────────────────┘

Key Value Format (IP-based):
  • Type: Integer
  • Value: Request count
  • TTL: Window duration (e.g., 900s for 15 minutes)

Key Value Format (Account-based):
  • Type: JSON string
  • Value: {
      count: number,
      firstAttempt: timestamp,
      lastAttempt: timestamp,
      locked: boolean,
      lockUntil?: timestamp
    }
  • TTL: 3600s (1 hour)
```

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Logs                            │
│                                                                  │
│  [RATE_LIMIT_VIOLATION]  ──┐                                   │
│  [SECURITY_WARNING]      ──┤                                   │
│  [SECURITY_ALERT]        ──┤                                   │
│  [SECURITY_EVENT]        ──┤                                   │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Log Aggregation    │
                  │  (CloudWatch, ELK,   │
                  │   Datadog, etc.)     │
                  └──────────┬───────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │     Metrics      │      │     Alerts       │
    │                  │      │                  │
    │ • Violations/min │      │ • High violations│
    │ • Locked accounts│      │ • Account lockout│
    │ • Top IPs        │      │ • Redis down     │
    │ • Top emails     │      │ • System overload│
    └──────────────────┘      └──────────────────┘
```

## Deployment Architecture

### Development (Single Server)
```
┌────────────────────────────────────┐
│         Developer Laptop           │
│                                    │
│  ┌──────────────────────────────┐ │
│  │     Bun/Node.js Server       │ │
│  │                              │ │
│  │  • Rate Limiter Middleware   │ │
│  │  • In-Memory Store           │ │
│  │  • Auth Service              │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

### Production (Multi-Server)
```
                   ┌─────────────┐
                   │ Load Balancer│
                   └──────┬───────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Server 1   │  │   Server 2   │  │   Server 3   │
│              │  │              │  │              │
│ • Middleware │  │ • Middleware │  │ • Middleware │
│ • RedisStore │  │ • RedisStore │  │ • RedisStore │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │     Redis    │
                  │   Cluster    │
                  │              │
                  │ • Distributed│
                  │ • Persistent │
                  │ • HA         │
                  └──────────────┘
```

## Security Event Flow

```
Rate Limit Event ──────────────────────────────────────────┐
                                                           │
Failed Login ───────────────────────────────────────────┐  │
                                                         │  │
Account Lockout ──────────────────────────────────────┐ │  │
                                                       │ │  │
                                                       ▼ ▼  ▼
                                              ┌────────────────┐
                                              │  Logger Module │
                                              └────────┬───────┘
                                                       │
                               ┌───────────────────────┼───────────────────────┐
                               │                       │                       │
                               ▼                       ▼                       ▼
                      ┌─────────────┐       ┌──────────────┐        ┌──────────────┐
                      │   Console   │       │  Log Files   │        │ Log Service  │
                      │   (stdout)  │       │  (disk)      │        │  (remote)    │
                      └─────────────┘       └──────────────┘        └──────┬───────┘
                                                                             │
                                                                             ▼
                                                                    ┌─────────────────┐
                                                                    │ SIEM / Analytics│
                                                                    │                 │
                                                                    │ • Threat detect │
                                                                    │ • Pattern recog │
                                                                    │ • Reporting     │
                                                                    └─────────────────┘
```

## Summary

This architecture provides:

✅ **Multi-layered protection** - Global, IP, and account-based rate limiting
✅ **Distributed scalability** - Redis-backed storage for multi-server deployments
✅ **Graceful degradation** - In-memory fallback for development
✅ **Security monitoring** - Comprehensive event logging
✅ **Production-ready** - Battle-tested patterns and implementations
✅ **Maintainable** - Clear separation of concerns and modular design

---

**See Also**:
- [Rate Limiting Documentation](./RATE_LIMITING.md)
- [Quick Start Guide](./RATE_LIMITING_QUICK_START.md)
- [Implementation Summary](../../RATE_LIMITING_IMPLEMENTATION_SUMMARY.md)

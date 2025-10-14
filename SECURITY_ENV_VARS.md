# Security Environment Variables - Quick Reference

## Required for Production

```env
# CRITICAL: Redis is required for production rate limiting
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password
REDIS_USERNAME=default  # optional

# Node environment
NODE_ENV=production
```

## Recommended Security Settings

```env
# Trusted proxies for IP validation (comma-separated)
# Only these IPs will be trusted when parsing X-Forwarded-For headers
TRUSTED_PROXY_IPS=10.0.0.1,10.0.0.2,your.cloudflare.ip

# Rate limiting toggle (default: true)
RATE_LIMIT_ENABLED=true
```

## Optional Rate Limit Customization

```env
# Login rate limits (IP-based)
RATE_LIMIT_LOGIN_WINDOW_MS=900000  # 15 minutes (default)
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5    # 5 attempts (default)

# Register rate limits (IP-based)
RATE_LIMIT_REGISTER_WINDOW_MS=3600000  # 1 hour (default)
RATE_LIMIT_REGISTER_MAX_ATTEMPTS=3     # 3 attempts (default)

# Account lockout (account-based)
RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS=10           # 10 failed attempts (default)
RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS=1800000   # 30 minutes (default)

# Global rate limits (system-wide)
RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS=60000      # 1 minute (default)
RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS=1000    # 1000 requests (default)
```

## Example Configurations

### Development (Minimal)
```env
NODE_ENV=development
# Redis optional in dev
# Rate limiting uses in-memory store
```

### Staging/Testing
```env
NODE_ENV=staging
REDIS_HOST=staging-redis.internal
REDIS_PASSWORD=staging-password
TRUSTED_PROXY_IPS=10.0.1.1
```

### Production (Full Security)
```env
NODE_ENV=production
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=super-secure-password-here
REDIS_USERNAME=default
TRUSTED_PROXY_IPS=cloudflare.ip1,cloudflare.ip2,nginx.proxy.ip
RATE_LIMIT_ENABLED=true

# Optional: Stricter limits for production
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=3
RATE_LIMIT_REGISTER_MAX_ATTEMPTS=2
```

## Coolify Configuration

Add these to Coolify environment variables:

1. Go to your Coolify application
2. Navigate to "Environment Variables"
3. Add each variable:
   ```
   REDIS_HOST = your-redis-host
   REDIS_PASSWORD = ••••••••  (mark as secret)
   TRUSTED_PROXY_IPS = your.proxy.ip
   NODE_ENV = production
   ```

## Security Notes

- ⚠️ **NEVER commit `.env` files with real credentials**
- ✅ Use Coolify secrets for sensitive values
- ✅ Rotate `REDIS_PASSWORD` regularly
- ✅ Set `TRUSTED_PROXY_IPS` if behind a reverse proxy
- ⚠️ Production will **fail to start** without Redis

## Verification

After setting variables, check startup logs:

```
✅ Database connected successfully
✅ Redis connected successfully
📦 Redis host: your-redis-host
🔒 Rate limiting: Distributed (Redis-backed)
🚀 Server running on http://localhost:3000
```

If you see warnings or errors about Redis in production, the server will exit immediately.

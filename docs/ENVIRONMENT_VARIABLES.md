# Environment Variables Reference Guide

Complete reference documentation for all Superlumiku environment variables.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Variable Categories](#variable-categories)
- [Security Best Practices](#security-best-practices)
- [Complete Variable Reference](#complete-variable-reference)
- [Environment-Specific Configurations](#environment-specific-configurations)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

---

## Overview

All environment variables in Superlumiku are validated at application startup using [Zod](https://github.com/colinhacks/zod). Invalid or missing required variables will cause the application to fail immediately with clear error messages, preventing runtime errors.

### Key Features

- **Fail Fast**: Application won't start with invalid configuration
- **Type Safety**: All variables are strongly typed and validated
- **Clear Errors**: Detailed error messages for misconfiguration
- **Sensible Defaults**: Optional variables have production-ready defaults
- **Centralized**: All configuration in one place (`backend/src/config/env.ts`)

### Variable Status Legend

| Status | Description | Example |
|--------|-------------|---------|
| `[REQUIRED]` | Must be set in all environments | `DATABASE_URL`, `JWT_SECRET` |
| `[REQUIRED-PROD]` | Must be set in production, optional in dev/test | `CORS_ORIGIN`, `REDIS_HOST` |
| `[OPTIONAL]` | Has sensible defaults, can be overridden | `PORT`, `MAX_FILE_SIZE` |
| `[FEATURE]` | Only needed when specific features are enabled | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |

---

## Quick Start

### 1. Copy Example File

```bash
cp .env.example .env
```

### 2. Generate Secure JWT Secret

```bash
# Generate a secure random secret (32+ characters)
openssl rand -base64 32
```

### 3. Update Required Variables

Edit `.env` and set at minimum:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lumiku"
JWT_SECRET="<paste-generated-secret-here>"
CORS_ORIGIN="http://localhost:5173"
DUITKU_MERCHANT_CODE="<your-merchant-code>"
DUITKU_API_KEY="<your-api-key>"
DUITKU_CALLBACK_URL="http://localhost:3000/api/payments/callback"
DUITKU_RETURN_URL="http://localhost:5173/payments/status"
```

### 4. Start Application

```bash
cd backend
bun run dev
```

If validation fails, you'll see clear error messages:

```
❌ ENVIRONMENT VARIABLE VALIDATION FAILED:

The following environment variables are invalid or missing:

  ❌ JWT_SECRET: String must contain at least 32 character(s)
  ❌ CORS_ORIGIN: CORS_ORIGIN must be a valid URL
  ❌ DUITKU_API_KEY: DUITKU_API_KEY must be at least 10 characters

Please check your .env file and ensure all required variables are set.
Refer to .env.example for a complete list of required variables.
```

---

## Variable Categories

### Core Application

Required for basic application functionality.

| Variable | Status | Default | Description |
|----------|--------|---------|-------------|
| `NODE_ENV` | `[OPTIONAL]` | `development` | Node environment mode (`development`, `production`, `test`) |
| `PORT` | `[OPTIONAL]` | `3000` | Server port number (1-65535) |
| `DATABASE_URL` | `[REQUIRED]` | - | Database connection string |

### Authentication & Security

JWT authentication configuration.

| Variable | Status | Default | Description |
|----------|--------|---------|-------------|
| `JWT_SECRET` | `[REQUIRED]` | - | Secret key for JWT signing (min 32 chars) |
| `JWT_EXPIRES_IN` | `[OPTIONAL]` | `7d` | Token expiration time (e.g., "24h", "7d") |
| `CORS_ORIGIN` | `[REQUIRED-PROD]` | `http://localhost:5173` | Allowed CORS origin (must be valid URL) |
| `TRUSTED_PROXY_IPS` | `[OPTIONAL]` | `""` | Comma-separated trusted proxy IPs |

### Payment Gateway (Duitku)

Payment processing configuration.

| Variable | Status | Default | Description |
|----------|--------|---------|-------------|
| `DUITKU_MERCHANT_CODE` | `[REQUIRED]` | - | Duitku merchant code |
| `DUITKU_API_KEY` | `[REQUIRED]` | - | Duitku API key (min 10 chars) |
| `DUITKU_CALLBACK_URL` | `[REQUIRED]` | - | Payment callback URL (valid URL) |
| `DUITKU_RETURN_URL` | `[REQUIRED]` | - | Payment return URL (valid URL) |
| `DUITKU_BASE_URL` | `[OPTIONAL]` | `https://passport.duitku.com` | Duitku API base URL |
| `DUITKU_ENV` | `[OPTIONAL]` | `sandbox` | Environment (`sandbox` or `production`) |
| `PAYMENT_IP_WHITELIST_ENABLED` | `[OPTIONAL]` | `true` | Enable IP whitelist for callbacks |

### Redis & Caching

Required in production for distributed rate limiting.

| Variable | Status | Default | Description |
|----------|--------|---------|-------------|
| `REDIS_HOST` | `[REQUIRED-PROD]` | - | Redis server host |
| `REDIS_PORT` | `[OPTIONAL]` | `6379` | Redis server port |
| `REDIS_PASSWORD` | `[OPTIONAL]` | - | Redis authentication password |

### Rate Limiting

Comprehensive rate limiting configuration.

| Variable | Status | Default | Description |
|----------|--------|---------|-------------|
| `RATE_LIMIT_ENABLED` | `[OPTIONAL]` | `true` | Enable/disable rate limiting |
| `RATE_LIMIT_LOGIN_WINDOW_MS` | `[OPTIONAL]` | `900000` | Login window (15 min) |
| `RATE_LIMIT_LOGIN_MAX_ATTEMPTS` | `[OPTIONAL]` | `5` | Max login attempts |
| `RATE_LIMIT_REGISTER_WINDOW_MS` | `[OPTIONAL]` | `3600000` | Register window (1 hour) |
| `RATE_LIMIT_REGISTER_MAX_ATTEMPTS` | `[OPTIONAL]` | `3` | Max register attempts |
| `RATE_LIMIT_PASSWORD_RESET_WINDOW_MS` | `[OPTIONAL]` | `3600000` | Password reset window (1 hour) |
| `RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS` | `[OPTIONAL]` | `3` | Max password reset attempts |
| `RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS` | `[OPTIONAL]` | `3600000` | Profile update window (1 hour) |
| `RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS` | `[OPTIONAL]` | `10` | Max profile updates |
| `RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS` | `[OPTIONAL]` | `10` | Failed attempts before lockout |
| `RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS` | `[OPTIONAL]` | `1800000` | Lockout duration (30 min) |
| `RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS` | `[OPTIONAL]` | `60000` | Global auth window (1 min) |
| `RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS` | `[OPTIONAL]` | `1000` | Max global auth requests |
| `RATE_LIMIT_REDIS_URL` | `[OPTIONAL]` | Falls back to `REDIS_HOST` | Redis URL for rate limiting |

### File Storage

File upload and output configuration.

| Variable | Status | Default | Description |
|----------|--------|---------|-------------|
| `UPLOAD_PATH` | `[OPTIONAL]` | `./uploads` | Directory for uploads |
| `OUTPUT_PATH` | `[OPTIONAL]` | `./outputs` | Directory for outputs |
| `MAX_FILE_SIZE` | `[OPTIONAL]` | `524288000` | Max file size (500MB) |

### AI Services

Optional AI service integrations.

| Variable | Status | Default | Description |
|----------|--------|---------|-------------|
| `ANTHROPIC_API_KEY` | `[FEATURE]` | - | Anthropic Claude API key |
| `OPENAI_API_KEY` | `[FEATURE]` | - | OpenAI GPT API key |
| `FLUX_API_KEY` | `[FEATURE]` | - | Flux image generation API key |

### FFmpeg

Video processing tools.

| Variable | Status | Default | Description |
|----------|--------|---------|-------------|
| `FFMPEG_PATH` | `[OPTIONAL]` | `ffmpeg` | Path to FFmpeg executable |
| `FFPROBE_PATH` | `[OPTIONAL]` | `ffprobe` | Path to FFprobe executable |

---

## Security Best Practices

### 1. JWT Secret Security

**CRITICAL**: Never use weak JWT secrets in production.

```bash
# ✅ GOOD: Generate secure random secret
openssl rand -base64 32

# ❌ BAD: Weak secrets
JWT_SECRET="secret"
JWT_SECRET="change-me"
JWT_SECRET="my-app-secret"
```

**Requirements:**
- Minimum 32 characters (enforced)
- High entropy (random, not dictionary words)
- Different for each environment
- Never commit to version control

### 2. Environment-Specific Secrets

Use different secrets for each environment:

```bash
# Development
JWT_SECRET="dev-secret-abc123xyz789-random-string-here"

# Staging
JWT_SECRET="staging-secret-different-random-string"

# Production
JWT_SECRET="production-secret-completely-different"
```

### 3. HTTPS in Production

**CRITICAL**: All URLs must use HTTPS in production.

```bash
# ✅ GOOD (Production)
CORS_ORIGIN="https://app.superlumiku.com"
DUITKU_CALLBACK_URL="https://api.superlumiku.com/api/payments/callback"
DUITKU_RETURN_URL="https://app.superlumiku.com/payments/status"

# ❌ BAD (Production)
CORS_ORIGIN="http://app.superlumiku.com"  # HTTP not allowed!
```

The application will enforce this at startup in production mode.

### 4. Redis in Production

**CRITICAL**: Redis is required in production for distributed rate limiting.

Without Redis in production:
- Rate limiting uses in-memory store
- Won't work correctly across multiple instances
- Security vulnerabilities possible

```bash
# ✅ GOOD (Production)
REDIS_HOST="redis.example.com"
REDIS_PORT="6379"
REDIS_PASSWORD="secure-redis-password"

# ❌ BAD (Production)
# No REDIS_HOST set - uses in-memory store (insecure!)
```

### 5. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.production
*.env
```

### 6. Rotate Secrets Regularly

- Rotate JWT secrets every 3-6 months
- Rotate API keys when team members leave
- Rotate database passwords quarterly

---

## Complete Variable Reference

### NODE_ENV

**Type**: `enum('development', 'production', 'test')`
**Status**: `[OPTIONAL]`
**Default**: `development`

Node environment mode. Affects:
- Logging verbosity
- Error messages (stack traces in dev only)
- Security validations (stricter in production)
- Default behaviors

**Valid Values:**
- `development` - Local development
- `production` - Production deployment
- `test` - Automated testing

**Examples:**
```bash
NODE_ENV=development
NODE_ENV=production
NODE_ENV=test
```

---

### PORT

**Type**: `number` (1-65535)
**Status**: `[OPTIONAL]`
**Default**: `3000`

Server port number. Must be a valid port (1-65535).

**Examples:**
```bash
PORT=3000
PORT=8080
PORT=5000
```

---

### DATABASE_URL

**Type**: `string` (non-empty)
**Status**: `[REQUIRED]`
**Default**: None

Database connection string. Supports PostgreSQL and SQLite.

**PostgreSQL Format:**
```
postgresql://[user[:password]@][host][:port][/database][?parameter_list]
```

**Examples:**
```bash
# PostgreSQL (Production)
DATABASE_URL="postgresql://lumiku:password@db.example.com:5432/lumiku"

# PostgreSQL (Local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/lumiku_dev"

# SQLite (Development)
DATABASE_URL="file:./prisma/dev.db"
```

**Security Notes:**
- Never commit production database URLs
- Use environment-specific credentials
- Restrict database user permissions

---

### JWT_SECRET

**Type**: `string` (min 32 characters)
**Status**: `[REQUIRED]`
**Default**: None

Secret key for JWT token signing. MUST be at least 32 characters.

**Security Requirements:**
- Minimum 32 characters (enforced)
- High entropy (random)
- Never reuse across environments
- Never commit to version control

**Generation:**
```bash
# Generate secure secret (recommended)
openssl rand -base64 32

# Alternative: use password generator
# Ensure at least 32 characters
```

**Examples:**
```bash
# ✅ GOOD
JWT_SECRET="xK9mP2nQ5rL8sF1tV4wY7zA3cE6hB0dG9iJ2mN5pS8vX"

# ❌ BAD
JWT_SECRET="secret"  # Too short
JWT_SECRET="my-secret-key"  # Too short
```

**Production Validation:**
In production mode, the secret must:
1. Be at least 32 characters
2. Have high entropy (not predictable)
3. Not be a default/example value

---

### JWT_EXPIRES_IN

**Type**: `string` (duration format)
**Status**: `[OPTIONAL]`
**Default**: `7d`

JWT token expiration time. Uses [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) duration format.

**Format:**
- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days

**Examples:**
```bash
JWT_EXPIRES_IN="24h"   # 24 hours
JWT_EXPIRES_IN="7d"    # 7 days (default)
JWT_EXPIRES_IN="30d"   # 30 days
JWT_EXPIRES_IN="1h"    # 1 hour
JWT_EXPIRES_IN="3600"  # 3600 seconds (1 hour)
```

**Recommendations:**
- Development: `7d` or longer
- Production: `24h` to `7d` (balance security vs UX)
- High-security apps: `1h` with refresh tokens

---

### CORS_ORIGIN

**Type**: `string` (valid URL)
**Status**: `[REQUIRED-PROD]`
**Default**: `http://localhost:5173`

Allowed CORS origin for frontend requests. Must be a valid URL.

**Production Validation:**
- Must be HTTPS (enforced)
- Cannot be `localhost` (enforced)

**Examples:**
```bash
# Development
CORS_ORIGIN="http://localhost:5173"
CORS_ORIGIN="http://localhost:3001"

# Production
CORS_ORIGIN="https://app.superlumiku.com"
CORS_ORIGIN="https://www.superlumiku.com"
```

**Multiple Origins:**
Currently supports single origin. For multiple origins, modify CORS middleware in `backend/src/app.ts`.

---

### DUITKU_MERCHANT_CODE

**Type**: `string` (min 1 character)
**Status**: `[REQUIRED]`
**Default**: None

Duitku merchant identification code. Obtain from [Duitku Dashboard](https://passport.duitku.com).

**How to Obtain:**
1. Register at https://passport.duitku.com
2. Complete merchant verification
3. Find merchant code in dashboard settings

**Examples:**
```bash
DUITKU_MERCHANT_CODE="D12345"
DUITKU_MERCHANT_CODE="MERCHANT-ABC-123"
```

---

### DUITKU_API_KEY

**Type**: `string` (min 10 characters)
**Status**: `[REQUIRED]`
**Default**: None

Duitku API key for authentication. Obtain from Duitku Dashboard.

**Security:**
- Never commit to version control
- Rotate regularly
- Different keys for sandbox/production

**Examples:**
```bash
# Sandbox
DUITKU_API_KEY="sandbox-api-key-12345"

# Production
DUITKU_API_KEY="production-api-key-67890"
```

---

### DUITKU_CALLBACK_URL

**Type**: `string` (valid URL)
**Status**: `[REQUIRED]`
**Default**: None

Webhook URL where Duitku sends payment notifications. Must be publicly accessible.

**Production Validation:**
- Must be HTTPS (enforced)
- Must be publicly accessible
- Should have IP whitelist enabled

**Format:**
```
https://[your-domain]/api/payments/callback
```

**Examples:**
```bash
# Production
DUITKU_CALLBACK_URL="https://api.superlumiku.com/api/payments/callback"

# Development (with ngrok)
DUITKU_CALLBACK_URL="https://abc123.ngrok.io/api/payments/callback"

# Development (localhost - for testing only)
DUITKU_CALLBACK_URL="http://localhost:3000/api/payments/callback"
```

**Testing Locally:**
Use [ngrok](https://ngrok.com) or similar to expose localhost:
```bash
ngrok http 3000
# Use the HTTPS URL provided by ngrok
```

---

### DUITKU_RETURN_URL

**Type**: `string` (valid URL)
**Status**: `[REQUIRED]`
**Default**: None

URL where users are redirected after payment. Can include `{merchantOrderId}` placeholder.

**Production Validation:**
- Must be HTTPS (enforced)

**Format:**
```
https://[your-domain]/payments/status?orderId={merchantOrderId}
```

**Examples:**
```bash
# Production
DUITKU_RETURN_URL="https://app.superlumiku.com/payments/status"

# With order ID placeholder
DUITKU_RETURN_URL="https://app.superlumiku.com/payments/{merchantOrderId}"

# Development
DUITKU_RETURN_URL="http://localhost:5173/payments/status"
```

---

### REDIS_HOST

**Type**: `string`
**Status**: `[REQUIRED-PROD]`
**Default**: None

Redis server host for caching and rate limiting.

**Production Requirement:**
Redis is REQUIRED in production for distributed rate limiting across multiple instances.

**Examples:**
```bash
# Local
REDIS_HOST="localhost"
REDIS_HOST="127.0.0.1"

# Docker
REDIS_HOST="redis"

# Remote
REDIS_HOST="redis.example.com"
REDIS_HOST="10.0.1.50"
```

---

### RATE_LIMIT_ENABLED

**Type**: `boolean` (string "true"/"false")
**Status**: `[OPTIONAL]`
**Default**: `true`

Enable or disable rate limiting globally.

**Security Warning:**
Never disable in production! Rate limiting protects against:
- Brute force attacks
- Credential stuffing
- API abuse
- DDoS attacks

**Examples:**
```bash
RATE_LIMIT_ENABLED="true"   # Enable (recommended)
RATE_LIMIT_ENABLED="false"  # Disable (dev/testing only)
```

---

## Environment-Specific Configurations

### Development Environment

Minimal configuration for local development:

```bash
# .env.development
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="dev-secret-at-least-32-characters-long"
CORS_ORIGIN="http://localhost:5173"

# Duitku Sandbox
DUITKU_MERCHANT_CODE="sandbox-merchant"
DUITKU_API_KEY="sandbox-api-key"
DUITKU_ENV="sandbox"
DUITKU_CALLBACK_URL="http://localhost:3000/api/payments/callback"
DUITKU_RETURN_URL="http://localhost:5173/payments/status"

# Optional: AI Services (if testing features)
# ANTHROPIC_API_KEY="sk-ant-..."
```

### Production Environment

Complete secure configuration:

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://lumiku:SECURE_PASSWORD@db.internal:5432/lumiku_prod"
JWT_SECRET="SECURE_RANDOM_SECRET_AT_LEAST_32_CHARS_GENERATED_BY_OPENSSL"
JWT_EXPIRES_IN="24h"
CORS_ORIGIN="https://app.superlumiku.com"

# Redis (Required!)
REDIS_HOST="redis.internal"
REDIS_PORT="6379"
REDIS_PASSWORD="SECURE_REDIS_PASSWORD"

# Duitku Production
DUITKU_MERCHANT_CODE="PROD_MERCHANT_CODE"
DUITKU_API_KEY="PROD_API_KEY"
DUITKU_ENV="production"
DUITKU_CALLBACK_URL="https://api.superlumiku.com/api/payments/callback"
DUITKU_RETURN_URL="https://app.superlumiku.com/payments/status"
PAYMENT_IP_WHITELIST_ENABLED="true"

# Rate Limiting (Strict)
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_LOGIN_MAX_ATTEMPTS="5"
RATE_LIMIT_REGISTER_MAX_ATTEMPTS="3"

# File Storage
UPLOAD_PATH="/var/app/uploads"
OUTPUT_PATH="/var/app/outputs"
MAX_FILE_SIZE="524288000"

# Trusted Proxies (if using load balancer)
TRUSTED_PROXY_IPS="10.0.0.1,10.0.0.2"

# AI Services (if enabled)
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
```

---

## Troubleshooting

### Application Won't Start

**Error:**
```
❌ ENVIRONMENT VARIABLE VALIDATION FAILED:
  ❌ DATABASE_URL: Required
```

**Solution:**
Ensure all required variables are set in `.env`:
```bash
# Check your .env file
cat .env

# Copy from example if needed
cp .env.example .env
```

---

### JWT Secret Too Short

**Error:**
```
❌ JWT_SECRET: String must contain at least 32 character(s)
```

**Solution:**
Generate a secure secret:
```bash
openssl rand -base64 32
```

Then update `.env`:
```bash
JWT_SECRET="<paste-generated-secret-here>"
```

---

### Invalid URL Format

**Error:**
```
❌ CORS_ORIGIN: CORS_ORIGIN must be a valid URL
```

**Solution:**
Ensure URL includes protocol:
```bash
# ❌ Wrong
CORS_ORIGIN="localhost:5173"

# ✅ Correct
CORS_ORIGIN="http://localhost:5173"
```

---

### Redis Connection Failed (Production)

**Error:**
```
❌ FATAL: Redis is required for production deployment!
```

**Solution:**
1. Set Redis environment variables:
```bash
REDIS_HOST="your-redis-host"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"
```

2. Verify Redis is running:
```bash
redis-cli -h your-redis-host ping
# Should return: PONG
```

---

### Payment Callback Using HTTP in Production

**Error:**
```
❌ DUITKU_CALLBACK_URL must use HTTPS in production
```

**Solution:**
Update to HTTPS URL:
```bash
# ❌ Wrong
DUITKU_CALLBACK_URL="http://api.example.com/api/payments/callback"

# ✅ Correct
DUITKU_CALLBACK_URL="https://api.example.com/api/payments/callback"
```

---

## Migration Guide

### From Direct process.env Access

If your code previously accessed `process.env` directly:

**Before (P0 Issue #5):**
```typescript
// ❌ Direct access (bypasses validation)
constructor() {
  this.apiKey = process.env.DUITKU_API_KEY || ''
  this.merchantCode = process.env.DUITKU_MERCHANT_CODE || ''
}
```

**After (Fixed):**
```typescript
// ✅ Use centralized config (validated)
import { env } from '../config/env'

constructor() {
  this.apiKey = env.DUITKU_API_KEY
  this.merchantCode = env.DUITKU_MERCHANT_CODE
}
```

### From Unvalidated Configuration

**Before (P0 Issue #6):**
```typescript
// ❌ No validation, silent failures
export const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
  DATABASE_URL: process.env.DATABASE_URL || '',
}
```

**After (Fixed):**
```typescript
// ✅ Validated with Zod, fails fast
const envSchema = z.object({
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

---

## Testing Environment Variables

Run the comprehensive test suite:

```bash
cd backend
bun test src/config/__tests__/env.test.ts
```

The test suite validates:
- Required fields
- URL formats
- Number ranges
- Enum values
- Default values
- Type coercion
- Error messages

---

## Additional Resources

- **Zod Documentation**: https://zod.dev
- **Duitku API Docs**: https://docs.duitku.com
- **JWT Best Practices**: https://jwt.io/introduction
- **Redis Documentation**: https://redis.io/docs

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review error messages (they're designed to be helpful!)
3. Consult `.env.example` for correct format
4. Run tests to verify configuration

---

**Last Updated**: 2025-10-14
**Version**: 1.0.0
**Related**: P0 Security Sprint - Items #5 & #6

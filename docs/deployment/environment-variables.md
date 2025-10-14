# Environment Variables - Complete Reference

---
**Last Updated:** 2025-10-14
**Version:** 1.0.0
**Status:** Current
**Total Variables:** 80+
---

## Overview

This document provides a complete reference for all environment variables used in the Lumiku App. All variables are validated at application startup using Zod schemas.

**Variable Status Legend:**
- **[REQUIRED]** - Must be set in all environments
- **[REQUIRED-PROD]** - Must be set in production, optional in dev/test
- **[OPTIONAL]** - Has sensible defaults, can be overridden
- **[FEATURE]** - Only needed when specific features are enabled

**Configuration Files:**
- Backend: `.env` (root or backend/.env)
- Frontend: Uses backend API (no separate env needed)
- AI Services: `.env.ai.example` (optional)

---

## Quick Reference by Category

| Category | Count | Priority |
|----------|-------|----------|
| [Core Configuration](#core-configuration) | 3 | REQUIRED |
| [Database](#database) | 1 | REQUIRED |
| [JWT Authentication](#jwt-authentication) | 2 | REQUIRED |
| [CORS](#cors) | 1 | REQUIRED-PROD |
| [Redis](#redis) | 3 | REQUIRED-PROD |
| [File Storage](#file-storage) | 3 | OPTIONAL |
| [Payment Gateway (Duitku)](#payment-gateway-duitku) | 6 | REQUIRED |
| [Rate Limiting](#rate-limiting) | 16 | OPTIONAL |
| [Trusted Proxies](#trusted-proxies) | 1 | OPTIONAL |
| [AI Services](#ai-services) | 10+ | FEATURE |
| [FFmpeg](#ffmpeg) | 2 | OPTIONAL |

---

## Core Configuration

### NODE_ENV

**Status:** [OPTIONAL]
**Default:** `development`
**Valid Values:** `development`, `production`, `test`

Determines the runtime environment mode.

```bash
NODE_ENV=production
```

**Behavior by Environment:**
- **development**: Verbose logging, hot reload, dev tools enabled
- **production**: Minimal logging, optimizations enabled, strict validation
- **test**: Test-specific configurations, mock external services

---

### PORT

**Status:** [OPTIONAL]
**Default:** `3000`
**Valid Range:** 1-65535

Port number for the Express server.

```bash
PORT=3000
```

**Common Ports:**
- Development: `3000`
- Production: `3000` or `8080` (behind reverse proxy)
- Alternative: `5000` (if 3000 is in use)

---

## Database

### DATABASE_URL

**Status:** [REQUIRED]
**Format:** PostgreSQL connection string

Database connection string for Prisma.

```bash
# PostgreSQL (Production)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# PostgreSQL (Local)
DATABASE_URL="postgresql://lumiku:password@localhost:5432/lumiku_db?schema=public"

# PostgreSQL (Docker)
DATABASE_URL="postgresql://lumiku:password@postgres:5432/lumiku_db?schema=public"

# SQLite (Development Only - NOT RECOMMENDED)
DATABASE_URL="file:./backend/prisma/dev.db"
```

**Components:**
- `user`: Database username
- `password`: Database password
- `host`: Database host (localhost, IP, domain)
- `port`: Database port (default 5432 for PostgreSQL)
- `database`: Database name
- `schema`: Schema name (default: public)

**Security Notes:**
- NEVER commit actual credentials
- Use strong passwords (16+ characters)
- Restrict database access by IP in production
- Use SSL/TLS in production

---

## JWT Authentication

### JWT_SECRET

**Status:** [REQUIRED]
**Minimum Length:** 32 characters (enforced)
**Type:** String (high entropy)

Secret key for signing and verifying JWT tokens.

```bash
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
```

**SECURITY REQUIREMENTS:**
- Minimum 32 characters (enforced by validation)
- High entropy (cryptographically random)
- Different for each environment (dev, staging, prod)
- NEVER commit to version control
- Rotate every 90 days (recommended)

**Generate Secure Secret:**
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**Example Secrets:**
```bash
# Good (64 hex characters = 32 bytes)
JWT_SECRET="a7f3b9c2e8d4f1a6b9c3e7f2a4d8b1c6e9f3a7b2d5c8e1f4a9b7d3c6e2f5a8b1"

# Bad (too short, predictable)
JWT_SECRET="mysecret123"
JWT_SECRET="lumiku2024"
```

---

### JWT_EXPIRES_IN

**Status:** [OPTIONAL]
**Default:** `7d`
**Format:** `<number><unit>`

JWT token expiration time.

```bash
JWT_EXPIRES_IN="7d"
```

**Valid Units:**
- `s` - Seconds
- `m` - Minutes
- `h` - Hours
- `d` - Days

**Examples:**
```bash
JWT_EXPIRES_IN="60s"   # 60 seconds
JWT_EXPIRES_IN="30m"   # 30 minutes
JWT_EXPIRES_IN="24h"   # 24 hours
JWT_EXPIRES_IN="7d"    # 7 days (default)
JWT_EXPIRES_IN="30d"   # 30 days
```

**Recommendations:**
- **Development:** `7d` or `30d` (convenience)
- **Production:** `7d` to `30d` (balance security and UX)
- **High Security:** `24h` (require frequent re-auth)

---

## CORS

### CORS_ORIGIN

**Status:** [REQUIRED-PROD]
**Format:** Valid URL

Allowed CORS origin for frontend requests.

```bash
# Production (HTTPS required)
CORS_ORIGIN="https://app.lumiku.com"
CORS_ORIGIN="https://app.superlumiku.com"

# Development
CORS_ORIGIN="http://localhost:5173"

# Multiple origins (comma-separated)
CORS_ORIGIN="http://localhost:5173,https://app.lumiku.com"
```

**Rules:**
- Must be valid URL format
- Must include protocol (http:// or https://)
- Production MUST use HTTPS
- Development can use HTTP
- No trailing slash

**Common Issues:**
```bash
# Wrong (missing protocol)
CORS_ORIGIN="localhost:5173"

# Wrong (trailing slash)
CORS_ORIGIN="http://localhost:5173/"

# Correct
CORS_ORIGIN="http://localhost:5173"
```

---

## Redis

### REDIS_HOST

**Status:** [REQUIRED-PROD]
**Default:** `localhost`
**Type:** Hostname or IP

Redis server hostname for queue and caching.

```bash
# Local
REDIS_HOST="localhost"

# Docker
REDIS_HOST="redis"

# Remote
REDIS_HOST="redis.example.com"
REDIS_HOST="10.0.1.50"
```

**Deployment Scenarios:**
- **Local Development:** `localhost` (optional, can skip Redis)
- **Docker Compose:** `redis` (service name)
- **Production:** Remote Redis server hostname/IP

---

### REDIS_PORT

**Status:** [OPTIONAL]
**Default:** `6379`
**Valid Range:** 1-65535

Redis server port number.

```bash
REDIS_PORT=6379
```

---

### REDIS_PASSWORD

**Status:** [OPTIONAL in dev, REQUIRED-PROD]
**Type:** String

Redis authentication password.

```bash
# Development (no password)
REDIS_PASSWORD=""

# Production (required)
REDIS_PASSWORD="your-redis-password-here"
```

**Security Notes:**
- Leave empty for local development
- REQUIRED in production
- Use strong password (16+ characters)
- Never commit to version control

---

## File Storage

### UPLOAD_PATH

**Status:** [OPTIONAL]
**Default:** `./uploads`
**Type:** Directory path (relative or absolute)

Directory for user file uploads.

```bash
# Relative path (default)
UPLOAD_PATH="./uploads"

# Absolute path
UPLOAD_PATH="/var/www/lumiku/uploads"

# Docker volume
UPLOAD_PATH="/app/uploads"
```

**Structure:**
```
uploads/
├── {userId}/
│   ├── {appId}/
│   │   ├── {projectId}/
│   │   │   ├── video1.mp4
│   │   │   └── image1.jpg
```

---

### OUTPUT_PATH

**Status:** [OPTIONAL]
**Default:** `./outputs`
**Type:** Directory path

Directory for generated output files.

```bash
# Relative path (default)
OUTPUT_PATH="./outputs"

# Absolute path
OUTPUT_PATH="/var/www/lumiku/outputs"
```

**Structure:**
```
outputs/
├── {userId}/
│   ├── {appId}/
│   │   ├── {generationId}/
│   │   │   ├── output_1.mp4
│   │   │   └── output_2.jpg
```

---

### MAX_FILE_SIZE

**Status:** [OPTIONAL]
**Default:** `524288000` (500 MB)
**Type:** Number (bytes)

Maximum file upload size in bytes.

```bash
# 500 MB (default)
MAX_FILE_SIZE=524288000

# 100 MB
MAX_FILE_SIZE=104857600

# 1 GB
MAX_FILE_SIZE=1073741824

# 2 GB
MAX_FILE_SIZE=2147483648
```

**Common Sizes:**
- 10 MB: `10485760`
- 50 MB: `52428800`
- 100 MB: `104857600`
- 500 MB: `524288000`
- 1 GB: `1073741824`
- 2 GB: `2147483648`

**Considerations:**
- Video files require larger limits (500MB-2GB)
- Image files typically need less (10-100MB)
- Higher limits = more storage/bandwidth usage
- Must also configure web server limits (Nginx, Apache)

---

## Payment Gateway (Duitku)

### DUITKU_MERCHANT_CODE

**Status:** [REQUIRED]
**Type:** String

Duitku merchant identification code.

```bash
DUITKU_MERCHANT_CODE="D12345"
```

**How to Obtain:**
1. Register at https://duitku.com
2. Complete merchant verification
3. Find in Duitku Dashboard → Settings → API Configuration

---

### DUITKU_API_KEY

**Status:** [REQUIRED]
**Minimum Length:** 10 characters
**Type:** String

Duitku API key for authentication.

```bash
DUITKU_API_KEY="your-duitku-api-key-from-dashboard"
```

**How to Obtain:**
1. Log into Duitku Dashboard
2. Navigate to Settings → API Configuration
3. Copy API Key

**Security:**
- Never commit to version control
- Regenerate if compromised
- Use different keys for sandbox vs production

---

### DUITKU_CALLBACK_URL

**Status:** [REQUIRED]
**Format:** Valid URL
**Type:** String

Callback URL for Duitku payment notifications.

```bash
# Production (HTTPS required)
DUITKU_CALLBACK_URL="https://api.lumiku.com/api/payments/callback"

# Development (can use ngrok)
DUITKU_CALLBACK_URL="https://abc123.ngrok.io/api/payments/callback"
DUITKU_CALLBACK_URL="http://localhost:3000/api/payments/callback"
```

**Requirements:**
- Must be publicly accessible from internet
- Must use HTTPS in production
- Must respond to POST requests
- Path must match backend route: `/api/payments/callback`

**Development Setup:**
```bash
# Use ngrok for local testing
ngrok http 3000
# Copy HTTPS URL and append /api/payments/callback
```

---

### DUITKU_RETURN_URL

**Status:** [REQUIRED]
**Format:** Valid URL
**Type:** String

URL where users are redirected after payment.

```bash
# Production
DUITKU_RETURN_URL="https://app.lumiku.com/payments/status"

# Development
DUITKU_RETURN_URL="http://localhost:5173/payments/status"
```

**Requirements:**
- Must be valid URL
- Should be a frontend page
- Should handle payment status display
- Can include query parameters for transaction ID

---

### DUITKU_BASE_URL

**Status:** [OPTIONAL]
**Default:** `https://passport.duitku.com`
**Type:** URL

Duitku API base URL.

```bash
# Production (default)
DUITKU_BASE_URL="https://passport.duitku.com"

# Sandbox
DUITKU_BASE_URL="https://sandbox.duitku.com"
```

**Usually not needed unless:**
- Using custom Duitku endpoint
- Testing with sandbox environment
- Duitku changes API URL

---

### DUITKU_ENV

**Status:** [OPTIONAL]
**Default:** `sandbox`
**Valid Values:** `sandbox`, `production`

Duitku environment mode.

```bash
# Testing (uses test payment methods)
DUITKU_ENV="sandbox"

# Live payments
DUITKU_ENV="production"
```

**Differences:**
- **Sandbox**: Test payments, no real money, sandbox API keys
- **Production**: Real payments, real money, production API keys

---

### PAYMENT_IP_WHITELIST_ENABLED

**Status:** [OPTIONAL]
**Default:** `true`
**Valid Values:** `true`, `false`

Enable IP whitelist validation for payment callbacks.

```bash
# Production (MUST be true)
PAYMENT_IP_WHITELIST_ENABLED="true"

# Development only (can disable for testing)
PAYMENT_IP_WHITELIST_ENABLED="false"
```

**SECURITY WARNING:**
- **NEVER** set to `false` in production!
- Protects against forged payment callbacks
- Only Duitku server IPs can POST to callback URL
- Disabling allows attackers to fake payments

---

## Rate Limiting

### RATE_LIMIT_ENABLED

**Status:** [OPTIONAL]
**Default:** `true`
**Valid Values:** `true`, `false`

Enable/disable rate limiting globally.

```bash
# Production (recommended)
RATE_LIMIT_ENABLED="true"

# Development (can disable for testing)
RATE_LIMIT_ENABLED="false"
```

---

### Login Rate Limits (IP-based)

#### RATE_LIMIT_LOGIN_WINDOW_MS

**Status:** [OPTIONAL]
**Default:** `900000` (15 minutes)
**Type:** Number (milliseconds)

Time window for login attempts.

```bash
# 15 minutes (default)
RATE_LIMIT_LOGIN_WINDOW_MS=900000

# 5 minutes
RATE_LIMIT_LOGIN_WINDOW_MS=300000

# 1 hour
RATE_LIMIT_LOGIN_WINDOW_MS=3600000
```

#### RATE_LIMIT_LOGIN_MAX_ATTEMPTS

**Status:** [OPTIONAL]
**Default:** `5`
**Type:** Number

Maximum login attempts per window.

```bash
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5
```

**Example:** 5 attempts per 15 minutes means after 5 failed logins from the same IP, that IP is blocked for 15 minutes.

---

### Registration Rate Limits (IP-based)

#### RATE_LIMIT_REGISTER_WINDOW_MS

**Status:** [OPTIONAL]
**Default:** `3600000` (1 hour)
**Type:** Number (milliseconds)

```bash
RATE_LIMIT_REGISTER_WINDOW_MS=3600000
```

#### RATE_LIMIT_REGISTER_MAX_ATTEMPTS

**Status:** [OPTIONAL]
**Default:** `3`
**Type:** Number

```bash
RATE_LIMIT_REGISTER_MAX_ATTEMPTS=3
```

**Example:** 3 registrations per hour from same IP.

---

### Password Reset Rate Limits (IP-based)

#### RATE_LIMIT_PASSWORD_RESET_WINDOW_MS

**Status:** [OPTIONAL]
**Default:** `3600000` (1 hour)
**Type:** Number (milliseconds)

```bash
RATE_LIMIT_PASSWORD_RESET_WINDOW_MS=3600000
```

#### RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS

**Status:** [OPTIONAL]
**Default:** `3`
**Type:** Number

```bash
RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS=3
```

---

### Profile Update Rate Limits

#### RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS

**Status:** [OPTIONAL]
**Default:** `3600000` (1 hour)
**Type:** Number (milliseconds)

```bash
RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS=3600000
```

#### RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS

**Status:** [OPTIONAL]
**Default:** `10`
**Type:** Number

```bash
RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS=10
```

---

### Account Lockout (Account-based)

#### RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS

**Status:** [OPTIONAL]
**Default:** `10`
**Type:** Number

Failed login attempts before account lockout.

```bash
RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS=10
```

#### RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS

**Status:** [OPTIONAL]
**Default:** `1800000` (30 minutes)
**Type:** Number (milliseconds)

Account lockout duration.

```bash
# 30 minutes (default)
RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS=1800000

# 1 hour
RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS=3600000
```

---

### Global Rate Limits (System-wide)

#### RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS

**Status:** [OPTIONAL]
**Default:** `60000` (1 minute)
**Type:** Number (milliseconds)

```bash
RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS=60000
```

#### RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS

**Status:** [OPTIONAL]
**Default:** `1000`
**Type:** Number

Maximum auth requests system-wide per window.

```bash
RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS=1000
```

**Purpose:** Protect against system-wide DDoS attacks.

---

### RATE_LIMIT_REDIS_URL

**Status:** [OPTIONAL]
**Type:** Redis connection string

Redis URL for distributed rate limiting.

```bash
RATE_LIMIT_REDIS_URL="redis://localhost:6379"
RATE_LIMIT_REDIS_URL="redis://:password@host:6379"
```

**Falls back to:**
- In-memory storage if not set (single server only)
- Or uses REDIS_HOST/REDIS_PORT/REDIS_PASSWORD if available

---

## Trusted Proxies

### TRUSTED_PROXY_IPS

**Status:** [OPTIONAL]
**Type:** Comma-separated list of IPs
**Default:** Empty (no trusted proxies)

Trusted proxy IPs for secure IP extraction from X-Forwarded-For headers.

```bash
# Single proxy
TRUSTED_PROXY_IPS="10.0.0.1"

# Multiple proxies
TRUSTED_PROXY_IPS="10.0.0.1,10.0.0.2,10.0.0.3"

# Cloudflare
TRUSTED_PROXY_IPS="173.245.48.0/20,103.21.244.0/22,103.22.200.0/22"

# No proxies (default)
TRUSTED_PROXY_IPS=""
```

**When to Use:**
- Behind reverse proxy (Nginx, Apache)
- Behind CDN (Cloudflare, Fastly)
- Behind load balancer

**Security:**
- Only list IPs you control
- Prevents IP spoofing via X-Forwarded-For
- Required for accurate rate limiting and logging

---

## AI Services

### ANTHROPIC_API_KEY

**Status:** [FEATURE]
**Type:** String

Anthropic Claude API key for AI features.

```bash
ANTHROPIC_API_KEY="sk-ant-..."
```

**Required For:**
- Claude-based features
- AI chat/assistance

**Obtain:** https://console.anthropic.com/settings/keys

---

### OPENAI_API_KEY

**Status:** [FEATURE]
**Type:** String

OpenAI API key for GPT models.

```bash
OPENAI_API_KEY="sk-..."
```

**Required For:**
- GPT-based features
- OpenAI image generation

**Obtain:** https://platform.openai.com/api-keys

---

### FLUX_API_KEY

**Status:** [FEATURE]
**Type:** String

Flux API key for image generation.

```bash
FLUX_API_KEY="your-flux-api-key"
```

**Required For:**
- Flux-based image generation

---

### MODELSLAB_API_KEY

**Status:** [FEATURE]
**Type:** String

ModelsLab API key for AI models.

```bash
MODELSLAB_API_KEY="your-modelslab-key"
```

**Obtain:** https://modelslab.com

---

### EDENAI_API_KEY

**Status:** [FEATURE]
**Type:** String

Eden AI API key for multi-provider AI access.

```bash
EDENAI_API_KEY="your-edenai-key"
```

**Obtain:** https://www.edenai.co

---

### SEGMIND_API_KEY

**Status:** [FEATURE]
**Type:** String

Segmind API key for AI models.

```bash
SEGMIND_API_KEY="your-segmind-key"
```

---

### HUGGINGFACE_API_KEY

**Status:** [FEATURE]
**Type:** String

Hugging Face API key for avatar generation.

```bash
HUGGINGFACE_API_KEY="hf_..."
```

**Required For:**
- Avatar Generator app
- Hugging Face Stable Diffusion models

**Obtain:** https://huggingface.co/settings/tokens

---

### SAM_SERVER_URL

**Status:** [FEATURE]
**Type:** URL

SAM (Segment Anything Model) server URL.

```bash
SAM_SERVER_URL="http://localhost:8000"
```

**Required For:**
- Poster Editor app
- Image segmentation features

---

### AI Service Timeouts

```bash
# API request timeouts (milliseconds)
AI_TIMEOUT_DEFAULT=30000      # 30 seconds
AI_TIMEOUT_IMAGE_GEN=120000   # 2 minutes
AI_TIMEOUT_VIDEO_GEN=300000   # 5 minutes
```

---

## FFmpeg

### FFMPEG_PATH

**Status:** [OPTIONAL]
**Default:** `ffmpeg` (uses system PATH)
**Type:** File path

Path to FFmpeg executable.

```bash
# Use system PATH (default)
FFMPEG_PATH="ffmpeg"

# Custom path
FFMPEG_PATH="/usr/local/bin/ffmpeg"
FFMPEG_PATH="C:\\ffmpeg\\bin\\ffmpeg.exe"  # Windows
```

**Installation:**
- **Linux:** `sudo apt install ffmpeg`
- **macOS:** `brew install ffmpeg`
- **Windows:** Download from https://www.gyan.dev/ffmpeg/builds/

---

### FFPROBE_PATH

**Status:** [OPTIONAL]
**Default:** `ffprobe` (uses system PATH)
**Type:** File path

Path to FFprobe executable.

```bash
# Use system PATH (default)
FFPROBE_PATH="ffprobe"

# Custom path
FFPROBE_PATH="/usr/local/bin/ffprobe"
```

---

## Environment-Specific Configurations

### Development (.env.development)

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://lumiku:lumiku@localhost:5432/lumiku_dev"
JWT_SECRET="dev-secret-min-32-chars-for-testing-only-not-secure"
JWT_EXPIRES_IN="30d"
CORS_ORIGIN="http://localhost:5173"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
UPLOAD_PATH="./uploads"
OUTPUT_PATH="./outputs"
RATE_LIMIT_ENABLED="false"
DUITKU_ENV="sandbox"
PAYMENT_IP_WHITELIST_ENABLED="false"
```

---

### Production (.env.production)

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://lumiku:STRONG_PASSWORD@db.internal:5432/lumiku_prod"
JWT_SECRET="GENERATED_SECURE_SECRET_64_CHARACTERS_MINIMUM"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="https://app.lumiku.com"
REDIS_HOST="redis.internal"
REDIS_PORT="6379"
REDIS_PASSWORD="STRONG_REDIS_PASSWORD"
UPLOAD_PATH="/var/www/lumiku/uploads"
OUTPUT_PATH="/var/www/lumiku/outputs"
MAX_FILE_SIZE=524288000
RATE_LIMIT_ENABLED="true"
DUITKU_ENV="production"
DUITKU_MERCHANT_CODE="YOUR_MERCHANT_CODE"
DUITKU_API_KEY="YOUR_API_KEY"
DUITKU_CALLBACK_URL="https://api.lumiku.com/api/payments/callback"
DUITKU_RETURN_URL="https://app.lumiku.com/payments/status"
PAYMENT_IP_WHITELIST_ENABLED="true"
TRUSTED_PROXY_IPS="10.0.0.1,10.0.0.2"
```

---

## Validation & Errors

All environment variables are validated at startup using Zod. Common errors:

### JWT_SECRET Too Short
```
Error: JWT_SECRET must be at least 32 characters long
```
**Fix:** Generate a secure secret using `openssl rand -base64 32`

### DATABASE_URL Invalid Format
```
Error: DATABASE_URL must be a valid connection string
```
**Fix:** Check format: `postgresql://user:password@host:port/database`

### Invalid URL Format
```
Error: CORS_ORIGIN must be a valid URL
```
**Fix:** Include protocol: `http://localhost:5173` not `localhost:5173`

### Missing Required Variable
```
Error: DATABASE_URL is required
```
**Fix:** Add the variable to your .env file

---

## Security Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Different Values Per Environment
- Development: Weaker secrets OK
- Staging: Production-like secrets
- Production: Maximum security

### 3. Rotate Secrets Regularly
- JWT_SECRET: Every 90 days
- API Keys: When team members leave
- Database Passwords: Every 6 months

### 4. Use Secret Management
**Production Recommendations:**
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Environment variables via CI/CD

### 5. Validate on Startup
Application validates all variables on startup and **fails fast** if invalid.

---

## Troubleshooting

### Application Won't Start

**Check:**
1. All REQUIRED variables are set
2. DATABASE_URL is correct and accessible
3. JWT_SECRET is at least 32 characters
4. Redis is running (if REDIS_HOST is set)

**Debug:**
```bash
# Print environment variables (BE CAREFUL - CONTAINS SECRETS)
node -e "console.log(require('dotenv').config())"

# Check if database is accessible
psql $DATABASE_URL -c "SELECT 1"

# Check if Redis is accessible
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

### CORS Errors

**Symptoms:** Browser shows CORS error
**Fix:** Check CORS_ORIGIN matches frontend URL exactly (including protocol)

### Payment Callbacks Fail

**Symptoms:** Payments succeed but credits not added
**Fixes:**
- Check DUITKU_CALLBACK_URL is publicly accessible
- Verify IP whitelist if enabled
- Check Duitku dashboard for callback logs

---

## Related Documentation

- **[Architecture Overview](../architecture/overview.md)** - System architecture
- **[Production Deployment](./production-deployment.md)** - Deployment guide
- **[Security Overview](../security/security-overview.md)** - Security best practices
- **[Payment Security](../security/payment-security.md)** - Payment gateway security

---

**Document Status:** Current
**Last Updated:** 2025-10-14
**Maintainer:** Technical Team

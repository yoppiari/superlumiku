# Production Deployment Checklist
# Lumiku (Superlumiku) Application

**Version:** 1.0.0
**Last Updated:** 2025-10-14
**Security Sprint Status:** ✅ COMPLETE (6/6 P0 Items)
**Prerequisites:** Based on SECURITY_FIX_STATUS.md

---

## Table of Contents

1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Environment Variables Reference](#environment-variables-reference)
3. [Secret Generation Scripts](#secret-generation-scripts)
4. [Redis Setup (Production Required)](#redis-setup-production-required)
5. [Duitku Payment Configuration](#duitku-payment-configuration)
6. [Startup Validation Checklist](#startup-validation-checklist)
7. [Deployment Steps](#deployment-steps)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring Setup](#monitoring-setup)
10. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Requirements

### ⚠️ Critical Prerequisites

Before deploying to production, you MUST have:

- [ ] **Redis Instance** - Distributed rate limiting requires Redis (production mandatory)
- [ ] **Secure JWT Secret** - 64+ character cryptographically random secret generated
- [ ] **Duitku Production Credentials** - Real merchant code and API key from Duitku dashboard
- [ ] **HTTPS Domain** - SSL certificate active on production domain
- [ ] **Database** - PostgreSQL database provisioned and accessible
- [ ] **Environment Variables** - All required variables configured in deployment platform

### Security Posture Verification

- [ ] All 6 P0 security items complete (JWT, Payment, Rate Limiting, Authorization, Config)
- [ ] 77+ security tests passing
- [ ] No hardcoded secrets in codebase
- [ ] All environment variables validated at startup

---

## Environment Variables Reference

### 1. Core Application (REQUIRED)

```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3000

# CORS - Frontend Origin (MUST be HTTPS in production)
CORS_ORIGIN=https://app.lumiku.com
```

### 2. Database (REQUIRED)

```env
# PostgreSQL Connection String
# Format: postgresql://username:password@host:port/database?schema=public
DATABASE_URL=postgresql://lumiku_user:YOUR_SECURE_PASSWORD@your-db-host.com:5432/lumiku_production?schema=public
```

**Note:** Replace with your actual database credentials. Never use default passwords.

### 3. JWT Authentication (REQUIRED) 🔐

```env
# CRITICAL: Must be cryptographically secure, minimum 32 chars (64+ recommended)
# Generate using the script in section below
JWT_SECRET=YOUR_GENERATED_64_CHAR_HEX_SECRET_HERE

# Token expiration (7 days recommended)
JWT_EXPIRES_IN=7d
```

**⚠️ SECURITY WARNING:**
- **NEVER** use test/default secrets in production
- **NEVER** commit JWT_SECRET to version control
- **ROTATE** secrets every 90 days
- Application will **REFUSE TO START** with weak secrets in production

### 4. Redis (REQUIRED for Production) 🔒

```env
# Redis is MANDATORY for production rate limiting
# Without Redis, the application will exit with error in production

# Redis Connection (Choose Option A or B)

# Option A: Basic Connection (Host/Port/Password)
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password

# Option B: Full Redis URL (Alternative to above)
# RATE_LIMIT_REDIS_URL=redis://:password@host:port
```

**Production Redis Options:**
1. **Upstash** (Recommended) - Serverless, auto-scaling, generous free tier
2. **Redis Cloud** - Managed Redis with monitoring
3. **Self-Hosted** - Full control, requires maintenance

### 5. Payment Gateway - Duitku (REQUIRED) 💳

```env
# Duitku Credentials (from Duitku Dashboard)
DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=your-actual-api-key-from-dashboard

# Environment Mode
DUITKU_ENV=production

# Callback & Return URLs (MUST use HTTPS in production)
DUITKU_CALLBACK_URL=https://app.lumiku.com/api/payment/duitku/callback
DUITKU_RETURN_URL=https://app.lumiku.com/payments/status

# Base URL (usually default)
DUITKU_BASE_URL=https://passport.duitku.com

# IP Whitelist Protection (CRITICAL - NEVER disable in production)
PAYMENT_IP_WHITELIST_ENABLED=true
```

**⚠️ CRITICAL SECURITY:**
- **NEVER** set `PAYMENT_IP_WHITELIST_ENABLED=false` in production
- Callback URL **MUST** match route: `/api/payment/duitku/callback`
- URLs **MUST** use HTTPS (enforced by validation)

### 6. Rate Limiting (OPTIONAL - Recommended Defaults)

```env
# Global Rate Limiting Toggle
RATE_LIMIT_ENABLED=true

# Login Rate Limits (IP-based)
RATE_LIMIT_LOGIN_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5          # 5 attempts per window

# Registration Rate Limits (IP-based)
RATE_LIMIT_REGISTER_WINDOW_MS=3600000    # 1 hour
RATE_LIMIT_REGISTER_MAX_ATTEMPTS=3       # 3 attempts per window

# Password Reset Rate Limits (IP-based)
RATE_LIMIT_PASSWORD_RESET_WINDOW_MS=3600000   # 1 hour
RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS=3      # 3 attempts per window

# Profile Update Rate Limits
RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS=3600000   # 1 hour
RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS=10     # 10 attempts per window

# Account Lockout (Account-based)
RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS=10        # 10 failed logins
RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS=1800000 # 30 minutes

# Global Rate Limits (System-wide)
RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS=60000        # 1 minute
RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS=1000      # 1000 requests/minute
```

**Note:** These are security-hardened defaults. Only customize if you have specific requirements.

### 7. Trusted Proxies (OPTIONAL but Recommended)

```env
# Comma-separated list of trusted proxy IPs
# Required if behind Cloudflare, Nginx, or load balancer
# Used for secure IP extraction from X-Forwarded-For headers
TRUSTED_PROXY_IPS=cloudflare.ip1,cloudflare.ip2,nginx.proxy.ip
```

### 8. File Storage (OPTIONAL - Use Defaults)

```env
# Upload and output directories
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000  # 500MB
```

### 9. AI Services (OPTIONAL - Feature-specific)

```env
# Only required if using AI features
ANTHROPIC_API_KEY=your-anthropic-api-key
# OPENAI_API_KEY=your-openai-api-key
# FLUX_API_KEY=your-flux-api-key
```

### 10. FFmpeg (OPTIONAL - Use Defaults)

```env
# FFmpeg paths (usually auto-detected from PATH)
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

---

## Secret Generation Scripts

### Generate Secure JWT Secret

#### Option 1: Using OpenSSL (Linux/Mac/WSL)

```bash
# Generate 64-character hex secret (32 bytes)
openssl rand -hex 32

# Output example:
# 8d024b643b19488486b7aa1ab4dd0a1cf1566d76603252f659ce9bd905fc06e9
```

#### Option 2: Using Node.js (Cross-platform)

```bash
# Generate 64-character hex secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# 7f8c9e2a1b3d4f5a6c7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c
```

#### Option 3: Using Bun (If installed)

```bash
# Generate 64-character hex secret
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Option 4: Windows PowerShell

```powershell
# Generate secure random bytes and convert to hex
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
($bytes | ForEach-Object ToString X2) -join ''
```

### Copy to Secure Storage

**⚠️ IMPORTANT:** After generating, immediately:
1. Copy to secure password manager (1Password, LastPass, etc.)
2. Set in deployment platform (Coolify, Vercel, AWS Secrets Manager)
3. **NEVER** paste in `.env` file that might be committed
4. Clear terminal history: `history -c` (Linux/Mac) or close terminal

---

## Redis Setup (Production Required)

### ⚠️ Critical: Redis is MANDATORY for Production

The application will **EXIT IMMEDIATELY** in production if Redis is not configured. Rate limiting requires distributed storage to work across multiple instances.

---

### Option A: Upstash (Recommended) ⭐

**Why Upstash:**
- ✅ Serverless - No server management
- ✅ Auto-scaling - Handles traffic spikes
- ✅ Global replication - Low latency worldwide
- ✅ Generous free tier - 10K commands/day free
- ✅ REST API - Works with any platform
- ✅ Built-in monitoring - Dashboard included

**Setup Steps:**

1. **Sign up for Upstash**
   ```
   Visit: https://upstash.com
   Click: "Sign Up" (free, no credit card required)
   ```

2. **Create Redis Database**
   ```
   Dashboard > Create Database
   - Name: lumiku-production
   - Type: Regional (choose closest to your app)
   - TLS: Enabled (recommended)
   Click: Create
   ```

3. **Get Connection Details**
   ```
   Database Dashboard > Details Tab
   Copy these values:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN

   Or use standard connection:
   - Endpoint (Host)
   - Port (usually 6379 or custom)
   - Password
   ```

4. **Configure Environment Variables**
   ```env
   # Standard Redis Connection (Recommended)
   REDIS_HOST=your-endpoint.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your-upstash-password

   # Alternative: REST API (if using Upstash REST)
   # RATE_LIMIT_REDIS_URL=redis://:password@host:port
   ```

5. **Test Connection**
   ```bash
   # Using redis-cli
   redis-cli -h your-endpoint.upstash.io -p 6379 -a your-password PING
   # Expected: PONG

   # Or test via REST API
   curl -X POST https://your-endpoint.upstash.io/ping \
     -H "Authorization: Bearer your-token"
   # Expected: {"result":"PONG"}
   ```

**Upstash Dashboard Features:**
- Real-time command monitoring
- Memory usage tracking
- Connection statistics
- Data browser (inspect keys)
- Slow query log

---

### Option B: Redis Cloud

**Setup Steps:**

1. **Sign up for Redis Cloud**
   ```
   Visit: https://redis.com/try-free
   Sign up: Free tier available
   ```

2. **Create Subscription**
   ```
   Choose: Fixed plan (free tier)
   Region: Closest to your application
   ```

3. **Create Database**
   ```
   Name: lumiku-production
   Memory: 30MB (free tier)
   Enable: TLS, Persistence
   ```

4. **Get Connection Details**
   ```
   Database Details:
   - Public endpoint
   - Port
   - Password
   ```

5. **Configure Environment Variables**
   ```env
   REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
   REDIS_PORT=12345
   REDIS_PASSWORD=your-redis-cloud-password
   ```

---

### Option C: Self-Hosted Redis

**⚠️ Only for Advanced Users** - Requires server management, security hardening, and monitoring setup.

**Installation (Ubuntu/Debian):**

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf
```

**Production Configuration:**

```conf
# Bind to specific IP (not 0.0.0.0)
bind 127.0.0.1 YOUR_SERVER_IP

# Enable password authentication
requirepass YOUR_SECURE_PASSWORD

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Max memory policy
maxmemory 256mb
maxmemory-policy allkeys-lru

# Enable AOF persistence (recommended)
appendonly yes
appendfsync everysec
```

**Start Redis:**

```bash
# Enable and start
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify running
sudo systemctl status redis-server
redis-cli -a YOUR_PASSWORD PING
```

**Security Hardening:**

```bash
# Firewall rules (only allow your app server)
sudo ufw allow from YOUR_APP_SERVER_IP to any port 6379

# Disable dangerous commands
redis-cli CONFIG SET rename-command FLUSHDB ""
redis-cli CONFIG SET rename-command FLUSHALL ""
```

**Environment Variables:**

```env
REDIS_HOST=your-server-ip
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-redis-password
```

---

### Redis Verification Checklist

Before deployment, verify:

- [ ] Redis instance created and running
- [ ] Connection credentials saved securely
- [ ] Test connection successful (`PING` returns `PONG`)
- [ ] Password authentication enabled (production)
- [ ] TLS/SSL enabled (if supported by provider)
- [ ] Firewall rules configured (if self-hosted)
- [ ] Persistence enabled (AOF or RDB)
- [ ] Monitoring/alerting configured
- [ ] Backup strategy in place (if self-hosted)

---

### Redis Troubleshooting

**Issue: Connection Refused**
```bash
# Check if Redis is running
redis-cli -h your-host -p your-port PING

# Check firewall
telnet your-host your-port

# Check DNS resolution
nslookup your-host
```

**Issue: Authentication Failed**
```bash
# Verify password
redis-cli -h your-host -p your-port -a your-password PING

# Check if AUTH required
redis-cli -h your-host -p your-port INFO
```

**Issue: Slow Performance**
```bash
# Check memory usage
redis-cli -a your-password INFO memory

# Check slow queries
redis-cli -a your-password SLOWLOG GET 10

# Monitor real-time
redis-cli -a your-password --latency-history
```

---

## Duitku Payment Configuration

### Step 1: Get Duitku Credentials

**Access Duitku Dashboard:**
```
1. Login: https://dashboard.duitku.com (production) or https://sandbox.duitku.com (testing)
2. Navigate: "Proyek Saya" (My Projects)
3. Select: Your project (e.g., "Lumiku")
```

**Get Merchant Code:**
```
Location: Project details page
Label: "Merchant Code" or "Kode Merchant"
Format: DS25180, D12345, etc.
Example: DS25180
```

**Get API Key (Merchant Key):**
```
1. In project details, click: "Klik disini untuk melihat API Key (Merchant Key)"
2. Enter your Duitku password
3. Copy the displayed API Key (long alphanumeric string)
4. Store securely - treat like a password
```

---

### Step 2: Configure Duitku Callback URL

**⚠️ CRITICAL: Callback URL Must Match Your Route**

**Your Application Route:**
```
Backend Route: /api/payment/duitku/callback
Full Production URL: https://app.lumiku.com/api/payment/duitku/callback
```

**Update in Duitku Dashboard:**

1. **Navigate to Project Settings**
   ```
   Dashboard > Proyek Saya > Edit Project "Lumiku"
   ```

2. **Update Callback URL Field**
   ```
   Field: "Url Callback Proyek"
   Current (WRONG): https://app.lumiku.com/api/mainapp/payment/callback
   Update To (CORRECT): https://app.lumiku.com/api/payment/duitku/callback
   ```

3. **Save Changes**
   ```
   Click: "Simpan" or "Save"
   ```

4. **Verify Update**
   ```
   Refresh page and confirm URL is saved correctly
   ```

---

### Step 3: Verify Duitku IP Whitelist

**Production IPs (Hardcoded in Application):**
```javascript
// These IPs are automatically whitelisted when DUITKU_ENV=production
182.23.85.8
182.23.85.9
182.23.85.10
182.23.85.13
182.23.85.14
103.177.101.184
103.177.101.185
103.177.101.186
103.177.101.189
103.177.101.190
```

**Sandbox IPs (for Testing):**
```javascript
// These IPs are automatically whitelisted when DUITKU_ENV=sandbox
182.23.85.11
182.23.85.12
103.177.101.187
103.177.101.188
```

**Verification:**
```bash
# No action needed - IPs are hardcoded
# Just ensure DUITKU_ENV is set correctly:
# - "sandbox" for testing
# - "production" for live payments
```

---

### Step 4: Environment Variables for Duitku

**Set These in Your Deployment Platform:**

```env
# Duitku Credentials (from dashboard)
DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=your-actual-api-key-from-dashboard-do-not-share

# Environment Mode (IMPORTANT)
DUITKU_ENV=production

# Callback URL (MUST match route exactly)
DUITKU_CALLBACK_URL=https://app.lumiku.com/api/payment/duitku/callback

# Return URL (where user is redirected after payment)
DUITKU_RETURN_URL=https://app.lumiku.com/payments/status

# Base URL (usually default, don't change unless instructed by Duitku)
DUITKU_BASE_URL=https://passport.duitku.com

# IP Whitelist Protection (CRITICAL - NEVER disable in production)
PAYMENT_IP_WHITELIST_ENABLED=true
```

---

### Step 5: Testing Duitku Integration

**Sandbox Testing (Before Production):**

1. **Set Sandbox Mode**
   ```env
   DUITKU_ENV=sandbox
   DUITKU_MERCHANT_CODE=your-sandbox-merchant-code
   DUITKU_API_KEY=your-sandbox-api-key
   DUITKU_CALLBACK_URL=https://your-staging-domain.com/api/payment/duitku/callback
   ```

2. **Create Test Payment**
   ```bash
   curl -X POST https://your-staging-domain.com/api/payment/duitku/create \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "packageId": "basic",
       "credits": 100,
       "amount": 50000,
       "productName": "100 Credits - Test"
     }'
   ```

3. **Complete Test Payment**
   ```
   - Use Duitku sandbox payment methods
   - Verify callback received
   - Check credits updated in database
   - Verify security logs
   ```

4. **Verify Security Layers**
   ```bash
   # Test invalid signature (should fail)
   curl -X POST https://your-staging-domain.com/api/payment/duitku/callback \
     -H "Content-Type: application/json" \
     -d '{
       "merchantOrderId": "TEST-123",
       "amount": 50000,
       "merchantCode": "DS25180",
       "signature": "invalid-signature",
       "resultCode": "00"
     }'
   # Expected: 400 Bad Request, log: PAYMENT_SIGNATURE_INVALID
   ```

**Production Testing (After Deployment):**

1. **Switch to Production Mode**
   ```env
   DUITKU_ENV=production
   DUITKU_MERCHANT_CODE=your-production-merchant-code
   DUITKU_API_KEY=your-production-api-key
   ```

2. **Create Small Test Payment**
   ```
   - Use minimum payment amount
   - Complete with real payment method
   - Verify callback received
   - Verify credits added
   - Verify logs and monitoring
   ```

3. **Monitor First 24 Hours**
   ```
   - Check error logs for issues
   - Verify all callbacks successful
   - Monitor security events
   - Review payment success rate
   ```

---

### Duitku Configuration Checklist

- [ ] Merchant Code obtained from Duitku dashboard
- [ ] API Key obtained and stored securely
- [ ] Callback URL updated in Duitku dashboard to match route
- [ ] Environment variables configured with production credentials
- [ ] `DUITKU_ENV=production` set (after successful sandbox testing)
- [ ] `PAYMENT_IP_WHITELIST_ENABLED=true` (CRITICAL)
- [ ] Callback URL uses HTTPS (enforced by validation)
- [ ] Return URL configured (where users go after payment)
- [ ] Sandbox testing completed successfully
- [ ] Security layers verified (signature, IP whitelist, idempotency)

---

## Startup Validation Checklist

### What Gets Validated on Startup

The application performs comprehensive validation before starting. If ANY validation fails, the application will **EXIT IMMEDIATELY** with a clear error message.

---

### 1. Environment Variable Validation ✅

**What's Checked:**
- All required variables present
- Correct data types (numbers, URLs, enums)
- Valid formats (URLs must be https:// in production)
- No weak/default values in production

**Variables Validated:**
- `NODE_ENV` - Must be "development", "production", or "test"
- `PORT` - Must be number between 1-65535
- `DATABASE_URL` - Must be non-empty string
- `JWT_SECRET` - Length, entropy, blacklist (see below)
- `CORS_ORIGIN` - Must be valid URL
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Format validation
- `DUITKU_*` - All payment variables validated
- `RATE_LIMIT_*` - All rate limit configurations validated

**Expected Startup Output:**
```
✅ Environment variables validated successfully
📦 NODE_ENV: production
📦 PORT: 3000
📦 DATABASE_URL: postgresql://...
📦 CORS_ORIGIN: https://app.lumiku.com
```

**If Validation Fails:**
```
❌ Environment variable validation failed:
- JWT_SECRET is required in production mode
- DUITKU_CALLBACK_URL must use HTTPS in production
Process exiting...
```

---

### 2. JWT Secret Security Validation 🔐

**What's Checked:**
- **Presence:** JWT_SECRET exists (production)
- **Length:** Minimum 32 characters (production), 16 (development)
- **Blacklist:** Not in list of 10 known weak secrets
- **Entropy:** Shannon entropy ≥ 3.5 bits/char
- **Overall Security:** Passes all checks

**Blacklisted Secrets (Application Will Refuse These):**
```
change-this-secret-key
your-secret-key-here
mysecretkey
secret
changeme
password
test-secret
dev-secret
development-secret-key
your-256-bit-secret
```

**Security Levels:**
```
High Security (✅ Production):
- Length: 32+ characters
- Entropy: ≥ 3.5 bits/char
- Not blacklisted
- Example: 8d024b643b19488486b7aa1ab4dd0a1cf1566d76603252f659ce9bd905fc06e9

Medium Security (⚠️ Development Warning):
- Length: 16-31 characters
- Some entropy
- Warning logged, but application continues

Low Security (❌ Production Fails):
- Length: < 32 characters
- Low entropy
- Blacklisted secret
- Application exits immediately
```

**Expected Startup Output:**
```
🔐 JWT Secret Validation:
  ✅ Length: 64 characters
  ✅ Entropy: 4.2 bits/char (High)
  ✅ Blacklist: Pass
  ✅ Overall: SECURE
```

**If Validation Fails (Production):**
```
❌ CRITICAL: JWT_SECRET is not secure enough for production

Issues found:
- Length: 8 characters (minimum 32 required)
- Entropy: 2.1 bits/char (minimum 3.5 required)
- Blacklisted: "test-secret" detected

Generate a secure secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Process exiting for security...
```

**If Validation Warns (Development):**
```
⚠️ WARNING: JWT_SECRET is weak

A secure secret has been auto-generated for this session:
  7f8c9e2a1b3d4f5a6c7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c

To persist sessions, add this to .env:
  JWT_SECRET=7f8c9e2a1b3d4f5a6c7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c

Application continuing with auto-generated secret...
```

---

### 3. Database Connection Validation 🗄️

**What's Checked:**
- Database URL is accessible
- Can establish connection
- Schema exists
- Migrations are up to date

**Expected Startup Output:**
```
✅ Database connected successfully
📦 Database: PostgreSQL
📦 Host: your-db-host.com
📦 Schema: public
```

**If Connection Fails:**
```
❌ Database connection failed: Connection refused

Troubleshooting:
1. Verify DATABASE_URL is correct
2. Check database server is running
3. Verify network connectivity
4. Check firewall rules

Process exiting...
```

---

### 4. Redis Connection Validation 🔴

**What's Checked:**
- Redis host reachable
- Authentication successful
- Can perform PING
- Connection stable

**Expected Startup Output (Production):**
```
✅ Redis connected successfully
📦 Redis host: your-redis-host.upstash.io
📦 Redis port: 6379
🔒 Rate limiting: Distributed (Redis-backed)
```

**Expected Startup Output (Development without Redis):**
```
⚠️ WARNING: Redis not configured
⚠️ Using in-memory rate limiting (not suitable for production)
🔒 Rate limiting: In-memory (single instance only)
```

**If Connection Fails (Production):**
```
❌ CRITICAL: Redis connection required in production

Error: Connection refused at your-redis-host:6379

Redis is REQUIRED for distributed rate limiting in production.

Setup Options:
1. Upstash (Recommended): https://upstash.com
2. Redis Cloud: https://redis.com/try-free
3. Self-hosted: Install Redis server

Environment Variables Needed:
  REDIS_HOST=your-redis-host
  REDIS_PORT=6379
  REDIS_PASSWORD=your-password

Process exiting...
```

---

### 5. Payment Security Validation 💳

**What's Checked:**
- Duitku credentials format valid
- Callback URL uses HTTPS (production)
- Merchant code not test/default value (production)
- IP whitelist enabled (production)

**Expected Startup Output:**
```
✅ Payment gateway configured
📦 Merchant: DS25180
📦 Environment: production
📦 Callback: https://app.lumiku.com/api/payment/duitku/callback
🔒 IP Whitelist: Enabled (10 whitelisted IPs)
```

**If Validation Fails:**
```
❌ Payment configuration invalid in production:

Issues:
- DUITKU_CALLBACK_URL must use HTTPS (got: http://...)
- DUITKU_MERCHANT_CODE appears to be test value: "TEST123"
- PAYMENT_IP_WHITELIST_ENABLED must be "true" in production

Security Requirements:
- All payment URLs must use HTTPS in production
- Use real merchant credentials from Duitku dashboard
- IP whitelist cannot be disabled in production

Process exiting...
```

---

### 6. Rate Limiting Validation 🚦

**What's Checked:**
- Rate limit configuration values are numbers
- Window durations are positive
- Max attempts are reasonable
- Redis connection if enabled

**Expected Startup Output:**
```
✅ Rate limiting configured
🔒 Storage: Distributed (Redis)
📦 Login: 5 attempts per 15 minutes
📦 Register: 3 attempts per 1 hour
📦 Account Lockout: 10 attempts = 30 min lock
```

**If Validation Fails:**
```
❌ Rate limit configuration invalid:

Issues:
- RATE_LIMIT_LOGIN_MAX_ATTEMPTS must be a positive number (got: "abc")
- RATE_LIMIT_LOGIN_WINDOW_MS must be positive (got: 0)

Process exiting...
```

---

### 7. FFmpeg Availability Check 🎬

**What's Checked:**
- FFmpeg binary accessible
- FFprobe binary accessible
- Both can execute successfully

**Expected Startup Output:**
```
✅ FFmpeg available
📦 FFmpeg: /usr/bin/ffmpeg (version 4.4.2)
📦 FFprobe: /usr/bin/ffprobe (version 4.4.2)
```

**If Check Fails:**
```
⚠️ WARNING: FFmpeg not found in PATH

Video processing features will not work until FFmpeg is installed.

Installation:
- Ubuntu/Debian: sudo apt install ffmpeg
- macOS: brew install ffmpeg
- Windows: Download from https://ffmpeg.org/download.html

Application continuing (FFmpeg not required for startup)...
```

---

### Complete Startup Success Output

**When All Validations Pass:**

```
🚀 Superlumiku Server Starting...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ENVIRONMENT VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Environment variables validated successfully
📦 NODE_ENV: production
📦 PORT: 3000
📦 DATABASE_URL: postgresql://***:***@your-db-host/lumiku
📦 CORS_ORIGIN: https://app.lumiku.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  JWT SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 JWT Secret Status: ✅ SECURE
  ✅ Length: 64 characters
  ✅ Entropy: 4.2 bits/char (High)
  ✅ Blacklist: Pass
📦 Token Expiration: 7 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Database connected successfully
📦 Database: PostgreSQL
📦 Host: your-db-host.com
📦 Schema: public

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REDIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Redis connected successfully
📦 Redis host: your-redis-host.upstash.io
📦 Redis port: 6379
🔒 Rate limiting: Distributed (Redis-backed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PAYMENT GATEWAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Payment gateway configured (Duitku)
📦 Merchant: DS25180
📦 Environment: production
📦 Callback: https://app.lumiku.com/api/payment/duitku/callback
🔒 IP Whitelist: Enabled (10 production IPs)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RATE LIMITING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Rate limiting enabled
🔒 Storage: Distributed (Redis)
📦 Login: 5 attempts per 15 minutes (IP-based)
📦 Register: 3 attempts per 1 hour (IP-based)
📦 Account Lockout: 10 failed logins = 30 min lock

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SECURITY STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ JWT Security: SECURE
✅ Payment Security: 8-layer defense active
✅ Rate Limiting: Multi-tier protection enabled
✅ Authorization: Resource isolation enforced
✅ Environment Config: Validated and fail-safe
✅ Configuration Mgmt: Centralized and type-safe

Security Posture: PRODUCTION READY ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SERVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running on http://localhost:3000
🌐 API Base: http://localhost:3000/api
📚 Health Check: http://localhost:3000/health

✅ All systems operational. Ready for production traffic.
```

---

### Validation Failure Quick Reference

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `JWT_SECRET is not secure enough` | Weak/short secret | Generate with `openssl rand -hex 32` |
| `Redis connection required in production` | No Redis configured | Set up Redis (see Redis section) |
| `DUITKU_CALLBACK_URL must use HTTPS` | HTTP URL in production | Change to `https://` |
| `PAYMENT_IP_WHITELIST_ENABLED must be true` | IP whitelist disabled | Set to `"true"` |
| `DATABASE_URL is required` | Missing database config | Add database connection string |
| `Invalid NODE_ENV value` | Typo in NODE_ENV | Use "production", "development", or "test" |

---

## Deployment Steps

### Phase 1: Pre-Deployment Preparation (30 minutes)

#### 1. Generate Production Secrets

```bash
# Generate JWT Secret (64 characters)
openssl rand -hex 32

# Save to secure password manager (1Password, LastPass, etc.)
# Example output: 8d024b643b19488486b7aa1ab4dd0a1cf1566d76603252f659ce9bd905fc06e9
```

#### 2. Set Up Redis Instance

Choose and complete one Redis setup option:
- [ ] **Upstash** (Recommended): Follow "Option A: Upstash" in Redis section above
- [ ] **Redis Cloud**: Follow "Option B: Redis Cloud" in Redis section above
- [ ] **Self-Hosted**: Follow "Option C: Self-Hosted Redis" in Redis section above

**Test Redis Connection:**
```bash
redis-cli -h your-redis-host -p 6379 -a your-password PING
# Expected: PONG
```

#### 3. Get Duitku Credentials

Follow "Duitku Payment Configuration" section above:
- [ ] Login to Duitku dashboard
- [ ] Get Merchant Code (e.g., DS25180)
- [ ] Get API Key (click "Klik disini untuk melihat API Key")
- [ ] Update Callback URL in Duitku dashboard
- [ ] Save credentials securely

#### 4. Prepare Database

```bash
# If using managed database (Neon, Supabase, RDS)
# - Create database instance
# - Get connection string
# - Save securely

# If using self-hosted PostgreSQL
# Create database
createdb lumiku_production

# Create user
psql -c "CREATE USER lumiku_user WITH PASSWORD 'secure_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE lumiku_production TO lumiku_user;"

# Get connection string
# postgresql://lumiku_user:secure_password@localhost:5432/lumiku_production
```

#### 5. Prepare Environment Variables File

Create a local file (DO NOT COMMIT) with all production variables:

```bash
# production.env (local only - for reference)
NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://user:pass@host:5432/db

JWT_SECRET=8d024b643b19488486b7aa1ab4dd0a1cf1566d76603252f659ce9bd905fc06e9
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://app.lumiku.com

REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=your-api-key
DUITKU_ENV=production
DUITKU_CALLBACK_URL=https://app.lumiku.com/api/payment/duitku/callback
DUITKU_RETURN_URL=https://app.lumiku.com/payments/status
DUITKU_BASE_URL=https://passport.duitku.com
PAYMENT_IP_WHITELIST_ENABLED=true

RATE_LIMIT_ENABLED=true

UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000
```

#### 6. Run Pre-Flight Checks

```bash
# Verify all secrets generated
# - JWT_SECRET: 64 characters ✓
# - Redis connection: Tested ✓
# - Database connection: Tested ✓
# - Duitku credentials: Obtained ✓

# Verify all tests passing
bun test

# Verify build works
bun run build
```

---

### Phase 2: Deploy to Platform (15 minutes)

#### Option A: Deploy to Coolify

**1. Login to Coolify**
```
Visit: https://your-coolify-instance.com
Navigate: Projects > Lumiku
```

**2. Configure Environment Variables**
```
1. Go to: Application > Environment Variables
2. Click: Add Variable (for each variable)
3. For secrets: Enable "Secret" toggle (hides value)
4. Paste all variables from production.env
5. Double-check each value
6. Click: Save
```

**3. Configure Build Settings**
```
Build Pack: Dockerfile (auto-detected)
Base Directory: /
Dockerfile Location: Dockerfile
Build Command: (leave default)
Start Command: (leave default)
```

**4. Configure Domain**
```
1. Go to: Application > Domains
2. Add Domain: app.lumiku.com
3. Enable: SSL/TLS (Let's Encrypt)
4. Verify: DNS pointing to Coolify IP
5. Wait for SSL certificate (2-5 minutes)
```

**5. Deploy**
```
1. Go to: Application > Deploy
2. Click: Deploy Now
3. Monitor: Deployment logs
4. Wait for: "✅ All systems operational"
```

**Monitor Logs:**
```
Look for startup validation output (see Startup Validation section)
Verify:
- ✅ Environment variables validated
- ✅ Database connected
- ✅ Redis connected
- ✅ JWT Secret: SECURE
- ✅ Payment gateway configured
- 🚀 Server running
```

---

#### Option B: Deploy to Vercel

**1. Install Vercel CLI**
```bash
npm install -g vercel
vercel login
```

**2. Configure Project**
```bash
vercel
# Follow prompts to link project
```

**3. Set Environment Variables**
```bash
# Set all production variables
vercel env add JWT_SECRET production
# Paste: your-generated-jwt-secret

vercel env add DATABASE_URL production
# Paste: your-database-url

# Repeat for all variables...
```

**4. Deploy**
```bash
# Deploy to production
vercel --prod

# Monitor logs
vercel logs --follow
```

---

#### Option C: Deploy to Docker (Self-Hosted)

**1. Build Docker Image**
```bash
# Build production image
docker build -t lumiku-app:latest .

# Tag for registry (optional)
docker tag lumiku-app:latest your-registry/lumiku-app:v1.0.0
```

**2. Create Environment File**
```bash
# Create production.env with all variables
# (Same as production.env from Phase 1)
```

**3. Run Container**
```bash
docker run -d \
  --name lumiku-production \
  --env-file production.env \
  -p 3000:3000 \
  --restart unless-stopped \
  lumiku-app:latest
```

**4. Monitor Logs**
```bash
docker logs -f lumiku-production
```

---

### Phase 3: Verification (10 minutes)

#### 1. Health Check

```bash
# Test health endpoint
curl https://app.lumiku.com/health

# Expected Response:
# {
#   "status": "ok",
#   "timestamp": "2025-10-14T10:30:00.000Z",
#   "uptime": 125.23,
#   "version": "1.0.0"
# }
```

#### 2. Database Connectivity

```bash
# Test database query (via API or direct)
curl https://app.lumiku.com/api/status

# Expected: Success response with database status
```

#### 3. Redis Connectivity

```bash
# Login attempts should be rate limited
# Try 6 rapid login attempts

for i in {1..6}; do
  curl -X POST https://app.lumiku.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nAttempt $i: %{http_code}\n"
done

# Expected:
# Attempts 1-5: 401 Unauthorized
# Attempt 6: 429 Too Many Requests
```

#### 4. Authentication Flow

```bash
# Register new user
curl -X POST https://app.lumiku.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Expected: 201 Created with JWT token

# Login
curl -X POST https://app.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Expected: 200 OK with JWT token
```

#### 5. Payment Endpoint Accessibility

```bash
# Verify callback endpoint is reachable (from outside)
curl -I https://app.lumiku.com/api/payment/duitku/callback

# Expected: 405 Method Not Allowed or 400 Bad Request
# (GET not allowed, but endpoint reachable)
```

#### 6. CORS Configuration

```bash
# Test CORS from frontend domain
curl -H "Origin: https://app.lumiku.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://app.lumiku.com/api/auth/login

# Expected: Access-Control-Allow-Origin header present
```

---

## Post-Deployment Verification

### First Hour Monitoring

**1. Watch Application Logs**
```bash
# Coolify: Application > Logs > Live Logs
# Docker: docker logs -f lumiku-production
# Vercel: vercel logs --follow

# Look for:
# - No startup errors
# - Database queries successful
# - Redis operations working
# - No rate limit errors
# - No payment security alerts
```

**2. Monitor Key Metrics**
```
- CPU usage: < 50%
- Memory usage: < 80%
- Response times: < 200ms (p95)
- Error rate: < 0.1%
- Active connections: stable
```

**3. Check Error Tracking**
```bash
# If using Sentry or similar
# - No critical errors
# - No repeated warnings
# - No security alerts
```

---

### First 24 Hours Monitoring

**1. Security Events**
```bash
# Check for suspicious activity
# Grep logs for security events:
grep "SECURITY" /var/log/lumiku/app.log
grep "CRITICAL" /var/log/lumiku/app.log

# Expected: No security alerts (or very few)
```

**2. Rate Limiting Effectiveness**
```bash
# Check rate limit violations
grep "RATE_LIMIT_VIOLATION" /var/log/lumiku/app.log

# Some violations expected (legitimate traffic bursts)
# Investigate if violations > 1000/day
```

**3. Payment Callbacks**
```bash
# Monitor payment callback success rate
grep "PAYMENT_CALLBACK" /var/log/lumiku/app.log

# Verify:
# - All callbacks from Duitku IPs
# - Valid signatures
# - No replay attacks
# - Credits updated correctly
```

**4. Database Performance**
```bash
# Check slow queries
# Verify connection pool not exhausted
# Monitor database CPU and memory
```

**5. Redis Performance**
```bash
# Check Redis latency
redis-cli -h your-host -a your-password --latency-history

# Expected: < 5ms average latency

# Check Redis memory
redis-cli -h your-host -a your-password INFO memory

# Expected: < 80% of max memory
```

---

### Production Smoke Test Checklist

Run these tests in order after deployment:

- [ ] **Health Check** - `GET /health` returns 200 OK
- [ ] **Database** - Can create/read/update/delete records
- [ ] **Authentication** - Register, login, get profile work
- [ ] **Rate Limiting** - 6th rapid login attempt blocked (429)
- [ ] **Authorization** - User A cannot access User B's resources
- [ ] **Payment Creation** - Can create payment request (Duitku sandbox)
- [ ] **Payment Callback** - Duitku callback processed (test with sandbox)
- [ ] **Credits** - User credits updated after successful payment
- [ ] **File Upload** - Can upload files (if applicable)
- [ ] **AI Generation** - AI features work (if applicable)
- [ ] **CORS** - Frontend can make cross-origin requests
- [ ] **HTTPS** - All requests use HTTPS, HTTP redirects to HTTPS
- [ ] **Logs** - Application logs visible and structured
- [ ] **Monitoring** - Metrics being collected (if monitoring configured)

---

## Monitoring Setup

### Application Metrics

**Key Metrics to Track:**

**Performance Metrics:**
- `http_request_duration_ms` - Response time percentiles (p50, p95, p99)
- `http_requests_total` - Total requests by endpoint and status code
- `http_active_connections` - Current active connections
- `database_query_duration_ms` - Database query performance
- `redis_operation_duration_ms` - Redis operation latency

**Security Metrics (CRITICAL):**
- `auth_failed_login_attempts` - Brute force detection
- `auth_account_locked` - Account lockout events
- `payment_signature_invalid` - Payment fraud attempts
- `payment_ip_unauthorized` - Unauthorized callback IPs
- `authorization_failure` - Unauthorized access attempts
- `rate_limit_violation` - Rate limit hits

**Business Metrics:**
- `user_registrations_total` - New user signups
- `payments_successful` - Successful payments
- `payments_failed` - Failed payments
- `credits_purchased` - Total credits sold
- `ai_generations_total` - AI feature usage

---

### Logging Best Practices

**Structured Logging:**
```json
{
  "timestamp": "2025-10-14T10:30:00.000Z",
  "level": "INFO",
  "event": "AUTH_LOGIN_SUCCESS",
  "userId": "user-123",
  "ip": "203.0.113.45",
  "duration": 125,
  "metadata": {
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Log Levels:**
- `DEBUG` - Development debugging (disable in production)
- `INFO` - Normal operations (startups, user actions)
- `WARN` - Warning conditions (rate limit hits, retries)
- `ERROR` - Error conditions (failed operations)
- `CRITICAL` - Critical security events (fraud, attacks)

**What to Log:**
- ✅ All authentication events (success and failure)
- ✅ All payment events
- ✅ All authorization failures
- ✅ All rate limit violations
- ✅ Application startup/shutdown
- ✅ Configuration changes
- ❌ Passwords or secrets (NEVER)
- ❌ Full JWT tokens (only trace IDs)
- ❌ API keys (only prefix/suffix)

---

### Alert Configuration

#### CRITICAL Alerts (Immediate Response - < 5 minutes)

```yaml
# Payment Fraud Attempts
- alert: PaymentFraudSpike
  expr: rate(payment_signature_invalid[5m]) > 5
  severity: CRITICAL
  action: Immediate investigation, potential attack

# Unauthorized Payment Callbacks
- alert: UnauthorizedPaymentIP
  expr: rate(payment_ip_unauthorized[5m]) > 10
  severity: CRITICAL
  action: Block IP, investigate attack pattern

# Database Connection Lost
- alert: DatabaseDown
  expr: database_connection_status == 0
  severity: CRITICAL
  action: Application cannot function, restore database

# Redis Connection Lost
- alert: RedisDown
  expr: redis_connection_status == 0
  severity: CRITICAL
  action: Rate limiting not working, restore Redis
```

#### HIGH Alerts (Response within 1 hour)

```yaml
# Brute Force Attack
- alert: BruteForceAttack
  expr: rate(auth_failed_login_attempts[1h]) > 100
  severity: HIGH
  action: Investigate IPs, consider additional blocking

# High Error Rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  severity: HIGH
  action: Investigate errors, check logs

# Slow Response Times
- alert: SlowResponseTimes
  expr: http_request_duration_ms{quantile="0.95"} > 2000
  severity: HIGH
  action: Investigate performance bottleneck
```

#### MEDIUM Alerts (Response within 24 hours)

```yaml
# High Memory Usage
- alert: HighMemoryUsage
  expr: process_memory_usage_percent > 80
  severity: MEDIUM
  action: Monitor, consider scaling up

# Disk Space Low
- alert: DiskSpaceLow
  expr: disk_free_percent < 20
  severity: MEDIUM
  action: Clean up old files, consider expansion
```

---

### Monitoring Tools Integration

#### Option A: Prometheus + Grafana

**Install Prometheus Client:**
```bash
bun add prom-client
```

**Expose Metrics Endpoint:**
```typescript
// backend/src/routes/metrics.routes.ts
import { register } from 'prom-client'

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})
```

**Prometheus Config:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'lumiku'
    static_configs:
      - targets: ['app.lumiku.com:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

---

#### Option B: Datadog

**Install Datadog Agent:**
```bash
DD_API_KEY=your-api-key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

**Configure Application:**
```typescript
// backend/src/lib/datadog.ts
import { StatsD } from 'hot-shots'

const client = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'lumiku.',
})

export default client
```

---

#### Option C: CloudWatch (AWS)

**Install CloudWatch SDK:**
```bash
bun add @aws-sdk/client-cloudwatch-logs
```

**Configure Logging:**
```typescript
// backend/src/lib/cloudwatch.ts
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

const client = new CloudWatchLogsClient({ region: 'us-east-1' })

export async function logToCloudWatch(message: string) {
  await client.send(new PutLogEventsCommand({
    logGroupName: '/lumiku/production',
    logStreamName: 'application',
    logEvents: [
      {
        message,
        timestamp: Date.now(),
      },
    ],
  }))
}
```

---

### Monitoring Checklist

- [ ] Application metrics being collected
- [ ] Logs aggregated in central system (CloudWatch, ELK, Datadog)
- [ ] Security alerts configured (fraud, attacks)
- [ ] Performance alerts configured (slow queries, high errors)
- [ ] Infrastructure alerts configured (CPU, memory, disk)
- [ ] On-call rotation configured
- [ ] Incident response playbook documented
- [ ] Team trained on monitoring dashboards

---

## Rollback Procedures

### When to Rollback

**Immediate Rollback Triggers:**
- Application fails to start (validation errors)
- Database migrations fail
- Critical security vulnerability discovered
- Error rate > 10% for > 5 minutes
- Data corruption detected
- Payment processing completely broken

**Investigate First (Don't Rollback):**
- Minor bugs affecting < 1% of users
- Performance degradation < 2x slower
- Non-critical feature broken
- Single user report of issue

---

### Rollback Steps

#### Phase 1: Immediate Action (< 5 minutes)

**1. Stop New Deployments**
```bash
# Coolify: Application > Stop Deployment
# Vercel: vercel rollback
# Docker: docker stop lumiku-production
```

**2. Identify Last Known Good Version**
```bash
# Git
git log --oneline -10
# Note the commit hash before the problematic deployment

# Docker
docker images lumiku-app
# Note the previous tag
```

**3. Rollback Application Code**

**Coolify:**
```
1. Go to: Application > Deployments
2. Find: Last successful deployment
3. Click: Redeploy
4. Monitor: Logs for successful startup
```

**Vercel:**
```bash
vercel rollback
# Or specify exact deployment:
vercel rollback deployment-url
```

**Docker:**
```bash
# Stop current container
docker stop lumiku-production

# Start previous version
docker run -d \
  --name lumiku-production \
  --env-file production.env \
  -p 3000:3000 \
  lumiku-app:previous-tag
```

**Git (Manual):**
```bash
# Revert to last good commit
git revert HEAD
git push origin production

# Or hard reset (destructive)
git reset --hard <last-good-commit>
git push --force origin production
```

---

#### Phase 2: Rollback Database Migrations (If Needed)

**⚠️ Only if new deployment included breaking schema changes**

**1. Identify Migrations to Revert**
```bash
# List recent migrations
bun prisma migrate status

# Identify migrations from failed deployment
```

**2. Rollback Migrations**
```bash
# Prisma doesn't support automated rollback
# Manual steps required:

# Option A: Restore from backup (safest)
# 1. Restore database from backup taken before deployment
# 2. Verify data integrity

# Option B: Manual SQL rollback
# 1. Write reverse migration SQL
# 2. Test in staging
# 3. Apply to production

# Example reverse migration:
psql $DATABASE_URL << EOF
BEGIN;
-- Reverse changes here
ALTER TABLE users DROP COLUMN new_column;
COMMIT;
EOF
```

**3. Verify Database State**
```bash
# Check database schema matches application code
bun prisma migrate status
# Expected: All migrations in sync
```

---

#### Phase 3: Verify Rollback Success (10 minutes)

**1. Application Health**
```bash
# Health check
curl https://app.lumiku.com/health
# Expected: 200 OK

# Check startup logs
# Verify: ✅ All systems operational
```

**2. Smoke Tests**
```bash
# Authentication
curl -X POST https://app.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
# Expected: 200 OK

# Database queries working
# Rate limiting working
# Payment endpoints accessible
```

**3. Monitor Metrics**
```
- Error rate: < 0.1%
- Response times: Normal
- CPU/Memory: Normal
- Active users: Recovering
```

**4. Check User Reports**
```
# Monitor support channels
# Verify issues are resolved
# Communicate status to users
```

---

### Post-Rollback Actions

**1. Root Cause Analysis (Within 24 hours)**
```markdown
# Incident Report Template

## Summary
- What happened: [Brief description]
- When: [Date/time]
- Duration: [How long affected]
- Impact: [Number of users, features affected]

## Timeline
- HH:MM - Deployment started
- HH:MM - Issue detected
- HH:MM - Rollback initiated
- HH:MM - Service restored

## Root Cause
[Detailed explanation of what went wrong]

## Contributing Factors
- [Factor 1]
- [Factor 2]

## Resolution
[What was done to fix it]

## Prevention
[What will prevent this in the future]
- [ ] Action item 1
- [ ] Action item 2
```

**2. Update Deployment Process**
```
- Add missing pre-deployment checks
- Improve staging environment
- Add automated tests for affected area
- Update documentation
```

**3. Communicate with Team**
```
- Share incident report
- Discuss lessons learned
- Update runbooks
- Train team on gaps
```

---

### Rollback Prevention

**Before Every Deployment:**
- [ ] All tests passing in staging
- [ ] Database migrations tested in staging
- [ ] Backup taken before deployment
- [ ] Rollback plan documented
- [ ] On-call engineer identified
- [ ] Monitoring alerts active
- [ ] Smoke tests prepared

**Deployment Best Practices:**
- Use feature flags for risky changes
- Deploy during low-traffic windows
- Deploy incrementally (canary/blue-green)
- Monitor metrics for 30+ minutes post-deploy
- Keep previous version readily available

---

## Summary Checklist

### Before Clicking Deploy ✅

**Secrets & Credentials:**
- [ ] JWT_SECRET generated (64 characters)
- [ ] Redis instance set up and tested
- [ ] Duitku credentials obtained
- [ ] Database provisioned and accessible
- [ ] All secrets stored in password manager
- [ ] No secrets in codebase (verified)

**Configuration:**
- [ ] All environment variables prepared
- [ ] Callback URL updated in Duitku dashboard
- [ ] HTTPS enforced on all production URLs
- [ ] CORS_ORIGIN set to production frontend
- [ ] Rate limiting enabled
- [ ] Payment IP whitelist enabled
- [ ] Trusted proxy IPs configured (if behind proxy)

**Testing:**
- [ ] All tests passing (77+ security tests)
- [ ] Build succeeds
- [ ] Staging environment tested
- [ ] Database migrations tested
- [ ] Payment flow tested (sandbox)

**Infrastructure:**
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] Database backups configured
- [ ] Redis instance healthy
- [ ] Monitoring configured
- [ ] Logging configured

**Documentation:**
- [ ] Deployment steps documented
- [ ] Rollback plan prepared
- [ ] On-call engineer identified
- [ ] Team notified of deployment

**Validation:**
- [ ] Environment variables will pass validation
- [ ] JWT secret will pass security checks
- [ ] Redis connection will succeed
- [ ] Database connection will succeed
- [ ] Payment configuration will pass validation

---

### After Deployment ✅

**Immediate (First 10 minutes):**
- [ ] Health check returns 200 OK
- [ ] Startup logs show all validations passed
- [ ] Database queries working
- [ ] Redis operations working
- [ ] Authentication flow working
- [ ] Payment endpoint accessible
- [ ] No critical errors in logs

**First Hour:**
- [ ] Error rate < 0.1%
- [ ] Response times normal (< 200ms)
- [ ] CPU/Memory usage normal
- [ ] No security alerts
- [ ] Rate limiting working
- [ ] Monitoring metrics flowing

**First 24 Hours:**
- [ ] No repeated errors
- [ ] Payment callbacks successful
- [ ] User reports positive (no major issues)
- [ ] All metrics stable
- [ ] Security events reviewed
- [ ] Performance acceptable

**First Week:**
- [ ] All features working as expected
- [ ] No data integrity issues
- [ ] Backups successful
- [ ] Monitoring dashboards reviewed
- [ ] Incident count acceptable
- [ ] Team comfortable with new deployment

---

## Support & Resources

### Documentation

- **This Checklist** - Production deployment reference
- **SECURITY_FIX_STATUS.md** - Complete security sprint report
- **PAYMENT_SECURITY.md** - Payment security architecture
- **RATE_LIMITING_IMPLEMENTATION.md** - Rate limiting guide
- **AUTHORIZATION_FIX_SUMMARY.md** - Authorization system
- **P0_ITEMS_5_6_COMPLETION_REPORT.md** - Environment configuration
- **JWT_SECURITY_SYSTEM_COMPLETE.md** - JWT security
- **.env.example** - Environment variables reference

### External Resources

- **Duitku Documentation**: https://docs.duitku.com/api/en/
- **Upstash Documentation**: https://docs.upstash.com/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Bun Documentation**: https://bun.sh/docs
- **Prisma Documentation**: https://www.prisma.io/docs

### Getting Help

**For Deployment Questions:**
1. Check this checklist first
2. Review relevant documentation
3. Check application logs for specific errors
4. Search error messages in documentation

**For Security Questions:**
1. Review SECURITY_FIX_STATUS.md
2. Check specific security documentation
3. Verify environment variables are correct
4. Check startup validation messages

**For Payment Issues:**
1. Review PAYMENT_SECURITY.md
2. Check Duitku dashboard configuration
3. Verify callback URL matches exactly
4. Check IP whitelist is enabled
5. Review payment logs for errors

---

## Changelog

### Version 1.0.0 - 2025-10-14
- Initial production deployment checklist
- Based on completed P0 security sprint
- Comprehensive environment variable reference
- Secret generation scripts included
- Redis setup guide (3 options)
- Duitku configuration guide
- Startup validation documentation
- Monitoring and alerting guidance
- Rollback procedures documented

---

**Last Updated:** 2025-10-14
**Status:** Production Ready
**Security Sprint:** ✅ COMPLETE (6/6 P0 Items)
**Next Review:** 2025-11-14 (30 days)

---

*This checklist is maintained as part of the Lumiku production operations documentation. Update after each deployment or when procedures change.*

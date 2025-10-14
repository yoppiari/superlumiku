# Security Secrets Configuration - Quick Start Guide

**Last Updated:** October 14, 2025

---

## Quick Summary

The Lumiku backend now enforces secure secret management with zero tolerance for hardcoded defaults in production.

### Key Points

- No hardcoded secrets anywhere in the codebase
- Production refuses to start with weak/default credentials
- Development auto-generates secure randoms (developer-friendly)
- Multi-layer validation (Zod + Custom + Production Guards)

---

## For Developers: Getting Started

### Development Environment (Local Machine)

**No setup required!** Just run:

```bash
cd backend
bun install
bun dev
```

The system automatically:
- Detects you're in development mode
- Generates a secure random JWT_SECRET using `crypto.randomBytes(32).toString('hex')`
- Logs a warning that the secret is temporary
- Starts the application normally

**Note:** Secret changes on every restart. To persist sessions across restarts:

```bash
# Generate and save a JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" > .env

# Or manually:
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
```

### Production Deployment

**REQUIRED:** Set all secrets before deployment. The application will refuse to start without proper configuration.

#### Step 1: Generate JWT Secret

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Copy the output and set as environment variable
export JWT_SECRET="<your-64-character-hex-string>"
```

#### Step 2: Get Payment Credentials

1. Register at https://passport.duitku.com
2. Get your **production** merchant code (not sandbox)
3. Get your **production** API key (32+ characters)
4. Set callback and return URLs (must use HTTPS)

```bash
export DUITKU_MERCHANT_CODE="<your-merchant-code>"
export DUITKU_API_KEY="<your-api-key-32+-characters>"
export DUITKU_CALLBACK_URL="https://api.yourdomain.com/api/payments/callback"
export DUITKU_RETURN_URL="https://yourdomain.com/payment/success"
```

#### Step 3: Configure CORS

```bash
export CORS_ORIGIN="https://yourdomain.com"
```

#### Step 4: Set Database URL

```bash
export DATABASE_URL="postgresql://user:password@host:5432/database"
```

#### Step 5: Verify Configuration

```bash
cd backend
NODE_ENV=production bun run src/index.ts
```

You should see:
```
🔐 JWT Secret Configuration:
   Environment: production
   Source: Environment Variable
   Length: 64 characters
   Entropy: 4.0 bits/char
   Status: ✅ SECURE

✅ Production JWT secret is properly configured and secure.
```

---

## Error Messages and Solutions

### Error: "JWT_SECRET not set"

**In Development:**
- Should auto-generate (if this fails, something is wrong)
- File an issue if you see this error in development

**In Production:**
```
CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set.

To fix:
1. Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
2. Set JWT_SECRET environment variable
3. Restart application
```

**Solution:**
```bash
export JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
```

### Error: "JWT_SECRET is too short"

```
JWT_SECRET is too short (16 characters).
Minimum required: 32 characters for production environment.
```

**Solution:** Generate a longer secret (64 characters recommended)
```bash
export JWT_SECRET="$(openssl rand -hex 32)"
```

### Error: "JWT_SECRET is using a known weak value"

```
JWT_SECRET is using a known weak or default value.
This is a CRITICAL security vulnerability.
```

**Solution:** Never use these values:
- `change-this-secret-key`
- `your-secret-key-here`
- `secret`
- `jwt-secret`
- `test-secret`
- `12345678`

Generate a real random secret:
```bash
export JWT_SECRET="$(openssl rand -hex 32)"
```

### Error: "DUITKU_MERCHANT_CODE appears to be a test value"

```
CRITICAL: DUITKU_MERCHANT_CODE appears to be a test/default value.
Production requires real merchant credentials from Duitku.
```

**Solution:** Get real production credentials:
1. Register at https://passport.duitku.com
2. Switch to production mode (not sandbox)
3. Get your production merchant code
4. Set the environment variable

### Error: "DUITKU_API_KEY is too short"

```
CRITICAL: DUITKU_API_KEY is too short for production.
Valid Duitku API keys are typically 32+ characters.
```

**Solution:** Verify you're using the real production API key from Duitku dashboard, not a test key.

### Error: "DUITKU_CALLBACK_URL must use HTTPS"

```
CRITICAL: DUITKU_CALLBACK_URL must use HTTPS in production.
HTTP callbacks are insecure and rejected by most payment gateways.
```

**Solution:**
```bash
# Wrong
export DUITKU_CALLBACK_URL="http://api.lumiku.com/callback"

# Correct
export DUITKU_CALLBACK_URL="https://api.lumiku.com/callback"
```

### Error: "CORS_ORIGIN is set to localhost"

```
CRITICAL: CORS_ORIGIN is set to localhost in production.
This will prevent your frontend from accessing the API.
```

**Solution:**
```bash
# Wrong
export CORS_ORIGIN="http://localhost:5173"

# Correct
export CORS_ORIGIN="https://app.lumiku.com"
```

---

## Environment Variables Checklist

### Required for All Environments

- [ ] `DATABASE_URL` - PostgreSQL connection string

### Required for Production

- [ ] `NODE_ENV=production` - Set environment to production
- [ ] `JWT_SECRET` - Minimum 32 characters, high entropy
- [ ] `DUITKU_MERCHANT_CODE` - Real merchant code (not test/sandbox)
- [ ] `DUITKU_API_KEY` - Real API key (20+ characters, 32+ recommended)
- [ ] `DUITKU_CALLBACK_URL` - Must use HTTPS
- [ ] `DUITKU_RETURN_URL` - Must use HTTPS
- [ ] `CORS_ORIGIN` - Must be production frontend URL (HTTPS)

### Optional but Recommended for Production

- [ ] `REDIS_HOST` - For distributed rate limiting
- [ ] `REDIS_PORT` - Default: 6379
- [ ] `REDIS_PASSWORD` - For secure Redis connection

### Optional (Feature-Specific)

- [ ] `ANTHROPIC_API_KEY` - For Claude AI features
- [ ] `OPENAI_API_KEY` - For GPT features
- [ ] `FLUX_API_KEY` - For image generation features

---

## Security Best Practices

### DO ✅

1. **Generate secrets cryptographically**
   ```bash
   openssl rand -hex 32
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use different secrets for different environments**
   - Development: Can use auto-generated or set in `.env`
   - Staging: Use unique secrets (not same as production)
   - Production: Use strong, unique secrets

3. **Store secrets securely**
   - Use environment variables
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault)
   - Never commit to version control

4. **Rotate secrets regularly**
   - JWT_SECRET: Every 90 days recommended
   - API keys: When team members leave or on schedule

5. **Use HTTPS in production**
   - All URLs must use HTTPS
   - No exceptions for callbacks or return URLs

### DON'T ❌

1. **Never hardcode secrets**
   ```typescript
   // ❌ WRONG
   const JWT_SECRET = "my-secret-key"

   // ✅ CORRECT
   const JWT_SECRET = process.env.JWT_SECRET
   ```

2. **Never commit secrets to Git**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

3. **Never reuse secrets**
   - Don't use the same JWT_SECRET across environments
   - Don't share secrets between projects

4. **Never use weak secrets**
   - Don't use dictionary words
   - Don't use patterns (123456, aaaaaa)
   - Don't use short secrets

5. **Never use HTTP in production**
   - Payment callbacks must use HTTPS
   - Frontend URLs must use HTTPS

---

## Testing Your Configuration

### Test Development Mode

```bash
cd backend
unset JWT_SECRET
NODE_ENV=development bun run src/index.ts
```

**Expected:**
- Auto-generates JWT_SECRET
- Shows warning about temporary secret
- Starts successfully

### Test Production Mode (Should Fail Without Secrets)

```bash
cd backend
unset JWT_SECRET
NODE_ENV=production bun run src/index.ts
```

**Expected:**
- Fatal error about missing JWT_SECRET
- Application refuses to start
- Clear instructions provided

### Test Production Mode (Should Succeed With Secrets)

```bash
cd backend
export NODE_ENV=production
export JWT_SECRET="$(openssl rand -hex 32)"
export DUITKU_MERCHANT_CODE="D1234"
export DUITKU_API_KEY="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
export DUITKU_CALLBACK_URL="https://api.example.com/callback"
export DUITKU_RETURN_URL="https://example.com/return"
export CORS_ORIGIN="https://example.com"
export DATABASE_URL="postgresql://localhost:5432/test"
bun run src/index.ts
```

**Expected:**
- All validations pass
- "SECURE" status shown
- Application starts normally

---

## Troubleshooting

### Application Won't Start

1. **Check environment variables are set:**
   ```bash
   echo $JWT_SECRET
   echo $DUITKU_MERCHANT_CODE
   echo $DUITKU_API_KEY
   ```

2. **Check NODE_ENV:**
   ```bash
   echo $NODE_ENV
   ```

3. **Check error message carefully** - it will tell you exactly what's wrong

4. **Verify secret format:**
   - JWT_SECRET should be 64 characters (hex string from 32 bytes)
   - DUITKU_API_KEY should be 32+ characters
   - URLs should start with `https://` in production

### Secrets Work Locally But Not in Production

**Common causes:**

1. **Environment variables not set in deployment**
   - Check your deployment platform's environment variable settings
   - Verify secrets are actually set (not just in `.env` file)

2. **Using test credentials in production**
   - Ensure you're using production credentials, not sandbox
   - Check Duitku dashboard for correct credentials

3. **Copy-paste errors**
   - Secrets may have extra whitespace
   - Quotes may be incorrect
   - Use `export VAR="value"` format

### JWT Tokens Not Working

1. **Secret changing on restart (development)**
   - Save JWT_SECRET to `.env` file for persistent sessions

2. **Different secrets in different services**
   - Ensure all backend instances use the same JWT_SECRET
   - Check environment variables match across deployments

3. **Expired tokens**
   - Default expiry is 7 days
   - Check `JWT_EXPIRES_IN` setting

---

## Getting Help

### Check Documentation

1. **Full refactor report:** `SECURITY_ENV_CONFIG_REFACTOR.md`
2. **Code quality audit:** `docs/AUDIT_CODE_QUALITY.md`
3. **Environment example:** `backend/.env.example`

### Check Logs

The application logs detailed information about configuration:

```bash
🔐 JWT Secret Configuration:
   Environment: production
   Source: Environment Variable
   Length: 64 characters
   Entropy: 4.0 bits/char
   Status: ✅ SECURE
```

### Common Issues

- Application won't start → Check error message, it has exact fix instructions
- Secrets not working → Verify they're set in the correct environment
- Development mode not auto-generating → Check NODE_ENV is not set to production

---

## Quick Reference: Environment Setup Commands

### Local Development (macOS/Linux)

```bash
# Create .env file with secure JWT secret
echo "JWT_SECRET=$(openssl rand -hex 32)" > backend/.env

# Start development server
cd backend
bun dev
```

### Local Development (Windows)

```powershell
# Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" > backend\.env

# Start development server
cd backend
bun dev
```

### Production Deployment

```bash
# Set all required environment variables
export NODE_ENV=production
export JWT_SECRET="$(openssl rand -hex 32)"
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export DUITKU_MERCHANT_CODE="<your-merchant-code>"
export DUITKU_API_KEY="<your-api-key>"
export DUITKU_CALLBACK_URL="https://api.yourdomain.com/api/payments/callback"
export DUITKU_RETURN_URL="https://yourdomain.com/payment/success"
export CORS_ORIGIN="https://yourdomain.com"

# Start production server
cd backend
bun start
```

---

**Last Updated:** October 14, 2025
**Version:** 1.0.0
**Status:** Production Ready

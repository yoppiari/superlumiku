# Production Secrets Generator - Quick Start Guide

## Overview

The `production-secrets-generator.sh` script automates the generation of secure secrets and creates a production-ready environment configuration for Lumiku App.

## Quick Start (3 Steps)

### Step 1: Generate Configuration
```bash
./production-secrets-generator.sh
```

This creates `.env.production` with:
- 64-character cryptographically secure JWT_SECRET
- 32-character secure Redis password
- Comprehensive configuration template
- Security warnings and best practices

### Step 2: Edit Placeholders
Open `.env.production` and replace these placeholders:

```bash
# Database
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# Frontend
CORS_ORIGIN="https://YOUR_FRONTEND_DOMAIN.com"

# Redis
REDIS_HOST="YOUR_REDIS_HOST"

# Payment Gateway (from Duitku dashboard)
DUITKU_MERCHANT_CODE="YOUR_PRODUCTION_MERCHANT_CODE"
DUITKU_API_KEY="YOUR_PRODUCTION_API_KEY"
DUITKU_CALLBACK_URL="https://api.YOUR_DOMAIN.com/api/payments/callback"
DUITKU_RETURN_URL="https://YOUR_DOMAIN.com/payment/status"

# Trusted Proxies (if using Cloudflare, Nginx, etc.)
TRUSTED_PROXY_IPS="your.proxy.ip"
```

### Step 3: Validate
```bash
./production-secrets-generator.sh --validate-only
```

Fix any errors or warnings, then deploy to production!

---

## Usage Examples

### Generate to stdout (for piping)
```bash
./production-secrets-generator.sh --stdout
```

### Generate for staging environment
```bash
./production-secrets-generator.sh --output .env.staging
```

### Quiet mode (for scripts)
```bash
./production-secrets-generator.sh --quiet
```

### View help
```bash
./production-secrets-generator.sh --help
```

---

## Deployment Methods

### Coolify
1. Generate `.env.production` locally
2. Copy each variable to Coolify dashboard:
   - Go to your application → Environment Variables
   - Add each variable from the file
   - Mark sensitive values (JWT_SECRET, passwords, API keys) as "Secret"
3. Deploy

### Docker
```bash
# Option 1: Using --env-file
docker run --env-file .env.production lumiku-app

# Option 2: Docker Compose
version: '3.8'
services:
  app:
    env_file: .env.production
```

### Manual Deployment
```bash
# Source environment file
source .env.production

# Or export variables
set -a
source .env.production
set +a

# Start application
npm start
```

---

## Security Checklist

Before deploying to production:

- [ ] All placeholders replaced with real values
- [ ] JWT_SECRET is the generated 64-character value (DO NOT CHANGE)
- [ ] REDIS_PASSWORD is the generated 32-character value (DO NOT CHANGE)
- [ ] DATABASE_URL uses strong password (16+ characters)
- [ ] CORS_ORIGIN uses HTTPS (not HTTP)
- [ ] Duitku URLs use HTTPS
- [ ] DUITKU_ENV set to "production"
- [ ] Duitku credentials are production (not sandbox)
- [ ] File permissions set to 600 (`chmod 600 .env.production`)
- [ ] File NOT committed to git (check `.gitignore`)
- [ ] Validation passes (`./production-secrets-generator.sh --validate-only`)
- [ ] Backup stored securely (password manager, vault)

---

## Troubleshooting

### Error: "openssl: command not found"
**Solution:**
- macOS: `brew install openssl` (usually pre-installed)
- Ubuntu/Debian: `sudo apt-get install openssl`
- Windows Git Bash: OpenSSL is pre-installed

### Warning: "REDIS_HOST not configured"
**Impact:** Rate limiting will use in-memory store (not recommended for production)

**Solution:** Set up Redis:
- Managed Redis: Upstash, Redis Cloud, AWS ElastiCache
- Self-hosted: Install Redis on your server
- Docker: Add Redis service to docker-compose.yml

### Error: "DUITKU_API_KEY appears to be a test value"
**Solution:** Replace with your production API key from Duitku dashboard

### Error: "CORS_ORIGIN is set to localhost"
**Solution:** Change to your production frontend URL: `https://app.lumiku.com`

### Error: "URLs must use HTTPS in production"
**Solution:** Update all URLs to use `https://` instead of `http://`

---

## Secret Rotation

### When to Rotate
- **Quarterly:** JWT_SECRET, REDIS_PASSWORD (every 90 days)
- **Annually:** Database passwords
- **Immediately:** If secrets are compromised or exposed

### How to Rotate

1. **Generate new secret:**
   ```bash
   openssl rand -hex 32  # For JWT_SECRET
   openssl rand -base64 32  # For Redis password
   ```

2. **Update production environment:**
   - Coolify: Update environment variable
   - Docker: Update .env.production and restart
   - Manual: Update file and restart application

3. **For JWT_SECRET rotation:**
   - Note: Will invalidate all existing user sessions
   - Users will need to log in again (expected behavior)
   - Schedule during maintenance window if possible

4. **Verify:**
   ```bash
   ./production-secrets-generator.sh --validate-only
   ```

---

## FAQ

### Q: Can I use this script for development?
**A:** The script is designed for production, but you can generate development configs:
```bash
./production-secrets-generator.sh --output .env.development
# Then edit NODE_ENV to 'development' and use localhost URLs
```

### Q: Should I commit .env.production to git?
**A:** NO! Never commit production secrets to version control. The `.gitignore` should exclude `.env.production`.

### Q: What if I lose my .env.production file?
**A:**
1. Check your backup (the script creates automatic backups)
2. Check your deployment platform (Coolify, Docker, etc.) - secrets should be stored there
3. If truly lost, regenerate and redeploy (will invalidate all user sessions)

### Q: Can I modify the generated JWT_SECRET?
**A:** No, use the generated value. It has sufficient entropy and meets all security requirements. Modifying it may reduce security.

### Q: How do I know if my configuration is secure?
**A:** Run validation:
```bash
./production-secrets-generator.sh --validate-only
```
Zero errors = secure configuration ✓

### Q: Does this work on Windows?
**A:** Yes, use Git Bash or WSL. PowerShell is not supported (it's a Bash script).

---

## Support

### Documentation
- Full review: `PRODUCTION_SECRETS_GENERATOR_REVIEW.md`
- Environment variables: `.env.example`
- Security guide: `SECURITY_ENV_VARS.md`

### Script Help
```bash
./production-secrets-generator.sh --help
```

### Common Issues
All validation errors include helpful suggestions for fixing them. Read the error messages carefully.

---

## Best Practices Summary

1. **Generation:** Always use the script (never manual secret creation)
2. **Storage:** Keep .env.production in password manager/vault
3. **Rotation:** Rotate secrets every 90 days
4. **Validation:** Validate before every deployment
5. **Backup:** Automatic backups are created, but keep your own too
6. **Permissions:** Always `chmod 600` for secret files
7. **Git:** Never commit secrets to version control
8. **Monitoring:** Watch for unauthorized access attempts

---

## Quick Reference

| Task | Command |
|------|---------|
| Generate production config | `./production-secrets-generator.sh` |
| Generate to stdout | `./production-secrets-generator.sh --stdout` |
| Generate for staging | `./production-secrets-generator.sh --output .env.staging` |
| Validate config | `./production-secrets-generator.sh --validate-only` |
| View help | `./production-secrets-generator.sh --help` |
| Check file permissions | `ls -la .env.production` |
| Set file permissions | `chmod 600 .env.production` |
| Generate new JWT secret | `openssl rand -hex 32` |
| View backups | `ls -la .env.production.backup.*` |

---

**Ready to deploy?** Follow the 3-step quick start at the top of this guide!

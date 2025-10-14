# Lumiku App - Production Deployment Runbook

**Version**: 1.0
**Last Updated**: October 14, 2025
**Platform**: Coolify (cf.avolut.com)
**Deployment Type**: Zero-downtime rolling deployment

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Process](#deployment-process)
4. [Post-Deployment Validation](#post-deployment-validation)
5. [Rollback Procedures](#rollback-procedures)
6. [Emergency Contacts](#emergency-contacts)
7. [Troubleshooting](#troubleshooting)
8. [Database Migrations](#database-migrations)
9. [Environment Configuration](#environment-configuration)

---

## Overview

### Architecture Summary

**Lumiku App** is a monorepo Next.js/TypeScript application consisting of:

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Bun + Hono + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis for rate limiting, caching, and BullMQ
- **Deployment Platform**: Coolify (self-hosted PaaS)

### Deployment Strategy

- **Method**: Git-based deployment via Coolify
- **Downtime**: Zero-downtime (rolling deployment)
- **Database Migrations**: Manual execution post-deployment
- **Health Checks**: Automated via scripts

### Key URLs

| Environment | URL | Coolify Dashboard |
|------------|-----|-------------------|
| Production | https://app.lumiku.com | https://cf.avolut.com |
| Development | https://dev.lumiku.com | https://cf.avolut.com |

---

## Pre-Deployment Checklist

### 1. Code Quality Checks

- [ ] All tests pass locally
- [ ] TypeScript compilation successful (no errors)
- [ ] No console errors or warnings in browser
- [ ] Code reviewed and approved
- [ ] Git branch is up to date with main/master

### 2. Environment Variables

Verify all required environment variables are set in Coolify:

**Critical Variables**:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Minimum 32 characters, cryptographically secure
- [ ] `REDIS_HOST` - Redis server hostname
- [ ] `REDIS_PORT` - Redis port (default: 6379)
- [ ] `REDIS_PASSWORD` - Redis authentication password
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000` (or configured port)
- [ ] `CORS_ORIGIN` - Frontend URL

**Optional but Recommended**:
- [ ] `DUITKU_MERCHANT_CODE` - Payment gateway
- [ ] `DUITKU_API_KEY` - Payment gateway API key
- [ ] `ANTHROPIC_API_KEY` - AI service
- [ ] `HUGGINGFACE_API_KEY` - AI model service
- [ ] `TRUSTED_PROXY_IPS` - Reverse proxy IPs

### 3. Infrastructure Checks

- [ ] Database is healthy and accessible
- [ ] Redis is running and accessible
- [ ] Sufficient disk space available (>10GB free)
- [ ] Coolify platform is operational
- [ ] SSL certificates are valid

### 4. Backup Verification

- [ ] Recent database backup exists (<24 hours old)
- [ ] Backup restoration tested within last 30 days
- [ ] Environment variables backed up
- [ ] Current deployment commit hash documented

### 5. Communication

- [ ] Stakeholders notified of deployment window
- [ ] Maintenance window scheduled (if required)
- [ ] Team members available for support

---

## Deployment Process

### Method 1: Automated Deployment Script (Recommended)

#### Windows

```batch
# 1. Run pre-deployment checks
deploy-pre-check.bat production

# 2. If checks pass, run deployment
deploy-production.bat

# 3. After deployment completes, validate
deploy-post-validate.bat production https://app.lumiku.com
```

#### Unix/Linux/macOS

```bash
# 1. Run pre-deployment checks
./deploy-pre-check.sh production

# 2. If checks pass, run deployment
./deploy-production.sh

# 3. After deployment completes, validate
./deploy-post-validate.sh production https://app.lumiku.com
```

**Script Options**:
- `--skip-checks`: Skip pre-deployment validation (NOT recommended)
- `--no-confirm`: Skip confirmation prompts (for CI/CD)

### Method 2: Manual Deployment

#### Step 1: Pre-Deployment Validation

Run the pre-deployment check script or manually verify:

```bash
# Check git status
git status

# Verify no uncommitted changes
git diff

# Check current branch and commit
git branch --show-current
git log -1 --oneline

# Build locally to verify
cd backend && bun run build
cd ../frontend && bun run build
```

#### Step 2: Commit and Push Changes

```bash
# Commit any pending changes
git add .
git commit -m "feat: Your deployment description"

# Push to remote
git push origin development  # or production branch
```

#### Step 3: Trigger Coolify Deployment

**Option A: Via Coolify Dashboard**

1. Navigate to https://cf.avolut.com
2. Login with your credentials
3. Select the Lumiku App project
4. Click "Deploy" or "Redeploy"
5. Monitor deployment logs in real-time

**Option B: Via Coolify API**

```bash
# Set environment variables
export COOLIFY_TOKEN="your-coolify-api-token"
export APP_UUID="d8ggwoo484k8ok48g8k8cgwk"

# Trigger deployment
curl -X POST "https://cf.avolut.com/api/v1/deploy?uuid=$APP_UUID&force=true" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
```

**Option C: Automatic Deployment**

If webhook is configured, Coolify will automatically deploy on git push to the configured branch.

#### Step 4: Monitor Deployment

1. **Watch Coolify Logs**: Monitor build and deployment progress
2. **Expected Duration**: 3-5 minutes for typical deployment
3. **Build Stages**:
   - Cloning repository
   - Installing dependencies
   - Building frontend
   - Building backend
   - Generating Prisma client
   - Starting application

#### Step 5: Run Database Migrations (if needed)

**IMPORTANT**: Database migrations must be run manually after deployment.

```bash
# SSH into Coolify container
# Method 1: Via Coolify dashboard terminal
# Method 2: Via docker exec

# Navigate to app directory
cd /app

# Run migrations
bun prisma migrate deploy

# Verify migration status
bun prisma migrate status
```

**Migration Safety**:
- Always review migrations before applying
- Test migrations on staging first
- Ensure migrations are reversible
- Have database backup before running

#### Step 6: Post-Deployment Validation

Run the post-validation script:

```bash
# Windows
deploy-post-validate.bat production https://app.lumiku.com

# Unix/Linux/macOS
./deploy-post-validate.sh production https://app.lumiku.com
```

Or manually verify:

```bash
# Health check
curl https://app.lumiku.com/health

# API endpoint
curl https://app.lumiku.com/api

# Authentication test
curl -X POST https://app.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## Post-Deployment Validation

### Automated Validation

The `deploy-post-validate` script runs 10 critical tests:

1. **Health Check Endpoint** - Verifies `/health` returns 200 OK
2. **API Base Endpoint** - Confirms API is accessible
3. **Database Connection** - Validates database connectivity
4. **Redis Connection** - Confirms Redis is connected
5. **Authentication Endpoints** - Tests login/register endpoints
6. **Rate Limiting** - Verifies rate limiting is active
7. **CORS Configuration** - Checks CORS headers
8. **Dashboard API** - Tests apps endpoint
9. **Static Assets** - Validates frontend is serving
10. **Response Time** - Measures API response time

### Manual Validation Checklist

- [ ] Homepage loads without errors
- [ ] User can login/register
- [ ] Dashboard displays all apps correctly
- [ ] File uploads work
- [ ] Payment flow functions
- [ ] Rate limiting triggers on excessive requests
- [ ] No errors in browser console
- [ ] No errors in application logs

### Monitoring

**First 30 Minutes**:
- Monitor Coolify logs for errors
- Watch error tracking (if configured)
- Check response times in monitoring dashboard
- Monitor Redis memory usage
- Verify database connection pool is healthy

**First 24 Hours**:
- Monitor user feedback
- Track error rates
- Check performance metrics
- Review usage patterns

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- Critical functionality is broken (authentication, payments)
- Database corruption detected
- Performance degradation >50%
- Security vulnerability introduced
- Widespread user complaints

### Rollback Strategy

#### Option 1: Rollback via Coolify (Fastest)

1. **Navigate to Coolify Dashboard**
   - Go to https://cf.avolut.com
   - Select Lumiku App

2. **Find Previous Deployment**
   - Go to "Deployments" tab
   - Locate last known good deployment
   - Note the commit hash

3. **Redeploy Previous Version**
   - Click "Redeploy" on the previous deployment
   - OR manually deploy from the previous commit

**Expected Duration**: 3-5 minutes

#### Option 2: Git Rollback

```bash
# Find the commit to rollback to
git log --oneline -10

# Option A: Revert the last commit
git revert HEAD
git push origin development

# Option B: Reset to previous commit (use with caution)
git reset --hard <previous-commit-hash>
git push --force origin development

# Option C: Create a new branch from previous commit
git checkout -b rollback-<date> <previous-commit-hash>
git push origin rollback-<date>
# Then deploy the rollback branch via Coolify
```

#### Option 3: Database Rollback (if migrations were run)

**WARNING**: Only use if database migrations caused the issue.

```bash
# SSH into container
cd /app

# Check current migration status
bun prisma migrate status

# Rollback last migration
bun prisma migrate resolve --rolled-back <migration-name>

# Or manually rollback using SQL
psql $DATABASE_URL -f rollback-migration.sql
```

### Post-Rollback Validation

After rollback:
1. Run `deploy-post-validate.sh` to verify functionality
2. Test critical user flows manually
3. Monitor logs for any errors
4. Communicate status to stakeholders
5. Conduct incident post-mortem

---

## Emergency Contacts

### Deployment Team

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Lead Developer | [Name] | [Email/Phone] | 24/7 |
| DevOps Engineer | [Name] | [Email/Phone] | Business Hours |
| Database Admin | [Name] | [Email/Phone] | On-call |
| Product Manager | [Name] | [Email/Phone] | Business Hours |

### Escalation Path

1. **Level 1**: On-call developer (immediate)
2. **Level 2**: Lead developer + DevOps (15 minutes)
3. **Level 3**: CTO + Infrastructure team (30 minutes)

### External Support

| Service | Support URL | SLA |
|---------|------------|-----|
| Coolify | https://coolify.io/docs | Community |
| Database Provider | [URL] | [SLA] |
| Redis Provider | [URL] | [SLA] |

---

## Troubleshooting

### Common Issues

#### 1. Build Fails in Coolify

**Symptoms**: Deployment stuck at "Building" or fails with error

**Diagnosis**:
```bash
# Check Coolify build logs
# Look for:
# - TypeScript compilation errors
# - Dependency installation failures
# - Out of memory errors
```

**Solutions**:
- Fix TypeScript errors locally and push
- Clear Coolify build cache and retry
- Check for dependency conflicts in `package.json`
- Increase Coolify memory limits if OOM

#### 2. Database Connection Fails

**Symptoms**: "Unable to connect to database" in logs

**Diagnosis**:
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Coolify environment variables
# Verify DATABASE_URL is correct
```

**Solutions**:
- Verify `DATABASE_URL` in Coolify env vars
- Check database server is running
- Verify network connectivity from Coolify to database
- Check PostgreSQL max_connections setting
- Restart database container if necessary

#### 3. Redis Connection Fails

**Symptoms**: "Redis connection refused" or rate limiting not working

**Diagnosis**:
```bash
# Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping

# Check Redis logs
docker logs <redis-container-id>
```

**Solutions**:
- Verify `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in Coolify
- Check Redis server is running
- Verify firewall rules allow connection
- Restart Redis container
- In emergency: App can run without Redis in dev mode (not recommended for production)

#### 4. Frontend Not Loading

**Symptoms**: Blank page or "Cannot GET /"

**Diagnosis**:
```bash
# Check if frontend dist exists
ls -la /app/frontend/dist

# Check Nginx/web server logs
```

**Solutions**:
- Verify frontend build completed successfully
- Check Coolify static file serving configuration
- Ensure `frontend/dist` is included in deployment
- Verify correct base path in Vite config

#### 5. Rate Limiting Not Working

**Symptoms**: No 429 errors on excessive requests

**Diagnosis**:
```bash
# Check Redis connection
curl https://app.lumiku.com/health | grep redis

# Check rate limit env vars
echo $RATE_LIMIT_ENABLED
```

**Solutions**:
- Verify Redis is connected (see issue #3)
- Check `RATE_LIMIT_ENABLED=true` in environment
- Review rate limit configuration in code
- Restart backend to reload configuration

#### 6. Authentication Fails

**Symptoms**: Users cannot login, JWT errors

**Diagnosis**:
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET | wc -c  # Should be >32

# Test login endpoint
curl -X POST https://app.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

**Solutions**:
- Verify `JWT_SECRET` is set and >32 characters
- Ensure `JWT_SECRET` hasn't changed (would invalidate all sessions)
- Check database for user records
- Review authentication middleware logs

#### 7. Slow Performance

**Symptoms**: Page loads slowly, timeouts

**Diagnosis**:
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://app.lumiku.com/health

# Check server resources
docker stats <container-id>
```

**Solutions**:
- Check database query performance
- Review Redis cache hit rates
- Check for memory leaks
- Scale up Coolify resources
- Enable CDN for static assets
- Review slow query logs

### Log Locations

| Component | Log Location | Access Method |
|-----------|-------------|---------------|
| Coolify Build | Coolify Dashboard | Web UI |
| Application | Coolify Logs | Web UI / Docker logs |
| Database | PostgreSQL logs | Server logs |
| Redis | Redis logs | Docker logs |
| Nginx | Nginx logs | Server logs |

---

## Database Migrations

### Migration Strategy

**Lumiku App** uses Prisma for database migrations with a **manual deployment strategy**.

### Running Migrations

**Development**:
```bash
cd backend
bun prisma migrate dev --name <migration-name>
```

**Production**:
```bash
# SSH into production container
cd /app

# Run migrations
bun prisma migrate deploy

# Verify status
bun prisma migrate status
```

### Migration Best Practices

1. **Always test migrations on staging first**
2. **Make migrations backward-compatible** when possible
3. **Never run destructive migrations** without backup
4. **Use transactions** for data migrations
5. **Document breaking changes** clearly

### Handling Breaking Migrations

For breaking schema changes:

1. **Two-phase deployment**:
   - Phase 1: Deploy code that works with old AND new schema
   - Run migration
   - Phase 2: Deploy code that uses only new schema

2. **Backup before migration**:
   ```bash
   # Create backup
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

3. **Have rollback SQL ready**:
   ```sql
   -- Example rollback for adding a column
   ALTER TABLE users DROP COLUMN new_column;
   ```

### Migration Rollback

If a migration fails:

```bash
# Option 1: Mark migration as rolled back
bun prisma migrate resolve --rolled-back <migration-name>

# Option 2: Manual SQL rollback
psql $DATABASE_URL -f rollback-<migration-name>.sql

# Option 3: Restore from backup
psql $DATABASE_URL < backup-<timestamp>.sql
```

---

## Environment Configuration

### Required Environment Variables

#### Backend (.env or Coolify)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public

# Security
JWT_SECRET=<min-32-chars-cryptographically-secure>
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://app.lumiku.com

# Redis (REQUIRED for production)
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>
REDIS_USERNAME=default

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000
RATE_LIMIT_REGISTER_MAX_ATTEMPTS=3
RATE_LIMIT_REGISTER_WINDOW_MS=3600000

# Payment Gateway (Duitku)
DUITKU_MERCHANT_CODE=<production-merchant-code>
DUITKU_API_KEY=<production-api-key>
DUITKU_ENV=production
DUITKU_CALLBACK_URL=https://app.lumiku.com/api/mainapp/payment/callback
DUITKU_RETURN_URL=https://app.lumiku.com

# AI Services
ANTHROPIC_API_KEY=<production-key>
HUGGINGFACE_API_KEY=<production-key>

# Storage
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000

# Optional
TRUSTED_PROXY_IPS=10.0.0.1,cloudflare-ip
```

### Generating Secure Secrets

```bash
# JWT_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT_SECRET (OpenSSL)
openssl rand -hex 32

# JWT_SECRET (Bun)
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variable Management

**Security Best Practices**:
1. Never commit `.env` files to git
2. Use Coolify secrets for sensitive values
3. Rotate secrets every 90 days
4. Use different secrets per environment
5. Document all required variables

**Updating Environment Variables**:

```bash
# Via Coolify API
curl -X PATCH "https://cf.avolut.com/api/v1/applications/$APP_UUID/envs" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"JWT_SECRET": "new-secret-value"}'

# Then redeploy
curl -X POST "https://cf.avolut.com/api/v1/deploy?uuid=$APP_UUID&force=true" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
```

---

## Deployment Checklist Summary

### Pre-Deployment

- [ ] Run `deploy-pre-check.sh`
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Environment variables verified
- [ ] Database backup created
- [ ] Stakeholders notified

### During Deployment

- [ ] Run `deploy-production.sh` OR trigger via Coolify
- [ ] Monitor deployment logs
- [ ] Wait for build to complete (3-5 min)
- [ ] Run database migrations (if needed)

### Post-Deployment

- [ ] Run `deploy-post-validate.sh`
- [ ] Test critical flows manually
- [ ] Monitor logs for 30 minutes
- [ ] Verify no user complaints
- [ ] Update deployment documentation
- [ ] Notify stakeholders of completion

### If Issues Occur

- [ ] Document the issue
- [ ] Check troubleshooting guide
- [ ] Attempt fix if safe
- [ ] Rollback if critical
- [ ] Conduct post-mortem

---

## Appendix

### Useful Commands

```bash
# Check Coolify logs
docker logs <container-id> -f --tail 100

# Check resource usage
docker stats

# Database connection
psql $DATABASE_URL

# Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD

# Check running processes
pm2 list  # if using PM2
ps aux | grep bun

# Check disk space
df -h

# Check memory
free -m
```

### Testing Endpoints

```bash
# Health check
curl https://app.lumiku.com/health

# API version
curl https://app.lumiku.com/api

# Test authentication (should fail gracefully)
curl -X POST https://app.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrongpass"}'

# Test rate limiting (run multiple times)
for i in {1..20}; do
  curl -X POST https://app.lumiku.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
  echo ""
done
```

### Deployment Timeline

| Stage | Duration | Notes |
|-------|----------|-------|
| Pre-checks | 2-5 min | Automated validation |
| Build | 3-5 min | Dependencies + compilation |
| Deploy | 1-2 min | Container restart |
| Migrations | 0-5 min | If required |
| Validation | 2-3 min | Post-deployment tests |
| **Total** | **8-20 min** | Typical deployment |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-14 | AI Assistant | Initial runbook creation |

**Review Schedule**: Quarterly or after major infrastructure changes

**Feedback**: Submit improvements via pull request or team discussion

---

**END OF DEPLOYMENT RUNBOOK**

# Lumiku App - Deployment Scripts Documentation

## Overview

This directory contains a comprehensive production deployment system for the Lumiku App platform. The system includes automated validation, deployment, and verification scripts designed to ensure safe, reliable deployments to Coolify.

## Created Files

### 1. Pre-Deployment Validation Scripts

**Purpose**: Validate environment and codebase before deployment

- **`deploy-pre-check.bat`** (Windows)
- **`deploy-pre-check.sh`** (Unix/Linux/macOS)

**What They Check**:
- Environment variables (DATABASE_URL, JWT_SECRET, REDIS_*, etc.)
- Git status and uncommitted changes
- Runtime environment (Bun/Node.js)
- Dependencies installation
- TypeScript compilation
- Database configuration
- Redis configuration
- Security settings (JWT_SECRET strength, rate limiting, default credentials)
- File structure integrity
- Deployment-specific requirements

**Usage**:
```bash
# Windows
deploy-pre-check.bat production

# Unix/Linux/macOS
./deploy-pre-check.sh production
```

**Exit Codes**:
- `0` - All checks passed (with or without warnings)
- `1` - Critical errors found, deployment blocked

### 2. Production Deployment Scripts

**Purpose**: Execute the complete deployment process

- **`deploy-production.bat`** (Windows)
- **`deploy-production.sh`** (Unix/Linux/macOS)

**What They Do**:
1. Run pre-deployment validation (optional: `--skip-checks`)
2. Prompt for user confirmation (optional: `--no-confirm`)
3. Configure Coolify connection (API token, App UUID)
4. Build application (frontend + backend)
5. Generate Prisma client
6. Optionally commit and push changes
7. Trigger Coolify deployment via API
8. Provide post-deployment instructions

**Usage**:
```bash
# Windows
deploy-production.bat
deploy-production.bat --skip-checks  # Skip pre-checks (not recommended)
deploy-production.bat --no-confirm   # Skip confirmation prompt (CI/CD)

# Unix/Linux/macOS
./deploy-production.sh
./deploy-production.sh --skip-checks
./deploy-production.sh --no-confirm
```

**Environment Variables**:
- `COOLIFY_TOKEN` - Coolify API token (prompted if not set)
- `APP_UUID` - Application UUID (defaults to: d8ggwoo484k8ok48g8k8cgwk)

**Output Files**:
- `deployment-YYYYMMDD-HHMMSS.log` - Complete deployment log
- `DEPLOYMENT_INFO.txt` - Quick reference with deployment details

### 3. Post-Deployment Validation Scripts

**Purpose**: Verify deployed application is functioning correctly

- **`deploy-post-validate.bat`** (Windows)
- **`deploy-post-validate.sh`** (Unix/Linux/macOS)

**Tests Performed** (10 total):
1. Health Check Endpoint - `/health` returns 200 OK
2. API Base Endpoint - API is accessible
3. Database Connection - Database connectivity verified
4. Redis Connection - Redis is connected
5. Authentication Endpoints - Login/register responding correctly
6. Rate Limiting - Rate limiting is active (429 on excessive requests)
7. CORS Configuration - CORS headers present
8. Dashboard API - Apps endpoint accessible
9. Static Assets - Frontend serving correctly
10. Response Time - API response time is acceptable

**Usage**:
```bash
# Windows
deploy-post-validate.bat production https://app.lumiku.com

# Unix/Linux/macOS
./deploy-post-validate.sh production https://app.lumiku.com
```

**Exit Codes**:
- `0` - All tests passed (or passed with warnings)
- `1` - Critical tests failed

**Output Files**:
- `post-deployment-validation-YYYYMMDD-HHMMSS.log` - Detailed test results

### 4. Deployment Runbook

**`DEPLOYMENT_RUNBOOK.md`** - Comprehensive deployment documentation

**Contents**:
- Architecture overview
- Complete deployment procedures (automated and manual)
- Post-deployment validation checklist
- **Rollback procedures** (3 different methods)
- Emergency contacts and escalation path
- Troubleshooting guide (7 common issues)
- Database migration procedures
- Environment configuration reference
- Security best practices

**Key Sections**:
- Pre-deployment checklist
- Step-by-step deployment guide
- Zero-downtime deployment strategy
- Rollback strategies (Coolify, Git, Database)
- Common issues and solutions
- Monitoring and validation procedures

---

## Quick Start Guide

### First-Time Setup

1. **Ensure prerequisites are installed**:
   - Bun (preferred) or Node.js
   - Git
   - curl (for API calls)

2. **Set environment variables** (optional):
   ```bash
   export COOLIFY_TOKEN="your-coolify-api-token"
   export APP_UUID="d8ggwoo484k8ok48g8k8cgwk"
   ```

3. **Make scripts executable** (Unix only):
   ```bash
   chmod +x deploy-pre-check.sh
   chmod +x deploy-production.sh
   chmod +x deploy-post-validate.sh
   ```

### Standard Deployment Workflow

**Step 1: Pre-Deployment Validation**
```bash
# Windows
deploy-pre-check.bat production

# Unix/Linux/macOS
./deploy-pre-check.sh production
```

If any errors are found, fix them before proceeding.

**Step 2: Deploy to Production**
```bash
# Windows
deploy-production.bat

# Unix/Linux/macOS
./deploy-production.sh
```

The script will:
- Run pre-checks automatically
- Ask for confirmation
- Build the application
- Trigger Coolify deployment
- Provide next steps

**Step 3: Wait for Deployment**

Monitor deployment in Coolify dashboard:
- Go to https://cf.avolut.com
- Watch build and deployment logs
- Typical duration: 3-5 minutes

**Step 4: Run Database Migrations** (if needed)
```bash
# SSH into Coolify container
cd /app
bun prisma migrate deploy
```

**Step 5: Post-Deployment Validation**
```bash
# Windows
deploy-post-validate.bat production https://app.lumiku.com

# Unix/Linux/macOS
./deploy-post-validate.sh production https://app.lumiku.com
```

**Step 6: Manual Testing**

Test critical user flows:
- Login/Register
- Dashboard access
- File uploads
- Payment processing
- AI features

---

## Rollback Procedures

If deployment fails or critical issues are detected:

### Method 1: Rollback via Coolify (Fastest - 3-5 min)

1. Go to https://cf.avolut.com
2. Navigate to "Deployments" tab
3. Find last known good deployment
4. Click "Redeploy"

### Method 2: Git Rollback

```bash
# Find previous commit
git log --oneline -10

# Revert to previous commit
git revert HEAD
git push origin development

# Coolify will auto-deploy if webhook is configured
# Or manually trigger deployment
```

### Method 3: Database Rollback (if needed)

```bash
# SSH into container
cd /app

# Check migration status
bun prisma migrate status

# Mark migration as rolled back
bun prisma migrate resolve --rolled-back <migration-name>

# Or manually run rollback SQL
psql $DATABASE_URL -f rollback-migration.sql
```

**After Rollback**: Run `deploy-post-validate` to verify functionality

---

## Key Considerations

### 1. Security

**Critical Environment Variables**:
- `JWT_SECRET` must be minimum 32 characters, cryptographically secure
- Generate with: `openssl rand -hex 32`
- Never commit secrets to git

**Redis Required for Production**:
- Rate limiting requires Redis
- Application will refuse to start in production without Redis
- Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

**Environment Variable Validation**:
- All scripts check for required variables
- Deployment blocked if critical variables missing
- Warnings issued for optional variables

### 2. Database Migrations

**Manual Execution Required**:
- Migrations are NOT automatic
- Must SSH into container and run: `bun prisma migrate deploy`
- Always test migrations on staging first
- Have database backup before running

**Migration Strategy**:
- Use backward-compatible migrations when possible
- Two-phase deployment for breaking changes
- Document rollback SQL for each migration

### 3. Zero-Downtime Deployment

**Coolify Strategy**:
- Rolling deployment (new container starts before old one stops)
- Health checks ensure new container is ready
- Old connections gracefully drained
- Typical downtime: 0 seconds (or <5 seconds during container swap)

**Best Practices**:
- Deploy during low-traffic periods
- Monitor logs during and after deployment
- Have team members available for support
- Test rollback procedures regularly

### 4. Monitoring and Alerting

**Post-Deployment Monitoring** (First 30 minutes):
- Application logs in Coolify
- Error rates
- Response times
- Redis memory usage
- Database connection pool

**Long-term Monitoring** (First 24 hours):
- User feedback
- Performance metrics
- Error tracking
- Usage patterns

### 5. Common Pitfalls

**Avoid These Mistakes**:
- Skipping pre-deployment validation
- Not having database backup
- Running untested migrations in production
- Deploying without Redis configured
- Forgetting to update environment variables
- Not testing authentication after deployment

---

## Architecture-Specific Notes

### Technology Stack

**Frontend**:
- React 19 + Vite + TypeScript
- Build: `bun run build` → `frontend/dist`
- Static assets served by Coolify

**Backend**:
- Bun + Hono + TypeScript
- Build: `bun run build` → `backend/dist`
- Runtime: Bun (or Node.js)

**Database**:
- PostgreSQL with Prisma ORM
- Migrations: Manual deployment strategy
- Connection pooling via Prisma

**Cache/Queue**:
- Redis for rate limiting, caching, BullMQ
- REQUIRED for production (application exits without it)
- Distributed rate limiting across instances

### File Structure Impact

**Monorepo Structure**:
```
lumiku-app/
├── backend/          # Backend API
├── frontend/         # Frontend UI
├── packages/         # Shared packages
├── deploy-*.bat      # Windows deployment scripts
├── deploy-*.sh       # Unix deployment scripts
└── DEPLOYMENT_RUNBOOK.md
```

**Build Artifacts**:
- `frontend/dist` - Frontend static files
- `backend/dist` - Backend compiled JS
- `backend/node_modules/.prisma` - Prisma client

### Coolify Configuration

**Environment Variables** (Set in Coolify dashboard):
```
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars>
REDIS_HOST=redis-server
REDIS_PORT=6379
REDIS_PASSWORD=<secure>
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://app.lumiku.com
```

**Build Command**: Handled by Coolify using package.json scripts
**Start Command**: `bun src/index.ts` (backend)

---

## Troubleshooting Guide

### Script Issues

**Problem**: "Permission denied" on Unix/Linux
```bash
# Solution: Make scripts executable
chmod +x deploy-pre-check.sh deploy-production.sh deploy-post-validate.sh
```

**Problem**: Scripts not found
```bash
# Solution: Run from project root
cd /path/to/lumiku-app
./deploy-production.sh
```

**Problem**: Environment variables not loaded
```bash
# Solution: Source .env file or export variables
export COOLIFY_TOKEN="your-token"
export APP_UUID="your-uuid"
```

### Deployment Issues

**Problem**: Build fails in Coolify

**Diagnosis**:
- Check Coolify build logs
- Look for TypeScript errors
- Verify dependencies in package.json

**Solution**:
- Fix errors locally
- Run `bun run build` to test
- Push fixes and redeploy

**Problem**: Application won't start

**Common Causes**:
1. Missing environment variables
2. Database connection failed
3. Redis not configured (production)
4. Port already in use

**Solution**:
- Check Coolify application logs
- Verify all environment variables set
- Test database connection: `psql $DATABASE_URL -c "SELECT 1;"`
- Test Redis: `redis-cli -h $REDIS_HOST ping`

**Problem**: Rate limiting not working

**Diagnosis**:
```bash
# Check health endpoint
curl https://app.lumiku.com/health | grep redis

# Test rate limiting
for i in {1..20}; do
  curl -X POST https://app.lumiku.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}'
done
```

**Solution**:
- Verify Redis is connected
- Check `RATE_LIMIT_ENABLED=true`
- Restart application

### Validation Issues

**Problem**: Post-validation script fails all tests

**Common Causes**:
1. Application not fully started
2. Wrong URL (http vs https)
3. Firewall blocking requests
4. Application crashed after deployment

**Solution**:
- Wait 1-2 minutes for full startup
- Verify correct URL
- Check Coolify logs for errors
- Try accessing URL in browser

---

## CI/CD Integration

### Using Scripts in CI/CD Pipeline

**Example GitHub Actions**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Pre-deployment validation
        run: ./deploy-pre-check.sh production

      - name: Deploy to Coolify
        env:
          COOLIFY_TOKEN: ${{ secrets.COOLIFY_TOKEN }}
          APP_UUID: ${{ secrets.APP_UUID }}
        run: ./deploy-production.sh --no-confirm

      - name: Wait for deployment
        run: sleep 120

      - name: Post-deployment validation
        run: ./deploy-post-validate.sh production https://app.lumiku.com
```

**Flags for Automation**:
- `--skip-checks` - Skip pre-validation (use with caution)
- `--no-confirm` - Skip confirmation prompts (required for CI/CD)

---

## Best Practices

### Before Deployment

1. Review all changes since last deployment
2. Run tests locally
3. Build locally to catch compilation errors
4. Test on staging environment
5. Create database backup
6. Notify team members
7. Schedule deployment during low-traffic period

### During Deployment

1. Monitor Coolify build logs in real-time
2. Have rollback plan ready
3. Keep team members on standby
4. Document any manual steps taken

### After Deployment

1. Run post-validation script immediately
2. Test critical user flows manually
3. Monitor logs for first 30 minutes
4. Watch for user complaints
5. Update deployment documentation
6. Conduct deployment retrospective

### Regular Maintenance

1. Test rollback procedures monthly
2. Review and update runbook quarterly
3. Rotate secrets every 90 days
4. Test database backup restoration
5. Update dependencies regularly
6. Monitor disk space and resources

---

## Support and Feedback

### Getting Help

1. **Deployment Issues**: Check `DEPLOYMENT_RUNBOOK.md` troubleshooting section
2. **Script Errors**: Review log files generated by scripts
3. **Emergency**: Follow escalation path in runbook
4. **Documentation**: All procedures documented in runbook

### Improving These Scripts

**Feedback Welcome**:
- Bug reports
- Enhancement suggestions
- Additional validation checks
- Platform-specific improvements

**Contributing**:
1. Test proposed changes on staging
2. Update documentation
3. Submit pull request with clear description

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-14 | Initial deployment system created |

---

## Summary

This deployment system provides:

- **Automated validation** (9 checks before deployment)
- **Safe deployment** (with confirmation and logging)
- **Comprehensive testing** (10 post-deployment tests)
- **Clear rollback procedures** (3 different methods)
- **Detailed documentation** (50+ page runbook)
- **Platform support** (Windows and Unix)

**Total Deployment Time**: 8-20 minutes (depending on migration needs)

**Safety Features**:
- Pre-deployment validation blocks unsafe deployments
- Environment variable checking prevents misconfigurations
- Build verification catches compilation errors
- Post-deployment testing detects runtime issues
- Multiple rollback options for quick recovery

**Key Files**:
1. `deploy-pre-check.[bat|sh]` - Pre-deployment validation
2. `deploy-production.[bat|sh]` - Main deployment script
3. `deploy-post-validate.[bat|sh]` - Post-deployment testing
4. `DEPLOYMENT_RUNBOOK.md` - Complete deployment guide

**Next Steps**:
1. Review `DEPLOYMENT_RUNBOOK.md` thoroughly
2. Test scripts on staging environment
3. Configure Coolify environment variables
4. Practice rollback procedures
5. Schedule first production deployment

---

**END OF DOCUMENTATION**

# JWT Secret Migration Guide

This guide helps you migrate from an insecure JWT configuration to the new secure JWT secret management system.

## Overview

The JWT secret management system has been upgraded with comprehensive security validation. This migration guide covers:

- Migrating from default/weak secrets
- Handling active user sessions
- Zero-downtime migration strategies
- Rollback procedures
- Testing and validation

---

## Pre-Migration Assessment

### Step 1: Identify Current Configuration

Check your current JWT secret configuration:

```bash
# On production server
echo $JWT_SECRET

# Or check your deployment platform:
# Vercel: vercel env ls
# Railway: Check Variables tab
# AWS: aws secretsmanager describe-secret --secret-id lumiku/jwt-secret
```

### Step 2: Assess Impact

| Current Secret | Risk Level | Impact | Migration Priority |
|---------------|------------|--------|-------------------|
| `change-this-secret-key` | CRITICAL | All sessions invalidated | IMMEDIATE |
| Other default value | CRITICAL | All sessions invalidated | IMMEDIATE |
| < 32 characters | HIGH | All sessions invalidated | HIGH |
| Low entropy | HIGH | All sessions invalidated | HIGH |
| Properly configured | LOW | None | Monitor only |

### Step 3: Identify Active Sessions

Estimate the number of active user sessions that will be affected:

```sql
-- If tracking sessions in database
SELECT COUNT(*) FROM sessions WHERE expires_at > NOW();

-- Estimate from login activity
SELECT COUNT(DISTINCT user_id) FROM auth_logs
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## Migration Strategies

Choose a migration strategy based on your situation:

### Strategy 1: Immediate Migration (High Risk Environment)

**Use when**:
- Using default/weak secret
- Security incident or breach suspected
- No active users or acceptable to invalidate all sessions

**Steps**:
1. Generate new secure secret
2. Update environment variable
3. Deploy immediately
4. All users must re-authenticate

**Downtime**: Minimal (restart only)
**Session Impact**: 100% of users must re-login

### Strategy 2: Planned Migration (Normal Environment)

**Use when**:
- Current secret is weak but not default
- Can schedule maintenance window
- Want to minimize user impact

**Steps**:
1. Schedule maintenance during low-traffic period
2. Announce to users in advance
3. Generate new secure secret
4. Update and deploy
5. Monitor post-deployment

**Downtime**: 5-15 minutes
**Session Impact**: 100% of users must re-login

### Strategy 3: Gradual Migration (Not Yet Implemented)

**Use when**:
- Large active user base
- Cannot invalidate all sessions
- Need zero-downtime migration

**Status**: Architecture ready, implementation pending

**Future Steps** (when implemented):
1. Deploy dual-secret support
2. Set JWT_SECRET_PREVIOUS to current secret
3. Set JWT_SECRET to new secure secret
4. Users gradually migrate to new tokens
5. After grace period, remove old secret

---

## Migration Procedures

### For Immediate Migration (Strategy 1)

#### Phase 1: Preparation (5 minutes)

1. **Generate new secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Store secret securely**:
   - Save in password manager
   - Document in secure location
   - **Do not** commit to version control

3. **Prepare rollback plan**:
   - Document current configuration
   - Have old secret available (if exists)
   - Know how to quickly revert

#### Phase 2: Update Code (Already Done)

The secure JWT validation is already implemented in:
- `backend/src/config/jwt-secret-validator.ts`
- `backend/src/config/env.ts`
- `backend/src/lib/jwt.ts`

#### Phase 3: Configure Environment (5 minutes)

**Vercel**:
```bash
# Set JWT_SECRET
vercel env add JWT_SECRET production
# Paste your generated secret when prompted

# Verify
vercel env ls
```

**Railway**:
1. Go to project settings
2. Navigate to "Variables" tab
3. Add or update `JWT_SECRET` variable
4. Save changes

**AWS ECS/Fargate**:
```bash
# Store in Secrets Manager
aws secretsmanager create-secret \
  --name lumiku/production/jwt-secret \
  --secret-string "your-generated-secret" \
  --region us-east-1

# Update task definition to reference secret
# Then deploy new task definition
```

**Docker/Kubernetes**:
```bash
# Create secret
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET="your-generated-secret" \
  --namespace=production

# Update deployment to use secret
kubectl set env deployment/lumiku-backend \
  --from=secret/jwt-secret \
  --namespace=production
```

**Traditional Server**:
```bash
# Edit environment file
sudo nano /etc/environment
# Add: JWT_SECRET="your-generated-secret"

# Or systemd service
sudo nano /etc/systemd/system/lumiku-backend.service
# Add under [Service]: Environment="JWT_SECRET=your-generated-secret"

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart lumiku-backend
```

#### Phase 4: Deploy Application (5-10 minutes)

```bash
# Commit code changes (if not already deployed)
git add backend/src/config backend/src/lib backend/docs
git commit -m "security: Implement secure JWT secret management

- Add comprehensive JWT secret validation
- Enforce strong secrets in production
- Add rotation architecture
- Include security documentation

🔒 P0 Security Fix"

git push origin main

# Deploy
# (Deployment method depends on your platform)
```

#### Phase 5: Validation (5 minutes)

1. **Check application startup**:
   ```bash
   # Check logs for JWT configuration status
   # Should see:
   # 🔐 JWT Secret Configuration:
   #    Environment: production
   #    Source: Environment Variable
   #    Length: 64 characters
   #    Entropy: 4.0 bits/char
   #    Status: ✅ SECURE
   ```

2. **Test authentication**:
   ```bash
   # Login should work
   curl -X POST https://your-app.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'

   # Old tokens should be rejected
   curl -H "Authorization: Bearer OLD_TOKEN" \
     https://your-app.com/api/user/profile
   # Should return 401 Unauthorized
   ```

3. **Monitor for errors**:
   ```bash
   # Check error logs
   # Watch for authentication failures
   # Verify no JWT-related errors
   ```

#### Phase 6: User Communication

**Email template**:
```
Subject: Security Update - Please Login Again

Dear Lumiku User,

We've implemented important security improvements to protect your account.
As part of this update, you'll need to log in again.

This is a one-time requirement and helps ensure your data remains secure.

Thank you for your understanding.

The Lumiku Team
```

**In-app message**:
```
Your session has expired due to a security update.
Please log in again to continue.
```

### For Planned Migration (Strategy 2)

Follow the same steps as Strategy 1, but with advance planning:

#### 1 Week Before Migration

- [ ] Announce maintenance window
- [ ] Prepare communication materials
- [ ] Generate and store new secret
- [ ] Test in staging environment
- [ ] Prepare monitoring dashboard

#### 1 Day Before Migration

- [ ] Send reminder to users
- [ ] Verify staging tests passed
- [ ] Confirm on-call coverage
- [ ] Review rollback procedure

#### During Migration Window

- [ ] Update environment variable
- [ ] Deploy application
- [ ] Monitor for issues
- [ ] Validate authentication

#### After Migration

- [ ] Send completion announcement
- [ ] Monitor for 24 hours
- [ ] Review metrics
- [ ] Document lessons learned

---

## Testing Before Production

### In Staging Environment

1. **Set up staging with new secret**:
   ```bash
   # Generate staging secret (different from production!)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Set in staging
   JWT_SECRET="staging-secret-here" bun run dev
   ```

2. **Test application startup**:
   ```bash
   bun run dev
   # Check logs for secure JWT configuration message
   ```

3. **Test authentication flows**:
   ```bash
   # Register new user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'

   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'

   # Use returned token
   curl -H "Authorization: Bearer TOKEN_HERE" \
     http://localhost:3000/api/user/profile
   ```

4. **Test weak secret rejection**:
   ```bash
   # Should fail to start
   JWT_SECRET="weak" NODE_ENV=production bun run start
   # Expected: Error about weak secret
   ```

5. **Test missing secret handling**:
   ```bash
   # Development: should auto-generate
   unset JWT_SECRET
   bun run dev
   # Expected: Warning about temporary secret

   # Production: should fail
   NODE_ENV=production bun run start
   # Expected: Error about missing secret
   ```

---

## Rollback Procedures

### When to Rollback

Rollback if:
- Application fails to start
- All authentication requests fail
- Critical errors in JWT validation
- Accidental secret exposure

### Rollback Steps

#### Immediate Rollback (< 5 minutes)

1. **Revert environment variable**:
   ```bash
   # Vercel
   vercel env rm JWT_SECRET production
   vercel env add JWT_SECRET production
   # Enter old secret

   # Railway
   # Update JWT_SECRET variable to old value in dashboard

   # Traditional server
   sudo nano /etc/environment
   # Update JWT_SECRET to old value
   sudo systemctl restart lumiku-backend
   ```

2. **Restart application**:
   ```bash
   # Restart based on your platform
   # Vercel: automatic on env change
   # Railway: automatic on env change
   # Others: manual restart
   ```

3. **Verify operation**:
   ```bash
   # Test login
   curl -X POST https://your-app.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test"}'
   ```

#### Post-Rollback

1. **Investigate failure**:
   - Review error logs
   - Check secret format
   - Verify environment variable injection
   - Test in staging

2. **Plan retry**:
   - Fix identified issues
   - Test thoroughly in staging
   - Schedule new migration

3. **Document incident**:
   - Root cause
   - Resolution steps
   - Prevention measures

---

## Post-Migration Tasks

### Immediate (Within 1 Hour)

- [ ] Verify authentication is working
- [ ] Check error logs for JWT issues
- [ ] Monitor authentication success rate
- [ ] Confirm no secret exposure in logs

### Within 24 Hours

- [ ] Review authentication metrics
- [ ] Check for unusual patterns
- [ ] Verify all user flows work
- [ ] Monitor support requests

### Within 1 Week

- [ ] Conduct security review
- [ ] Update incident response procedures
- [ ] Schedule next secret rotation (90 days)
- [ ] Document lessons learned
- [ ] Update team training materials

---

## Monitoring After Migration

### Key Metrics

1. **Authentication Success Rate**:
   ```sql
   SELECT
     COUNT(CASE WHEN status = 200 THEN 1 END) * 100.0 / COUNT(*) as success_rate
   FROM auth_logs
   WHERE timestamp > NOW() - INTERVAL '1 hour'
   ```

2. **JWT Validation Failures**:
   ```sql
   SELECT COUNT(*) FROM logs
   WHERE level = 'error'
   AND message LIKE '%Invalid or expired token%'
   AND timestamp > NOW() - INTERVAL '1 hour'
   ```

3. **Token Generation Rate**:
   ```sql
   SELECT COUNT(*) FROM logs
   WHERE message LIKE '%JWT token generated%'
   AND timestamp > NOW() - INTERVAL '1 hour'
   ```

### Alert Thresholds

- Authentication failure rate > 10%: WARNING
- Authentication failure rate > 25%: CRITICAL
- JWT validation errors > 100/hour: WARNING
- JWT validation errors > 500/hour: CRITICAL

---

## Troubleshooting Common Issues

### Issue 1: Application Won't Start

**Error**: `JWT_SECRET is not set` or `JWT_SECRET is too short`

**Solution**:
1. Verify environment variable is set:
   ```bash
   echo $JWT_SECRET  # Should show secret (be careful where you run this!)
   ```
2. Check secret meets requirements (32+ chars for production)
3. Verify deployment platform injected variable correctly

### Issue 2: All Authentication Fails

**Error**: `Invalid or expired token`

**Cause**: Old tokens signed with old secret

**Solution**:
1. This is expected behavior after migration
2. Users must re-authenticate
3. Clear any cached tokens on client side

### Issue 3: Some Users Can't Login

**Cause**: Client-side caching of old tokens

**Solution**:
1. Clear browser local storage/cookies
2. Force re-authentication
3. Implement token refresh logic

### Issue 4: Secret Appears in Logs

**Immediate Action**:
1. Stop logging immediately
2. Rotate secret ASAP
3. Review who had access to logs
4. Update logging configuration

**Prevention**:
- Never log `env.JWT_SECRET`
- Only log metadata (length, entropy, etc.)
- Review logging code carefully

---

## Success Criteria

Migration is successful when:

- [ ] Application starts without errors
- [ ] JWT configuration shows as secure
- [ ] Users can log in successfully
- [ ] JWT tokens are validated correctly
- [ ] No secret exposure in logs/errors
- [ ] Authentication success rate > 95%
- [ ] No critical security alerts
- [ ] Monitoring dashboard shows healthy metrics

---

## Emergency Contacts

Document key contacts for migration support:

- **On-call Engineer**: _________________
- **Security Team**: _________________
- **DevOps Lead**: _________________
- **CTO/Security Officer**: _________________

---

## Appendix: Environment-Specific Instructions

### Vercel

```bash
# Production
vercel env add JWT_SECRET production
vercel deploy --prod

# Preview
vercel env add JWT_SECRET preview

# Development
vercel env add JWT_SECRET development
```

### Railway

1. Navigate to project in Railway dashboard
2. Go to "Variables" tab
3. Click "New Variable"
4. Name: `JWT_SECRET`
5. Value: (paste generated secret)
6. Save (will auto-redeploy)

### AWS ECS

```bash
# Store secret
aws secretsmanager create-secret \
  --name lumiku/production/jwt-secret \
  --secret-string "your-secret"

# Update task definition JSON
{
  "secrets": [{
    "name": "JWT_SECRET",
    "valueFrom": "arn:aws:secretsmanager:region:account:secret:lumiku/production/jwt-secret"
  }]
}

# Deploy new task definition
aws ecs update-service --cluster lumiku --service backend --task-definition lumiku-backend:2
```

### Docker Compose

```yaml
services:
  backend:
    environment:
      - JWT_SECRET=${JWT_SECRET}
    env_file:
      - .env.production
```

```bash
# .env.production
JWT_SECRET=your-generated-secret-here
```

### Kubernetes

```bash
# Create secret
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET="your-generated-secret"

# Reference in deployment
kubectl set env deployment/lumiku-backend \
  --from=secret/jwt-secret
```

---

## Additional Resources

- `docs/JWT_SECRET_SETUP.md` - Setup guide
- `docs/JWT_SECURITY_ANALYSIS.md` - Security analysis
- `docs/DEPLOYMENT_CHECKLIST_JWT.md` - Deployment checklist
- `src/config/jwt-secret-validator.ts` - Implementation details

---

**Remember**: Migrating JWT secrets will invalidate all active sessions. Plan accordingly and communicate with users.

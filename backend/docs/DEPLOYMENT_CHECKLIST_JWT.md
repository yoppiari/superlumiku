# JWT Secret Deployment Checklist

This checklist ensures secure JWT secret configuration during deployment. Complete all items before deploying to production.

## Pre-Deployment Checklist

### 1. Secret Generation

- [ ] Generated a cryptographically secure JWT secret
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Secret is minimum 32 bytes (64 hex characters)
- [ ] Secret is unique to this environment (not reused from dev/staging)
- [ ] Secret has been stored in secure location (password manager, secrets vault)
- [ ] Secret has NOT been committed to version control
- [ ] Secret has NOT been shared via insecure channels (email, Slack, etc.)

### 2. Environment Configuration

- [ ] NODE_ENV is set to `production`
- [ ] JWT_SECRET environment variable is configured in deployment platform
- [ ] JWT_EXPIRES_IN is set appropriately (default: `7d`)
- [ ] Verified environment variables are properly injected at runtime
- [ ] Tested that application fails to start without JWT_SECRET
- [ ] Confirmed no `.env` files are included in deployment artifacts

### 3. Security Validation

- [ ] Application startup logs show secure JWT configuration
- [ ] No warnings about weak or default secrets
- [ ] JWT secret metadata shows `isSecure: true`
- [ ] Secret entropy is >= 3.5 bits/character
- [ ] Secret is not in blacklist of known weak values
- [ ] Verified secret rotation procedure is documented

### 4. Access Control

- [ ] Limited access to environment variable configuration (principle of least privilege)
- [ ] Access to secrets is logged/audited
- [ ] Team members with secret access are documented
- [ ] Backup/recovery procedure for secrets is documented
- [ ] Secret is stored in encrypted secret management system

### 5. Testing

- [ ] Tested user authentication in staging with production-like secret
- [ ] Verified JWT tokens are properly signed and validated
- [ ] Tested token expiration behavior
- [ ] Confirmed invalid tokens are rejected
- [ ] Load tested authentication endpoints
- [ ] Verified no secret exposure in error messages or logs

## Deployment Steps

### Step 1: Backup Current Configuration

- [ ] Document current JWT_SECRET configuration (metadata only, not actual secret)
- [ ] Export current environment variables (excluding secrets)
- [ ] Create rollback plan
- [ ] Verify backup/restore procedures

### Step 2: Configure Production Environment

**For Vercel:**
```bash
vercel env add JWT_SECRET production
# Paste generated secret when prompted
vercel env add NODE_ENV production
```

**For Railway:**
1. Navigate to project settings
2. Go to "Variables" tab
3. Add `JWT_SECRET` with generated value
4. Add `NODE_ENV` with value `production`

**For AWS/ECS:**
```bash
aws secretsmanager create-secret \
  --name lumiku/production/jwt-secret \
  --secret-string "your-generated-secret"
```

**For Docker/Kubernetes:**
```bash
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET="your-generated-secret"
```

**For traditional servers:**
```bash
# Add to /etc/environment or systemd service file
JWT_SECRET="your-generated-secret"
NODE_ENV="production"
```

- [ ] Configured JWT_SECRET in deployment platform
- [ ] Configured NODE_ENV=production
- [ ] Verified environment variable injection works
- [ ] Tested configuration in non-production environment first

### Step 3: Deploy Application

- [ ] Deploy application to production
- [ ] Monitor deployment logs for JWT configuration status
- [ ] Verify application starts successfully
- [ ] Check for any JWT-related errors or warnings

### Step 4: Validation

- [ ] Test user login functionality
- [ ] Verify JWT tokens are being generated
- [ ] Confirm token validation is working
- [ ] Test token expiration
- [ ] Check that invalid tokens are rejected
- [ ] Monitor error logs for authentication issues

### Step 5: Documentation

- [ ] Document JWT secret location/retrieval method
- [ ] Update runbook with secret rotation procedure
- [ ] Document who has access to secrets
- [ ] Add monitoring alerts for JWT failures
- [ ] Update incident response plan

## Post-Deployment Checklist

### Immediate (Within 1 Hour)

- [ ] Verify all authentication flows work
- [ ] Monitor application logs for JWT errors
- [ ] Check error rates for authentication endpoints
- [ ] Verify no secret exposure in logs or responses
- [ ] Confirm health check endpoint shows secure configuration

### Within 24 Hours

- [ ] Review authentication metrics/logs
- [ ] Verify no unusual authentication patterns
- [ ] Check for any JWT signature failures
- [ ] Monitor token generation rates
- [ ] Review security alerts

### Within 1 Week

- [ ] Schedule first secret rotation (90 days from now)
- [ ] Review and refine monitoring/alerting
- [ ] Conduct security review of authentication flows
- [ ] Document any issues encountered during deployment
- [ ] Update deployment procedures based on learnings

## Monitoring Setup

### Metrics to Track

- [ ] Authentication success/failure rates
- [ ] JWT signature validation failures
- [ ] Token expiration events
- [ ] Unusual authentication patterns
- [ ] API endpoints returning 401/403 errors

### Alerts to Configure

- [ ] Alert on JWT signature validation failures exceeding threshold
- [ ] Alert on sudden increase in authentication failures
- [ ] Alert on application startup with weak/missing JWT secret
- [ ] Alert on unusual token generation patterns
- [ ] Alert on unauthorized access attempts

### Log Queries to Create

```sql
-- JWT validation failures
SELECT COUNT(*) FROM logs
WHERE message LIKE '%Invalid or expired token%'
GROUP BY HOUR;

-- Authentication success rate
SELECT
  COUNT(CASE WHEN status = 200 THEN 1 END) as success,
  COUNT(CASE WHEN status = 401 THEN 1 END) as failures
FROM auth_logs
WHERE timestamp > NOW() - INTERVAL '1 hour';
```

- [ ] Created log queries for JWT monitoring
- [ ] Set up dashboards for authentication metrics
- [ ] Configured alerting thresholds
- [ ] Tested alert notifications

## Migration from Insecure Configuration

If migrating from an insecure JWT configuration (e.g., default secret):

### Pre-Migration

- [ ] Identify all active user sessions
- [ ] Plan for session invalidation impact
- [ ] Communicate with users about forced logout (if significant)
- [ ] Schedule during low-traffic period
- [ ] Prepare support team for potential user issues

### During Migration

- [ ] Generate new secure secret
- [ ] Update environment variable
- [ ] Deploy new configuration
- [ ] All existing sessions will be invalidated
- [ ] Users must re-authenticate

### Post-Migration

- [ ] Monitor for authentication issues
- [ ] Verify new tokens are secure
- [ ] Check that old tokens are rejected
- [ ] Document the migration
- [ ] Update security documentation

## Rollback Plan

In case of critical issues:

### Rollback Steps

1. **Immediate** (if application won't start):
   - [ ] Revert JWT_SECRET to previous value
   - [ ] Restart application
   - [ ] Verify application starts
   - [ ] Monitor for stability

2. **Investigation**:
   - [ ] Review deployment logs
   - [ ] Check environment variable configuration
   - [ ] Verify secret format and validity
   - [ ] Test secret in staging environment

3. **Resolution**:
   - [ ] Fix identified issues
   - [ ] Test thoroughly in staging
   - [ ] Plan new deployment
   - [ ] Document root cause

### Rollback Triggers

Rollback immediately if:
- [ ] Application fails to start
- [ ] All authentication fails
- [ ] Critical JWT validation errors
- [ ] Exposure of JWT secret in logs/errors

## Compliance Verification

### Security Compliance

- [ ] Secret meets OWASP recommendations (256+ bits)
- [ ] Cryptographically secure random generation
- [ ] Not stored in version control
- [ ] Encrypted at rest in secret storage
- [ ] Access logging enabled
- [ ] Rotation schedule documented (90 days)

### Audit Requirements

- [ ] Secret creation documented
- [ ] Access control documented
- [ ] Rotation schedule documented
- [ ] Incident response plan includes JWT compromise
- [ ] Security review completed
- [ ] Penetration testing includes authentication

## Team Communication

### Before Deployment

- [ ] Notify team of deployment schedule
- [ ] Communicate potential session invalidation
- [ ] Ensure on-call engineer is available
- [ ] Brief support team on potential user issues

### After Deployment

- [ ] Confirm successful deployment to team
- [ ] Share monitoring dashboard links
- [ ] Document any issues encountered
- [ ] Schedule post-mortem if needed

## Emergency Contacts

Document emergency contacts for JWT-related incidents:

- **On-call Engineer**: _________________
- **Security Team**: _________________
- **DevOps Lead**: _________________
- **CTO/Security Officer**: _________________

## Sign-off

Deployment completed by: _________________ Date: _________

Security review by: _________________ Date: _________

Final approval by: _________________ Date: _________

---

**Remember**: A secure JWT secret is critical to application security. Don't skip steps to save time—the cost of a security breach far exceeds the time spent on proper deployment.

## Next Steps

After deployment:
1. Monitor for 24 hours
2. Review authentication metrics
3. Schedule 90-day secret rotation
4. Conduct security review in 30 days
5. Update incident response procedures

For questions, refer to:
- `docs/JWT_SECRET_SETUP.md` - Comprehensive setup guide
- `src/config/jwt-secret-validator.ts` - Implementation details
- Security team for production incidents

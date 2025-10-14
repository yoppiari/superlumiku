# JWT Secret Setup Guide

## Overview

This guide explains how to properly configure JWT authentication secrets for the Lumiku application. JWT (JSON Web Token) secrets are used to cryptographically sign authentication tokens, making them one of the most critical security components of your application.

## Table of Contents

- [Why JWT Secret Security Matters](#why-jwt-secret-security-matters)
- [Quick Setup](#quick-setup)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Generating Secure Secrets](#generating-secure-secrets)
- [Security Requirements](#security-requirements)
- [Secret Rotation Strategy](#secret-rotation-strategy)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Why JWT Secret Security Matters

The JWT secret is used to sign authentication tokens that prove a user's identity. If this secret is compromised:

- **Account Hijacking**: Attackers can forge tokens for any user account
- **Complete Authentication Bypass**: All access controls become meaningless
- **Data Breach**: Attackers gain full access to user data and operations
- **Privilege Escalation**: Attackers can grant themselves admin privileges

This is a **P0 (Critical) security vulnerability** that can lead to complete system compromise.

---

## Quick Setup

### For Development

1. Generate a secure secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Create a `.env` file in the `backend/` directory:
   ```bash
   cp .env.example .env
   ```

3. Replace the JWT_SECRET value with your generated secret:
   ```env
   JWT_SECRET="your_generated_64_character_hex_string_here"
   ```

4. Start the server:
   ```bash
   bun run dev
   ```

### For Production

1. Generate a production-grade secret (minimum 32 bytes / 64 hex characters):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Set the environment variable in your deployment platform:

   **Vercel:**
   ```bash
   vercel env add JWT_SECRET production
   # Paste your generated secret when prompted
   ```

   **Railway:**
   ```bash
   # In Railway dashboard: Variables > New Variable
   # Name: JWT_SECRET
   # Value: your_generated_secret
   ```

   **AWS/Docker:**
   ```bash
   export JWT_SECRET="your_generated_secret"
   # Or add to your container/task environment variables
   ```

3. Set NODE_ENV to production:
   ```bash
   export NODE_ENV=production
   ```

4. Deploy your application

---

## Environment-Specific Configuration

### Production Environment

**Requirements:**
- JWT_SECRET **MUST** be set
- Minimum 32 characters
- Minimum entropy: 3.5 bits/character
- Cannot be a known weak/default value
- Application **WILL NOT START** if requirements not met

**Example Error (fails fast):**
```
CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set.
This is a P0 security vulnerability. Your application CANNOT start without a secure JWT secret.

To fix this:
1. Generate a secure secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
2. Set JWT_SECRET environment variable with the generated secret
3. Never commit this secret to version control

See docs/JWT_SECRET_SETUP.md for detailed instructions.
```

### Development Environment

**Behavior:**
- If JWT_SECRET not set: Auto-generates a temporary secure secret
- If JWT_SECRET is weak: Logs warnings but continues
- Secret validation checks are performed but not enforced

**Console Output:**
```
🔐 JWT Secret Configuration:
   Environment: development
   Source: Auto-Generated (Temporary)
   Length: 64 characters
   Entropy: 4.0 bits/char
   Status: ✅ SECURE

⚠️  Security Warnings:
   1. JWT_SECRET not set. Generated temporary secret for development environment.
   2. This secret will change on every restart. Set JWT_SECRET in .env for persistent sessions.

💡 Tip: Set JWT_SECRET in .env for persistent sessions across restarts.
```

**Recommendation:**
Even in development, set a JWT_SECRET in your `.env` file to maintain sessions across server restarts.

### Test Environment

**Behavior:**
- Similar to development
- Allows test-specific secrets
- Can use shorter secrets for test performance
- Auto-generation supported

---

## Generating Secure Secrets

### Method 1: Node.js (Recommended)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output example:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Method 2: OpenSSL (Unix/Linux/Mac)

```bash
openssl rand -hex 32
```

### Method 3: Online Generator (Use with Caution)

Only use reputable sources and **never** use online generators for production secrets:
- Generate locally when possible
- If using online, generate multiple and combine them
- Never trust the generated secret completely for production

### Method 4: Python

```python
import secrets
print(secrets.token_hex(32))
```

### What NOT to Do

❌ **DO NOT** use weak secrets like:
- `"secret"`
- `"change-this-secret-key"`
- `"12345678"`
- `"my-app-secret"`
- Keyboard mashing: `"asdfghjkl"`
- Dictionary words
- Personal information

---

## Security Requirements

### Validation Checks

The application performs these checks on startup:

1. **Presence Check**: Secret must be set (production only)
2. **Length Check**: Minimum length based on environment
3. **Entropy Check**: Minimum Shannon entropy to ensure randomness
4. **Blacklist Check**: Secret cannot be a known weak value
5. **Pattern Check**: Secret cannot match common weak patterns

### Minimum Requirements by Environment

| Environment | Min Length | Min Entropy | Enforcement | Auto-Generate |
|------------|-----------|-------------|-------------|---------------|
| Production | 32 chars  | 3.5 bits/char | Strict (fails) | No |
| Development | 16 chars | 3.5 bits/char | Warnings only | Yes |
| Test | 16 chars | 3.5 bits/char | Warnings only | Yes |

### Understanding Entropy

Shannon entropy measures the randomness/unpredictability of a string:

- **High Entropy (4.0+)**: Cryptographically random, unpredictable
  - Example: `a7f3e9d2c1b8f4a6e9d3c2b7f5a8e9d1`

- **Medium Entropy (3.0-4.0)**: Reasonably random
  - Example: `MyApp2024Secret!Key@Admin`

- **Low Entropy (<3.0)**: Predictable, weak
  - Example: `password123` or `aaaaaaaaaa`

---

## Secret Rotation Strategy

### Why Rotate Secrets?

Even secure secrets should be rotated periodically to:
- Limit the impact of potential compromise
- Meet compliance requirements (PCI-DSS, SOC2, etc.)
- Follow security best practices

Recommended rotation frequency: **Every 90 days** for production

### Future: Zero-Downtime Rotation

The application architecture supports future implementation of zero-downtime secret rotation:

#### Phase 1: Dual-Secret Validation (Future Feature)

1. Set `JWT_SECRET_PREVIOUS` to current secret
2. Set `JWT_SECRET` to new secret
3. Application accepts tokens signed with either secret
4. New tokens are signed with current secret only

```env
JWT_SECRET="new_secret_generated_today"
JWT_SECRET_PREVIOUS="old_secret_from_90_days_ago"
```

#### Phase 2: Transition Period

- Duration: Equal to longest JWT expiration (e.g., 7 days)
- Old tokens remain valid
- New tokens use new secret
- Monitor logs for tokens using old secret

#### Phase 3: Complete Rotation

After transition period:
1. Remove `JWT_SECRET_PREVIOUS`
2. All tokens now use new secret
3. Old tokens are expired naturally

### Manual Rotation (Current)

For immediate rotation (e.g., after compromise):

1. Generate a new secret
2. Update `JWT_SECRET` environment variable
3. Restart application
4. **All existing sessions will be invalidated**
5. Users must re-authenticate

---

## Troubleshooting

### Error: "JWT_SECRET is not set"

**Solution:**
1. Create a `.env` file in the `backend/` directory
2. Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Add to `.env`: `JWT_SECRET="your_generated_secret"`

### Error: "JWT_SECRET is too short"

**Solution:**
Your secret doesn't meet minimum length requirements.
- Production: Minimum 32 characters
- Development: Minimum 16 characters

Generate a new secret with sufficient length.

### Error: "JWT_SECRET is using a known weak value"

**Solution:**
Your secret matches a known weak/default value. Generate a new cryptographically random secret.

### Error: "JWT_SECRET has insufficient entropy"

**Solution:**
Your secret is too predictable. Use `crypto.randomBytes()` or `openssl` to generate a truly random secret.

### Warning: "Generated temporary secret for development"

**Solution:**
This is normal for development without a `.env` file. To persist sessions:
1. Generate a secret
2. Add to `.env` file
3. Restart server

### Sessions Invalidated After Deployment

**Cause:**
JWT_SECRET changed between deployments.

**Solution:**
Ensure JWT_SECRET is consistent across deployments:
- Use environment variables in deployment platform
- Don't regenerate on each deployment
- Document rotation schedule

---

## Security Best Practices

### 1. Secret Storage

✅ **DO:**
- Use environment variables
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Encrypt at rest in secret storage
- Use different secrets per environment
- Restrict access to secrets (least privilege)

❌ **DON'T:**
- Commit secrets to version control
- Hard-code secrets in source code
- Share secrets via email/Slack/etc.
- Use the same secret across environments
- Store secrets in plain text files

### 2. Secret Generation

✅ **DO:**
- Use cryptographically secure random generators
- Generate minimum 32 bytes (64 hex characters)
- Use Node.js `crypto.randomBytes()`
- Generate offline/locally

❌ **DON'T:**
- Use keyboard mashing
- Use dictionary words or names
- Use sequential or patterned characters
- Use online generators for production
- Reuse secrets from other applications

### 3. Secret Management

✅ **DO:**
- Rotate secrets every 90 days
- Audit secret access logs
- Have a rotation procedure documented
- Test rotation in staging first
- Monitor for unauthorized token generation

❌ **DON'T:**
- Share secrets between team members
- Log or display secrets
- Include secrets in error messages
- Use weak secrets "temporarily"
- Delay rotation after suspected compromise

### 4. Deployment

✅ **DO:**
- Use platform environment variables
- Validate secrets on application startup
- Fail fast if secrets are invalid
- Log secret metadata (not secret itself)
- Use CI/CD secret injection

❌ **DON'T:**
- Include secrets in Docker images
- Commit `.env` files
- Expose secrets in logs or errors
- Use default/example secrets
- Skip validation in production

### 5. Monitoring

✅ **DO:**
- Monitor for invalid token attempts
- Track token signature failures
- Alert on abnormal authentication patterns
- Log secret rotation events
- Regular security audits

❌ **DON'T:**
- Log actual token contents
- Log the JWT secret
- Ignore authentication failures
- Skip security reviews
- Assume secrets are secure forever

---

## Health Check Endpoint

The application provides a health check endpoint that returns JWT configuration status **without exposing the secret**:

```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "jwt": {
    "isConfigured": true,
    "isSecure": true,
    "source": "env",
    "environment": "production",
    "length": 64,
    "entropy": 4.0,
    "hasWarnings": false,
    "fingerprint": "a7f3e9d2"
  }
}
```

Use this for monitoring without exposing sensitive data.

---

## Compliance Requirements

### OWASP Recommendations

- **Key Length**: Minimum 256 bits (32 bytes) for HMAC-SHA256
- **Randomness**: Cryptographically secure random generation
- **Storage**: Encrypted at rest, never in version control
- **Rotation**: Regular rotation schedule
- **Access Control**: Strict access controls on secret storage

### PCI-DSS

If processing payment data:
- Key rotation every 90 days
- Encrypted storage
- Access logging
- Separation of duties

### SOC 2

- Documented secret management procedures
- Access control and monitoring
- Regular security reviews
- Incident response plan

---

## Emergency Response

### If JWT Secret is Compromised

1. **Immediate Actions** (within 1 hour):
   - Generate new secret immediately
   - Update production environment variable
   - Restart all application instances
   - All user sessions will be invalidated
   - Monitor for suspicious activity

2. **Investigation** (within 24 hours):
   - Determine how secret was compromised
   - Review access logs
   - Check for unauthorized token generation
   - Identify affected user accounts
   - Document timeline and impact

3. **Communication** (within 24-48 hours):
   - Notify affected users (if applicable)
   - Document incident for compliance
   - Update security procedures
   - Consider external security audit

4. **Prevention** (within 1 week):
   - Implement additional security controls
   - Rotate all other secrets
   - Review and update access controls
   - Conduct team security training
   - Update incident response procedures

---

## Additional Resources

- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [NIST Key Management Guidelines](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

---

## Support

If you have questions or need assistance:

1. Check this documentation first
2. Review the code comments in `backend/src/config/jwt-secret-validator.ts`
3. Check application startup logs for specific error messages
4. Contact your security team for production incidents

---

**Remember**: The JWT secret is the foundation of your application's security. Treat it with the same care as database passwords and API keys.

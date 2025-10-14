# JWT Secret - Quick Reference Card

**Keep this handy for daily development tasks**

---

## Generate a Secure Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64-character hex string).

---

## Local Development Setup

1. **Create `.env` file**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Add JWT secret**:
   ```env
   JWT_SECRET="paste-your-generated-secret-here"
   ```

3. **Start server**:
   ```bash
   bun run dev
   ```

4. **Verify** (look for this in logs):
   ```
   ✅ SECURE
   ```

---

## What Happens If...

### I don't set JWT_SECRET?

**Development**: Auto-generates temporary secret, shows warning
**Production**: Application fails to start with error

### I use a weak secret?

**Development**: Shows warning, continues
**Production**: Application fails to start

### I restart the server?

**With JWT_SECRET in .env**: Sessions persist
**Without JWT_SECRET**: New secret generated, all sessions invalidated

---

## Common Commands

### Generate secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Start with specific secret (testing)
```bash
JWT_SECRET="test-secret-at-least-32-chars-long-abc123def456" bun run dev
```

### Test production mode
```bash
NODE_ENV=production JWT_SECRET="your-secure-secret-here" bun run start
```

### Check if secret is set
```bash
echo $JWT_SECRET  # Unix/Mac
echo %JWT_SECRET%  # Windows CMD
```

---

## Minimum Requirements

| Environment | Min Length | Entropy | Enforcement |
|------------|-----------|---------|-------------|
| Production | 32 chars  | 3.5 bits/char | ❌ Fails |
| Development | 16 chars | 3.5 bits/char | ⚠️ Warns |
| Test | 16 chars | 3.5 bits/char | ⚠️ Warns |

---

## Error Messages

### "JWT_SECRET is not set"
**Fix**: Add JWT_SECRET to `.env` file

### "JWT_SECRET is too short"
**Fix**: Use minimum 32 characters for production, 16 for dev

### "JWT_SECRET is using a known weak value"
**Fix**: Don't use 'secret', 'password', '12345', etc. Generate random secret

### "JWT_SECRET has insufficient entropy"
**Fix**: Use crypto.randomBytes(), not keyboard mashing

---

## Quick Troubleshooting

### Can't login after deployment
**Cause**: JWT secret changed
**Fix**: Expected behavior. Users must re-authenticate

### Sessions don't persist across restarts
**Cause**: JWT_SECRET not in .env, auto-generating each time
**Fix**: Add JWT_SECRET to .env file

### Getting warnings in dev mode
**Cause**: Using weak secret or no secret
**Fix**: Optional - add strong secret to .env for persistent sessions

---

## Production Deployment Checklist

- [ ] Generate production secret
- [ ] Set JWT_SECRET environment variable (NOT in code!)
- [ ] Verify NODE_ENV=production
- [ ] Test in staging first
- [ ] Deploy
- [ ] Check logs for ✅ SECURE
- [ ] Test authentication

---

## Where to Find More Info

- **Full Setup**: `docs/JWT_SECRET_SETUP.md`
- **Security Details**: `docs/JWT_SECURITY_ANALYSIS.md`
- **Migration**: `docs/JWT_MIGRATION_GUIDE.md`
- **Deployment**: `docs/DEPLOYMENT_CHECKLIST_JWT.md`

---

## Security Rules (NEVER)

❌ NEVER commit JWT_SECRET to git
❌ NEVER hard-code in source files
❌ NEVER share via email/Slack
❌ NEVER use the same secret across environments
❌ NEVER log the actual secret value

---

## Security Rules (ALWAYS)

✅ ALWAYS use crypto.randomBytes() to generate
✅ ALWAYS use environment variables
✅ ALWAYS use minimum 32 characters for production
✅ ALWAYS use different secrets per environment
✅ ALWAYS rotate every 90 days in production

---

## Emergency: Secret Compromised

1. Generate new secret immediately
2. Update environment variable
3. Restart application
4. All users must re-authenticate
5. Contact security team
6. Review access logs

---

## Quick Examples

### Good Secrets ✅
```
a7f3e9d2c1b8f4a6e9d3c2b7f5a8e9d1c4b7a6e9d2f5a8e1c3b6a9d2e5f8a1b4
8f2e6b9a1c5d8e3f7a2b6c9d4e8f1a5b9c3d7e2f6a9b4c8d1e5f9a2b6c3d7e8
```

### Bad Secrets ❌
```
change-this-secret-key
secret123
password
myappsecret
asdfghjkl
```

---

## Platform-Specific Setup

### Vercel
```bash
vercel env add JWT_SECRET production
```

### Railway
Dashboard → Variables → Add `JWT_SECRET`

### Docker
```dockerfile
ENV JWT_SECRET="your-secret"
```

### Kubernetes
```bash
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET="your-secret"
```

---

## Development Tips

### Use .env file for persistent sessions
```env
# backend/.env
JWT_SECRET="dev-secret-at-least-32-chars-long-for-persistent-sessions-abc123"
```

### Add .env to .gitignore
```gitignore
# Already there, but verify:
.env
.env.local
.env.*.local
```

### Share .env.example, not .env
```bash
# Commit this:
git add .env.example

# NEVER commit this:
git add .env  # ❌ DON'T DO THIS
```

---

## Quick FAQ

**Q: Can I use the same secret for dev and prod?**
A: No. Different secrets for different environments.

**Q: What if I lose my production secret?**
A: Generate a new one. All users must re-authenticate.

**Q: How often should I rotate?**
A: Every 90 days for production.

**Q: Can I disable validation?**
A: No. Security is non-negotiable.

**Q: What's the minimum length?**
A: 32 characters for production, 16 for development.

---

**For detailed information, see `docs/JWT_README.md`**

**For emergencies, contact your security team**

---

Print this page and keep it near your desk!

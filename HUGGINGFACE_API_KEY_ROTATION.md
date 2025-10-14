# HuggingFace API Key Rotation Guide

**Date**: 2025-10-13
**Reason**: P0 Security Issue - API key exposed in git history
**Exposed Key**: `hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (redacted)

---

## 🚨 IMMEDIATE ACTION: Revoke Old Key

### Step 1: Revoke the Exposed Key

1. **Go to HuggingFace Token Settings**:
   ```
   https://huggingface.co/settings/tokens
   ```

2. **Find the exposed token**:
   - Look for token starting with: `hf_AjbeTNQjgTPlnzYezsSbyXe...`
   - Or any token used for Lumiku production

3. **Revoke the token**:
   - Click the **"Delete"** or **"Revoke"** button
   - Confirm deletion

4. **Verify revocation** (test that old key no longer works):
   ```bash
   curl https://api-inference.huggingface.co/models/lllyasviel/control_v11p_sd15_openpose \
     -H "Authorization: Bearer YOUR_OLD_KEY_HERE" \
     -d '{"inputs":"test"}'

   # Expected response: 401 Unauthorized or authentication error
   ```

---

## ✅ STEP 2: Generate New API Key

### Create New Token

1. **Go to HuggingFace Token Settings**:
   ```
   https://huggingface.co/settings/tokens
   ```

2. **Click "New token"**

3. **Configure the token**:
   - **Name**: `lumiku-production-2025-10-13`
   - **Type**: **Read** (we only need inference access)
   - **Scope**: Leave default (or select "Make calls to the serverless Inference API")

4. **Click "Generate"**

5. **COPY THE TOKEN IMMEDIATELY**:
   - Format: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - You can only see it once!
   - It should look like: `hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGh`

6. **Save it temporarily** (we'll use it in the next step)

---

## 📝 STEP 3: Update Environment Variables

### Option A: Via Coolify Dashboard (Recommended)

1. **Go to Coolify Dashboard**:
   ```
   https://cf.avolut.com
   ```

2. **Navigate to your application**:
   - Find: **Lumiku Backend** or **Lumiku App**
   - Click to open application details

3. **Go to Environment Variables**:
   - Look for the **"Environment Variables"** tab or section
   - Find `HUGGINGFACE_API_KEY`

4. **Update the value**:
   - Click **Edit** or **Modify**
   - Replace old value with: `hf_[YOUR_NEW_TOKEN_HERE]`
   - Click **Save**

5. **Redeploy the application**:
   - Click **"Deploy"** or **"Restart"**
   - Wait for deployment to complete (watch logs)

### Option B: Via Coolify API

If you have Coolify API access, you can use curl:

```bash
# Set your Coolify API token
COOLIFY_TOKEN="your-coolify-api-token"
APP_UUID="d8ggwoo484k8ok48g8k8cgwk"  # Your Lumiku backend UUID

# Update environment variable
curl -X PATCH "https://cf.avolut.com/api/v1/applications/${APP_UUID}/envs" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "HUGGINGFACE_API_KEY": "hf_YOUR_NEW_TOKEN_HERE"
  }'

# Trigger redeployment
curl -X POST "https://cf.avolut.com/api/v1/deploy?uuid=${APP_UUID}&force=true" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}"
```

### Option C: Update Local Development Environment

1. **Edit `backend/.env`**:
   ```bash
   # Open the file
   notepad backend/.env

   # Or use your preferred editor
   code backend/.env
   ```

2. **Find and update the line**:
   ```env
   # Old (already replaced with placeholder)
   HUGGINGFACE_API_KEY="your-huggingface-api-key-here"

   # New
   HUGGINGFACE_API_KEY="hf_YOUR_NEW_TOKEN_HERE"
   ```

3. **Save the file**

4. **Restart the development server**:
   ```bash
   cd backend
   bun run dev
   ```

---

## 🧪 STEP 4: Test the New API Key

### Test 1: Check API Key Works

```bash
# Test with HuggingFace inference API
curl https://api-inference.huggingface.co/models/lllyasviel/control_v11p_sd15_openpose \
  -H "Authorization: Bearer hf_YOUR_NEW_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"inputs":"test"}'

# Expected: Should return a response (not 401)
```

### Test 2: Test Avatar Generator in Lumiku

1. **Log in to Lumiku**:
   ```
   https://dev.lumiku.com
   ```

2. **Navigate to Avatar Generator**:
   - Go to Apps → Avatar Generator
   - Or: https://dev.lumiku.com/apps/avatar-generator

3. **Try generating an avatar**:
   - Upload a pose image or use sample
   - Click "Generate Avatar"
   - Wait for result

4. **Verify**:
   - ✅ Avatar generation works
   - ✅ No API authentication errors in logs
   - ✅ No 401/403 errors

### Test 3: Check Backend Logs

```bash
# Via Coolify dashboard
# Go to Application → Logs
# Look for:
# ✅ "Avatar generation started"
# ✅ "HuggingFace API call successful"
# ❌ NO "401 Unauthorized" errors
# ❌ NO "Invalid API key" errors
```

---

## ✅ VERIFICATION CHECKLIST

After completing all steps:

- [ ] Old HuggingFace API key revoked (returns 401)
- [ ] New HuggingFace API key generated
- [ ] New key saved securely (password manager or secure note)
- [ ] Coolify environment variable updated with new key
- [ ] Application redeployed successfully
- [ ] Application starts without errors (check logs)
- [ ] New API key tested with curl (works)
- [ ] Avatar Generator tested in UI (works)
- [ ] No authentication errors in logs
- [ ] Local `backend/.env` updated (if applicable)
- [ ] Old key value removed from all locations

---

## 📋 POST-ROTATION TASKS

### 1. Update Team Documentation

If your team has internal docs about HuggingFace setup:
- Update with new token name: `lumiku-production-2025-10-13`
- Document rotation date: 2025-10-13
- Note: Previous token was compromised and revoked

### 2. Set Rotation Reminder

HuggingFace tokens don't expire, but it's good practice to rotate:
- **Recommended**: Every 90 days (quarterly)
- **Set calendar reminder**: 2026-01-13 (3 months from now)
- **Process**: Repeat this guide

### 3. Monitor Usage

Check HuggingFace usage to detect any anomalies:
- Go to: https://huggingface.co/settings/billing
- Monitor API calls and credits
- Set up alerts for unusual activity (if available)

### 4. Security Audit

- [ ] Verify no other secrets exposed in git history
- [ ] Run: `git log -p | grep -i "api.key\|secret\|password"`
- [ ] Consider using `gitleaks` or `git-secrets` tool
- [ ] Implement pre-commit hooks to prevent future exposures

---

## 🔒 SECURITY BEST PRACTICES

### For HuggingFace API Keys:

1. **Never commit to git**:
   - Always use environment variables
   - Ensure `.env` is in `.gitignore`
   - Double-check before committing

2. **Use read-only tokens**:
   - Inference API only needs "Read" permission
   - Don't use tokens with write/delete permissions

3. **Rotate regularly**:
   - Every 90 days minimum
   - Immediately if exposed
   - After team member departures

4. **Monitor usage**:
   - Check billing dashboard regularly
   - Set up usage alerts
   - Review API call logs

5. **Limit token scope**:
   - Only grant necessary permissions
   - Use separate tokens for dev/staging/production
   - Revoke unused tokens

### For Environment Variables:

1. **Use secrets management**:
   - Coolify's built-in secrets (recommended)
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

2. **Never log secrets**:
   - Don't log environment variables
   - Sanitize logs before sharing
   - Use log redaction for sensitive values

3. **Separate environments**:
   - Different secrets for dev/staging/production
   - Never use production secrets in development
   - Test with dummy/sandbox keys when possible

---

## 🆘 TROUBLESHOOTING

### Issue: "401 Unauthorized" after rotation

**Possible causes**:
- New key not saved correctly (typo, extra spaces)
- Environment variable not loaded (need restart)
- Cache issue (clear application cache)

**Solutions**:
```bash
# 1. Verify the key is correct (no typos)
echo $HUGGINGFACE_API_KEY

# 2. Test the key directly
curl https://api-inference.huggingface.co/models/bert-base-uncased \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY"

# 3. Restart the application
# Via Coolify: Click "Restart"
# Via local: bun run dev (restart server)

# 4. Check environment variables are loaded
cd backend
bun --eval "console.log('HF Key:', process.env.HUGGINGFACE_API_KEY?.substring(0, 10) + '...')"
```

### Issue: Avatar generation still fails

**Check**:
1. New key has "Read" permission
2. Key is for the correct HuggingFace account
3. Account has access to required models
4. No rate limits hit (check HuggingFace dashboard)

### Issue: Old key still works after revocation

**Actions**:
1. Refresh HuggingFace tokens page
2. Verify you revoked the correct token
3. Try revoking again
4. Contact HuggingFace support if persistent

---

## 📞 SUPPORT

- **HuggingFace Support**: https://huggingface.co/support
- **HuggingFace Docs**: https://huggingface.co/docs/api-inference
- **Coolify Support**: https://coolify.io/docs

---

## 📝 INCIDENT LOG

| Date | Action | Status | Notes |
|------|--------|--------|-------|
| 2025-10-13 | Security audit | ✅ Complete | Discovered exposed key in git |
| 2025-10-13 | Code cleanup | ✅ Complete | Removed key from backend/.env |
| 2025-10-13 | Documentation | ✅ Complete | Created rotation guide |
| **PENDING** | **Revoke old key** | ⏳ Pending | **You must do this** |
| **PENDING** | **Generate new key** | ⏳ Pending | **You must do this** |
| **PENDING** | **Update Coolify** | ⏳ Pending | **You must do this** |
| **PENDING** | **Test & verify** | ⏳ Pending | **You must do this** |

---

**🔴 DO NOT DEPLOY TO PRODUCTION UNTIL KEY ROTATION IS COMPLETE** 🔴

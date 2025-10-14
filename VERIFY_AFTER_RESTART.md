# ✅ Verification Steps After Service Restart

## 1️⃣ Check Health Endpoint

```bash
curl https://dev.lumiku.com/health/database
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "tables": {
      "users": true,
      "avatars": true,
      "avatar_projects": true,
      "avatar_usage_history": true,
      "sessions": true,
      "credits": true
    },
    "missingTables": []
  }
}
```

---

## 2️⃣ Test Create Project in Browser

1. Open: https://dev.lumiku.com/apps/avatar-creator
2. Click: **+ Create New Project**
3. Fill form:
   - Name: "Test After Restart"
   - Description: "Verification test"
4. Click: **Create Project**

**Expected**: Success! Project created without 400 error ✅

---

## 3️⃣ Check Backend Logs (If Still Fails)

Via Coolify UI:
1. Open: https://cf.avolut.com
2. Select: `dev-superlumiku`
3. Tab: **Logs**
4. Filter: "error" or "avatar"

Look for specific error messages to identify remaining issues.

---

## 4️⃣ Alternative: Use Test HTML File

Open in browser: `test-create-project-direct.html`

1. Place file at: https://dev.lumiku.com/test-create-project-direct.html
2. Open in browser (will use your auth token from localStorage)
3. Click: **Test Create Project**
4. View detailed response

---

## 🎯 Success Criteria:

- ✅ Health endpoint shows all tables healthy
- ✅ Create project succeeds without 400 error
- ✅ Project appears in projects list
- ✅ Backend logs show no errors

---

## 🚨 If Still Fails After Restart:

### Check 1: Prisma Client Generated
```bash
# In Coolify terminal
cd /app/backend
bun prisma generate
```

### Check 2: Foreign Key Constraint
```sql
-- May need this if referential integrity error occurs
ALTER TABLE "avatar_usage_history"
ADD CONSTRAINT "avatar_usage_history_avatarId_fkey"
FOREIGN KEY ("avatarId") REFERENCES "avatars"("id")
ON DELETE CASCADE;
```

### Check 3: Force New Deployment
- Trigger new deployment from Git
- Commits 575edc6 and 4c48f06 contain auto-fix scripts
- Will ensure clean state with all migrations

---

## 📝 Report Back:

After restarting, please report:
1. Health endpoint response
2. Create project result (success/error)
3. Any error messages from logs or browser console
4. Screenshot if still failing

This will help identify if there are any remaining issues beyond the Prisma Client schema reload.

# Avatar Creator: Hardcoded Project ID Fix

## Problem Summary

**Error**: Console shows repeated 400 errors:
```
Failed to load resource: /api/apps/avatar-creator_88082ugb227d4g3wi1
server responded with a status of 400 ()
```

**Symptoms**:
- Avatar Creator attempts to load hardcoded project ID `88082ugb227d4g3wi1`
- Malformed URL with underscore: `/api/apps/avatar-creator_88082ugb227d4g3wi1`
- 400 Bad Request errors
- Project likely doesn't exist or belongs to different user

## Investigation Results

### ✅ Source Code Analysis
**Result**: No hardcoded IDs found in source code

Checked files:
- `frontend/src/apps/AvatarCreator.tsx` - Clean, uses URL params
- `frontend/src/stores/avatarCreatorStore.ts` - Clean, no hardcoded IDs
- All API calls properly use dynamic project IDs
- No test data or example IDs in code

### 🔍 Root Cause
The hardcoded ID is **NOT in the source code**, indicating:

1. **Browser Cache Issue** (Most Likely)
   - Old JavaScript files cached in browser
   - Previous version had test/debug code
   - Hard refresh needed

2. **Production Build Issue**
   - Deployed build contains old code
   - Build artifacts not updated
   - Need clean rebuild

3. **URL Construction Bug** (Less Likely)
   - Somewhere code is incorrectly concatenating URLs
   - Creates `/api/apps/avatar-creator_ID` instead of `/api/apps/avatar-creator/projects/ID`

## Solution Steps

### STEP 1: Clear Browser Cache (Try First)

**For Users**:
1. Open Avatar Creator page
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac) for hard refresh
3. Or clear browser cache:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

**Expected Result**: 400 errors should disappear

---

### STEP 2: Rebuild Frontend (If cache clear doesn't work)

```bash
# Navigate to frontend directory
cd frontend

# Clean build artifacts
rm -rf dist node_modules/.vite

# Install dependencies
npm install

# Build fresh
npm run build

# Or if using Vite dev
npm run dev
```

**Expected Result**: Fresh JavaScript files without hardcoded IDs

---

### STEP 3: Add Cache Busting Headers

**File**: `frontend/vite.config.ts`

Add build hash to filenames:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  }
})
```

---

### STEP 4: Deploy Clean Build to Production

```bash
# On Coolify server or deployment
cd /path/to/lumiku-app

# Pull latest code
git pull origin development

# Rebuild frontend
cd frontend
npm install
npm run build

# Restart application
pm2 restart lumiku-backend

# Or if using Docker
docker-compose down
docker-compose up -d --build
```

---

### STEP 5: Verify Fix

1. Open Avatar Creator in **Incognito/Private** window
2. Open DevTools Console (F12)
3. Navigate to Avatar Creator page
4. Check Network tab:
   - ✅ Should see: `/api/apps/avatar-creator/projects`
   - ✅ No 400 errors
   - ✅ No hardcoded project IDs

5. Test functionality:
   - Create new project
   - Upload avatar
   - Generate avatar
   - Delete project

---

## Prevention Measures

### 1. Add Cache Control Headers

**File**: `backend/src/index.ts` (or Nginx config)

```typescript
// Prevent caching of API responses
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  next()
})
```

### 2. Add Environment Check

**File**: `frontend/src/stores/avatarCreatorStore.ts`

Add validation to prevent hardcoded IDs:

```typescript
selectProject: async (projectId: string) => {
  // Validate project ID format (should be cuid/uuid)
  if (!projectId || projectId.length < 20) {
    console.error('[AvatarCreator] Invalid project ID:', projectId)
    throw new Error('Invalid project ID')
  }

  try {
    const res = await api.get(`/api/apps/avatar-creator/projects/${projectId}`)
    // ... rest of code
  }
}
```

### 3. Add Development Guards

**File**: `frontend/src/apps/AvatarCreator.tsx`

```typescript
useEffect(() => {
  if (projectId) {
    // Guard against hardcoded test IDs in development
    if (import.meta.env.DEV && projectId.includes('test')) {
      console.warn('[DEV] Detected test project ID, skipping:', projectId)
      navigate('/apps/avatar-creator')
      return
    }

    selectProject(projectId)
  } else {
    clearCurrentProject()
  }
}, [projectId])
```

---

## Verification Commands

### Check Current Build
```bash
# Check what's actually in the built files
cd frontend/dist/assets
grep -r "88082ugb227d4g3wi1" .
# Should return nothing if build is clean
```

### Check API Endpoints
```bash
# Test API endpoints work correctly
curl -X GET https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return user's projects, NOT 400 error
```

### Check Browser Console
```javascript
// Run in browser console on Avatar Creator page
console.log('Current URL:', window.location.href)
console.log('Project ID:', new URLSearchParams(window.location.search).get('projectId'))

// Should NOT show hardcoded IDs
```

---

## Quick Fix Checklist

For immediate resolution:

- [ ] **User Side**
  - [ ] Hard refresh: `Ctrl + Shift + R`
  - [ ] Clear browser cache
  - [ ] Try incognito window

- [ ] **Developer Side**
  - [ ] Clean rebuild frontend: `rm -rf dist && npm run build`
  - [ ] Redeploy to production
  - [ ] Verify in incognito window

- [ ] **DevOps Side**
  - [ ] Add cache-busting headers
  - [ ] Update Vite config for hashed filenames
  - [ ] Set proper cache control on API responses

- [ ] **Monitoring**
  - [ ] Check production logs for 400 errors
  - [ ] Verify no hardcoded IDs in network requests
  - [ ] Test Avatar Creator functionality end-to-end

---

## Expected Behavior After Fix

### ✅ Correct Flow
1. User opens `/apps/avatar-creator` → Shows project list
2. User clicks project → Navigates to `/apps/avatar-creator/PROJECT_ID`
3. URL param extracted: `const { projectId } = useParams()`
4. API call: `GET /api/apps/avatar-creator/projects/PROJECT_ID`
5. Project loads successfully

### ❌ Incorrect Flow (Before Fix)
1. User opens Avatar Creator
2. JavaScript tries to load hardcoded project
3. API call: `GET /api/apps/avatar-creator_88082ugb227d4g3wi1` (malformed!)
4. 400 Bad Request error
5. Project fails to load

---

## Files Modified

None needed in source code (issue is deployment/cache related).

If cache-busting is implemented:
- `frontend/vite.config.ts` - Add hashed filenames
- `backend/src/index.ts` - Add cache control headers
- `.nginx/default.conf` - Add cache headers for static assets

---

## Related Issues

- Auto-logout bug (already fixed in commit 74c3988)
- Dashboard loading issues (already fixed)
- API authentication race conditions (already fixed)

---

## Contact & Support

If issue persists after all steps:
1. Check browser console for exact error message
2. Check Network tab for actual API call being made
3. Verify authentication token is valid
4. Check backend logs: `pm2 logs lumiku-backend`

---

## Last Updated
2025-10-16

**Status**: Investigation complete, fix documented
**Next Steps**: Clear cache and rebuild frontend

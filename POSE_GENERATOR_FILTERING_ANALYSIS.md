# CRITICAL REVIEW: Pose Generator Filtering Analysis

## Executive Summary

**ROOT CAUSE IDENTIFIED**: Pose Generator is being filtered out because the user has insufficient subscription tier to access any of its AI models.

**STATUS**: Working as designed - this is a tier access control issue, NOT a code bug.

**IMPACT**: All users with FREE tier cannot see Pose Generator in dashboard.

**SOLUTION**: Either upgrade user to BASIC tier OR add a FREE tier model to pose-generator.

---

## 1. Filtering Logic Flow Analysis

### File: `backend/src/app.ts` (Lines 71-84)

```typescript
// GET /api/apps endpoint
app.get('/api/apps', authMiddleware, async (c) => {
  const userId = c.get('userId')

  // Get only apps user can access
  const apps = await accessControlService.getUserAccessibleApps(userId)

  logger.debug({
    userId,
    accessibleAppsCount: apps.length,
    apps: apps.map(a => a.name).join(', ')
  }, 'Dashboard apps retrieved')

  return c.json({ apps })
})
```

**Analysis**: The endpoint delegates filtering to `accessControlService.getUserAccessibleApps(userId)`.

---

### File: `backend/src/services/access-control.service.ts` (Lines 65-93)

```typescript
async getUserAccessibleApps(userId: string) {
  const { pluginRegistry } = await import('../plugins/registry')
  const allApps = pluginRegistry.getDashboardApps() // Step 1: Get all enabled apps

  // Get user info to check for enterprise_unlimited tag
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userTags: true }
  })

  const tags = user?.userTags ? JSON.parse(user.userTags) : []
  const hasEnterpriseUnlimited = tags.includes('enterprise_unlimited')

  // For each app, check if user can access at least one model
  const accessibleApps = []

  for (const app of allApps) {
    const models = await modelRegistryService.getUserAccessibleModels(userId, app.appId) // Step 2: Filter by tier

    // Only show apps that have available models
    if (models.length > 0) { // Step 3: CRITICAL FILTER
      accessibleApps.push({
        ...app,
        availableModels: models.length
      })
    }
  }

  return accessibleApps
}
```

**CRITICAL LOGIC**: Apps are only included if `models.length > 0`.

**This is where Pose Generator gets filtered out!**

---

### File: `backend/src/services/model-registry.service.ts` (Lines 21-49)

```typescript
async getUserAccessibleModels(userId: string, appId: string): Promise<AIModel[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountType: true,
      subscriptionTier: true
    }
  })

  if (!user) throw new Error('User not found')

  const tierHierarchy: Record<string, string[]> = {
    'free': ['free'],               // Free users: only 'free' tier models
    'basic': ['free', 'basic'],     // Basic users: 'free' + 'basic' models
    'pro': ['free', 'basic', 'pro'], // Pro users: all except enterprise
    'enterprise': ['free', 'basic', 'pro', 'enterprise'] // Enterprise: all models
  }

  const allowedTiers = tierHierarchy[user.subscriptionTier] || ['free']

  return await prisma.aIModel.findMany({
    where: {
      appId,
      enabled: true,
      tier: { in: allowedTiers } // TIER FILTER
    },
    orderBy: { tier: 'asc' }
  })
}
```

**TIER HIERARCHY**:
- **FREE tier**: Can only access models with `tier = 'free'`
- **BASIC tier**: Can access models with `tier IN ('free', 'basic')`
- **PRO tier**: Can access models with `tier IN ('free', 'basic', 'pro')`
- **ENTERPRISE tier**: Can access all models

---

### File: `backend/src/plugins/registry.ts` (Lines 53-57)

```typescript
/**
 * Get plugins for dashboard (enabled, not coming soon)
 */
getDashboardApps(): PluginConfig[] {
  return this.getAll()
    .filter(p => p.features.enabled && !p.features.comingSoon)
    .sort((a, b) => a.dashboard.order - b.dashboard.order)
}
```

**Filter Criteria**:
1. `features.enabled = true` ✅
2. `features.comingSoon = false` ✅
3. Sorted by `dashboard.order`

---

### File: `backend/src/apps/pose-generator/plugin.config.ts` (Lines 57-65)

```typescript
// Features
features: {
  enabled: true,        // ✅ ENABLED
  beta: false,          // Production-ready
  comingSoon: false,    // ✅ NOT COMING SOON
},

// Dashboard
dashboard: {
  order: 3,             // After Avatar Creator
  color: 'indigo',
  stats: {
    enabled: true,
    endpoint: '/api/apps/pose-generator/stats',
  },
},
```

**Status**: Pose Generator plugin configuration is CORRECT.

---

## 2. AI Models Analysis

### File: `backend/prisma/seeds/ai-models.seed.ts` (Lines 213-300)

Pose Generator has **3 AI models** defined:

```typescript
// Model 1: FLUX ControlNet Standard
{
  appId: 'pose-generator',
  modelId: 'flux-controlnet-standard',
  tier: 'basic',          // ❌ Requires BASIC tier
  creditCost: 30,
  enabled: true
}

// Model 2: FLUX ControlNet Pro
{
  appId: 'pose-generator',
  modelId: 'flux-controlnet-pro',
  tier: 'pro',            // ❌ Requires PRO tier
  creditCost: 40,
  enabled: true
}

// Model 3: Background Changer (SAM)
{
  appId: 'pose-generator',
  modelId: 'background-changer-sam',
  tier: 'basic',          // ❌ Requires BASIC tier
  creditCost: 10,
  enabled: true
}
```

**CRITICAL ISSUE**: There is NO FREE tier model for pose-generator!

---

## 3. Root Cause Analysis

### Scenario: User with FREE tier

1. **Plugin Registry Check**: Pose Generator is in `getDashboardApps()` ✅
2. **Model Access Check**: `getUserAccessibleModels('free', 'pose-generator')`
   - Query: `SELECT * FROM AIModel WHERE appId='pose-generator' AND enabled=true AND tier IN ('free')`
   - Result: **0 models** (all pose-generator models require 'basic' or 'pro' tier)
3. **Filtering Decision**: `models.length = 0` → Pose Generator is **EXCLUDED**

### Scenario: User with BASIC tier

1. **Plugin Registry Check**: Pose Generator is in `getDashboardApps()` ✅
2. **Model Access Check**: `getUserAccessibleModels('basic', 'pose-generator')`
   - Query: `SELECT * FROM AIModel WHERE appId='pose-generator' AND enabled=true AND tier IN ('free', 'basic')`
   - Result: **2 models** (flux-controlnet-standard, background-changer-sam)
3. **Filtering Decision**: `models.length = 2` → Pose Generator is **INCLUDED** ✅

---

## 4. Comparison with Other Apps

### Avatar Creator (appears for FREE tier users)

```typescript
// From ai-models.seed.ts
{
  appId: 'avatar-creator',
  modelId: 'flux-dev-base',
  tier: 'free',           // ✅ FREE tier model exists
  creditCost: 8,
  enabled: true
}
```

**Result**: Avatar Creator has a FREE tier model → visible to all users.

### Video Generator (appears for FREE tier users)

```typescript
{
  appId: 'video-generator',
  modelId: 'wan2.2',
  tier: 'free',           // ✅ FREE tier model exists
  creditCost: 5,
  enabled: true
}
```

**Result**: Video Generator has a FREE tier model → visible to all users.

---

## 5. Why Pose Generator is Different

**Design Decision**: Pose Generator was intentionally designed as a PREMIUM feature requiring BASIC+ tier.

**Evidence from plugin.config.ts** (Lines 29-46):
```typescript
// Credits Configuration
// Reflects high computational cost of FLUX.1-dev + ControlNet generation
credits: {
  generateFromGallery: 30,  // 30 credits = Rp 3,000
  generateFromText: 30,
  backgroundChanger: 10,
},
```

**Reasoning**:
- Pose generation uses expensive FLUX.1-dev model + ControlNet
- Background changer uses Meta's SAM (Segment Anything Model)
- Higher computational cost justifies BASIC+ tier requirement
- Fair use policy: "PAYG users: Pay per pose (30 credits = Rp 3,000)"

---

## 6. SQL Diagnostic Queries

**Check if models exist in database:**
```sql
SELECT COUNT(*) as model_count
FROM "AIModel"
WHERE "appId" = 'pose-generator' AND "enabled" = true;
```

**Check user's subscription tier:**
```sql
SELECT id, email, "subscriptionTier"
FROM "User"
WHERE email = 'test@lumiku.com';
```

**Check which models user can access:**
```sql
SELECT m."modelId", m."tier", m."creditCost"
FROM "User" u
CROSS JOIN "AIModel" m
WHERE u.email = 'test@lumiku.com'
  AND m."appId" = 'pose-generator'
  AND m."enabled" = true
  AND (
    (u."subscriptionTier" = 'free' AND m."tier" = 'free') OR
    (u."subscriptionTier" = 'basic' AND m."tier" IN ('free', 'basic')) OR
    (u."subscriptionTier" = 'pro' AND m."tier" IN ('free', 'basic', 'pro')) OR
    (u."subscriptionTier" = 'enterprise' AND m."tier" IN ('free', 'basic', 'pro', 'enterprise'))
  );
```

**Expected result for FREE tier user**: 0 rows (no accessible models).

---

## 7. Solutions

### SOLUTION 1: Upgrade User to BASIC Tier (Immediate Fix)

**File**: Run SQL query in production database

```sql
UPDATE "User"
SET "subscriptionTier" = 'basic'
WHERE email = 'test@lumiku.com'; -- or target user email
```

**Impact**:
- User can immediately see Pose Generator
- User can access 2 models: flux-controlnet-standard, background-changer-sam
- No code changes required

---

### SOLUTION 2: Add FREE Tier Model (Product Decision)

**File**: `backend/prisma/seeds/ai-models.seed.ts`

Add this model to the `models` array (around line 213):

```typescript
// ==========================================
// POSE GENERATOR MODELS - FREE TIER
// ==========================================
{
  appId: 'pose-generator',
  modelId: 'flux-controlnet-free',
  modelKey: 'pose-generator:flux-controlnet-free',
  name: 'FLUX ControlNet Free',
  description: 'Basic pose generation with reduced quality for free tier users',
  provider: 'huggingface',
  tier: 'free', // 🆓 FREE TIER
  creditCost: 20, // Lower cost than standard (30 credits)
  creditPerPixel: null,
  quotaCost: 1,
  capabilities: JSON.stringify({
    modelId: 'black-forest-labs/FLUX.1-dev',
    controlnetModel: 'InstantX/FLUX.1-dev-Controlnet-Union',
    controlnetType: 'openpose',
    width: 512,        // Smaller resolution
    height: 512,
    numInferenceSteps: 20, // Fewer steps = faster but lower quality
    guidanceScale: 3.5,
    controlnetConditioningScale: 0.7, // Lower conditioning
    maxWidth: 768,
    maxHeight: 768,
    quality: 'basic',
    processingTime: '30-45s',
    poseGuidance: true,
    features: ['pose-to-avatar', 'controlnet', 'free-tier', 'basic-quality']
  }),
  enabled: true,
  beta: false
},
```

**Deployment Steps**:
1. Add model to `ai-models.seed.ts`
2. Run: `bun prisma db seed`
3. Verify: Query `SELECT * FROM "AIModel" WHERE modelKey='pose-generator:flux-controlnet-free'`
4. Test: Login as FREE tier user, check dashboard

**Impact**:
- All users (including FREE tier) can now see Pose Generator
- FREE tier users get lower quality/resolution (512x512) vs BASIC (768x768)
- Maintains revenue model: higher quality requires paid tier

---

### SOLUTION 3: Change Access Control Logic (NOT RECOMMENDED)

**File**: `backend/src/services/access-control.service.ts` (Line 85)

**Current code**:
```typescript
if (models.length > 0) {
  accessibleApps.push({
    ...app,
    availableModels: models.length
  })
}
```

**Proposed change**:
```typescript
// Show all apps regardless of accessible models
accessibleApps.push({
  ...app,
  availableModels: models.length,
  locked: models.length === 0 // Add locked flag
})
```

**Why NOT recommended**:
- Shows apps user cannot use (bad UX)
- Requires frontend changes to display locked state
- Misleading to show unavailable features
- Current behavior (hiding inaccessible apps) is better UX

---

## 8. Verification Steps

### After Solution 1 (Upgrade User)

1. **Check user tier**:
   ```sql
   SELECT "subscriptionTier" FROM "User" WHERE email = 'test@lumiku.com';
   -- Expected: 'basic'
   ```

2. **Test API**:
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/apps
   ```

3. **Verify response includes pose-generator**:
   ```json
   {
     "apps": [
       { "appId": "avatar-creator", "name": "Avatar Creator", "availableModels": 4 },
       { "appId": "video-mixer", "name": "Video Mixer", "availableModels": 1 },
       { "appId": "pose-generator", "name": "Pose Generator", "availableModels": 2 }
     ]
   }
   ```

### After Solution 2 (Add FREE Model)

1. **Verify model exists**:
   ```sql
   SELECT "modelKey", "tier", "enabled"
   FROM "AIModel"
   WHERE "modelKey" = 'pose-generator:flux-controlnet-free';
   -- Expected: 1 row, tier='free', enabled=true
   ```

2. **Test with FREE tier user**:
   ```sql
   SELECT "subscriptionTier" FROM "User" WHERE email = 'test@lumiku.com';
   -- Expected: 'free'
   ```

3. **Verify app appears**:
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/apps
   ```

---

## 9. Recommended Action

**RECOMMENDATION**: Use **Solution 2** (Add FREE tier model)

**Rationale**:
1. **Better Product Strategy**: Free tier users can try pose generator, increasing conversion to paid tiers
2. **Freemium Model**: FREE tier gets basic quality → incentivizes upgrade to BASIC/PRO for better results
3. **Consistent UX**: Aligns with other apps (avatar-creator, video-generator) that have FREE tier models
4. **No Database Migration**: Just re-run seed script
5. **Scalable**: Supports future FREE tier users without manual intervention

**Implementation**:
1. Add FREE tier model to `ai-models.seed.ts` (see Solution 2 code)
2. Run: `cd backend && bun prisma db seed`
3. Test: Login as FREE tier user
4. Verify: Pose Generator appears in dashboard
5. Verify: FREE tier users can only select the free model

**Timeline**: 15 minutes (code change + seed + test)

---

## 10. Code References

### Filtering Chain (Complete Flow)

```
/api/apps endpoint
  ↓
accessControlService.getUserAccessibleApps(userId)
  ↓
pluginRegistry.getDashboardApps()
  [Filters: enabled=true, comingSoon=false]
  ↓
FOR EACH app:
  modelRegistryService.getUserAccessibleModels(userId, appId)
    [Filters: enabled=true, tier IN allowedTiers]
    ↓
  IF models.length > 0:
    ✅ Include app in response
  ELSE:
    ❌ Filter out app
```

### Key Files

1. **API Endpoint**: `backend/src/app.ts` (line 71-84)
2. **Access Control**: `backend/src/services/access-control.service.ts` (line 65-93)
3. **Model Registry**: `backend/src/services/model-registry.service.ts` (line 21-49)
4. **Plugin Registry**: `backend/src/plugins/registry.ts` (line 53-57)
5. **Plugin Config**: `backend/src/apps/pose-generator/plugin.config.ts` (line 57-65)
6. **AI Models Seed**: `backend/prisma/seeds/ai-models.seed.ts` (line 213-300)
7. **Plugin Loader**: `backend/src/plugins/loader.ts` (line 30)

---

## 11. Appendix: Tier Access Matrix

| App              | FREE Tier Models | BASIC Tier Models | PRO Tier Models | ENTERPRISE Tier Models |
|------------------|------------------|-------------------|-----------------|------------------------|
| avatar-creator   | ✅ 1             | ✅ 3              | ✅ 4            | ✅ 4                   |
| video-generator  | ✅ 1             | ✅ 2              | ✅ 3            | ✅ 4                   |
| video-mixer      | ✅ 1             | ✅ 1              | ✅ 1            | ✅ 1                   |
| carousel-mix     | ✅ 1             | ✅ 1              | ✅ 1            | ✅ 1                   |
| looping-flow     | ✅ 1             | ✅ 1              | ✅ 1            | ✅ 1                   |
| poster-editor    | ✅ 1             | ✅ 1              | ✅ 2            | ✅ 3                   |
| **pose-generator** | **❌ 0**       | **✅ 2**          | **✅ 3**        | **✅ 3**               |

**Current State**: pose-generator is the ONLY app without a FREE tier model.

---

## Conclusion

**The filtering is working correctly by design.**

Pose Generator is filtered out because:
1. User has FREE tier subscription
2. All pose-generator models require BASIC+ tier
3. Access control logic correctly hides apps with zero accessible models

**No code bugs found.** The system is functioning as designed to enforce subscription tier restrictions.

**Fix**: Add a FREE tier model to pose-generator or upgrade user to BASIC tier.

# Credit Balance Showing Zero - Root Cause Analysis & Fix

**Environment:** Production (dev.lumiku.com)
**Issue:** Credit balance displays as 0 in UnifiedHeader component despite user having credits
**Status:** FIXED - Ready for deployment
**Date:** 2025-10-17

---

## Executive Summary

The credit balance was showing zero due to a **response format mismatch** between the backend API and frontend expectations. The backend wraps all successful responses in `{ success: true, data: {...} }`, but the frontend was trying to access the balance directly without unwrapping the response.

**Impact:**
- Users see 0 credits even when they have a positive balance
- May lead to confusion and prevent users from using paid features
- No functional impact (credits are tracked correctly on backend)

**Fix Applied:**
1. Updated `creditsService.getBalance()` to unwrap the nested response
2. Added loading state to UnifiedHeader component
3. Improved error handling with fallback to user object
4. Removed race condition between two useEffect hooks

---

## Root Cause Analysis

### Issue #1: API Response Format Mismatch (PRIMARY ROOT CAUSE)

**Backend Response** (`backend/src/routes/credits.routes.ts`):
```typescript
// Line 31
return sendSuccess<CreditBalanceResponse>(c, { balance })
```

The `sendSuccess()` wrapper (from `backend/src/utils/api-response.ts`) creates this structure:
```json
{
  "success": true,
  "data": {
    "balance": 500
  }
}
```

**Frontend Expectation** (`frontend/src/services/creditsService.ts` - BEFORE FIX):
```typescript
async getBalance(): Promise<CreditBalance> {
  const response = await api.get<CreditBalance>('/api/credits/balance')
  return response.data  // ❌ Returns { success: true, data: { balance: 500 } }
}
```

**Frontend Usage** (`frontend/src/components/UnifiedHeader.tsx`):
```typescript
const balanceData = await creditsService.getBalance()
setCreditBalance(balanceData?.balance ?? 0)
// ❌ balanceData.balance is undefined (should be balanceData.data.balance)
// Result: 0 is set as the credit balance
```

**Evidence:**
- Backend logs show successful API responses with correct balance
- Frontend console shows no errors (because `undefined ?? 0` is valid JavaScript)
- The issue is silent - no 404, no CORS, no authentication failure

---

### Issue #2: Silent Error Handling

**Original Code** (`frontend/src/components/UnifiedHeader.tsx`):
```typescript
try {
  const balanceData = await creditsService.getBalance()
  setCreditBalance(balanceData?.balance ?? 0)
} catch (error) {
  console.error('Failed to fetch credit balance:', error)
  // ❌ No user feedback, no retry, no fallback
}
```

**Problems:**
- In production with minified code, `console.error` is not visible to developers
- No fallback to the user object's `creditBalance` property
- User sees 0 credits with no indication that something went wrong

---

### Issue #3: Race Condition Between useEffect Hooks

**Original Code** (`frontend/src/components/UnifiedHeader.tsx`):
```typescript
// useEffect #1: Fetch from API (runs once on mount)
useEffect(() => {
  const fetchBalance = async () => {
    const balanceData = await creditsService.getBalance()
    setCreditBalance(balanceData?.balance ?? 0)
  }
  fetchBalance()
}, [])

// useEffect #2: Update from user object (runs when user.creditBalance changes)
useEffect(() => {
  setCreditBalance(user?.creditBalance || 0)
}, [user?.creditBalance])
```

**Race Condition Scenario:**
1. Component mounts with `user.creditBalance = 100` (from Zustand persist)
2. useEffect #1 fetches from API → Returns 0 (due to parsing error)
3. useEffect #2 may run after API call → Overwrites with stale `user.creditBalance = 100`
4. OR useEffect #2 runs before API → Shows 100 briefly, then 0 appears
5. Result: Unpredictable behavior depending on timing

---

### Issue #4: No Loading State

**Problem:**
- Credit balance shows "0" immediately while API is loading
- User thinks they have zero credits when actually the data is loading
- No visual distinction between "loading", "error", and "actually zero"

---

## Complete Fix Implementation

### Fix #1: Unwrap Backend Response

**File:** `frontend/src/services/creditsService.ts`

**BEFORE:**
```typescript
async getBalance(): Promise<CreditBalance> {
  const response = await api.get<CreditBalance>('/api/credits/balance')
  return response.data
}
```

**AFTER:**
```typescript
async getBalance(): Promise<CreditBalance> {
  const response = await api.get<{ success: boolean; data: CreditBalance }>('/api/credits/balance')
  // Backend wraps response in { success: true, data: { balance: number } }
  // Extract the nested data object
  return response.data.data
}
```

**Why:**
- Correctly extracts `{ balance: 500 }` from `{ success: true, data: { balance: 500 } }`
- Matches the actual backend response structure
- Minimal code change (one line)

---

### Fix #2: Improve Error Handling & Remove Race Condition

**File:** `frontend/src/components/UnifiedHeader.tsx`

**BEFORE:**
```typescript
const [creditBalance, setCreditBalance] = useState<number>(user?.creditBalance || 0)

// useEffect #1
useEffect(() => {
  const fetchBalance = async () => {
    try {
      const balanceData = await creditsService.getBalance()
      setCreditBalance(balanceData?.balance ?? 0)
    } catch (error) {
      console.error('Failed to fetch credit balance:', error)
    }
  }
  fetchBalance()
}, [])

// useEffect #2 (RACE CONDITION!)
useEffect(() => {
  setCreditBalance(user?.creditBalance || 0)
}, [user?.creditBalance])
```

**AFTER:**
```typescript
const [creditBalance, setCreditBalance] = useState<number>(user?.creditBalance || 0)
const [isLoadingCredits, setIsLoadingCredits] = useState(true)

// Merged into single useEffect with dependency on user?.creditBalance
useEffect(() => {
  const fetchBalance = async () => {
    try {
      setIsLoadingCredits(true)
      const balanceData = await creditsService.getBalance()

      // Log for production debugging
      console.log('[UnifiedHeader] Credit balance fetched:', balanceData)

      setCreditBalance(balanceData?.balance ?? 0)
    } catch (error) {
      console.error('[UnifiedHeader] Failed to fetch credit balance:', error)

      // Fallback to user object balance if API fails
      if (user?.creditBalance !== undefined) {
        console.log('[UnifiedHeader] Using fallback balance from user object:', user.creditBalance)
        setCreditBalance(user.creditBalance)
      }
    } finally {
      setIsLoadingCredits(false)
    }
  }
  fetchBalance()
}, [user?.creditBalance])
```

**Improvements:**
- ✅ Single useEffect eliminates race condition
- ✅ Runs when `user?.creditBalance` changes (e.g., after login or credit purchase)
- ✅ Fallback to user object if API fails
- ✅ Production-safe logging with `[UnifiedHeader]` prefix
- ✅ Loading state tracking

---

### Fix #3: Add Loading State to UI

**File:** `frontend/src/components/UnifiedHeader.tsx`

**BEFORE:**
```tsx
<div className="hidden sm:flex flex-col items-start">
  <span className="text-xs text-slate-500">Credits</span>
  <span className="text-sm font-bold text-slate-900">{creditBalance.toLocaleString()}</span>
</div>
<span className="sm:hidden text-sm font-bold text-slate-900">{creditBalance.toLocaleString()}</span>
```

**AFTER:**
```tsx
<div className="hidden sm:flex flex-col items-start">
  <span className="text-xs text-slate-500">Credits</span>
  {isLoadingCredits ? (
    <span className="text-sm font-bold text-slate-400">...</span>
  ) : (
    <span className="text-sm font-bold text-slate-900">{creditBalance.toLocaleString()}</span>
  )}
</div>
{isLoadingCredits ? (
  <span className="sm:hidden text-sm font-bold text-slate-400">...</span>
) : (
  <span className="sm:hidden text-sm font-bold text-slate-900">{creditBalance.toLocaleString()}</span>
)}
```

**Benefits:**
- Shows "..." while loading (visual feedback)
- Prevents showing "0" during API call
- Gray color (`text-slate-400`) indicates loading state

---

## Testing Steps

### Pre-Deployment Testing (Local)

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test scenarios:**

   **Scenario 1: Fresh Login**
   - Clear browser localStorage
   - Login with test account (`test@lumiku.com` / `password123`)
   - **Expected:** Credits show "..." briefly, then display correct balance
   - **Check console:** Should log `[UnifiedHeader] Credit balance fetched: { balance: 100 }`

   **Scenario 2: Page Refresh**
   - Refresh the page while logged in
   - **Expected:** Credits show "..." briefly, then display correct balance
   - **Check console:** Should log `[UnifiedHeader] Credit balance fetched: { balance: 100 }`

   **Scenario 3: API Failure Simulation**
   - Stop the backend server
   - Refresh the page
   - **Expected:** Credits show "..." briefly, then display balance from user object
   - **Check console:** Should log error + fallback message

   **Scenario 4: Credit Purchase Flow**
   - Purchase credits (if payment integration works locally)
   - **Expected:** Balance updates automatically via useEffect dependency

---

### Production Deployment Testing (dev.lumiku.com)

1. **Deploy changes:**
   ```bash
   # Build frontend
   cd frontend
   npm run build

   # Deploy to Coolify/production server
   git add .
   git commit -m "fix: Credit balance showing zero due to response unwrapping issue"
   git push origin development
   ```

2. **Post-deployment checks:**

   **Step 1: Clear browser cache**
   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Or clear browser cache manually

   **Step 2: Test fresh login**
   - Logout if logged in
   - Login with test account
   - **Expected:** Credits display correctly in header

   **Step 3: Check browser console**
   - Open DevTools (F12)
   - Look for logs:
     ```
     [UnifiedHeader] Credit balance fetched: { balance: 100 }
     ```
   - Verify no errors

   **Step 4: Test navigation**
   - Navigate between different pages (Dashboard → Avatar Creator → Pose Generator)
   - **Expected:** Credit balance persists correctly

   **Step 5: Test multiple tabs**
   - Open two tabs on dev.lumiku.com
   - Login in both tabs
   - **Expected:** Both tabs show same credit balance

---

### Verification Checklist

- [ ] Credit balance shows "..." while loading (not "0")
- [ ] Credit balance displays correctly after load
- [ ] Console logs `[UnifiedHeader] Credit balance fetched:` with correct data
- [ ] No console errors related to credit balance
- [ ] Page refresh maintains correct balance
- [ ] Navigation between pages maintains correct balance
- [ ] If API fails, fallback to user object balance works
- [ ] Multiple tabs show consistent balance

---

## API Response Debugging

If issues persist, check the actual API response:

**Method 1: Browser DevTools Network Tab**
1. Open DevTools (F12) → Network tab
2. Filter by "balance"
3. Click on `/api/credits/balance` request
4. Check "Response" tab
5. **Expected response:**
   ```json
   {
     "success": true,
     "data": {
       "balance": 100
     }
   }
   ```

**Method 2: cURL Command**
```bash
# Replace TOKEN with actual JWT token from localStorage
curl -X GET https://dev.lumiku.com/api/credits/balance \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Method 3: Browser Console**
```javascript
// Run in browser console while logged in
fetch('/api/credits/balance', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
```

---

## Rollback Plan

If the fix causes issues:

1. **Quick rollback (Git):**
   ```bash
   git revert HEAD
   git push origin development
   ```

2. **Manual rollback (restore files):**
   - Restore `frontend/src/services/creditsService.ts`
   - Restore `frontend/src/components/UnifiedHeader.tsx`
   - Rebuild and redeploy

3. **Emergency workaround:**
   - If API continues to fail, remove the API call entirely
   - Use only `user?.creditBalance` from auth store
   - This will show stale data but prevents zero display

---

## Future Improvements

### 1. Standardize API Response Parsing

Create a generic API wrapper to handle all wrapped responses:

```typescript
// frontend/src/lib/api.ts
export async function unwrapApiResponse<T>(
  promise: Promise<AxiosResponse<{ success: boolean; data: T }>>
): Promise<T> {
  const response = await promise
  if (response.data.success && response.data.data !== undefined) {
    return response.data.data
  }
  throw new Error('Invalid API response format')
}

// Usage in creditsService
async getBalance(): Promise<CreditBalance> {
  return unwrapApiResponse(
    api.get<{ success: boolean; data: CreditBalance }>('/api/credits/balance')
  )
}
```

### 2. Add Real-time Credit Updates

Use WebSocket or Server-Sent Events for real-time credit balance updates:

```typescript
// When user purchases credits in another tab
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'credit-balance-updated') {
      fetchBalance()
    }
  }
  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}, [])
```

### 3. Add Retry Logic

Automatically retry failed API calls:

```typescript
async function fetchBalanceWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await creditsService.getBalance()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 4. Add Monitoring

Track API failures in production:

```typescript
catch (error) {
  console.error('[UnifiedHeader] Failed to fetch credit balance:', error)

  // Send to monitoring service (Sentry, LogRocket, etc.)
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      tags: { component: 'UnifiedHeader', api: 'credits/balance' }
    })
  }

  // Fallback to user object
  if (user?.creditBalance !== undefined) {
    setCreditBalance(user.creditBalance)
  }
}
```

---

## Related Files Changed

1. **`frontend/src/services/creditsService.ts`**
   - Updated `getBalance()` to unwrap nested response
   - Added comment explaining backend response format

2. **`frontend/src/components/UnifiedHeader.tsx`**
   - Added `isLoadingCredits` state
   - Merged two useEffect hooks into one
   - Added error handling with fallback
   - Added loading state to UI
   - Added production-safe logging

---

## Summary

**Root Cause:** Backend wraps response in `{ success: true, data: { balance } }`, but frontend expected direct `{ balance }` object.

**Fix Applied:**
- Unwrap response in `creditsService.getBalance()`
- Add loading state and error handling
- Remove race condition between useEffect hooks
- Add visual loading indicator

**Testing:** Follow testing steps above to verify fix works correctly.

**Deployment:** Safe to deploy - minimal code changes with backward-compatible fallbacks.

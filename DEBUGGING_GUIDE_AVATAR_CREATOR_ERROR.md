# 🐛 Debugging Guide: Avatar Creator 400 Error

**Error:** `Failed to load resource: /api/apps/avatar-creator_88082ugb227d4g3wi1 (400)`

**Status:**
- ✅ Database 100% CLEAN (verified via SQL forensics)
- ✅ Backend code 100% CLEAN (no hardcoded IDs)
- ✅ Frontend source code appears CLEAN
- ❓ Bug exists in **runtime** - need browser debugging

---

## 🎯 Quick Debugging Steps (5 Minutes)

### Step 1: Capture the Exact Source (MOST IMPORTANT)

1. **Open Developer Tools** (F12)
2. **Go to Network Tab**
3. **Reload the page** where error occurs
4. **Find the failed request**: Look for red entry with `avatar-creator_88082ugb227d4g3wi1`
5. **Right-click → Copy → Copy as cURL**
6. **Click on the request → Go to "Initiator" tab**
7. **Take screenshot** of the initiator stack trace

**What This Shows:** The EXACT JavaScript file and line number making the request!

---

### Step 2: Check Request Details

In the Network tab, for the failed request check:

**Headers:**
```
Request URL: https://dev.lumiku.com/api/apps/avatar-creator_88082ugb227d4g3wi1
Request Method: GET
```

**Initiator:** (This is the key!)
```
Shows the call stack - which file/line made this request
Example:
  api.ts:45
  ↓
  dashboardService.ts:34
  ↓
  Dashboard.tsx:100
```

Take a screenshot of this!

---

### Step 3: Clear ALL Caches

Execute in browser console (F12):

```javascript
// Clear everything
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('lumiku-app');

// Clear service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('✅ Service workers cleared');
});

// Force reload
location.reload(true);
```

**Test:** Does error still appear after this?

---

### Step 4: Check Application State

While on the page with the error, run in console:

```javascript
// Check if appId is stored incorrectly somewhere
console.log('LocalStorage:', {...localStorage});
console.log('SessionStorage:', {...sessionStorage});

// Check current route params
console.log('Current URL:', window.location.href);
console.log('Current Path:', window.location.pathname);

// Check any global state (if using Zustand)
if (window.__ZUSTAND__) {
  console.log('Zustand State:', window.__ZUSTAND__);
}
```

Take screenshot of the output!

---

### Step 5: Monitor All Requests

Add this in console to intercept ALL fetch requests:

```javascript
// Intercept fetch
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const url = args[0];

  // Log all requests
  console.log('🌐 FETCH:', url);

  // Alert on suspicious requests
  if (url.includes('avatar-creator_')) {
    console.error('🚨 FOUND THE BUG!');
    console.error('URL:', url);
    console.error('Called from:', new Error().stack);
    debugger; // This will pause execution
  }

  return originalFetch.apply(this, args);
};

console.log('✅ Fetch interceptor installed');
```

**Then:** Trigger the error action. When it hits, the debugger will pause and show you the exact line!

---

## 🔍 Advanced Debugging

### Check Build Artifacts

The bug might be in the BUILT JavaScript, not source:

1. **Open Network tab**
2. **Find the JavaScript file** making the request (from Initiator)
3. **Right-click → Open in Sources tab**
4. **Search** (Ctrl+F) for: `avatar-creator_`
5. **If found:** Take screenshot and note the line number

---

### Check React DevTools

1. Install React DevTools extension
2. Open DevTools → Components tab
3. Find the component where error occurs
4. Check its **props** and **state**
5. Look for any prop/state with value `avatar-creator_88082ugb227d4g3wi1`

---

### Force Clear CDN Cache (If Using Cloudflare)

If you're using Cloudflare or CDN:

1. Go to CDN dashboard
2. Click "Purge Everything" or "Purge Cache"
3. Wait 2-3 minutes
4. Test again in incognito

---

## 📊 What to Report Back

After running the steps above, please report:

### 1. **Network Initiator Stack** (Screenshot)
This is the MOST IMPORTANT - shows exact source of bug!

### 2. **Request Details**
```
URL: ?
Method: ?
Status: ?
Response: ?
```

### 3. **Cache Clear Result**
- [ ] Error still appears after clearing all caches
- [ ] Error disappeared after clearing caches

### 4. **Console Output**
Any relevant console.log output from the debugging scripts

### 5. **When Does Error Occur?**
- [ ] On page load
- [ ] After clicking something (what?)
- [ ] After navigation from another page
- [ ] Random/intermittent

---

## 🎯 Expected Findings

### **Scenario A: Cache Issue (30% chance)**
If error disappears after cache clear:
- Bug was stale data in browser
- Fixed by clearing storage
- **Solution:** Done!

### **Scenario B: Build Artifact (40% chance)**
If Initiator shows minified JavaScript:
- Bug is in deployed build
- Need to redeploy from clean source
- **Solution:** Redeploy via Coolify

### **Scenario C: Runtime Bug (25% chance)**
If Initiator shows specific component:
- Bug is in that component file
- We can fix the exact line
- **Solution:** Code fix + deploy

### **Scenario D: External Script (5% chance)**
If Initiator shows external domain:
- Browser extension or analytics causing it
- **Solution:** Disable extensions

---

## 🚀 Quick Commands for Copy-Paste

### Clear All Browser Data
```javascript
localStorage.clear();
sessionStorage.clear();
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
indexedDB.deleteDatabase('lumiku-app').onsuccess = () => location.reload(true);
```

### Install Fetch Interceptor
```javascript
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (url.includes('avatar-creator_')) {
    console.error('🚨 BUG FOUND:', url, new Error().stack);
    debugger;
  }
  return originalFetch.apply(this, args);
};
console.log('✅ Interceptor active');
```

### Check All State
```javascript
console.table({
  localStorage: Object.keys(localStorage).length,
  sessionStorage: Object.keys(sessionStorage).length,
  currentPath: window.location.pathname,
  currentURL: window.location.href
});
```

---

## 📞 Need Help?

If you run these steps and:
1. Take screenshot of Network Initiator
2. Report when error occurs (specific action)
3. Share console output

I can pinpoint the EXACT line causing the bug!

---

**Priority Steps:**
1. ⭐⭐⭐ **Network Initiator Screenshot** (most important!)
2. ⭐⭐ Clear all caches and test
3. ⭐ Install fetch interceptor and trigger error

---

**Last Updated:** 2025-10-16
**Status:** Ready for user debugging
**Expected Time:** 5-10 minutes

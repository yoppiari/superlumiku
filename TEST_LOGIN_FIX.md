# Quick Test: Login Fix

## BEFORE Testing

Clear your browser data:

```javascript
// Paste in browser console (F12)
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

## Test 1: Login Flow (5 minutes)

### Steps

1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to: http://localhost:5173 (or https://dev.lumiku.com)
4. Click "Login"
5. Enter:
   - Email: `test@lumiku.com`
   - Password: `password123`
6. Click "Login" button

### Expected Result ✅

- ✅ See "Loading..." on button
- ✅ Redirected to `/dashboard`
- ✅ Dashboard loads with apps
- ✅ Credit balance shows (1000 credits)
- ✅ User name appears in profile dropdown
- ✅ No console errors
- ✅ Stay on dashboard (no redirect to login)

### If Failed ❌

Check Console for errors:
- Look for red error messages
- Screenshot the error
- Check Network tab for API response

---

## Test 2: Token Storage (1 minute)

### Steps

After successful login, paste in console:

```javascript
// Check token exists
console.log('Token:', localStorage.getItem('token'))

// Check auth state
console.log('Auth State:', JSON.parse(localStorage.getItem('auth-storage')))
```

### Expected Result ✅

```javascript
Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // ✅ Long JWT string

Auth State: {
  state: {
    user: {
      id: "...",
      email: "test@lumiku.com",
      name: "Test User",
      creditBalance: 1000
    },
    token: "eyJhbGci...",
    isAuthenticated: true
  },
  version: 0
}
```

### If Failed ❌

- Token is `null` → Bug not fixed
- Auth state is missing → Check authStore
- Token is `undefined` → Check authService

---

## Test 3: Page Refresh (30 seconds)

### Steps

1. After successful login on dashboard
2. Press F5 (or Ctrl+R) to refresh page
3. Wait for page to load

### Expected Result ✅

- ✅ Dashboard loads immediately
- ✅ User still logged in
- ✅ Credit balance shows
- ✅ Apps display
- ✅ No redirect to login page

### If Failed ❌

- Redirected to login → Token not persisted
- 401 error → Token invalid/expired
- Blank page → Check console for errors

---

## Test 4: Navigation (1 minute)

### Steps

1. After successful login
2. Click different pages:
   - Dashboard → My Work → Profile → Dashboard
3. Use browser back button
4. Navigate to `/apps/avatar-creator`

### Expected Result ✅

- ✅ All pages load correctly
- ✅ No logout during navigation
- ✅ User data persists across pages
- ✅ Back button works
- ✅ Direct URL access works

### If Failed ❌

- Logged out during navigation → Check route guards
- 401 errors → Check API interceptor
- Blank pages → Check component auth checks

---

## Test 5: API Response Structure (2 minutes)

### Steps

1. Open DevTools → Network tab
2. Clear network log (trash icon)
3. Logout (if logged in)
4. Login again with test credentials
5. Find the `/api/auth/login` request
6. Click on it → Response tab

### Expected Backend Response ✅

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxxxxxxxxx",
      "email": "test@lumiku.com",
      "name": "Test User",
      "creditBalance": 1000
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### What Frontend Should Extract ✅

After authService.login():
```javascript
{
  "user": {
    "id": "clxxxxxxxxxx",
    "email": "test@lumiku.com",
    "name": "Test User",
    "creditBalance": 1000
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### If Structure Different ❌

- Missing `success` field → Backend change needed
- Missing nested `data` → Backend change needed
- Flat structure → Revert authService fix

---

## Test 6: Logout & Re-login (1 minute)

### Steps

1. After successful login
2. Click profile dropdown
3. Click "Logout"
4. Verify redirected to login page
5. Login again with same credentials

### Expected Result ✅

- ✅ Logout clears token
- ✅ Redirected to login page
- ✅ Can login again successfully
- ✅ Dashboard loads after re-login

---

## Quick Debug Commands

### Check if logged in

```javascript
Boolean(localStorage.getItem('token'))
```

### Get user info

```javascript
JSON.parse(localStorage.getItem('auth-storage'))?.state?.user
```

### Check token validity

```javascript
const token = localStorage.getItem('token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token expires:', new Date(payload.exp * 1000))
  console.log('Is expired:', Date.now() > payload.exp * 1000)
}
```

### Force logout

```javascript
localStorage.clear()
location.href = '/login'
```

### Monitor storage changes

```javascript
window.addEventListener('storage', (e) => {
  console.log('Storage changed:', e.key, e.oldValue, '→', e.newValue)
})
```

---

## Common Issues & Solutions

### Issue: "Token is null after login"

**Cause**: authService not unwrapping response
**Solution**: Check `authService.ts` line 34 - should be `response.data.data`

### Issue: "Immediately redirected to login"

**Cause**: Token not saved to localStorage
**Solution**: Check setAuth() in authStore is called with valid token

### Issue: "401 Unauthorized on dashboard"

**Cause**: Token format invalid or expired
**Solution**: Check API interceptor adds Bearer token to requests

### Issue: "User data shows as null"

**Cause**: User object not extracted from response
**Solution**: Verify authService returns `{ user, token }` not `{ success, data }`

---

## Success Checklist

After all tests pass:

- [ ] Can login with valid credentials
- [ ] Token saved to localStorage
- [ ] Dashboard loads after login
- [ ] User stays logged in after refresh
- [ ] Navigation works across pages
- [ ] Credit balance displays correctly
- [ ] Profile dropdown shows user name
- [ ] Can logout and re-login
- [ ] No console errors
- [ ] No 401 errors

---

## Report Results

### If All Tests Pass ✅

**Login system is working correctly!**

You can now:
- Use the application normally
- Deploy to production
- Close this ticket

### If Any Test Fails ❌

**Gather this information:**

1. Which test failed?
2. Error message in console?
3. Network tab response structure?
4. localStorage token value?
5. Screenshot of error?

**Then:**
- Check `LOGIN_BUG_FIX_REPORT.md` for troubleshooting
- Review authService.ts changes
- Verify backend response format matches expected structure

---

## Production Testing

Before deploying to production:

1. ✅ All tests pass locally
2. ✅ Frontend builds without errors: `npm run build`
3. ✅ No TypeScript errors
4. ✅ Test in incognito mode
5. ✅ Test with different users
6. ✅ Test on different browsers (Chrome, Firefox, Safari)

Then deploy to Coolify and repeat tests on production URL.

---

**Need Help?** Check `LOGIN_BUG_FIX_REPORT.md` for detailed analysis and debugging.

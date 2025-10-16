# Authentication Debug Guide

Quick reference untuk debugging masalah authentication di Lumiku App.

## Quick Diagnostics

### 1. Check Token in Browser Console
```javascript
// Paste ini di browser console
console.log('Token:', localStorage.getItem('token'))
console.log('Auth State:', localStorage.getItem('auth-storage'))
```

**Expected Output:**
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Auth State: {"state":{"user":{...},"token":"eyJ...","isAuthenticated":true},"version":0}
```

**If Token is null:**
- Login failed or token not saved
- Check Login.tsx handleSubmit function
- Check authStore setAuth function

### 2. Check API Requests in Network Tab

**Successful Login Flow:**
```
POST /api/auth/login → 200 OK
  Response: { "user": {...}, "token": "eyJ..." }

GET /api/credits/balance → 200 OK
  Request Headers: Authorization: Bearer eyJ...
  Response: { "balance": 100 }

GET /api/apps → 200 OK
  Request Headers: Authorization: Bearer eyJ...
  Response: { "apps": [...] }

GET /api/stats/dashboard → 200 OK
  Request Headers: Authorization: Bearer eyJ...
  Response: { "totalSpending": 0, ... }
```

**Failed Login Flow (Auto-Logout Bug):**
```
POST /api/auth/login → 200 OK ✓
  Response: { "user": {...}, "token": "eyJ..." }

GET /api/credits/balance → 401 Unauthorized ✗
  Request Headers: Authorization: (missing or invalid)
  Response: { "error": "Unauthorized - No token provided" }

→ Redirect to /login
```

### 3. Check Console Logs

**Look for these log messages:**
```
[AUTH] setAuth called: { userId: '...', tokenLength: 150, timestamp: '...' }
[AUTH] Token storage verification failed  // ❌ BAD - token not saved
[Dashboard] No token found, redirecting to login  // ❌ BAD - token missing
[API] Request: { url: '/api/credits/balance', hasToken: true, ... }  // ✓ GOOD
```

---

## Common Issues & Solutions

### Issue 1: Token Not Saved to localStorage

**Symptoms:**
- Login succeeds but immediately logs out
- `localStorage.getItem('token')` returns null

**Root Cause:**
- Race condition between setAuth and navigate
- Browser storage quota exceeded
- Private browsing mode

**Solution:**
```typescript
// In Login.tsx - Add delay
setAuth(user, token)
await new Promise(resolve => setTimeout(resolve, 50))  // ✓ Wait for storage
navigate('/dashboard', { replace: true })
```

**Verification:**
```javascript
// Should log the token
console.log('Token after login:', localStorage.getItem('token'))
```

---

### Issue 2: 401 on First Request After Login

**Symptoms:**
- Login succeeds
- First API request gets 401
- Subsequent requests would work (but interceptor redirects)

**Root Cause:**
- API request fires before token is in localStorage
- Request interceptor reads empty token

**Solution:**
```typescript
// In Dashboard.tsx - Verify token before requests
const token = localStorage.getItem('token')
if (!token) {
  console.warn('[Dashboard] No token found')
  navigate('/login')
  return
}
```

**Verification:**
```javascript
// In request interceptor - add logging
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  console.log('[API] Request token:', token ? 'Present' : 'Missing')
  return config
})
```

---

### Issue 3: Infinite Redirect Loop

**Symptoms:**
- Can't access login page
- Browser keeps redirecting
- Network tab shows many redirects

**Root Cause:**
- Response interceptor redirects even on login page
- Multiple 401s trigger multiple redirects

**Solution:**
```typescript
// In api.ts - Check current path
if (error.response?.status === 401) {
  const currentPath = window.location.pathname
  if (currentPath !== '/login' && currentPath !== '/') {
    // Only redirect if not already on login page
    setTimeout(() => {
      window.location.href = '/login'
    }, 100)
  }
}
```

**Verification:**
```javascript
// Should not see this on login page
console.log('401 redirect blocked on:', window.location.pathname)
```

---

### Issue 4: Token Expired

**Symptoms:**
- Worked before, now getting 401
- Token exists in localStorage

**Root Cause:**
- JWT token expired (default: 7 days)
- Server time vs client time mismatch

**Check Token Expiration:**
```javascript
// Paste in browser console
const token = localStorage.getItem('token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  const exp = new Date(payload.exp * 1000)
  const now = new Date()
  console.log('Token expires:', exp)
  console.log('Current time:', now)
  console.log('Is expired:', now > exp)
}
```

**Solution:**
```bash
# Clear storage and login again
localStorage.clear()
# Then login through UI
```

---

### Issue 5: CORS Issues

**Symptoms:**
- Login fails with CORS error
- Network tab shows CORS policy error

**Check CORS Configuration:**
```typescript
// backend/src/middleware/cors.middleware.ts
const corsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ]
    return allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0]
  },
  credentials: true,
})
```

**Verify in Network Tab:**
```
Request Headers:
  Origin: http://localhost:5173

Response Headers:
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Credentials: true
```

---

## Backend Debugging

### Check JWT Secret
```bash
# In backend directory
echo $JWT_SECRET

# Should output a long random string
# If empty, JWT verification will fail
```

### Check Database Connection
```bash
# Test database health
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-16T..."
}
```

### Check User Exists
```bash
# Using Prisma Studio
cd backend
bunx prisma studio

# Or using psql
psql $DATABASE_URL -c "SELECT id, email FROM users WHERE email='test@lumiku.com';"
```

### Check Auth Middleware
```typescript
// backend/src/middleware/auth.middleware.ts
export const authMiddleware = async (c: AuthContext, next: Next) => {
  const authHeader = c.req.header('Authorization')

  console.log('[AUTH] Checking auth:', {
    hasHeader: !!authHeader,
    headerValue: authHeader?.substring(0, 20) + '...'
  })

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const payload = verifyToken(token)
    console.log('[AUTH] Token valid:', payload.userId)
    c.set('userId', payload.userId)
    await next()
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error)
    return c.json({ error: 'Unauthorized - Invalid token' }, 401)
  }
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Login with valid credentials
- [ ] Check localStorage has token
- [ ] Dashboard loads without redirect
- [ ] All API calls return 200
- [ ] No 401 errors in console
- [ ] No 401 errors in network tab
- [ ] Logout works correctly
- [ ] Can login again after logout

### Automated Testing
```bash
# Run the test script
./test-auto-logout-fix.sh

# Expected output:
✓ Backend is running
✓ Login successful
✓ Token extracted
✓ Credit Balance (200)
✓ Apps List (200)
✓ Dashboard Stats (200)
✓ ALL TESTS PASSED
```

### Edge Cases
- [ ] Slow network (throttle to 3G)
- [ ] Multiple tabs open
- [ ] Page refresh after login
- [ ] Back button after login
- [ ] Direct URL to protected page
- [ ] Token expires during session
- [ ] Invalid token in localStorage
- [ ] Private browsing mode

---

## Quick Fixes

### Clear All Auth State
```javascript
// Paste in browser console
localStorage.removeItem('token')
localStorage.removeItem('auth-storage')
sessionStorage.clear()
location.reload()
```

### Reset Database User
```bash
# In backend directory
bunx prisma studio

# Then manually:
# 1. Find user by email
# 2. Delete all sessions for that user
# 3. Try login again
```

### Restart Services
```bash
# Stop all services
# Ctrl+C in all terminals

# Start backend
cd backend
bun run dev

# Start frontend (new terminal)
cd frontend
npm run dev
```

---

## Monitoring & Alerts

### Add Custom Logging
```typescript
// frontend/src/lib/api.ts - Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url} (authenticated)`)
  } else {
    console.warn(`[API] ${config.method?.toUpperCase()} ${config.url} (NO TOKEN)`)
  }
  return config
})

// frontend/src/lib/api.ts - Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.config.url} → ${response.status}`)
    return response
  },
  (error) => {
    console.error(`[API] ${error.config?.url} → ${error.response?.status}`, error.response?.data)
    return Promise.reject(error)
  }
)
```

### Track Auth Events
```typescript
// frontend/src/stores/authStore.ts
setAuth: (user, token) => {
  console.log('[AUTH] Setting auth:', {
    userId: user.id,
    email: user.email,
    tokenLength: token.length,
    timestamp: new Date().toISOString()
  })

  localStorage.setItem('token', token)
  set({ user, token, isAuthenticated: true })

  const savedToken = localStorage.getItem('token')
  if (savedToken === token) {
    console.log('[AUTH] ✓ Token saved successfully')
  } else {
    console.error('[AUTH] ✗ Token save failed!')
  }
},

logout: () => {
  console.log('[AUTH] Logging out:', {
    userId: get().user?.id,
    timestamp: new Date().toISOString()
  })

  localStorage.removeItem('token')
  set({ user: null, token: null, isAuthenticated: false })

  console.log('[AUTH] ✓ Logged out successfully')
}
```

---

## Support Contacts

**If issue persists after following this guide:**

1. Check GitHub Issues: [link]
2. Contact backend team: backend@lumiku.com
3. Contact frontend team: frontend@lumiku.com

**Include in your report:**
- Browser console logs
- Network tab screenshots
- Steps to reproduce
- Expected vs actual behavior
- Browser version and OS

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
**Fixed By:** Claude Code

# SSO Implementation Guide

## Overview

Lumiku Suite menggunakan **JWT-based SSO** untuk sharing authentication state antara Dashboard dan tools lainnya (VideoMix Pro, Carousel Generator, dll).

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│ Lumiku Dashboard│         │  VideoMix Pro    │
│  (port 5173)    │◄────────┤   (port 8001)    │
└────────┬────────┘  SSO    └──────────────────┘
         │            Token
         │
    localStorage
    ┌────────────┐
    │   token    │
    │ auth-state │
    └────────────┘
```

## How It Works

### 1. Login Flow

```typescript
User Login → Backend generates JWT →
Frontend stores in:
  - localStorage.token
  - localStorage.auth-storage (Zustand persist)
```

### 2. Cross-App Navigation

```typescript
// From Dashboard to VideoMix
import { navigateWithSSO } from './lib/sso'

navigateWithSSO('http://localhost:8001', '/projects')
// Redirects to: http://localhost:8001/projects?sso=base64(token+user)
```

### 3. Receiving SSO Token

```typescript
// In VideoMix Pro App.tsx
import { extractSSOFromURL } from './lib/sso'

useEffect(() => {
  const ssoData = extractSSOFromURL()
  if (ssoData) {
    // Auto-login with SSO token
    setAuth(ssoData.user, ssoData.token)
  }
}, [])
```

## Features

### ✅ Cross-Tab Logout

Ketika user logout di satu tab, semua tab lain akan auto-logout.

```typescript
// Logout di Dashboard
logout() // → triggers 'storage' event di tabs lain
```

### ✅ Token Validation

- JWT expires in configurable time (default: 24h)
- Auto-clear expired tokens
- API middleware validates on every request

### ✅ Profile Menu

- Dropdown dengan user info
- Navigation ke Profile, Settings, Buy Credits
- Logout functionality

## API Reference

### `getSSOToken()`

Get current authentication token.

```typescript
const ssoToken = getSSOToken()
// Returns: { token, user, expiresAt } | null
```

### `setSSOToken(token, user)`

Set authentication token (used during login).

```typescript
setSSOToken('jwt_token_here', { id, email, name, creditBalance })
```

### `clearSSOToken()`

Clear auth token and broadcast logout event.

```typescript
clearSSOToken()
// Triggers logout in all tabs
```

### `isAuthenticated()`

Check if user is currently authenticated.

```typescript
if (isAuthenticated()) {
  // User is logged in
}
```

### `getAuthHeaders()`

Get authorization headers for API calls.

```typescript
const headers = getAuthHeaders()
// Returns: { 'Authorization': 'Bearer token...' }
```

### `navigateWithSSO(appUrl, path)`

Navigate to another app with SSO.

```typescript
navigateWithSSO('http://localhost:8001', '/projects')
```

### `extractSSOFromURL()`

Extract SSO data from URL parameter (receiving app).

```typescript
const ssoData = extractSSOFromURL()
if (ssoData) {
  // User logged in via SSO
}
```

### `setupSSOListeners(onLogout)`

Setup event listeners for cross-tab sync.

```typescript
setupSSOListeners(() => {
  // Handle logout
  logout()
  navigate('/')
})
```

## Integration Examples

### Example 1: Lumiku Dashboard → VideoMix

```typescript
// In Dashboard.tsx
const handleOpenVideoMix = () => {
  navigateWithSSO('http://localhost:8001', '/projects')
}

<button onClick={handleOpenVideoMix}>
  Open VideoMix Pro
</button>
```

### Example 2: VideoMix Receives SSO

```typescript
// In VideoMix App.tsx
import { extractSSOFromURL, setupSSOListeners } from '@lumiku/sso'

function App() {
  useEffect(() => {
    // Check for SSO login
    const ssoData = extractSSOFromURL()
    if (ssoData) {
      loginWithSSO(ssoData)
    }

    // Listen for logout events
    setupSSOListeners(() => {
      logout()
    })
  }, [])
}
```

### Example 3: API Calls with Auth

```typescript
import { getAuthHeaders } from './lib/sso'

const response = await fetch('http://localhost:3000/api/credits/balance', {
  headers: getAuthHeaders()
})
```

## Security Considerations

### ✅ Token Expiration

Tokens expire after configured time (default 24h). Backend validates on every request.

### ✅ HTTPS Only (Production)

SSO tokens harus dikirim via HTTPS di production untuk mencegah token theft.

### ✅ SameSite Cookies (Optional Enhancement)

Untuk production, consider using HttpOnly SameSite cookies sebagai alternative.

### ✅ CORS Configuration

Backend harus configure CORS untuk allow requests dari semua tool domains:

```typescript
// backend/src/middleware/cors.middleware.ts
const allowedOrigins = [
  'http://localhost:5173', // Dashboard
  'http://localhost:8001', // VideoMix
  // ... other tools
]
```

## Testing SSO

### Test 1: Profile Menu

1. Login ke Dashboard
2. Click profile avatar (top right)
3. Verify dropdown shows:
   - User name & email
   - Credit balance
   - Menu items (Profile, Settings, Buy Credits)
   - Logout button

### Test 2: Logout Flow

1. Open Dashboard di 2 tabs
2. Logout di tab 1
3. Verify tab 2 auto-logout

### Test 3: Cross-App SSO (Future)

1. Login di Dashboard
2. Click "Open VideoMix Pro"
3. Verify VideoMix auto-login with same user

## Troubleshooting

### Issue: Token not persisting

**Solution**: Check localStorage permissions and Zustand persist config.

### Issue: Cross-tab logout not working

**Solution**: Verify 'storage' event listener is setup in App.tsx.

### Issue: SSO redirect loop

**Solution**: Check if `extractSSOFromURL()` properly removes SSO param from URL.

## Future Enhancements

- [ ] Refresh token mechanism
- [ ] Remember me functionality
- [ ] OAuth2 integration
- [ ] Multi-tenant support
- [ ] Session management dashboard

---

Built with ❤️ by Lumiku Team

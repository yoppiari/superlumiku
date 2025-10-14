# Lumiku App - Development Guide

**Audience:** Developers working on Lumiku App
**Last Updated:** 2025-10-02

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Workflow](#development-workflow)
3. [Adding a New App](#adding-a-new-app)
4. [Database Changes](#database-changes)
5. [Testing](#testing)
6. [Git Workflow](#git-workflow)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

```bash
# Required
- Bun 1.0+
- Node.js 18+
- Git

# Optional (for video processing)
- FFmpeg 4.4+
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yoppiari/superlumiku.git
cd lumiku-app

# Install dependencies
bun install

# Setup database
bun prisma:generate
bun prisma:migrate
bun seed

# Start development servers
bun dev
```

### Access Points

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database GUI: `bun prisma:studio` (http://localhost:5555)

### Test Credentials

```
Email: test@lumiku.com
Password: password123
Credits: 100
```

---

## Development Workflow

### Daily Development

```bash
# Start both frontend and backend
bun dev

# Or start separately
bun dev:backend   # Terminal 1
bun dev:frontend  # Terminal 2
```

### Making Changes

1. **Frontend changes** - Auto-reloads via Vite HMR
2. **Backend changes** - Auto-restarts via Bun watch mode
3. **Database changes** - Requires migration (see below)

### Project Structure

```
lumiku-app/
├── frontend/src/
│   ├── pages/          # Dashboard, Login, Settings
│   ├── apps/           # Plugin UIs (VideoMixer.tsx)
│   ├── components/     # Reusable components
│   ├── lib/            # API client, utilities
│   └── store/          # Zustand state management
│
├── backend/src/
│   ├── core/           # Auth, credit system, middleware
│   ├── plugins/        # Plugin registry
│   ├── apps/           # Plugin apps (video-mixer, etc.)
│   ├── routes/         # Core routes (auth, credits)
│   ├── db/             # Prisma client
│   └── index.ts        # Main server
│
├── backend/prisma/
│   ├── schema.prisma   # Database schema
│   ├── migrations/     # Migration history
│   └── seed.ts         # Test data
│
└── docs/               # Documentation
```

---

## Adding a New App

### Using the Template (Easiest Way)

Use the non-technical template in [ADD_NEW_APP_PROMPT.md](ADD_NEW_APP_PROMPT.md):

```
Buatin app baru namanya [NAME].
Fungsinya buat [PURPOSE].
Icon: [ICON_NAME]
Warna: [COLOR]

Yang bisa dilakukan user:
- [ACTION 1] → pakai [X] credits
- [ACTION 2] → pakai [Y] credits

Data yang disimpan:
- [MODEL 1]: [FIELDS]
- [MODEL 2]: [FIELDS]

Bikin lengkap ya, backend sama frontend!
```

Claude will automatically generate the complete app structure.

### Manual Implementation (Advanced)

Follow the plugin pattern in [PLUGIN_ARCHITECTURE.md](PLUGIN_ARCHITECTURE.md).

#### Step 1: Create App Folder

```bash
mkdir -p backend/src/apps/my-app/{services,repositories,schemas}
```

#### Step 2: Create Plugin Config

```typescript
// backend/src/apps/my-app/plugin.config.ts
import { PluginConfig } from '../../plugins/types'

export const myAppConfig: PluginConfig = {
  appId: 'my-app',
  name: 'My App',
  description: 'App description',
  icon: 'zap', // Lucide icon name
  version: '1.0.0',
  routePrefix: '/api/apps/my-app',
  credits: {
    createItem: 5,
    updateItem: 2,
  },
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },
  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },
  dashboard: {
    order: 10,
    color: 'purple',
    stats: {
      enabled: true,
      endpoint: '/api/apps/my-app/stats',
    },
  },
}
```

#### Step 3: Create Database Models

```prisma
// backend/prisma/schema.prisma

// Add to end of file
model MyAppItem {
  id        String   @id @default(cuid())
  userId    String
  name      String
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("my_app_items")
}
```

Run migration:

```bash
bun prisma migrate dev --name add-my-app
```

#### Step 4: Create Routes

```typescript
// backend/src/apps/my-app/routes.ts
import { Hono } from 'hono'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { myAppConfig } from './plugin.config'

const routes = new Hono()

// GET items (no credit cost)
routes.get('/items', authMiddleware, async (c) => {
  const userId = c.get('userId')
  // ... fetch items
  return c.json({ items })
})

// POST create item (with credit deduction)
routes.post(
  '/items',
  authMiddleware,
  deductCredits(myAppConfig.credits.createItem, 'create_item', myAppConfig.appId),
  async (c) => {
    const userId = c.get('userId')
    const body = await c.req.json()

    // ... create item logic

    // Record credit usage
    const deduction = c.get('creditDeduction')
    const { newBalance, creditUsed } = await recordCreditUsage(
      userId,
      deduction.appId,
      deduction.action,
      deduction.amount
    )

    return c.json({ success: true, item, creditUsed, creditBalance: newBalance })
  }
)

export default routes
```

#### Step 5: Register Plugin

```typescript
// backend/src/plugins/loader.ts
import myAppConfig from '../apps/my-app/plugin.config'
import myAppRoutes from '../apps/my-app/routes'

export function loadPlugins() {
  pluginRegistry.register(myAppConfig, myAppRoutes)
  // ... other plugins
}
```

#### Step 6: Create Frontend Component

**IMPORTANT:** Follow the [UI Standards](UI_STANDARDS.md) for header and layout consistency!

```tsx
// frontend/src/apps/MyApp.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import ProfileDropdown from '../components/ProfileDropdown'
import { ArrowLeft, Zap, Coins } from 'lucide-react'

export default function MyApp() {
  const navigate = useNavigate()
  const { user, updateCreditBalance } = useAuthStore()
  const [items, setItems] = useState([])

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    const res = await api.get('/api/apps/my-app/items')
    setItems(res.data.items)
  }

  const handleCreate = async (data) => {
    try {
      const res = await api.post('/api/apps/my-app/items', data)
      updateCreditBalance(res.data.creditBalance)
      setItems([res.data.item, ...items])
    } catch (error) {
      if (error.response?.status === 402) {
        alert('Insufficient credits!')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Standard Header - DO NOT MODIFY */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
                    My App
                  </h1>
                  <p className="text-sm md:text-[0.9375rem] text-slate-600">
                    App description here
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-all">
                <Coins className="w-[1.125rem] h-[1.125rem] text-slate-600" />
                <span className="font-medium text-slate-900">
                  {(user?.creditBalance || 0).toLocaleString()} Credits
                </span>
              </div>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Your UI components here */}
      </div>
    </div>
  )
}
```

#### Step 7: Add Route

```typescript
// frontend/src/App.tsx
import MyApp from './apps/MyApp'

// Add to routes
<Route path="/apps/my-app" element={<MyApp />} />
```

---

## Database Changes

### Creating Migrations

```bash
# After modifying schema.prisma
bun prisma migrate dev --name describe-your-change

# Examples:
bun prisma migrate dev --name add-my-app
bun prisma migrate dev --name add-user-avatar
bun prisma migrate dev --name fix-foreign-key
```

### Applying Migrations (Production)

```bash
bun prisma migrate deploy
```

### Resetting Database (Development Only)

```bash
bun prisma migrate reset  # ⚠️ Deletes all data!
bun seed                   # Re-seed test data
```

### Prisma Studio (Database GUI)

```bash
bun prisma:studio
# Opens http://localhost:5555
```

---

## Testing

### Manual Testing

1. **Backend API**
   ```bash
   # Health check
   curl http://localhost:3000/health

   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@lumiku.com","password":"password123"}'
   ```

2. **Frontend**
   - Open http://localhost:5173
   - Login with test credentials
   - Test user flows manually

### Credit System Testing

```bash
# Check credit checklist:
- [ ] Create operation deducts correct credits
- [ ] Insufficient credits returns 402
- [ ] Credit balance updates in response
- [ ] AppUsage record created
- [ ] App statistics updated (if applicable)
- [ ] Transaction rollback on failure
```

---

## Git Workflow

### Branch Naming

```bash
feature/add-carousel-generator
fix/credit-deduction-bug
docs/update-readme
refactor/plugin-system
```

### Commit Messages

```bash
# Good examples:
feat: Add carousel generator app
fix: Resolve credit deduction issue in video mixer
docs: Update CURRENT_ARCHITECTURE.md
refactor: Simplify plugin registration logic

# Bad examples:
update code
fix bug
changes
```

### Creating a Pull Request

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes & commit
git add .
git commit -m "feat: Add my feature"

# 3. Push to remote
git push -u origin feature/my-feature

# 4. Create PR on GitHub
# - Add description
# - Reference any issues
# - Request review
```

---

## Deployment

### Environment Variables

```bash
# backend/.env (Production)
DATABASE_URL="postgresql://user:pass@host/db"
JWT_SECRET="your-secure-secret"
CORS_ORIGIN="https://yourdomain.com"
UPLOAD_DIR="./uploads"
REDIS_URL="redis://redis-host:6379"  # When queue system ready
```

### Build for Production

```bash
# Build frontend
bun build:frontend

# Build backend
bun build:backend

# Run migrations
bun prisma migrate deploy
```

### Deployment Checklist

- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Static files served correctly
- [ ] CORS configured for production domain
- [ ] Logs configured for monitoring
- [ ] Backups scheduled
- [ ] SSL/TLS certificates valid

---

## Troubleshooting

This comprehensive troubleshooting section covers common issues you may encounter during development. For production issues, see [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

### Table of Contents
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Database Issues](#database-issues)
- [Environment & Configuration](#environment--configuration)
- [Redis & Caching](#redis--caching)
- [FFmpeg & Video Processing](#ffmpeg--video-processing)
- [Credit System](#credit-system)
- [Build & Deployment](#build--deployment)

---

### Backend Issues

#### Backend Won't Start

**Symptoms**: Server exits immediately or shows errors on startup

**Common Causes & Solutions**:

1. **Port Already in Use**
   ```bash
   # Error: listen EADDRINUSE :::3000

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -ti:3000 | xargs kill -9

   # Or change port in .env
   PORT=3001
   ```

2. **Environment Variables Missing/Invalid**
   ```bash
   # Check validation errors on startup
   # Fix any reported issues in backend/.env

   # Common issues:
   # - JWT_SECRET too short (must be 32+ characters)
   # - DATABASE_URL not set
   # - Invalid URL formats for CORS_ORIGIN or DUITKU_*_URL

   # Generate new JWT secret:
   openssl rand -base64 32
   ```

3. **Prisma Client Not Generated**
   ```bash
   # Error: Cannot find module '@prisma/client'

   # Solution:
   cd backend
   bun prisma generate

   # If still failing, clean and regenerate:
   rm -rf node_modules/.prisma
   rm -rf node_modules/@prisma
   bun install
   bun prisma generate
   ```

4. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL format
   # SQLite: file:./prisma/dev.db
   # PostgreSQL: postgresql://user:pass@host:5432/db

   # Test connection:
   cd backend
   bun prisma db pull
   ```

5. **Module Import Errors**
   ```bash
   # Clear Bun cache
   rm -rf ~/.bun/install/cache

   # Reinstall dependencies
   rm -rf node_modules
   bun install
   ```

#### API Returning 500 Errors

**Diagnosis**:
```bash
# Check backend terminal for error stack traces
# Look for:
# - Database query errors
# - Missing environment variables
# - Unhandled exceptions
# - Type mismatches
```

**Common Fixes**:
1. Check Prisma Client is up to date: `bun prisma generate`
2. Verify database schema matches code
3. Check for null/undefined values in request body
4. Ensure all required fields are validated

#### Slow API Responses

**Symptoms**: API calls taking >2 seconds

**Diagnosis**:
```typescript
// Add timing logs to routes:
console.time('operation')
// ... operation
console.timeEnd('operation')
```

**Common Causes**:
1. **Missing Database Indexes**
   ```bash
   # Check schema.prisma for @@index annotations
   # Add indexes for frequently queried fields
   ```

2. **N+1 Query Problem**
   ```typescript
   // Bad: Multiple queries in loop
   for (const project of projects) {
     const videos = await prisma.video.findMany({
       where: { projectId: project.id }
     })
   }

   // Good: Single query with include
   const projects = await prisma.project.findMany({
     include: { videos: true }
   })
   ```

3. **Large Response Payloads**
   ```typescript
   // Use pagination
   const items = await prisma.item.findMany({
     take: 20,
     skip: page * 20
   })

   // Select only needed fields
   const users = await prisma.user.findMany({
     select: { id: true, name: true, email: true }
   })
   ```

---

### Frontend Issues

#### Frontend Won't Start

**Common Causes**:

1. **Port 5173 Already in Use**
   ```bash
   # Windows
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -ti:5173 | xargs kill -9
   ```

2. **Vite Cache Issues**
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   rm -rf dist
   bun install
   bun run dev
   ```

3. **TypeScript Errors**
   ```bash
   # Check for type errors
   cd frontend
   bun run type-check

   # Common fixes:
   # - Update @types/* packages
   # - Fix any | unknown types
   # - Check for missing imports
   ```

#### CORS Errors in Browser

**Symptoms**: Console shows "blocked by CORS policy"

**Diagnosis**:
```bash
# Check browser console for specific error:
# - "Access-Control-Allow-Origin header"
# - "Response to preflight request"
# - "Origin not allowed"
```

**Solutions**:
1. **Verify CORS_ORIGIN in backend/.env**
   ```bash
   # Must exactly match frontend URL (including protocol)
   CORS_ORIGIN="http://localhost:5173"

   # Restart backend after changes
   ```

2. **Check API Client Base URL**
   ```typescript
   // frontend/src/lib/api.ts
   const api = axios.create({
     baseURL: 'http://localhost:3000', // Must match backend
   })
   ```

3. **Try Incognito Mode**
   ```bash
   # Sometimes browser cache causes issues
   # Open in incognito/private window to test
   ```

4. **Check for Preflight Issues**
   ```bash
   # Look for OPTIONS requests in Network tab
   # Ensure backend handles OPTIONS method
   ```

#### Authentication Issues

**Symptoms**: User not staying logged in, random logouts

**Common Causes**:

1. **JWT Token Expiry**
   ```bash
   # Check JWT_EXPIRES_IN in backend/.env
   JWT_EXPIRES_IN="7d"  # Increase if too short
   ```

2. **LocalStorage Not Persisting**
   ```typescript
   // Check browser console for storage errors
   // Verify token is being saved:
   console.log(localStorage.getItem('token'))
   ```

3. **Token Not Sent with Requests**
   ```typescript
   // Check API client has interceptor:
   api.interceptors.request.use(config => {
     const token = localStorage.getItem('token')
     if (token) {
       config.headers.Authorization = `Bearer ${token}`
     }
     return config
   })
   ```

#### Component Not Rendering/Updating

**Common Causes**:

1. **State Not Triggering Re-render**
   ```typescript
   // Bad: Mutating state directly
   items.push(newItem)  // Won't trigger re-render

   // Good: Create new array
   setItems([...items, newItem])  // Triggers re-render
   ```

2. **Missing Dependencies in useEffect**
   ```typescript
   // Add all dependencies
   useEffect(() => {
     fetchData()
   }, [userId, projectId])  // Don't forget dependencies!
   ```

3. **Conditional Rendering Logic**
   ```typescript
   // Check conditions are correct
   {user && <Component />}  // Only renders if user exists
   {loading ? <Spinner /> : <Content />}
   ```

---

### Database Issues

#### Migration Failed

**Symptoms**: Error when running `bun prisma migrate dev`

**Common Causes & Solutions**:

1. **Schema Syntax Error**
   ```bash
   # Check schema.prisma for typos
   # Run format to catch issues:
   bun prisma format

   # Validate schema:
   bun prisma validate
   ```

2. **Migration Conflicts**
   ```bash
   # Check migration status:
   bun prisma migrate status

   # If out of sync, options:

   # Option 1: Reset (dev only - DESTRUCTIVE!)
   bun prisma migrate reset
   bun seed

   # Option 2: Resolve manually
   bun prisma migrate resolve --applied <migration-name>
   bun prisma migrate deploy
   ```

3. **Database Already Has Conflicting Data**
   ```bash
   # Migration adding NOT NULL column to table with data

   # Solutions:
   # - Add default value to column
   # - Make column nullable
   # - Clear data first (dev only)
   ```

4. **Foreign Key Constraint Violations**
   ```bash
   # Check for:
   # - Orphaned records
   # - Wrong cascade behavior
   # - Missing indexes on FK columns
   ```

#### Prisma Studio Won't Open

**Solutions**:
```bash
# Port 5555 in use
netstat -ano | findstr :5555

# Database file locked (SQLite)
# Close all connections and try again

# Permission issues
chmod 644 backend/prisma/dev.db  # Unix
```

#### Database Queries Slow

**Diagnosis**:
```typescript
// Enable query logging
// backend/src/db/client.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

**Common Fixes**:
1. **Add Missing Indexes**
   ```prisma
   model User {
     id String @id
     email String @unique
     name String

     @@index([email])  // Add index for frequent queries
     @@index([createdAt])
   }
   ```

2. **Use Efficient Queries**
   ```typescript
   // Bad: Loading unnecessary data
   const users = await prisma.user.findMany()  // Gets all fields

   // Good: Select only needed fields
   const users = await prisma.user.findMany({
     select: { id: true, name: true }
   })
   ```

3. **Batch Operations**
   ```typescript
   // Bad: Multiple individual operations
   for (const item of items) {
     await prisma.item.create({ data: item })
   }

   // Good: Single batch operation
   await prisma.item.createMany({ data: items })
   ```

#### Data Integrity Issues

**Symptoms**: Inconsistent data, missing relations, orphaned records

**Diagnosis**:
```bash
# Open Prisma Studio and inspect data
bun prisma:studio

# Check for:
# - NULL values in required fields
# - Foreign keys pointing to non-existent records
# - Duplicate entries when should be unique
```

**Fixes**:
1. **Add Database Constraints**
   ```prisma
   model Video {
     projectId String
     project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
   }
   ```

2. **Use Transactions for Related Operations**
   ```typescript
   await prisma.$transaction(async (tx) => {
     const project = await tx.project.create({ data: {...} })
     await tx.video.create({
       data: { projectId: project.id, ... }
     })
   })
   ```

---

### Environment & Configuration

#### Environment Variables Not Loading

**Symptoms**: App behaves as if env vars are undefined

**Solutions**:
```bash
# 1. Check file location
ls -la backend/.env  # Must be in backend/ directory

# 2. Check file format (no quotes around values in Bun)
# Bad:
DATABASE_URL="file:./prisma/dev.db"

# Good:
DATABASE_URL=file:./prisma/dev.db

# 3. Restart server after changes
# Env vars are loaded on startup only

# 4. Check for typos in variable names
# Use exact names from env.ts validation
```

#### JWT Secret Validation Error

**Error**: `JWT_SECRET: String must contain at least 32 character(s)`

**Solution**:
```bash
# Generate secure secret
openssl rand -base64 32

# Update backend/.env
JWT_SECRET=<paste-generated-secret>

# Ensure NO spaces or quotes
```

#### HTTPS Required in Production

**Error**: `CORS_ORIGIN must use HTTPS in production`

**Solution**:
```bash
# Ensure all URLs use HTTPS in production:
CORS_ORIGIN=https://app.example.com
DUITKU_CALLBACK_URL=https://api.example.com/api/payment/callback
DUITKU_RETURN_URL=https://app.example.com/dashboard

# Set NODE_ENV correctly:
NODE_ENV=production
```

---

### Redis & Caching

#### Redis Connection Failed

**Error**: `Redis connection failed` or `ECONNREFUSED`

**Solutions**:

1. **Check Redis is Running**
   ```bash
   # Test connection
   redis-cli ping
   # Should return: PONG

   # Start Redis if not running:
   # Windows: Start redis-server.exe
   # Mac: brew services start redis
   # Linux: systemctl start redis
   ```

2. **Check Connection Settings**
   ```bash
   # In backend/.env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=  # Leave empty if no password
   ```

3. **Redis Not Required in Development**
   ```bash
   # App will use in-memory store
   # Warning message is normal in dev:
   # "⚠️  WARNING: Running without Redis"
   ```

4. **Production Redis Required**
   ```bash
   # In production, Redis is mandatory
   # App will exit if Redis unavailable
   # Configure properly or app won't start
   ```

#### Rate Limiting Not Working

**Symptoms**: Can make unlimited requests despite limits

**Diagnosis**:
```bash
# Check if Redis is connected
# Look for startup message:
# "✅ Redis connected successfully"

# Test rate limit:
# Make multiple rapid requests to /api/auth/login
# Should get 429 Too Many Requests after limit
```

**Fixes**:
1. Ensure Redis is running
2. Check rate limit configuration in backend/.env
3. Verify rate limiting middleware is applied to routes

---

### FFmpeg & Video Processing

#### FFmpeg Not Found

**Error**: `FFmpeg not found` or `spawn ffmpeg ENOENT`

**Solutions**:

1. **Install FFmpeg**
   ```bash
   # Check if installed
   ffmpeg -version

   # Windows: Download from ffmpeg.org and add to PATH
   # Mac:
   brew install ffmpeg

   # Linux:
   sudo apt-get update
   sudo apt-get install ffmpeg
   ```

2. **Configure FFmpeg Path**
   ```bash
   # If installed but not in PATH, set explicit path:
   # backend/.env
   FFMPEG_PATH=C:\path\to\ffmpeg.exe  # Windows
   FFMPEG_PATH=/usr/local/bin/ffmpeg  # Mac/Linux
   ```

3. **Verify Installation**
   ```bash
   ffmpeg -version
   ffprobe -version

   # Should show version info
   ```

#### Video Processing Fails

**Symptoms**: Generation status stuck on "processing" or "failed"

**Diagnosis**:
```bash
# Check worker logs
# Look for FFmpeg errors
# Common issues:
# - Invalid video format
# - Corrupted video file
# - Insufficient disk space
# - FFmpeg process killed
```

**Solutions**:

1. **Check Video Format**
   ```bash
   # Supported: MP4, MOV, AVI, WebM
   # Use ffprobe to check file:
   ffprobe video.mp4
   ```

2. **Check Disk Space**
   ```bash
   # Video processing needs temporary space
   df -h  # Unix
   # Ensure sufficient space in UPLOAD_PATH and OUTPUT_PATH
   ```

3. **Check File Permissions**
   ```bash
   # Ensure app can read/write to upload directories
   chmod 755 backend/uploads  # Unix
   ```

4. **Memory Issues**
   ```bash
   # Large videos may cause OOM
   # Increase Node memory limit:
   NODE_OPTIONS="--max-old-space-size=4096" bun dev:backend
   ```

#### FFmpeg Process Hangs

**Symptoms**: Video generation never completes

**Diagnosis**:
```bash
# Check for zombie FFmpeg processes
ps aux | grep ffmpeg  # Unix
tasklist | findstr ffmpeg  # Windows
```

**Solutions**:
1. Kill hung processes
2. Implement timeout in worker (see KNOWN_ISSUES.md)
3. Add progress monitoring
4. Set reasonable video duration limits

---

### Credit System

#### Credit Deduction Not Working

**Symptoms**: Credits not deducted after operations

**Diagnosis**:
```bash
# Check middleware order in routes
# Ensure deductCredits() before route handler
# Check for errors in backend logs
# Verify AppUsage records created
```

**Common Causes**:

1. **Middleware Order Incorrect**
   ```typescript
   // Wrong:
   routes.post('/generate', async (c) => {
     await deductCredits(...)  // Too late!
   })

   // Correct:
   routes.post(
     '/generate',
     authMiddleware,
     deductCredits(amount, 'action', 'app-id'),
     async (c) => {
       // Credits already deducted
     }
   )
   ```

2. **Missing recordCreditUsage() Call**
   ```typescript
   // After successful operation:
   const deduction = c.get('creditDeduction')
   await recordCreditUsage(
     userId,
     deduction.appId,
     deduction.action,
     deduction.amount
   )
   ```

3. **Error Handling Not Refunding Credits**
   ```typescript
   try {
     // Operation
     await recordCreditUsage(...)
   } catch (error) {
     // Refund credits on failure
     await refundCredits(userId, amount)
     throw error
   }
   ```

#### Negative Credit Balance

**Symptoms**: User has negative credits

**Cause**: Race condition in credit deduction (see KNOWN_ISSUES.md #1)

**Immediate Fix**:
```bash
# Manually fix in Prisma Studio
# Set balance to 0 or positive value

# Long-term fix: Implement atomic transactions
```

#### Credit Balance Inconsistent

**Diagnosis**:
```bash
# Compare credit transactions with actual balance
# Open Prisma Studio
# Check credits table for user
# Sum amount column
# Compare with current balance
```

**Fixes**:
1. Rebuild balance from transaction history
2. Implement transaction integrity checks
3. Add database constraints

---

### Build & Deployment

#### Frontend Build Fails

**Common Errors**:

1. **TypeScript Errors**
   ```bash
   # Check for type errors
   cd frontend
   bun run type-check

   # Fix reported errors
   # Common issues:
   # - Unused variables
   # - Type mismatches
   # - Missing imports
   ```

2. **Memory Issues**
   ```bash
   # Increase memory limit
   NODE_OPTIONS="--max-old-space-size=4096" bun run build
   ```

3. **Asset Loading Errors**
   ```typescript
   // Check vite.config.ts
   // Ensure correct base path
   export default defineConfig({
     base: '/',  // Or your deployment path
   })
   ```

#### Backend Build Fails

**Solutions**:
```bash
# Clean build artifacts
rm -rf backend/dist

# Regenerate Prisma Client
cd backend
bun prisma generate

# Rebuild
bun run build
```

#### Production Deployment Issues

**Common Problems**:

1. **Environment Variables Not Set**
   ```bash
   # Check all required vars are set in production
   # See ENVIRONMENT_VARIABLES.md for complete list
   ```

2. **Database Migrations Not Applied**
   ```bash
   # Apply migrations in production
   cd backend
   bun prisma migrate deploy
   ```

3. **Redis Not Configured**
   ```bash
   # Redis is REQUIRED in production
   # App will exit if not available
   # Configure REDIS_HOST and REDIS_PASSWORD
   ```

4. **HTTPS Not Configured**
   ```bash
   # All URLs must use HTTPS in production
   # Check CORS_ORIGIN, DUITKU_CALLBACK_URL, etc.
   ```

5. **File Upload Permissions**
   ```bash
   # Ensure upload directories exist and are writable
   mkdir -p /app/uploads /app/outputs
   chmod 755 /app/uploads /app/outputs
   ```

---

### General Debugging Tips

1. **Enable Verbose Logging**
   ```typescript
   // backend/src/db/client.ts
   const prisma = new PrismaClient({
     log: ['query', 'info', 'warn', 'error'],
   })
   ```

2. **Use Browser DevTools**
   ```
   - Network tab: Check API requests/responses
   - Console tab: Check for errors
   - Application tab: Check localStorage/cookies
   - Sources tab: Set breakpoints in code
   ```

3. **Check Logs Systematically**
   ```bash
   # Backend logs (terminal)
   # Frontend logs (browser console)
   # Database logs (Prisma Studio)
   # Redis logs (if applicable)
   ```

4. **Isolate the Problem**
   ```bash
   # Test components independently:
   # - Database connection
   # - API endpoints
   # - Frontend components
   # - External services (Redis, FFmpeg)
   ```

5. **Use Git Bisect for Regressions**
   ```bash
   # Find which commit introduced a bug
   git bisect start
   git bisect bad  # Current commit is bad
   git bisect good <last-known-good-commit>
   # Git will checkout commits to test
   ```

---

### Getting More Help

If issues persist after trying these solutions:

1. **Check Documentation**
   - [KNOWN_ISSUES.md](KNOWN_ISSUES.md) - Known bugs and security issues
   - [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Configuration reference
   - [API_REFERENCE.md](../api/README.md) - API documentation

2. **Gather Debug Information**
   ```bash
   # System info
   bun --version
   node --version
   ffmpeg -version

   # Check logs
   # Backend terminal output
   # Browser console output
   # Prisma Studio data

   # Environment
   cat backend/.env | grep -v SECRET | grep -v PASSWORD
   ```

3. **Create Minimal Reproduction**
   - Isolate the issue
   - Remove unrelated code
   - Document steps to reproduce

4. **Search Existing Issues**
   - Check GitHub issues
   - Search error messages
   - Look for similar problems

5. **Ask for Help**
   - Provide complete error messages
   - Include reproduction steps
   - Share relevant code snippets
   - Mention what you've already tried

---

## Best Practices

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Use ESLint & Prettier (if configured)
- Write descriptive variable names

### Security

- Never commit `.env` files
- Never log sensitive data
- Always use parameterized queries (Prisma handles this)
- Validate all user input

### Performance

- Use indexes on frequently queried fields
- Paginate large datasets
- Optimize images before upload
- Use React.memo() for expensive components

### Documentation

- Update CHANGELOG.md for significant changes
- Add JSDoc comments for complex functions
- Update architecture docs when adding major features
- Document breaking changes prominently

---

## Resources

### Documentation
- **[UI Standards](UI_STANDARDS.md)** - Header format, colors, typography (MUST READ!)
- **[Plugin Architecture](PLUGIN_ARCHITECTURE.md)** - How plugins work
- **[Redis Setup](REDIS_SETUP_GUIDE.md)** - Queue system setup

### External Libraries
- **Bun Docs:** https://bun.sh/docs
- **Hono Docs:** https://hono.dev
- **Prisma Docs:** https://www.prisma.io/docs
- **React Docs:** https://react.dev
- **TailwindCSS:** https://tailwindcss.com
- **Lucide Icons:** https://lucide.dev/icons

---

## Getting Help

1. Check existing documentation (docs/)
2. Review recent CHANGELOG.md
3. Search issues on GitHub
4. Ask team members
5. Create detailed bug report if issue persists

---

**Happy coding! 🚀**

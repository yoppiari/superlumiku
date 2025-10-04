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

### Backend Won't Start

```bash
# Check port 3000
netstat -ano | findstr :3000

# Kill process if needed (Windows)
taskkill /PID <PID> /F

# Regenerate Prisma client
cd backend && bun prisma generate

# Check environment variables
cat backend/.env
```

### Frontend Won't Start

```bash
# Check port 5173
netstat -ano | findstr :5173

# Clear cache and reinstall
cd frontend
rm -rf node_modules .vite
bun install
```

### Database Migration Errors

```bash
# Reset database (development only)
bun prisma migrate reset

# Check migration history
ls backend/prisma/migrations/

# Manually fix if needed
# Then: bun prisma migrate dev
```

### Plugin Not Showing on Dashboard

1. Check backend console for plugin load messages:
   ```
   ✅ Plugin registered: Video Mixer (video-mixer)
   📦 Loaded 1 plugins
   🔌 Mounted: Video Mixer at /api/apps/video-mixer
   ```

2. Verify plugin is enabled:
   ```typescript
   features: { enabled: true }
   ```

3. Check `/api/apps` endpoint:
   ```bash
   curl http://localhost:3000/api/apps
   ```

4. Check frontend console for errors

### Credit Deduction Not Working

1. Verify middleware order:
   ```typescript
   routes.post(
     '/action',
     authMiddleware,           // 1st
     deductCredits(...),       // 2nd
     async (c) => {            // 3rd
       // ... action
       await recordCreditUsage(...)  // After success
     }
   )
   ```

2. Check credit balance:
   ```bash
   curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/credits/balance
   ```

3. Verify AppUsage records created:
   - Open Prisma Studio
   - Check `app_usages` table

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

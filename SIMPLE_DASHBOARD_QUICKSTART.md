# Lumiku Simple Dashboard - Quick Start Guide

**For:** Developers implementing the redesign
**Time to read:** 5 minutes
**Time to implement:** 5-8 days

---

## TL;DR

User said dashboard is "not comfortable on smartphone." Solution: Show only 3-6 pinned apps instead of all 30+. Think iPhone home screen, not app store.

---

## What You Need to Know

### 1. The Core Change

**Before:**
- Dashboard shows ALL 30+ apps
- User must scroll to find their favorites

**After:**
- Dashboard shows ONLY pinned apps (3-6 max)
- All other apps in "Browse All Apps" modal
- User controls what they see

### 2. Key Features

```
✅ Star/Pin System (max 6 apps)
✅ Large, comfortable cards (200px+ height)
✅ Generous spacing (20-24px padding)
✅ Horizontal scroll stats (mobile)
✅ All Apps modal (search + filters)
```

### 3. Files to Review

```
📄 lumiku-simple-dashboard-2025.html
   → Open in browser, test on mobile (375px)

📄 SIMPLE_DASHBOARD_DESIGN_SYSTEM.md
   → Colors, typography, spacing, components

📄 SIMPLE_DASHBOARD_IMPLEMENTATION.md
   → Database, API, components, tests

📄 DASHBOARD_VISUAL_COMPARISON.md
   → Before/after comparison
```

---

## Implementation Checklist

### Phase 1: Database (Day 1-2)

**Step 1: Create Migration**

```sql
-- File: backend/migrations/XXXX_add_user_app_pins.sql

CREATE TABLE user_app_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id VARCHAR(100) NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pin_order INTEGER DEFAULT 0,
  UNIQUE(user_id, app_id)
);

-- Max 6 pins constraint
CREATE OR REPLACE FUNCTION check_max_pins()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_app_pins WHERE user_id = NEW.user_id) >= 6 THEN
    RAISE EXCEPTION 'User cannot pin more than 6 apps';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_pins_trigger
BEFORE INSERT ON user_app_pins
FOR EACH ROW
EXECUTE FUNCTION check_max_pins();

-- Seed default pins (4 popular apps)
INSERT INTO user_app_pins (user_id, app_id, pin_order)
SELECT u.id, 'avatar-creator', 1 FROM users u
ON CONFLICT DO NOTHING;
-- Repeat for 3 more apps
```

**Step 2: Run Migration**

```bash
cd backend
npm run migrate
# or
psql $DATABASE_URL -f migrations/XXXX_add_user_app_pins.sql
```

---

### Phase 2: Backend (Day 2-3)

**Step 1: Create User Preference Service**

```typescript
// File: backend/src/services/userPreference.service.ts

export const userPreferenceService = {
  async getPinnedApps(userId: string): Promise<string[]> {
    const result = await db.query(
      'SELECT app_id FROM user_app_pins WHERE user_id = $1 ORDER BY pin_order',
      [userId]
    )
    return result.rows.map(row => row.app_id)
  },

  async pinApp(userId: string, appId: string): Promise<void> {
    // Check max 6 pins
    const count = await db.query(
      'SELECT COUNT(*) FROM user_app_pins WHERE user_id = $1',
      [userId]
    )
    if (parseInt(count.rows[0].count) >= 6) {
      throw new AppError('Cannot pin more than 6 apps', 400)
    }

    // Insert
    await db.query(
      'INSERT INTO user_app_pins (user_id, app_id, pin_order) VALUES ($1, $2, $3)',
      [userId, appId, parseInt(count.rows[0].count)]
    )
  },

  async unpinApp(userId: string, appId: string): Promise<void> {
    await db.query(
      'DELETE FROM user_app_pins WHERE user_id = $1 AND app_id = $2',
      [userId, appId]
    )

    // Reorder remaining
    await db.query(
      `UPDATE user_app_pins SET pin_order = new_order.row_num - 1
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY pin_order) as row_num
         FROM user_app_pins WHERE user_id = $1
       ) as new_order
       WHERE user_app_pins.id = new_order.id`,
      [userId]
    )
  }
}
```

**Step 2: Add Dashboard Routes**

```typescript
// File: backend/src/routes/dashboard.routes.ts

const dashboardRouter = new Hono()

// Get all apps with pinned status
dashboardRouter.get('/apps', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const allApps = pluginRegistry.getDashboardApps()
  const pinnedIds = await userPreferenceService.getPinnedApps(userId)

  const apps = allApps.map(app => ({
    ...app,
    pinned: pinnedIds.includes(app.appId)
  }))

  return c.json({ apps })
})

// Get pinned apps only
dashboardRouter.get('/pinned', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const allApps = pluginRegistry.getDashboardApps()
  const pinnedIds = await userPreferenceService.getPinnedApps(userId)

  const apps = pinnedIds
    .map(id => allApps.find(a => a.appId === id))
    .filter(Boolean)
    .map(app => ({ ...app, pinned: true }))

  return c.json({ apps })
})

// Pin an app
dashboardRouter.post('/pin/:appId', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { appId } = c.req.param()
  await userPreferenceService.pinApp(userId, appId)
  return c.json({ success: true })
})

// Unpin an app
dashboardRouter.delete('/pin/:appId', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { appId } = c.req.param()
  await userPreferenceService.unpinApp(userId, appId)
  return c.json({ success: true })
})

export default dashboardRouter
```

**Step 3: Register Routes**

```typescript
// File: backend/src/app.ts
app.route('/api/dashboard', dashboardRouter)
```

---

### Phase 3: Frontend (Day 3-5)

**Step 1: Update Dashboard Service**

```typescript
// File: frontend/src/services/dashboardService.ts

export const dashboardService = {
  async getApps(): Promise<{ apps: DashboardApp[] }> {
    const response = await api.get('/api/dashboard/apps')
    return response.data
  },

  async getPinnedApps(): Promise<{ apps: DashboardApp[] }> {
    const response = await api.get('/api/dashboard/pinned')
    return response.data
  },

  async pinApp(appId: string): Promise<void> {
    await api.post(`/api/dashboard/pin/${appId}`)
  },

  async unpinApp(appId: string): Promise<void> {
    await api.delete(`/api/dashboard/pin/${appId}`)
  }
}
```

**Step 2: Create Pinned App Card**

```tsx
// File: frontend/src/components/dashboard/PinnedAppCard.tsx

interface PinnedAppCardProps {
  app: DashboardApp
  onClick: () => void
  onUnpin: () => void
}

export default function PinnedAppCard({ app, onClick, onUnpin }: PinnedAppCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative bg-white border-2 border-slate-200 rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:border-slate-900 hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      {/* Star Badge */}
      <button
        onClick={(e) => { e.stopPropagation(); onUnpin() }}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"
      >
        <Star className="w-4 h-4 fill-amber-500" />
      </button>

      {/* Icon */}
      <div className="w-18 h-18 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-purple-700" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold mb-2">{app.name}</h3>
      <p className="text-sm text-slate-600 mb-3">{app.description}</p>
      <div className="text-xs text-slate-500">{app.credits} credits</div>
    </div>
  )
}
```

**Step 3: Create All Apps Modal**

```tsx
// File: frontend/src/components/dashboard/AllAppsModal.tsx

export default function AllAppsModal({ onClose, onAppClick, onPinToggle }) {
  const [apps, setApps] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    dashboardService.getApps().then(({ apps }) => setApps(apps))
  }, [])

  const handlePinToggle = async (app) => {
    if (app.pinned) {
      await dashboardService.unpinApp(app.appId)
    } else {
      await dashboardService.pinApp(app.appId)
    }
    onPinToggle()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">All Apps</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <input
            type="search"
            placeholder="Search apps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {apps.filter(a => a.name.toLowerCase().includes(search.toLowerCase())).map(app => (
              <div
                key={app.appId}
                onClick={() => onAppClick(app.appId)}
                className={`p-6 border-2 rounded-xl cursor-pointer ${
                  app.pinned ? 'border-amber-400 bg-amber-50' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={e => { e.stopPropagation(); handlePinToggle(app) }}
                  className="float-right"
                >
                  <Star className={app.pinned ? 'fill-amber-500' : ''} />
                </button>
                <div className="text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="font-bold">{app.name}</h3>
                  <p className="text-sm text-slate-600">{app.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Update Dashboard Page**

```tsx
// File: frontend/src/pages/Dashboard.tsx

export default function Dashboard() {
  const [pinnedApps, setPinnedApps] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    dashboardService.getPinnedApps().then(({ apps }) => setPinnedApps(apps))
  }, [])

  const handleUnpin = async (appId) => {
    await dashboardService.unpinApp(appId)
    setPinnedApps(prev => prev.filter(a => a.appId !== appId))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header>{/* Header content */}</header>

      <main className="max-w-[1400px] mx-auto px-5 py-5">
        {/* Stats */}
        <section className="mb-10">
          <div className="flex gap-5 overflow-x-auto">
            <StatCard featured />
            <StatCard />
            <StatCard />
          </div>
        </section>

        {/* Pinned Apps */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              Pinned Apps <span className="text-xs bg-amber-100 px-2 py-1 rounded">{pinnedApps.length}</span>
            </h2>
            <button onClick={() => setShowModal(true)}>Manage</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pinnedApps.map(app => (
              <PinnedAppCard
                key={app.appId}
                app={app}
                onClick={() => navigate(`/apps/${app.appId}`)}
                onUnpin={() => handleUnpin(app.appId)}
              />
            ))}

            {/* Browse All Apps Card */}
            <div
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8 rounded-2xl min-h-[200px] flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="text-xl font-bold">Browse All Apps</div>
              <div className="text-sm">30 apps available</div>
            </div>
          </div>
        </section>

        {/* Recent Work */}
        <section>{/* Recent work content */}</section>
      </main>

      {/* Modal */}
      {showModal && (
        <AllAppsModal
          onClose={() => setShowModal(false)}
          onAppClick={appId => navigate(`/apps/${appId}`)}
          onPinToggle={() => {
            dashboardService.getPinnedApps().then(({ apps }) => setPinnedApps(apps))
          }}
        />
      )}
    </div>
  )
}
```

---

### Phase 4: Testing (Day 6-7)

**Unit Tests**

```typescript
// Backend
describe('userPreferenceService', () => {
  it('should pin an app', async () => {
    await userPreferenceService.pinApp('user-id', 'avatar-creator')
    const pins = await userPreferenceService.getPinnedApps('user-id')
    expect(pins).toContain('avatar-creator')
  })

  it('should not allow more than 6 pins', async () => {
    // Pin 6 apps
    for (let i = 0; i < 6; i++) {
      await userPreferenceService.pinApp('user-id', `app-${i}`)
    }
    // Try 7th
    await expect(
      userPreferenceService.pinApp('user-id', 'app-7')
    ).rejects.toThrow('Cannot pin more than 6 apps')
  })
})

// Frontend
describe('PinnedAppCard', () => {
  it('should call onUnpin when star clicked', () => {
    const onUnpin = jest.fn()
    render(<PinnedAppCard app={mockApp} onUnpin={onUnpin} />)
    fireEvent.click(screen.getByLabelText('Unpin'))
    expect(onUnpin).toHaveBeenCalled()
  })
})
```

**Manual Testing**

```bash
# Mobile Testing (Chrome DevTools)
1. Open dashboard
2. Resize to 375px width
3. Verify:
   - [ ] Cards are comfortable (not cramped)
   - [ ] Touch targets are 48px+
   - [ ] Stats scroll horizontally
   - [ ] Text is readable (16px)

# Pin/Unpin Testing
1. Click star on pinned app
2. Verify:
   - [ ] App removed from dashboard
   - [ ] Count badge decreases
   - [ ] Toast notification shown

# Modal Testing
1. Click "Browse All Apps"
2. Verify:
   - [ ] Modal opens
   - [ ] Search works
   - [ ] Can pin app (star turns gold)
   - [ ] Can unpin app
   - [ ] Cannot pin more than 6
   - [ ] Close button works
   - [ ] Click outside closes modal
```

---

### Phase 5: Deployment (Day 8)

**Step 1: Staging**

```bash
# Deploy to staging
git checkout -b feature/simple-dashboard
git add .
git commit -m "feat: Implement pin-first dashboard redesign"
git push origin feature/simple-dashboard

# Run migration on staging
psql $STAGING_DATABASE_URL -f migrations/XXXX_add_user_app_pins.sql

# Deploy
./deploy-staging.sh
```

**Step 2: QA Testing**

```
Checklist:
- [ ] Login works
- [ ] Pinned apps shown (defaults)
- [ ] Can pin/unpin
- [ ] Max 6 enforced
- [ ] Modal works
- [ ] Search works
- [ ] Mobile responsive
- [ ] Desktop responsive
- [ ] No console errors
- [ ] Performance good (< 2s load)
```

**Step 3: Production**

```bash
# Merge to main
git checkout main
git merge feature/simple-dashboard

# Run migration on production
psql $PRODUCTION_DATABASE_URL -f migrations/XXXX_add_user_app_pins.sql

# Deploy
./deploy-production.sh

# Monitor
- Check error logs
- Check analytics
- Monitor performance
- Watch user feedback
```

---

## Common Issues & Solutions

### Issue 1: Migration Fails

**Error:** "Table already exists"

**Solution:**
```sql
-- Check if table exists first
CREATE TABLE IF NOT EXISTS user_app_pins (...)
```

### Issue 2: Can't Pin More Apps

**Error:** "Cannot pin more than 6 apps"

**Solution:** This is expected! Check current pin count:
```sql
SELECT COUNT(*) FROM user_app_pins WHERE user_id = 'xxx';
```

### Issue 3: Cards Look Cramped on Mobile

**Solution:** Check Tailwind classes:
```tsx
// Make sure you have:
className="p-6"           // 24px padding
className="min-h-[200px]" // Minimum height
className="gap-5"         // 20px gap
```

### Issue 4: Modal Not Closing

**Solution:** Check click handlers:
```tsx
// Overlay should close
<div onClick={onClose}>
  {/* Modal should NOT close */}
  <div onClick={e => e.stopPropagation()}>
    ...
  </div>
</div>
```

---

## Key Design Decisions

### Why max 6 pinned apps?

- iPhone home screen: 24 apps per page (too many)
- Research: Users use 5-7 apps 80% of the time
- Balance: Enough for variety, not too many to be overwhelming

### Why horizontal scroll for stats?

- Mobile screen width is limited
- Vertical space is cheaper than horizontal
- Swipe gesture is natural on mobile
- Desktop can show all (no scroll)

### Why modal instead of separate page?

- Faster: No page navigation
- Context: Stay on dashboard
- Discovery: Browse without leaving
- Modern: Matches iOS/Android patterns

---

## Performance Checklist

```
Backend:
- [ ] Database indexes on user_id
- [ ] Query optimization (join vs multiple queries)
- [ ] Cache pinned apps (Redis)
- [ ] Rate limiting on pin/unpin

Frontend:
- [ ] Image lazy loading
- [ ] Component memoization (React.memo)
- [ ] Debounce search input
- [ ] Optimistic updates
- [ ] Local storage caching

Both:
- [ ] Gzip compression
- [ ] CDN for assets
- [ ] Bundle size < 500KB
- [ ] First paint < 1s
- [ ] Time to interactive < 2s
```

---

## Accessibility Checklist

```
- [ ] Semantic HTML (<header>, <main>, <button>)
- [ ] ARIA labels (aria-label="Unpin")
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus visible (outline on :focus-visible)
- [ ] Screen reader tested (NVDA/JAWS)
- [ ] Color contrast WCAG AA (4.5:1)
- [ ] Touch targets 48px+ (mobile)
- [ ] Reduced motion supported (@media)
```

---

## Analytics to Track

```javascript
// Track these events
analytics.track('dashboard_viewed', {
  pinnedApps: pinnedApps.length,
  deviceType: 'mobile' | 'desktop'
})

analytics.track('app_pinned', {
  appId: app.appId,
  pinnedCount: newCount,
  source: 'dashboard' | 'modal'
})

analytics.track('app_unpinned', {
  appId: app.appId,
  pinnedCount: newCount
})

analytics.track('all_apps_modal_opened', {
  source: 'browse_button' | 'manage_button'
})

analytics.track('app_search', {
  query: searchQuery,
  resultsCount: filteredApps.length
})
```

---

## Questions?

### Design Questions
→ Check `SIMPLE_DASHBOARD_DESIGN_SYSTEM.md`

### Implementation Questions
→ Check `SIMPLE_DASHBOARD_IMPLEMENTATION.md`

### Visual Reference
→ Check `DASHBOARD_VISUAL_COMPARISON.md`

### Try It Out
→ Open `lumiku-simple-dashboard-2025.html`

---

## Success Metrics

After deployment, track:

```
User Satisfaction:
- Mobile comfort rating: Target 8+/10 (was 4-5)
- Dashboard simplicity: Target "Simple" (was "Cluttered")
- Pin system understanding: Target 100% (first-time use)

Engagement:
- Apps opened from dashboard: Increase 30%+
- Pin/unpin actions per user: > 0 (new feature)
- All Apps modal open rate: Track

Performance:
- Dashboard load time: < 2s (p95)
- Mobile layout shift (CLS): < 0.1
- Time to interactive: < 2s
```

---

**Ready to Start?**

1. ✅ Review HTML prototype (mobile view!)
2. ✅ Read design system
3. ✅ Start with database migration
4. ✅ Build backend first
5. ✅ Then frontend
6. ✅ Test thoroughly
7. ✅ Deploy carefully

**Estimated Total Time:** 5-8 days for experienced developer

---

**Need Help?**
- Slack: #lumiku-redesign
- Email: dev@lumiku.com
- Docs: See files listed above

**Good luck! 🚀**

# UnifiedHeader Development Standards

## Table of Contents
- [Quick Reference](#quick-reference)
- [When to Use UnifiedHeader](#when-to-use-unifiedheader)
- [Required vs Optional Props](#required-vs-optional-props)
- [Color Scheme Standards](#color-scheme-standards)
- [Implementation Examples](#implementation-examples)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)
- [Anti-Patterns](#anti-patterns)
- [Testing Checklist](#testing-checklist)

---

## Quick Reference

**RULE: Every app in Lumiku MUST use UnifiedHeader. No exceptions.**

```tsx
import UnifiedHeader from '../components/UnifiedHeader'
import { YourIcon } from 'lucide-react'

<UnifiedHeader
  title="Your App Name"
  subtitle="Brief description (optional)"
  icon={<YourIcon className="w-5 h-5" />}
  iconColor="bg-[color]-50 text-[color]-700"
  showBackButton={true}
  backPath="/dashboard"
  currentAppId="your-app-id"
  actions={null}
/>
```

---

## When to Use UnifiedHeader

### ✅ ALWAYS Use UnifiedHeader For:

1. **All App Main Views**
   - Avatar Creator main page
   - Pose Generator dashboard
   - Video Mixer workspace
   - Any new app you create

2. **Project Detail Views**
   - When viewing a specific project
   - When editing within an app
   - Any nested view that needs navigation

3. **App List Views**
   - When showing a list of projects
   - When displaying app content collections

### ❌ NEVER Use Custom Headers For:

1. Apps within the Lumiku ecosystem
2. Any page that needs dashboard navigation
3. Any view that requires credit display
4. Any page with app switching functionality

### ⚠️ Exceptions (Rare):

- Modal dialogs (they overlay the header)
- Embedded components (within an app that already has UnifiedHeader)
- Print/export views (header-less by design)

---

## Required vs Optional Props

### Required Props

These props MUST be provided for every implementation:

| Prop | Type | Description | Example |
|------|------|-------------|---------|
| `title` | `string` | App or view title | `"Avatar Creator"` |
| `icon` | `React.ReactNode` | Icon component from lucide-react | `<UserCircle className="w-5 h-5" />` |
| `currentAppId` | `string` | App identifier for switcher highlighting | `"avatar-creator"` |

### Optional Props (With Recommended Defaults)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `subtitle` | `string` | `undefined` | Brief description under title |
| `iconColor` | `string` | `"bg-blue-50 text-blue-700"` | Tailwind classes for icon background |
| `showBackButton` | `boolean` | `true` | Show/hide back arrow button |
| `backPath` | `string` | `"/dashboard"` | Custom navigation path for back button |
| `actions` | `React.ReactNode` | `null` | Custom action buttons (rarely used) |

### Prop Guidelines

**Title:**
- Use the app's display name
- Can be dynamic (e.g., project name in detail view)
- Keep it concise (1-3 words ideal)

**Subtitle:**
- Optional but recommended for clarity
- Provide context about current view
- Keep under 50 characters

**Icon:**
- ALWAYS use exact size: `className="w-5 h-5"`
- Import from `lucide-react`
- Match the app's theme/purpose

**currentAppId:**
- Must match the app ID in `AVAILABLE_APPS` array
- Use kebab-case: `"avatar-creator"`, `"pose-generator"`
- This enables correct highlighting in app switcher

---

## Color Scheme Standards

### Standard Color Mappings by App Type

Use these standardized color combinations for consistency:

| App Category | Icon Color Classes | Usage Example |
|--------------|-------------------|---------------|
| **Avatar/Character Apps** | `bg-purple-50 text-purple-700` | Avatar Creator |
| **AI Generation Apps** | `bg-indigo-50 text-indigo-700` | Pose Generator, AI Image tools |
| **Video/Media Apps** | `bg-blue-50 text-blue-700` | Video Mixer, Carousel Mix |
| **Editing Apps** | `bg-green-50 text-green-700` | Poster Editor, Image Editor |
| **Background/Utility Apps** | `bg-orange-50 text-orange-700` | Background Remover |
| **Analytics/Report Apps** | `bg-slate-50 text-slate-700` | Dashboard, Reports |

### Color Selection Rules

1. **Consistency First**: If your app is similar to an existing app, use the same color family
2. **Contrast Required**: Always use 50-weight background with 700-weight text for accessibility
3. **Avoid Conflicts**: Don't use colors that are too similar to existing apps
4. **Brand Alignment**: Consider Lumiku's primary brand colors (purple, blue, indigo)

### Color Customization Example

```tsx
// Good: Clear category alignment
<UnifiedHeader
  iconColor="bg-purple-50 text-purple-700"  // Avatar-related app
  // ...
/>

// Good: New category with distinct color
<UnifiedHeader
  iconColor="bg-rose-50 text-rose-700"  // New social media app
  // ...
/>

// Bad: Poor contrast
<UnifiedHeader
  iconColor="bg-purple-900 text-purple-300"  // Too dark, hard to read
  // ...
/>
```

---

## Implementation Examples

### Example 1: Simple App List View

```tsx
import UnifiedHeader from '../components/UnifiedHeader'
import { Sparkles } from 'lucide-react'

export default function MyNewApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader
        title="My New App"
        subtitle="Create amazing content"
        icon={<Sparkles className="w-5 h-5" />}
        iconColor="bg-indigo-50 text-indigo-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="my-new-app"
        actions={null}
      />

      {/* Your app content */}
    </div>
  )
}
```

### Example 2: Project Detail View with Dynamic Title

```tsx
import { useParams, useNavigate } from 'react-router-dom'
import UnifiedHeader from '../components/UnifiedHeader'
import { FolderOpen } from 'lucide-react'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)

  // ... load project data

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader
        title={project?.name || 'Project'}
        subtitle={project?.description}
        icon={<FolderOpen className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        backPath="/apps/my-app"  // Back to app list
        currentAppId="my-app"
        actions={null}
      />

      {/* Project content */}
    </div>
  )
}
```

### Example 3: Header with Custom Actions (Advanced)

```tsx
import UnifiedHeader from '../components/UnifiedHeader'
import { Settings, Download } from 'lucide-react'

export default function AdvancedApp() {
  const customActions = (
    <>
      <button
        onClick={() => handleExport()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
      <button
        onClick={() => openSettings()}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Settings className="w-5 h-5 text-slate-600" />
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader
        title="Advanced App"
        icon={<Settings className="w-5 h-5" />}
        iconColor="bg-green-50 text-green-700"
        showBackButton={true}
        currentAppId="advanced-app"
        actions={customActions}  // Custom actions provided
      />

      {/* App content */}
    </div>
  )
}
```

### Example 4: Sub-Navigation with UnifiedHeader

```tsx
import { useLocation, useNavigate } from 'react-router-dom'
import UnifiedHeader from '../components/UnifiedHeader'
import { Layers } from 'lucide-react'

export default function AppWithTabs() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Header */}
      <UnifiedHeader
        title="Multi-View App"
        subtitle="Organize your content"
        icon={<Layers className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        currentAppId="multi-view-app"
        actions={null}
      />

      {/* Sub-Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-[73px] z-40">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-2 py-3">
            <button
              onClick={() => navigate('/apps/multi-view-app/dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.includes('/dashboard')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/apps/multi-view-app/library')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.includes('/library')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Library
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
    </div>
  )
}
```

---

## Common Mistakes to Avoid

### 1. Incorrect Icon Size

❌ **Wrong:**
```tsx
<UnifiedHeader
  icon={<UserCircle className="w-6 h-6" />}  // Wrong size
  // ...
/>
```

✅ **Correct:**
```tsx
<UnifiedHeader
  icon={<UserCircle className="w-5 h-5" />}  // Standard size
  // ...
/>
```

### 2. Missing currentAppId

❌ **Wrong:**
```tsx
<UnifiedHeader
  title="My App"
  icon={<Sparkles className="w-5 h-5" />}
  // Missing currentAppId - app switcher won't highlight correctly
/>
```

✅ **Correct:**
```tsx
<UnifiedHeader
  title="My App"
  icon={<Sparkles className="w-5 h-5" />}
  currentAppId="my-app"
/>
```

### 3. Hardcoding Dashboard in App List View

❌ **Wrong:**
```tsx
// In projects list view
<UnifiedHeader
  title="My Projects"
  backPath="/dashboard"  // Always goes to dashboard
/>
```

✅ **Correct:**
```tsx
// In projects list view
<UnifiedHeader
  title="My Projects"
  backPath="/dashboard"  // Correct - this IS the main app view
/>

// In project detail view
<UnifiedHeader
  title={project.name}
  backPath="/apps/my-app"  // Back to projects list, not dashboard
/>
```

### 4. Wrong Color Contrast

❌ **Wrong:**
```tsx
<UnifiedHeader
  iconColor="bg-blue-500 text-blue-900"  // Poor contrast
/>
```

✅ **Correct:**
```tsx
<UnifiedHeader
  iconColor="bg-blue-50 text-blue-700"  // Good contrast, accessible
/>
```

### 5. Inconsistent Spacing/Layout

❌ **Wrong:**
```tsx
<div className="min-h-screen">  // No background color
  <UnifiedHeader {...props} />
  <div className="p-2">  // Inconsistent padding
    {/* Content */}
  </div>
</div>
```

✅ **Correct:**
```tsx
<div className="min-h-screen bg-gray-50">  // Standard background
  <UnifiedHeader {...props} />
  <div className="max-w-7xl mx-auto px-6 md:px-10 py-6">  // Standard container
    {/* Content */}
  </div>
</div>
```

### 6. Passing undefined for Optional Props

❌ **Wrong:**
```tsx
<UnifiedHeader
  subtitle={undefined}  // Don't explicitly pass undefined
  actions={undefined}
/>
```

✅ **Correct:**
```tsx
<UnifiedHeader
  // Simply omit optional props if not needed
/>
```

---

## Anti-Patterns

### Anti-Pattern 1: Creating Custom Header Components

❌ **NEVER DO THIS:**
```tsx
// DON'T create custom header components for apps
export function MyAppHeader() {
  return (
    <header className="bg-white border-b">
      <div className="flex items-center justify-between p-4">
        <h1>My App</h1>
        <button>Back</button>
      </div>
    </header>
  )
}
```

✅ **DO THIS:**
```tsx
// ALWAYS use UnifiedHeader
import UnifiedHeader from '../components/UnifiedHeader'

<UnifiedHeader
  title="My App"
  icon={<Icon className="w-5 h-5" />}
  currentAppId="my-app"
  showBackButton={true}
/>
```

**Why?** Custom headers break the unified experience, don't include credit display, app switcher, or profile dropdown.

### Anti-Pattern 2: Duplicating Header Logic

❌ **NEVER DO THIS:**
```tsx
export function MyApp() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div>
      <header>
        <button onClick={() => navigate('/dashboard')}>Back</button>
        <h1>My App</h1>
        <div>Credits: {user?.creditBalance}</div>
      </header>
    </div>
  )
}
```

✅ **DO THIS:**
```tsx
export function MyApp() {
  return (
    <div>
      <UnifiedHeader
        title="My App"
        icon={<Icon className="w-5 h-5" />}
        currentAppId="my-app"
      />
      {/* Header handles navigation, credits, everything */}
    </div>
  )
}
```

**Why?** UnifiedHeader already handles all navigation, credit display, and user interactions. Don't reinvent the wheel.

### Anti-Pattern 3: Conditional Header Rendering

❌ **NEVER DO THIS:**
```tsx
export function MyApp() {
  const [showHeader, setShowHeader] = useState(true)

  return (
    <div>
      {showHeader && <UnifiedHeader {...props} />}
      {/* Header should ALWAYS be present */}
    </div>
  )
}
```

✅ **DO THIS:**
```tsx
export function MyApp() {
  return (
    <div>
      <UnifiedHeader {...props} />
      {/* Header is always visible - use sticky positioning if needed */}
    </div>
  )
}
```

**Why?** The header provides critical navigation and context. Users should always be able to access it.

### Anti-Pattern 4: Inline Styles on Header

❌ **NEVER DO THIS:**
```tsx
<UnifiedHeader
  style={{ backgroundColor: 'red' }}  // Don't use inline styles
  className="my-custom-class"  // Don't override with custom classes
  {...props}
/>
```

✅ **DO THIS:**
```tsx
<UnifiedHeader
  {...props}
  // Use only the provided props - no style overrides
/>
```

**Why?** UnifiedHeader styles are carefully designed for consistency. Overriding them breaks the design system.

### Anti-Pattern 5: Nested Headers

❌ **NEVER DO THIS:**
```tsx
export function ParentApp() {
  return (
    <div>
      <UnifiedHeader title="Parent" {...props} />
      <ChildComponent />
    </div>
  )
}

function ChildComponent() {
  return (
    <div>
      <UnifiedHeader title="Child" {...otherProps} />  // Don't nest headers
      {/* Content */}
    </div>
  )
}
```

✅ **DO THIS:**
```tsx
export function ParentApp() {
  const [currentView, setCurrentView] = useState('main')

  return (
    <div>
      <UnifiedHeader
        title={currentView === 'main' ? 'Parent' : 'Child'}
        {...props}
      />
      {currentView === 'main' ? <MainView /> : <ChildView />}
    </div>
  )
}
```

**Why?** Only one header should exist per view. Use dynamic props to change header content.

---

## Testing Checklist

Before deploying any app with UnifiedHeader, verify:

### Visual Testing
- [ ] Header displays correctly on desktop (1920px+)
- [ ] Header displays correctly on tablet (768px - 1024px)
- [ ] Header displays correctly on mobile (375px - 767px)
- [ ] Icon is properly sized and colored
- [ ] Title and subtitle are readable and not truncated
- [ ] Credit balance displays correctly
- [ ] Profile dropdown appears and functions

### Functional Testing
- [ ] Back button navigates to correct path
- [ ] Dashboard (home) button goes to `/dashboard`
- [ ] App switcher dropdown opens/closes properly
- [ ] Current app is highlighted in app switcher
- [ ] Credits link navigates to `/credits` page
- [ ] Profile dropdown shows user info and logout

### Responsive Testing
- [ ] App switcher is hidden on mobile (< 768px)
- [ ] Credits display adapts on mobile (shows number only)
- [ ] Header content stacks properly on small screens
- [ ] All buttons remain accessible on touch devices

### Accessibility Testing
- [ ] All buttons have proper `aria-label` attributes
- [ ] Color contrast meets WCAG AA standards (4.5:1 minimum)
- [ ] Header is keyboard navigable (tab through all buttons)
- [ ] Focus indicators are visible

### Integration Testing
- [ ] Credit balance updates after purchases
- [ ] App switcher shows all available apps
- [ ] Navigation doesn't cause state loss
- [ ] Header persists across app views (if using sub-routes)

### Code Quality
- [ ] All required props are provided
- [ ] TypeScript types are correct (no `any` types)
- [ ] No console errors or warnings
- [ ] Component follows naming conventions
- [ ] Code is properly formatted and linted

---

## Additional Resources

- **Component Source**: `frontend/src/components/UnifiedHeader.tsx`
- **Example Implementations**:
  - `frontend/src/apps/AvatarCreator.tsx`
  - `frontend/src/apps/pose-generator/index.tsx`
  - `frontend/src/apps/VideoMixer.tsx`
  - `frontend/src/apps/CarouselMix.tsx`
- **Design System**: [Link to design documentation]
- **Icon Library**: [Lucide React Icons](https://lucide.dev/icons)

---

## Support

If you have questions about implementing UnifiedHeader:
1. Review this documentation thoroughly
2. Check existing implementations in the codebase
3. Ask in the #frontend-dev Slack channel
4. Contact the UI/UX team for design decisions

---

**Last Updated**: 2025-01-17
**Maintained By**: Lumiku Frontend Team
**Version**: 1.0.0

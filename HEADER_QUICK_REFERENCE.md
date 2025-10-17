# UnifiedHeader Quick Reference

> **TL;DR**: Copy-paste templates for instant implementation. No excuses for not using UnifiedHeader!

## 30-Second Implementation

### Step 1: Copy This
```tsx
import UnifiedHeader from '../components/UnifiedHeader'
import { Sparkles } from 'lucide-react'  // Pick any icon
```

### Step 2: Paste This in Your Component
```tsx
<UnifiedHeader
  title="Your App Name"
  subtitle="Optional description"
  icon={<Sparkles className="w-5 h-5" />}
  iconColor="bg-blue-50 text-blue-700"
  showBackButton={true}
  backPath="/dashboard"
  currentAppId="your-app-id"
  actions={null}
/>
```

### Step 3: Done! ✅

---

## Color Picker

Just copy the right color for your app type:

```tsx
// Avatar/Character apps
iconColor="bg-purple-50 text-purple-700"

// AI Generation apps
iconColor="bg-indigo-50 text-indigo-700"

// Video/Media apps
iconColor="bg-blue-50 text-blue-700"

// Editing apps
iconColor="bg-green-50 text-green-700"

// Background/Utility apps
iconColor="bg-orange-50 text-orange-700"

// Analytics apps
iconColor="bg-slate-50 text-slate-700"
```

---

## Icon Library

Popular icons from [lucide-react](https://lucide.dev):

```tsx
import {
  UserCircle,    // Avatar apps
  Sparkles,      // AI generation
  Video,         // Video apps
  Image,         // Image apps
  Layers,        // Carousel/layers
  Wand2,         // Magic/AI tools
  Camera,        // Photo apps
  Film,          // Video editing
  Palette,       // Design tools
  Zap,           // Fast/powerful tools
  TrendingUp,    // Analytics
  Settings,      // Configuration
} from 'lucide-react'

// Use like this:
icon={<Sparkles className="w-5 h-5" />}
```

---

## Common Patterns

### Pattern: App List View
```tsx
<UnifiedHeader
  title="My App"
  subtitle="Brief description"
  icon={<Icon className="w-5 h-5" />}
  iconColor="bg-blue-50 text-blue-700"
  showBackButton={true}
  backPath="/dashboard"              // ← Goes to dashboard
  currentAppId="my-app"
  actions={null}
/>
```

### Pattern: Project Detail View
```tsx
<UnifiedHeader
  title={project.name}                // ← Dynamic title
  subtitle={project.description}      // ← Dynamic subtitle
  icon={<Icon className="w-5 h-5" />}
  iconColor="bg-blue-50 text-blue-700"
  showBackButton={true}
  backPath="/apps/my-app"             // ← Goes back to app list
  currentAppId="my-app"
  actions={null}
/>
```

### Pattern: With Custom Actions
```tsx
const actions = (
  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
    Export
  </button>
)

<UnifiedHeader
  title="My App"
  icon={<Icon className="w-5 h-5" />}
  iconColor="bg-blue-50 text-blue-700"
  currentAppId="my-app"
  actions={actions}                   // ← Custom button
/>
```

---

## Complete Starter Template

Copy this entire file structure:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import UnifiedHeader from '../components/UnifiedHeader'
import { Sparkles, Plus, Trash2 } from 'lucide-react'

export default function MyApp() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)

  // Load project if URL has ID
  useEffect(() => {
    if (projectId) {
      // Load project detail
      setCurrentProject({ id: projectId, name: 'Project Name' })
    } else {
      setCurrentProject(null)
    }
  }, [projectId])

  // Project Detail View
  if (currentProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedHeader
          title={currentProject.name}
          icon={<Sparkles className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-700"
          showBackButton={true}
          backPath="/apps/my-app"
          currentAppId="my-app"
          actions={null}
        />
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Your project content */}
        </div>
      </div>
    )
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader
        title="My App"
        subtitle="Create amazing things"
        icon={<Sparkles className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="my-app"
        actions={null}
      />
      <div className="max-w-6xl mx-auto p-8">
        {/* Your projects list */}
      </div>
    </div>
  )
}
```

---

## Do's and Don'ts

### ✅ DO
- Use `w-5 h-5` for icon size
- Use 50/700 color weights (`bg-blue-50 text-blue-700`)
- Set `currentAppId` to match app ID
- Use `backPath="/dashboard"` for main app view
- Use `backPath="/apps/my-app"` for detail views

### ❌ DON'T
- Create custom headers
- Use wrong icon size (`w-6 h-6` ❌)
- Use wrong color weights (`bg-blue-100 text-blue-500` ❌)
- Forget `currentAppId` prop
- Override header styles with className

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App switcher doesn't highlight my app | Check `currentAppId` matches ID in `AVAILABLE_APPS` |
| Back button goes to wrong page | Use `/dashboard` for main view, `/apps/my-app` for detail |
| Colors look wrong | Use exact format: `bg-[color]-50 text-[color]-700` |
| Icon is wrong size | Must be `className="w-5 h-5"` exactly |
| Header not showing | Import from `../components/UnifiedHeader` |

---

## Testing Checklist

Before submitting PR:
- [ ] Header displays on desktop
- [ ] Header displays on mobile
- [ ] Back button works
- [ ] App switcher highlights current app
- [ ] Credits display correctly
- [ ] Profile dropdown works

---

## Next Steps

1. ✅ Copy template above
2. ✅ Replace placeholders with your app name
3. ✅ Pick the right color
4. ✅ Choose an icon
5. ✅ Test on mobile
6. ✅ Submit PR

**Need more details?** See:
- [Complete Standards](./HEADER_DEVELOPMENT_STANDARDS.md)
- [Full Template](./NEW_APP_TEMPLATE.md)
- [Contributing Guide](./CONTRIBUTING.md)

---

**Last Updated**: 2025-01-17
**Quick Reference Version**: 1.0.0

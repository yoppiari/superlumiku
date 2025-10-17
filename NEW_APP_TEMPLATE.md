# New App Template

This template provides a complete starting point for creating new apps in the Lumiku ecosystem with UnifiedHeader properly integrated from the start.

## Table of Contents
- [Quick Start](#quick-start)
- [File Structure](#file-structure)
- [Complete Template Code](#complete-template-code)
- [Customization Guide](#customization-guide)
- [Next Steps](#next-steps)

---

## Quick Start

### Step 1: Copy the Template

Create your new app file at:
```
frontend/src/apps/YourAppName.tsx
```

### Step 2: Replace Placeholders

Search and replace these values:
- `YourAppName` → Your app name in PascalCase (e.g., `ContentMixer`)
- `your-app-name` → Your app ID in kebab-case (e.g., `content-mixer`)
- `Your App Display Name` → Human-readable name (e.g., `Content Mixer`)
- `Brief app description` → Short description of what your app does
- `YourIcon` → Lucide icon name (e.g., `Sparkles`, `Image`, `Video`)

### Step 3: Choose Your Color

Pick a color from the [Color Scheme Standards](./HEADER_DEVELOPMENT_STANDARDS.md#color-scheme-standards):
- Purple: Avatar/Character apps
- Indigo: AI Generation apps
- Blue: Video/Media apps
- Green: Editing apps
- Orange: Background/Utility apps

### Step 4: Add to Router

Add your app route in `frontend/src/App.tsx`:
```tsx
import YourAppName from './apps/YourAppName'

// In your routes
<Route path="/apps/your-app-name/*" element={<YourAppName />} />
```

---

## File Structure

Your app should follow this structure:

```
frontend/src/apps/
├── YourAppName.tsx                 # Main app component (use this template)
└── your-app-name/                  # Optional: complex apps
    ├── components/                 # App-specific components
    │   ├── ProjectCard.tsx
    │   └── SettingsPanel.tsx
    ├── pages/                      # Sub-pages if using routing
    │   ├── DashboardPage.tsx
    │   └── LibraryPage.tsx
    └── utils/                      # App-specific utilities
        └── helpers.ts
```

---

## Complete Template Code

### Template 1: Simple App with Project List

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import UnifiedHeader from '../components/UnifiedHeader'
import CreateProjectModal from '../components/CreateProjectModal'
import { YourIcon, Plus, Trash2, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

// Types
interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  // Add your specific fields here
  items: any[]
}

export default function YourAppName() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { user } = useAuthStore()

  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load project if projectId is in URL
  useEffect(() => {
    if (projectId) {
      selectProject(projectId)
    } else {
      setCurrentProject(null)
    }
  }, [projectId])

  const loadProjects = async () => {
    try {
      // TODO: Replace with your API call
      // const response = await api.get('/api/apps/your-app-name/projects')
      // setProjects(response.data.projects)
      setProjects([]) // Placeholder
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const selectProject = async (id: string) => {
    try {
      // TODO: Replace with your API call
      // const response = await api.get(`/api/apps/your-app-name/projects/${id}`)
      // setCurrentProject(response.data.project)
      const project = projects.find(p => p.id === id)
      setCurrentProject(project || null)
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      // TODO: Replace with your API call
      // const response = await api.post('/api/apps/your-app-name/projects', { name, description })
      // const newProject = response.data.project
      const newProject: Project = {
        id: Date.now().toString(),
        name,
        description,
        createdAt: new Date().toISOString(),
        items: [],
      }
      setProjects([newProject, ...projects])
      navigate(`/apps/your-app-name/${newProject.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project')
    }
  }

  const handleDeleteProject = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    try {
      // TODO: Replace with your API call
      // await api.delete(`/api/apps/your-app-name/projects/${id}`)
      setProjects(projects.filter(p => p.id !== id))
      if (currentProject?.id === id) {
        navigate('/apps/your-app-name')
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project')
    }
  }

  // Loading state
  if (isLoadingProjects) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Project Detail View
  if (currentProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* UnifiedHeader for Project Detail */}
        <UnifiedHeader
          title={currentProject.name}
          subtitle={currentProject.description}
          icon={<YourIcon className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-700"
          showBackButton={true}
          backPath="/apps/your-app-name"
          currentAppId="your-app-name"
          actions={null}
        />

        {/* Project Content */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Project Details
            </h2>

            {/* TODO: Add your project-specific content here */}
            <div className="text-center py-12 text-gray-500">
              <YourIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>Add your project content here</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* UnifiedHeader for App Main View */}
      <UnifiedHeader
        title="Your App Display Name"
        subtitle="Brief app description"
        icon={<YourIcon className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="your-app-name"
        actions={null}
      />

      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* New Project Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <YourIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No projects yet</p>
              <p className="text-gray-400 text-sm">
                Create your first project to get started
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all relative group"
              >
                <div
                  onClick={() => navigate(`/apps/your-app-name/${project.id}`)}
                  className="cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{project.items.length} items</span>
                    <span className="text-xs">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteProject(project.id, project.name)
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}
```

### Template 2: App with Sub-Navigation (Advanced)

```tsx
import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { YourIcon } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import UnifiedHeader from '../components/UnifiedHeader'

// Import your sub-pages
import DashboardPage from './your-app-name/pages/DashboardPage'
import LibraryPage from './your-app-name/pages/LibraryPage'
import SettingsPage from './your-app-name/pages/SettingsPage'

export default function YourAppName() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  const isRootPath = location.pathname === '/apps/your-app-name'
    || location.pathname === '/apps/your-app-name/'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Unified Header */}
      <UnifiedHeader
        title="Your App Display Name"
        subtitle="Brief app description"
        icon={<YourIcon className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="your-app-name"
        actions={null}
      />

      {/* Sub-Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-[73px] z-40">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-2 py-3">
            <button
              onClick={() => navigate('/apps/your-app-name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRootPath
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/apps/your-app-name/library')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.includes('/library')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Library
            </button>
            <button
              onClick={() => navigate('/apps/your-app-name/settings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.includes('/settings')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
```

### Template 3: Minimal Single-Page App

```tsx
import UnifiedHeader from '../components/UnifiedHeader'
import { YourIcon } from 'lucide-react'

export default function YourAppName() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader
        title="Your App Display Name"
        subtitle="Brief app description"
        icon={<YourIcon className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="your-app-name"
        actions={null}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {/* Your app content */}
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Welcome to Your App
          </h2>
          <p className="text-slate-600">
            Start building your app features here.
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## Customization Guide

### 1. Update App Metadata

Edit the `AVAILABLE_APPS` array in `UnifiedHeader.tsx`:

```tsx
const AVAILABLE_APPS: App[] = [
  // ... existing apps
  {
    id: 'your-app-name',
    name: 'Your App Display Name',
    icon: 'YourIcon',  // Icon name as string
    color: 'blue',     // Color family
    route: '/apps/your-app-name'
  },
]
```

### 2. Set Up API Integration

Create your API service at `frontend/src/services/yourAppService.ts`:

```tsx
import { api } from '../lib/api'

export const yourAppService = {
  // Projects
  getProjects: async () => {
    const response = await api.get('/api/apps/your-app-name/projects')
    return response.data
  },

  getProject: async (id: string) => {
    const response = await api.get(`/api/apps/your-app-name/projects/${id}`)
    return response.data
  },

  createProject: async (data: { name: string; description?: string }) => {
    const response = await api.post('/api/apps/your-app-name/projects', data)
    return response.data
  },

  deleteProject: async (id: string) => {
    const response = await api.delete(`/api/apps/your-app-name/projects/${id}`)
    return response.data
  },

  // Add your app-specific endpoints here
}
```

### 3. Create Zustand Store (Optional)

For complex state management, create `frontend/src/stores/yourAppStore.ts`:

```tsx
import { create } from 'zustand'
import { yourAppService } from '../services/yourAppService'

interface YourAppState {
  projects: Project[]
  currentProject: Project | null
  isLoadingProjects: boolean
  loadProjects: () => Promise<void>
  selectProject: (id: string) => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
}

export const useYourAppStore = create<YourAppState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoadingProjects: false,

  loadProjects: async () => {
    set({ isLoadingProjects: true })
    try {
      const data = await yourAppService.getProjects()
      set({ projects: data.projects, isLoadingProjects: false })
    } catch (error) {
      console.error('Failed to load projects:', error)
      set({ isLoadingProjects: false })
    }
  },

  selectProject: async (id: string) => {
    try {
      const data = await yourAppService.getProject(id)
      set({ currentProject: data.project })
    } catch (error) {
      console.error('Failed to select project:', error)
    }
  },

  createProject: async (name: string, description?: string) => {
    const data = await yourAppService.createProject({ name, description })
    set({ projects: [data.project, ...get().projects] })
    return data.project
  },

  deleteProject: async (id: string) => {
    await yourAppService.deleteProject(id)
    set({
      projects: get().projects.filter(p => p.id !== id),
      currentProject: get().currentProject?.id === id ? null : get().currentProject
    })
  },
}))
```

### 4. Add TypeScript Types

Create `frontend/src/types/yourApp.types.ts`:

```tsx
export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  userId: string
  // Add your specific fields
}

export interface Item {
  id: string
  projectId: string
  // Add your item fields
}

// Add more types as needed
```

---

## Next Steps

After implementing the template:

1. **Add to Navigation**
   - Update `frontend/src/components/AppGrid.tsx` to show your app on dashboard
   - Add appropriate icon and description

2. **Backend Setup**
   - Create API endpoints in `backend/src/routes/apps/yourAppName.ts`
   - Add database models in `backend/prisma/schema.prisma`
   - Implement business logic

3. **Testing**
   - Follow the [Testing Checklist](./HEADER_DEVELOPMENT_STANDARDS.md#testing-checklist)
   - Test on mobile, tablet, and desktop
   - Verify all navigation flows

4. **Documentation**
   - Update app-specific README if needed
   - Document any unique features or workflows

5. **Code Review**
   - Submit PR with checklist from [CONTRIBUTING.md](./CONTRIBUTING.md)
   - Request review from frontend team

---

## Common Patterns

### Pattern 1: File Upload

```tsx
const [uploading, setUploading] = useState(false)
const fileInputRef = useRef<HTMLInputElement>(null)

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  setUploading(true)
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', currentProject.id)

    const response = await api.post('/api/apps/your-app-name/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // Handle success
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    setUploading(false)
  }
}

// In JSX
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={handleFileUpload}
  className="hidden"
/>
<button onClick={() => fileInputRef.current?.click()}>
  Upload
</button>
```

### Pattern 2: Real-time Updates (WebSocket)

```tsx
import { useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

export default function YourAppName() {
  const { subscribe, unsubscribe } = useWebSocket()

  useEffect(() => {
    const handleUpdate = (data: any) => {
      // Handle real-time update
      console.log('Update received:', data)
    }

    subscribe('your-app-name:update', handleUpdate)

    return () => {
      unsubscribe('your-app-name:update', handleUpdate)
    }
  }, [])

  // ... rest of component
}
```

### Pattern 3: Credit Cost Display

```tsx
import { useAuthStore } from '../stores/authStore'

const { user, updateCreditBalance } = useAuthStore()
const [costEstimate, setCostEstimate] = useState(0)

const handleAction = async () => {
  if (user.creditBalance < costEstimate) {
    alert('Insufficient credits!')
    navigate('/credits')
    return
  }

  try {
    const response = await api.post('/api/apps/your-app-name/action')
    updateCreditBalance(response.data.creditBalance)
    // Success
  } catch (error) {
    // Error handling
  }
}
```

---

## Troubleshooting

### Issue: Header not displaying
**Solution**: Ensure you imported UnifiedHeader correctly and provided all required props (title, icon, currentAppId).

### Issue: App switcher not highlighting current app
**Solution**: Verify `currentAppId` matches the ID in `AVAILABLE_APPS` array in UnifiedHeader.tsx.

### Issue: Back button goes to wrong page
**Solution**: Check `backPath` prop - projects list should use `/dashboard`, project detail should use `/apps/your-app-name`.

### Issue: Colors look wrong
**Solution**: Use exact format: `bg-[color]-50 text-[color]-700`. Don't use custom shades.

### Issue: Layout breaks on mobile
**Solution**: Use responsive classes: `px-6 md:px-10`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.

---

**Last Updated**: 2025-01-17
**Template Version**: 1.0.0
**Maintained By**: Lumiku Frontend Team

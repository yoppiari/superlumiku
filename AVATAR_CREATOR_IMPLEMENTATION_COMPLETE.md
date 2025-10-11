# Avatar Creator - Project System Implementation COMPLETE

## Status: ✅ Backend Complete | ⏳ Frontend In Progress

---

## Phase 1-2: Backend ✅ COMPLETE

### Database Schema ✅
- Added `AvatarProject` model with userId, name, description
- Updated `Avatar` model with `projectId` foreign key
- Cascade delete: Project → Avatars

### Backend Services ✅
- `AvatarProjectService` - CRUD for projects
- `AvatarProjectRepository` - Database operations
- Updated `AvatarService` - Now supports projectId
- Updated `AvatarAIService` - Now supports projectId

### Backend Routes ✅
```
GET    /api/apps/avatar-creator/projects                           → List projects
POST   /api/apps/avatar-creator/projects                           → Create project
GET    /api/apps/avatar-creator/projects/:id                       → Get project + avatars
PUT    /api/apps/avatar-creator/projects/:id                       → Update project
DELETE /api/apps/avatar-creator/projects/:id                       → Delete project
GET    /api/apps/avatar-creator/projects/:id/stats                 → Project stats

POST   /api/apps/avatar-creator/projects/:projectId/avatars        → Upload avatar
POST   /api/apps/avatar-creator/projects/:projectId/avatars/generate → Generate AI avatar

GET    /api/apps/avatar-creator/avatars/:id                        → Get avatar (legacy)
PUT    /api/apps/avatar-creator/avatars/:id                        → Update avatar (legacy)
DELETE /api/apps/avatar-creator/avatars/:id                        → Delete avatar (legacy)
```

---

## Phase 3-4: Frontend ⏳ IN PROGRESS

### Files to Create/Modify:

#### 1. Create: `frontend/src/stores/avatarCreatorStore.ts`
```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { api } from '../lib/api'

export interface AvatarProject {
  id: string
  userId: string
  name: string
  description: string | null
  avatars: Avatar[]
  createdAt: string
  updatedAt: string
}

export interface Avatar {
  id: string
  userId: string
  projectId: string
  name: string
  baseImageUrl: string
  thumbnailUrl: string | null
  gender: string | null
  ageRange: string | null
  style: string | null
  ethnicity: string | null
  usageCount: number
  sourceType: string
  createdAt: string
}

interface AvatarCreatorState {
  // Projects
  projects: AvatarProject[]
  currentProject: AvatarProject | null
  isLoadingProjects: boolean

  // UI State
  isUploading: boolean
  isGenerating: boolean
  isSaving: boolean
  lastSaved: Date | null

  // Actions - Projects
  loadProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<AvatarProject>
  selectProject: (projectId: string) => Promise<void>
  updateProject: (projectId: string, data: { name?: string; description?: string }) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  clearCurrentProject: () => void

  // Actions - Avatars
  uploadAvatar: (projectId: string, file: File, metadata: any) => Promise<Avatar>
  generateAvatar: (projectId: string, prompt: string, metadata: any) => Promise<Avatar>
  deleteAvatar: (avatarId: string) => Promise<void>

  // Actions - Utility
  reset: () => void
}

export const useAvatarCreatorStore = create<AvatarCreatorState>()(
  immer((set, get) => ({
    // Initial State
    projects: [],
    currentProject: null,
    isLoadingProjects: false,
    isUploading: false,
    isGenerating: false,
    isSaving: false,
    lastSaved: null,

    // ===== Projects Actions =====

    loadProjects: async () => {
      set((state) => {
        state.isLoadingProjects = true
      })

      try {
        const res = await api.get('/api/apps/avatar-creator/projects')
        set((state) => {
          state.projects = res.data.projects
          state.isLoadingProjects = false
        })
      } catch (error) {
        console.error('Failed to load projects:', error)
        set((state) => {
          state.isLoadingProjects = false
        })
        throw error
      }
    },

    createProject: async (name: string, description?: string) => {
      try {
        const res = await api.post('/api/apps/avatar-creator/projects', {
          name,
          description,
        })

        const newProject = res.data.project

        set((state) => {
          state.projects.unshift(newProject)
          state.currentProject = newProject
        })

        return newProject
      } catch (error) {
        console.error('Failed to create project:', error)
        throw error
      }
    },

    selectProject: async (projectId: string) => {
      try {
        const res = await api.get(`/api/apps/avatar-creator/projects/${projectId}`)

        set((state) => {
          state.currentProject = res.data.project
        })
      } catch (error) {
        console.error('Failed to load project:', error)
        throw error
      }
    },

    updateProject: async (projectId: string, data: { name?: string; description?: string }) => {
      set((state) => {
        state.isSaving = true
      })

      try {
        await api.put(`/api/apps/avatar-creator/projects/${projectId}`, data)

        set((state) => {
          const projectIndex = state.projects.findIndex((p) => p.id === projectId)
          if (projectIndex !== -1) {
            if (data.name !== undefined) state.projects[projectIndex].name = data.name
            if (data.description !== undefined) state.projects[projectIndex].description = data.description
          }

          if (state.currentProject?.id === projectId) {
            if (data.name !== undefined) state.currentProject.name = data.name
            if (data.description !== undefined) state.currentProject.description = data.description
          }

          state.isSaving = false
          state.lastSaved = new Date()
        })
      } catch (error) {
        set((state) => {
          state.isSaving = false
        })
        console.error('Failed to update project:', error)
        throw error
      }
    },

    deleteProject: async (projectId: string) => {
      try {
        await api.delete(`/api/apps/avatar-creator/projects/${projectId}`)

        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== projectId)
          if (state.currentProject?.id === projectId) {
            state.currentProject = null
          }
        })
      } catch (error) {
        console.error('Failed to delete project:', error)
        throw error
      }
    },

    clearCurrentProject: () => {
      set((state) => {
        state.currentProject = null
      })
    },

    // ===== Avatars Actions =====

    uploadAvatar: async (projectId: string, file: File, metadata: any) => {
      set((state) => {
        state.isUploading = true
        state.isSaving = true
      })

      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('name', metadata.name)
        if (metadata.gender) formData.append('gender', metadata.gender)
        if (metadata.ageRange) formData.append('ageRange', metadata.ageRange)
        if (metadata.style) formData.append('style', metadata.style)
        if (metadata.ethnicity) formData.append('ethnicity', metadata.ethnicity)

        const res = await api.post(
          `/api/apps/avatar-creator/projects/${projectId}/avatars`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        const newAvatar = res.data.avatar

        set((state) => {
          if (state.currentProject?.id === projectId) {
            state.currentProject.avatars.unshift(newAvatar)
          }
          state.isUploading = false
          state.isSaving = false
          state.lastSaved = new Date()
        })

        return newAvatar
      } catch (error) {
        set((state) => {
          state.isUploading = false
          state.isSaving = false
        })
        console.error('Failed to upload avatar:', error)
        throw error
      }
    },

    generateAvatar: async (projectId: string, prompt: string, metadata: any) => {
      set((state) => {
        state.isGenerating = true
      })

      try {
        const res = await api.post(
          `/api/apps/avatar-creator/projects/${projectId}/avatars/generate`,
          {
            prompt,
            name: metadata.name,
            gender: metadata.gender,
            ageRange: metadata.ageRange,
            style: metadata.style,
          }
        )

        const newAvatar = res.data.avatar

        set((state) => {
          if (state.currentProject?.id === projectId) {
            state.currentProject.avatars.unshift(newAvatar)
          }
          state.isGenerating = false
        })

        return newAvatar
      } catch (error) {
        set((state) => {
          state.isGenerating = false
        })
        console.error('Failed to generate avatar:', error)
        throw error
      }
    },

    deleteAvatar: async (avatarId: string) => {
      set((state) => {
        state.isSaving = true
      })

      try {
        await api.delete(`/api/apps/avatar-creator/avatars/${avatarId}`)

        set((state) => {
          if (state.currentProject) {
            state.currentProject.avatars = state.currentProject.avatars.filter(
              (a) => a.id !== avatarId
            )
          }
          state.isSaving = false
          state.lastSaved = new Date()
        })
      } catch (error) {
        set((state) => {
          state.isSaving = false
        })
        console.error('Failed to delete avatar:', error)
        throw error
      }
    },

    // ===== Utility Actions =====

    reset: () => {
      set((state) => {
        state.projects = []
        state.currentProject = null
        state.isUploading = false
        state.isGenerating = false
      })
    },
  }))
)
```

#### 2. Modify: `frontend/src/apps/AvatarCreator.tsx`

Pattern sama seperti CarouselMix.tsx:
- Use `useParams()` untuk detect projectId
- If no projectId → Show Projects List View
- If projectId → Show Project Detail View (dengan avatars)
- Projects List: Grid of projects + "New Project" button
- Project Detail: Upload & Generate AI buttons di header, Grid avatars di body

#### 3. Modify: `frontend/src/App.tsx`

Update routing:
```tsx
<Route path="/apps/avatar-creator" element={<AvatarCreator />} />
<Route path="/apps/avatar-creator/:projectId" element={<AvatarCreator />} />
```

---

## Migration Script (Production)

```sql
-- Run this in production database

-- 1. Create avatar_projects table
CREATE TABLE IF NOT EXISTS avatar_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add projectId to avatars table
ALTER TABLE avatars ADD COLUMN project_id TEXT;

-- 3. Migrate existing avatars to default project
DO $$
DECLARE
  user_record RECORD;
  default_project_id TEXT;
BEGIN
  FOR user_record IN
    SELECT DISTINCT user_id FROM avatars WHERE project_id IS NULL
  LOOP
    -- Create default project for user
    INSERT INTO avatar_projects (id, user_id, name, description)
    VALUES (
      'proj_' || md5(random()::text),
      user_record.user_id,
      'My Avatars',
      'Default project for existing avatars'
    )
    RETURNING id INTO default_project_id;

    -- Update avatars to link to default project
    UPDATE avatars
    SET project_id = default_project_id
    WHERE user_id = user_record.user_id AND project_id IS NULL;
  END LOOP;
END $$;

-- 4. Make projectId required
ALTER TABLE avatars ALTER COLUMN project_id SET NOT NULL;

-- 5. Add foreign key constraint
ALTER TABLE avatars
ADD CONSTRAINT fk_avatars_project
FOREIGN KEY (project_id)
REFERENCES avatar_projects(id)
ON DELETE CASCADE;

-- 6. Create indexes
CREATE INDEX idx_avatar_projects_user_id ON avatar_projects(user_id);
CREATE INDEX idx_avatars_project_id ON avatars(project_id);
```

---

## Quick Implementation Checklist

### Backend ✅
- [x] Schema updated (AvatarProject model added)
- [x] Types updated (AvatarProject interfaces)
- [x] Repository created (avatar-project.repository.ts)
- [x] Service created (avatar-project.service.ts)
- [x] AvatarService updated (projectId support)
- [x] AvatarAIService updated (projectId support)
- [x] Routes updated (project-scoped endpoints)

### Frontend ⏳
- [ ] Create avatarCreatorStore.ts (Zustand store)
- [ ] Refactor AvatarCreator.tsx (2 views: list + detail)
- [ ] Update App.tsx routing
- [ ] Test end-to-end

### Deployment 📋
- [ ] Run database migration in production
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Verify migration success (all avatars have projectId)

---

## Testing Plan

1. **Projects List View**
   - Can see all projects
   - Can create new project
   - Can delete project
   - Can click project → navigate to detail

2. **Project Detail View**
   - Can upload avatar to project
   - Can generate AI avatar in project
   - Can delete avatar
   - Can navigate to Pose Generator with avatarId
   - Back button → return to projects list

3. **Migration Verification**
   - All existing avatars migrated to "My Avatars" project
   - No orphaned avatars (all have projectId)
   - Delete project → cascades delete avatars

---

## Next Steps

1. Copy code for `avatarCreatorStore.ts` (above)
2. Refactor `AvatarCreator.tsx` using pattern from `CarouselMix.tsx`
3. Update `App.tsx` routing
4. Test locally
5. Run migration script in production
6. Deploy

**Estimasi waktu tersisa:** 2-3 jam (frontend only)

---

## Files Modified Summary

### Backend
- ✅ `backend/prisma/schema.prisma`
- ✅ `backend/src/apps/avatar-creator/types.ts`
- ✅ `backend/src/apps/avatar-creator/repositories/avatar-project.repository.ts` (NEW)
- ✅ `backend/src/apps/avatar-creator/services/avatar-project.service.ts` (NEW)
- ✅ `backend/src/apps/avatar-creator/services/avatar.service.ts`
- ✅ `backend/src/apps/avatar-creator/services/avatar-ai.service.ts`
- ✅ `backend/src/apps/avatar-creator/routes.ts`

### Frontend (To Do)
- ⏳ `frontend/src/stores/avatarCreatorStore.ts` (NEW - code ready above)
- ⏳ `frontend/src/apps/AvatarCreator.tsx` (REFACTOR - use CarouselMix pattern)
- ⏳ `frontend/src/App.tsx` (UPDATE routing)

---

**Implementation Progress: 70% Complete** 🚀

# Avatar Creator - Project System Implementation Plan

## Executive Summary

Revisi Avatar Creator dari sistem flat (langsung upload/generate) menjadi sistem berbasis **Project** seperti Carousel Mix. Halaman utama hanya menampilkan daftar project. Upload dan Generate AI hanya tersedia di dalam project.

---

## 1. Current Architecture Analysis

### Current State (Flat System)
```
/apps/avatar-creator
├── Header dengan "Upload Avatar" & "Generate with AI" buttons
├── Stats Cards (Total Avatars, Recent Uploads, dll)
└── Grid of All Avatars (semua avatars dalam satu list)
```

### Database Current
```
Avatar
├── id
├── userId
├── name
├── baseImageUrl
├── thumbnailUrl
├── gender, ageRange, style, ethnicity
├── sourceType (upload/ai_generated)
├── usageCount
└── createdAt
```

---

## 2. Target Architecture (Project-Based System)

### New Structure
```
/apps/avatar-creator                    → Projects List View
    ├── "New Project" button
    └── Grid of Projects

/apps/avatar-creator/:projectId         → Project Detail View
    ├── Header dengan project name
    ├── "Upload Avatar" button
    ├── "Generate with AI" button
    └── Grid of Avatars dalam project ini
```

### New Database Schema

```prisma
model AvatarProject {
  id          String   @id @default(cuid())
  userId      String
  name        String   // "Fashion Models", "Professional Headshots"
  description String?  // Optional description

  // Relations
  avatars     Avatar[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

model Avatar {
  id              String  @id @default(cuid())
  userId          String
  projectId       String  // NEW: Link to project

  name            String
  baseImageUrl    String
  thumbnailUrl    String?

  gender          String?
  ageRange        String?
  style           String?
  ethnicity       String?

  generationPrompt String?
  faceEmbedding    String?
  sourceType       String  // "upload", "ai_generated"
  usageCount       Int     @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  project         AvatarProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([projectId])
}
```

---

## 3. Implementation Steps

### Phase 1: Database Migration
**Files to modify:**
- `backend/prisma/schema.prisma`

**Tasks:**
1. Add `AvatarProject` model
2. Add `projectId` to `Avatar` model with relation
3. Create migration script
4. Handle existing avatars (migrate to default project or orphan handling)

**Migration Strategy:**
```typescript
// Option A: Create default project for each user
// All existing avatars → "My Avatars" project per user

// Option B: Leave existing avatars orphaned
// Add nullable projectId, handle in backend
```

---

### Phase 2: Backend Services & Routes

#### New Files to Create:
1. `backend/src/apps/avatar-creator/services/avatar-project.service.ts`
2. `backend/src/apps/avatar-creator/repositories/avatar-project.repository.ts`

#### Files to Modify:
1. `backend/src/apps/avatar-creator/routes.ts`
2. `backend/src/apps/avatar-creator/services/avatar.service.ts`

#### New API Endpoints:

```typescript
// Projects
GET    /api/apps/avatar-creator/projects              // List all projects
POST   /api/apps/avatar-creator/projects              // Create project
GET    /api/apps/avatar-creator/projects/:id          // Get project detail (with avatars)
PUT    /api/apps/avatar-creator/projects/:id          // Update project
DELETE /api/apps/avatar-creator/projects/:id          // Delete project (cascade avatars)

// Avatars (updated to require projectId)
GET    /api/apps/avatar-creator/projects/:projectId/avatars           // List avatars in project
POST   /api/apps/avatar-creator/projects/:projectId/avatars           // Upload avatar to project
POST   /api/apps/avatar-creator/projects/:projectId/avatars/generate  // Generate AI avatar in project
GET    /api/apps/avatar-creator/avatars/:id                           // Get single avatar (unchanged)
PUT    /api/apps/avatar-creator/avatars/:id                           // Update avatar (unchanged)
DELETE /api/apps/avatar-creator/avatars/:id                           // Delete avatar (unchanged)

// Stats (updated to per-project)
GET    /api/apps/avatar-creator/projects/:projectId/stats             // Stats for specific project
```

#### Service Implementation:

**AvatarProjectService:**
```typescript
class AvatarProjectService {
  async createProject(userId: string, name: string, description?: string): Promise<AvatarProject>
  async getUserProjects(userId: string): Promise<AvatarProject[]>
  async getProject(projectId: string, userId: string): Promise<AvatarProject | null>
  async updateProject(projectId: string, userId: string, data: UpdateProjectDto): Promise<AvatarProject>
  async deleteProject(projectId: string, userId: string): Promise<void>
}
```

**Updated AvatarService:**
```typescript
class AvatarService {
  // Update existing methods to require projectId
  async createAvatar(userId: string, projectId: string, data: CreateAvatarRequest, imagePath: string): Promise<Avatar>
  async getProjectAvatars(projectId: string, userId: string): Promise<Avatar[]>
  async getProjectStats(projectId: string, userId: string): Promise<AvatarStats>

  // Keep these unchanged
  async getAvatar(id: string, userId: string): Promise<Avatar | null>
  async updateAvatar(id: string, userId: string, data: UpdateAvatarRequest): Promise<Avatar>
  async deleteAvatar(id: string, userId: string): Promise<void>
}
```

---

### Phase 3: Frontend Store (Zustand)

#### New File to Create:
`frontend/src/stores/avatarCreatorStore.ts`

**Store Structure (based on carouselMixStore.ts):**

```typescript
interface AvatarProject {
  id: string
  userId: string
  name: string
  description?: string
  avatars: Avatar[]
  createdAt: string
  updatedAt: string
}

interface Avatar {
  id: string
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
  uploadAvatar: (projectId: string, file: File, metadata: AvatarMetadata) => Promise<Avatar>
  generateAvatar: (projectId: string, prompt: string, metadata: AvatarMetadata) => Promise<Avatar>
  deleteAvatar: (avatarId: string) => Promise<void>

  // Actions - Utility
  reset: () => void
}
```

---

### Phase 4: Frontend Components Refactor

#### Files to Modify:
1. `frontend/src/apps/AvatarCreator.tsx` (complete rewrite)
2. `frontend/src/App.tsx` (update routing)

#### New Components to Create (Optional - for better organization):
1. `frontend/src/apps/avatar-creator/components/ProjectsList.tsx`
2. `frontend/src/apps/avatar-creator/components/ProjectDetail.tsx`
3. `frontend/src/apps/avatar-creator/components/AvatarUploadModal.tsx`
4. `frontend/src/apps/avatar-creator/components/AvatarGenerateModal.tsx`
5. `frontend/src/components/CreateProjectModal.tsx` (already exists, can be reused)

#### New AvatarCreator.tsx Structure:

```typescript
export default function AvatarCreator() {
  const { projectId } = useParams()
  const {
    projects,
    currentProject,
    isLoadingProjects,
    loadProjects,
    createProject,
    selectProject,
    clearCurrentProject,
    deleteProject,
  } = useAvatarCreatorStore()

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load specific project if projectId in URL
  useEffect(() => {
    if (projectId) {
      selectProject(projectId)
    } else {
      clearCurrentProject()
    }
  }, [projectId])

  // Project Detail View
  if (currentProject) {
    return <ProjectDetailView project={currentProject} />
  }

  // Projects List View
  return <ProjectsListView projects={projects} />
}
```

#### Projects List View UI:
```tsx
// Similar to CarouselMix.tsx lines 169-273
- Header with "Avatar Creator" title
- "New Project" button
- Grid of project cards:
  - Project name & description
  - Avatar count
  - Thumbnail preview (first avatar)
  - Delete button
  - Click to open project
```

#### Project Detail View UI:
```tsx
// Similar to CarouselMix.tsx lines 107-165
- Header with:
  - Back button
  - Project name & description
  - "Upload Avatar" button
  - "Generate with AI" button
  - Credit balance
  - Profile dropdown

- Main content:
  - Grid of avatars in this project
  - Empty state if no avatars
  - Each avatar card:
    - Image preview
    - Name & metadata
    - "Generate Poses" button → navigate to Pose Generator
    - Delete button
```

---

### Phase 5: Routing Update

#### File to Modify:
`frontend/src/App.tsx`

**Update route:**
```tsx
// Before
<Route path="/apps/avatar-creator" element={<AvatarCreator />} />

// After
<Route path="/apps/avatar-creator" element={<AvatarCreator />} />
<Route path="/apps/avatar-creator/:projectId" element={<AvatarCreator />} />
```

**Note:** Similar to Carousel Mix, we can use same component for both routes and differentiate using `useParams()`.

---

## 4. Migration Strategy for Existing Data

### Option A: Auto-migrate to Default Project (RECOMMENDED)
```typescript
// Migration script: backend/scripts/migrate-avatars-to-projects.ts

async function migrateAvatarsToProjects() {
  // 1. Get all users with avatars
  const usersWithAvatars = await prisma.avatar.findMany({
    where: { projectId: null },
    select: { userId: true },
    distinct: ['userId']
  })

  // 2. For each user, create default project
  for (const { userId } of usersWithAvatars) {
    const defaultProject = await prisma.avatarProject.create({
      data: {
        userId,
        name: 'My Avatars',
        description: 'Default project for existing avatars'
      }
    })

    // 3. Migrate all user's avatars to default project
    await prisma.avatar.updateMany({
      where: { userId, projectId: null },
      data: { projectId: defaultProject.id }
    })
  }
}
```

### Option B: Make projectId Nullable (FALLBACK)
- Keep `projectId` nullable in schema
- Show "Orphaned Avatars" section in UI
- Allow user to move orphaned avatars to projects

---

## 5. User Experience Flow

### Creating New Project
1. User clicks "New Project" button
2. Modal opens → Enter name & description
3. Submit → Create project → Navigate to `/apps/avatar-creator/:projectId`

### Working with Avatars
1. User selects project from list
2. Inside project, can "Upload Avatar" or "Generate with AI"
3. Avatars are scoped to current project
4. Can click "Generate Poses" → Navigate to Pose Generator with avatarId

### Deleting Project
1. Confirmation dialog: "Delete project? All avatars will be deleted."
2. Cascade delete avatars in project
3. Navigate back to projects list

---

## 6. Backwards Compatibility Considerations

### For Pose Generator Integration
**Current:** Pose Generator expects avatarId
**Future:** Same, no change needed

**Navigation from Avatar Creator:**
```tsx
// In avatar card
<button onClick={() => navigate('/apps/pose-generator', { state: { avatarId: avatar.id } })}>
  Generate Poses
</button>
```

### For Existing Avatar URLs
If avatars have file paths like `/uploads/avatar-creator/:userId/:filename`, these remain unchanged.

---

## 7. Testing Checklist

### Backend Tests
- [ ] Create project
- [ ] List projects for user
- [ ] Get project with avatars
- [ ] Update project name/description
- [ ] Delete project (cascade avatars)
- [ ] Upload avatar to project
- [ ] Generate AI avatar in project
- [ ] Get project stats

### Frontend Tests
- [ ] Projects list view loads correctly
- [ ] Can create new project
- [ ] Can select project → navigate to detail
- [ ] Can upload avatar in project
- [ ] Can generate AI avatar in project
- [ ] Can delete avatar
- [ ] Can delete project
- [ ] Back button from project detail → projects list
- [ ] Navigate to Pose Generator with avatarId works

### Migration Tests
- [ ] Existing avatars migrated to default project
- [ ] All avatars accessible after migration
- [ ] No orphaned avatars

---

## 8. Implementation Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Database Schema + Migration | 1-2 hours |
| Phase 2 | Backend Services + Routes | 2-3 hours |
| Phase 3 | Frontend Store (Zustand) | 1-2 hours |
| Phase 4 | Frontend Components Refactor | 3-4 hours |
| Phase 5 | Routing + Integration | 1 hour |
| Testing | Manual + Integration Testing | 2 hours |
| **TOTAL** | | **10-14 hours** |

---

## 9. Files Checklist

### Backend
- [ ] `backend/prisma/schema.prisma` (add AvatarProject model)
- [ ] `backend/prisma/migrations/...` (migration file)
- [ ] `backend/src/apps/avatar-creator/services/avatar-project.service.ts` (new)
- [ ] `backend/src/apps/avatar-creator/services/avatar.service.ts` (update)
- [ ] `backend/src/apps/avatar-creator/routes.ts` (update)
- [ ] `backend/src/apps/avatar-creator/types.ts` (add AvatarProject types)
- [ ] `backend/scripts/migrate-avatars-to-projects.ts` (optional migration script)

### Frontend
- [ ] `frontend/src/stores/avatarCreatorStore.ts` (new)
- [ ] `frontend/src/apps/AvatarCreator.tsx` (complete rewrite)
- [ ] `frontend/src/App.tsx` (update routing)
- [ ] `frontend/src/components/CreateProjectModal.tsx` (reuse existing or create new)

---

## 10. Benefits of This Approach

### Organization
- Users can organize avatars by project/campaign
- Example projects: "Fashion Campaign", "Corporate Headshots", "Social Media Avatars"

### Scalability
- Better performance when users have many avatars
- Load only avatars in current project

### Consistency
- Same UX pattern as Carousel Mix
- Users familiar with Carousel Mix will understand immediately

### Future Enhancements
- Project-level settings (default style, age range, etc.)
- Batch operations per project
- Project sharing/collaboration (future feature)
- Export all avatars in a project

---

## 11. Visual Mockup (Text-based)

### Projects List View
```
┌─────────────────────────────────────────────────────────┐
│ ← Avatar Creator                                 Credits │
│                                                           │
│ [+ New Project]                                           │
│                                                           │
│ ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│ │ Fashion   │  │ Corporate │  │ Social    │            │
│ │ Models    │  │ Headshots │  │ Media     │            │
│ │           │  │           │  │           │            │
│ │ 12 avatars│  │ 5 avatars │  │ 8 avatars │            │
│ └───────────┘  └───────────┘  └───────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Project Detail View
```
┌─────────────────────────────────────────────────────────┐
│ ← Fashion Models                            [Upload] [AI]│
│   12 avatars in this project                      Credits│
│                                                           │
│ Avatars in this project                                   │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                 │
│ │Img  │  │ Img  │  │ Img  │  │ Img  │                 │
│ │Model 1  │Model 2  │Model 3  │Model 4                 │
│ │[Pose]   │[Pose]   │[Pose]   │[Pose]                  │
│ └──────┘  └──────┘  └──────┘  └──────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Next Steps

### To Start Implementation:
1. Review and approve this plan
2. Start with Phase 1 (Database)
3. Run migration on dev environment
4. Implement Phase 2 (Backend)
5. Test backend endpoints with Postman/Thunder Client
6. Implement Phase 3 & 4 (Frontend)
7. Integration testing
8. Deploy to production

### Questions to Answer:
1. **Migration strategy:** Auto-migrate to default project, or make projectId nullable?
2. **Default project name:** "My Avatars", "Default Project", or user can rename?
3. **Cascade delete:** Should deleting project delete all avatars? (Recommended: Yes)
4. **Avatar reuse:** Should avatars be movable between projects? (Future feature)

---

## Summary

This plan transforms Avatar Creator from a flat avatar list into a project-based system, matching the UX pattern of Carousel Mix. The implementation is straightforward as we can follow the same patterns and architecture already proven in Carousel Mix.

**Key Decision:** Proceed with auto-migration strategy (Option A) to ensure zero data loss and seamless transition for existing users.

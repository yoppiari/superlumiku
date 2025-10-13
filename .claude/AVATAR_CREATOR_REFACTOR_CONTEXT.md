# Avatar Creator Refactor - Context & Reference

## Overview
Merefactor Avatar Creator dari sistem flat (semua avatars dalam satu list) menjadi sistem berbasis PROJECT seperti Carousel Mix.

## Goal
- Halaman utama `/apps/avatar-creator` → Hanya list projects + "New Project" button
- Halaman detail `/apps/avatar-creator/:projectId` → Upload & Generate AI buttons + Grid avatars dalam project
- Database: Add `AvatarProject` model, Avatar model gets `projectId` foreign key
- Backend: Add project CRUD + update avatar routes to be project-scoped
- Frontend: Create `avatarCreatorStore.ts` (Zustand) + refactor `AvatarCreator.tsx` (2 views)

## Architecture Pattern
Follow EXACT same pattern as Carousel Mix:
- **Store Pattern:** `frontend/src/stores/carouselMixStore.ts`
- **Component Pattern:** `frontend/src/apps/CarouselMix.tsx`
- **Backend Service Pattern:** `backend/src/apps/carousel-mix/services/carousel.service.ts`

## Database Schema

```prisma
model AvatarProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  avatars     Avatar[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId])
}

model Avatar {
  id              String  @id @default(cuid())
  userId          String
  projectId       String  // NEW FIELD
  name            String
  baseImageUrl    String
  thumbnailUrl    String?
  gender          String?
  ageRange        String?
  style           String?
  ethnicity       String?
  generationPrompt String?
  faceEmbedding    String?
  sourceType       String
  usageCount       Int     @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  project          AvatarProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([projectId])
}
```

## Backend API Endpoints (New)

```
// Projects
GET    /api/apps/avatar-creator/projects                           → List all projects
POST   /api/apps/avatar-creator/projects                           → Create project
GET    /api/apps/avatar-creator/projects/:id                       → Get project detail + avatars
PUT    /api/apps/avatar-creator/projects/:id                       → Update project
DELETE /api/apps/avatar-creator/projects/:id                       → Delete project (cascade)

// Avatars (Updated - now project-scoped)
POST   /api/apps/avatar-creator/projects/:projectId/avatars        → Upload avatar to project
POST   /api/apps/avatar-creator/projects/:projectId/avatars/generate → Generate AI avatar in project
GET    /api/apps/avatar-creator/avatars/:id                        → Get single avatar
PUT    /api/apps/avatar-creator/avatars/:id                        → Update avatar
DELETE /api/apps/avatar-creator/avatars/:id                        → Delete avatar

// Stats
GET    /api/apps/avatar-creator/projects/:projectId/stats          → Stats for project
```

## Files to Create/Modify

### Backend
- ✅ `backend/prisma/schema.prisma` - Add AvatarProject model
- ✅ `backend/prisma/migrations/...` - Migration file
- ✅ `backend/src/apps/avatar-creator/services/avatar-project.service.ts` - NEW
- ✅ `backend/src/apps/avatar-creator/repositories/avatar-project.repository.ts` - NEW
- ✅ `backend/src/apps/avatar-creator/services/avatar.service.ts` - UPDATE
- ✅ `backend/src/apps/avatar-creator/routes.ts` - UPDATE
- ✅ `backend/src/apps/avatar-creator/types.ts` - UPDATE

### Frontend
- ✅ `frontend/src/stores/avatarCreatorStore.ts` - NEW (copy pattern from carouselMixStore.ts)
- ✅ `frontend/src/apps/AvatarCreator.tsx` - COMPLETE REWRITE (copy pattern from CarouselMix.tsx)
- ✅ `frontend/src/App.tsx` - UPDATE routing

## Migration Strategy
Auto-migrate existing avatars to default project "My Avatars" for each user:
```typescript
// For each user with avatars:
// 1. Create project "My Avatars"
// 2. Link all existing avatars to this project
```

## Implementation Order
1. Phase 1: Database (schema + migration)
2. Phase 2: Backend (services + routes)
3. Phase 3: Frontend Store (Zustand)
4. Phase 4: Frontend Components
5. Phase 5: Testing

## Key Decisions
- ✅ Cascade delete: Delete project → Delete all avatars
- ✅ Auto-migration to default project (no orphaned avatars)
- ✅ Same navigation pattern: avatar card → "Generate Poses" → Pose Generator

## Reference Files (Copy Patterns From)
- Store: `frontend/src/stores/carouselMixStore.ts`
- Component: `frontend/src/apps/CarouselMix.tsx`
- Service: `backend/src/apps/carousel-mix/services/carousel.service.ts`
- Repository: `backend/src/apps/carousel-mix/repositories/carousel.repository.ts`

## Status
🚀 APPROVED - Ready for full implementation

## Timestamp
2025-10-11 - Initial refactor approved and documented

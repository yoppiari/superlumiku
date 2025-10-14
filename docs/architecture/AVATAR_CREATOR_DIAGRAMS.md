# Avatar Creator - Architecture Diagrams

Visual representations of the Avatar Creator system architecture.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                          USER / BROWSER                                   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (Vite)                         │   │
│  │                                                                   │   │
│  │  Components:                                                      │   │
│  │  - AvatarCreator.tsx (932 lines) ⚠️                              │   │
│  │  - Upload/Generate/Presets Modals                                │   │
│  │                                                                   │   │
│  │  State Management:                                                │   │
│  │  - Zustand Store (avatarCreatorStore.ts)                         │   │
│  │  - Projects, Avatars, Active Generations                         │   │
│  │  - Polling System (5s intervals) ⚠️                              │   │
│  └───────────────────────┬───────────────────────────────────────────┘   │
│                          │                                                │
│                          │ HTTP REST API                                  │
│                          │ (Axios)                                        │
└──────────────────────────┼────────────────────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼────────────────────────────────────────────────┐
│                                                                           │
│                      BACKEND SERVER (Hono + Bun)                          │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                     Plugin System                                   │  │
│  │  - Registry: pluginRegistry                                        │  │
│  │  - Config: plugin.config.ts                                        │  │
│  │  - Credits: DISABLED (0 for all actions) ⚠️                        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                        HTTP Routes                                  │  │
│  │  (routes.ts - 15 endpoints)                                        │  │
│  │                                                                     │  │
│  │  Projects:                                                          │  │
│  │  GET    /projects          - List all projects                     │  │
│  │  POST   /projects          - Create project                        │  │
│  │  GET    /projects/:id      - Get project + avatars                 │  │
│  │  PUT    /projects/:id      - Update project                        │  │
│  │  DELETE /projects/:id      - Delete project                        │  │
│  │                                                                     │  │
│  │  Avatars:                                                           │  │
│  │  POST   /projects/:id/avatars/upload          - Upload avatar      │  │
│  │  POST   /projects/:id/avatars/generate        - Generate avatar    │  │
│  │  POST   /projects/:id/avatars/from-preset     - From preset        │  │
│  │  GET    /avatars/:id                          - Get avatar         │  │
│  │  PUT    /avatars/:id                          - Update avatar      │  │
│  │  DELETE /avatars/:id                          - Delete avatar      │  │
│  │  GET    /avatars/:id/usage-history            - Usage history      │  │
│  │                                                                     │  │
│  │  Generations:                                                       │  │
│  │  GET    /generations/:id   - Check generation status               │  │
│  │                                                                     │  │
│  │  Presets:                                                           │  │
│  │  GET    /presets           - List presets                          │  │
│  │  GET    /presets/:id       - Get preset                            │  │
│  └───────────────────────┬────────────────────────────────────────────┘  │
│                          │                                                │
│  ┌───────────────────────▼────────────────────────────────────────────┐  │
│  │                  Service Layer                                      │  │
│  │  (avatar-creator.service.ts - 530 lines)                           │  │
│  │                                                                     │  │
│  │  Responsibilities:                                                  │  │
│  │  - Business logic orchestration                                    │  │
│  │  - File validation & processing (Sharp)                            │  │
│  │  - Image thumbnail generation                                      │  │
│  │  - Queue job creation (BullMQ)                                     │  │
│  │  - Ownership verification                                          │  │
│  │  - Error handling                                                  │  │
│  └───────────────────────┬────────────────────────────────────────────┘  │
│                          │                                                │
│  ┌───────────────────────▼────────────────────────────────────────────┐  │
│  │               Repository Layer                                      │  │
│  │  (avatar-creator.repository.ts - 475 lines)                        │  │
│  │                                                                     │  │
│  │  Data Access Functions (20+ functions):                            │  │
│  │  - Projects: find, create, update, delete                          │  │
│  │  - Avatars: find, create, update, delete, increment usage          │  │
│  │  - Presets: findAll, findById, increment usage                     │  │
│  │  - Generations: create, updateStatus, findById                     │  │
│  │  - Usage History: create, findByAvatarId, getSummary               │  │
│  │  - Stats: getUserStats                                             │  │
│  └───────────────────────┬────────────────────────────────────────────┘  │
│                          │                                                │
│  ┌───────────────────────▼────────────────────────────────────────────┐  │
│  │            AI Provider Abstraction                                  │  │
│  │  (flux-generator.provider.ts)                                      │  │
│  │                                                                     │  │
│  │  FluxAvatarGenerator:                                               │  │
│  │  - generateAvatar()                                                 │  │
│  │  - buildPrompt() - Persona + attributes → Enhanced prompt          │  │
│  │  - enhancePromptForRealism() - Quality terms                       │  │
│  │  - buildNegativePrompt() - Filter unwanted elements                │  │
│  │  - Retry logic: 3 attempts with 5s delay                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────┬───────────────────────────────────────────────┘
                            │
                            │ Add job to queue
                            │
┌───────────────────────────▼───────────────────────────────────────────────┐
│                                                                           │
│                       BACKGROUND WORKERS                                  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Redis + BullMQ                                 │    │
│  │                                                                   │    │
│  │  Queue: "avatar-generation"                                       │    │
│  │  Connection: Redis (ioredis)                                      │    │
│  │  Concurrency: 2 ⚠️ (only 2 jobs simultaneously)                  │    │
│  │  Retry Strategy: 3 attempts, exponential backoff (10s, 100s)     │    │
│  │  Job Retention:                                                   │    │
│  │    - Completed: 24 hours                                          │    │
│  │    - Failed: 7 days                                               │    │
│  └───────────────────────┬───────────────────────────────────────────┘    │
│                          │                                                │
│                          │ Worker picks job                               │
│                          │                                                │
│  ┌───────────────────────▼───────────────────────────────────────────┐   │
│  │          Avatar Generator Worker                                   │   │
│  │  (avatar-generator.worker.ts)                                     │   │
│  │                                                                    │   │
│  │  Processing Steps:                                                 │   │
│  │  1. Update generation status → 'processing'                       │   │
│  │  2. Progress: 10%                                                  │   │
│  │  3. Call FLUX API (30-60 seconds) ⏱️                              │   │
│  │  4. Progress: 70%                                                  │   │
│  │  5. Save image + thumbnail to filesystem                          │   │
│  │  6. Progress: 90%                                                  │   │
│  │  7. Create Avatar record in database                              │   │
│  │  8. Update generation status → 'completed'                        │   │
│  │  9. Progress: 100%                                                 │   │
│  │                                                                    │   │
│  │  Error Handling:                                                   │   │
│  │  - Catch exceptions → Update status to 'failed'                   │   │
│  │  - Store error message                                             │   │
│  │  - Re-throw for BullMQ retry mechanism                            │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼───────────────────────────────────────────────┐
│                                                                           │
│                         DATA LAYER                                        │
│                                                                           │
│  ┌──────────────────────────────┐     ┌────────────────────────────┐    │
│  │      PostgreSQL Database     │     │      File System           │    │
│  │                              │     │                            │    │
│  │  Tables (5):                 │     │  Path:                     │    │
│  │  - AvatarProject             │     │  uploads/avatar-creator/   │    │
│  │  - Avatar                    │     │                            │    │
│  │  - AvatarPreset              │     │  Structure:                │    │
│  │  - AvatarUsageHistory        │     │  └─ {userId}/              │    │
│  │  - AvatarGeneration          │     │     ├─ {ts}.jpg (original) │    │
│  │                              │     │     └─ {ts}_thumb.jpg      │    │
│  │  Indexes: 40+                │     │                            │    │
│  │  Cascade Deletes: ✅          │     │  Thumbnail: 300x300px      │    │
│  │  JSON Fields: 4              │     │  Format: JPEG (quality 85) │    │
│  └──────────────────────────────┘     └────────────────────────────┘    │
│                                                                           │
│  ┌──────────────────────────────┐                                        │
│  │         Redis                │                                        │
│  │                              │                                        │
│  │  Used for:                   │                                        │
│  │  - BullMQ job queues         │                                        │
│  │  - Job metadata              │                                        │
│  │  - Worker coordination       │                                        │
│  │                              │                                        │
│  │  NOT used for:               │                                        │
│  │  - Caching ⚠️ (missing)      │                                        │
│  │  - Session storage           │                                        │
│  └──────────────────────────────┘                                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼───────────────────────────────────────────────┐
│                                                                           │
│                    EXTERNAL SERVICES                                      │
│                                                                           │
│  ┌──────────────────────────────┐                                        │
│  │    Hugging Face API           │                                        │
│  │                              │                                        │
│  │  Model: FLUX.1-dev            │                                        │
│  │  + Realism LoRA               │                                        │
│  │                              │                                        │
│  │  Parameters:                  │                                        │
│  │  - Width: 1024px              │                                        │
│  │  - Height: 1024px             │                                        │
│  │  - Steps: 30                  │                                        │
│  │  - Guidance: 3.5              │                                        │
│  │  - LoRA Scale: 0.9            │                                        │
│  │                              │                                        │
│  │  Generation Time: 30-60s ⏱️   │                                        │
│  └──────────────────────────────┘                                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Request Flow - Avatar Generation

### Sequence Diagram: Generate Avatar Flow

```
User          Frontend        Backend API      Service          Repository      Queue          Worker         FLUX API
 │                │               │              │                 │             │              │               │
 │  Fill form     │               │              │                 │             │              │               │
 │  & submit      │               │              │                 │             │              │               │
 │───────────────>│               │              │                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │                │ POST /generate│              │                 │             │              │               │
 │                │───────────────>              │                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │                │               │  Validate    │                 │             │              │               │
 │                │               │──────────────>                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │                │               │              │  Create Generation              │              │               │
 │                │               │              │────────────────>│             │              │               │
 │                │               │              │                 │ INSERT      │              │               │
 │                │               │              │                 │ AvatarGeneration            │               │
 │                │               │              │                 │ status='pending'            │               │
 │                │               │              │<────────────────│             │              │               │
 │                │               │              │ generationId    │             │              │               │
 │                │               │              │                 │             │              │               │
 │                │               │              │  Add to queue   │             │              │               │
 │                │               │              │─────────────────┼────────────>│              │               │
 │                │               │              │                 │             │ Job created  │               │
 │                │               │              │                 │             │ (BullMQ)     │               │
 │                │               │              │                 │             │              │               │
 │                │               │ 200 OK       │                 │             │              │               │
 │                │<──────────────│ {generationId}                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │                │ Start polling │              │                 │             │              │               │
 │                │ (every 5s) ⚠️ │              │                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │                │               │              │                 │             │  Pick job    │               │
 │                │               │              │                 │             │──────────────>               │
 │                │               │              │                 │             │              │               │
 │                │               │              │                 │             │              │ Update status │
 │                │               │              │                 │<────────────┼──────────────│ 'processing'  │
 │                │               │              │                 │             │              │               │
 │                │               │              │                 │             │              │ Generate      │
 │                │               │              │                 │             │              │──────────────>│
 │                │               │              │                 │             │              │               │
 │                │ Poll status   │              │                 │             │              │               │
 │                │──────────────>│              │                 │             │              │  30-60s ⏱️    │
 │                │               │ GET /gen/:id │                 │             │              │               │
 │                │               │──────────────>                 │             │              │               │
 │                │               │              │  Find generation│             │              │               │
 │                │               │              │────────────────>│             │              │               │
 │                │               │              │<────────────────│             │              │               │
 │                │               │ status='processing'            │             │              │               │
 │                │<──────────────│              │                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │  Show spinner  │               │              │                 │             │              │               │
 │  "Generating..."               │              │                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │                │               │              │                 │             │              │<──────────────│
 │                │               │              │                 │             │              │ Image buffer  │
 │                │               │              │                 │             │              │               │
 │                │               │              │                 │             │              │ Save files    │
 │                │               │              │                 │             │              │ (img + thumb) │
 │                │               │              │                 │             │              │               │
 │                │               │              │                 │             │              │ Create Avatar │
 │                │               │              │                 │<────────────┼──────────────│               │
 │                │               │              │                 │ INSERT Avatar              │               │
 │                │               │              │                 │─────────────┼─────────────>│               │
 │                │               │              │                 │             │              │               │
 │                │               │              │                 │             │              │ Update status │
 │                │               │              │                 │<────────────┼──────────────│ 'completed'   │
 │                │               │              │                 │             │              │ avatarId=X    │
 │                │               │              │                 │             │              │               │
 │                │ Poll status   │              │                 │             │              │               │
 │                │──────────────>│              │                 │             │              │               │
 │                │               │ GET /gen/:id │                 │             │              │               │
 │                │               │──────────────>                 │             │              │               │
 │                │               │              │  Find generation│             │              │               │
 │                │               │              │────────────────>│             │              │               │
 │                │               │              │<────────────────│             │              │               │
 │                │               │ status='completed'             │             │              │               │
 │                │               │ avatarId=X   │                 │             │              │               │
 │                │<──────────────│              │                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │                │ GET /avatar/X │              │                 │             │              │               │
 │                │──────────────>│              │                 │             │              │               │
 │                │               │──────────────>                 │             │              │               │
 │                │               │              │────────────────>│             │              │               │
 │                │               │              │<────────────────│             │              │               │
 │                │               │ Avatar data  │                 │             │              │               │
 │                │<──────────────│              │                 │             │              │               │
 │                │               │              │                 │             │              │               │
 │  Show avatar   │               │              │                 │             │              │               │
 │  Stop polling  │               │              │                 │             │              │               │
 │<───────────────│               │              │                 │             │              │               │
```

**Key Observations:**
1. Frontend polls every 5 seconds (scalability issue)
2. Worker processing time: 30-60 seconds (mostly FLUX API)
3. Two database hits per generation: CREATE → UPDATE
4. Files written to local filesystem (scalability risk)

---

## 3. Database Schema - Entity Relationship Diagram

```
┌──────────────────────────┐
│     AvatarProject        │
│──────────────────────────│
│ PK  id          cuid     │
│     userId      string   │─────┐
│     name        string   │     │
│     description string?  │     │ 1
│     createdAt   datetime │     │
│     updatedAt   datetime │     │
└──────────────────────────┘     │
                                 │ Has many avatars
                                 │
                                 │ N
┌────────────────────────────────▼────────────────────────────────────────┐
│                          Avatar (Main Entity)                            │
│──────────────────────────────────────────────────────────────────────────│
│ PK  id                  cuid                                             │
│     userId              string                                           │
│ FK  projectId           cuid     ───────────────────────────────────┐   │
│                                                                      │   │
│ Basic Info:                                                          │   │
│     name                string                                       │   │
│     baseImageUrl        string   (/uploads/avatar-creator/...)      │   │
│     thumbnailUrl        string?  (/uploads/avatar-creator/.._thumb)│   │
│                                                                      │   │
│ Persona (for AI prompt generation in other apps):                   │   │
│     personaName         string?                                     │   │
│     personaAge          int?                                        │   │
│     personaPersonality  text?    (JSON: ["friendly", "pro"])       │   │
│     personaBackground   text?                                       │   │
│                                                                      │   │
│ Visual Attributes (for prompt building):                            │   │
│     gender              string?  (male, female, unisex)             │   │
│     ageRange            string?  (young, adult, mature)             │   │
│     ethnicity           string?                                     │   │
│     bodyType            string?                                     │   │
│     hairStyle           string?                                     │   │
│     hairColor           string?                                     │   │
│     eyeColor            string?                                     │   │
│     skinTone            string?                                     │   │
│     style               string?  (casual, formal, traditional)      │   │
│                                                                      │   │
│ Generation Metadata:                                                 │   │
│     sourceType          string   (uploaded, text_to_image,          │   │
│                                   from_preset, from_reference)      │   │
│     generationPrompt    text?                                       │   │
│     seedUsed            int?                                        │   │
│                                                                      │   │
│ Usage Tracking:                                                      │   │
│     usageCount          int      (default: 0)                       │   │
│     lastUsedAt          datetime?                                   │   │
│                                                                      │   │
│     createdAt           datetime                                    │   │
│     updatedAt           datetime                                    │   │
└────────────────────────┬─────────────────────────────────────────────────┘
                         │ 1
                         │
                         │ Has many usage records
                         │
                         │ N
┌────────────────────────▼─────────────────────────┐
│          AvatarUsageHistory                      │
│──────────────────────────────────────────────────│
│ PK  id            cuid                           │
│ FK  avatarId      cuid ─────────────────────┐   │
│     userId        string                     │   │
│                                              │   │
│ Cross-App Tracking:                          │   │
│     appId         string  (pose-generator)   │   │
│     appName       string  (Pose Generator)   │   │
│     action        string  (generate_pose)    │   │
│                                              │   │
│ Reference Links:                             │   │
│     referenceId   string? (pose gen ID)      │   │
│     referenceType string? (pose_generation)  │   │
│                                              │   │
│     metadata      text?   (JSON)             │   │
│     createdAt     datetime                   │   │
└──────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────┐
│            AvatarGeneration                      │
│  (Job tracking for async generation)             │
│──────────────────────────────────────────────────│
│ PK  id            cuid                           │
│     userId        string                         │
│ FK  projectId     cuid ───────────────┐         │
│ FK  avatarId      cuid?  (null until  │         │
│                           completed)   │         │
│                                        │         │
│ Job Status:                            │         │
│     status        string               │         │
│                   (pending, processing,│         │
│                    completed, failed)  │         │
│                                        │         │
│ Generation Params:                     │         │
│     prompt        text                 │         │
│     options       text?  (JSON)        │         │
│                                        │         │
│ Error Handling:                        │         │
│     errorMessage  text?                │         │
│                                        │         │
│     createdAt     datetime             │         │
│     completedAt   datetime?            │         │
└──────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────┐
│            AvatarPreset                          │
│  (Pre-configured avatar templates)               │
│──────────────────────────────────────────────────│
│ PK  id                 cuid                      │
│     name               string                    │
│     category           string                    │
│                        (business, casual,        │
│                         traditional, creative)   │
│                                                  │
│ Templates (JSON):                                │
│     previewImageUrl    string                    │
│     personaTemplate    text  (JSON)              │
│     visualAttributes   text  (JSON)              │
│     generationPrompt   text                      │
│                                                  │
│ Denormalized fields (for easy querying):         │
│     personaName        string?                   │
│     personaAge         int?                      │
│     gender             string?                   │
│     ageRange           string?                   │
│     ethnicity          string?                   │
│     ... (all visual attributes)                  │
│                                                  │
│ Metadata:                                        │
│     isPublic           bool    (default: true)   │
│     usageCount         int     (default: 0)      │
│                                                  │
│     createdAt          datetime                  │
│     updatedAt          datetime                  │
└──────────────────────────────────────────────────┘
```

### Key Indexes (Performance Critical)

```sql
-- Avatar table indexes (most queried)
CREATE INDEX idx_avatar_user_id ON avatars(user_id);
CREATE INDEX idx_avatar_project_id ON avatars(project_id);
CREATE INDEX idx_avatar_source_type ON avatars(source_type);
CREATE INDEX idx_avatar_user_usage ON avatars(user_id, usage_count DESC);
CREATE INDEX idx_avatar_user_recent ON avatars(user_id, last_used_at DESC);
CREATE INDEX idx_avatar_user_created ON avatars(user_id, created_at DESC);

-- AvatarProject indexes
CREATE INDEX idx_project_user_id ON avatar_projects(user_id);
CREATE INDEX idx_project_user_created ON avatar_projects(user_id, created_at DESC);
CREATE INDEX idx_project_user_updated ON avatar_projects(user_id, updated_at DESC);

-- AvatarGeneration indexes (worker queries)
CREATE INDEX idx_gen_user_id ON avatar_generations(user_id);
CREATE INDEX idx_gen_status ON avatar_generations(status);
CREATE INDEX idx_gen_project_id ON avatar_generations(project_id);
CREATE INDEX idx_gen_user_status ON avatar_generations(user_id, status);
CREATE INDEX idx_gen_status_created ON avatar_generations(status, created_at); -- Worker queue

-- AvatarUsageHistory indexes
CREATE INDEX idx_history_avatar_id ON avatar_usage_history(avatar_id);
CREATE INDEX idx_history_user_id ON avatar_usage_history(user_id);
CREATE INDEX idx_history_app_id ON avatar_usage_history(app_id);
CREATE INDEX idx_history_avatar_created ON avatar_usage_history(avatar_id, created_at DESC);
CREATE INDEX idx_history_user_created ON avatar_usage_history(user_id, created_at DESC);

-- AvatarPreset indexes
CREATE INDEX idx_preset_category ON avatar_presets(category);
CREATE INDEX idx_preset_public ON avatar_presets(is_public);
CREATE INDEX idx_preset_category_public ON avatar_presets(category, is_public);
CREATE INDEX idx_preset_usage ON avatar_presets(usage_count DESC);
```

---

## 4. Component Breakdown - Frontend

### Current Monolithic Structure (932 lines) ⚠️

```
AvatarCreator.tsx (932 lines)
│
├─ Main Component (Lines 1-485)
│  ├─ State Management (35 lines)
│  │  ├─ Zustand store hooks
│  │  ├─ Modal visibility states
│  │  └─ Selected avatar tracking
│  │
│  ├─ Effects (3 hooks)
│  │  ├─ loadProjects on mount
│  │  ├─ selectProject when URL changes
│  │  └─ Clear project on unmount
│  │
│  ├─ Event Handlers (8 functions)
│  │  ├─ handleCreateProject
│  │  ├─ handleSelectProject
│  │  ├─ handleBackToProjects
│  │  ├─ handleDeleteProject
│  │  ├─ handleDeleteAvatar
│  │  └─ Modal open/close handlers
│  │
│  ├─ Projects List View (Lines 388-484)
│  │  ├─ Header with back button
│  │  ├─ New Project button
│  │  ├─ Projects grid (cards)
│  │  └─ Empty state
│  │
│  └─ Project Detail View (Lines 116-383)
│     ├─ Header with project info
│     ├─ Action buttons (Upload, Generate, Presets)
│     ├─ Active Generations panel
│     ├─ Avatars grid
│     └─ Empty state
│
├─ UploadAvatarModal (Lines 488-650) - 163 lines
│  ├─ File upload with preview
│  ├─ Form fields (name, gender, age, style)
│  └─ Submit handler
│
├─ GenerateAvatarModal (Lines 652-802) - 150 lines
│  ├─ Prompt textarea
│  ├─ Metadata fields (name, gender, age, style)
│  └─ Submit handler
│
└─ PresetsGalleryModal (Lines 804-932) - 128 lines
   ├─ Category filter tabs
   ├─ Presets grid
   ├─ Selection state
   └─ Custom name input
```

### Proposed Refactored Structure

```
frontend/src/apps/AvatarCreator/
│
├─ index.tsx (Main component - 100 lines)
│  ├─ Route handling
│  ├─ Layout wrapper
│  └─ View selection
│
├─ views/
│  ├─ ProjectsListView.tsx (150 lines)
│  │  ├─ Projects grid
│  │  ├─ New project button
│  │  └─ Empty state
│  │
│  └─ ProjectDetailView.tsx (200 lines)
│     ├─ Project header
│     ├─ Action buttons
│     ├─ Active generations panel
│     └─ Avatars grid
│
├─ components/
│  ├─ ProjectCard.tsx (80 lines)
│  │  └─ Single project card with actions
│  │
│  ├─ AvatarCard.tsx (120 lines)
│  │  ├─ Avatar image + thumbnail
│  │  ├─ Metadata display
│  │  ├─ Usage stats
│  │  └─ Action buttons
│  │
│  ├─ GenerationStatus.tsx (60 lines)
│  │  └─ Active generation card with progress
│  │
│  ├─ AvatarGrid.tsx (50 lines)
│  │  └─ Responsive grid layout
│  │
│  └─ EmptyState.tsx (40 lines)
│     └─ Reusable empty state component
│
├─ modals/
│  ├─ UploadAvatarModal.tsx (160 lines)
│  │  ├─ File upload zone
│  │  ├─ Form fields
│  │  └─ Submit logic
│  │
│  ├─ GenerateAvatarModal.tsx (150 lines)
│  │  ├─ Prompt input
│  │  ├─ Metadata form
│  │  └─ Submit logic
│  │
│  └─ PresetsGalleryModal.tsx (130 lines)
│     ├─ Category tabs
│     ├─ Presets grid
│     └─ Selection logic
│
├─ hooks/
│  ├─ useAvatarGeneration.ts (80 lines)
│  │  ├─ Generation submission
│  │  ├─ Status polling logic
│  │  └─ Completion handling
│  │
│  ├─ useProjectManagement.ts (100 lines)
│  │  ├─ CRUD operations
│  │  └─ Navigation logic
│  │
│  └─ useAvatarActions.ts (60 lines)
│     ├─ Upload handler
│     ├─ Delete handler
│     └─ Usage tracking
│
└─ types/
   └─ index.ts (100 lines)
      └─ Shared TypeScript interfaces
```

**Benefits:**
- Each file < 200 lines
- Testable components
- Reusable across platform
- Better code splitting
- Easier to maintain

---

## 5. State Management - Zustand Store

```
┌─────────────────────────────────────────────────────────────────┐
│                   avatarCreatorStore (Zustand)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  State:                                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  projects: AvatarProject[]                                  │ │
│  │  currentProject: AvatarProject | null                       │ │
│  │  isLoadingProjects: boolean                                 │ │
│  │  isUploading: boolean                                       │ │
│  │  isGenerating: boolean                                      │ │
│  │  isSaving: boolean                                          │ │
│  │  lastSaved: Date | null                                     │ │
│  │                                                              │ │
│  │  activeGenerations: Map<id, AvatarGeneration>              │ │
│  │  generationPollingIntervals: Map<id, IntervalID>           │ │
│  │                                                              │ │
│  │  presets: AvatarPreset[]                                    │ │
│  │  isLoadingPresets: boolean                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Actions (Project Management):                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  loadProjects()                                             │ │
│  │    └─> GET /api/apps/avatar-creator/projects               │ │
│  │                                                              │ │
│  │  createProject(name, description)                           │ │
│  │    └─> POST /api/apps/avatar-creator/projects              │ │
│  │                                                              │ │
│  │  selectProject(projectId)                                   │ │
│  │    └─> GET /api/apps/avatar-creator/projects/:id           │ │
│  │                                                              │ │
│  │  updateProject(projectId, data)                             │ │
│  │    └─> PUT /api/apps/avatar-creator/projects/:id           │ │
│  │                                                              │ │
│  │  deleteProject(projectId)                                   │ │
│  │    └─> DELETE /api/apps/avatar-creator/projects/:id        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Actions (Avatar Management):                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  uploadAvatar(projectId, file, metadata)                    │ │
│  │    └─> POST /projects/:id/avatars/upload                   │ │
│  │                                                              │ │
│  │  generateAvatar(projectId, prompt, metadata)                │ │
│  │    ├─> POST /projects/:id/avatars/generate                 │ │
│  │    └─> startGenerationPolling(generationId) ⚠️             │ │
│  │                                                              │ │
│  │  deleteAvatar(avatarId)                                     │ │
│  │    └─> DELETE /api/apps/avatar-creator/avatars/:id         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Actions (Generation Polling) ⚠️:                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  startGenerationPolling(generationId)                       │ │
│  │    ├─> Create interval: setInterval(() => {...}, 5000)     │ │
│  │    └─> Store in generationPollingIntervals Map             │ │
│  │                                                              │ │
│  │  checkGenerationStatus(generationId)                        │ │
│  │    ├─> GET /api/apps/avatar-creator/generations/:id        │ │
│  │    └─> If completed:                                        │ │
│  │        ├─> stopGenerationPolling(generationId)             │ │
│  │        ├─> GET /avatars/:avatarId                          │ │
│  │        └─> Add avatar to currentProject                     │ │
│  │                                                              │ │
│  │  stopGenerationPolling(generationId)                        │ │
│  │    ├─> clearInterval(interval)                             │ │
│  │    └─> Remove from generationPollingIntervals Map          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Actions (Presets):                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  loadPresets(category?)                                     │ │
│  │    └─> GET /api/apps/avatar-creator/presets?category=...   │ │
│  │                                                              │ │
│  │  createAvatarFromPreset(projectId, presetId, customName)   │ │
│  │    ├─> POST /projects/:id/avatars/from-preset              │ │
│  │    └─> startGenerationPolling(generationId)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Polling Mechanism (Problematic) ⚠️

```typescript
// store.ts:416 - Current implementation
startGenerationPolling: (generationId: string) => {
  // Poll every 5 seconds
  const interval = setInterval(() => {
    checkGenerationStatus(generationId)
  }, 5000)

  set((state) => {
    state.generationPollingIntervals.set(generationId, interval)
  })

  // Initial check
  checkGenerationStatus(generationId)
}
```

**Problem at scale:**
- 1,000 users × 2 active generations = 2,000 polls
- 2,000 / 5s = 400 req/s
- Each request hits database
- Server CPU overload

**Solution (WebSocket):**
```typescript
// Proposed: WebSocket-based updates
useEffect(() => {
  socket.on('generation:completed', (data) => {
    const { generationId, avatar } = data
    addAvatarToProject(avatar)
    removeActiveGeneration(generationId)
  })

  socket.on('generation:failed', (data) => {
    const { generationId, error } = data
    updateGenerationStatus(generationId, 'failed', error)
  })
}, [])
```

---

## 6. File Storage Architecture

### Current Structure (Local Filesystem)

```
project-root/
└── uploads/
    └── avatar-creator/
        ├── user-abc123/
        │   ├── 1729000001.jpg (1.2 MB) ← Original
        │   ├── 1729000001_thumb.jpg (45 KB) ← Thumbnail 300x300
        │   ├── 1729000002.jpg
        │   ├── 1729000002_thumb.jpg
        │   └── ...
        │
        ├── user-def456/
        │   ├── 1729000010.jpg
        │   ├── 1729000010_thumb.jpg
        │   └── ...
        │
        └── user-xyz789/
            └── ...
```

### File Processing Pipeline

```
┌──────────────────────────┐
│  User uploads image       │
│  (via FormData)           │
└────────────┬──────────────┘
             │
             │ HTTP POST multipart/form-data
             │
┌────────────▼──────────────┐
│  Backend Route            │
│  routes.ts:148            │
│                           │
│  - Extract File object    │
│  - Validate file type     │
│  - Validate file size     │
│    (max 10MB)             │
└────────────┬──────────────┘
             │
             │ Pass to service
             │
┌────────────▼──────────────┐
│  Service Layer            │
│  service.ts:93            │
│                           │
│  1. Validate file:        │
│     - Type check          │
│     - Size check          │
│                           │
│  2. Convert to Buffer:    │
│     Buffer.from(          │
│       await file          │
│         .arrayBuffer())   │
└────────────┬──────────────┘
             │
             │ Save to filesystem
             │
┌────────────▼──────────────┐
│  File Processing          │
│  service.ts:429           │
│                           │
│  1. Create user directory │
│     mkdir -p uploads/     │
│       avatar-creator/     │
│       {userId}/           │
│                           │
│  2. Generate filename:    │
│     timestamp = Date.now()│
│     {timestamp}.jpg       │
│                           │
│  3. Save original:        │
│     fs.writeFile(         │
│       imageFullPath,      │
│       imageBuffer)        │
│                           │
│  4. Generate thumbnail:   │
│     sharp(imageBuffer)    │
│       .resize(300, 300,   │
│         {fit: 'cover'})   │
│       .jpeg({quality: 85})│
│       .toBuffer()         │
│                           │
│  5. Save thumbnail:       │
│     fs.writeFile(         │
│       thumbnailPath,      │
│       thumbnailBuffer)    │
└────────────┬──────────────┘
             │
             │ Return paths
             │
┌────────────▼──────────────┐
│  Database Storage         │
│                           │
│  INSERT INTO avatars:     │
│  - baseImageUrl:          │
│    /uploads/avatar-       │
│     creator/{userId}/     │
│     {timestamp}.jpg       │
│                           │
│  - thumbnailUrl:          │
│    /uploads/avatar-       │
│     creator/{userId}/     │
│     {timestamp}_thumb.jpg │
└───────────────────────────┘
```

### Proposed Object Storage (S3-Compatible)

```
┌────────────────────────────────────────────────┐
│           S3-Compatible Storage                 │
│  (AWS S3, Cloudflare R2, DigitalOcean Spaces)  │
├────────────────────────────────────────────────┤
│                                                 │
│  Bucket: lumiku-avatars                         │
│  Region: auto / nearest                         │
│                                                 │
│  Structure:                                     │
│  ├── production/                                │
│  │   ├── user-abc123/                           │
│  │   │   ├── 1729000001.jpg                     │
│  │   │   ├── 1729000001-thumb.jpg               │
│  │   │   └── ...                                │
│  │   └── user-def456/                           │
│  │       └── ...                                │
│  │                                              │
│  └── staging/                                   │
│      └── ...                                    │
│                                                 │
│  Public Access: CDN-enabled                     │
│  URLs: https://cdn.lumiku.com/avatars/...      │
│                                                 │
│  Lifecycle Rules:                               │
│  - Delete after 365 days (optional)             │
│  - Transition to cold storage after 90 days     │
└────────────────────────────────────────────────┘
```

---

## 7. Scalability Bottlenecks Visualized

### Problem 1: Frontend Polling

```
Time:       0s      5s      10s     15s     20s     25s     30s
            │       │       │       │       │       │       │
User 1:     ├───────┼───────┼───────┼───────┼───────┼───────┤  (Generation 1)
            Poll    Poll    Poll    Poll    Poll    Poll    Complete
            │       │       │       │       │       │       │
User 2:     ├───────┼───────┼───────┼───────┼───────┼───────┤  (Generation 2)
            Poll    Poll    Poll    Poll    Poll    Poll    Complete
            │       │       │       │       │       │       │
User 3:     ├───────┼───────┼───────┼───────┼───────┼───────┤  (Generation 3)
            Poll    Poll    Poll    Poll    Poll    Poll    Complete
            │       │       │       │       │       │       │
            ▼       ▼       ▼       ▼       ▼       ▼       ▼
          3 req   3 req   3 req   3 req   3 req   3 req   3 req

Total requests in 30s: 21 requests for just 3 users

At 1,000 users with 2 generations each:
= 2,000 active generations
= 2,000 / 5s = 400 requests/second
= 24,000 requests/minute
= 1,440,000 requests/hour
```

### Problem 2: Worker Concurrency

```
Current (Concurrency: 2)
────────────────────────────────────────────────────────────
Queue:    [Job1][Job2][Job3][Job4][Job5][Job6][Job7][Job8]
          ↓     ↓
Worker:   [Processing Job1 - 30s]
          [Processing Job2 - 30s]

Timeline:
0-30s:    Job1, Job2 processing (2 concurrent)
30-60s:   Job3, Job4 processing (2 concurrent)
60-90s:   Job5, Job6 processing (2 concurrent)
90-120s:  Job7, Job8 processing (2 concurrent)

Result: 8 jobs in 120 seconds = 4 jobs/minute


Proposed (Horizontal Scaling: 10 workers × 2 concurrency = 20)
────────────────────────────────────────────────────────────
Queue:    [Job1][Job2][Job3][Job4][Job5][Job6]...[Job20]
          ↓    ↓    ↓    ↓    ↓    ↓       ↓       ↓
Workers:  [Job1][Job2][Job3][Job4]...[Job18][Job19][Job20]
          (20 concurrent jobs)

Timeline:
0-30s:    All 20 jobs processing simultaneously
30-60s:   Next 20 jobs...

Result: 20 jobs in 30 seconds = 40 jobs/minute

Improvement: 10x throughput
```

### Problem 3: Database Connection Pool

```
Current: Default Prisma connection pool
────────────────────────────────────────────────────────────
Pool Size: ~10 connections (estimated)

At 400 req/s (polling):
- Each request needs 1 connection
- Request duration: ~50ms
- Concurrent requests: 400 × 0.05 = 20 concurrent

Result: Connection pool exhaustion ⚠️

Error: "Can't reach database server"


Solution: Increase pool size + Read replicas
────────────────────────────────────────────────────────────
Primary DB:
  Pool Size: 50 connections
  Handles: Writes (creates, updates, deletes)

Read Replica 1:
  Pool Size: 50 connections
  Handles: Status checks, avatar fetches

Read Replica 2:
  Pool Size: 50 connections
  Handles: Project lists, presets

Total capacity: 150 concurrent connections
+ Load balancing across replicas
= Handles 3,000+ req/s comfortably
```

---

## 8. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: Authentication
──────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  authMiddleware                                              │
│  - Extracts JWT from Authorization header                    │
│  - Verifies JWT signature                                    │
│  - Checks expiration                                          │
│  - Injects userId into context                               │
│  - Returns 401 if invalid                                    │
└─────────────────────────────────────────────────────────────┘

Layer 2: Authorization (Ownership Verification)
──────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  Service Layer Checks                                        │
│  - Every read: Verify userId matches resource owner          │
│  - Every write: Verify userId matches resource owner         │
│  - Cross-user access: DENIED                                 │
│                                                              │
│  Example:                                                    │
│  async getProjectById(projectId, userId) {                   │
│    const project = await repo.findProjectById(              │
│      projectId,                                             │
│      userId  ← Ensures user owns this project               │
│    )                                                         │
│    if (!project) throw Error('Not found')                   │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘

Layer 3: Input Validation ⚠️ (Basic, needs improvement)
──────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  Current: Manual checks                                      │
│  - Project name: non-empty string                            │
│  - File upload: type and size                                │
│  - No length limits                                          │
│  - No special character filtering                            │
│  - No SQL injection protection (Prisma handles this)         │
│                                                              │
│  ⚠️ Missing:                                                 │
│  - Max length validation                                     │
│  - Regex pattern validation                                  │
│  - Enum validation for sourceType, status, etc.             │
│                                                              │
│  Recommendation: Use Zod schemas                             │
└─────────────────────────────────────────────────────────────┘

Layer 4: Rate Limiting ❌ (MISSING)
──────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  ❌ No rate limiting implemented                             │
│                                                              │
│  Risks:                                                      │
│  - Spam generation requests                                  │
│  - DOS attacks                                               │
│  - Credit abuse                                              │
│                                                              │
│  Needed:                                                     │
│  - Per-user: 50 generations/day                             │
│  - Per-IP: 100 requests/minute                              │
│  - Per-endpoint: Custom limits                               │
└─────────────────────────────────────────────────────────────┘

Layer 5: File Upload Security
──────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  ✅ MIME type validation                                     │
│  ✅ File size limit (10MB)                                   │
│  ✅ User-isolated directories                                │
│  ⚠️  No virus scanning                                       │
│  ⚠️  No image content validation (NSFW, etc.)                │
│  ⚠️  No filename sanitization (timestamp-based = OK)         │
└─────────────────────────────────────────────────────────────┘

Layer 6: Credit System ❌ (DISABLED)
──────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  ❌ Credit checks disabled (all costs = 0)                   │
│                                                              │
│  Security risk:                                              │
│  - Unlimited free generations                                │
│  - No abuse prevention                                       │
│  - No cost control                                           │
└─────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0
**Last Updated:** October 14, 2025
**Maintained By:** Architecture Team

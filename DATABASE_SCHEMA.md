# Background Remover Pro - Database Schema Documentation

## Table of Contents
1. [Overview](#overview)
2. [Schema Diagram](#schema-diagram)
3. [Table Definitions](#table-definitions)
4. [Index Strategy](#index-strategy)
5. [Relationships](#relationships)
6. [Migration Guide](#migration-guide)
7. [Query Examples](#query-examples)
8. [Performance Optimization](#performance-optimization)
9. [Data Retention Policy](#data-retention-policy)
10. [Backup Strategy](#backup-strategy)

---

## Overview

The Background Remover Pro database schema consists of **5 core tables** designed to handle:
- Individual removal jobs tracking
- Batch processing with 500+ images
- Subscription-based unlimited usage
- Daily quota management
- Volume discount calculations

### Design Principles

1. **Normalization**: Separate concerns (jobs, batches, subscriptions) into distinct tables
2. **Performance**: Strategic indexes for common query patterns
3. **Scalability**: Support for millions of jobs without performance degradation
4. **Audit Trail**: Timestamps and status tracking for all operations
5. **Data Integrity**: Foreign keys and cascading deletes where appropriate

### Database Requirements

- **PostgreSQL**: 14.x or higher (for better JSON support)
- **Storage**: ~1KB per job record, ~500KB per batch
- **Estimated size**: 10GB for 10M jobs + images

---

## Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                   background_removal_jobs                            │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)                      String (cuid)                          │
│ user_id                      String                                 │
│ tier                         String (enum)                          │
│ original_url                 String                                 │
│ processed_url                String?                                │
│ credits_used                 Int                                    │
│ pricing_type                 String (subscription | credits)        │
│ status                       String (pending | processing | ...)    │
│ error_message                String?                                │
│ processing_time_ms           Int?                                   │
│ ai_provider                  String (huggingface | segmind)         │
│ model_name                   String                                 │
│ file_size_bytes              Int                                    │
│ image_width                  Int?                                   │
│ image_height                 Int?                                   │
│ format                       String (png | jpg | webp)              │
│ batch_id                     String? (FK)                           │
│ created_at                   DateTime                               │
│ updated_at                   DateTime                               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ batch_id (FK)
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              background_removal_batch_items                          │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)                      String (cuid)                          │
│ batch_id (FK)                String                                 │
│ original_filename            String                                 │
│ original_url                 String                                 │
│ processed_url                String?                                │
│ status                       String (pending | processing | ...)    │
│ error_message                String?                                │
│ processing_time_ms           Int?                                   │
│ retry_count                  Int (default: 0)                       │
│ file_size_bytes              Int                                    │
│ position                     Int (0-499)                            │
│ created_at                   DateTime                               │
│ updated_at                   DateTime                               │
│ processed_at                 DateTime?                              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ batch_id (FK)
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              background_removal_batches                              │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)                      String (cuid)                          │
│ user_id                      String                                 │
│ tier                         String (enum)                          │
│ total_images                 Int                                    │
│ processed_images             Int (default: 0)                       │
│ failed_images                Int (default: 0)                       │
│ total_credits                Int (after discount)                   │
│ base_credits                 Int (before discount)                  │
│ discount_percentage          Int (0, 5, 10, 15, 20)                 │
│ discount_amount              Int (credits saved)                    │
│ status                       String (pending | processing | ...)    │
│ progress_percentage          Int (0-100)                            │
│ queue_job_id                 String? (BullMQ job ID)                │
│ zip_url                      String?                                │
│ zip_size_bytes               Int?                                   │
│ email_sent                   Boolean (default: false)               │
│ email_sent_at                DateTime?                              │
│ started_at                   DateTime?                              │
│ completed_at                 DateTime?                              │
│ created_at                   DateTime                               │
│ updated_at                   DateTime                               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ user_id
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│           background_remover_subscriptions                           │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)                      String (cuid)                          │
│ user_id (UNIQUE)             String                                 │
│ plan                         String (starter | pro)                 │
│ daily_quota                  Int (50 or 200)                        │
│ allowed_tiers                String[] (['basic', 'standard'])       │
│ professional_daily_quota     Int (default: 50)                      │
│ professional_used_today      Int (default: 0)                       │
│ status                       String (active | cancelled | expired)  │
│ monthly_price                Int (IDR: 99000 or 299000)             │
│ next_billing_date            DateTime                               │
│ subscribed_at                DateTime                               │
│ cancelled_at                 DateTime?                              │
│ expires_at                   DateTime?                              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ subscription_id (FK)
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│        background_remover_subscription_usage                         │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)                      String (cuid)                          │
│ subscription_id (FK)         String                                 │
│ user_id                      String                                 │
│ date                         Date                                   │
│ tier                         String                                 │
│ removals_count               Int (default: 0)                       │
│ created_at                   DateTime                               │
│ updated_at                   DateTime                               │
│ UNIQUE(subscription_id, date, tier)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### 1. background_removal_jobs

**Purpose**: Tracks every individual background removal operation.

**Fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | String (cuid) | No | Primary key, unique job identifier |
| `user_id` | String | No | User who created the job |
| `tier` | String | No | Quality tier: basic, standard, professional, industry |
| `original_url` | String | No | Path to original uploaded image |
| `processed_url` | String | Yes | Path to processed image (null if failed) |
| `credits_used` | Int | No | Credits deducted (0 if subscription) |
| `pricing_type` | String | No | How this was paid: 'subscription' or 'credits' |
| `status` | String | No | pending, processing, completed, failed |
| `error_message` | String | Yes | Error details if status = failed |
| `processing_time_ms` | Int | Yes | Milliseconds taken by AI processing |
| `ai_provider` | String | No | huggingface or segmind |
| `model_name` | String | No | Specific model used (rmbg-1.4, birefnet-general, etc) |
| `file_size_bytes` | Int | No | Original file size |
| `image_width` | Int | Yes | Original image width in pixels |
| `image_height` | Int | Yes | Original image height in pixels |
| `format` | String | No | Image format: png, jpg, webp |
| `batch_id` | String | Yes | FK to batch_items if part of batch |
| `created_at` | DateTime | No | When job was created |
| `updated_at` | DateTime | No | Last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_jobs_user_created ON background_removal_jobs(user_id, created_at DESC);
CREATE INDEX idx_jobs_status_created ON background_removal_jobs(status, created_at DESC);
CREATE INDEX idx_jobs_batch ON background_removal_jobs(batch_id);
CREATE INDEX idx_jobs_tier_created ON background_removal_jobs(tier, created_at DESC);
```

**Constraints**:
```sql
-- Tier must be one of the allowed values
CHECK (tier IN ('basic', 'standard', 'professional', 'industry'))

-- Status must be valid
CHECK (status IN ('pending', 'processing', 'completed', 'failed'))

-- Pricing type must be valid
CHECK (pricing_type IN ('subscription', 'credits'))

-- Credits used must be non-negative
CHECK (credits_used >= 0)
```

**Example Record**:
```json
{
  "id": "clx1a2b3c4d5e6f7g8h9i0j1",
  "user_id": "user_123",
  "tier": "professional",
  "original_url": "/uploads/background-remover/user_123/abc123.jpg",
  "processed_url": "/processed/background-remover/user_123/abc123-removed.png",
  "credits_used": 15,
  "pricing_type": "credits",
  "status": "completed",
  "error_message": null,
  "processing_time_ms": 3245,
  "ai_provider": "segmind",
  "model_name": "birefnet-general",
  "file_size_bytes": 2457600,
  "image_width": 1920,
  "image_height": 1080,
  "format": "jpg",
  "batch_id": null,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:03Z"
}
```

---

### 2. background_removal_batches

**Purpose**: Tracks batch processing jobs (2-500 images).

**Fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | String (cuid) | No | Primary key, batch identifier |
| `user_id` | String | No | User who created the batch |
| `tier` | String | No | Quality tier applied to all images |
| `total_images` | Int | No | Total number of images in batch |
| `processed_images` | Int | No | Count of successfully processed images |
| `failed_images` | Int | No | Count of failed images |
| `total_credits` | Int | No | Final cost after volume discount |
| `base_credits` | Int | No | Cost before discount (for transparency) |
| `discount_percentage` | Int | No | 0, 5, 10, 15, or 20 |
| `discount_amount` | Int | No | Credits saved via volume discount |
| `status` | String | No | pending, processing, completed, failed, cancelled |
| `progress_percentage` | Int | No | 0-100, calculated progress |
| `queue_job_id` | String | Yes | BullMQ job ID for tracking |
| `zip_url` | String | Yes | Download link for ZIP file |
| `zip_size_bytes` | Int | Yes | Size of generated ZIP |
| `email_sent` | Boolean | No | Whether completion email was sent |
| `email_sent_at` | DateTime | Yes | When email was sent |
| `started_at` | DateTime | Yes | When processing actually started |
| `completed_at` | DateTime | Yes | When processing finished |
| `created_at` | DateTime | No | When batch was created |
| `updated_at` | DateTime | No | Last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_batches_user_created ON background_removal_batches(user_id, created_at DESC);
CREATE INDEX idx_batches_status_created ON background_removal_batches(status, created_at DESC);
CREATE INDEX idx_batches_queue_job ON background_removal_batches(queue_job_id);
```

**Constraints**:
```sql
CHECK (total_images BETWEEN 1 AND 500)
CHECK (processed_images >= 0 AND processed_images <= total_images)
CHECK (failed_images >= 0 AND failed_images <= total_images)
CHECK (discount_percentage IN (0, 5, 10, 15, 20))
CHECK (progress_percentage BETWEEN 0 AND 100)
```

**Example Record**:
```json
{
  "id": "batch_xyz789",
  "user_id": "user_123",
  "tier": "standard",
  "total_images": 100,
  "processed_images": 98,
  "failed_images": 2,
  "total_credits": 720,
  "base_credits": 800,
  "discount_percentage": 10,
  "discount_amount": 80,
  "status": "completed",
  "progress_percentage": 100,
  "queue_job_id": "bullmq:job:456",
  "zip_url": "/batches/batch_xyz789.zip",
  "zip_size_bytes": 157286400,
  "email_sent": true,
  "email_sent_at": "2025-01-15T11:45:00Z",
  "started_at": "2025-01-15T11:00:00Z",
  "completed_at": "2025-01-15T11:45:00Z",
  "created_at": "2025-01-15T10:55:00Z",
  "updated_at": "2025-01-15T11:45:00Z"
}
```

---

### 3. background_removal_batch_items

**Purpose**: Individual items within a batch, tracking per-image status.

**Fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | String (cuid) | No | Primary key |
| `batch_id` | String (FK) | No | Foreign key to batches table |
| `original_filename` | String | No | User's original filename |
| `original_url` | String | No | Path to uploaded image |
| `processed_url` | String | Yes | Path to processed image |
| `status` | String | No | pending, processing, completed, failed |
| `error_message` | String | Yes | Error details if failed |
| `processing_time_ms` | Int | Yes | Time taken for this specific image |
| `retry_count` | Int | No | Number of retry attempts (max 3) |
| `file_size_bytes` | Int | No | Original file size |
| `position` | Int | No | Order in batch (0-499) |
| `created_at` | DateTime | No | When item was created |
| `updated_at` | DateTime | No | Last update |
| `processed_at` | DateTime | Yes | When processing completed |

**Indexes**:
```sql
CREATE INDEX idx_batch_items_batch_position ON background_removal_batch_items(batch_id, position);
CREATE INDEX idx_batch_items_status ON background_removal_batch_items(status);
```

**Constraints**:
```sql
CHECK (position BETWEEN 0 AND 499)
CHECK (retry_count BETWEEN 0 AND 3)
FOREIGN KEY (batch_id) REFERENCES background_removal_batches(id) ON DELETE CASCADE
```

**Example Record**:
```json
{
  "id": "item_001",
  "batch_id": "batch_xyz789",
  "original_filename": "product_001.jpg",
  "original_url": "/uploads/batch_xyz789/product_001.jpg",
  "processed_url": "/processed/batch_xyz789/product_001-removed.png",
  "status": "completed",
  "error_message": null,
  "processing_time_ms": 2890,
  "retry_count": 0,
  "file_size_bytes": 1048576,
  "position": 0,
  "created_at": "2025-01-15T10:55:00Z",
  "updated_at": "2025-01-15T11:02:00Z",
  "processed_at": "2025-01-15T11:02:00Z"
}
```

---

### 4. background_remover_subscriptions

**Purpose**: Manages subscription plans for unlimited usage.

**Fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | String (cuid) | No | Primary key |
| `user_id` | String (UNIQUE) | No | User who owns subscription |
| `plan` | String | No | starter or pro |
| `daily_quota` | Int | No | 50 for starter, 200 for pro |
| `allowed_tiers` | String[] | No | Tiers user can access |
| `professional_daily_quota` | Int | No | Max professional tier uses (Pro plan only) |
| `professional_used_today` | Int | No | Count of professional tier uses today |
| `status` | String | No | active, cancelled, expired |
| `monthly_price` | Int | No | Price in IDR (99000 or 299000) |
| `next_billing_date` | DateTime | No | When next payment is due |
| `subscribed_at` | DateTime | No | Initial subscription date |
| `cancelled_at` | DateTime | Yes | When user cancelled |
| `expires_at` | DateTime | Yes | When subscription ends |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_subscriptions_user ON background_remover_subscriptions(user_id);
CREATE INDEX idx_subscriptions_user_status ON background_remover_subscriptions(user_id, status);
```

**Constraints**:
```sql
CHECK (plan IN ('starter', 'pro'))
CHECK (status IN ('active', 'cancelled', 'expired'))
CHECK (daily_quota > 0)
CHECK (professional_daily_quota >= 0)
```

**Example Record (Starter)**:
```json
{
  "id": "sub_abc123",
  "user_id": "user_123",
  "plan": "starter",
  "daily_quota": 50,
  "allowed_tiers": ["basic", "standard"],
  "professional_daily_quota": 0,
  "professional_used_today": 0,
  "status": "active",
  "monthly_price": 99000,
  "next_billing_date": "2025-02-15T00:00:00Z",
  "subscribed_at": "2025-01-15T00:00:00Z",
  "cancelled_at": null,
  "expires_at": null
}
```

**Example Record (Pro)**:
```json
{
  "id": "sub_def456",
  "user_id": "user_456",
  "plan": "pro",
  "daily_quota": 200,
  "allowed_tiers": ["basic", "standard", "professional"],
  "professional_daily_quota": 50,
  "professional_used_today": 12,
  "status": "active",
  "monthly_price": 299000,
  "next_billing_date": "2025-02-15T00:00:00Z",
  "subscribed_at": "2025-01-15T00:00:00Z",
  "cancelled_at": null,
  "expires_at": null
}
```

---

### 5. background_remover_subscription_usage

**Purpose**: Daily usage tracking for subscription quotas.

**Fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | String (cuid) | No | Primary key |
| `subscription_id` | String (FK) | No | Foreign key to subscriptions |
| `user_id` | String | No | User ID (denormalized for faster queries) |
| `date` | Date | No | Usage date (normalized to midnight) |
| `tier` | String | No | Which tier was used |
| `removals_count` | Int | No | Number of removals on this date/tier |
| `created_at` | DateTime | No | When record was created |
| `updated_at` | DateTime | No | Last update |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_usage_subscription_date_tier
  ON background_remover_subscription_usage(subscription_id, date, tier);
CREATE INDEX idx_usage_user_date
  ON background_remover_subscription_usage(user_id, date DESC);
```

**Constraints**:
```sql
CHECK (removals_count >= 0)
FOREIGN KEY (subscription_id)
  REFERENCES background_remover_subscriptions(id) ON DELETE CASCADE
```

**Example Record**:
```json
{
  "id": "usage_001",
  "subscription_id": "sub_abc123",
  "user_id": "user_123",
  "date": "2025-01-15T00:00:00Z",
  "tier": "standard",
  "removals_count": 23,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T16:30:00Z"
}
```

---

## Index Strategy

### Why These Indexes Matter

Indexes are crucial for query performance. Without proper indexes, queries on large datasets (millions of records) can take seconds or minutes. With indexes, the same queries run in milliseconds.

### Index Rationale

#### 1. User-Based Queries
```sql
CREATE INDEX idx_jobs_user_created
  ON background_removal_jobs(user_id, created_at DESC);
```
**Why**: Users frequently query "my recent jobs". Compound index on user_id + created_at enables fast sorting.

**Query Example**:
```sql
SELECT * FROM background_removal_jobs
WHERE user_id = 'user_123'
ORDER BY created_at DESC
LIMIT 20;
```
**Performance**: Without index: ~500ms on 1M records. With index: ~5ms.

#### 2. Status-Based Queries
```sql
CREATE INDEX idx_jobs_status_created
  ON background_removal_jobs(status, created_at DESC);
```
**Why**: Admin dashboards need to show "all failed jobs" or "recent pending jobs".

**Query Example**:
```sql
SELECT * FROM background_removal_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 50;
```

#### 3. Batch Relationship Queries
```sql
CREATE INDEX idx_jobs_batch
  ON background_removal_jobs(batch_id);
```
**Why**: Workers need to quickly find all jobs in a batch.

**Query Example**:
```sql
SELECT COUNT(*) FROM background_removal_jobs
WHERE batch_id = 'batch_xyz789'
AND status = 'completed';
```

#### 4. Subscription Usage Unique Constraint
```sql
CREATE UNIQUE INDEX idx_usage_subscription_date_tier
  ON background_remover_subscription_usage(subscription_id, date, tier);
```
**Why**: Enforces one record per user/date/tier combination. Enables UPSERT logic.

**UPSERT Example**:
```sql
INSERT INTO background_remover_subscription_usage
  (subscription_id, user_id, date, tier, removals_count)
VALUES ('sub_abc', 'user_123', '2025-01-15', 'standard', 1)
ON CONFLICT (subscription_id, date, tier)
DO UPDATE SET removals_count = removals_count + 1;
```

### Index Maintenance

```sql
-- Analyze index usage (PostgreSQL)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'background_removal%'
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
  AND tablename LIKE 'background_removal%';
```

---

## Relationships

### Entity Relationship Diagram (Text)

```
users (external)
  │
  ├─── 1:N ──► background_removal_jobs
  │              └── FK: user_id
  │
  ├─── 1:N ──► background_removal_batches
  │              └── FK: user_id
  │
  └─── 1:1 ──► background_remover_subscriptions
                 └── FK: user_id (UNIQUE)
                       │
                       └─── 1:N ──► background_remover_subscription_usage
                                      └── FK: subscription_id

background_removal_batches
  │
  └─── 1:N ──► background_removal_batch_items
                 └── FK: batch_id
                       │
                       └─── 1:1 ──► background_removal_jobs
                                      └── FK: batch_id (optional)
```

### Cascade Rules

#### DELETE Batch → DELETE Items
```sql
FOREIGN KEY (batch_id)
REFERENCES background_removal_batches(id)
ON DELETE CASCADE
```
**Rationale**: When a batch is deleted, all its items should be removed. This prevents orphaned records.

#### DELETE Subscription → DELETE Usage Logs
```sql
FOREIGN KEY (subscription_id)
REFERENCES background_remover_subscriptions(id)
ON DELETE CASCADE
```
**Rationale**: Usage logs are meaningless without the subscription record.

#### DELETE User → SET NULL Jobs (External)
```sql
-- Handled at application level
-- When user is deleted, jobs remain for analytics
-- But user_id can be anonymized
```

---

## Migration Guide

### Initial Migration

```bash
# Generate migration
bunx prisma migrate dev --name init_background_remover

# This creates: prisma/migrations/20250115_init_background_remover/migration.sql
```

### Migration SQL

```sql
-- Create background_removal_jobs table
CREATE TABLE "background_removal_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "processed_url" TEXT,
    "credits_used" INTEGER NOT NULL,
    "pricing_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "processing_time_ms" INTEGER,
    "ai_provider" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "format" TEXT NOT NULL,
    "batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create indexes for jobs
CREATE INDEX "idx_jobs_user_created" ON "background_removal_jobs"("user_id", "created_at" DESC);
CREATE INDEX "idx_jobs_status_created" ON "background_removal_jobs"("status", "created_at" DESC);
CREATE INDEX "idx_jobs_batch" ON "background_removal_jobs"("batch_id");
CREATE INDEX "idx_jobs_tier_created" ON "background_removal_jobs"("tier", "created_at" DESC);

-- Create background_removal_batches table
CREATE TABLE "background_removal_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "total_images" INTEGER NOT NULL,
    "processed_images" INTEGER NOT NULL DEFAULT 0,
    "failed_images" INTEGER NOT NULL DEFAULT 0,
    "total_credits" INTEGER NOT NULL,
    "base_credits" INTEGER NOT NULL,
    "discount_percentage" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "queue_job_id" TEXT,
    "zip_url" TEXT,
    "zip_size_bytes" INTEGER,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create indexes for batches
CREATE INDEX "idx_batches_user_created" ON "background_removal_batches"("user_id", "created_at" DESC);
CREATE INDEX "idx_batches_status_created" ON "background_removal_batches"("status", "created_at" DESC);
CREATE INDEX "idx_batches_queue_job" ON "background_removal_batches"("queue_job_id");

-- Create background_removal_batch_items table
CREATE TABLE "background_removal_batch_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "processed_url" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "processing_time_ms" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "file_size_bytes" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    FOREIGN KEY ("batch_id") REFERENCES "background_removal_batches"("id") ON DELETE CASCADE
);

-- Create indexes for batch items
CREATE INDEX "idx_batch_items_batch_position" ON "background_removal_batch_items"("batch_id", "position");
CREATE INDEX "idx_batch_items_status" ON "background_removal_batch_items"("status");

-- Create background_remover_subscriptions table
CREATE TABLE "background_remover_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL UNIQUE,
    "plan" TEXT NOT NULL,
    "daily_quota" INTEGER NOT NULL,
    "allowed_tiers" TEXT[] NOT NULL,
    "professional_daily_quota" INTEGER NOT NULL DEFAULT 50,
    "professional_used_today" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "monthly_price" INTEGER NOT NULL,
    "next_billing_date" TIMESTAMP(3) NOT NULL,
    "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3)
);

-- Create indexes for subscriptions
CREATE UNIQUE INDEX "idx_subscriptions_user" ON "background_remover_subscriptions"("user_id");
CREATE INDEX "idx_subscriptions_user_status" ON "background_remover_subscriptions"("user_id", "status");

-- Create background_remover_subscription_usage table
CREATE TABLE "background_remover_subscription_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tier" TEXT NOT NULL,
    "removals_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("subscription_id") REFERENCES "background_remover_subscriptions"("id") ON DELETE CASCADE
);

-- Create indexes for usage
CREATE UNIQUE INDEX "idx_usage_subscription_date_tier"
  ON "background_remover_subscription_usage"("subscription_id", "date", "tier");
CREATE INDEX "idx_usage_user_date"
  ON "background_remover_subscription_usage"("user_id", "date" DESC);
```

### Rollback Migration

```bash
# Rollback last migration
bunx prisma migrate resolve --rolled-back 20250115_init_background_remover

# Drop all tables (DANGEROUS!)
bunx prisma migrate reset
```

---

## Query Examples

### 1. Get User's Recent Jobs

```sql
-- Get last 20 jobs for a user
SELECT
  id,
  tier,
  status,
  credits_used,
  pricing_type,
  processing_time_ms,
  created_at
FROM background_removal_jobs
WHERE user_id = 'user_123'
ORDER BY created_at DESC
LIMIT 20;
```

**EXPLAIN Output**:
```
Index Scan using idx_jobs_user_created on background_removal_jobs
  Index Cond: (user_id = 'user_123')
  Rows: 20
  Cost: 0.42..8.95
```

### 2. Get Batch with All Items

```sql
-- Get batch details with all items
SELECT
  b.*,
  json_agg(
    json_build_object(
      'id', i.id,
      'filename', i.original_filename,
      'status', i.status,
      'processed_url', i.processed_url
    ) ORDER BY i.position
  ) as items
FROM background_removal_batches b
LEFT JOIN background_removal_batch_items i ON b.id = i.batch_id
WHERE b.id = 'batch_xyz789'
GROUP BY b.id;
```

**Result**:
```json
{
  "id": "batch_xyz789",
  "user_id": "user_123",
  "total_images": 100,
  "processed_images": 98,
  "status": "completed",
  "items": [
    {"id": "item_001", "filename": "img1.jpg", "status": "completed", ...},
    {"id": "item_002", "filename": "img2.jpg", "status": "completed", ...},
    ...
  ]
}
```

### 3. Check Subscription Quota

```sql
-- Check if user can still use subscription today
SELECT
  s.plan,
  s.daily_quota,
  COALESCE(SUM(u.removals_count), 0) as used_today,
  s.daily_quota - COALESCE(SUM(u.removals_count), 0) as remaining_quota
FROM background_remover_subscriptions s
LEFT JOIN background_remover_subscription_usage u
  ON s.id = u.subscription_id
  AND u.date = CURRENT_DATE
WHERE s.user_id = 'user_123'
  AND s.status = 'active'
GROUP BY s.id;
```

**Result**:
```
| plan    | daily_quota | used_today | remaining_quota |
|---------|-------------|------------|-----------------|
| pro     | 200         | 47         | 153             |
```

### 4. Get Failed Jobs for Retry

```sql
-- Get all failed jobs from last 24 hours
SELECT
  id,
  user_id,
  tier,
  error_message,
  created_at
FROM background_removal_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 5. Calculate User's Total Credits Spent

```sql
-- Get total credits spent by user in last 30 days
SELECT
  user_id,
  SUM(credits_used) as total_credits,
  COUNT(*) as total_jobs,
  SUM(CASE WHEN pricing_type = 'credits' THEN credits_used ELSE 0 END) as paid_credits,
  SUM(CASE WHEN pricing_type = 'subscription' THEN 1 ELSE 0 END) as subscription_uses
FROM background_removal_jobs
WHERE user_id = 'user_123'
  AND created_at > NOW() - INTERVAL '30 days'
  AND status = 'completed'
GROUP BY user_id;
```

**Result**:
```
| user_id  | total_credits | total_jobs | paid_credits | subscription_uses |
|----------|---------------|------------|--------------|-------------------|
| user_123 | 450           | 120        | 150          | 100               |
```

### 6. Get Batch Processing Statistics

```sql
-- Get average processing time per tier
SELECT
  tier,
  COUNT(*) as total_jobs,
  AVG(processing_time_ms) as avg_time_ms,
  MIN(processing_time_ms) as min_time_ms,
  MAX(processing_time_ms) as max_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time_ms) as median_time_ms
FROM background_removal_jobs
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY tier
ORDER BY tier;
```

**Result**:
```
| tier         | total_jobs | avg_time_ms | min_time_ms | max_time_ms | median_time_ms |
|--------------|------------|-------------|-------------|-------------|----------------|
| basic        | 1250       | 1845.3      | 892         | 4521        | 1723.5         |
| standard     | 890        | 2341.7      | 1203        | 5890        | 2189.0         |
| professional | 450        | 3456.2      | 1890        | 7234        | 3201.5         |
| industry     | 120        | 4123.8      | 2456        | 8901        | 3987.0         |
```

### 7. Find Batches Ready for Cleanup

```sql
-- Find completed batches older than 7 days
SELECT
  id,
  user_id,
  total_images,
  zip_size_bytes,
  completed_at
FROM background_removal_batches
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '7 days'
ORDER BY completed_at ASC
LIMIT 100;
```

---

## Performance Optimization

### 1. Partitioning Strategy (For Large Datasets)

When you have millions of jobs, consider partitioning by date:

```sql
-- Create partitioned table (PostgreSQL 10+)
CREATE TABLE background_removal_jobs_partitioned (
  LIKE background_removal_jobs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE background_removal_jobs_2025_01
  PARTITION OF background_removal_jobs_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE background_removal_jobs_2025_02
  PARTITION OF background_removal_jobs_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Auto-create partitions with pg_partman extension
```

**Benefits**:
- Queries on recent data are faster (smaller partition)
- Easy to archive/delete old partitions
- Better vacuum/analyze performance

### 2. Query Optimization

```sql
-- Bad: Full table scan
SELECT * FROM background_removal_jobs WHERE status = 'completed';

-- Good: Use covering index
CREATE INDEX idx_jobs_status_cover
  ON background_removal_jobs(status)
  INCLUDE (id, user_id, tier, created_at);
```

### 3. Connection Pooling

```typescript
// Prisma automatically pools connections
// Configure in schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pooling parameters
  // postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
}
```

### 4. Batch Inserts

```typescript
// Instead of 500 individual inserts:
for (const item of items) {
  await prisma.background_removal_batch_items.create({ data: item })
}

// Use createMany:
await prisma.background_removal_batch_items.createMany({
  data: items, // Array of 500 items
  skipDuplicates: true,
})
// 50x faster!
```

---

## Data Retention Policy

### Retention Rules

| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| Active jobs | Indefinite | For user history |
| Failed jobs | 30 days | For debugging |
| Completed batches | 90 days | Users can re-download |
| Usage logs | 1 year | For billing disputes |
| Subscription records | Indefinite | Legal requirement |
| Original images | 7 days | Reduce storage costs |
| Processed images | 30 days | Users can re-download |
| ZIP archives | 7 days | Large files, re-generate if needed |

### Cleanup Script

```sql
-- Delete old failed jobs
DELETE FROM background_removal_jobs
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '30 days';

-- Archive old completed batches
INSERT INTO background_removal_batches_archive
SELECT * FROM background_removal_batches
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '90 days';

DELETE FROM background_removal_batches
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '90 days';

-- Vacuum tables after large deletes
VACUUM ANALYZE background_removal_jobs;
VACUUM ANALYZE background_removal_batches;
```

### Automated Cleanup (Cron)

```typescript
// src/scripts/cleanup-database.ts

import prisma from '../shared/database/prisma'

async function cleanupOldRecords() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Delete old failed jobs
  const deletedJobs = await prisma.background_removal_jobs.deleteMany({
    where: {
      status: 'failed',
      created_at: { lt: thirtyDaysAgo },
    },
  })

  console.log(`Deleted ${deletedJobs.count} old failed jobs`)

  // Delete old completed batches
  const deletedBatches = await prisma.background_removal_batches.deleteMany({
    where: {
      status: 'completed',
      completed_at: { lt: ninetyDaysAgo },
    },
  })

  console.log(`Deleted ${deletedBatches.count} old completed batches`)
}

// Run daily at 2 AM
// Add to crontab: 0 2 * * * cd /path/to/app && bun run cleanup-database.ts
```

---

## Backup Strategy

### 1. Daily Full Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/var/backups/lumiku"
DB_NAME="lumiku"

# Create backup
pg_dump -U postgres -d $DB_NAME | gzip > $BACKUP_DIR/lumiku_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/lumiku_$DATE.sql.gz s3://lumiku-backups/database/

# Keep only last 7 days locally
find $BACKUP_DIR -name "lumiku_*.sql.gz" -mtime +7 -delete

echo "Backup completed: lumiku_$DATE.sql.gz"
```

### 2. Point-in-Time Recovery

```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://lumiku-backups/wal/%f'

# Restore to specific time
pg_restore --target-time="2025-01-15 12:00:00"
```

### 3. Prisma Backup/Restore

```bash
# Export schema
bunx prisma db pull

# Export data (JSON)
bunx prisma db seed

# Restore from backup
psql -U postgres -d lumiku < backup.sql
bunx prisma migrate deploy
```

---

## Database Monitoring

### Key Metrics to Track

```sql
-- Table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Slow queries (requires pg_stat_statements extension)
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%background_removal%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Lock conflicts
SELECT * FROM pg_locks WHERE NOT granted;
```

---

## Troubleshooting

### Issue 1: Slow Queries

**Symptom**: Queries taking >1 second

**Diagnosis**:
```sql
-- Check missing indexes
SELECT schemaname, tablename
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
  AND seq_tup_read > 1000;
```

**Solution**: Add missing indexes

### Issue 2: Disk Space Full

**Symptom**: Database writes failing

**Diagnosis**:
```bash
df -h /var/lib/postgresql
```

**Solution**: Run cleanup script, increase disk size

### Issue 3: Connection Pool Exhausted

**Symptom**: "too many connections" error

**Diagnosis**:
```sql
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;
```

**Solution**: Increase `max_connections` in postgresql.conf or reduce connection pool size

---

## Summary

This database schema provides:
- **Scalability**: Handle millions of jobs with proper indexes
- **Performance**: Sub-10ms queries for common operations
- **Flexibility**: Support both subscription and credit-based pricing
- **Reliability**: Proper constraints and cascade rules
- **Maintainability**: Clear structure and relationships

**Next Steps**: See API_DOCUMENTATION.md for how to interact with this schema via REST APIs.

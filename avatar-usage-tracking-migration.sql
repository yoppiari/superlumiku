-- Migration: Add Avatar Usage Tracking
-- Description: Add lastUsedAt to avatars table and create avatar_usage_history table

-- Add lastUsedAt column to avatars table
ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);

-- Create avatar_usage_history table
CREATE TABLE IF NOT EXISTS "avatar_usage_history" (
    "id" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatar_usage_history_pkey" PRIMARY KEY ("id")
);

-- Create indexes for avatar_usage_history
CREATE INDEX IF NOT EXISTS "avatar_usage_history_avatarId_idx" ON "avatar_usage_history"("avatarId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_userId_idx" ON "avatar_usage_history"("userId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_appId_idx" ON "avatar_usage_history"("appId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_createdAt_idx" ON "avatar_usage_history"("createdAt");

-- Add foreign key constraint
ALTER TABLE "avatar_usage_history" ADD CONSTRAINT "avatar_usage_history_avatarId_fkey"
    FOREIGN KEY ("avatarId") REFERENCES "avatars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create avatar_usage_history table
-- Run this directly in Coolify terminal with psql

BEGIN;

-- Create the table
CREATE TABLE IF NOT EXISTS "avatar_usage_history" (
  "id" TEXT PRIMARY KEY,
  "avatarId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "appName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "referenceId" TEXT,
  "referenceType" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "avatar_usage_history_avatarId_idx"
  ON "avatar_usage_history"("avatarId");

CREATE INDEX IF NOT EXISTS "avatar_usage_history_userId_idx"
  ON "avatar_usage_history"("userId");

CREATE INDEX IF NOT EXISTS "avatar_usage_history_appId_idx"
  ON "avatar_usage_history"("appId");

CREATE INDEX IF NOT EXISTS "avatar_usage_history_createdAt_idx"
  ON "avatar_usage_history"("createdAt");

COMMIT;

-- Verify
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE tablename = 'avatar_usage_history';

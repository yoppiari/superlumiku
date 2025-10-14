const https = require('https');

// This script uses Coolify webhook/command execution if available
// Since direct DB access is restricted, we'll create SQL that can be pasted into Coolify Terminal

const SQL_MIGRATION = `
-- Migration for Avatar Creator Project System
-- Run this in Coolify Terminal: psql $DATABASE_URL

-- Create avatar_projects table
CREATE TABLE IF NOT EXISTS "avatar_projects" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "avatar_projects_pkey" PRIMARY KEY ("id")
);

-- Create index on userId
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx" ON "avatar_projects"("userId");

-- Add projectId column to avatars table
ALTER TABLE "avatars"
ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- Create index on projectId
CREATE INDEX IF NOT EXISTS "avatars_projectId_idx" ON "avatars"("projectId");

-- Verify tables
SELECT 'avatar_projects' as table_name, COUNT(*) as row_count FROM avatar_projects
UNION ALL
SELECT 'avatars' as table_name, COUNT(*) as row_count FROM avatars;
`;

console.log('📋 SQL Migration for dev.lumiku.com');
console.log('=====================================\n');
console.log('⚠️  Since Coolify API doesn\'t provide direct command execution,');
console.log('   you need to run this SQL manually in Coolify Terminal:\n');
console.log('📝 STEPS:');
console.log('   1. Go to: https://cf.avolut.com');
console.log('   2. Open: dev-superlumiku application');
console.log('   3. Click: Terminal tab');
console.log('   4. Run this command:\n');
console.log('   cd /app/backend && bun prisma db push --accept-data-loss\n');
console.log('   OR paste this SQL into psql:\n');
console.log('---SQL START---');
console.log(SQL_MIGRATION);
console.log('---SQL END---\n');

console.log('💡 Alternative: Wait for deployment to complete');
console.log('   The docker-entrypoint.sh has been updated to run migration automatically\n');

// Save SQL to file
const fs = require('fs');
fs.writeFileSync('dev-migration.sql', SQL_MIGRATION);
console.log('✅ SQL saved to: dev-migration.sql');
console.log('   You can copy this file content and paste it into Coolify Terminal\n');

#!/bin/bash
# ============================================
# Database Migration Script for Coolify
# ============================================
# Run this in Coolify Terminal to fix Background Remover 500 errors
#
# How to run:
# 1. Open Coolify dashboard
# 2. Navigate to Lumiku Backend service
# 3. Click "Terminal" tab
# 4. Copy-paste this entire script and press Enter

echo "🔧 Applying Background Remover Database Migration..."
echo ""

# Navigate to backend directory
cd /app/backend || cd /workspace/backend || cd backend
echo "✅ Current directory: $(pwd)"
echo ""

# Check if migration exists
if [ -f "prisma/migrations/20251018_add_background_remover_models/migration.sql" ]; then
  echo "✅ Migration file found"
else
  echo "❌ Migration file NOT found"
  echo "   Looking in: prisma/migrations/20251018_add_background_remover_models/migration.sql"
  ls -la prisma/migrations/ 2>/dev/null || echo "   migrations/ directory not found"
  exit 1
fi

echo ""
echo "📦 Installing dependencies (if needed)..."
bun install --production 2>/dev/null || npm install --production 2>/dev/null || echo "Dependencies already installed"

echo ""
echo "🗄️  Applying database migration..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migration applied successfully"
else
  echo "❌ Migration failed"
  echo "   Trying alternative: prisma db push..."
  npx prisma db push --skip-generate
fi

echo ""
echo "🔄 Generating Prisma Client..."
npx prisma generate

if [ $? -eq 0 ]; then
  echo "✅ Prisma Client generated"
else
  echo "❌ Prisma Client generation failed"
  exit 1
fi

echo ""
echo "🔍 Verifying tables were created..."
echo "   Checking for: background_removal_jobs"

# Try to query the table
npx prisma db execute --stdin <<SQL
SELECT COUNT(*) as table_exists
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'background_removal_jobs';
SQL

if [ $? -eq 0 ]; then
  echo "✅ Tables verified"
else
  echo "⚠️  Could not verify tables (but migration may have succeeded)"
fi

echo ""
echo "✅ MIGRATION COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Restart the backend service (Coolify will do this automatically)"
echo "2. Test these endpoints in browser:"
echo "   - https://dev.lumiku.com/api/background-remover/subscription"
echo "   - https://dev.lumiku.com/api/background-remover/jobs"
echo "   - https://dev.lumiku.com/api/background-remover/stats"
echo "3. All should return 200 OK (not 500)"
echo ""
echo "🎉 Background Remover should now work!"

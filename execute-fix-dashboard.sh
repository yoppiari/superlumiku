#!/bin/bash

# Fix Dashboard "Page Error" - Seed Avatar Creator AI Models
# Execute this script on dev.lumiku.com server

echo "🔧 Fixing Dashboard Error - Seeding Avatar Creator AI Models"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo "Please export DATABASE_URL first:"
  echo "  export DATABASE_URL='postgresql://user:password@host:5432/database'"
  exit 1
fi

echo "📊 Current state - Checking existing AI models..."
psql "$DATABASE_URL" -c "SELECT \"appId\", COUNT(*) as model_count FROM \"AIModel\" GROUP BY \"appId\" ORDER BY \"appId\";"

echo ""
echo "🌱 Seeding Avatar Creator AI models..."
psql "$DATABASE_URL" -f fix-avatar-creator-models.sql

echo ""
echo "✅ Fix completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Restart the backend: pm2 restart lumiku-backend"
echo "  2. Check dashboard: https://dev.lumiku.com/dashboard"
echo "  3. Verify Avatar Creator appears in apps list"
echo ""

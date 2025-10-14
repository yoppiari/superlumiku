#!/bin/bash

echo "🚀 Executing migration directly in dev.lumiku.com container"
echo "================================================================"
echo ""

# Find the container name for dev-superlumiku
echo "🔍 Finding container..."

# Try common patterns
CONTAINER=$(docker ps --filter "name=dev-superlumiku" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  CONTAINER=$(docker ps --filter "name=superlumiku" --filter "name=dev" --format "{{.Names}}" | head -1)
fi

if [ -z "$CONTAINER" ]; then
  echo "❌ Could not find dev-superlumiku container"
  echo "   Available containers:"
  docker ps --format "{{.Names}}"
  exit 1
fi

echo "✅ Found container: $CONTAINER"
echo ""

# Execute migration
echo "🔨 Running Prisma migration in container..."
echo "   Command: docker exec $CONTAINER sh -c 'cd /app/backend && bun prisma db push --accept-data-loss'"
echo ""

docker exec "$CONTAINER" sh -c 'cd /app/backend && bun prisma db push --accept-data-loss --skip-generate'

RESULT=$?

if [ $RESULT -eq 0 ]; then
  echo ""
  echo "✅ Migration successful!"
  echo ""
  echo "🧪 Testing: Try creating a project again at dev.lumiku.com/apps/avatar-creator"
else
  echo ""
  echo "❌ Migration failed with exit code: $RESULT"
  echo ""
  echo "📋 Checking container logs:"
  docker logs "$CONTAINER" --tail 50
fi

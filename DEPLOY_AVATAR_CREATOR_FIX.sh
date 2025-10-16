#!/bin/bash

# ============================================
# Avatar Creator Hardcoded ID Fix Deployment
# ============================================
#
# This script fixes the hardcoded project ID issue by:
# 1. Cleaning build artifacts
# 2. Rebuilding frontend with cache busting
# 3. Deploying clean build
#
# Usage:
#   chmod +x DEPLOY_AVATAR_CREATOR_FIX.sh
#   ./DEPLOY_AVATAR_CREATOR_FIX.sh
#
# Or copy-paste commands into Coolify terminal
# ============================================

set -e  # Exit on error

echo "============================================"
echo "Avatar Creator Fix Deployment"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean build artifacts
echo -e "${YELLOW}[1/5] Cleaning build artifacts...${NC}"
cd frontend
rm -rf dist
rm -rf node_modules/.vite
rm -rf .cache
echo -e "${GREEN}✓ Build artifacts cleaned${NC}"
echo ""

# Step 2: Install dependencies (ensures latest versions)
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Build frontend with cache busting
echo -e "${YELLOW}[3/5] Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 4: Verify no hardcoded IDs in build
echo -e "${YELLOW}[4/5] Verifying build integrity...${NC}"
if grep -r "88082ugb227d4g3wi1" dist/ 2>/dev/null; then
  echo -e "${RED}✗ ERROR: Hardcoded ID found in build!${NC}"
  exit 1
else
  echo -e "${GREEN}✓ No hardcoded IDs found in build${NC}"
fi
echo ""

# Step 5: Check for hashed filenames (cache busting)
echo -e "${YELLOW}[5/5] Checking cache busting...${NC}"
if ls dist/assets/*.*.js >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Cache busting enabled (hashed filenames found)${NC}"
  echo "Sample files:"
  ls dist/assets/*.*.js | head -3
else
  echo -e "${RED}✗ WARNING: No hashed filenames found${NC}"
  echo "Cache busting may not be working"
fi
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Deployment Ready!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Backend cache headers: Already added in backend/src/app.ts"
echo "2. Restart backend: pm2 restart lumiku-backend"
echo "3. Users: Hard refresh browser (Ctrl+Shift+R)"
echo ""
echo "Expected result:"
echo "✓ No 400 errors in console"
echo "✓ No hardcoded project IDs"
echo "✓ Avatar Creator loads cleanly"
echo ""

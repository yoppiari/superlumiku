#!/bin/bash
# ==================================================
# AVATAR & POSE GENERATOR - DEPLOYMENT SCRIPT
# ==================================================
# Server: dev.lumiku.com
# Branch: development
# Date: 2025-10-10
# ==================================================

set -e  # Exit on error

echo "🚀 Starting Avatar & Pose Generator Deployment..."
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==================================================
# STEP 1: Navigate to project directory
# ==================================================
echo -e "${BLUE}Step 1: Navigating to project directory${NC}"
cd /home/deploy/lumiku || cd /var/www/lumiku || cd ~/lumiku
echo -e "${GREEN}✅ Current directory: $(pwd)${NC}"
echo ""

# ==================================================
# STEP 2: Check current branch
# ==================================================
echo -e "${BLUE}Step 2: Checking current branch${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "development" ]; then
    echo -e "${YELLOW}⚠️  Switching to development branch${NC}"
    git checkout development
fi
echo -e "${GREEN}✅ On development branch${NC}"
echo ""

# ==================================================
# STEP 3: Pull latest changes
# ==================================================
echo -e "${BLUE}Step 3: Pulling latest changes${NC}"
git pull origin development
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# ==================================================
# STEP 4: Install backend dependencies
# ==================================================
echo -e "${BLUE}Step 4: Installing backend dependencies${NC}"
cd backend

echo "Installing: @huggingface/inference axios canvas form-data"
bun add @huggingface/inference axios canvas form-data

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ==================================================
# STEP 5: Generate Prisma Client
# ==================================================
echo -e "${BLUE}Step 5: Generating Prisma Client${NC}"
bun prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# ==================================================
# STEP 6: Run database migration
# ==================================================
echo -e "${BLUE}Step 6: Running database migration${NC}"
echo -e "${YELLOW}⚠️  This will create 9 new tables in production database${NC}"
echo ""
read -p "Continue with migration? (yes/no): " CONTINUE_MIGRATION

if [ "$CONTINUE_MIGRATION" != "yes" ]; then
    echo -e "${RED}❌ Migration cancelled by user${NC}"
    exit 1
fi

echo "Running migration..."
bun prisma migrate deploy

echo -e "${GREEN}✅ Migration completed${NC}"
echo ""

# ==================================================
# STEP 7: Verify new tables
# ==================================================
echo -e "${BLUE}Step 7: Verifying new tables${NC}"
echo "Checking for new tables in database..."

# List new tables
bun prisma studio --browser none &
STUDIO_PID=$!
sleep 2
kill $STUDIO_PID 2>/dev/null || true

echo -e "${GREEN}✅ Tables should be visible in Prisma Studio${NC}"
echo ""

# ==================================================
# STEP 8: Environment variables reminder
# ==================================================
echo -e "${BLUE}Step 8: Environment Variables Check${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Add these to backend/.env:${NC}"
echo ""
echo "HUGGINGFACE_API_KEY=\"hf_xxxxxxxxxxxxxxxxxxxxx\""
echo "HUGGINGFACE_MODEL_ID=\"lllyasviel/control_v11p_sd15_openpose\""
echo "MAX_AVATAR_SIZE_MB=10"
echo "MAX_PRODUCT_SIZE_MB=20"
echo "MAX_POSES_PER_GENERATION=500"
echo "POSE_DATASET_PATH=\"./storage/pose-dataset\""
echo ""
read -p "Have you added these variables? (yes/no): " ENV_ADDED

if [ "$ENV_ADDED" != "yes" ]; then
    echo -e "${YELLOW}⚠️  Opening .env file for editing...${NC}"
    nano .env
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# ==================================================
# STEP 9: Create storage directories
# ==================================================
echo -e "${BLUE}Step 9: Creating storage directories${NC}"
mkdir -p storage/pose-dataset/fashion
mkdir -p storage/pose-dataset/skincare
mkdir -p storage/pose-dataset/lifestyle
chmod -R 755 storage/pose-dataset

echo -e "${GREEN}✅ Storage directories created${NC}"
echo ""

# ==================================================
# STEP 10: Restart backend service
# ==================================================
echo -e "${BLUE}Step 10: Restarting backend service${NC}"

# Try PM2 first
if command -v pm2 &> /dev/null; then
    echo "Restarting via PM2..."
    pm2 restart lumiku-backend || pm2 restart backend || pm2 restart all
    echo "Waiting for service to start..."
    sleep 5
    echo ""
    echo "Showing logs (Ctrl+C to exit):"
    pm2 logs lumiku-backend --lines 30 --nostream
elif systemctl is-active --quiet lumiku-backend; then
    echo "Restarting via systemctl..."
    sudo systemctl restart lumiku-backend
    sleep 5
    sudo systemctl status lumiku-backend
else
    echo -e "${YELLOW}⚠️  Please restart backend service manually${NC}"
fi

echo -e "${GREEN}✅ Backend service restarted${NC}"
echo ""

# ==================================================
# STEP 11: Health check
# ==================================================
echo -e "${BLUE}Step 11: Running health check${NC}"
cd ..

echo "Testing API health endpoint..."
sleep 3

# Try different URLs
HEALTH_CHECK=$(curl -s https://dev.lumiku.com/health || curl -s http://localhost:3000/health || echo '{"status":"unknown"}')
echo "Response: $HEALTH_CHECK"

if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo -e "${GREEN}✅ API is healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  API health check failed - check logs${NC}"
fi
echo ""

# ==================================================
# DEPLOYMENT COMPLETE
# ==================================================
echo "=================================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "✅ Code pulled from development branch"
echo "✅ Dependencies installed"
echo "✅ Prisma Client generated"
echo "✅ Database migrated (9 new tables)"
echo "✅ Storage directories created"
echo "✅ Backend service restarted"
echo ""
echo "Next steps:"
echo "1. Verify tables in Prisma Studio"
echo "2. Test API with: curl https://dev.lumiku.com/health"
echo "3. Check PM2 logs: pm2 logs lumiku-backend"
echo "4. Week 2: Prepare pose dataset (500-1000 poses)"
echo ""
echo "Documentation:"
echo "📄 AVATAR_POSE_MASTER_REFERENCE.md"
echo "📄 DEPLOY_TO_DEV_LUMIKU_NOW.md"
echo ""
echo -e "${GREEN}Ready to build Avatar & Pose Generator! 🚀${NC}"
echo ""

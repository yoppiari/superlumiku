#!/bin/bash

# ============================================
# Lumiku App - Production Deployment Script for Coolify
# ============================================
# This script handles the complete deployment process
# including pre-checks, build, database migrations,
# and deployment to Coolify
#
# Usage: ./deploy-production.sh [--skip-checks] [--no-confirm]
# ============================================

set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
SKIP_CHECKS=false
NO_CONFIRM=false
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Coolify Configuration
COOLIFY_API_URL="https://cf.avolut.com/api/v1"
DEFAULT_APP_UUID="d8ggwoo484k8ok48g8k8cgwk"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --no-confirm)
            NO_CONFIRM=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-checks] [--no-confirm]"
            exit 1
            ;;
    esac
done

# Helper functions
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log_no_color() {
    echo "$1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}$1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}$1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}$1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
}

# ============================================
# Start Deployment
# ============================================
echo "============================================"
info "Lumiku App - Production Deployment"
echo "============================================"
echo "Environment: $ENVIRONMENT"
echo "Started: $(date)"
echo "Log file: $LOG_FILE"
echo "============================================"
echo ""

# Initialize log
echo "Lumiku App - Production Deployment" > "$LOG_FILE"
echo "Environment: $ENVIRONMENT" >> "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# ============================================
# Step 1: Pre-deployment Checks
# ============================================
if [ "$SKIP_CHECKS" = false ]; then
    info "[Step 1/8] Running Pre-deployment Validation..."
    log_no_color "[Step 1/8] Pre-deployment Validation"
    echo ""

    if ! ./deploy-pre-check.sh "$ENVIRONMENT"; then
        echo ""
        error "Pre-deployment checks failed!"
        error "Fix the errors above before continuing."
        echo ""
        echo "Use --skip-checks flag to bypass (NOT recommended)"
        exit 1
    fi

    echo ""
    success "Pre-deployment checks passed!"
    log_no_color "Pre-deployment checks passed"
    echo ""
else
    warning "[Step 1/8] Skipping pre-deployment checks (--skip-checks flag)"
    log_no_color "[Step 1/8] Skipped pre-deployment checks"
    echo ""
fi

# ============================================
# Step 2: User Confirmation
# ============================================
if [ "$NO_CONFIRM" = false ]; then
    info "[Step 2/8] Deployment Confirmation"
    echo ""
    echo "You are about to deploy to PRODUCTION."
    echo ""
    echo "Current branch:"
    echo "  Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo "  Commit: $(git log -1 --oneline 2>/dev/null || echo 'unknown')"
    echo ""
    echo "Target:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Coolify: $COOLIFY_API_URL"
    echo ""

    read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo ""
        warning "Deployment cancelled by user"
        log_no_color "Deployment cancelled"
        exit 0
    fi
    echo ""
    log_no_color "Deployment confirmed"
else
    info "[Step 2/8] Skipping confirmation (--no-confirm flag)"
    log_no_color "[Step 2/8] Confirmation skipped"
    echo ""
fi

# ============================================
# Step 3: Get Coolify Configuration
# ============================================
info "[Step 3/8] Configuring Coolify Connection..."
log_no_color "[Step 3/8] Coolify Configuration"

# Check for environment variables
if [ -n "$COOLIFY_TOKEN" ]; then
    success "  + COOLIFY_TOKEN found in environment"
    log_no_color "  + COOLIFY_TOKEN found"
else
    warning "  ! COOLIFY_TOKEN not found, prompting user"
    read -p "Enter your Coolify API Token: " COOLIFY_TOKEN
fi

if [ -n "$APP_UUID" ]; then
    success "  + APP_UUID found in environment: $APP_UUID"
    log_no_color "  + APP_UUID: $APP_UUID"
else
    warning "  ! APP_UUID not found, using default"
    read -p "Enter Application UUID [default: $DEFAULT_APP_UUID]: " APP_UUID
    APP_UUID=${APP_UUID:-$DEFAULT_APP_UUID}
fi

echo ""
echo "Configuration:"
echo "  Coolify API: $COOLIFY_API_URL"
echo "  App UUID: $APP_UUID"
echo ""

# ============================================
# Step 4: Build Application
# ============================================
info "[Step 4/8] Building Application..."
log_no_color "[Step 4/8] Building Application"

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf frontend/dist 2>/dev/null || true
rm -rf backend/dist 2>/dev/null || true

# Build backend
echo ""
echo "Building backend..."
cd backend
if bun run build >> "../$LOG_FILE" 2>&1; then
    success "  + Backend built successfully"
    log_no_color "  + Backend built successfully"
else
    cd ..
    error "  X Backend build failed"
    log_no_color "  X Backend build failed"
    echo "See $LOG_FILE for details"
    exit 1
fi
cd ..

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
cd backend
if bun prisma generate >> "../$LOG_FILE" 2>&1; then
    success "  + Prisma client generated"
    log_no_color "  + Prisma client generated"
else
    warning "  ! Prisma generate failed (might be OK if already generated)"
    log_no_color "  ! Prisma generate warning"
fi
cd ..

# Build frontend
echo ""
echo "Building frontend..."
cd frontend
if bun run build >> "../$LOG_FILE" 2>&1; then
    success "  + Frontend built successfully"
    log_no_color "  + Frontend built successfully"
else
    cd ..
    error "  X Frontend build failed"
    log_no_color "  X Frontend build failed"
    echo "See $LOG_FILE for details"
    exit 1
fi
cd ..

echo ""
success "Build completed successfully!"
echo ""

# ============================================
# Step 5: Update Environment Variables in Coolify
# ============================================
info "[Step 5/8] Checking Coolify Environment Variables..."
log_no_color "[Step 5/8] Coolify Environment Variables"

echo ""
warning "NOTE: Environment variables should be manually verified in Coolify dashboard"
echo "      Critical variables: DATABASE_URL, JWT_SECRET, REDIS_HOST, etc."
echo ""
info "Opening Coolify documentation for reference..."
echo ""

# Optional: Sync specific env vars if needed
read -p "Do you want to sync environment variables now? (y/n): " SYNC_ENV
if [ "$SYNC_ENV" = "y" ] || [ "$SYNC_ENV" = "Y" ]; then
    echo ""
    warning "Please manually verify these in Coolify dashboard:"
    echo "  - DATABASE_URL"
    echo "  - JWT_SECRET"
    echo "  - REDIS_HOST / REDIS_PORT / REDIS_PASSWORD"
    echo "  - NODE_ENV=production"
    echo "  - CORS_ORIGIN"
    echo "  - API keys (DUITKU, ANTHROPIC, HUGGINGFACE)"
    echo ""
    read -p "Press Enter to continue after verification..."
fi

echo ""

# ============================================
# Step 6: Commit Changes (if any)
# ============================================
info "[Step 6/8] Checking for uncommitted changes..."
log_no_color "[Step 6/8] Git status check"

if ! git diff --quiet; then
    warning "  ! Uncommitted changes detected"
    echo ""
    git status --short
    echo ""
    read -p "Commit these changes? (y/n): " COMMIT_CHANGES
    if [ "$COMMIT_CHANGES" = "y" ] || [ "$COMMIT_CHANGES" = "Y" ]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add . >> "$LOG_FILE" 2>&1
        if git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1; then
            success "  + Changes committed"
            log_no_color "  + Changes committed"

            read -p "Push to remote? (y/n): " PUSH_CHANGES
            if [ "$PUSH_CHANGES" = "y" ] || [ "$PUSH_CHANGES" = "Y" ]; then
                if git push >> "$LOG_FILE" 2>&1; then
                    success "  + Changes pushed to remote"
                    log_no_color "  + Pushed to remote"
                else
                    error "  X Failed to push changes"
                    log_no_color "  X Push failed"
                fi
            fi
        fi
    fi
else
    success "  + No uncommitted changes"
    log_no_color "  + No uncommitted changes"
fi

echo ""

# ============================================
# Step 7: Trigger Coolify Deployment
# ============================================
info "[Step 7/8] Triggering Coolify Deployment..."
log_no_color "[Step 7/8] Coolify Deployment"
echo ""

echo "Deploying to Coolify..."
log_no_color "Deployment started at: $(date)"

DEPLOY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "$COOLIFY_API_URL/deploy?uuid=$APP_UUID&force=true" \
    -H "Authorization: Bearer $COOLIFY_TOKEN")

HTTP_CODE=$(echo "$DEPLOY_RESPONSE" | tail -n1)
BODY=$(echo "$DEPLOY_RESPONSE" | sed '$d')

echo "" >> "$LOG_FILE"
echo "Deploy Response: $BODY" >> "$LOG_FILE"
echo "HTTP Status: $HTTP_CODE" >> "$LOG_FILE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    success "  + Deployment triggered successfully"
    log_no_color "  + Deployment triggered"
    echo ""
    info "Coolify is now building and deploying your application..."
    echo ""
    echo "Monitor the deployment at:"
    info "https://cf.avolut.com"
    echo ""
else
    error "  X Failed to trigger deployment"
    log_no_color "  X Deployment trigger failed"
    echo "HTTP Status: $HTTP_CODE"
    echo "Response: $BODY"
    echo ""
    echo "Check your COOLIFY_TOKEN and APP_UUID"
    exit 1
fi

# Wait for deployment to start
echo "Waiting for deployment to initialize..."
sleep 5

echo ""

# ============================================
# Step 8: Post-deployment Instructions
# ============================================
info "[Step 8/8] Post-deployment Instructions"
log_no_color "[Step 8/8] Post-deployment Instructions"
echo ""

success "Deployment triggered successfully!"
echo ""
warning "IMPORTANT: Complete these steps after deployment finishes:"
echo ""
echo "1. Monitor deployment in Coolify dashboard:"
info "   https://cf.avolut.com"
echo ""
echo "2. Wait for deployment to complete (typically 3-5 minutes)"
echo ""
echo "3. Run database migrations (if needed):"
info "   SSH into Coolify container and run:"
info "   cd /app && bun prisma migrate deploy"
echo ""
echo "4. Run post-deployment validation:"
info "   ./deploy-post-validate.sh"
echo ""
echo "5. Verify critical functionality:"
echo "   - Authentication (login/register)"
echo "   - Rate limiting"
echo "   - Redis connection"
echo "   - Database operations"
echo ""
echo "6. Monitor logs for any errors:"
echo "   Check Coolify logs for the first 10-15 minutes"
echo ""

# Save deployment info
echo "" >> "$LOG_FILE"
echo "Deployment completed at: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "Next steps:" >> "$LOG_FILE"
echo "- Monitor Coolify dashboard" >> "$LOG_FILE"
echo "- Run migrations if needed" >> "$LOG_FILE"
echo "- Run post-validation: ./deploy-post-validate.sh" >> "$LOG_FILE"

echo "============================================"
success "Deployment Process Complete"
echo "============================================"
echo ""
echo "Full deployment log: $LOG_FILE"
echo ""

# Create a quick reference file
cat > DEPLOYMENT_INFO.txt <<EOF
Deployment Reference
=====================
Date: $(date)
Environment: $ENVIRONMENT
App UUID: $APP_UUID

Deployed Commit: $(git log -1 --oneline 2>/dev/null || echo 'unknown')

Coolify Dashboard: https://cf.avolut.com
App URL: https://app.lumiku.com
Dev URL: https://dev.lumiku.com

Log File: $LOG_FILE
EOF

echo "Deployment info saved to: DEPLOYMENT_INFO.txt"
echo ""

exit 0

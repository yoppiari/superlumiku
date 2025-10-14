#!/bin/bash

# ============================================
# Lumiku App - Pre-Deployment Validation Script
# ============================================
# This script validates the environment and codebase
# before deploying to production on Coolify
#
# Usage: ./deploy-pre-check.sh [environment]
# Example: ./deploy-pre-check.sh production
# ============================================

set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
ERROR_COUNT=0
WARNING_COUNT=0
LOG_FILE="deployment-pre-check-$(date +%Y%m%d-%H%M%S).log"

# Helper functions
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log_no_color() {
    echo "$1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}$1${NC}" | tee -a "$LOG_FILE"
    ((ERROR_COUNT++))
}

warning() {
    echo -e "${YELLOW}$1${NC}" | tee -a "$LOG_FILE"
    ((WARNING_COUNT++))
}

success() {
    echo -e "${GREEN}$1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

check_env_var() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        error "  X $var_name not set"
        return 1
    else
        success "  + $var_name is set"
        return 0
    fi
}

warn_env_var() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        warning "  ! $var_name not set"
        return 1
    else
        success "  + $var_name is set"
        return 0
    fi
}

check_file() {
    if [ -f "$1" ]; then
        success "  + $1 exists"
        return 0
    else
        error "  X $1 not found"
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        success "  + $1 exists"
        return 0
    else
        error "  X $1 not found"
        return 1
    fi
}

# ============================================
# Start Validation
# ============================================

echo "============================================"
info "Lumiku App - Pre-Deployment Validation"
echo "============================================"
echo "Environment: $ENVIRONMENT"
echo "Started: $(date)"
echo "Log file: $LOG_FILE"
echo "============================================"
echo ""

# Initialize log file
echo "Lumiku App - Pre-Deployment Validation" > "$LOG_FILE"
echo "Environment: $ENVIRONMENT" >> "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# ============================================
# 1. Environment Variables Validation
# ============================================
info "[1/9] Checking Environment Variables..."
log_no_color "[1/9] Checking Environment Variables..."

# Load environment file if exists
if [ -f ".env.$ENVIRONMENT" ]; then
    success "  + .env.$ENVIRONMENT exists"
    # Source the env file
    set -a
    source ".env.$ENVIRONMENT" 2>/dev/null || true
    set +a
else
    error "  X .env.$ENVIRONMENT not found"
fi

if [ -f "backend/.env" ]; then
    success "  + backend/.env exists"
    # Source backend env
    set -a
    source "backend/.env" 2>/dev/null || true
    set +a
else
    warning "  ! backend/.env not found (using .env.$ENVIRONMENT)"
fi

# Check critical environment variables
check_env_var "DATABASE_URL"
check_env_var "JWT_SECRET"
check_env_var "REDIS_HOST"
check_env_var "REDIS_PORT"
check_env_var "NODE_ENV"
check_env_var "PORT"
check_env_var "CORS_ORIGIN"

# Warn about sensitive variables
warn_env_var "DUITKU_API_KEY"
warn_env_var "ANTHROPIC_API_KEY"
warn_env_var "HUGGINGFACE_API_KEY"

echo ""

# ============================================
# 2. Git Status Check
# ============================================
info "[2/9] Checking Git Status..."
log_no_color "[2/9] Checking Git Status..."

if git rev-parse --git-dir > /dev/null 2>&1; then
    success "  + Git repository detected"

    # Check for uncommitted changes
    if ! git diff --quiet; then
        warning "  ! Uncommitted changes detected"
        git status --short >> "$LOG_FILE"
    else
        success "  + No uncommitted changes"
    fi

    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    info "  * Current branch: $CURRENT_BRANCH"

    # Get latest commit
    LATEST_COMMIT=$(git log -1 --oneline)
    info "  * Latest commit: $LATEST_COMMIT"
else
    error "  X Not a git repository"
fi

echo ""

# ============================================
# 3. Node/Bun and Dependencies Check
# ============================================
info "[3/9] Checking Runtime and Dependencies..."
log_no_color "[3/9] Checking Runtime and Dependencies..."

# Check for Bun (preferred) or Node
if check_command bun; then
    BUN_VERSION=$(bun --version)
    success "  + Bun version: $BUN_VERSION"
    RUNTIME="bun"
elif check_command node; then
    NODE_VERSION=$(node --version)
    warning "  ! Node.js version: $NODE_VERSION (Bun recommended)"
    RUNTIME="node"
else
    error "  X Neither Bun nor Node.js found"
    RUNTIME="none"
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    warning "  ! node_modules not found - dependencies need to be installed"
else
    success "  + node_modules exists"
fi

if [ ! -d "backend/node_modules" ]; then
    warning "  ! backend/node_modules not found"
else
    success "  + backend/node_modules exists"
fi

if [ ! -d "frontend/node_modules" ]; then
    warning "  ! frontend/node_modules not found"
else
    success "  + frontend/node_modules exists"
fi

echo ""

# ============================================
# 4. TypeScript Compilation Check
# ============================================
info "[4/9] Running TypeScript Compilation Check..."
log_no_color "[4/9] TypeScript Compilation Check..."

# Backend compilation
cd backend
if [ "$RUNTIME" = "bun" ]; then
    if bun run build >> "../$LOG_FILE" 2>&1; then
        success "  + Backend compiled successfully"
    else
        error "  X Backend TypeScript compilation failed"
    fi
elif [ "$RUNTIME" = "node" ]; then
    if npm run build >> "../$LOG_FILE" 2>&1; then
        success "  + Backend compiled successfully"
    else
        error "  X Backend TypeScript compilation failed"
    fi
fi
cd ..

# Frontend compilation
cd frontend
if [ "$RUNTIME" = "bun" ]; then
    if bun run build >> "../$LOG_FILE" 2>&1; then
        success "  + Frontend compiled successfully"
    else
        error "  X Frontend TypeScript compilation failed"
    fi
elif [ "$RUNTIME" = "node" ]; then
    if npm run build >> "../$LOG_FILE" 2>&1; then
        success "  + Frontend compiled successfully"
    else
        error "  X Frontend TypeScript compilation failed"
    fi
fi
cd ..

echo ""

# ============================================
# 5. Database Connection Check
# ============================================
info "[5/9] Checking Database Configuration..."
log_no_color "[5/9] Checking Database Configuration..."

if [ -f "backend/prisma/schema.prisma" ]; then
    success "  + Prisma schema found"

    # Check if Prisma client is generated
    if [ -d "backend/node_modules/.prisma/client" ]; then
        success "  + Prisma client generated"
    else
        warning "  ! Prisma client not generated"
    fi
else
    error "  X Prisma schema not found"
fi

echo ""

# ============================================
# 6. Redis Configuration Check
# ============================================
info "[6/9] Checking Redis Configuration..."
log_no_color "[6/9] Checking Redis Configuration..."

if [ -z "$REDIS_HOST" ]; then
    if [ "$ENVIRONMENT" = "production" ]; then
        error "  X REDIS_HOST not configured (REQUIRED for production)"
    else
        warning "  ! REDIS_HOST not configured"
    fi
else
    success "  + REDIS_HOST configured: $REDIS_HOST"

    # Try to ping Redis if redis-cli is available
    if check_command redis-cli; then
        if [ -n "$REDIS_PASSWORD" ]; then
            if redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
                success "  + Redis connection successful"
            else
                warning "  ! Could not connect to Redis (might be normal if not local)"
            fi
        else
            if redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ping > /dev/null 2>&1; then
                success "  + Redis connection successful"
            else
                warning "  ! Could not connect to Redis (might be normal if not local)"
            fi
        fi
    fi
fi

echo ""

# ============================================
# 7. Security Configuration Check
# ============================================
info "[7/9] Checking Security Configuration..."
log_no_color "[7/9] Checking Security Configuration..."

# Check JWT_SECRET strength
if [ -n "$JWT_SECRET" ]; then
    JWT_LENGTH=${#JWT_SECRET}
    if [ $JWT_LENGTH -ge 32 ]; then
        success "  + JWT_SECRET meets minimum length (32+ chars)"
    else
        error "  X JWT_SECRET too short (minimum 32 characters, found $JWT_LENGTH)"
    fi
else
    error "  X JWT_SECRET not set"
fi

# Check if rate limiting is enabled
if [ "$RATE_LIMIT_ENABLED" = "false" ]; then
    warning "  ! Rate limiting is disabled"
else
    success "  + Rate limiting enabled"
fi

# Check for default/weak credentials
if [ -f ".env.$ENVIRONMENT" ]; then
    if grep -q "CHANGE_THIS" ".env.$ENVIRONMENT"; then
        error "  X Default credentials detected in .env.$ENVIRONMENT"
    else
        success "  + No default credentials detected"
    fi
fi

# Check for proper NODE_ENV
if [ "$ENVIRONMENT" = "production" ]; then
    if [ "$NODE_ENV" != "production" ]; then
        error "  X NODE_ENV should be 'production' but is '$NODE_ENV'"
    else
        success "  + NODE_ENV correctly set to production"
    fi
fi

echo ""

# ============================================
# 8. File Structure Validation
# ============================================
info "[8/9] Validating File Structure..."
log_no_color "[8/9] Validating File Structure..."

check_file "backend/src/index.ts"
check_file "backend/src/app.ts"
check_file "backend/prisma/schema.prisma"
check_file "frontend/src/main.tsx"
check_file "package.json"
check_file "backend/package.json"
check_file "frontend/package.json"

# Check for critical directories
check_directory "backend/src/routes"
check_directory "backend/src/middleware"
check_directory "backend/src/workers"
check_directory "frontend/src/pages"

echo ""

# ============================================
# 9. Deployment-specific Checks
# ============================================
info "[9/9] Running Deployment-specific Checks..."
log_no_color "[9/9] Deployment-specific Checks..."

if [ "$ENVIRONMENT" = "production" ]; then
    if [ -z "$COOLIFY_TOKEN" ]; then
        warning "  ! COOLIFY_TOKEN not set (needed for automated deployment)"
    else
        success "  + COOLIFY_TOKEN configured"
    fi

    if [ -z "$APP_UUID" ]; then
        warning "  ! APP_UUID not set (using default: d8ggwoo484k8ok48g8k8cgwk)"
        APP_UUID="d8ggwoo484k8ok48g8k8cgwk"
    else
        success "  + APP_UUID configured: $APP_UUID"
    fi
fi

# Check build artifacts
if [ -d "frontend/dist" ]; then
    success "  + Frontend build artifacts exist"
else
    warning "  ! Frontend dist not found (will be built during deployment)"
fi

# Check for package-lock.json or bun.lockb
if [ -f "bun.lockb" ] || [ -f "package-lock.json" ] || [ -f "yarn.lock" ]; then
    success "  + Lock file found"
else
    warning "  ! No lock file found (bun.lockb, package-lock.json, or yarn.lock)"
fi

echo ""

# ============================================
# Final Report
# ============================================
echo "============================================"
info "Pre-Deployment Validation Complete"
echo "============================================"
echo ""

if [ $ERROR_COUNT -eq 0 ]; then
    if [ $WARNING_COUNT -eq 0 ]; then
        success "Result: PASS - Ready for deployment"
        echo ""
        success "All checks passed successfully!"
        echo "No errors or warnings detected."
        EXIT_CODE=0
    else
        echo -e "${YELLOW}Result: PASS with warnings${NC}"
        log_no_color "Result: PASS with warnings"
        echo ""
        warning "Warnings: $WARNING_COUNT"
        echo "Deployment can proceed, but review warnings above."
        EXIT_CODE=0
    fi
else
    echo -e "${RED}Result: FAIL - Cannot deploy${NC}"
    log_no_color "Result: FAIL - Cannot deploy"
    echo ""
    error "Errors: $ERROR_COUNT"
    warning "Warnings: $WARNING_COUNT"
    echo ""
    echo "Please fix the errors above before deploying."
    EXIT_CODE=1
fi

echo ""
echo "Full log saved to: $LOG_FILE"
echo "============================================"
echo ""

exit $EXIT_CODE

#!/bin/bash

# Coolify Deployment Script
# Deploys Lumiku application via Coolify API

set -e

# Configuration
COOLIFY_DOMAIN="${COOLIFY_DOMAIN:-cf.avolut.com}"
COOLIFY_API_KEY="${COOLIFY_API_KEY:-5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97}"
APP_UUID="${APP_UUID:-jws8c80ckos00og0cos4cw8s}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/yoppiari/superlumiku/}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Coolify Deployment Script${NC}"
echo "========================================"
echo "Domain: $COOLIFY_DOMAIN"
echo "App UUID: $APP_UUID"
echo "GitHub: $GITHUB_REPO"
echo ""

# Validate required variables
if [ -z "$COOLIFY_API_KEY" ]; then
    echo -e "${RED}❌ ERROR: COOLIFY_API_KEY not set${NC}"
    exit 1
fi

if [ -z "$APP_UUID" ]; then
    echo -e "${RED}❌ ERROR: APP_UUID not set${NC}"
    exit 1
fi

# Function to call Coolify API
call_coolify_api() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="$3"

    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $COOLIFY_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "https://$COOLIFY_DOMAIN/api/v1/$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $COOLIFY_API_KEY" \
            "https://$COOLIFY_DOMAIN/api/v1/$endpoint"
    fi
}

# Step 1: Trigger Deployment
echo -e "${YELLOW}Step 1: Triggering deployment...${NC}"

deploy_response=$(call_coolify_api "deploy" "GET" "" | grep -o '"uuid":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$deploy_response" ]; then
    # Try alternative endpoint with UUID
    deploy_response=$(curl -s -X GET \
        -H "Authorization: Bearer $COOLIFY_API_KEY" \
        "https://$COOLIFY_DOMAIN/api/v1/deploy?uuid=$APP_UUID")

    echo "$deploy_response"

    deployment_uuid=$(echo "$deploy_response" | grep -o '"deployment_uuid":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    deployment_uuid="$deploy_response"
fi

if [ -n "$deployment_uuid" ]; then
    echo -e "${GREEN}✓ Deployment triggered${NC}"
    echo "  Deployment UUID: $deployment_uuid"
else
    echo -e "${YELLOW}⚠ Deployment triggered (UUID not returned)${NC}"
    echo "  Check Coolify dashboard for status"
fi

echo ""
echo -e "${BLUE}Deployment initiated!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Monitor deployment in Coolify dashboard:"
echo "   https://$COOLIFY_DOMAIN"
echo ""
echo "2. Once deployed, run smoke tests:"
echo "   bash scripts/smoke-test.sh https://$COOLIFY_DOMAIN"
echo ""
echo "3. Run comprehensive tests:"
echo "   bash scripts/test-deployment.sh https://$COOLIFY_DOMAIN"
echo ""

# Optional: Wait and monitor (if deployment UUID available)
if [ -n "$deployment_uuid" ]; then
    echo -e "${YELLOW}Monitoring deployment...${NC}"
    echo "(Press Ctrl+C to stop monitoring and exit)"
    echo ""

    max_wait=600  # 10 minutes
    elapsed=0

    while [ $elapsed -lt $max_wait ]; do
        sleep 10
        elapsed=$((elapsed + 10))

        # Try to check deployment status
        echo -n "."

        # Note: Actual status endpoint may vary based on Coolify version
        # Uncomment and adjust if status endpoint is available:
        # status=$(call_coolify_api "deployments/$deployment_uuid")
        # if echo "$status" | grep -q "completed"; then
        #     echo ""
        #     echo -e "${GREEN}✓ Deployment completed!${NC}"
        #     break
        # elif echo "$status" | grep -q "failed"; then
        #     echo ""
        #     echo -e "${RED}✗ Deployment failed${NC}"
        #     exit 1
        # fi
    done

    echo ""
    echo -e "${BLUE}Check deployment status in Coolify dashboard${NC}"
fi

exit 0

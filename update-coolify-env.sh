#!/bin/bash

# ============================================
# Coolify Environment Variable Update Script
# ============================================
# This script updates the HuggingFace API key in Coolify
# Date: 2025-10-13
# Reason: API key rotation after security exposure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "Coolify Environment Variable Update"
echo "============================================"
echo ""

# Step 1: Get user inputs
echo -e "${YELLOW}Step 1: Configuration${NC}"
echo "Please provide the following information:"
echo ""

read -p "Enter your Coolify API Token: " COOLIFY_TOKEN
read -p "Enter your new HuggingFace API Key (hf_...): " NEW_HF_KEY
read -p "Enter your Application UUID [default: d8ggwoo484k8ok48g8k8cgwk]: " APP_UUID
APP_UUID=${APP_UUID:-d8ggwoo484k8ok48g8k8cgwk}

echo ""
echo -e "${GREEN}Configuration set:${NC}"
echo "  - Coolify Token: ${COOLIFY_TOKEN:0:10}..."
echo "  - HuggingFace Key: ${NEW_HF_KEY:0:10}..."
echo "  - App UUID: $APP_UUID"
echo ""

read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo -e "${RED}Aborted by user${NC}"
    exit 1
fi

# Step 2: Update environment variable
echo ""
echo -e "${YELLOW}Step 2: Updating environment variable...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "https://cf.avolut.com/api/v1/applications/${APP_UUID}/envs" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"HUGGINGFACE_API_KEY\": \"${NEW_HF_KEY}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Environment variable updated successfully${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Failed to update environment variable${NC}"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    exit 1
fi

# Step 3: Trigger redeployment
echo ""
echo -e "${YELLOW}Step 3: Triggering redeployment...${NC}"

DEPLOY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://cf.avolut.com/api/v1/deploy?uuid=${APP_UUID}&force=true" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}")

HTTP_CODE=$(echo "$DEPLOY_RESPONSE" | tail -n1)
BODY=$(echo "$DEPLOY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Redeployment triggered successfully${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Failed to trigger redeployment${NC}"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    echo ""
    echo -e "${YELLOW}Note: Environment variable was updated, but deployment failed.${NC}"
    echo "You may need to manually trigger deployment from Coolify dashboard."
    exit 1
fi

# Step 4: Test the new API key
echo ""
echo -e "${YELLOW}Step 4: Testing new API key...${NC}"

TEST_RESPONSE=$(curl -s -w "\n%{http_code}" \
  https://api-inference.huggingface.co/models/bert-base-uncased \
  -H "Authorization: Bearer ${NEW_HF_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":"test"}')

HTTP_CODE=$(echo "$TEST_RESPONSE" | tail -n1)
BODY=$(echo "$TEST_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ New API key is working${NC}"
elif [ "$HTTP_CODE" -eq 503 ]; then
    echo -e "${GREEN}✓ API key accepted (model loading)${NC}"
else
    echo -e "${RED}✗ API key test failed${NC}"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    echo ""
    echo -e "${YELLOW}Note: This may be a temporary issue. Check HuggingFace token permissions.${NC}"
fi

# Summary
echo ""
echo "============================================"
echo -e "${GREEN}Update Complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Monitor deployment logs in Coolify dashboard"
echo "2. Wait for deployment to complete (2-5 minutes)"
echo "3. Test Avatar Generator in Lumiku UI"
echo "4. Verify no authentication errors in logs"
echo ""
echo "Coolify Dashboard: https://cf.avolut.com"
echo "Lumiku App: https://dev.lumiku.com"
echo ""
echo -e "${GREEN}✓ All done!${NC}"

#!/bin/bash

###############################################################################
# Avatar Creator AI Models - Quick Seed Script
#
# This script seeds the AI models for Avatar Creator
# Run this after setting up the database
###############################################################################

set -e  # Exit on error

echo "=============================================="
echo "Avatar Creator - AI Models Setup"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Run this script from project root"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Warning: DATABASE_URL not set"
    echo "   Loading from .env file..."
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo "❌ Error: .env file not found"
        exit 1
    fi
fi

if [ -z "$HUGGINGFACE_API_KEY" ]; then
    echo "⚠️  Warning: HUGGINGFACE_API_KEY not set"
    echo "   This is required for Avatar Creator to work"
    echo "   Get your key from: https://huggingface.co/settings/tokens"
fi

echo "✅ Environment check passed"
echo ""

# Navigate to backend
cd backend

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🌱 Seeding AI models..."
echo "   This will create/update AI models in the database"
echo ""

# Run seed
npm run seed

echo ""
echo "=============================================="
echo "✅ AI Models Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Verify models in database:"
echo "   psql \$DATABASE_URL -c \"SELECT name, tier, enabled FROM ai_models WHERE app_id = 'avatar-creator';\""
echo ""
echo "2. Restart backend services:"
echo "   pm2 restart backend"
echo "   pm2 restart worker"
echo ""
echo "3. Test avatar generation:"
echo "   Check AVATAR_CREATOR_AI_MODELS_SETUP.md for test commands"
echo ""
echo "4. Monitor logs:"
echo "   pm2 logs worker"
echo ""

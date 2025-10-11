#!/bin/bash

# Script untuk generate secrets untuk development environment
# Jalankan: bash scripts/generate-dev-secrets.sh

echo "🔐 Generating secrets untuk Development Environment"
echo "=================================================="
echo ""

# Generate JWT Secret (32 characters)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generate Database Password
DB_PASSWORD=$(openssl rand -base64 24)
echo "POSTGRES_PASSWORD=$DB_PASSWORD"
echo ""

# Generate DATABASE_URL
echo "DATABASE_URL=postgresql://lumiku_dev:$DB_PASSWORD@postgres:5432/lumiku_development?schema=public"
echo ""

echo "=================================================="
echo "✅ Secrets berhasil di-generate!"
echo ""
echo "📋 Copy secrets di atas ke Coolify Environment Variables"
echo "   untuk aplikasi dev.lumiku.com"

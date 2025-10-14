#!/usr/bin/env node

const https = require('https');
const http = require('http');

const COOLIFY_TOKEN = '5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97';
const APP_UUID = 'd8ggwoo484k8ok48g8k8cgwk';
const COOLIFY_HOST = 'cf.avolut.com';

console.log('🚀 Starting migration process for dev.lumiku.com...\n');

// Step 1: Get application details to find container name
function getApplicationDetails() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: COOLIFY_HOST,
      port: 443,
      path: `/api/v1/applications/${APP_UUID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${COOLIFY_TOKEN}`,
        'Accept': 'application/json'
      }
    };

    console.log('📋 Step 1: Getting application details...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Application details retrieved');
          console.log(`   Name: ${json.name || 'N/A'}`);
          console.log(`   UUID: ${json.uuid || 'N/A'}`);
          resolve(json);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Step 2: Try to execute migration via deployment with post-deploy command
// Since Coolify API doesn't have direct exec endpoint, we'll create a one-time deployment
function runMigrationViaDeployment() {
  return new Promise((resolve, reject) => {
    // We'll use the deployment API to trigger a new deployment
    // The app should have a post-deployment script in its Dockerfile or entrypoint

    console.log('\n📋 Step 2: Triggering deployment with migration...');
    console.log('   Note: Migration will run as part of the deployment process');

    const options = {
      hostname: COOLIFY_HOST,
      port: 443,
      path: `/api/v1/deploy?uuid=${APP_UUID}&force=true`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COOLIFY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Deployment triggered');
          if (json.deployments && json.deployments.length > 0) {
            console.log(`   Deployment UUID: ${json.deployments[0].deployment_uuid}`);
          }
          resolve(json);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Alternative: Create migration script that will be included in next deployment
function createMigrationStartupScript() {
  console.log('\n📋 Alternative approach: Creating startup migration script...');
  console.log('   This will be included in the codebase for automatic migration on startup');

  return `#!/bin/sh
# This script should be added to backend/startup.sh

echo "🔄 Running Prisma migrations..."
cd /app/backend

# Run Prisma migration
bunx prisma db push --accept-data-loss || bunx prisma migrate deploy

echo "✅ Migrations complete"

# Start the application
exec bun run src/index.ts
`;
}

// Main execution
async function main() {
  try {
    // Get app details
    const appDetails = await getApplicationDetails();

    console.log('\n⚠️  IMPORTANT: Coolify API does not provide direct command execution');
    console.log('   We have 3 options:\n');

    console.log('   Option 1: Add startup.sh to run migrations automatically');
    console.log('   Option 2: Use Coolify UI Terminal (manual)');
    console.log('   Option 3: Add post-deployment command in Coolify UI\n');

    console.log('📝 Recommended: Option 1 - Add startup script to codebase');
    console.log('   This will run migrations automatically on every deployment\n');

    const startupScript = createMigrationStartupScript();
    console.log('--- backend/startup.sh ---');
    console.log(startupScript);
    console.log('--- end startup.sh ---\n');

    console.log('💡 Alternative: Run migration manually via Coolify UI:');
    console.log('   1. Go to: https://cf.avolut.com');
    console.log('   2. Open: dev-superlumiku application');
    console.log('   3. Click: Terminal tab');
    console.log('   4. Run: cd /app/backend && bunx prisma db push\n');

    // Ask if user wants to trigger deployment
    console.log('🤔 Should I trigger a deployment now?');
    console.log('   (Migration will only work if startup script is already in place)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

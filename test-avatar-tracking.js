/**
 * Test Script for Avatar Usage Tracking
 * Run with: node test-avatar-tracking.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Avatar Usage Tracking - Test Checklist\n');
console.log('=' .repeat(60));

const tests = [
  {
    category: '📋 Database Schema',
    tests: [
      {
        name: 'avatars table has lastUsedAt column',
        sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'lastUsedAt';`,
        expectedResult: 'Should return 1 row'
      },
      {
        name: 'avatar_usage_history table exists',
        sql: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'avatar_usage_history';`,
        expectedResult: 'Count should be 1'
      },
      {
        name: 'avatar_usage_history has all columns',
        sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'avatar_usage_history' ORDER BY ordinal_position;`,
        expectedResult: 'Should return: id, avatarId, userId, appId, appName, action, referenceId, referenceType, metadata, createdAt'
      },
      {
        name: 'Indexes are created',
        sql: `SELECT indexname FROM pg_indexes WHERE tablename = 'avatar_usage_history';`,
        expectedResult: 'Should show indexes on avatarId, userId, appId, createdAt'
      }
    ]
  },
  {
    category: '🔧 Backend Code',
    tests: [
      {
        name: 'Avatar Service has trackUsage method',
        file: 'backend/src/apps/avatar-creator/services/avatar.service.ts',
        check: 'async trackUsage(',
        expectedResult: 'Method should exist'
      },
      {
        name: 'Avatar Service has getAvatarUsageHistory method',
        file: 'backend/src/apps/avatar-creator/services/avatar.service.ts',
        check: 'async getAvatarUsageHistory(',
        expectedResult: 'Method should exist'
      },
      {
        name: 'Avatar Service has getAvatarUsageSummary method',
        file: 'backend/src/apps/avatar-creator/services/avatar.service.ts',
        check: 'async getAvatarUsageSummary(',
        expectedResult: 'Method should exist'
      },
      {
        name: 'Pose Generator tracks usage',
        file: 'backend/src/apps/pose-generator/services/pose-generation.service.ts',
        check: 'avatarService.trackUsage',
        expectedResult: 'Should call trackUsage'
      },
      {
        name: 'Route for usage history exists',
        file: 'backend/src/apps/avatar-creator/routes.ts',
        check: '/avatars/:id/usage-history',
        expectedResult: 'Route should exist'
      }
    ]
  },
  {
    category: '🎨 Frontend UI',
    tests: [
      {
        name: 'Avatar card shows all attributes',
        file: 'frontend/src/apps/AvatarCreator.tsx',
        check: 'avatar.gender',
        expectedResult: 'Should display gender'
      },
      {
        name: 'Avatar card shows created date',
        file: 'frontend/src/apps/AvatarCreator.tsx',
        check: 'avatar.createdAt',
        expectedResult: 'Should display created date with calendar icon'
      },
      {
        name: 'Avatar card shows last used',
        file: 'frontend/src/apps/AvatarCreator.tsx',
        check: 'avatar.lastUsedAt',
        expectedResult: 'Should display last used date with clock icon'
      },
      {
        name: 'History icon button exists',
        file: 'frontend/src/apps/AvatarCreator.tsx',
        check: '<History className',
        expectedResult: 'Should have history icon button'
      },
      {
        name: 'UsageHistoryModal component exists',
        file: 'frontend/src/components/UsageHistoryModal.tsx',
        check: 'UsageHistoryModal',
        expectedResult: 'Component should exist'
      }
    ]
  },
  {
    category: '📊 Types & Interfaces',
    tests: [
      {
        name: 'Backend Avatar type has lastUsedAt',
        file: 'backend/src/apps/avatar-creator/types.ts',
        check: 'lastUsedAt',
        expectedResult: 'Should have lastUsedAt field'
      },
      {
        name: 'Backend AvatarUsageHistory type exists',
        file: 'backend/src/apps/avatar-creator/types.ts',
        check: 'export interface AvatarUsageHistory',
        expectedResult: 'Type should exist'
      },
      {
        name: 'Frontend Avatar type has lastUsedAt',
        file: 'frontend/src/stores/avatarCreatorStore.ts',
        check: 'lastUsedAt',
        expectedResult: 'Should have lastUsedAt field'
      },
      {
        name: 'Frontend AvatarUsageHistory type exists',
        file: 'frontend/src/stores/avatarCreatorStore.ts',
        check: 'export interface AvatarUsageHistory',
        expectedResult: 'Type should exist'
      }
    ]
  }
];

// Run file-based tests
let passedTests = 0;
let totalTests = 0;

tests.forEach(category => {
  console.log(`\n${category.category}`);
  console.log('-'.repeat(60));

  category.tests.forEach(test => {
    totalTests++;
    const filePath = path.join(__dirname, test.file || '');

    if (test.sql) {
      // Database test - just show the SQL
      console.log(`  ⏺️  ${test.name}`);
      console.log(`      SQL: ${test.sql.substring(0, 50)}...`);
      console.log(`      Expected: ${test.expectedResult}`);
    } else if (test.file && fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const found = content.includes(test.check);

      if (found) {
        console.log(`  ✅ ${test.name}`);
        passedTests++;
      } else {
        console.log(`  ❌ ${test.name}`);
        console.log(`      Missing: ${test.check}`);
      }
    } else if (test.file) {
      console.log(`  ⚠️  ${test.name}`);
      console.log(`      File not found: ${test.file}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed/Pending: ${totalTests - passedTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

// Manual test instructions
console.log('\n' + '='.repeat(60));
console.log('🧪 Manual Testing Steps');
console.log('='.repeat(60));

console.log(`
1. Database Migration
   □ Run: psql -U lumiku_dev -d lumiku_development -f avatar-usage-tracking-migration.sql
   □ Verify tables exist

2. Backend Service
   □ Restart backend: cd backend && bun dev
   □ Check logs for errors
   □ Test API: curl https://dev.lumiku.com/api/apps/avatar-creator/projects

3. Frontend Testing
   □ Open: https://dev.lumiku.com/apps/avatar-creator
   □ Create/select a project
   □ Upload or generate an avatar
   □ Verify all attributes visible (gender, age, style, ethnicity)
   □ Verify timestamps shown (created date, last used)
   □ Click history icon
   □ Verify modal opens with "No usage history yet"

4. Integration Testing
   □ Go to Pose Generator
   □ Select the avatar
   □ Generate poses
   □ Wait for completion
   □ Go back to Avatar Creator
   □ Click history icon on the avatar
   □ Verify history shows:
     - Summary card for "Pose Generator"
     - Detailed history entry
     - Correct timestamps

5. Data Verification
   □ Check database: SELECT * FROM avatar_usage_history LIMIT 5;
   □ Verify avatar.lastUsedAt updated
   □ Verify avatar.usageCount incremented
`);

console.log('='.repeat(60));
console.log('✨ Test script completed!');
console.log('Please run manual tests as outlined above.');
console.log('='.repeat(60));

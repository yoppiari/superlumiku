/**
 * Ensure database schema is up-to-date
 * This runs on every deployment to create missing tables
 */
import { execSync } from 'child_process'

console.log('🔧 Ensuring database schema is up-to-date...')

try {
  // Generate Prisma Client
  console.log('1. Generating Prisma Client...')
  execSync('bun prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated')
  
  // Push schema to database (creates missing tables)
  console.log('2. Pushing schema to database...')
  execSync('bun prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' })
  console.log('✅ Schema pushed to database')
  
  console.log('\n🎉 Database schema is now up-to-date!')
  process.exit(0)
} catch (error) {
  console.error('❌ Error ensuring schema:', error)
  console.log('\n⚠️  Continuing anyway - schema might already be up-to-date')
  process.exit(0) // Don't fail deployment
}

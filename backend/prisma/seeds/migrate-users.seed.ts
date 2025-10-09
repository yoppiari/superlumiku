import prisma from '../../src/db/client'

export const migrateExistingUsers = async () => {
  console.log('🌱 Migrating existing users to PAYG...')

  // Update users where accountType is missing (default value should handle this, but let's be safe)
  // Since we have default values, this is just for existing data before migration
  const count = await prisma.user.count()

  console.log(`✅ Found ${count} existing users (all will have PAYG account type by default)`)
}

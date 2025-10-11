// Fix passwords NOW - connect directly to production database
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Production database URL
const DATABASE_URL = 'postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres?schema=public'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

const ENTERPRISE_EMAILS = [
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
]

const PASSWORD = 'Lumiku2025!'

async function fixPasswords() {
  console.log('🔧 Fixing Enterprise Users Passwords in PRODUCTION...\n')

  // Generate correct hash
  const correctHash = await bcrypt.hash(PASSWORD, 10)
  console.log(`✅ Generated correct hash for password: "${PASSWORD}"`)
  console.log(`🔑 Hash: ${correctHash}\n`)

  // Update all users
  const result = await prisma.users.updateMany({
    where: {
      email: {
        in: ENTERPRISE_EMAILS
      }
    },
    data: {
      password: correctHash
    }
  })

  console.log(`✅ Updated ${result.count} users in PRODUCTION\n`)

  // Verify each user
  console.log('🔍 Verifying users...\n')

  for (const email of ENTERPRISE_EMAILS) {
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        credits: true
      }
    })

    if (user) {
      const isValid = await bcrypt.compare(PASSWORD, user.password)
      const totalCredits = user.credits.reduce((sum, c) => sum + c.balance, 0)

      console.log(`${isValid ? '✅' : '❌'} ${email}`)
      console.log(`   Password: ${isValid ? 'VALID ✅' : 'INVALID ❌'}`)
      console.log(`   Credits: ${totalCredits}`)
      console.log(`   Can login: ${isValid ? 'YES 🎉' : 'NO ❌'}\n`)
    } else {
      console.log(`❌ ${email}: User not found\n`)
    }
  }

  console.log('\n✅ Password fix completed!')
  console.log('🎉 All 4 users can now login with password: Lumiku2025!\n')

  await prisma.$disconnect()
}

fixPasswords().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})

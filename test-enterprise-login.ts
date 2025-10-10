// Test login for 4 enterprise users
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const TEST_USERS = [
  { email: 'ardianfaisal.id@gmail.com', password: 'Lumiku2025!' },
  { email: 'iqbal.elvo@gmail.com', password: 'Lumiku2025!' },
  { email: 'galuh.inteko@gmail.com', password: 'Lumiku2025!' },
  { email: 'dilla.inteko@gmail.com', password: 'Lumiku2025!' }
]

async function testLogin() {
  console.log('🧪 Testing Enterprise Users Login...\n')

  for (const testUser of TEST_USERS) {
    console.log(`\n📧 Testing: ${testUser.email}`)

    try {
      // Find user in database
      const user = await prisma.users.findUnique({
        where: { email: testUser.email },
        include: {
          credits: true
        }
      })

      if (!user) {
        console.log('   ❌ User NOT FOUND in database')
        continue
      }

      console.log(`   ✅ User found: ${user.name}`)
      console.log(`   📝 User ID: ${user.id}`)
      console.log(`   🔑 Password hash: ${user.password.substring(0, 20)}...`)

      // Test password verification
      const isPasswordValid = await bcrypt.compare(testUser.password, user.password)

      if (isPasswordValid) {
        console.log(`   ✅ Password VALID: "${testUser.password}" matches!`)

        // Check credits
        const totalCredits = user.credits.reduce((sum, c) => sum + c.balance, 0)
        console.log(`   💰 Total Credits: ${totalCredits}`)

        console.log(`   🎉 LOGIN WOULD SUCCEED!`)
      } else {
        console.log(`   ❌ Password INVALID: "${testUser.password}" does NOT match`)
        console.log(`   🔍 Expected password: Lumiku2025!`)
        console.log(`   🔍 Testing if hash is correct...`)

        // Try to generate hash and compare
        const testHash = await bcrypt.hash('Lumiku2025!', 10)
        console.log(`   🔑 New test hash: ${testHash.substring(0, 20)}...`)

        const testMatch = await bcrypt.compare('Lumiku2025!', testHash)
        console.log(`   🔍 Test hash validation: ${testMatch ? 'WORKS' : 'BROKEN'}`)
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log('\n\n📊 Summary:')
  console.log('='.repeat(50))

  const allUsers = await prisma.users.findMany({
    where: {
      email: {
        in: TEST_USERS.map(u => u.email)
      }
    },
    include: {
      credits: true
    }
  })

  console.log(`Total users found: ${allUsers.length}/4`)

  for (const user of allUsers) {
    const totalCredits = user.credits.reduce((sum, c) => sum + c.balance, 0)
    console.log(`- ${user.email}: ${totalCredits} credits`)
  }

  await prisma.$disconnect()
}

testLogin().catch(console.error)

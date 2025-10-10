#!/usr/bin/env bun
// Fix password hash for enterprise users
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ENTERPRISE_EMAILS = [
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
]

const PASSWORD = 'Lumiku2025!'

async function fixPasswords() {
  console.log('🔧 Fixing Enterprise Users Passwords...\n')

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

  console.log(`✅ Updated ${result.count} users\n`)

  // Verify each user
  console.log('🔍 Verifying users...\n')

  for (const email of ENTERPRISE_EMAILS) {
    const user = await prisma.users.findUnique({
      where: { email }
    })

    if (user) {
      const isValid = await bcrypt.compare(PASSWORD, user.password)
      console.log(`${isValid ? '✅' : '❌'} ${email}: ${isValid ? 'Password VALID' : 'Password INVALID'}`)
    } else {
      console.log(`❌ ${email}: User not found`)
    }
  }

  console.log('\n✅ Password fix completed!')
  await prisma.$disconnect()
}

fixPasswords().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})

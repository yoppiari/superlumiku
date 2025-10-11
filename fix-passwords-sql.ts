// Fix passwords using raw SQL - no Prisma needed
import { Client } from 'pg'
import bcrypt from 'bcryptjs'

const DATABASE_URL = 'postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres'

const ENTERPRISE_EMAILS = [
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
]

const PASSWORD = 'Lumiku2025!'

async function fixPasswords() {
  const client = new Client({
    connectionString: DATABASE_URL
  })

  try {
    await client.connect()
    console.log('✅ Connected to production database\n')

    console.log('🔧 Fixing Enterprise Users Passwords...\n')

    // Generate correct hash
    const correctHash = await bcrypt.hash(PASSWORD, 10)
    console.log(`✅ Generated hash for password: "${PASSWORD}"`)
    console.log(`🔑 Hash: ${correctHash}\n`)

    // Update all users
    const updateQuery = `
      UPDATE users
      SET password = $1
      WHERE email = ANY($2::text[])
      RETURNING email, name
    `

    const result = await client.query(updateQuery, [correctHash, ENTERPRISE_EMAILS])

    console.log(`✅ Updated ${result.rowCount} users:\n`)
    result.rows.forEach((row: any) => {
      console.log(`   - ${row.name} (${row.email})`)
    })

    console.log('\n🔍 Verifying passwords...\n')

    // Verify each user
    for (const email of ENTERPRISE_EMAILS) {
      const selectQuery = `
        SELECT u.email, u.name, u.password, COALESCE(SUM(c.balance), 0) as total_credits
        FROM users u
        LEFT JOIN credits c ON c."userId" = u.id
        WHERE u.email = $1
        GROUP BY u.id, u.email, u.name, u.password
      `

      const userResult = await client.query(selectQuery, [email])

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0]
        const isValid = await bcrypt.compare(PASSWORD, user.password)

        console.log(`${isValid ? '✅' : '❌'} ${email}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Password: ${isValid ? 'VALID ✅' : 'INVALID ❌'}`)
        console.log(`   Credits: ${user.total_credits}`)
        console.log(`   Can login: ${isValid ? 'YES 🎉' : 'NO ❌'}\n`)
      } else {
        console.log(`❌ ${email}: User not found\n`)
      }
    }

    console.log('✅ Password fix completed!')
    console.log('🎉 All 4 users can now login to app.lumiku.com')
    console.log(`🔑 Password: ${PASSWORD}\n`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await client.end()
    console.log('✅ Database connection closed')
  }
}

fixPasswords().catch((error) => {
  console.error('Failed:', error)
  process.exit(1)
})

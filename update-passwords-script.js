const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Define new unique passwords for each user
const userUpdates = [
  {
    email: 'ardianfaisal.id@gmail.com',
    newPassword: 'Ardian2025'
  },
  {
    email: 'iqbal.elvo@gmail.com',
    newPassword: 'Iqbal2025'
  },
  {
    email: 'galuh.inteko@gmail.com',
    newPassword: 'Galuh2025'
  },
  {
    email: 'dilla.inteko@gmail.com',
    newPassword: 'Dilla2025'
  }
];

async function checkAndUpdatePasswords() {
  try {
    console.log('🔍 Checking enterprise users...\n');

    // First, check all users
    for (const userUpdate of userUpdates) {
      const user = await prisma.user.findUnique({
        where: { email: userUpdate.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          credits: true,
          password: true
        }
      });

      if (!user) {
        console.log(`❌ User not found: ${userUpdate.email}\n`);
        continue;
      }

      console.log(`✅ Found user: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Credits: ${user.credits}`);
      console.log(`   Current password hash: ${user.password.substring(0, 20)}...`);
      console.log();
    }

    console.log('\n🔐 Updating passwords...\n');

    // Now update passwords
    for (const userUpdate of userUpdates) {
      const hashedPassword = await bcrypt.hash(userUpdate.newPassword, 10);

      const updatedUser = await prisma.user.update({
        where: { email: userUpdate.email },
        data: { password: hashedPassword },
        select: {
          id: true,
          email: true,
          name: true,
          password: true
        }
      });

      console.log(`✅ Updated password for: ${updatedUser.name}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   New password: ${userUpdate.newPassword}`);
      console.log(`   New hash: ${updatedUser.password.substring(0, 20)}...`);
      console.log();
    }

    console.log('\n✅ All passwords updated successfully!\n');
    console.log('📋 NEW CREDENTIALS:\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const userUpdate of userUpdates) {
      const user = await prisma.user.findUnique({
        where: { email: userUpdate.email },
        select: { name: true, email: true, credits: true }
      });

      console.log(`User: ${user?.name}`);
      console.log(`Email: ${user?.email}`);
      console.log(`Password: ${userUpdate.newPassword}`);
      console.log(`Credits: ${user?.credits}`);
      console.log('Access: Video Mixer & Carousel Mix (Unlimited)');
      console.log('───────────────────────────────────────────────────────────\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdatePasswords();

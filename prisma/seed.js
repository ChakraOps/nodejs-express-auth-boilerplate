const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const seedRolesAndPermissions = require('./seeds/role-permission.seed');
const seedUsers = require('./seeds/user.seed');

(async () => {
  try {
    console.log('--- Seeding Start ---');

    await seedRolesAndPermissions();
    await seedUsers();

    console.log('--- Seeding Complete ✅ ---');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await prisma.$disconnect();
  }
})();

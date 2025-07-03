const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedUsers = async () => {
  console.log('Seeding initial users...');

  const superadminRole = await prisma.role.findUnique({ where: { name: 'superadmin' } });
  if (!superadminRole) throw new Error('Superadmin role missing, seed roles first');

  const defaultUsers = [
    {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: 'SuperSecurePass123',
      role: 'superadmin'
    },
    {
      firstName: 'Support',
      lastName: 'Lead',
      email: 'lead@example.com',
      password: 'SupportLeadPass123',
      role: 'system_support_lead'
    },
    {
      firstName: 'Engineer',
      lastName: 'Support',
      email: 'engineer@example.com',
      password: 'SupportEngineerPass123',
      role: 'system_support_engineer'
    }
  ];

  for (const user of defaultUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });

    if (!existing) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      const createdUser = await prisma.user.create({
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          passwordHash,
          isEmailVerified: true
        }
      });

      const role = await prisma.role.findUnique({ where: { name: user.role } });

      await prisma.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: role.id
        }
      });

      console.log(`User created: ${user.email}`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  console.log('Users seeded ✅');
};

module.exports = seedUsers;

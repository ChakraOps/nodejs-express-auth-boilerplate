const prisma = require('../core/db');
const log = require('../core/logger');

const listUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isEmailVerified: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

const updateUserRole = async (userId, roleId) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error('Invalid role');

  await prisma.userRole.upsert({
    where: { userId_roleId_teamId: { userId, roleId, teamId: null } },
    update: {},
    create: { userId, roleId }
  });

  log.info(`Role ${role.name} assigned to user: ${userId}`);

  return { success: true, message: `Role ${role.name} assigned to user` };
};

module.exports = { listUsers, updateUserRole };

const prisma = require('../core/db');
const log = require('../core/logger');
const { createAuditLog } = require('../core/audit');

const listUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isEmailVerified: true,
      createdAt: true,
      roles: {
        select: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  const formatted = users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    roles: user.roles.map((r) => r.role.name)
  }));

  log.info('Admin listed all users with roles');

  return formatted;
};

const updateUserRoles = async (userId, roles = [], req) => {
  await prisma.userRole.deleteMany({ where: { userId } });

  const roleRecords = await prisma.role.findMany({
    where: { name: { in: roles } }
  });

  for (const role of roleRecords) {
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
  }

  log.info(`Admin updated roles for user: ${userId}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Updated roles for user ${userId}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return { success: true, message: 'User roles updated' };
};

const listAuditLogs = async () => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  log.info('Admin fetched audit logs');
  return logs;
};

module.exports = { listUsers, updateUserRoles, listAuditLogs };

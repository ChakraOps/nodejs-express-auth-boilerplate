const prisma = require('../core/db');
const log = require('../core/logger');
const { createAuditLog } = require('../core/audit');

const listUsers = async () => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isEmailVerified: true,
      createdAt: true,
      roles: {
        select: { role: { select: { name: true } } }
      }
    }
  });

  return users.map(u => ({
    ...u,
    roles: u.roles.map(r => r.role.name)
  }));
};

const updateUserRoles = async (userId, roles = [], req) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new Error('Roles array is required');
  }

  await prisma.userRole.deleteMany({ where: { userId } });

  const roleRecords = await prisma.role.findMany({
    where: { name: { in: roles } }
  });

  if (roleRecords.length === 0) throw new Error('No valid roles found');

  for (const role of roleRecords) {
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
  }

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Updated roles for user ${userId}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  log.info(`Admin updated roles for user: ${userId}`);
  return { success: true, message: 'User roles updated' };
};

const softDeleteUser = async (userId, req) => {
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() }
  });

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Soft deleted user ${userId}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  log.warn(`User soft-deleted: ${userId}`);
  return { success: true, message: 'User soft deleted' };
};

const listRoles = async () => {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, description: true, isSystem: true }
  });
  return roles;
};

const createRole = async (data) => {
  const role = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description || null,
      isSystem: data.isSystem || false
    }
  });
  log.info(`New role created: ${role.name}`);
  return role;
};

const updateRole = async (roleId, data) => {
  const updated = await prisma.role.update({
    where: { id: roleId },
    data: {
      name: data.name,
      description: data.description,
      isSystem: data.isSystem
    }
  });
  log.info(`Role updated: ${roleId}`);
  return updated;
};

const deleteRole = async (roleId) => {
  await prisma.role.delete({ where: { id: roleId } });
  log.info(`Role deleted: ${roleId}`);
  return { success: true, message: 'Role deleted' };
};

const listAuditLogs = async () => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return logs;
};

module.exports = {
  listUsers,
  updateUserRoles,
  softDeleteUser,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listAuditLogs
};

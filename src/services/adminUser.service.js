const prisma = require('../core/db');
const log = require('../core/logger');
const { createAuditLog } = require('../core/audit');
const bcrypt = require('bcrypt');

const listUsers = async () => {
  const users = await prisma.user.findMany({
    // where: { deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isEmailVerified: true,
      createdAt: true,
      deletedAt: true,
      roles: {
        select: { role: { select: { name: true } } }
      }
    }
  });

  return users.map((u) => ({
    ...u,
    roles: u.roles.map((r) => r.role.name)
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

  log.warn(`User soft-deleted: ${userId}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Soft deleted user ${userId}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return { success: true, message: 'User soft deleted' };
};

const listAuditLogs = async () => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return logs;
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isEmailVerified: true,
      createdAt: true,
      deletedAt: true,
      roles: { select: { role: { select: { name: true } } } }
    }
  });

  if (!user) throw new Error('User not found');

  return {
    ...user,
    roles: user.roles.map((r) => r.role.name)
  };
};

const createUser = async (data, req) => {
  if (!data.email || !data.password) throw new Error('Email and password required');

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });
  if (existing) throw new Error('Email already exists');

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email.toLowerCase(),
      passwordHash,
      isEmailVerified: !!data.isEmailVerified
    }
  });

  // Optional Role Assignment
  if (Array.isArray(data.roles) && data.roles.length > 0) {
    const roles = await prisma.role.findMany({
      where: { name: { in: data.roles } }
    });

    for (const role of roles) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id }
      });
    }
  }

  log.info(`Admin created user: ${user.email}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Created user ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return { success: true, message: 'User created', userId: user.id };
};

const updateUserProfile = async (userId, data, req) => {
  const allowed = {
    firstName: data.firstName,
    lastName: data.lastName,
    isEmailVerified: data.isEmailVerified
  };

  await prisma.user.update({
    where: { id: userId },
    data: allowed
  });

  log.info(`Admin updated user profile: ${userId}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Updated profile for user ${userId}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return { success: true, message: 'User profile updated' };
};

module.exports = {
  listUsers,
  updateUserRoles,
  softDeleteUser,
  listAuditLogs,
  getUserById,
  createUser,
  updateUserProfile
};

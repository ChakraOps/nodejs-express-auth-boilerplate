const prisma = require('../core/db');
const log = require('../core/logger');
const { createAuditLog } = require('../core/audit');
const bcrypt = require('bcrypt');

const listUsers = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isEmailVerified: true,
        createdAt: true
      }
    }),
    prisma.user.count({ where: { deletedAt: null } })
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
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
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || existing.deletedAt !== null) {
    throw new Error('User not found or already deleted');
  }

  // Soft-delete user
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() }
  });

  // Cleanup sessions, tokens
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.verificationToken.deleteMany({ where: { userId } });

  log.info(`User soft-deleted: ${userId}, associated sessions/tokens cleaned`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Soft-deleted user ${userId} and cleaned sessions/tokens`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return { success: true, message: 'User deleted successfully' };
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

/**
 * Get combined permissions: role-based + user-specific
 */
const getUserPermissions = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      permissions: { include: { permission: true } }
    }
  });

  if (!user) throw new Error('User not found');

  // 1Role-based permissions
  const rolePermissions = user.roles.flatMap((ur) =>
    ur.role.permissions.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
      source: 'role'
    }))
  );

  // Direct user-permissions
  const directPermissions = user.permissions.map((up) => ({
    id: up.permission.id,
    name: up.permission.name,
    description: up.permission.description,
    source: 'user'
  }));

  // 3Combine & remove duplicates based on permission ID
  const combined = [...rolePermissions, ...directPermissions];
  const uniquePermissions = Array.from(new Map(combined.map(p => [p.id, p])).values());

  log.info(`Fetched combined permissions for user: ${userId}`);
  return uniquePermissions;
};

/**
 * Update user's direct permissions (overwrites existing)
 */
const updateUserPermissions = async (userId, permissionIds = [], req) => {
  if (!Array.isArray(permissionIds)) {
    throw new Error('permissions array must be provided');
  }

  await prisma.userPermission.deleteMany({ where: { userId } });

  const validPermissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } }
  });

  if (validPermissions.length === 0) throw new Error('No valid permissions found');

  for (const perm of validPermissions) {
    await prisma.userPermission.create({
      data: { userId, permissionId: perm.id }
    });
  }

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Updated direct permissions for user ${userId}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  log.info(`User permissions updated for user: ${userId}`);
  return { success: true, message: 'User permissions updated' };
};


module.exports = {
  listUsers,
  updateUserRoles,
  softDeleteUser,
  listAuditLogs,
  getUserById,
  createUser,
  getUserPermissions,
  updateUserPermissions,
  updateUserProfile
};

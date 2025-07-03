const prisma = require('../core/db');
const log = require('../core/logger');
const { createAuditLog } = require('../core/audit');

// List All Permissions
const listPermissions = async () => {
  const permissions = await prisma.permission.findMany({
    orderBy: { name: 'asc' }
  });

  log.info('Admin listed permissions');
  return permissions;
};

// Create Permission
const createPermission = async (data, req) => {
  const exists = await prisma.permission.findUnique({ where: { name: data.name } });
  if (exists) throw new Error('Permission name already exists');

  const permission = await prisma.permission.create({
    data: {
      name: data.name,
      description: data.description || null
    }
  });

  log.info(`Permission created: ${permission.name}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Created permission: ${permission.name}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return permission;
};
// Update Permission
const updatePermission = async (permissionId, data, req) => {
  const updated = await prisma.permission.update({
    where: { id: permissionId },
    data: {
      name: data.name,
      description: data.description
    }
  });

  log.info(`Permission updated: ${updated.id}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Updated permission: ${updated.name}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return updated;
};

// Delete Permission
const deletePermission = async (permissionId, req) => {
  const deleted = await prisma.permission.delete({
    where: { id: permissionId }
  });

  log.warn(`Permission deleted: ${deleted.name}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Deleted permission: ${deleted.name}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return { success: true, message: 'Permission deleted' };
};

// Get all Permissions assigned to a Role
const getRolePermissions = async (roleId) => {
  const permissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
    orderBy: { permission: { name: 'asc' } }
  });

  const result = permissions.map((p) => ({
    id: p.permission.id,
    name: p.permission.name,
    description: p.permission.description
  }));

  log.info(`Fetched permissions for role: ${roleId}`);
  return result;
};

// Update Role-Permission Mapping
const updateRolePermissions = async (roleId, permissionIds = [], req) => {
  if (!Array.isArray(permissionIds)) {
    throw new Error('permissions array is required');
  }

  await prisma.rolePermission.deleteMany({ where: { roleId } });

  const validPermissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } }
  });

  if (validPermissions.length === 0) throw new Error('No valid permissions found');

  for (const perm of validPermissions) {
    await prisma.rolePermission.create({
      data: { roleId, permissionId: perm.id }
    });
  }

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Updated permissions for role ${roleId}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  log.info(`Updated permissions for role: ${roleId}`);

  return { success: true, message: 'Role permissions updated' };
};

module.exports = {
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getRolePermissions,
  updateRolePermissions
};

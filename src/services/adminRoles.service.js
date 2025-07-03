const prisma = require('../core/db');
const log = require('../core/logger');
const { createAuditLog } = require('../core/audit');
const bcrypt = require('bcrypt');

const listRoles = async () => {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, description: true, isSystem: true }
  });
  return roles;
};

const createRole = async (data, req) => {
  const role = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description || null,
      isSystem: data.isSystem || false
    }
  });

  log.info(`New role created: ${role.name}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Created new role ${role.name}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return role;
};

const updateRole = async (roleId, data, req) => {
  const updated = await prisma.role.update({
    where: { id: roleId },
    data: {
      name: data.name,
      description: data.description,
      isSystem: data.isSystem
    }
  });

  log.info(`Role updated: ${roleId}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Updated role ${updated.name}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return updated;
};

const deleteRole = async (roleId, req) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } });

  await prisma.role.delete({ where: { id: roleId } });

  log.info(`Role deleted: ${roleId}`);

  await createAuditLog({
    userId: req.user.sub,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    action: `Deleted role ${role?.name || roleId}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return { success: true, message: 'Role deleted' };
};

module.exports = {
  listRoles,
  createRole,
  updateRole,
  deleteRole
};

const prisma = require('./db');
const log = require('./logger');

const createAuditLog = async ({ userId = null, teamId = null, action, req = null }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        teamId,
        action,
        ipAddress: req?.ip || null,
        userAgent: req?.headers['user-agent'] || null
      }
    });
  } catch (err) {
    log.error(`Failed to create audit log for action: ${action}`, err);
  }
};

module.exports = { createAuditLog };

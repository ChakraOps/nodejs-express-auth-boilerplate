const prisma = require('./db');
const log = require('./logger');

/**
 * Create an audit log entry with full traceability
 *
 * @param {Object} params
 * @param {String} params.userId - User performing the action
 * @param {String} [params.teamId] - Optional team context
 * @param {String} [params.deviceId] - Optional device linked to action
 * @param {String} [params.sessionId] - Optional session linked to action
 * @param {String} params.action - Description of the action
 * @param {String} [params.ipAddress] - Optional IP address (overrides req)
 * @param {String} [params.userAgent] - Optional User-Agent (overrides req)
 * @param {Object} [params.req] - Optional Express request object
 */
const createAuditLog = async ({
  userId = null,
  teamId = null,
  deviceId = null,
  sessionId = null,
  action,
  ipAddress = null,
  userAgent = null,
  req = null
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        teamId,
        deviceId,
        sessionId,
        action,
        ipAddress: ipAddress || req?.ip || null,
        userAgent: userAgent || req?.headers['user-agent'] || null
      }
    });
  } catch (err) {
    log.error(`Failed to create audit log for action: ${action}`, err);
  }
};

module.exports = { createAuditLog };

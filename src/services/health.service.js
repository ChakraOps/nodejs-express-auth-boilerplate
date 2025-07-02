const prisma = require('../core/db');
const log = require('../core/logger');

const getHealthStatus = async () => {
  let databaseStatus = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = true;
  } catch (err) {
    databaseStatus = false;
    log.error('Database health check failed:', err);
  }

  return {
    status: 'OK',
    server: true,
    database: databaseStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
};

module.exports = { getHealthStatus };

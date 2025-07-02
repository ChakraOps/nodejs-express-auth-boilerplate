const prisma = require('../core/db');

const getHealthStatus = async () => {
  let databaseStatus = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = true;
  } catch (err) {
    databaseStatus = false;
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

const { PrismaClient } = require('@prisma/client');
const log = require('./logger');

const prisma = new PrismaClient();

process.on('beforeExit', () => {
  log.info('Process beforeExit: Prisma client disconnecting...');
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    log.info(`DB Query: ${e.query}`);
  });
}

log.info('Prisma client initialized');

module.exports = prisma;

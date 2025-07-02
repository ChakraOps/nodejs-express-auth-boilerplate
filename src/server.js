const app = require('./app');
const env = require('./config/env');
const logger = require('./core/logger');
const prisma = require('./core/db');

(async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error('Failed to connect to database', err);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Process terminated');
  await prisma.$disconnect();
  process.exit(0);
});

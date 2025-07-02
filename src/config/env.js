const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  databaseUrl: process.env.DATABASE_URL,

  featureFlags: {
    enable2FA: process.env.ENABLE_2FA === 'true',
    enableMagicLink: process.env.ENABLE_MAGIC_LINK === 'true',
    enableAuditLogs: process.env.ENABLE_AUDIT_LOGS === 'true'
  }
};

module.exports = env;

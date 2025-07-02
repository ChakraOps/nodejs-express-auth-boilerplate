const jwt = require('jsonwebtoken');
const env = require('../config/env');
const log = require('./logger');

const signAccessToken = ({ userId, roles = [] }) => {
  if (!env.jwt.accessSecret) {
    log.error('Access token secret missing');
    throw new Error('Access token secret missing');
  }

  const token = jwt.sign({ sub: userId, roles }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn
  });

  log.info(`Access token signed for user: ${userId}`);
  return token;
};

const signRefreshToken = ({ userId }) => {
  if (!env.jwt.refreshSecret) {
    log.error('Refresh token secret missing');
    throw new Error('Refresh token secret missing');
  }

  const token = jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn
  });

  log.info(`Refresh token signed for user: ${userId}`);
  return token;
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    log.warn('Invalid or expired access token');
    throw new Error('Invalid or expired access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.refreshSecret);
  } catch (err) {
    log.warn('Invalid or expired refresh token');
    throw new Error('Invalid or expired refresh token');
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};

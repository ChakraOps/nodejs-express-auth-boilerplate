const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = ({ userId, roles = [] }) => {
  if (!env.jwt.accessSecret) throw new Error('Access token secret missing');
  return jwt.sign(
    { sub: userId, roles },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
};

const signRefreshToken = ({ userId }) => {
  if (!env.jwt.refreshSecret) throw new Error('Refresh token secret missing');
  return jwt.sign(
    { sub: userId },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    throw new Error('Invalid or expired access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.refreshSecret);
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};

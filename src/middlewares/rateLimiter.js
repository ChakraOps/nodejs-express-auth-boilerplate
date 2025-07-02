const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = limiter;

const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const log = require('../core/logger');

// Tighter limit for login attempts
const loginLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: 'Too many login attempts, please try again later.' });
  }
});

// Tighter limit for register attempts
const registerLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`Register rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: 'Too many registration attempts, please try again later.' });
  }
});

// General limit for other APIs
const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`General rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  }
});

module.exports = { loginLimiter, registerLimiter, generalLimiter };

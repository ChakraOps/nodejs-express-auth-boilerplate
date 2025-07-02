const express = require('express');
const { register, login, refresh, logout, logoutAll } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { loginLimiter, registerLimiter, generalLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', generalLimiter, refresh);
router.post('/logout', generalLimiter, logout);
router.post('/logout-all', logoutAll);

module.exports = router;

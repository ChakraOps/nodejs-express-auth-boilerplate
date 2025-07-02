const express = require('express');
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { loginLimiter, registerLimiter, generalLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', generalLimiter, refresh);
router.post('/logout', generalLimiter, logout);

module.exports = router;

const express = require('express');
const { register, login, refresh, resendVerification , verifyEmail,forgotPassword,resetPassword, logout, logoutAll } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema, resendVerificationSchema,forgotPasswordSchema,resetPasswordSchema } = require('../validators/auth.validator');
const { loginLimiter, registerLimiter, generalLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', generalLimiter, refresh);
router.post('/resend-verification', validate(resendVerificationSchema),registerLimiter, resendVerification);
router.post('/verify', registerLimiter, verifyEmail);
router.post('/forgot-password', registerLimiter, validate(forgotPasswordSchema), forgotPassword);
c
router.post('/logout', generalLimiter, logout);
router.post('/logout-all', logoutAll);

module.exports = router;

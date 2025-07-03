const express = require('express');
const healthRoutes = require('./health.route');
const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const adminRoutes = require('./admin.route');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

router.use(authenticate);

router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

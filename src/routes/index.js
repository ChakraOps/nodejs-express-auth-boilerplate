const express = require('express');
const healthRoutes = require('./health.route');
const authRoutes = require('./auth.route');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

module.exports = router;

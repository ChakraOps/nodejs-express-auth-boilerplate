const express = require('express');
const healthRoutes = require('./health.route');

const router = express.Router();

router.use('/health', healthRoutes);

module.exports = router;

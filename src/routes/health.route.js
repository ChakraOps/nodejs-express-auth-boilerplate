const express = require('express');
const { healthCheck } = require('../controllers/health.controller');

const router = express.Router();

router.get('/', healthCheck);

module.exports = router;

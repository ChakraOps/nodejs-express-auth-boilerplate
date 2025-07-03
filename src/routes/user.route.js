const express = require('express');
const requireRole = require('../middlewares/requireRole');
const { getProfile, updateProfile } = require('../controllers/user.controller');

const router = express.Router();

// All routes here assume user is authenticated at index.js layer

router.get('/me', getProfile);

router.patch('/me', updateProfile);

module.exports = router;

const express = require('express');
const requireRole = require('../middlewares/requireRole');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// All routes here assume user is authenticated at index.js layer

router.get('/users', requireRole(['superadmin']), adminController.listUsers);

router.patch('/users/:id/role', requireRole(['superadmin']), adminController.updateUserRole);

module.exports = router;

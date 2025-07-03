const express = require('express');
const requireRole = require('../middlewares/requireRole');
const { listUsers, updateUserRoles, listAuditLogs } = require('../controllers/admin.controller');

const router = express.Router();

router.use(requireRole(['superadmin']));

// List all users
router.get('/users', listUsers);

// Update user roles
router.patch('/users/:id/roles', updateUserRoles);

// View audit logs
router.get('/audit-logs', listAuditLogs);

module.exports = router;

const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['superadmin']));

// Users
router.get('/users', adminController.listUsers);
router.patch('/users/:id/roles', adminController.updateUserRoles);
router.delete('/users/:id', adminController.softDeleteUser);

// Roles
router.get('/roles', adminController.listRoles);
router.post('/roles', adminController.createRole);
router.patch('/roles/:id', adminController.updateRole);
router.delete('/roles/:id', adminController.deleteRole);

// Users
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', adminController.updateUserProfile);
router.post('/users/create', adminController.createUser);

// Permissions
router.get('/permissions', adminController.listPermissions);
router.post('/permissions', adminController.createPermission);
router.patch('/permissions/:id', adminController.updatePermission);
router.delete('/permissions/:id', adminController.deletePermission);

// Role-Permission
router.get('/roles/:id/permissions', adminController.getRolePermissions);
router.patch('/roles/:id/permissions', adminController.updateRolePermissions);

// User Permissions
router.get('/users/:id/permissions', adminController.getUserPermissions);
router.patch('/users/:id/permissions', adminController.updateUserPermissions);

// // Teams
// router.get('/teams', adminController.listTeams);
// router.post('/teams', adminController.createTeam);
// router.patch('/teams/:id', adminController.updateTeam);
// router.delete('/teams/:id', adminController.deleteTeam);

// // Team Members
// router.get('/teams/:id/members', adminController.listTeamMembers);
// router.post('/teams/:id/members', adminController.addTeamMember);
// router.delete('/teams/:id/members/:userId', adminController.removeTeamMember);


// Audit Logs
router.get('/audit-logs', adminController.listAuditLogs);

module.exports = router;

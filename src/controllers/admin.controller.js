const adminUserService = require('../services/adminUser.service');
const adminRolesService = require('../services/adminRoles.service');
const adminPermissionService = require('../services/adminPermission.service');

const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const users = await adminUserService.listUsers({ page, limit });

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};


const updateUserRoles = async (req, res, next) => {
  try {
    const result = await adminUserService.updateUserRoles(req.params.id, req.body.roles, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const softDeleteUser = async (req, res, next) => {
  try {
    const result = await adminUserService.softDeleteUser(req.params.id, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listAuditLogs = async (req, res, next) => {
  try {
    const logs = await adminUserService.listAuditLogs();
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminUserService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const result = await adminUserService.updateUserProfile(req.params.id, req.body, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const result = await adminUserService.createUser(req.body, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listRoles = async (req, res, next) => {
  try {
    const roles = await adminRolesService.listRoles();
    res.status(200).json(roles);
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  try {
    const result = await adminRolesService.createRole(req.body, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const result = await adminRolesService.updateRole(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const result = await adminRolesService.deleteRole(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listPermissions = async (req, res, next) => {
  try {
    const result = await adminPermissionService.listPermissions();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const createPermission = async (req, res, next) => {
  try {
    const result = await adminPermissionService.createPermission(req.body, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const updatePermission = async (req, res, next) => {
  try {
    const result = await adminPermissionService.updatePermission(req.params.id, req.body, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deletePermission = async (req, res, next) => {
  try {
    const result = await adminPermissionService.deletePermission(req.params.id, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getRolePermissions = async (req, res, next) => {
  try {
    const result = await adminPermissionService.getRolePermissions(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    const result = await adminPermissionService.updateRolePermissions(
      req.params.id,
      req.body.permissions,
      req
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getUserPermissions = async (req, res, next) => {
  try {
    const result = await adminUserService.getUserPermissions(req.params.id);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

const updateUserPermissions = async (req, res, next) => {
  try {
    const result = await adminUserService.updateUserPermissions(req.params.id, req.body.permissions, req);
    res.status(200).json(result);
  } catch (err) { next(err); }
};


// const listTeams = async (req, res, next) => {
//   try {
//     const result = await adminService.listTeams();
//     res.status(200).json(result);
//   } catch (err) { next(err); }
// };

// const createTeam = async (req, res, next) => {
//   try {
//     const result = await adminService.createTeam(req.body, req);
//     res.status(201).json(result);
//   } catch (err) { next(err); }
// };

// const updateTeam = async (req, res, next) => {
//   try {
//     const result = await adminService.updateTeam(req.params.id, req.body, req);
//     res.status(200).json(result);
//   } catch (err) { next(err); }
// };

// const deleteTeam = async (req, res, next) => {
//   try {
//     const result = await adminService.deleteTeam(req.params.id, req);
//     res.status(200).json(result);
//   } catch (err) { next(err); }
// };

// const listTeamMembers = async (req, res, next) => {
//   try {
//     const result = await adminService.listTeamMembers(req.params.id);
//     res.status(200).json(result);
//   } catch (err) { next(err); }
// };

// const addTeamMember = async (req, res, next) => {
//   try {
//     const result = await adminService.addTeamMember(req.params.id, req.body.userId, req);
//     res.status(201).json(result);
//   } catch (err) { next(err); }
// };

// const removeTeamMember = async (req, res, next) => {
//   try {
//     const result = await adminService.removeTeamMember(req.params.id, req.params.userId, req);
//     res.status(200).json(result);
//   } catch (err) { next(err); }
// };


module.exports = {
  listUsers,
  updateUserRoles,
  softDeleteUser,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  getUserById,
  updateUserProfile,
  createUser,
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getRolePermissions,
  updateRolePermissions,
  getUserPermissions,
  updateUserPermissions,
  listAuditLogs
};

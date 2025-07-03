const adminService = require('../services/admin.service');

const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.listUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

const updateUserRoles = async (req, res, next) => {
  try {
    const result = await adminService.updateUserRoles(req.params.id, req.body.roles, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const softDeleteUser = async (req, res, next) => {
  try {
    const result = await adminService.softDeleteUser(req.params.id, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listRoles = async (req, res, next) => {
  try {
    const roles = await adminService.listRoles();
    res.status(200).json(roles);
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  try {
    const result = await adminService.createRole(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const result = await adminService.updateRole(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const result = await adminService.deleteRole(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const listAuditLogs = async (req, res, next) => {
  try {
    const logs = await adminService.listAuditLogs();
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const result = await adminService.updateUserProfile(req.params.id, req.body, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const result = await adminService.createUser(req.body, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

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
  listAuditLogs
};

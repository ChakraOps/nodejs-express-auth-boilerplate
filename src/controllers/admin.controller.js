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

const listAuditLogs = async (req, res, next) => {
  try {
    const logs = await adminService.listAuditLogs();
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, updateUserRoles, listAuditLogs };

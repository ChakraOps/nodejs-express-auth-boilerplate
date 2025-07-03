const adminService = require('../services/admin.service');

const listUsers = async (req, res, next) => {
  try {
    const result = await adminService.listUsers();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    const result = await adminService.updateUserRole(id, roleId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, updateUserRole };

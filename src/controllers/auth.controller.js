const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, inviteId } = req.body;
    const result = await authService.register({
      firstName,
      lastName,
      email,
      password,
      inviteId,
      req
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password, req });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logoutAll(refreshToken, req);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, logoutAll };

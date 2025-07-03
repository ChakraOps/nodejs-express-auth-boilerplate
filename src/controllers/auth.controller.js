const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, inviteId } = req.body;
    const deviceName = req.headers['x-device-name'] || 'Unknown';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.register({
      firstName,
      lastName,
      email,
      password,
      inviteId,
      deviceName,
      ipAddress,
      userAgent
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const deviceName = req.headers['x-device-name'] || 'Unknown';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login({
      email,
      password,
      deviceName,
      ipAddress,
      userAgent
    });

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

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.resendVerification({
      email,
      ipAddress,
      userAgent
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
        console.log(token)

    const result = await authService.verifyEmail({ token, ipAddress, userAgent });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    await authService.forgotPassword({ email, ipAddress, userAgent });

    res.json({ success: true, message: 'If the account exists, a password reset email has been sent' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.resetPassword({ token, newPassword, ipAddress, userAgent });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.logout(refreshToken, ipAddress, userAgent);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.logoutAll(refreshToken, ipAddress, userAgent);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  verifyEmail,
  resendVerification,
  logout,
forgotPassword,
  resetPassword,
  logoutAll
};

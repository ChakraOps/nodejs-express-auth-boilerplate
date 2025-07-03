const userService = require('../services/user.service');


const getProfile = async (req, res, next) => {
  try {
    const result = await userService.getProfile(req.user.sub);  // Use .sub, not .userId
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
const result = await userService.updateProfile(
  req.user.sub,
  req.body,
  req.user.deviceId,   
  req.ip,
  req.headers['user-agent'],
  req.user.sessionId
);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };

const { verifyAccessToken } = require('../core/jwt');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Missing token');

    const payload = verifyAccessToken(token);

    req.user = payload;
    req.user.sessionId = payload.sessionId;
    req.deviceId = payload.deviceId;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

module.exports = authenticate;

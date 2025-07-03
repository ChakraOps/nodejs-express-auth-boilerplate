const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user?.roles) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  if (allowedRoles.some((role) => req.user.roles.includes(role))) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Forbidden' });
};

module.exports = requireRole;

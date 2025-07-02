const healthService = require('../services/health.service');

const healthCheck = async (req, res, next) => {
  try {
    const healthStatus = await healthService.getHealthStatus();
    res.status(200).json(healthStatus);
  } catch (err) {
    next(err);
  }
};

module.exports = { healthCheck };

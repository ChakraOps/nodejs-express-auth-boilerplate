const validate = (schema) => (req, res, next) => {
  try {
    if (!schema || typeof schema.parse !== 'function') {
      throw new Error('Invalid schema provided to validator');
    }

    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const messages = err.errors?.map((e) => e.message) || [err.message || 'Invalid input'];
    return res.status(400).json({
      success: false,
      message: messages[0]
    });
  }
};

module.exports = validate;

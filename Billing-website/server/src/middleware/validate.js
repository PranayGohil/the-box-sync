const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => `${err.path || err.param}: ${err.msg}`);
    return res.status(422).json({
      success: false,
      message: 'Validation failed: ' + formattedErrors.join(', '),
      errors: formattedErrors
    });
  }
  next();
};

module.exports = { validate };

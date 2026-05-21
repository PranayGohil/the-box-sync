const Joi = require("joi");

/**
 * Middleware factory that validates req.body against a Joi schema.
 * Returns 400 with a list of human-readable errors on failure.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,   // collect all errors, not just the first
    stripUnknown: true,  // silently remove fields not in schema
  });

  if (error) {
    const errors = error.details.map((d) => d.message.replace(/['"]/g, ""));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

module.exports = validate;

const Joi = require("joi");

const sendOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "A valid email address is required",
    "any.required": "Email is required",
  }),
  login_from: Joi.string().optional(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.number().integer().min(100000).max(999999).required().messages({
    "number.min": "OTP must be a 6-digit number",
    "number.max": "OTP must be a 6-digit number",
    "any.required": "OTP is required",
  }),
  login_from: Joi.string().optional(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "New password must be at least 6 characters",
    "any.required": "New password is required",
  }),
  login_from: Joi.string().optional(),
});

const updateTaxSchema = Joi.object({
  gst_no: Joi.string().allow("", null).optional(),
  taxInfo: Joi.object({
    cgst: Joi.number().min(0).max(100).default(0),
    sgst: Joi.number().min(0).max(100).default(0),
    vat: Joi.number().min(0).max(100).default(0),
  }).optional(),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  updateTaxSchema,
};

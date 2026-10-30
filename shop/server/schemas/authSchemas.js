const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "A valid email address is required",
    "any.required": "Email is required",
  }),
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().pattern(/^[0-9]{7,15}$/).optional().allow("", null).messages({
    "string.pattern.base": "Mobile must be a valid phone number (7–15 digits)",
  }),
  country: Joi.string().required(),
  country_code: Joi.string().required(),
  state: Joi.string().required(),
  state_code: Joi.string().required(),
  city: Joi.string().optional().allow("", null),
  address: Joi.string().optional().allow("", null),
  pincode: Joi.string().optional().allow("", null),
  gst_no: Joi.string().optional().allow("", null),
  fssai_no: Joi.string().optional().allow("", null),
  shop_type: Joi.string().optional().allow("", null),
  is_shop: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
}).unknown(true);

const superAdminLoginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    "any.required": "Username is required",
  }),
  password: Joi.string().min(6).required().messages({
    "any.required": "Password is required",
  }),
});

const emailCheckSchema = Joi.object({
  email: Joi.string().email().required(),
});

module.exports = {
  loginSchema,
  registerSchema,
  superAdminLoginSchema,
  emailCheckSchema,
};

const Joi = require("joi");

const panelLoginSchema = Joi.object({
  restaurant_code: Joi.string().optional().allow('', null),
  username: Joi.string().min(3).max(50).required().messages({
    "any.required": "Username is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

const createPanelUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    "any.required": "Username is required",
  }),
  password: Joi.string().min(6).optional().messages({
    "string.min": "Password must be at least 6 characters",
  }),
  adminPassword: Joi.string().optional().messages({
    "any.required": "Admin password is required",
  }),
});

const changePanelPasswordSchema = Joi.object({
  adminPassword: Joi.string().required().messages({
    "any.required": "Admin password is required",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "New password must be at least 6 characters",
    "any.required": "New password is required",
  }),
});

module.exports = {
  panelLoginSchema,
  createPanelUserSchema,
  changePanelPasswordSchema,
};

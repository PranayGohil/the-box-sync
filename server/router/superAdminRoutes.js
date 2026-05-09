const express = require("express");
const { 
  superAdminLogin, 
  impersonateUser, 
  getAuditLogs, 
  createSubAdmin, 
  getAllAdmins, 
  deleteSubAdmin 
} = require("../controllers/superAdminController");
const validate = require("../middlewares/validate");
const { superAdminLoginSchema } = require("../schemas/authSchemas");

const superAdminRouter = express.Router();
const superAdminAuth = require("../middlewares/superAdminAuth");

superAdminRouter.post("/login", validate(superAdminLoginSchema), superAdminLogin);
superAdminRouter.post("/impersonate/:userId", superAdminAuth, impersonateUser);
superAdminRouter.get("/audit-logs", superAdminAuth, getAuditLogs);

// Admin Management (Owner Only)
superAdminRouter.post("/create", superAdminAuth, createSubAdmin);
superAdminRouter.get("/list", superAdminAuth, getAllAdmins);
superAdminRouter.delete("/delete/:id", superAdminAuth, deleteSubAdmin);

module.exports = superAdminRouter;

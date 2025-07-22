const express = require("express");
const { superAdminLogin } = require("../controllers/superAdminController");
const superAdminRouter = express.Router();

superAdminRouter.post("/login", superAdminLogin);

module.exports = superAdminRouter;

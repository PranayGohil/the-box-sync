const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addManager,
  managerLogin,
  getManagerData,
  getManagerDataById,
  updateManager,
  deleteManager,
  changeManagerPassword,
} = require("../controllers/managerController");
const adminAuth = require("../middlewares/adminAuth");

const managerRouter = express.Router();

managerRouter.route("/addmanager").post(authMiddleware, adminAuth, addManager);
managerRouter.route("/manager-login").post(managerLogin);
managerRouter.route("/getmanagerdata").get(authMiddleware, getManagerData);
managerRouter.route("/getmanagerdata/:id").get(getManagerDataById);
managerRouter
  .route("/updatemanager/:id")
  .put(authMiddleware, adminAuth, updateManager);
managerRouter
  .route("/deletemanager")
  .post(authMiddleware, adminAuth, deleteManager);
managerRouter
  .route("/changemanagerpassword")
  .post(authMiddleware, changeManagerPassword);

module.exports = managerRouter;

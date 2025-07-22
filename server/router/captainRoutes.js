const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addCaptain,
  getCaptainData,
  getCaptainDataById,
  updateCaptain,
  deleteCaptain,
  changeCaptainPassword,
  captainLogin,
} = require("../controllers/captainController");
const adminAuth = require("../middlewares/adminAuth");

const captainRouter = express.Router();

captainRouter.route("/addcaptain").post(authMiddleware, adminAuth, addCaptain);

captainRouter.route("/getcaptaindata").get(authMiddleware, getCaptainData);
captainRouter.route("/getcaptaindata/:id").get(getCaptainDataById);

captainRouter.route("/updatecaptain/:id").put(authMiddleware, adminAuth, updateCaptain);
captainRouter.route("/deletecaptain").post(authMiddleware, adminAuth, deleteCaptain);
captainRouter
  .route("/changecaptainpassword")
  .post(authMiddleware, adminAuth, changeCaptainPassword);

captainRouter.route("/captain-login").post(captainLogin);

module.exports = captainRouter;

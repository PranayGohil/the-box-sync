const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  emailCheck,
  register,
  login,
  logout,
  getUserData,
  getUserDataByCode,
  sendAdminOtp,
  verifyAdminOtp,
  resetAdminPassword,
  updateUser,
  updateTax,
  getTokenRole,
  getAllUsers,
} = require("../controllers/userController");
const adminAuth = require("../middlewares/adminAuth");
const upload = require("../middlewares/upload");

const userRouter = express.Router();

userRouter.route("/emailcheck").post(emailCheck);
userRouter.route("/register").post(register);
userRouter.route("/login").post(login);
userRouter.route("/logout").get(logout);
userRouter.route("/sendadminotp").post(authMiddleware, sendAdminOtp);
userRouter
.route("/verifyadminotp")
.post(authMiddleware, verifyAdminOtp);
userRouter
.route("/resetadminpassword")
.post(authMiddleware, resetAdminPassword);
userRouter.route("/get").get(authMiddleware, getUserData);
userRouter.route("/get/:code").get(authMiddleware, getUserDataByCode);
userRouter.route("/update").put(authMiddleware, adminAuth, upload.single("logo"), updateUser);
userRouter.route("/update-tax").put(authMiddleware, adminAuth, updateTax);
userRouter.route("/gettokenrole").get(authMiddleware, getTokenRole);
userRouter.route("/get-all").get(authMiddleware, getAllUsers);

module.exports = userRouter;

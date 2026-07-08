const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  contactEmail,
  sendEnquiry,
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
  updatePrintSettings,
  getTokenRole,
  getAllUsers,
} = require("../controllers/userController");
const adminAuth = require("../middlewares/adminAuth");
const upload = require("../middlewares/upload");
const validate = require("../middlewares/validate");
const { loginSchema, registerSchema, emailCheckSchema } = require("../schemas/authSchemas");
const { sendOtpSchema, verifyOtpSchema, resetPasswordSchema, updateTaxSchema } = require("../schemas/userSchemas");

const userRouter = express.Router();

userRouter.route("/contact").post(contactEmail);
userRouter.route("/enquiry").post(sendEnquiry);
userRouter.route("/check-email").post(validate(emailCheckSchema), emailCheck);
userRouter.route("/register").post(upload.single('logo'), validate(registerSchema), register);
userRouter.route("/login").post(validate(loginSchema), login);
userRouter.route("/logout").get(logout);
userRouter.route("/send-otp").post(validate(sendOtpSchema), sendAdminOtp);
userRouter
.route("/verify-otp")
.post(validate(verifyOtpSchema), verifyAdminOtp);
userRouter
.route("/reset-password")
.post(validate(resetPasswordSchema), resetAdminPassword);
userRouter.route("/get").get(authMiddleware, getUserData);
userRouter.route("/get/:code").get(authMiddleware, getUserDataByCode);
userRouter.route("/update").put(authMiddleware, adminAuth, upload.single("logo"), updateUser);
userRouter.route("/update-tax").put(authMiddleware, adminAuth, validate(updateTaxSchema), updateTax);
userRouter.route("/update-print-settings").put(authMiddleware, adminAuth, updatePrintSettings);
userRouter.route("/get-all").get(authMiddleware, getAllUsers);

module.exports = userRouter;


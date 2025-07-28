const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addQSR,
  getQSRData,
  getQSRDataById,
  updateQSR,
  deleteQSR,
  changeQSRPassword,
  qsrLogin,
} = require("../controllers/qsrController");
const adminAuth = require("../middlewares/adminAuth");

const qsrRouter = express.Router();

qsrRouter.route("/addqsr").post(authMiddleware, adminAuth, addQSR);

qsrRouter.route("/getqsrdata").get(authMiddleware, getQSRData);
qsrRouter.route("/getqsrdata/:id").get(getQSRDataById);

qsrRouter.route("/updateqsr/:id").put(authMiddleware, adminAuth, updateQSR);
qsrRouter.route("/deleteqsr").post(authMiddleware, adminAuth, deleteQSR);
qsrRouter
  .route("/changeqsrpassword")
  .post(authMiddleware, adminAuth, changeQSRPassword);

qsrRouter.route("/qsr-login").post(qsrLogin);

module.exports = qsrRouter;

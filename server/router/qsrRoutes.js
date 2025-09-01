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


qsrRouter.route("/get").get(authMiddleware, getQSRData);
qsrRouter.route("/get/:id").get(getQSRDataById);

qsrRouter.route("/login").post(qsrLogin);

module.exports = qsrRouter;

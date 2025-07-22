const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addAttendance,
  getAttendanceData,
  getAttendanceDataById,
  updateAttendance,
  deleteAttendance,
  changeAttendancePassword,
  attendanceLogin,
} = require("../controllers/attendanceController");
const adminAuth = require("../middlewares/adminAuth");

const attendanceRouter = express.Router();

attendanceRouter.route("/addattendance").post(authMiddleware, adminAuth, addAttendance);

attendanceRouter.route("/getattendancedata").get(authMiddleware, getAttendanceData);
attendanceRouter.route("/getattendancedata/:id").get(getAttendanceDataById);

attendanceRouter.route("/updateattendance/:id").put(authMiddleware, adminAuth, updateAttendance);
attendanceRouter.route("/deleteattendance").post(authMiddleware, adminAuth, deleteAttendance);
attendanceRouter
  .route("/changeattendancepassword")
  .post(authMiddleware, adminAuth, changeAttendancePassword);

attendanceRouter.route("/attendance-login").post(attendanceLogin);

module.exports = attendanceRouter;

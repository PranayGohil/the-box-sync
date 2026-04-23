const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
    getTodayAttendance,
    getAttendanceByStaff,
    getAttendanceSummary,
    checkIn,
    checkOut,
    markAbsent,
    markLeave,
} = require("../controllers/staffAttendanceController");

const staffAttendanceRouter = express.Router();

// Get all staff with today's attendance merged — for ManageAttendance page
staffAttendanceRouter.get("/today", authMiddleware, getTodayAttendance);

// Get full attendance history for one staff — for ViewAttendance page
staffAttendanceRouter.get("/get/:staffId", authMiddleware, getAttendanceByStaff);

// Get computed stats for one staff
staffAttendanceRouter.get("/summary/:staffId", authMiddleware, getAttendanceSummary);

// Attendance actions (no adminAuth — same as your existing routes)
staffAttendanceRouter.post("/check-in", checkIn);
staffAttendanceRouter.post("/check-out", checkOut);
staffAttendanceRouter.post("/mark-absent", markAbsent);
staffAttendanceRouter.post("/mark-leave", markLeave);

module.exports = staffAttendanceRouter;
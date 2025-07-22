const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getStaffPositions,
  getStaffData,
  getStaffDataById,
  addStaff,
  updateStaff,
  deleteStaff,
  checkIn,
  checkOut,
  markAbsent,
  getAllFaceEncodings,
} = require("../controllers/staffController");
const adminAuth = require("../middlewares/adminAuth");

const staffRouter = express.Router();

staffRouter.route("/getstaffpositions").get(authMiddleware, getStaffPositions);
staffRouter.route("/staffdata").get(authMiddleware, getStaffData);
staffRouter.route("/staffdata/:id").get(authMiddleware, getStaffDataById);
staffRouter.route("/addstaff").post(authMiddleware, adminAuth, addStaff);
staffRouter
  .route("/updatestaff/:id")
  .put(authMiddleware, adminAuth, updateStaff);
staffRouter
  .route("/deletestaff/:id")
  .delete(authMiddleware, adminAuth, deleteStaff);

staffRouter.post("/checkin", checkIn);
staffRouter.post("/checkout", checkOut);
staffRouter.post("/markabsent", markAbsent);
staffRouter.get("/face-data", authMiddleware, getAllFaceEncodings);

module.exports = staffRouter;

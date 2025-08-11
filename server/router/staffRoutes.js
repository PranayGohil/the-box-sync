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
const upload = require("../middlewares/upload");

const staffRouter = express.Router();

staffRouter.route("/get-all").get(authMiddleware, getStaffData);
staffRouter.route("/get/:id").get(authMiddleware, getStaffDataById);
staffRouter.route("/get-positions").get(authMiddleware, getStaffPositions);
staffRouter.route("/add").post(
  authMiddleware,
  adminAuth,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "front_image", maxCount: 1 },
    { name: "back_image", maxCount: 1 }
  ]),
  addStaff
);

staffRouter
  .route("/edit/:id")
  .put(
    authMiddleware,
    adminAuth,
    upload.fields([
      { name: "photo", maxCount: 1 },
      { name: "front_image", maxCount: 1 },
      { name: "back_image", maxCount: 1 }
    ]),
    updateStaff);
    
staffRouter
  .route("/delete/:id")
  .delete(authMiddleware, adminAuth, deleteStaff);

staffRouter.post("/check-in", checkIn);
staffRouter.post("/check-out", checkOut);
staffRouter.post("/mark-absent", markAbsent);
staffRouter.get("/face-data", authMiddleware, getAllFaceEncodings);

module.exports = staffRouter;

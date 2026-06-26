const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getStaffPositions,
  getStaffData,
  getStaffDataById,
  addStaff,
  updateStaff,
  deleteStaff,
  getAllFaceEncodings,
  getNextStaffIdController,
  sendJoiningLetter,
  submitResignation,
  processResignation,
  getPendingResignations,
  toggleLeaveStatus,
  toggleSpecificLeave
} = require("../controllers/staffController");
const adminAuth = require("../middlewares/adminAuth");
const upload = require("../middlewares/upload");

const staffRouter = express.Router();

staffRouter.route("/get-next-id").get(authMiddleware, getNextStaffIdController);
staffRouter.route("/get-all").get(authMiddleware, getStaffData);
staffRouter.route("/get/:id").get(authMiddleware, getStaffDataById);
staffRouter.route("/get-positions").get(authMiddleware, getStaffPositions);
staffRouter.route("/send-joining-letter/:id").post(authMiddleware, adminAuth, sendJoiningLetter);
staffRouter.route("/toggle-leave/:id").put(authMiddleware, adminAuth, toggleLeaveStatus);
staffRouter.route("/toggle-specific-leave/:id").put(authMiddleware, adminAuth, toggleSpecificLeave);

// Resignation routes
staffRouter.route("/resign/:id").post(authMiddleware, submitResignation);
staffRouter.route("/process-resignation/:id").post(authMiddleware, adminAuth, processResignation);
staffRouter.route("/resignations").get(authMiddleware, adminAuth, getPendingResignations);

staffRouter.route("/add").post(
  authMiddleware,
  adminAuth,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "front_image", maxCount: 1 },
    { name: "back_image", maxCount: 1 },
  ]),
  addStaff
);

staffRouter.route("/edit/:id").put(
  authMiddleware,
  adminAuth,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "front_image", maxCount: 1 },
    { name: "back_image", maxCount: 1 },
  ]),
  updateStaff
);

staffRouter.route("/delete/:id").delete(authMiddleware, adminAuth, deleteStaff);

staffRouter.get("/face-data", authMiddleware, getAllFaceEncodings);

module.exports = staffRouter;
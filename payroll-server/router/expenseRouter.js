const express = require("express");
const {
  createExpense,
  getStaffExpenses,
  getStaffExpensesByAdmin,
  getAllExpenses,
  updateExpenseStatus,
} = require("../controllers/expenseController");
const authMiddleware = require("../middlewares/auth-middlewares");
const upload = require("../middlewares/upload");

const router = express.Router();

// All expense routes require authentication
router.use(authMiddleware);

// POST new expense claim (supports receipt image upload)
router.post(
  "/requests",
  upload.fields([{ name: "receipt", maxCount: 1 }]),
  createExpense
);

// GET all expense claims for the company (for Admin)
router.get("/requests", getAllExpenses);

// GET expense claims for logged-in staff (for ESS portal)
router.get("/staff", getStaffExpenses);

// GET expense claims for specific staff (for Admin viewing StaffProfile)
router.get("/staff/:id", getStaffExpensesByAdmin);

// PUT update expense claim status (for Admin approving/rejecting)
router.put("/:id/status", updateExpenseStatus);

module.exports = router;

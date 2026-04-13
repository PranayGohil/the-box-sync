const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  generatePayroll,
  getMonthlyPayrollSummary,
  getPayrollByStaff,
  updatePayroll,
  markAsPaid,
  markAsUnpaid,
  deletePayroll,
  previewPayroll,
} = require("../controllers/staffPayrollController");

const staffPayrollRouter = express.Router();

// Preview calculated payroll without saving
// GET /payroll/preview?month=&year=&working_days_in_month=&staff_id=
staffPayrollRouter.get("/preview", authMiddleware, previewPayroll);

// Monthly summary for all staff — ManagePayroll page
// GET /payroll/summary/:month/:year
staffPayrollRouter.get("/summary/:month/:year", authMiddleware, getMonthlyPayrollSummary);

// Full payroll history for one staff — ViewStaffPayroll page
// GET /payroll/get/:staffId
staffPayrollRouter.get("/get/:staffId", authMiddleware, getPayrollByStaff);

// Generate (create or update) payroll for one or all staff
// POST /payroll/generate
staffPayrollRouter.post("/generate", authMiddleware, generatePayroll);

// Update a single payroll record (bonus, deductions, overtime etc.)
// PUT /payroll/update/:id
staffPayrollRouter.put("/update/:id", authMiddleware, updatePayroll);

// Mark one or multiple records as paid
// PUT /payroll/mark-paid  body: { ids: [...] }
staffPayrollRouter.put("/mark-paid", authMiddleware, markAsPaid);

// Mark one or multiple records as unpaid
// PUT /payroll/mark-unpaid  body: { ids: [...] }
staffPayrollRouter.put("/mark-unpaid", authMiddleware, markAsUnpaid);

// Delete a single payroll record
// DELETE /payroll/delete/:id
staffPayrollRouter.delete("/delete/:id", authMiddleware, deletePayroll);

module.exports = staffPayrollRouter;
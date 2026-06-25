const Expense = require("../models/expenseModel");
const Staff = require("../models/staffModel");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Helper to convert and compress image to webp
const convertToWebp = async (file) => {
  if (!file) return null;
  
  const originalPath = file.path;
  const ext = path.extname(originalPath);
  const directory = path.dirname(originalPath);
  const baseName = path.basename(originalPath, ext);
  
  const newFilename = `${baseName}.webp`;
  const destinationPath = path.join(directory, newFilename);
  
  try {
    await sharp(originalPath)
      .resize({
        width: 1200,
        height: 1200,
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(destinationPath);
      
    // Delete the original file
    fs.unlink(originalPath, (err) => {
      if (err) console.error(`Error deleting original file: ${originalPath}`, err);
    });
    
    return newFilename;
  } catch (error) {
    console.error("Error converting image to webp:", error);
    return path.basename(originalPath); // Fallback to original
  }
};

// @desc    Create a new expense claim
// @route   POST /api/expenses/requests
// @access  Private (Staff)
exports.createExpense = async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;
    let receiptPath = null;

    if (req.files && req.files.receipt && req.files.receipt[0]) {
      const webpFilename = await convertToWebp(req.files.receipt[0]);
      receiptPath = `/expenses/${webpFilename}`;
    }

    const userId = req.user.user_id || req.user._id;

    const newExpense = new Expense({
      staff_id: req.user.staff_id,
      user_id: userId,
      category,
      amount: Number(amount),
      date,
      description,
      receipt: receiptPath,
      status: "pending",
    });

    await newExpense.save();

    res.status(201).json({ success: true, data: newExpense, message: "Expense claim submitted successfully." });
  } catch (error) {
    console.error("Error creating expense (FULL):", error);
    res.status(500).json({ success: false, error: "Server error while creating expense claim." });
  }
};

// @desc    Get all expenses for the company/admin
// @route   GET /api/expenses/requests
// @access  Private (Admin)
exports.getAllExpenses = async (req, res) => {
  try {
    console.log("getAllExpenses called!");
    console.log("req.user: ", req.user);
    const userId = req.user._id || req.user; // Handle fallback 'default_payroll_user'
    console.log("userId to search: ", userId);
    
    const expenses = await Expense.find({ user_id: userId }).populate("staff_id", "f_name l_name email position photo").sort({ createdAt: -1 });
    console.log(`Found ${expenses.length} expenses for admin`);
    
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    console.error("Error fetching all expenses:", error);
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' - ' + error.stack + '\n');
    res.status(500).json({ success: false, error: "Server error while fetching expenses." });
  }
};

// @desc    Get expenses for the logged in staff
// @route   GET /api/expenses/staff
// @access  Private (Staff)
exports.getStaffExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ staff_id: req.user.staff_id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    console.error("Error fetching staff expenses:", error);
    res.status(500).json({ success: false, error: "Server error while fetching staff expenses." });
  }
};

// @desc    Get expenses for a specific staff member (Admin viewing staff profile)
// @route   GET /api/expenses/staff/:id
// @access  Private (Admin)
exports.getStaffExpensesByAdmin = async (req, res) => {
  try {
    const expenses = await Expense.find({ staff_id: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    console.error("Error fetching staff expenses for admin:", error);
    res.status(500).json({ success: false, error: "Server error while fetching staff expenses." });
  }
};

// @desc    Update expense status
// @route   PUT /api/expenses/:id/status
// @access  Private (Admin)
exports.updateExpenseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("staff_id", "f_name l_name email position photo");

    if (!expense) {
      return res.status(404).json({ success: false, error: "Expense claim not found." });
    }

    res.status(200).json({ success: true, data: expense, message: `Expense claim marked as ${status}.` });
  } catch (error) {
    console.error("Error updating expense status:", error);
    res.status(500).json({ success: false, error: "Server error while updating expense status." });
  }
};

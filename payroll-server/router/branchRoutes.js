const express = require("express");
const branchRouter = express.Router();
const {
  createBranch,
  getBranches,
  deleteBranch,
  assignStaff
} = require("../controllers/branchController");
const authMiddleware = require("../middlewares/auth-middlewares");
const adminAuth = require("../middlewares/adminAuth");

// Route to create a new branch
branchRouter.route("/create").post(authMiddleware, adminAuth, createBranch);

// Route to get all branches for the logged-in user
branchRouter.route("/all").get(authMiddleware, adminAuth, getBranches);

// Route to delete a branch
branchRouter.route("/delete/:id").delete(authMiddleware, adminAuth, deleteBranch);

// Route to assign staff to a branch
branchRouter.route("/assign").post(authMiddleware, adminAuth, assignStaff);

module.exports = branchRouter;

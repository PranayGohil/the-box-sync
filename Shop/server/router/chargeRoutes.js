const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  updateCharges,
  addContainerCharge,
  getContainerCharges,
  updateContainerCharge,
  deleteContainerCharge,
} = require("../controllers/chargeController");
const adminAuth = require("../middlewares/adminAuth");

const chargeRouter = express.Router();

chargeRouter
  .route("/updatecharges")
  .put(authMiddleware, adminAuth, updateCharges);
chargeRouter
  .route("/add-container-charge")
  .post(authMiddleware, adminAuth, addContainerCharge);
chargeRouter
  .route("/get-container-charges")
  .get(authMiddleware, getContainerCharges);
chargeRouter
  .route("/update-container-charge")
  .put(authMiddleware, adminAuth, updateContainerCharge);
chargeRouter
  .route("/delete-container-charge")
  .delete(authMiddleware, adminAuth, deleteContainerCharge);

module.exports = chargeRouter;

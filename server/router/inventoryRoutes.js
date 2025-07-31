const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getInventoryData,
  getInventoryDataByStatus,
  getInventoryDataById,
  addInventory,
  updateInventory,
  deleteInventory,
  completeInventoryRequest,
  rejectInventoryRequest,
} = require("../controllers/inventoryController");
const adminAuth = require("../middlewares/adminAuth");
const upload = require("../middlewares/upload");

const inventoryRouter = express.Router();

inventoryRouter
  .route("/get-all")
  .get(authMiddleware, getInventoryData);
inventoryRouter
  .route("/get-by-status/:status")
  .get(authMiddleware, getInventoryDataByStatus);
inventoryRouter
  .route("/get/:id")
  .get(authMiddleware, getInventoryDataById);
inventoryRouter.route("/add").post(authMiddleware, upload.array("bill_files"), addInventory);
inventoryRouter
  .route("/delete/:id")
  .delete(authMiddleware, deleteInventory);
inventoryRouter
  .route("/update/:id")
  .put(authMiddleware, upload.array("bill_files"), updateInventory);
inventoryRouter
  .route("/complete-request")
  .post(authMiddleware, adminAuth, upload.array("bill_files"), completeInventoryRequest);
inventoryRouter
  .route("/reject-request/:id")
  .post(authMiddleware, adminAuth, rejectInventoryRequest);

module.exports = inventoryRouter;

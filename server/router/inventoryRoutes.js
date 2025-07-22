const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getInventoryData,
  getInventoryDataById,
  addInventory,
  updateInventory,
  deleteInventory,
  completeInventoryRequest,
  rejectInventoryRequest,
} = require("../controllers/inventoryController");
const adminAuth = require("../middlewares/adminAuth");

const inventoryRouter = express.Router();

inventoryRouter
  .route("/getinventorydata")
  .get(authMiddleware, getInventoryData);
inventoryRouter
  .route("/getinventorydata/:id")
  .get(authMiddleware, getInventoryDataById);
inventoryRouter.route("/addinventory").post(authMiddleware, addInventory);
inventoryRouter
  .route("/deleteinventory/:id")
  .delete(authMiddleware, deleteInventory);
inventoryRouter
  .route("/updateinventory/:id")
  .put(authMiddleware, updateInventory);
inventoryRouter
  .route("/completeinventoryrequest")
  .post(authMiddleware, adminAuth, completeInventoryRequest);
inventoryRouter
  .route("/rejectinventoryrequest/:id")
  .post(authMiddleware, adminAuth, rejectInventoryRequest);

module.exports = inventoryRouter;

const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getTableData,
  getTableDataById,
  getDiningAreas,
  checkTable,
  addTable,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");
const adminAuth = require("../middlewares/adminAuth");

const tableRouter = express.Router();

tableRouter.route("/get/dining-areas").get(authMiddleware, getDiningAreas);
tableRouter.route("/checktable").get(authMiddleware, checkTable);
tableRouter.route("/addtable").post(authMiddleware, adminAuth, addTable);
tableRouter.route("/get-user-tables").get(authMiddleware, getTableData);
tableRouter.route("/gettabledata/:id").get(authMiddleware, getTableDataById);
tableRouter.route("/update").put(authMiddleware, updateTable);
tableRouter
  .route("/delete/:id")
  .delete(authMiddleware, adminAuth, deleteTable);

module.exports = tableRouter;

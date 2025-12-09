const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getTables,
  getTableDataById,
  getDiningAreas,
  checkTable,
  addTable,
  updateTableArea,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");

const tableRouter = express.Router();

tableRouter.route("/get/dining-areas").get(authMiddleware, getDiningAreas);
tableRouter.route("/check-table").get(authMiddleware, checkTable);
tableRouter.route("/add").post(authMiddleware, addTable);
tableRouter.route("/get-all").get(authMiddleware, getTables);
tableRouter.route("/get/:id").get(authMiddleware, getTableDataById);
tableRouter.route("/update/area/:id").put(authMiddleware, updateTableArea);
tableRouter.route("/update/:id").put(authMiddleware, updateTable);
tableRouter
  .route("/delete/:id")
  .delete(authMiddleware, deleteTable);

module.exports = tableRouter;

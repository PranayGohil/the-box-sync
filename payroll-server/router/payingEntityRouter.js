const express = require("express");
const payingEntityRouter = express.Router();
const {
  createEntity,
  getEntities,
  updateEntity,
  deleteEntity,
} = require("../controllers/payingEntityController");
const authMiddleware = require("../middlewares/auth-middlewares");
const adminAuth = require("../middlewares/adminAuth");

payingEntityRouter.route("/create").post(authMiddleware, adminAuth, createEntity);
payingEntityRouter.route("/all").get(authMiddleware, adminAuth, getEntities);
payingEntityRouter.route("/update/:id").put(authMiddleware, adminAuth, updateEntity);
payingEntityRouter.route("/delete/:id").delete(authMiddleware, adminAuth, deleteEntity);

module.exports = payingEntityRouter;

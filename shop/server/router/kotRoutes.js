const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  showKOTs,
  updateDishStatus,
  updateAllDishStatus,
  showKOTDisplay,
} = require("../controllers/kotController");

const kotRouter = express.Router();

// /api/kot/show?order_source=Manager,Captain
kotRouter.route("/show").get(authMiddleware, showKOTs);
kotRouter.route("/display/show").get(authMiddleware, showKOTDisplay);
kotRouter.route("/item/update-status").put(authMiddleware, updateDishStatus);
kotRouter
  .route("/item/update-all-status")
  .put(authMiddleware, updateAllDishStatus);

module.exports = kotRouter;

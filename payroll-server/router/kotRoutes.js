const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  showKOTs,
  updateDishStatus,
  updateAllDishStatus,
} = require("../controllers/kotController");

const kotRouter = express.Router();

// /api/kot/show?order_source=Manager,Captain
kotRouter.route("/show").get(authMiddleware, showKOTs);
kotRouter.route("/dish/update-status").put(authMiddleware, updateDishStatus);
kotRouter
  .route("/dish/update-all-status")
  .put(authMiddleware, updateAllDishStatus);

module.exports = kotRouter;

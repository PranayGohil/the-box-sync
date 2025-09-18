const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  showKOTs,
  updateDishStatus,
  updateAllDishStatus,
  kotLogin,
} = require("../controllers/kotController");

const kotRouter = express.Router();

kotRouter.route("/showkots").get(authMiddleware, showKOTs);
kotRouter.route("/updatedishstatus").put(authMiddleware, updateDishStatus);
kotRouter
  .route("/updatealldishstatus")
  .put(authMiddleware, updateAllDishStatus);

kotRouter.route("/login").post(kotLogin);

module.exports = kotRouter;

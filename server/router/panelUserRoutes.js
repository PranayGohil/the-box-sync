const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getPanelUser,
  createOrUpdatePanelUser,
  deletePanelUser,
  changePanelPassword,
  panelLogin,
} = require("../controllers/panelUserController");
const PanelRouter = express.Router();

// All endpoints require authentication
PanelRouter.get("/:planName", authMiddleware, getPanelUser);
PanelRouter.post("/:planName", authMiddleware, createOrUpdatePanelUser);
PanelRouter.delete("/:planName", authMiddleware, deletePanelUser);
PanelRouter.post(
  "/change-password/:planName",
  authMiddleware,
  changePanelPassword
);
PanelRouter.post("/login/:planName", panelLogin);

module.exports = PanelRouter;

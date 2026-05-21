const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getPanelUser,
  createOrUpdatePanelUser,
  deletePanelUser,
  changePanelPassword,
  panelLogin,
} = require("../controllers/panelUserController");
const validate = require("../middlewares/validate");
const {
  panelLoginSchema,
  createPanelUserSchema,
  changePanelPasswordSchema,
} = require("../schemas/panelUserSchemas");

const PanelRouter = express.Router();

// All endpoints require authentication
PanelRouter.get("/:planName", authMiddleware, getPanelUser);
PanelRouter.post("/:planName", authMiddleware, validate(createPanelUserSchema), createOrUpdatePanelUser);
PanelRouter.delete("/:planName", authMiddleware, deletePanelUser);
PanelRouter.post(
  "/change-password/:planName",
  authMiddleware,
  validate(changePanelPasswordSchema),
  changePanelPassword
);
PanelRouter.post("/login/:planName", validate(panelLoginSchema), panelLogin);

module.exports = PanelRouter;


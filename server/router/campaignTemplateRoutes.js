const express = require("express");
const {
  saveTemplate,
  getTemplates,
  deleteTemplate,
} = require("../controllers/campaignTemplateController");
const authMiddleware = require("../middlewares/auth-middlewares");

const campaignTemplateRouter = express.Router();

campaignTemplateRouter.post("/add", authMiddleware, saveTemplate);
campaignTemplateRouter.get("/list", authMiddleware, getTemplates);
campaignTemplateRouter.delete("/delete/:id", authMiddleware, deleteTemplate);

module.exports = campaignTemplateRouter;

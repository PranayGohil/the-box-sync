const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");

const {
  getWebsiteSettings,
  updateWebsiteSettings,
  getAllDishes,
  getWebsiteSettingsByCode,
  getFeaturedDishesByCode,
} = require("../controllers/websiteController");

const websiteRouter = express.Router();

websiteRouter.get("/settings", authMiddleware, getWebsiteSettings);
websiteRouter.post("/settings", authMiddleware, updateWebsiteSettings);
websiteRouter.get("/dishes", authMiddleware, getAllDishes);

websiteRouter.get("/settings/:code", getWebsiteSettingsByCode);
websiteRouter.get("/featured-dishes/:code", getFeaturedDishesByCode);



module.exports = websiteRouter;

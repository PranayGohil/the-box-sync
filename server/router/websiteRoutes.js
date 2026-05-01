const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");

const {
  getWebsiteSettings,
  updateWebsiteSettings,
  getAllDishes,
  getWebsiteSettingsByCode,
  getFeaturedDishesByCode,
  createPublicReservation,
  getPublicMenuByCode,
} = require("../controllers/websiteController");

const websiteRouter = express.Router();

websiteRouter.get("/settings", authMiddleware, getWebsiteSettings);
websiteRouter.post("/settings", authMiddleware, updateWebsiteSettings);
websiteRouter.get("/dishes", authMiddleware, getAllDishes);

websiteRouter.get("/settings/:code", getWebsiteSettingsByCode);
websiteRouter.get("/featured-dishes/:code", getFeaturedDishesByCode);
websiteRouter.get("/menu/:code", getPublicMenuByCode);
websiteRouter.post("/reservation/:code", createPublicReservation);



module.exports = websiteRouter;

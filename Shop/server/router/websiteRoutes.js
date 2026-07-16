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
  submitPublicContactForm,
} = require("../controllers/websiteController");

const websiteRouter = express.Router();

websiteRouter.get("/settings", authMiddleware, getWebsiteSettings);
websiteRouter.post("/settings", authMiddleware, updateWebsiteSettings);
websiteRouter.get("/items", authMiddleware, getAllDishes);

websiteRouter.get("/settings/:code", getWebsiteSettingsByCode);
websiteRouter.get("/featured-items/:code", getFeaturedDishesByCode);
websiteRouter.get("/catalog/:code", getPublicMenuByCode);
websiteRouter.post("/reservation/:code", createPublicReservation);
websiteRouter.post("/contact/:code", submitPublicContactForm);



module.exports = websiteRouter;

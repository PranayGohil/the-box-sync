const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addMenu,
  getMenuData,
  getMenuCategories,
  getMenuDataById,
  updateMenu,
  deleteMenu,
  setSpecialMenu,
  removeSpecialMenu,
  updateDishAvailability,
} = require("../controllers/menuController");

const menuRouter = express.Router();

menuRouter.route("/addmenu").post(authMiddleware, addMenu);
menuRouter.route("/getmenudata").get(authMiddleware, getMenuData);
menuRouter.route("/getmenu/:id").get(authMiddleware, getMenuData);
menuRouter.route("/getmenudata/:id").get(getMenuDataById);
menuRouter.route("/getmenucategories").get(authMiddleware, getMenuCategories);
menuRouter.route("/updatemenu/:id").put(authMiddleware, updateMenu);
menuRouter
  .route("/deletemenu/:id")
  .delete(authMiddleware, deleteMenu);
menuRouter.route("/setspecialdish/:id").put(authMiddleware, setSpecialMenu);
menuRouter
  .route("/removespecialdish/:id")
  .put(authMiddleware, removeSpecialMenu);
menuRouter
  .route("/updateDishAvailability/:id")
  .put(authMiddleware, updateDishAvailability);

module.exports = menuRouter;

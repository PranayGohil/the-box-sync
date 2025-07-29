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
const upload = require("../middlewares/upload");

const menuRouter = express.Router();

menuRouter
  .route("/add")
  .post(
    authMiddleware,
    upload.fields([{ name: "dish_img", maxCount: 10 }]),
    addMenu
  );
menuRouter.route("/get").get(authMiddleware, getMenuData);
menuRouter.route("/getmenu/:id").get(authMiddleware, getMenuData);
menuRouter.route("/getmenudata/:id").get(getMenuDataById);
menuRouter.route("/getmenucategories").get(authMiddleware, getMenuCategories);
menuRouter
  .route("/update")
  .put(authMiddleware, upload.single("dish_img"), updateMenu);
menuRouter.route("/delete/:id").delete(authMiddleware, deleteMenu);
menuRouter.route("/setspecialdish/:id").put(authMiddleware, setSpecialMenu);
menuRouter
  .route("/removespecialdish/:id")
  .put(authMiddleware, removeSpecialMenu);
menuRouter
  .route("/updateDishAvailability/:id")
  .put(authMiddleware, updateDishAvailability);

module.exports = menuRouter;

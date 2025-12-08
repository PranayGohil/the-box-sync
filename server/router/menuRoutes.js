const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addMenu,
  getMenuData,
  getMenuCategories,
  getMenuDataById,
  getMenuDataByResCode,
  updateMenu,
  deleteMenu,
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
menuRouter.route("/get/:id").get(authMiddleware, getMenuData);
menuRouter.route("/getmenudata/:id").get(getMenuDataById);
menuRouter.route("/get/rescode/:res_code").get(getMenuDataByResCode);
menuRouter.route("/get-categories").get(authMiddleware, getMenuCategories);
menuRouter
  .route("/update")
  .put(authMiddleware, upload.single("dish_img"), updateMenu);
menuRouter.route("/delete/:id").delete(authMiddleware, deleteMenu);

module.exports = menuRouter;

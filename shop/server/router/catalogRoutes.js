const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addCatalog,
  getCatalogData,
  getCatalogCategories,
  getItemsByCategory,
  getCatalogCounterOptions,
  getCatalogDataById,
  getCatalogDataByResCode,
  getCatalogDataByToken,
  updateCatalogCategoryAndType,
  updateCatalog,
  deleteCatalog,
  getStockSalesStatement,
} = require("../controllers/catalogController");
const upload = require("../middlewares/upload");

const catalogRouter = express.Router();

catalogRouter
  .route("/add")
  .post(
    authMiddleware,
    upload.fields([{ name: "item_img", maxCount: 10 }]),
    addCatalog
  );
catalogRouter.route("/get").get(authMiddleware, getCatalogData);
catalogRouter.route("/stock-sales-statement").get(authMiddleware, getStockSalesStatement);
catalogRouter.route("/get/:id").get(authMiddleware, getCatalogDataById);
catalogRouter.route("/get/rescode/:res_code").get(getCatalogDataByResCode);
catalogRouter.route("/get/token/:token").get(getCatalogDataByToken);
catalogRouter.route("/get-categories").get(authMiddleware, getCatalogCategories);
catalogRouter.route("/get-counter-options").get(authMiddleware, getCatalogCounterOptions);
catalogRouter.route("/get-items-by-category").get(authMiddleware, getItemsByCategory);

catalogRouter
  .route("/update/category/:id")
  .put(authMiddleware, updateCatalogCategoryAndType);
catalogRouter
  .route("/update")
  .put(authMiddleware, upload.single("item_img"), updateCatalog);
catalogRouter.route("/delete/:id").delete(authMiddleware, deleteCatalog);

module.exports = catalogRouter;
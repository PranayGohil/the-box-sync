const express = require("express");
const adminRouter = express.Router();

const authController = require("../controllers/auth-controller");
const authMiddleware = require("../middlewares/auth-middlewares");
const adminAuth = require("../middlewares/adminAuth");

// Define your admin-specific routes here
// adminRouter.route("/dashboard").get(authMiddleware, authController.getDashboard);
// adminRouter.route("/usermanagement").get(authMiddleware, authController.getUserManagement);

adminRouter.route("/emailcheck").post(authController.emailCheck);

adminRouter.route("/register").post(authController.register);

adminRouter.route("/login").post(authController.login);

adminRouter.route("/logout").get(authController.logout);

adminRouter.route("/userdata").get(authMiddleware, authController.getUserData);

adminRouter.route("/addmenu").post(authMiddleware, authController.addMenu);
adminRouter
  .route("/getmenudata")
  .get(authMiddleware, authController.getMenuData);
adminRouter.route("/getmenudata/:id").get(authController.getMenuDataById);
adminRouter
  .route("/updatemenu/:id")
  .put(authMiddleware, authController.updateMenu);
adminRouter
  .route("/deltemenu/:id")
  .delete(authMiddleware, authController.deleteMenu);

adminRouter
  .route("/addinventory")
  .post(authMiddleware, authController.addInvetory);

adminRouter.route("/addstaff").post(authMiddleware, adminAuth, authController.addStaff);

adminRouter.route("/addtable").post(authMiddleware, adminAuth, authController.addTable);
adminRouter
  .route("/gettabledata")
  .get(authMiddleware, authController.getTableData);
adminRouter
  .route("/gettabledata/:id")
  .get(authMiddleware, authController.getTableDataById);
adminRouter
  .route("/updatetable")
  .put(authMiddleware, authController.updateTable);

adminRouter
  .route("/deletetable")
  .delete(authMiddleware, authController.deleteTable);

adminRouter.route("/addorder").post(authMiddleware, authController.addOrder);
adminRouter
  .route("/updateorder")
  .put(authMiddleware, authController.updateOrder);

adminRouter
  .route("/getorderdata/:id")
  .get(authMiddleware, authController.getOrderData);
adminRouter
  .route("/ordercontroller")
  .post(authMiddleware, authController.orderController);

adminRouter
  .route("/addcustomer")
  .post(authMiddleware, authController.addCustomer);
adminRouter
  .route("/getcustomerdata/:id")
  .get(authMiddleware, authController.getCustomerData);

adminRouter.route("/showkots").get(authMiddleware, authController.showKOTs);

module.exports = adminRouter;

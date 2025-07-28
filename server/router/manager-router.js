const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth-controller");
const authMiddleware = require("../middlewares/auth-middlewares");

// // Define your manager-specific routes here
// router.route("/dashboard").get(authMiddleware, authController.getDashboard);
// router.route("/inventory").get(authMiddleware, authController.getInventory);

router.route("/emailcheck").post(authController.emailCheck);

router.route("/register").post(authController.register);

router.route("/login").post(authController.managerLogin); 

router.route("/logout").get(authController.logout);

router.route("/userdata").get(authMiddleware, authController.getUserData);

router.route("/addmenu").post(authMiddleware, authController.addMenu);
router.route("/getmenudata").get(authMiddleware, authController.getMenuData);
router.route("/getmenudata/:id").get( authController.getMenuDataById);
router.route("/updatemenu/:id").put(authMiddleware, authController.updateMenu);
router.route("/deltemenu/:id").delete(authMiddleware, authController.deleteMenu);

router.route("/addinventory").post(authMiddleware, authController.addInvetory);

router.route("/addstaff").post(authMiddleware, authController.addStaff);

router.route("/addtable").post(authMiddleware, authController.addTable);
router.route("/gettabledata").get(authMiddleware, authController.getTableData);
router.route("/gettabledata/:id").get(authMiddleware, authController.getTableDataById);
router.route("/updatetable").put(authMiddleware, authController.updateTable);

router.route("/deletetable").delete(authMiddleware, authController.deleteTable);

router.route("/addorder").post(authMiddleware, authController.addOrder);
router.route("/updateorder").put(authMiddleware, authController.updateOrder);

router.route("/getorderdata/:id").get(authMiddleware, authController.getOrderData);
router.route("/ordercontroller").post(authMiddleware, authController.orderController);

router.route("/addcustomer").post(authMiddleware, authController.addCustomer);
router.route("/getcustomerdata/:id").get(authMiddleware, authController.getCustomerData);

router.route("/showkots").get(authMiddleware, authController.showKOTs);

module.exports = router;

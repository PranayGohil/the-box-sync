const express = require("express");
const {
    registerCustomer,
    loginCustomer,
    getCustomer,
    updateCustomer,
    addAddress,
    editAddress,
    deleteAddress,
    addToCart,
    getCart,
    removeFromCart,
    updateCart,
} = require("../controllers/webCustomerController");

const webCustomerRouter = express.Router();

webCustomerRouter.post("/register", registerCustomer);
webCustomerRouter.post("/login", loginCustomer);

webCustomerRouter.get("/get/:id", getCustomer);
webCustomerRouter.put("/update/:id", updateCustomer);

webCustomerRouter.post("/add-address/:id", addAddress);
webCustomerRouter.put("/edit-address/:id", editAddress);
webCustomerRouter.delete("/delete-address/:id", deleteAddress);

webCustomerRouter.put("/add-to-cart/:id", addToCart);
webCustomerRouter.get("/get-cart/:id", getCart);
webCustomerRouter.put("/remove-from-cart/:id", removeFromCart);
webCustomerRouter.put("/update-cart/:id", updateCart);

module.exports = webCustomerRouter;
const express = require("express");
const {
    registerCustomer,
    loginCustomer,
} = require("../controllers/webCustomerController");

const webCustomerRouter = express.Router();
;
webCustomerRouter.post("/register", registerCustomer);
webCustomerRouter.post("/login", loginCustomer);

module.exports = webCustomerRouter;
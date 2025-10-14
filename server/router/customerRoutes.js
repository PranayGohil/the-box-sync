 const express = require("express");
 const { getAllCustomers } = require("../controllers/customerController");
 const customerRouter = express.Router();
 
 customerRouter.get("/get-all", getAllCustomers);
 
 module.exports = customerRouter;
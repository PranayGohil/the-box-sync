const express = require("express");
const {
    addCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerBookings,
} = require("../controllers/customerController");
const authMiddleware = require("../middlewares/auth-middlewares");

const customerRouter = express.Router();

customerRouter.post("/add", authMiddleware, addCustomer);
customerRouter.get("/get-all", authMiddleware, getAllCustomers);
customerRouter.get("/get/:id", authMiddleware, getCustomerById);
customerRouter.put("/update/:id", authMiddleware, updateCustomer);
customerRouter.delete("/delete/:id", authMiddleware, deleteCustomer);
customerRouter.get("/get-bookings/:id", authMiddleware, getCustomerBookings);

module.exports = customerRouter;
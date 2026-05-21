const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
    addWaiter,
    getWaiters,
    editWaiter,
    deleteWaiter
} = require("../controllers/waiterController");

const waiterRouter = express.Router();

waiterRouter.route("/add").post(authMiddleware, addWaiter);
waiterRouter.route("/get").get(authMiddleware, getWaiters);
waiterRouter.route("/edit/:id").put(authMiddleware, editWaiter);
waiterRouter.route("/delete/:id").delete(authMiddleware, deleteWaiter);

module.exports = waiterRouter;
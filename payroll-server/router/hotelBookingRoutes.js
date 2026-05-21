const express = require("express");
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  updateBookingStatus,
  getBookingStats,
  getAvailableRooms,
  deleteBooking,
} = require("../controllers/hotelBookingController");
const authMiddleware = require("../middlewares/auth-middlewares");

const hotelBookingRouter = express.Router();

hotelBookingRouter.post("/create", authMiddleware, createBooking);
hotelBookingRouter.get("/get-all", authMiddleware, getAllBookings);
hotelBookingRouter.get("/get/:id", authMiddleware, getBookingById);
hotelBookingRouter.put("/update/:id", authMiddleware, updateBooking);
hotelBookingRouter.delete("/cancel/:id", authMiddleware, cancelBooking);
hotelBookingRouter.put("/update-status/:id", authMiddleware, updateBookingStatus);
hotelBookingRouter.get("/stats", authMiddleware, getBookingStats);
hotelBookingRouter.get("/available-rooms", authMiddleware, getAvailableRooms);
hotelBookingRouter.delete("/delete/:id", authMiddleware, deleteBooking);

module.exports = hotelBookingRouter;

const express = require("express");
const hotelBookingRouter = express.Router();
const {
  createBooking,
  getAllBookings,
  updateBookingStatus,
} = require("../controllers/hotelBookingController");

hotelBookingRouter.post("/create", createBooking);
hotelBookingRouter.get("/get-all", getAllBookings);
hotelBookingRouter.put("/status", updateBookingStatus);

module.exports = hotelBookingRouter;

const User = require("../models/userModel");
const Booking = require("../models/hotelBookingModel");
const Room = require("../models/roomModel");
const RoomCategory = require("../models/roomCategoryModel");
const Customer = require("../models/customerModel");

exports.createBooking = async (req, res) => {
    try {
        const {
            user_id,
            customer_id,
            category_id,
            subcategory_name,
            room_id,
            check_in,
            check_out,
            num_guests,
            total_price,
        } = req.body;

        // Check room availability
        const existingBooking = await Booking.findOne({
            room_id,
            status: { $in: ["Booked", "Checked In"] },
            $or: [
                { check_in: { $lte: check_out }, check_out: { $gte: check_in } },
            ],
        });

        if (existingBooking)
            return res.status(400).json({ message: "Room is not available for these dates" });

        const booking = new Booking({
            user_id,
            customer_id,
            category_id,
            subcategory_name,
            room_id,
            check_in,
            check_out,
            num_guests,
            total_price,
        });

        await booking.save();

        // Update room status
        await Room.findByIdAndUpdate(room_id, { room_status: "Booked" });

        res.status(201).json({ message: "Booking created successfully", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("customer_id")
            .populate("room_id")
            .populate("category_id");
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Booking Status (Check In / Check Out)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body;
        const booking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });

        if (status === "Checked Out") {
            await Room.findByIdAndUpdate(booking.room_id, { room_status: "Available" });
        }

        res.json({ message: "Status updated", booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
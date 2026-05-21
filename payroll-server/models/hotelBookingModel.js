const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const hotelBookingSchema = new Schema({
    user_id: { type: String }, // Hotel Manager ID
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customer",
        required: true,
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "room_category",
        required: true,
    },
    subcategory_name: { type: String },
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "room",
        required: true,
    },
    check_in: { type: Date, required: true },
    check_out: { type: Date, required: true },
    num_guests: { type: Number },
    total_price: { type: Number },
    status: {
        type: String,
        enum: ["Booked", "Checked In", "Checked Out", "Cancelled"],
        default: "Booked",
    },
    source : { type: String, default: "Direct" },
    special_request: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const HotelBooking = mongoose.model("hotel_booking", hotelBookingSchema);
module.exports = HotelBooking
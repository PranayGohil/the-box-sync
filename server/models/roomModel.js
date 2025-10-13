const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const addRoom = new Schema({
    user_id: {
        type: String,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "room_category",
    },
    room_name: {
        type: String,
    },
    room_no: {
        type: String,
    },
    room_details: {
        type: String,
    },
    max_person: {
        type: Number,
    },
    room_imgs: [{
        image: {
            type: String
        },
        is_thumbnail: {
            type: Boolean,
            default: false
        }
    }],
    // room_price: {
    //     type: Number,
    // },
    room_status: {
        type: String,
        default: "Available",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const Room = mongoose.model("room", addRoom);
module.exports = Room;

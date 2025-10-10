const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const addRoomCategory = new Schema({
  user_id: {
    type: String,
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
  category: {
    type: String,
  },
  amenities: [
    {
      title: {
        type: String
      },
      amenities: {
        type: [String]
      }
    }
  ],
  subcategory: [
    {
      subcategory_name: {
        type: String,
      },
      max_price: {
        type: Number,
      },
      base_price: {
        type: Number,
      },
      current_price: {
        type: Number,
      },
      description: {
        type: String,
      },
      is_refundable: {
        type: Boolean,
        default: false,
      },
      is_available: {
        type: Boolean,
        default: true,
      },
    },
  ],
});

const RoomCategory = mongoose.model("room_category", addRoomCategory);
module.exports = RoomCategory;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const addMenu = new Schema({
  restaurant_id: {
    type: String,
  },
  category: {
    type: String,
  },
  meal_type: {
    type: String,
  },
  dishes: [
    {
      dish_name: {
        type: String,
      },
      dish_price: {
        type: Number,
      },
      dish_img: {
        type: String,
      },
      description: {
        type: String,
      },
      quantity: {
        type: Number,
      },
      unit: {
        type: String,
      },
      is_special: {
        type: Boolean,
        default: false,
      },
      is_available: {
        type: Boolean,
        default: true,
      },
    },
  ],
  show_on_website: {
    type: Boolean,
    default: false,
  },
});

const Menu = mongoose.model("menu", addMenu);
module.exports = Menu;

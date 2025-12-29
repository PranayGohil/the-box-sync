const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const menu = new Schema({
  user_id: {
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

// One menu document per (user, category, meal_type)
menu.index({ user_id: 1, category: 1, meal_type: 1 }, { unique: true });

// For listing menus by user
menu.index({ user_id: 1 });

// For website menu (if you filter by show_on_website)
menu.index({ user_id: 1, show_on_website: 1 });

// Optional: if you often search by category alone
menu.index({ user_id: 1, category: 1 });

menu.index({ user_id: 1, "dishes.dish_name": 1 });

const Menu = mongoose.model("menu", menu);
module.exports = Menu;

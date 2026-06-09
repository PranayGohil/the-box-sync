const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const menu = new Schema({
  user_id: {
    type: String,
  },
  category: {
    type: String,
  },
  counter: { type: String, default: null },
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
      meal_type: {
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
      has_variants: {
        type: Boolean,
        default: false,
      },
      variants: [
        {
          size_name: { type: String },
          price: { type: Number },
          extra: { type: String },
          is_available: { type: Boolean, default: true },
        },
      ],
      addons: [
        {
          addon_name: { type: String },
          price: { type: Number },
          is_available: { type: Boolean, default: true },
        },
      ],
    },
  ],
  hide_on_kot: {
    type: Boolean,
    default: false,
  },
  show_on_website: {
    type: Boolean,
    default: false,
  },
});

// One menu document per (user, category)
menu.index({ user_id: 1, category: 1 }, { unique: true });

// For listing menus by user
menu.index({ user_id: 1 });

// For website menu (if you filter by show_on_website)
menu.index({ user_id: 1, show_on_website: 1 });

menu.index({ user_id: 1, "dishes.dish_name": 1 });

const Menu = mongoose.model("menu", menu);
module.exports = Menu;

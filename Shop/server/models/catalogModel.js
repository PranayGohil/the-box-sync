const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const catalog = new Schema({
  user_id: {
    type: String,
  },
  category: {
    type: String,
  },
  is_food_category: {
    type: Boolean,
    default: false,
  },
  counter: { type: String, default: null },
  items: [
    {
      item_name: {
        type: String,
      },
      item_price: {
        type: Number,
      },
      item_img: {
        type: String,
      },
      barcode: {
        type: String,
        default: null,
      },
      description: {
        type: String,
      },
      type: {
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
          barcode: { type: String, default: null },
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

// One catalog document per (user, category)
catalog.index({ user_id: 1, category: 1 }, { unique: true });

// For listing menus by user
catalog.index({ user_id: 1 });

// For website catalog (if you filter by show_on_website)
catalog.index({ user_id: 1, show_on_website: 1 });

catalog.index({ user_id: 1, "items.item_name": 1 });

const Catalog = mongoose.model("catalog", catalog);
module.exports = Catalog;

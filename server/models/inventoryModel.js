const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const addinventory = new Schema({
  request_date: {
    type: Date,
    default: Date.now,
  },
  bill_date: {
    type: Date,
  },
  bill_number: {
    type: String,
  },
  vendor_name: {
    type: String,
  },
  category: {
    type: String,
  },
  bill_files: {
    type: [String],
    default: [],
  },
  total_amount: {
    type: Number,
  },
  paid_amount: {
    type: Number,
  },
  unpaid_amount: {
    type: Number,
  },
  items : [
    {
      item_name: {
        type: String,
      },
      unit: {
        type: String,
      },
      item_quantity: {
        type: Number,
      },
      item_price: {
        type: Number,
        default: null
      },
    }
  ],
  status: {
    type: String,
  },
  restaurant_id: {
    type: String,
  },
});

const Inventory = mongoose.model("inventory", addinventory);
module.exports = Inventory;
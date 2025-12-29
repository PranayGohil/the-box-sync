const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const inventory = new Schema({
  request_date: {
    type: Date,
    default: Date.now,
    index: true,
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
  items: [
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
        default: null,
      },
    },
  ],
  status: {
    type: String,
  },
  reject_reason: {
    type: String,
  },
  user_id: {
    type: String,
  },
});

// For all inventory lists by user
inventory.index({ user_id: 1, request_date: -1 });

// For “by status” listings (Pending/Completed/Rejected)
inventory.index({ user_id: 1, status: 1, request_date: -1 });

// Optional: if you often filter by category
inventory.index({ user_id: 1, category: 1, request_date: -1 });

// Optional: if you search by vendor
inventory.index({ user_id: 1, vendor_name: 1, request_date: -1 });

inventory.index({ user_id: 1, "items.item_name": 1 });

const Inventory = mongoose.model("inventory", inventory);
module.exports = Inventory;

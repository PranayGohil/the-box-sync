const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const orderSchema = new Schema({
  table_no: {
    type: String,
  },
  table_area: {
    type: String,
  },
  order_type: {
    type: String, // Take Away, Delivery
  },
  token: {
    type: Number, // Sequential token for Takeaway orders
  },
  order_items: [
    {
      dish_name: {
        type: String,
      },
      quantity: {
        type: Number,
      },
      dish_price: {
        type: Number,
      },
      special_notes: {
        type: String,
      },
      status: {
        type: String, //Preparing, Completed
        default: "Pending",
      },
    },
  ],
  order_status: {
    type: String, 
  },
  customer_id: {
    type: String,
  },
  customer_name: {
    type: String,
  },
  total_persons: {
    type: String,
  },
  comment: {
    type: String,
  },
  waiter: {
    type: String, 
  },
  bill_amount: {
    type: Number,
  },
  sub_total: {
    type: Number,
  },
  cgst_percent: {
    type: Number,
  },
  sgst_percent: {
    type: Number,
  },
  vat_percent: {
    type: Number,
  },
  cgst_amount: {
    type: Number,
  },
  sgst_amount: {
    type: Number,
  },
  vat_amount: {
    type: Number,
  },
  discount_amount: {
    type: Number,
  },
  waveoff_amount: {
    type: Number,
  },
  total_amount: {
    type: Number,
  },
  paid_amount: {
    type: Number,
  },
  payment_type: {
    type: String,
  },
  order_date: {
    type: Date,
    default: Date.now,
  },
  user_id: {
    type: String,
  },
  order_source: {
    type: String, 
    required: true,
    enum: ["Manager", "QSR", "Captain"], 
  },
});

const Order = mongoose.model("order", orderSchema);
module.exports = Order;

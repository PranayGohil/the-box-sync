const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stockUsageLog = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  item_name: {
    type: String,
    required: true,
  },
  quantity_used: {
    type: Number,
    required: true,
  },
  unitType: {
    type: String,
  },
  usage_date: {
    type: Date,
    default: Date.now,
  },
});

stockUsageLog.index({ user_id: 1, usage_date: -1 });

const StockUsageLog = mongoose.model("stockUsageLog", stockUsageLog);
module.exports = StockUsageLog;

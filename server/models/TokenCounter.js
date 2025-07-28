const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenCounterSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  lastToken: {
    type: Number,
    default: 0,
  },
  restaurant_id: {
    type: String,
  },
  source: {
    type: String,
  },
});

const TokenCounter = mongoose.model("TokenCounter", tokenCounterSchema);
module.exports = TokenCounter;

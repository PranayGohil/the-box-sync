// models/OrderCounter.js
const mongoose = require("mongoose");

const orderCounterSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
});

module.exports = mongoose.model("OrderCounter", orderCounterSchema);

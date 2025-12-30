const mongoose = require("mongoose");

const waiterSchema = new mongoose.Schema({
    user_id: { type: String },
    full_name: { type: String },
});

module.exports = mongoose.model("Waiter", waiterSchema);
const mongoose = require("mongoose");

const customerQuerySchema = new mongoose.Schema({
    user_name: {
        type: String,
    },
    user_id: {
        type: String,
    },
    purpose: {
        type: String,
    },
    message: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    completed_at: {
        type: Date,
    },
});

const CustomerQuery = mongoose.model("CustomerQuery", customerQuerySchema);
module.exports = CustomerQuery;
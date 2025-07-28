const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const customerSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
    },
    date_of_birth: {
        type: Date,
    },
    anniversary: {
        type: Date,
    },
    tag: {
        type: Array,
    },
    restaurant_id: {
        type: String,
    },
});
const Customer = mongoose.model("customer", customerSchema);
module.exports = Customer
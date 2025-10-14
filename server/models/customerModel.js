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
    id_proof: {
        type: String
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
    user_id: {
        type: String,
    },
});
const Customer = mongoose.model("customer", customerSchema);
module.exports = Customer
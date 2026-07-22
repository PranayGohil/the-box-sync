const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const billingPartySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Customer', 'Vendor'],
        required: true
    },
    gstin: {
        type: String,
    },
    pan_number: {
        type: String,
    },
    billing_address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
    },
    shipping_address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
    },
    is_tds_applicable: {
        type: Boolean,
        default: false
    },
    user_id: {
        type: String, // Shop user ID who owns this party record
        required: true
    }
}, { timestamps: true });

const BillingParty = mongoose.model("billingParty", billingPartySchema);
module.exports = BillingParty;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const billingProductSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    sku: {
        type: String,
    },
    hsn_sac_code: {
        type: String,
    },
    base_price: {
        type: Number,
        default: 0
    },
    tax_rate: {
        type: Number, // e.g., 5, 12, 18, 28
        default: 0
    },
    category: {
        type: String,
        enum: ['Mobile', 'Computer', 'Grocery', 'Electronics', 'Other'],
        default: 'Other'
    },
    dynamic_attributes: {
        type: Schema.Types.Mixed,
        default: {}
    },
    user_id: {
        type: String, // Shop user ID who owns this product
        required: true
    }
}, { timestamps: true });

const BillingProduct = mongoose.model("billingProduct", billingProductSchema);
module.exports = BillingProduct;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stockSalesLogSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    item_id: {
        type: String,
    },
    item_name: {
        type: String,
        required: true
    },
    variant_name: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        enum: ['Initial', 'Addition', 'Sale', 'Adjustment'],
        required: true
    },
    quantity_changed: {
        type: Number,
        required: true
    },
    balance_stock: {
        type: Number,
        default: 0
    },
    order_id: {
        type: String,
        default: null
    },
    order_type: {
        type: String,
        default: null // e.g. Dine-In, Takeaway, Delivery, Web, Invoice
    },
    remarks: {
        type: String,
        default: ""
    }
}, { timestamps: true });

stockSalesLogSchema.index({ user_id: 1, createdAt: -1 });

const StockSalesLog = mongoose.model("stockSalesLog", stockSalesLogSchema);
module.exports = StockSalesLog;

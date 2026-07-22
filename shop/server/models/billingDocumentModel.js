const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'billingProduct',
        required: true
    },
    product_name: String,
    quantity: {
        type: Number,
        required: true
    },
    rate: {
        type: Number,
        required: true
    },
    taxable_value: {
        type: Number,
        required: true
    },
    cgst_amount: { type: Number, default: 0 },
    sgst_amount: { type: Number, default: 0 },
    igst_amount: { type: Number, default: 0 },
    item_specific_attributes: {
        type: Schema.Types.Mixed, // e.g., specifically which IMEI was sold
        default: {}
    }
});

const billingDocumentSchema = new Schema({
    document_type: {
        type: String,
        enum: ['Quotation', 'Invoice', 'CreditNote', 'DebitNote'],
        required: true
    },
    document_number: {
        type: String,
        required: true
    },
    shop_id: {
        type: String, // Or ObjectId based on the user system
        required: true
    },
    party_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'billingParty',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    due_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Paid', 'Unpaid', 'Cancelled', 'Accepted', 'Rejected'],
        default: 'Draft'
    },
    items: [itemSchema],
    total_taxable_value: {
        type: Number,
        default: 0
    },
    total_tax_amount: {
        type: Number,
        default: 0
    },
    grand_total: {
        type: Number,
        default: 0
    },
    linked_document_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'billingDocument' // Used for Credit/Debit Notes linking back to original Invoice
    },
    tds_amount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const BillingDocument = mongoose.model("billingDocument", billingDocumentSchema);
module.exports = BillingDocument;

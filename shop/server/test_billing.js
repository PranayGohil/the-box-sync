const mongoose = require('mongoose');
const BillingParty = require('./models/billingPartyModel');
const BillingProduct = require('./models/billingProductModel');
const BillingDocument = require('./models/billingDocumentModel');
const { generatePDF } = require('./utils/pdfGenerator');
const fs = require('fs');
require('dotenv').config();

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");
        
        const userId = new mongoose.Types.ObjectId().toString(); // Mock shop owner

        // 1. Create a Party
        const party = new BillingParty({
            name: "Tech Solutions Pvt Ltd",
            type: "Customer",
            gstin: "27AADCB2230M1Z2",
            billing_address: {
                street: "101 Cyber Park",
                city: "Pune",
                state: "Maharashtra",
                pincode: "411014"
            },
            user_id: userId
        });
        await party.save();
        console.log("Party created.");

        // 2. Create a Product
        const product = new BillingProduct({
            name: "Dell XPS 15",
            hsn_sac_code: "84713010",
            base_price: 150000,
            tax_rate: 18,
            category: "Computer",
            user_id: userId
        });
        await product.save();
        console.log("Product created.");

        // 3. Create an Invoice
        const quantity = 2;
        const rate = product.base_price;
        const taxable_value = quantity * rate;
        const cgst = taxable_value * 0.09;
        const sgst = taxable_value * 0.09;

        const invoice = new BillingDocument({
            document_type: "Invoice",
            document_number: "INV-2026-0001",
            shop_id: userId,
            party_id: party._id,
            items: [{
                product_id: product._id,
                product_name: product.name,
                quantity: quantity,
                rate: rate,
                taxable_value: taxable_value,
                cgst_amount: cgst,
                sgst_amount: sgst,
                item_specific_attributes: { "Serial No": "S/N-998877", "Warranty": "3 Years" }
            }],
            total_taxable_value: taxable_value,
            total_tax_amount: cgst + sgst,
            grand_total: taxable_value + cgst + sgst
        });
        await invoice.save();
        console.log("Invoice created.");

        // 4. Generate PDF
        const pdfData = {
            document: invoice.toObject(),
            party: party.toObject(),
            shop: {
                name: "Super Electronics Hub",
                address: "Market Road, Mumbai, Maharashtra 400001",
                gstin: "27ABCDE1234F1Z5",
                email: "sales@superelec.com",
                phone: "+91-9876543210"
            }
        };

        const pdfBuffer = await generatePDF(pdfData, 'invoice_template');
        fs.writeFileSync('test_invoice.pdf', pdfBuffer);
        console.log("PDF successfully generated at test_invoice.pdf!");

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();

const BillingParty = require('../models/billingPartyModel');
const BillingProduct = require('../models/billingProductModel');
const BillingDocument = require('../models/billingDocumentModel');
const ShopUser = require('../models/shopUserModel');
const { generatePDF } = require('../utils/pdfGenerator');

// --- Parties ---
exports.createParty = async (req, res) => {
    try {
        const party = new BillingParty(req.body);
        await party.save();
        res.status(201).json({ success: true, party });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getParties = async (req, res) => {
    try {
        const { user_id } = req.query;
        const query = user_id ? { user_id } : {};
        const parties = await BillingParty.find(query);
        res.status(200).json({ success: true, parties });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Products ---
exports.createProduct = async (req, res) => {
    try {
        const product = new BillingProduct(req.body);
        await product.save();
        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const { user_id } = req.query;
        const query = user_id ? { user_id } : {};
        const products = await BillingProduct.find(query);
        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Documents (Invoices, Quotations) ---
exports.createDocument = async (req, res) => {
    try {
        // Logic to calculate totals can be placed here or on frontend. 
        // For security, backend should verify calculations.
        const docData = req.body;
        
        let totalTaxable = 0;
        let totalTax = 0;
        
        if (docData.items && Array.isArray(docData.items)) {
            docData.items.forEach(item => {
                totalTaxable += item.taxable_value || 0;
                totalTax += (item.cgst_amount || 0) + (item.sgst_amount || 0) + (item.igst_amount || 0);
            });
        }
        
        docData.total_taxable_value = totalTaxable;
        docData.total_tax_amount = totalTax;
        docData.grand_total = totalTaxable + totalTax;

        const document = new BillingDocument(docData);
        await document.save();
        res.status(201).json({ success: true, document });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getDocumentPDF = async (req, res) => {
    try {
        const document = await BillingDocument.findById(req.params.id)
            .populate('party_id')
            .populate('items.product_id');

        if (!document) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        // Fetch Shop info (Mocked or real)
        let shop = null;
        try {
            shop = await ShopUser.findById(document.shop_id);
        } catch (e) {
            // If shop_id is just a string in tests
        }
        
        if (!shop) {
            shop = {
                name: "Default Shop",
                address: "123 Business Road, City",
                gstin: "22AAAAA0000A1Z5",
                email: "contact@shop.com",
                phone: "1234567890"
            };
        }

        const pdfData = {
            document: document.toObject(),
            party: document.party_id ? document.party_id.toObject() : {},
            shop: shop
        };

        const pdfBuffer = await generatePDF(pdfData, 'invoice_template');

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${document.document_type}_${document.document_number}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

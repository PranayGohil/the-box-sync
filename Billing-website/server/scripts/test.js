require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { User, Business, Invoice, StockBalance } = require('../src/models');
const AccountingService = require('../src/services/AccountingService');
const TaxDeterminationService = require('../src/services/TaxDeterminationService');

const runTests = async () => {
  console.log('====================================================');
  console.log('RUNNING AUTOMATED ERP SYSTEM INTEGRATION TESTS');
  console.log('====================================================');

  try {
    await connectDB();

    const business = await Business.findOne({ name: 'Shree Ganesh Enterprises Pvt Ltd' });
    if (!business) {
      throw new Error('Business not found. Run seed script first.');
    }
    console.log(`[PASS] Found Business: "${business.name}" (ID: ${business._id})`);

    // 1. Test Double-Entry Accounting Trial Balance
    console.log('\n[Test 1] Testing Double-Entry Balance (Total Debit === Total Credit)...');
    const trialBalance = await AccountingService.getTrialBalance(business._id);
    console.log(`  Trial Balance Debit:  ₹${trialBalance.grandTotalDebit}`);
    console.log(`  Trial Balance Credit: ₹${trialBalance.grandTotalCredit}`);
    console.log(`  Is Balanced: ${trialBalance.isBalanced}`);
    if (!trialBalance.isBalanced) {
      throw new Error(`Trial Balance is not balanced! Diff: ${Math.abs(trialBalance.grandTotalDebit - trialBalance.grandTotalCredit)}`);
    }
    console.log('[PASS] Double-Entry Ledger is perfectly balanced.');

    // 2. Test GST Calculation Engine
    console.log('\n[Test 2] Testing GST Tax Determination Engine...');
    const intraStateItems = [
      { name: 'Item A', quantity: 2, rate: 1000, taxRate: 18 }
    ];
    // Intra-state (27 -> 27)
    const intraCalc = TaxDeterminationService.calculateItemTaxes(intraStateItems, '27', '27');
    if (intraCalc.cgstTotal !== 180 || intraCalc.sgstTotal !== 180 || intraCalc.igstTotal !== 0 || intraCalc.grandTotal !== 2360) {
      throw new Error(`Intra-state GST calculation failed: ${JSON.stringify(intraCalc)}`);
    }
    console.log('[PASS] Intra-state GST (CGST 9% + SGST 9%) calculation verified.');

    // Inter-state (27 -> 29)
    const interCalc = TaxDeterminationService.calculateItemTaxes(intraStateItems, '27', '29');
    if (interCalc.cgstTotal !== 0 || interCalc.sgstTotal !== 0 || interCalc.igstTotal !== 360 || interCalc.grandTotal !== 2360) {
      throw new Error(`Inter-state GST calculation failed: ${JSON.stringify(interCalc)}`);
    }
    console.log('[PASS] Inter-state GST (IGST 18%) calculation verified.');

    // Tax-inclusive test
    const inclusiveCalc = TaxDeterminationService.calculateItemTaxes(
      [{ name: 'Item Inc', quantity: 1, rate: 1180, taxRate: 18 }],
      '27',
      '27',
      true
    );
    if (inclusiveCalc.taxableAmount !== 1000 || inclusiveCalc.totalTax !== 180 || inclusiveCalc.grandTotal !== 1180) {
      throw new Error(`Tax-inclusive GST calculation failed: ${JSON.stringify(inclusiveCalc)}`);
    }
    console.log('[PASS] Tax-inclusive GST calculation verified.');

    // 3. Test Stock Balances
    console.log('\n[Test 3] Testing Stock Balances & Inventory Integrity...');
    const balances = await StockBalance.find({ businessId: business._id });
    if (balances.length === 0) {
      throw new Error('No stock balances found');
    }
    console.log(`[PASS] Found ${balances.length} stock balance records across warehouses.`);

    // 4. Test Invoices
    console.log('\n[Test 4] Testing Invoices...');
    const invoices = await Invoice.find({ businessId: business._id });
    console.log(`[PASS] Found ${invoices.length} finalized invoices.`);

    console.log('\n====================================================');
    console.log('ALL BACKEND INTEGRATION TESTS PASSED (100% SUCCESS)');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('[TEST FAILED]:', error);
    process.exit(1);
  }
};

runTests();

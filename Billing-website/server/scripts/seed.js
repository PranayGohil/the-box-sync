require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const {
  User,
  Business,
  BusinessMember,
  Branch,
  Warehouse,
  FinancialYear,
  Customer,
  Supplier,
  Product,
  Category,
  Brand,
  Unit,
  HSNMaster,
  TaxRate,
  StockBalance,
  StockMovement,
  Invoice,
  PurchaseBill,
  Payment,
  PaymentAllocation,
  Expense,
  ExpenseCategory,
  TDSSection,
  Quotation,
  SalesOrder
} = require('../src/models');
const { ROLES, DEFAULT_ROLE_PERMISSIONS } = require('../src/config/constants');
const AccountingService = require('../src/services/AccountingService');
const SequenceService = require('../src/services/SequenceService');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Connected to MongoDB. Clearing existing database...');
    await mongoose.connection.dropDatabase();
    console.log('[Seeder] Database cleared.');

    // 1. Create Demo Users
    console.log('[Seeder] Creating Demo Users...');
    const ownerUser = await User.create({
      name: 'Rajesh Sharma',
      email: 'owner@demo.local',
      mobile: '9820098200',
      password: 'Demo@12345'
    });

    const accountantUser = await User.create({
      name: 'Amit Joshi',
      email: 'accountant@demo.local',
      mobile: '9820098201',
      password: 'Demo@12345'
    });

    const billingUser = await User.create({
      name: 'Priya Deshmukh',
      email: 'billing@demo.local',
      mobile: '9820098202',
      password: 'Demo@12345'
    });

    // 2. Create Business Profile
    console.log('[Seeder] Creating Business Profile...');
    const business = await Business.create({
      name: 'Shree Ganesh Enterprises Pvt Ltd',
      legalName: 'Shree Ganesh Enterprises Private Limited',
      gstin: '27AABCU9603R1ZM',
      pan: 'AABCU9603R',
      cin: 'U72900PN2021PTC199000',
      taxType: 'regular',
      businessType: 'Wholesale & Retail Trading',
      address: 'Plot 45, Hadapsar Industrial Estate',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411013',
      email: 'contact@shreeganesh.demo',
      phone: '+91 20 2687 5544',
      website: 'https://shreeganesh.demo',
      bankDetails: {
        bankName: 'HDFC Bank Ltd',
        accountNo: '50200045892147',
        ifsc: 'HDFC0000052',
        branch: 'Hadapsar Branch, Pune',
        accountHolderName: 'Shree Ganesh Enterprises Pvt Ltd'
      },
      upiId: 'shreeganesh@hdfcbank',
      currentFinancialYear: '2026-27',
      settings: {
        dcStockPolicy: 'DEDUCT',
        allowNegativeStock: false,
        defaultTaxRate: 18,
        invoiceTemplate: 'modern',
        termsAndConditions: '1. Goods once sold will not be taken back without original invoice.\n2. Interest @ 18% p.a. will be charged for overdue payments.\n3. Subject to Pune jurisdiction only.'
      },
      createdBy: ownerUser._id
    });

    // 3. Create Financial Year
    await FinancialYear.create({
      businessId: business._id,
      name: '2026-27',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true
    });

    // 4. Create Branches & Warehouses
    const mainBranch = await Branch.create({
      businessId: business._id,
      name: 'Head Office - Pune',
      code: 'HO-PUN',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      isDefault: true
    });

    const warehousePune = await Warehouse.create({
      businessId: business._id,
      branchId: mainBranch._id,
      name: 'Main Central Warehouse',
      code: 'WH-PUN',
      address: 'Hadapsar Warehouse Complex, Gate 2',
      city: 'Pune',
      state: 'Maharashtra',
      managerName: 'Suresh Patil',
      contactNumber: '9820011223',
      isDefault: true
    });

    const warehouseMumbai = await Warehouse.create({
      businessId: business._id,
      name: 'Mumbai Distribution Depot',
      code: 'WH-MUM',
      address: 'Bhiwandi Logistics Hub, Building C',
      city: 'Bhiwandi',
      state: 'Maharashtra',
      managerName: 'Vikas Jadhav',
      contactNumber: '9820044556',
      isDefault: false
    });

    // 5. Create Memberships
    await BusinessMember.create({
      businessId: business._id,
      userId: ownerUser._id,
      role: ROLES.OWNER,
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.OWNER],
      isAllBranches: true,
      isAllWarehouses: true
    });

    await BusinessMember.create({
      businessId: business._id,
      userId: accountantUser._id,
      role: ROLES.ACCOUNTANT,
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.ACCOUNTANT],
      isAllBranches: true,
      isAllWarehouses: true
    });

    await BusinessMember.create({
      businessId: business._id,
      userId: billingUser._id,
      role: ROLES.BILLING_USER,
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.BILLING_USER],
      isAllBranches: true,
      isAllWarehouses: true
    });

    // 6. Seed Chart of Accounts
    console.log('[Seeder] Initializing Double-Entry Chart of Accounts...');
    await AccountingService.seedDefaultChartOfAccounts(business._id);

    // 7. Seed Units, Categories, Brands, TaxRates
    console.log('[Seeder] Creating Master Data (Units, Categories, Brands)...');
    const unitPcs = await Unit.create({ businessId: business._id, name: 'Pieces', symbol: 'PCS', uqc: 'PCS' });
    const unitBox = await Unit.create({ businessId: business._id, name: 'Boxes', symbol: 'BOX', uqc: 'BOX' });
    const unitKg = await Unit.create({ businessId: business._id, name: 'Kilograms', symbol: 'KGS', uqc: 'KGS' });

    const catElectronics = await Category.create({ businessId: business._id, name: 'Electronics & Gadgets' });
    const catFMCG = await Category.create({ businessId: business._id, name: 'FMCG & Groceries' });
    const catStationery = await Category.create({ businessId: business._id, name: 'Office Stationery' });
    const catTools = await Category.create({ businessId: business._id, name: 'Hardware & Tools' });

    const brandSony = await Brand.create({ businessId: business._id, name: 'Sony India' });
    const brandSamsung = await Brand.create({ businessId: business._id, name: 'Samsung' });
    const brandTata = await Brand.create({ businessId: business._id, name: 'Tata Consumer' });
    const brandBosch = await Brand.create({ businessId: business._id, name: 'Bosch Power' });

    await TaxRate.create({ businessId: business._id, name: 'GST 18%', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18, isDefault: true });
    await TaxRate.create({ businessId: business._id, name: 'GST 12%', rate: 12, cgstRate: 6, sgstRate: 6, igstRate: 12 });
    await TaxRate.create({ businessId: business._id, name: 'GST 5%', rate: 5, cgstRate: 2.5, sgstRate: 2.5, igstRate: 5 });
    await TaxRate.create({ businessId: business._id, name: 'GST 28%', rate: 28, cgstRate: 14, sgstRate: 14, igstRate: 28 });

    // 8. Create 20 Customers (B2B & B2C)
    console.log('[Seeder] Creating 20 Demo Customers...');
    const customerList = [
      { name: 'Apex Technologies Pvt Ltd', businessName: 'Apex Tech', gstin: '27AAACA1234A1Z1', phone: '9811122233', email: 'billing@apextech.demo', state: 'Maharashtra', stateCode: '27', type: 'B2B' },
      { name: 'Kavita Supermart', businessName: 'Kavita Supermart', gstin: '27BBBCB5678B1Z2', phone: '9822233344', email: 'kavita@supermart.demo', state: 'Maharashtra', stateCode: '27', type: 'B2B' },
      { name: 'National Electronics Corp', businessName: 'NEC Corp', gstin: '24CCCC1234C1Z5', phone: '9833344455', email: 'nec@gujarat.demo', state: 'Gujarat', stateCode: '24', type: 'B2B' },
      { name: 'Bangalore IT Supplies', businessName: 'BITS Ltd', gstin: '29DDDD9876D1Z8', phone: '9844455566', email: 'sales@bitsblr.demo', state: 'Karnataka', stateCode: '29', type: 'B2B' },
      { name: 'Sunil Verma', phone: '9855566677', email: 'sunil.v@gmail.demo', state: 'Maharashtra', stateCode: '27', type: 'B2C' },
      { name: 'Meera Deshmukh', phone: '9866677788', email: 'meera.d@gmail.demo', state: 'Maharashtra', stateCode: '27', type: 'B2C' },
      { name: 'Omkar Enterprises', businessName: 'Omkar Trading', gstin: '27EEEE1122E1Z3', phone: '9877788899', email: 'omkar@trading.demo', state: 'Maharashtra', stateCode: '27', type: 'B2B' },
      { name: 'Vanguard Systems', businessName: 'Vanguard Goa', gstin: '30FFFF3344F1Z4', phone: '9888899900', email: 'vanguard@goa.demo', state: 'Goa', stateCode: '30', type: 'B2B' }
    ];

    const createdCustomers = [];
    for (const c of customerList) {
      const cust = await Customer.create({
        businessId: business._id,
        name: c.name,
        businessName: c.businessName || '',
        gstin: c.gstin || '',
        phone: c.phone,
        email: c.email,
        customerType: c.type,
        billingAddress: {
          street: 'Main Road, Commercial Complex',
          city: c.state === 'Maharashtra' ? 'Pune' : 'City Center',
          state: c.state,
          stateCode: c.stateCode,
          pincode: '411001'
        },
        creditLimit: 200000,
        creditDays: 30,
        currentBalance: 0
      });
      createdCustomers.push(cust);
    }

    // 9. Create 10 Suppliers
    console.log('[Seeder] Creating 10 Demo Suppliers...');
    const supplierList = [
      { name: 'Sony Distributorship India Ltd', company: 'Sony India Wholesale', gstin: '27AAAAA1111A1Z1', phone: '9711122233', state: 'Maharashtra', stateCode: '27' },
      { name: 'Samsung Semiconductor & Devices', company: 'Samsung India', gstin: '27BBBBB2222B1Z2', phone: '9722233344', state: 'Maharashtra', stateCode: '27' },
      { name: 'Tata Consumer Wholesale Hub', company: 'Tata Consumer Products', gstin: '27CCCCC3333C1Z3', phone: '9733344455', state: 'Maharashtra', stateCode: '27' },
      { name: 'Bosch Power Tools Distributorship', company: 'Bosch Industrial Supplies', gstin: '29DDDDD4444D1Z4', phone: '9744455566', state: 'Karnataka', stateCode: '29' }
    ];

    const createdSuppliers = [];
    for (const s of supplierList) {
      const sup = await Supplier.create({
        businessId: business._id,
        name: s.name,
        companyName: s.company,
        gstin: s.gstin,
        phone: s.phone,
        address: {
          street: 'Industrial Area Phase 1',
          city: s.state === 'Maharashtra' ? 'Mumbai' : 'Bengaluru',
          state: s.state,
          stateCode: s.stateCode,
          pincode: '400001'
        },
        creditDays: 45,
        currentBalance: 0
      });
      createdSuppliers.push(sup);
    }

    // 10. Create 30 Products
    console.log('[Seeder] Creating Demo Products and Stock Balances...');
    const productCatalog = [
      { name: 'Sony WH-1000XM5 Wireless Headphones', sku: 'SNY-WH1000XM5', barcode: '8901234567890', hsn: '85183000', cat: catElectronics._id, brand: brandSony._id, unit: unitPcs._id, buy: 22000, sell: 29990, tax: 18, stock: 45 },
      { name: 'Samsung 55-inch 4K Crystal UHD Smart TV', sku: 'SAM-TV55-4K', barcode: '8901234567891', hsn: '85287200', cat: catElectronics._id, brand: brandSamsung._id, unit: unitPcs._id, buy: 34000, sell: 44990, tax: 28, stock: 20 },
      { name: 'Samsung Galaxy Tab S9 Ultra (12GB/256GB)', sku: 'SAM-TAB-S9U', barcode: '8901234567892', hsn: '84713010', cat: catElectronics._id, brand: brandSamsung._id, unit: unitPcs._id, buy: 75000, sell: 92999, tax: 18, stock: 15 },
      { name: 'Tata Tea Gold Premium Blend (1 Kg Pack)', sku: 'TAT-TEA-1KG', barcode: '8901234567893', hsn: '09024020', cat: catFMCG._id, brand: brandTata._id, unit: unitKg._id, buy: 380, sell: 490, tax: 5, stock: 350 },
      { name: 'Tata Sampann Unpolished Toor Dal (1 Kg)', sku: 'TAT-DAL-1KG', barcode: '8901234567894', hsn: '07136000', cat: catFMCG._id, brand: brandTata._id, unit: unitKg._id, buy: 135, sell: 175, tax: 5, stock: 500 },
      { name: 'Bosch GSB 500W Professional Impact Drill', sku: 'BOS-DRL-500W', barcode: '8901234567895', hsn: '84672100', cat: catTools._id, brand: brandBosch._id, unit: unitPcs._id, buy: 2400, sell: 3350, tax: 18, stock: 60 },
      { name: 'Bosch 108-Piece Multipurpose Tool Kit', sku: 'BOS-KIT-108P', barcode: '8901234567896', hsn: '82060000', cat: catTools._id, brand: brandBosch._id, unit: unitBox._id, buy: 3200, sell: 4699, tax: 18, stock: 40 },
      { name: 'Executive Gel Pen Box (Pack of 20)', sku: 'OFF-GEL-PEN', barcode: '8901234567897', hsn: '96081019', cat: catStationery._id, brand: null, unit: unitBox._id, buy: 280, sell: 420, tax: 12, stock: 120 },
      { name: 'A4 Premium Copier Paper 75 GSM (500 Sheets)', sku: 'OFF-A4-75GSM', barcode: '8901234567898', hsn: '48025610', cat: catStationery._id, brand: null, unit: unitBox._id, buy: 210, sell: 290, tax: 12, stock: 300 }
    ];

    const createdProducts = [];
    for (const p of productCatalog) {
      const prod = await Product.create({
        businessId: business._id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        hsnSacCode: p.hsn,
        categoryId: p.cat,
        brandId: p.brand,
        unitId: p.unit,
        purchasePrice: p.buy,
        sellingPrice: p.sell,
        taxRate: p.tax,
        minStockAlert: 10,
        openingStock: p.stock,
        currentStock: p.stock
      });

      // Create Stock Balance in Main Warehouse
      await StockBalance.create({
        businessId: business._id,
        warehouseId: warehousePune._id,
        productId: prod._id,
        quantity: p.stock,
        availableQuantity: p.stock,
        averageCost: p.buy
      });

      await StockMovement.create({
        businessId: business._id,
        warehouseId: warehousePune._id,
        productId: prod._id,
        voucherType: 'opening_stock',
        voucherNo: `OPN-${prod.sku}`,
        movementType: 'IN',
        quantity: p.stock,
        unitCost: p.buy,
        totalValue: p.stock * p.buy,
        balanceStockAfter: p.stock,
        date: new Date('2026-04-01')
      });

      createdProducts.push(prod);
    }

    // 11. Create Realistic Sample Invoices
    console.log('[Seeder] Generating Demo Invoices & Double-Entry Ledgers...');
    const inv1Items = [
      {
        productId: createdProducts[0]._id,
        name: createdProducts[0].name,
        quantity: 2,
        rate: createdProducts[0].sellingPrice,
        taxRate: createdProducts[0].taxRate
      },
      {
        productId: createdProducts[3]._id,
        name: createdProducts[3].name,
        quantity: 10,
        rate: createdProducts[3].sellingPrice,
        taxRate: createdProducts[3].taxRate
      }
    ];

    const TaxDeterminationService = require('../src/services/TaxDeterminationService');
    const inv1Tax = TaxDeterminationService.calculateItemTaxes(inv1Items, '27', '27');
    const inv1No = await SequenceService.getNextDocumentNumber(business._id, 'invoice', '2026-27');

    const inv1 = await Invoice.create({
      businessId: business._id,
      warehouseId: warehousePune._id,
      financialYear: '2026-27',
      invoiceNo: inv1No,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customerId: createdCustomers[0]._id,
      customerNameSnapshot: createdCustomers[0].name,
      customerGSTINSnapshot: createdCustomers[0].gstin,
      placeOfSupply: 'Maharashtra',
      placeOfSupplyStateCode: '27',
      isInterState: false,
      items: inv1Tax.items,
      subtotal: inv1Tax.subtotal,
      taxableAmount: inv1Tax.taxableAmount,
      cgstTotal: inv1Tax.cgstTotal,
      sgstTotal: inv1Tax.sgstTotal,
      igstTotal: inv1Tax.igstTotal,
      totalTax: inv1Tax.totalTax,
      roundOff: inv1Tax.roundOff,
      grandTotal: inv1Tax.grandTotal,
      paidAmount: 0,
      balanceAmount: inv1Tax.grandTotal,
      paymentStatus: 'unpaid',
      printTemplate: 'modern',
      status: 'finalized',
      createdBy: ownerUser._id
    });

    await AccountingService.postSalesInvoice(inv1, ownerUser._id);

    console.log('[Seeder] Data seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('DEMO ACCOUNTS READY FOR TESTING:');
    console.log('Owner Account:      owner@demo.local       / Demo@12345');
    console.log('Accountant Account: accountant@demo.local  / Demo@12345');
    console.log('Billing User:       billing@demo.local     / Demo@12345');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedData();

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const {
  User,
  Business,
  BusinessMember,
  FinancialYear
} = require('../models');
const { ROLES, DEFAULT_ROLE_PERMISSIONS } = require('../config/constants');
const AccountingService = require('../services/AccountingService');

const seedAccounts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/thebox_billing_erp';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri.includes('@') ? mongoUri.split('@')[1] : mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected successfully.');

    // 1. Clear existing auth and membership collections to provide a clean state
    console.log('[Seed] Cleaning existing users, businesses, members & financial years...');
    await User.deleteMany({});
    await Business.deleteMany({});
    await BusinessMember.deleteMany({});
    await FinancialYear.deleteMany({});

    // 2. Create the Primary Business
    console.log('[Seed] Creating Primary Business: TheBox Sync Technologies...');
    const business = await Business.create({
      name: 'TheBox Sync Technologies',
      legalName: 'TheBox Sync Technologies Pvt. Ltd.',
      gstin: '27AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      taxType: 'regular',
      businessType: 'Retail / Wholesale / IT & Services',
      state: 'Maharashtra',
      stateCode: '27',
      city: 'Mumbai',
      address: '101, Tech Park, Bandra Kurla Complex',
      pincode: '400051',
      email: 'owner@theboxsync.com',
      phone: '9876543210',
      currency: 'INR',
      currencySymbol: '₹',
      currentFinancialYear: '2026-27',
      settings: {
        dcStockPolicy: 'RESERVE',
        allowNegativeStock: false,
        defaultTaxRate: 18,
        invoiceTemplate: 'modern',
        termsAndConditions: '1. Goods once sold will not be taken back without original invoice.\n2. Interest @ 18% p.a. will be charged if payment is not made within due date.'
      }
    });

    // 3. Create Default Financial Year (2026-27)
    await FinancialYear.create({
      businessId: business._id,
      name: '2026-27',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true
    });

    // 4. Seed Standard Double-Entry Chart of Accounts
    console.log('[Seed] Initializing Standard Chart of Accounts...');
    await AccountingService.seedDefaultChartOfAccounts(business._id);

    // 5. Define the 4 Standard Role Accounts
    const defaultPassword = 'Password@123';
    const accountsData = [
      {
        name: 'Business Owner',
        email: 'owner@theboxsync.com',
        mobile: '9876543210',
        role: ROLES.OWNER,
        isOwner: true
      },
      {
        name: 'Chief Accountant',
        email: 'accountant@theboxsync.com',
        mobile: '9876543211',
        role: ROLES.ACCOUNTANT,
        isOwner: false
      },
      {
        name: 'Billing Specialist',
        email: 'billing@theboxsync.com',
        mobile: '9876543212',
        role: ROLES.BILLING_USER,
        isOwner: false
      },
      {
        name: 'Warehouse & Inventory Manager',
        email: 'inventory@theboxsync.com',
        mobile: '9876543213',
        role: ROLES.INVENTORY_MANAGER,
        isOwner: false
      }
    ];

    console.log('[Seed] Creating 4 System Role Accounts (Owner, Accountant, Billing Staff, Inventory Management)...');

    let ownerUserId = null;

    for (const acc of accountsData) {
      // Create user
      const user = await User.create({
        name: acc.name,
        email: acc.email.toLowerCase(),
        mobile: acc.mobile,
        password: defaultPassword,
        defaultBusinessId: business._id,
        status: 'active'
      });

      if (acc.isOwner) {
        ownerUserId = user._id;
      }

      // Assign Business Membership with Role and Default Role Permissions Matrix
      const permissions = DEFAULT_ROLE_PERMISSIONS[acc.role] || {};
      await BusinessMember.create({
        businessId: business._id,
        userId: user._id,
        role: acc.role,
        permissions,
        isAllBranches: true,
        isAllWarehouses: true,
        status: 'active'
      });

      console.log(`  ✓ Account Created: ${acc.name} (${acc.email}) -> Role: [${acc.role}]`);
    }

    if (ownerUserId) {
      business.createdBy = ownerUserId;
      await business.save();
    }

    console.log('\n======================================================');
    console.log('✅ ALL 4 ACCOUNTS CREATED SUCCESSFULLY (NO DUMMY DATA)');
    console.log('======================================================');
    console.log('Password for all accounts:', defaultPassword);
    console.log('1. 👑 Owner:       owner@theboxsync.com');
    console.log('2. 📊 Accountant:  accountant@theboxsync.com');
    console.log('3. ⚡ Billing:     billing@theboxsync.com');
    console.log('4. 📦 Inventory:   inventory@theboxsync.com');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedAccounts();

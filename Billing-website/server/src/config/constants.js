// Indian States & Union Territory Codes for GST
const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' }
];

// System Pre-set Roles
const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  BILLING_USER: 'billing_user',
  INVENTORY_MANAGER: 'inventory_manager',
  SALES_USER: 'sales_user',
  PURCHASE_USER: 'purchase_user',
  CUSTOM: 'custom'
};

// Standard ERP Modules
const MODULES = [
  'dashboard',
  'customers',
  'suppliers',
  'products',
  'inventory',
  'warehouses',
  'quotations',
  'sales_orders',
  'delivery_challans',
  'invoices',
  'sales_returns',
  'credit_notes',
  'purchase_orders',
  'goods_receipt',
  'purchase_bills',
  'purchase_returns',
  'debit_notes',
  'payments',
  'expenses',
  'accounting',
  'tax_gst',
  'tax_tds',
  'reports',
  'settings',
  'audit_logs'
];

// Actions
const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'print', 'approve', 'cancel'];

// Default Role Permissions Matrix
const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.OWNER]: MODULES.reduce((acc, mod) => {
    acc[mod] = ACTIONS.reduce((a, act) => ({ ...a, [act]: true }), {});
    return acc;
  }, {}),
  [ROLES.ADMIN]: MODULES.reduce((acc, mod) => {
    acc[mod] = ACTIONS.reduce((a, act) => ({ ...a, [act]: mod !== 'audit_logs' || act === 'view' }), {});
    return acc;
  }, {}),
  [ROLES.ACCOUNTANT]: {
    dashboard: { view: true },
    customers: { view: true, create: true, edit: true, export: true, print: true },
    suppliers: { view: true, create: true, edit: true, export: true, print: true },
    invoices: { view: true, create: true, edit: true, export: true, print: true, cancel: true },
    sales_returns: { view: true, create: true, edit: true, export: true, print: true },
    credit_notes: { view: true, create: true, edit: true, export: true, print: true },
    purchase_bills: { view: true, create: true, edit: true, export: true, print: true },
    purchase_returns: { view: true, create: true, edit: true, export: true, print: true },
    debit_notes: { view: true, create: true, edit: true, export: true, print: true },
    payments: { view: true, create: true, edit: true, export: true, print: true },
    expenses: { view: true, create: true, edit: true, export: true, print: true },
    accounting: { view: true, create: true, edit: true, export: true, print: true },
    tax_gst: { view: true, create: true, edit: true, export: true, print: true },
    tax_tds: { view: true, create: true, edit: true, export: true, print: true },
    reports: { view: true, export: true, print: true }
  },
  [ROLES.BILLING_USER]: {
    dashboard: { view: true },
    customers: { view: true, create: true, edit: true },
    products: { view: true },
    quotations: { view: true, create: true, edit: true, print: true },
    sales_orders: { view: true, create: true, edit: true, print: true },
    delivery_challans: { view: true, create: true, edit: true, print: true },
    invoices: { view: true, create: true, print: true },
    payments: { view: true, create: true, print: true }
  },
  [ROLES.INVENTORY_MANAGER]: {
    dashboard: { view: true },
    products: { view: true, create: true, edit: true, export: true, print: true },
    inventory: { view: true, create: true, edit: true, export: true, print: true },
    warehouses: { view: true, create: true, edit: true },
    goods_receipt: { view: true, create: true, edit: true, print: true },
    purchase_bills: { view: true }
  },
  [ROLES.SALES_USER]: {
    dashboard: { view: true },
    customers: { view: true, create: true, edit: true },
    products: { view: true },
    quotations: { view: true, create: true, edit: true, print: true },
    sales_orders: { view: true, create: true, edit: true, print: true },
    invoices: { view: true, print: true }
  },
  [ROLES.PURCHASE_USER]: {
    dashboard: { view: true },
    suppliers: { view: true, create: true, edit: true },
    products: { view: true },
    purchase_orders: { view: true, create: true, edit: true, print: true },
    goods_receipt: { view: true, create: true, edit: true, print: true },
    purchase_bills: { view: true, create: true, print: true }
  }
};

// Default System Account Groups
const DEFAULT_ACCOUNT_GROUPS = [
  { name: 'Current Assets', nature: 'Asset', code: 'CA' },
  { name: 'Bank Accounts', nature: 'Asset', parentCode: 'CA', code: 'BANK' },
  { name: 'Cash in Hand', nature: 'Asset', parentCode: 'CA', code: 'CASH' },
  { name: 'Sundry Debtors (Customers)', nature: 'Asset', parentCode: 'CA', code: 'DEBTORS' },
  { name: 'Stock in Hand', nature: 'Asset', parentCode: 'CA', code: 'STOCK' },
  { name: 'Duties & Taxes (Input GST)', nature: 'Asset', parentCode: 'CA', code: 'INPUT_GST' },

  { name: 'Current Liabilities', nature: 'Liability', code: 'CL' },
  { name: 'Sundry Creditors (Suppliers)', nature: 'Liability', parentCode: 'CL', code: 'CREDITORS' },
  { name: 'Duties & Taxes (Output GST)', nature: 'Liability', parentCode: 'CL', code: 'OUTPUT_GST' },
  { name: 'TDS Payable', nature: 'Liability', parentCode: 'CL', code: 'TDS_PAY' },

  { name: 'Direct Income (Sales)', nature: 'Income', code: 'SALES_INC' },
  { name: 'Indirect Income', nature: 'Income', code: 'IND_INC' },

  { name: 'Direct Expenses (Cost of Goods Sold)', nature: 'Expense', code: 'COGS' },
  { name: 'Purchase Accounts', nature: 'Expense', code: 'PURCHASE_ACC' },
  { name: 'Indirect Expenses (Operating)', nature: 'Expense', code: 'IND_EXP' },

  { name: 'Capital Account', nature: 'Equity', code: 'CAPITAL' }
];

// Standard GST Rates
const DEFAULT_GST_RATES = [
  { rate: 0, name: 'Nil Rated (0%)', cgst: 0, sgst: 0, igst: 0 },
  { rate: 5, name: 'GST 5%', cgst: 2.5, sgst: 2.5, igst: 5 },
  { rate: 12, name: 'GST 12%', cgst: 6, sgst: 6, igst: 12 },
  { rate: 18, name: 'GST 18%', cgst: 9, sgst: 9, igst: 18 },
  { rate: 28, name: 'GST 28%', cgst: 14, sgst: 14, igst: 28 }
];

// Standard Indian TDS Sections
const DEFAULT_TDS_SECTIONS = [
  { section: '194C', name: 'Payment to Contractors', rate: 1.0, threshold: 30000, deducteeType: 'non_company' },
  { section: '194C-Co', name: 'Payment to Contractors (Company)', rate: 2.0, threshold: 30000, deducteeType: 'company' },
  { section: '194J', name: 'Fees for Professional/Technical Services', rate: 10.0, threshold: 30000, deducteeType: 'both' },
  { section: '194I-Rent', name: 'Rent for Land/Building', rate: 10.0, threshold: 240000, deducteeType: 'both' },
  { section: '194I-Plant', name: 'Rent for Plant & Machinery', rate: 2.0, threshold: 240000, deducteeType: 'both' },
  { section: '194H', name: 'Commission & Brokerage', rate: 5.0, threshold: 15000, deducteeType: 'both' },
  { section: '194Q', name: 'Purchase of Goods', rate: 0.1, threshold: 5000000, deducteeType: 'both' }
];

module.exports = {
  INDIAN_STATES,
  ROLES,
  MODULES,
  ACTIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ACCOUNT_GROUPS,
  DEFAULT_GST_RATES,
  DEFAULT_TDS_SECTIONS
};

# MASTER DEVELOPMENT PROMPT
## Full GST Billing, Inventory & Business Management Web Application

You are a senior full-stack software architect and developer.

Build a **production-ready, multi-business billing, GST invoicing, inventory and business management web application** inspired by the breadth of modern Indian billing platforms such as MyBillBook, but with **100% original UI, UX, code, database architecture and branding**.

Do NOT copy MyBillBook's source code, proprietary design, branding, exact screens, copyrighted assets, or proprietary implementation. Build an original professional product with equivalent/general business functionality.

---

# 1. TECHNOLOGY STACK

Use only the following core technologies unless absolutely necessary:

### Frontend
- React.js
- JavaScript — DO NOT use TypeScript
- React Router
- Axios
- Bootstrap 5
- Bootstrap Icons
- React Hook Form where useful
- Context API or Redux Toolkit where global state is genuinely required
- Chart.js/Recharts for analytics
- jsPDF/html2canvas or an appropriate PDF solution for invoice generation

### Backend
- Node.js
- Express.js
- JavaScript
- REST API architecture
- JWT authentication
- bcrypt/bcryptjs for password hashing
- Mongoose
- MongoDB

### Infrastructure
- Environment variables using `.env`
- Production-ready error handling
- Logging
- MongoDB indexes
- API validation
- Security middleware
- Rate limiting
- CORS configuration
- Helmet
- Proper backup/export architecture

Do NOT use:
- TypeScript
- Firebase
- Tailwind CSS
- Next.js
- SQL database

---

# 2. APPLICATION OBJECTIVE

Create a complete business management system for Indian businesses.

The application must support:

- GST billing
- Non-GST billing
- Quotations
- Sales Orders
- GST Tax Invoices
- Purchase Orders
- Purchase Bills
- Credit Notes
- Debit Notes
- Delivery Challans
- Payment Receipts
- Payment/Expense management
- TDS management
- Inventory management
- Stock management
- Customer management
- Supplier management
- Product management
- HSN/SAC management
- GST configuration
- Reports
- Business dashboard
- Financial summaries
- User and employee management
- Multiple users
- Multiple businesses
- Multiple branches
- Multiple warehouses
- Printable documents
- PDF generation
- Excel/CSV export
- Audit logs

The application should feel like a **complete ERP-lite billing platform**, not just a simple invoice generator.

---

# 3. MULTI-BUSINESS ARCHITECTURE

Design the application as a SaaS-ready system.

One user may have:

- Multiple businesses
- Multiple branches
- Multiple warehouses
- Multiple financial years
- Multiple users/employees

Every business-related database record must contain appropriate tenant/business references.

Example:

```text
User
 └── Businesses
      ├── Business A
      │    ├── Branches
      │    ├── Warehouses
      │    ├── Customers
      │    ├── Suppliers
      │    ├── Products
      │    ├── Sales
      │    └── Purchases
      │
      └── Business B
           ├── Branches
           ├── Warehouses
           ├── Customers
           ├── Suppliers
           ├── Products
           └── Transactions
```

Never allow data from one business to appear in another business.

Implement strict tenant isolation at the API and database-query level.

---

# 4. AUTHENTICATION

Create:

### Registration
- Name
- Mobile number
- Email
- Password
- Business name
- Business type
- GST registration status

### Login
- Email/mobile
- Password

### Security
- JWT access token
- Secure password hashing
- Token expiration
- Refresh-token strategy if appropriate
- Logout
- Forgot password
- Reset password
- Session management
- Login activity
- Failed-login handling

---

# 5. USER ROLES & PERMISSIONS

Create a complete RBAC system.

Roles:

### Owner
Full access.

### Admin
Almost full business access.

### Accountant
Accounting, invoices, purchases and reports.

### Billing User
Sales billing and customers.

### Inventory Manager
Products, stock, purchases and inventory.

### Sales User
Customers, quotations, sales orders and sales.

### Purchase User
Suppliers, purchase orders and purchase bills.

### Custom Role
Allow the owner to create custom roles.

Permissions must be configurable per module:

- View
- Create
- Edit
- Delete
- Export
- Print
- Approve
- Cancel

---

# 6. BUSINESS PROFILE

Create Business Settings.

Fields:

- Business name
- Legal name
- Business logo
- Address
- City
- State
- Pincode
- Country
- Mobile
- Email
- Website
- GSTIN
- PAN
- CIN where applicable
- State code
- Business type
- Financial year
- Currency
- Invoice prefix
- Invoice numbering
- Terms & conditions
- Signature
- Bank details
- UPI ID
- Payment QR
- Default tax settings

Allow users to upload a business logo and signature.

---

# 7. GST MODULE

Create a dedicated GST configuration system.

Support:

- GST registered business
- Composition scheme where applicable
- Unregistered business
- Intra-state transactions
- Inter-state transactions
- CGST
- SGST
- IGST
- GST exemption
- Zero-rated transactions
- Reverse charge configuration
- HSN
- SAC
- Tax-inclusive pricing
- Tax-exclusive pricing

GST rates should be configurable rather than hard-coded.

Support common rates such as:

- 0%
- 5%
- 12%
- 18%
- 28%

Allow future rates/configuration changes through settings.

---

# 8. PRODUCT MASTER

Create a powerful product management system.

Fields:

- Product name
- SKU
- Product code
- Barcode
- HSN/SAC
- Category
- Brand
- Unit
- Alternate unit
- Purchase price
- Selling price
- MRP
- Wholesale price
- Retail price
- Tax rate
- GST type
- Opening stock
- Minimum stock
- Maximum stock
- Reorder level
- Warehouse
- Batch
- Expiry
- Serial number where applicable
- Product image
- Description
- Active/inactive

Support:

- Stock items
- Service items
- Non-stock items

---

# 9. INVENTORY MANAGEMENT

Build a proper inventory engine.

Features:

- Opening stock
- Purchase stock
- Sales stock deduction
- Sales return
- Purchase return
- Stock adjustment
- Stock transfer
- Warehouse transfer
- Damaged stock
- Expired stock
- Stock reconciliation
- Batch tracking
- Expiry tracking
- Serial-number tracking
- Low-stock alerts
- Negative-stock configuration

Maintain a complete stock ledger.

Example:

```text
Opening Stock
+
Purchase
+
Purchase Return reversal
+
Stock Adjustment In
+
Stock Transfer In
-
Sales
-
Sales Return reversal
-
Stock Adjustment Out
-
Stock Transfer Out
=
Current Stock
```

Never simply overwrite stock quantity.

Maintain transaction-based stock movement records.

---

# 10. WAREHOUSE MANAGEMENT

Support multiple warehouses.

Features:

- Create warehouse
- Edit warehouse
- Warehouse address
- Warehouse manager
- Stock by warehouse
- Transfer stock
- Warehouse-wise reports
- Warehouse-wise valuation
- Warehouse stock ledger

---

# 11. CUSTOMER MANAGEMENT

Create complete customer CRM.

Fields:

- Customer name
- Business name
- Mobile
- Email
- Billing address
- Shipping address
- GSTIN
- PAN
- State
- State code
- Customer type
- Credit limit
- Payment terms
- Opening balance
- Outstanding balance

Features:

- Customer ledger
- Sales history
- Payment history
- Outstanding invoices
- Credit limit
- Statement
- WhatsApp/share invoice
- Email invoice
- Customer-wise reports

---

# 12. SUPPLIER MANAGEMENT

Fields:

- Supplier name
- Company
- Mobile
- Email
- GSTIN
- PAN
- Address
- State
- Payment terms
- Opening balance

Features:

- Purchase history
- Supplier ledger
- Outstanding payable
- Payment history
- Purchase returns
- Supplier statement

---

# 13. QUOTATION MODULE

Create quotation functionality.

Features:

- Create quotation
- Edit quotation
- Delete quotation
- Duplicate quotation
- Convert quotation → Sales Order
- Convert quotation → Invoice
- Print
- Download PDF
- Share
- Email
- WhatsApp/share link where integration is configured
- Expiry date
- Terms & conditions
- Quotation status

Statuses:

```text
Draft
Sent
Accepted
Rejected
Expired
Converted
Cancelled
```

---

# 14. SALES ORDER MODULE

Create Sales Order functionality.

Features:

- Customer selection
- Product selection
- Quantity
- Rate
- Discount
- GST
- Shipping
- Other charges
- Terms
- Delivery date
- Notes

Statuses:

```text
Draft
Confirmed
Partially Fulfilled
Completed
Cancelled
```

Allow:

```text
Quotation
   ↓
Sales Order
   ↓
Invoice
   ↓
Payment
```

---

# 15. GST SALES INVOICE

Create a professional GST invoice engine.

Support:

- Tax invoice
- Bill of supply
- Retail invoice
- Export-related configuration where applicable
- B2B
- B2C
- Intra-state
- Inter-state
- Reverse charge

Invoice fields:

- Invoice number
- Invoice date
- Customer
- Billing address
- Shipping address
- GSTIN
- Place of supply
- Product
- HSN/SAC
- Quantity
- Unit
- Rate
- Discount
- Taxable value
- CGST
- SGST
- IGST
- Cess where applicable
- Other charges
- Round-off
- Grand total

Invoice lifecycle:

```text
Draft
↓
Finalized
↓
Paid / Partially Paid / Unpaid
↓
Cancelled
```

Once finalized, do not silently modify financial values.

Maintain audit history.

---

# 16. INVOICE NUMBERING

Create configurable numbering.

Example:

```text
INV-2026-00001
INV-2026-00002
INV-2026-00003
```

Allow:

- Prefix
- Starting number
- Financial-year reset
- Branch-wise numbering
- Series

Prevent duplicate invoice numbers.

Use safe server-side sequence generation.

---

# 17. PURCHASE ORDER

Create Purchase Order functionality.

Workflow:

```text
Purchase Order
      ↓
Purchase Receipt / Purchase Bill
      ↓
Stock Added
      ↓
Supplier Payment
```

Fields:

- Supplier
- Products
- Quantity
- Rate
- Discount
- GST
- Delivery date
- Warehouse
- Terms
- Notes

---

# 18. PURCHASE BILL

Create purchase invoice/bill functionality.

Support:

- Supplier invoice number
- Invoice date
- Products
- HSN/SAC
- Quantity
- Rate
- Discount
- GST
- CGST
- SGST
- IGST
- Additional charges
- Round-off
- Total

When purchase is finalized:

```text
Purchase Stock IN
+
Supplier Payable
```

---

# 19. CREDIT NOTE

Create a complete credit note system.

Reasons:

- Sales return
- Rate difference
- Discount adjustment
- Damaged goods
- Other adjustment

Allow credit note against an invoice.

Automatically update:

- Customer outstanding
- Sales return where applicable
- Inventory where applicable
- GST/tax calculations

Maintain complete linkage:

```text
Original Invoice
       ↓
Credit Note
```

---

# 20. DEBIT NOTE

Create debit note functionality.

Support:

- Purchase return
- Rate difference
- Additional amount payable
- Other adjustments

Maintain linkage to the original purchase document.

Automatically update:

- Supplier payable
- Inventory
- Purchase values
- Tax values where applicable

---

# 21. DELIVERY CHALLAN

Create Delivery Challan.

Features:

- Customer
- Products
- Quantity
- Warehouse
- Delivery address
- Transport details
- Reason
- Notes

Allow:

```text
Delivery Challan → Invoice
```

Stock handling must be configurable according to the business workflow.

---

# 22. PAYMENT MANAGEMENT

Create:

### Payment In
For customer payments.

### Payment Out
For supplier/vendor payments.

### Expense
For business expenses.

Payment modes:

- Cash
- Bank
- UPI
- Card
- Cheque
- Other

Create payment references and notes.

Support partial payments.

Example:

```text
Invoice = ₹50,000
Paid = ₹20,000
Outstanding = ₹30,000
```

---

# 23. TDS MODULE

Create a configurable TDS management module.

Do not hard-code tax rates permanently.

Create:

- TDS section master
- TDS rate configuration
- Deductee details
- PAN
- Threshold configuration
- TDS deduction
- TDS payable
- TDS reports
- TDS ledger
- TDS transaction history

Support TDS on applicable transactions.

The system must allow administrators to update rates/thresholds/configurations when regulations change.

Clearly separate TDS from GST calculations.

---

# 24. EXPENSE MANAGEMENT

Create expense module.

Fields:

- Expense category
- Vendor
- Amount
- Tax
- TDS where applicable
- Payment mode
- Date
- Reference
- Attachment
- Notes

Categories:

- Rent
- Electricity
- Salary
- Internet
- Transportation
- Office expense
- Marketing
- Repairs
- Other

Allow custom categories.

---

# 25. EXPENSE & PAYMENT LEDGER

Create ledger architecture.

Support:

- Customer ledger
- Supplier ledger
- Cash ledger
- Bank ledger
- Expense ledger
- TDS ledger
- Tax ledger
- Sales ledger
- Purchase ledger

Every financial transaction should create appropriate ledger entries.

Do not calculate balances only from frontend values.

Balances must be calculated server-side from transaction data or maintained through a reliable accounting engine.

---

# 26. DASHBOARD

Create a modern business dashboard.

Show:

- Today's sales
- Today's purchases
- Today's collection
- Today's expenses
- Outstanding receivables
- Outstanding payables
- Total stock value
- Low stock
- Top-selling products
- Sales graph
- Purchase graph
- Payment graph
- Expense graph
- GST summary
- Monthly comparison
- Profit summary where accounting data is sufficient

Dashboard should have filters:

- Today
- Yesterday
- This week
- This month
- Last month
- This financial year
- Custom date

---

# 27. REPORTS MODULE

Create a powerful reports section.

### Sales Reports
- Sales summary
- Sales register
- Invoice report
- Product-wise sales
- Customer-wise sales
- Salesperson-wise sales
- GST sales report
- Sales return
- Credit note report

### Purchase Reports
- Purchase summary
- Purchase register
- Supplier-wise purchase
- Product-wise purchase
- Purchase return
- Debit note report

### Inventory Reports
- Current stock
- Stock ledger
- Stock valuation
- Low stock
- Stock movement
- Warehouse stock
- Batch report
- Expiry report
- Dead stock

### Payment Reports
- Payment received
- Payment made
- Outstanding receivables
- Outstanding payables
- Customer ledger
- Supplier ledger
- Cash flow

### GST Reports
- Tax summary
- Output GST
- Input GST
- CGST
- SGST
- IGST
- HSN summary
- GST transaction reports

### TDS Reports
- TDS deducted
- TDS payable
- Deductee-wise report
- Section-wise report

### Expense Reports
- Expense summary
- Category-wise expense
- Vendor-wise expense

Every report should support:

- Date filters
- Customer/supplier filters
- Product filters
- Branch filters
- Warehouse filters
- Export Excel/CSV
- PDF
- Print

---

# 28. SEARCH SYSTEM

Implement global search.

Search:

- Invoice number
- Customer
- Supplier
- Product
- SKU
- Barcode
- Quotation number
- Sales order
- Purchase order
- Credit note
- Debit note

Search should be fast and debounced.

---

# 29. BARCODE

Create barcode support.

Features:

- Barcode generation
- Barcode scanning
- Product lookup
- Barcode-based billing
- Multiple barcode formats where practical
- Product label printing

Billing flow:

```text
Scan Barcode
↓
Find Product
↓
Add to Cart
↓
Enter Quantity
↓
Calculate GST
↓
Generate Invoice
```

---

# 30. BILLING POS SCREEN

Create a fast billing interface.

Desktop:

```text
------------------------------------------------
Search / Scan Barcode
------------------------------------------------
Product Grid        | Current Cart
                    |
                    | Product
                    | Qty
                    | Rate
                    | Discount
                    | Tax
                    |
                    | Subtotal
                    | GST
                    | Grand Total
------------------------------------------------
Payment
Cash | UPI | Card | Credit
------------------------------------------------
Generate Invoice
------------------------------------------------
```

Mobile:

Use a completely optimized mobile POS experience.

Do not simply shrink the desktop layout.

---

# 31. INVOICE DESIGN ENGINE

Create customizable invoice templates.

Templates should support:

- Classic
- Modern
- Minimal
- Professional
- Retail

Allow configuration:

- Logo
- Header
- Footer
- Signature
- Bank details
- QR code
- Terms
- Authorized signatory
- Item columns
- Tax columns

Provide print preview.

The invoice must be:

- A4 printable
- Thermal printer friendly
- Mobile readable
- PDF compatible

---

# 32. PAYMENT QR

Support configurable:

- UPI ID
- UPI QR
- Bank account details

Generate payment QR where appropriate.

Do not store sensitive payment credentials insecurely.

---

# 33. NOTIFICATIONS & COMMUNICATION

Create communication architecture for:

- Invoice sharing
- Payment reminder
- Outstanding reminder
- Quotation sharing
- Order confirmation

Initially build the backend so providers can be integrated later.

Use provider abstraction:

```text
WhatsAppProvider
EmailProvider
SMSProvider
```

Do not tightly couple business logic to a single provider.

---

# 34. DOCUMENT CONVERSION ENGINE

Support:

```text
Quotation
    ↓
Sales Order
    ↓
Invoice
```

and:

```text
Purchase Order
    ↓
Purchase Bill
```

and:

```text
Invoice
    ↓
Credit Note
```

and:

```text
Purchase Bill
    ↓
Debit Note
```

Prevent duplicate conversion.

Maintain references between documents.

---

# 35. DATABASE ARCHITECTURE

Create proper Mongoose models.

Suggested models:

```text
User
Business
Branch
Warehouse
Role
Permission
Customer
Supplier
Product
Category
Brand
Unit
HSN
TaxRate
Quotation
QuotationItem
SalesOrder
SalesOrderItem
Invoice
InvoiceItem
CreditNote
CreditNoteItem
DeliveryChallan
DeliveryChallanItem
PurchaseOrder
PurchaseOrderItem
PurchaseBill
PurchaseBillItem
DebitNote
DebitNoteItem
PaymentIn
PaymentOut
Expense
ExpenseCategory
Ledger
LedgerEntry
StockMovement
StockTransfer
StockAdjustment
TDSSection
TDSTransaction
Sequence
FinancialYear
Notification
AuditLog
```

Use proper references and indexes.

Avoid excessive document nesting.

---

# 36. DATABASE INDEXING

Create indexes for frequently searched fields.

Examples:

```text
businessId
customerId
supplierId
invoiceNumber
invoiceDate
productId
sku
barcode
gstin
createdAt
status
warehouseId
branchId
```

Use compound indexes where useful.

Do not create unnecessary indexes.

---

# 37. STOCK ENGINE

Create a central stock service.

For every stock-affecting transaction:

```text
Purchase → IN
Sales → OUT
Sales Return → IN
Purchase Return → OUT
Stock Adjustment → IN/OUT
Stock Transfer → OUT + IN
```

Never allow frontend code to directly manipulate stock quantities.

All stock modifications must go through backend services.

Use MongoDB transactions where multiple collections must be updated atomically.

---

# 38. FINANCIAL TRANSACTION ENGINE

Create centralized services for:

```text
SalesService
PurchaseService
PaymentService
CreditNoteService
DebitNoteService
ExpenseService
StockService
LedgerService
TaxService
TDSService
```

Avoid putting complex financial logic inside React components.

---

# 39. API STRUCTURE

Use REST APIs.

Example:

```text
/api/auth
/api/businesses
/api/users
/api/roles
/api/customers
/api/suppliers
/api/products
/api/categories
/api/warehouses
/api/quotations
/api/sales-orders
/api/invoices
/api/credit-notes
/api/debit-notes
/api/delivery-challans
/api/purchase-orders
/api/purchase-bills
/api/payments
/api/expenses
/api/inventory
/api/stock
/api/ledger
/api/gst
/api/tds
/api/reports
/api/settings
```

Use:

```text
GET
POST
PUT/PATCH
DELETE
```

with appropriate validation.

---

# 40. API RESPONSE FORMAT

Use a consistent response structure.

Example:

```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {},
  "errors": []
}
```

Error:

```json
{
  "success": false,
  "message": "Unable to create invoice",
  "data": null,
  "errors": []
}
```

---

# 41. FRONTEND STRUCTURE

Use a scalable React architecture.

Example:

```text
src/
├── assets/
├── components/
├── layouts/
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── customers/
│   ├── suppliers/
│   ├── products/
│   ├── sales/
│   ├── purchases/
│   ├── inventory/
│   ├── payments/
│   ├── expenses/
│   ├── reports/
│   ├── gst/
│   ├── tds/
│   └── settings/
├── services/
├── api/
├── hooks/
├── context/
├── utils/
├── validations/
├── routes/
└── App.jsx
```

---

# 42. RESPONSIVE DESIGN

This is extremely important.

The application must work professionally on:

- Mobile phones
- Tablets
- Laptops
- Desktop monitors
- Large screens

Minimum targets:

```text
320px+
375px+
425px+
768px+
1024px+
1280px+
1440px+
1920px+
```

Use Bootstrap 5 responsive utilities and grid.

Do NOT create separate duplicated applications for desktop and mobile.

---

# 43. MOBILE DESIGN REQUIREMENTS

On mobile:

- Sidebar becomes offcanvas/drawer
- Tables become responsive cards where appropriate
- Important actions remain accessible
- Floating action buttons can be used
- Bottom action bar can be used for billing
- Forms become single-column
- Product selection becomes mobile-friendly
- Invoice preview is scrollable
- Buttons have touch-friendly dimensions
- No horizontal overflow
- No tiny text
- No desktop-only hover interactions
- Modals must fit mobile screens

Billing must be usable with one hand where practical.

---

# 44. DESKTOP DESIGN

Desktop should use available screen space efficiently.

Use:

- Sidebar navigation
- Top navigation
- Breadcrumbs
- Cards
- Data tables
- Filters
- Split-view billing interface
- Keyboard shortcuts where useful

Avoid excessive empty space.

---

# 45. UI/UX DESIGN

Create a modern professional SaaS design.

Style:

- Clean
- Fast
- Professional
- Business-focused
- Minimal
- Easy for non-technical shop owners

Use:

- Bootstrap cards
- Tables
- Dropdowns
- Modals
- Toast notifications
- Tabs
- Offcanvas
- Badges
- Breadcrumbs
- Pagination
- Skeleton loaders

Do not copy MyBillBook's exact UI.

---

# 46. COLOR SYSTEM

Create a centralized theme.

Example:

```text
Primary
Secondary
Success
Warning
Danger
Info
Background
Surface
Text
Muted
Border
```

Use CSS variables so the theme can easily be changed.

---

# 47. ACCESSIBILITY

Implement:

- Keyboard navigation
- Proper labels
- ARIA attributes where necessary
- Visible focus states
- Adequate contrast
- Screen-reader-friendly forms
- Accessible modal behavior

---

# 48. PERFORMANCE

Optimize:

- API calls
- Database queries
- React rendering
- Large tables
- Reports
- Dashboard charts
- Product search

Use:

- Pagination
- Server-side filtering
- Server-side sorting
- Debounced search
- Lazy loading
- Code splitting
- Memoization where appropriate

Do not load thousands of records into the browser unnecessarily.

---

# 49. SECURITY

Implement:

- JWT authentication
- Password hashing
- RBAC
- Tenant isolation
- Input validation
- MongoDB query sanitization
- Helmet
- Rate limiting
- CORS
- Secure headers
- Error handling
- Audit logging

Never expose:

- Password hashes
- JWT secrets
- Database credentials
- Internal server errors
- Sensitive environment variables

---

# 50. AUDIT LOG

Create an audit log.

Track:

- Login
- Logout
- Invoice created
- Invoice edited
- Invoice cancelled
- Credit note
- Debit note
- Purchase
- Stock adjustment
- Payment
- Settings changes
- User changes

Store:

```text
user
business
action
module
recordId
oldValue
newValue
IP where appropriate
timestamp
```

---

# 51. FINANCIAL YEAR

Support financial years.

Example:

```text
2025-26
2026-27
2027-28
```

Transactions should be associated with a financial year.

Allow the business to switch financial years.

Invoice numbering can reset according to configured financial-year rules.

---

# 52. IMPORT / EXPORT

Create import/export functionality.

Import:

- Customers
- Suppliers
- Products
- Opening stock
- Opening balances

Support:

- CSV
- Excel

Export:

- Sales
- Purchases
- Inventory
- Customers
- Suppliers
- Reports

Validate imported data before inserting.

Show row-level import errors.

---

# 53. BACKUP & DATA EXPORT

Provide business data export.

Allow authorized users to export:

- Customers
- Suppliers
- Products
- Transactions
- Inventory
- Reports

Build the architecture so scheduled automated backups can be added later.

---

# 54. NOTIFICATION CENTER

Create notification center.

Examples:

```text
Low stock
Payment overdue
Quotation expiring
Invoice overdue
Purchase order pending
Stock transfer pending
```

Notifications should be stored in the database.

---

# 55. SETTINGS

Create settings sections:

```text
Business Settings
Invoice Settings
GST Settings
Tax Settings
TDS Settings
Inventory Settings
Warehouse Settings
Payment Settings
User & Role Settings
Numbering Settings
Notification Settings
Print Settings
Import/Export
Security
Audit Logs
```

---

# 56. ERROR HANDLING

Every API must have proper error handling.

Frontend must show user-friendly messages.

Examples:

```text
"Customer is required."
"GSTIN format is invalid."
"Invoice cannot be finalized without at least one item."
"Insufficient stock."
"Invoice number already exists."
```

Never show raw MongoDB/Node.js errors to users.

---

# 57. FORM VALIDATION

Validate both:

### Frontend
For immediate UX.

### Backend
For security and data integrity.

Never trust frontend validation alone.

---

# 58. TRANSACTION SAFETY

Financial and stock transactions must be atomic wherever required.

For example, invoice creation may involve:

```text
Invoice
Invoice Items
Stock Movement
Ledger Entries
Customer Balance
Tax Calculation
```

If a critical operation fails, avoid leaving the database in a partially updated state.

Use MongoDB sessions/transactions where supported by the deployment architecture.

---

# 59. REPORT CALCULATIONS

Do not hard-code dashboard values.

Build reports from actual transaction data.

For example:

```text
Total Sales
= Finalized Sales Invoices
- Sales Returns / applicable Credit Notes
```

Stock:

```text
Opening
+ Purchases
+ Returns In
- Sales
- Returns Out
± Adjustments
± Transfers
```

All financial formulas should be centralized in backend services.

---

# 60. PRINTING

Create print-friendly layouts for:

- Invoice
- Quotation
- Sales Order
- Purchase Order
- Purchase Bill
- Credit Note
- Debit Note
- Delivery Challan
- Payment Receipt

Use CSS print media queries.

---

# 61. PDF GENERATION

Generate professional PDFs.

PDF must preserve:

- Logo
- Invoice details
- GST details
- Items
- Taxes
- Totals
- Terms
- Signature
- Bank details

Do not create broken PDFs on mobile.

---

# 62. UI STATES

Every page must handle:

```text
Loading
Empty
Success
Error
No permission
No data
Network error
```

Example:

```text
No customers found.

[ + Add Customer ]
```

---

# 63. PAGINATION

All large datasets must use server-side pagination.

Example:

```text
?page=1&limit=25
```

Return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 250,
    "totalPages": 10
  }
}
```

---

# 64. BUSINESS LOGIC RULES

Implement rules such as:

- Cancelled invoice cannot be edited
- Finalized invoice cannot be freely modified
- Credit note must reference appropriate source transaction where required
- Debit note must reference appropriate source transaction where required
- Payment cannot exceed allowed outstanding amount unless overpayment is explicitly supported
- Stock cannot go negative when negative-stock restriction is enabled
- Duplicate invoice numbers are prohibited
- Deleted financial transactions should use cancellation/soft deletion rather than destructive deletion
- Historical transactions must remain auditable

---

# 65. SOFT DELETE

Use soft delete for important master data and financial records where appropriate.

Example:

```text
isDeleted
deletedAt
deletedBy
```

Do not physically delete critical financial history.

---

# 66. DASHBOARD UX

Dashboard should have:

```text
Header
 ├── Business Switcher
 ├── Financial Year
 ├── Notifications
 └── User Profile

Sidebar

Main Dashboard
 ├── KPI Cards
 ├── Sales Chart
 ├── Purchase Chart
 ├── Outstanding
 ├── Low Stock
 ├── Top Products
 └── Recent Transactions
```

---

# 67. NAVIGATION

Create logical sidebar:

```text
Dashboard

Sales
 ├── Quotations
 ├── Sales Orders
 ├── Invoices
 ├── Credit Notes
 └── Delivery Challans

Purchases
 ├── Purchase Orders
 ├── Purchase Bills
 └── Debit Notes

Inventory
 ├── Products
 ├── Stock
 ├── Stock Movement
 ├── Stock Transfer
 ├── Adjustments
 └── Warehouses

Contacts
 ├── Customers
 └── Suppliers

Payments
 ├── Payment In
 ├── Payment Out
 └── Expenses

Tax
 ├── GST
 └── TDS

Reports

Settings
```

---

# 68. CODING QUALITY

Write clean production-quality code.

Requirements:

- Reusable components
- Reusable API services
- Reusable validation
- Centralized error handling
- Centralized constants
- Proper naming conventions
- No duplicated logic
- No giant React components
- No business logic inside JSX
- No hard-coded business IDs
- No hard-coded tax calculations
- No fake API responses
- No placeholder functionality presented as completed functionality

---

# 69. DEVELOPMENT METHOD

IMPORTANT:

Do NOT try to generate the entire application in one huge code generation step.

Build it incrementally.

Recommended order:

### Phase 1
Project setup

### Phase 2
Authentication

### Phase 3
Business and user management

### Phase 4
Customer/Supplier

### Phase 5
Product/Category/HSN/Tax

### Phase 6
Inventory engine

### Phase 7
Quotation

### Phase 8
Sales Order

### Phase 9
GST Invoice

### Phase 10
Purchase Order

### Phase 11
Purchase Bill

### Phase 12
Credit Note

### Phase 13
Debit Note

### Phase 14
Delivery Challan

### Phase 15
Payment

### Phase 16
Expenses

### Phase 17
TDS

### Phase 18
Ledger

### Phase 19
Reports

### Phase 20
Dashboard

### Phase 21
PDF/Print

### Phase 22
Import/Export

### Phase 23
Audit logs

### Phase 24
Responsive optimization

### Phase 25
Security and performance

### Phase 26
Testing

### Phase 27
Production deployment

---

# 70. IMPORTANT AI CODING RULE

Before implementing every module:

1. Analyze existing project structure.
2. Do not overwrite working functionality unnecessarily.
3. Reuse existing components.
4. Check existing database models.
5. Check API conventions.
6. Check authentication.
7. Implement backend first where business logic is involved.
8. Implement frontend afterward.
9. Test API.
10. Test UI.
11. Test mobile responsiveness.
12. Fix errors before moving to the next module.

Never replace the whole project simply to implement one feature.

---

# 71. TESTING

Create tests for critical functionality.

Test:

### Authentication
- Registration
- Login
- Invalid login
- Authorization

### GST
- CGST/SGST
- IGST
- Tax-inclusive
- Tax-exclusive
- Different GST rates

### Sales
- Invoice
- Partial payment
- Full payment
- Cancellation
- Credit note

### Purchase
- Purchase order
- Purchase bill
- Stock addition
- Debit note

### Inventory
- Stock IN
- Stock OUT
- Transfer
- Adjustment
- Low stock

### Permissions
Verify users cannot access unauthorized modules.

---

# 72. DEMO DATA

Create a seed script with realistic demo data:

```text
1 Business
3 Users
20 Customers
10 Suppliers
50 Products
5 Categories
2 Warehouses
20 Invoices
10 Purchase Bills
5 Quotations
5 Sales Orders
5 Purchase Orders
Payment records
Expense records
Stock movements
```

Use fictional data only.

---

# 73. PROJECT DOCUMENTATION

Create:

```text
README.md
API Documentation
Database Documentation
Environment Setup
Installation Guide
Production Deployment Guide
Backup Guide
Testing Guide
```

Document environment variables.

Example:

```env
PORT=
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_URL=
```

---

# 74. ENVIRONMENT SEPARATION

Support:

```text
.env.development
.env.production
```

Never commit secrets to Git.

Create:

```text
.env.example
```

---

# 75. PRODUCTION DEPLOYMENT

Prepare the application for VPS deployment.

Architecture:

```text
Internet
   ↓
Nginx
   ↓
React Frontend
   ↓
Node.js / Express API
   ↓
MongoDB
```

Use PM2 or an equivalent process manager for Node.js.

Configure:

- HTTPS
- Domain
- Reverse proxy
- Environment variables
- Logging
- Error handling
- MongoDB security
- Backup
- Compression

---

# 76. FINAL QUALITY REQUIREMENT

The final application should NOT look like a student project.

It must feel like a professional commercial SaaS product.

Prioritize:

1. Data correctness
2. GST/tax calculation correctness
3. Inventory correctness
4. Financial transaction integrity
5. Security
6. Responsive UX
7. Performance
8. Maintainability
9. Scalability
10. Professional UI

---

# 77. FIRST TASK

Before writing code:

1. Analyze the entire specification.
2. Create the complete project architecture.
3. Create frontend and backend folder structures.
4. Create MongoDB schema relationships.
5. Create API architecture.
6. Create authentication architecture.
7. Create RBAC architecture.
8. Create inventory transaction architecture.
9. Create financial transaction architecture.
10. Create GST/tax architecture.
11. Create module dependency map.
12. Create a development roadmap.

Then start with **Phase 1: Project Setup + Authentication + Business Setup**.

Do not move to the next phase until the current phase is functional and tested.

For every completed phase, provide:

```text
Implemented Features
Files Created
Files Modified
Database Models
API Endpoints
Frontend Pages
Testing Performed
Known Issues
Next Phase
```

Most importantly, **do not generate fake functionality**. If a feature is not implemented, clearly identify it as pending.

Build the system as a real production application, not as a UI prototype.
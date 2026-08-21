import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Dashboard & POS
import { Dashboard } from './pages/dashboard/Dashboard';
import { PosBilling } from './pages/pos/PosBilling';

// Sales Suite
import { Invoices } from './pages/sales/Invoices';
import { InvoiceCreate } from './pages/sales/InvoiceCreate';
import { Quotations } from './pages/sales/Quotations';
import { QuotationCreate } from './pages/sales/QuotationCreate';
import { SalesOrders } from './pages/sales/SalesOrders';
import { SalesOrderCreate } from './pages/sales/SalesOrderCreate';
import { DeliveryChallans } from './pages/sales/DeliveryChallans';
import { DeliveryChallanCreate } from './pages/sales/DeliveryChallanCreate';
import { SalesReturns } from './pages/sales/SalesReturns';
import { SalesReturnCreate } from './pages/sales/SalesReturnCreate';

// Purchase Suite
import { PurchaseBills } from './pages/purchases/PurchaseBills';
import { PurchaseBillCreate } from './pages/purchases/PurchaseBillCreate';
import { PurchaseOrders } from './pages/purchases/PurchaseOrders';
import { PurchaseOrderCreate } from './pages/purchases/PurchaseOrderCreate';
import { GoodsReceipts } from './pages/purchases/GoodsReceipts';
import { GoodsReceiptCreate } from './pages/purchases/GoodsReceiptCreate';
import { DebitNotes } from './pages/purchases/DebitNotes';
import { DebitNoteCreate } from './pages/purchases/DebitNoteCreate';

// Inventory Suite
import { Products } from './pages/inventory/Products';
import { StockSummary } from './pages/inventory/StockSummary';
import { StockMovements } from './pages/inventory/StockMovements';
import { StockAdjustments } from './pages/inventory/StockAdjustments';
import { StockTransfers } from './pages/inventory/StockTransfers';

// Contacts CRM
import { Customers } from './pages/contacts/Customers';
import { Suppliers } from './pages/contacts/Suppliers';

// Payments & Expenses
import { PaymentsList } from './pages/payments/PaymentsList';
import { Expenses } from './pages/payments/Expenses';

// Accounting & Banking
import { ChartOfAccounts } from './pages/accounting/ChartOfAccounts';
import { FinancialStatements } from './pages/accounting/FinancialStatements';

// Tax & Compliance
import { GSTOverview } from './pages/tax/GSTOverview';
import { TDSManagement } from './pages/tax/TDSManagement';

// Reports & Settings
import { ReportsHub } from './pages/reports/ReportsHub';
import { BusinessSettings } from './pages/settings/BusinessSettings';
import { MembersSettings } from './pages/settings/MembersSettings';
import { AuditLogs } from './pages/settings/AuditLogs';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected ERP Main Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pos" element={<PosBilling />} />

        {/* Sales Suite */}
        <Route path="sales/invoices" element={<Invoices />} />
        <Route path="sales/invoices/new" element={<InvoiceCreate />} />
        <Route path="sales/quotations" element={<Quotations />} />
        <Route path="sales/quotations/new" element={<QuotationCreate />} />
        <Route path="sales/orders" element={<SalesOrders />} />
        <Route path="sales/orders/new" element={<SalesOrderCreate />} />
        <Route path="sales/challans" element={<DeliveryChallans />} />
        <Route path="sales/challans/new" element={<DeliveryChallanCreate />} />
        <Route path="sales/returns" element={<SalesReturns />} />
        <Route path="sales/returns/new" element={<SalesReturnCreate />} />

        {/* Purchase Suite */}
        <Route path="purchases/bills" element={<PurchaseBills />} />
        <Route path="purchases/bills/new" element={<PurchaseBillCreate />} />
        <Route path="purchases/orders" element={<PurchaseOrders />} />
        <Route path="purchases/orders/new" element={<PurchaseOrderCreate />} />
        <Route path="purchases/grn" element={<GoodsReceipts />} />
        <Route path="purchases/grn/new" element={<GoodsReceiptCreate />} />
        <Route path="purchases/returns" element={<DebitNotes />} />
        <Route path="purchases/returns/new" element={<DebitNoteCreate />} />

        {/* Inventory Suite */}
        <Route path="inventory/products" element={<Products />} />
        <Route path="inventory/summary" element={<StockSummary />} />
        <Route path="inventory/movements" element={<StockMovements />} />
        <Route path="inventory/adjustments" element={<StockAdjustments />} />
        <Route path="inventory/transfers" element={<StockTransfers />} />

        {/* Contacts CRM */}
        <Route path="contacts/customers" element={<Customers />} />
        <Route path="contacts/suppliers" element={<Suppliers />} />

        {/* Payments & Expenses */}
        <Route path="payments" element={<PaymentsList />} />
        <Route path="payments/expenses" element={<Expenses />} />

        {/* Accounting */}
        <Route path="accounting/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="accounting/statements" element={<FinancialStatements />} />

        {/* Tax & Compliance */}
        <Route path="tax/gst" element={<GSTOverview />} />
        <Route path="tax/tds" element={<TDSManagement />} />

        {/* Reports & Settings */}
        <Route path="reports" element={<ReportsHub />} />
        <Route path="settings/business" element={<BusinessSettings />} />
        <Route path="settings/members" element={<MembersSettings />} />
        <Route path="settings/audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

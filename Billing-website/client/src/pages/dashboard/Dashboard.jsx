import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { InvoiceModal } from '../../components/InvoiceModal';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const Dashboard = () => {
  const { activeBusiness } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  // Preview modal state
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard?period=${period}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('[Dashboard Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const chartData = {
    labels: data?.charts?.labels || [],
    datasets: [
      {
        label: 'Sales Revenue (₹)',
        data: data?.charts?.sales || [],
        backgroundColor: '#4f46e5',
        hoverBackgroundColor: '#4338ca',
        borderRadius: 6,
        barThickness: 'flex',
        maxBarThickness: 32
      },
      {
        label: 'Purchases (₹)',
        data: data?.charts?.purchases || [],
        backgroundColor: '#cbd5e1',
        hoverBackgroundColor: '#94a3b8',
        borderRadius: 6,
        barThickness: 'flex',
        maxBarThickness: 32
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Plus Jakarta Sans', weight: '600', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans' },
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ₹${Number(context.raw).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { family: 'Plus Jakarta Sans', size: 11 },
          callback: (val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)
        }
      }
    }
  };

  const periodLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year'
  };

  return (
    <div className="dashboard-container">
      {/* 1. Dashboard Top Header - Responsive Stack on Mobile, Flex on Tablet/Desktop */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h4 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em' }}>
              Business Overview
            </h4>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-mono small">
              FY {activeBusiness?.currentFinancialYear || '2026-27'}
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Real-time analytics for <strong className="text-dark">{activeBusiness?.name || 'Your Business'}</strong>
          </p>
        </div>

        {/* Top Controls: Period Filter Scrollbar + Quick Action */}
        <div className="d-flex align-items-center gap-2 w-100 w-lg-auto justify-content-between justify-content-lg-end flex-wrap flex-sm-nowrap">
          {/* Scrollable Period Filter Pills */}
          <div className="period-filter-scroll">
            {['today', 'week', 'month', 'year'].map((p) => (
              <button
                key={p}
                type="button"
                className={`period-filter-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <div className="d-flex gap-2">
            <NavLink to="/pos" className="btn btn-outline-zenith btn-sm text-nowrap d-none d-sm-inline-flex">
              <i className="bi bi-lightning-charge-fill text-warning"></i> POS
            </NavLink>
            <NavLink to="/sales/invoices/new" className="btn btn-primary-zenith btn-sm text-nowrap">
              <i className="bi bi-plus-lg"></i> <span className="d-none d-sm-inline">New</span> Invoice
            </NavLink>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Shortcut Grid (Visible on all devices for fast access) */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-sm-6 col-md-3">
          <NavLink to="/pos" className="quick-action-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#f59e0b', width: '36px', height: '36px', minWidth: '36px', fontSize: '1.1rem' }}>
              <i className="bi bi-lightning-charge-fill"></i>
            </div>
            <div className="text-truncate">
              <div className="text-truncate" style={{ fontSize: '0.85rem' }}>POS Billing</div>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Fast Checkout</div>
            </div>
          </NavLink>
        </div>

        <div className="col-6 col-sm-6 col-md-3">
          <NavLink to="/sales/invoices/new" className="quick-action-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#eef2ff', color: '#4f46e5', width: '36px', height: '36px', minWidth: '36px', fontSize: '1.1rem' }}>
              <i className="bi bi-receipt"></i>
            </div>
            <div className="text-truncate">
              <div className="text-truncate" style={{ fontSize: '0.85rem' }}>GST Invoice</div>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>B2B / B2C Sale</div>
            </div>
          </NavLink>
        </div>

        <div className="col-6 col-sm-6 col-md-3">
          <NavLink to="/purchases/bills" className="quick-action-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#10b981', width: '36px', height: '36px', minWidth: '36px', fontSize: '1.1rem' }}>
              <i className="bi bi-receipt-cutoff"></i>
            </div>
            <div className="text-truncate">
              <div className="text-truncate" style={{ fontSize: '0.85rem' }}>Purchase Bill</div>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Add Inward Stock</div>
            </div>
          </NavLink>
        </div>

        <div className="col-6 col-sm-6 col-md-3">
          <NavLink to="/payments" className="quick-action-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef2f2', color: '#ef4444', width: '36px', height: '36px', minWidth: '36px', fontSize: '1.1rem' }}>
              <i className="bi bi-wallet2"></i>
            </div>
            <div className="text-truncate">
              <div className="text-truncate" style={{ fontSize: '0.85rem' }}>Collect Payment</div>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Customer Receipt</div>
            </div>
          </NavLink>
        </div>
      </div>

      {/* 3. Primary 4 KPI Stat Cards Grid (Mobile 2x2 or 1-col, Desktop 4-col) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="TOTAL SALES REVENUE"
            value={formatCurrency(data?.kpis?.totalSales)}
            subtitle={`${data?.kpis?.invoiceCount || 0} Invoices in ${periodLabels[period]}`}
            icon="bi-graph-up-arrow"
            iconBg="#eef2ff"
            iconColor="#4f46e5"
            trend={{ positive: true, text: `Active: ${periodLabels[period]}` }}
            badge="Sales"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="PAYMENT COLLECTIONS"
            value={formatCurrency(data?.kpis?.totalCollections)}
            subtitle="Cash & Bank received"
            icon="bi-cash-coin"
            iconBg="#ecfdf5"
            iconColor="#10b981"
            trend={{ positive: true, text: 'Realized funds' }}
            badge="Inflow"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="PENDING RECEIVABLES"
            value={formatCurrency(data?.kpis?.totalReceivables)}
            subtitle="Outstanding from Customers"
            icon="bi-clock-history"
            iconBg="#fef2f2"
            iconColor="#ef4444"
            badge={data?.kpis?.totalReceivables > 0 ? 'Action Req.' : 'Clear'}
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="TOTAL STOCK VALUATION"
            value={formatCurrency(data?.kpis?.totalStockValuation)}
            subtitle={
              data?.kpis?.lowStockCount > 0
                ? `⚠️ ${data?.kpis?.lowStockCount} items low in stock`
                : 'All items well-stocked'
            }
            icon="bi-boxes"
            iconBg="#fffbeb"
            iconColor="#f59e0b"
            badge="Inventory"
          />
        </div>
      </div>

      {/* 4. Secondary Metric Strip (Compact High-Density Metrics) */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <i className="bi bi-cart-plus"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>PURCHASES</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {formatCurrency(data?.kpis?.totalPurchases)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>EXPENSES</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {formatCurrency(data?.kpis?.totalExpenses)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#6366f1' }}>
              <i className="bi bi-calculator"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>GST OUTPUT TAX</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {formatCurrency(data?.kpis?.totalTaxCollected)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <i className="bi bi-credit-card-2-front"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>SUPPLIER PAYABLES</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                {formatCurrency(data?.kpis?.totalPayables)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Middle Section: Sales Trend Chart & Low Stock Widget */}
      <div className="row g-4 mb-4">
        {/* Left: Sales vs Purchases Interactive Trend Chart */}
        <div className="col-12 col-xl-8">
          <div className="card-zenith h-100 p-3 p-sm-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
              <div>
                <h6 className="fw-bold mb-0">Sales Revenue vs Purchases Trend</h6>
                <div className="text-muted small" style={{ fontSize: '0.78rem' }}>Last 6 Months Inflow vs Outflow Comparison</div>
              </div>
              <span className="badge bg-light text-muted border font-mono">Monthly Cashflow</span>
            </div>

            <div className="chart-container-responsive">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Right: Low Stock & Reorder Alerts Widget */}
        <div className="col-12 col-xl-4">
          <div className="card-zenith h-100 p-3 p-sm-4 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-danger d-flex align-items-center gap-1">
                <i className="bi bi-exclamation-triangle-fill"></i> Low Stock Alerts
              </h6>
              <NavLink to="/inventory/products" className="small text-primary text-decoration-none fw-bold">
                View Catalog
              </NavLink>
            </div>

            <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '280px' }}>
              {!data?.lowStockItems || data.lowStockItems.length === 0 ? (
                <div className="text-center py-4 text-muted small my-auto">
                  <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
                  <div className="fw-bold text-dark">Healthy Inventory!</div>
                  <div>All product stocks are above minimum alert thresholds.</div>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {data.lowStockItems.map((item) => (
                    <div key={item.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                      <div className="overflow-hidden me-2">
                        <div className="fw-bold small text-truncate" title={item.name}>{item.name}</div>
                        <div className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                          SKU: {item.sku || 'N/A'}
                        </div>
                      </div>
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold font-mono text-nowrap">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 mt-auto border-top text-center">
              <NavLink to="/purchases/bills" className="btn btn-outline-secondary btn-sm w-100" style={{ fontSize: '0.78rem' }}>
                <i className="bi bi-plus-circle me-1"></i> Order Stock from Supplier
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Bottom Section: Recent GST Invoices & Transactions (Responsive Table for Desktop + Cards for Mobile) */}
      <div className="card-zenith p-3 p-sm-4">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
          <div>
            <h6 className="fw-bold mb-0">Recent GST Sales Invoices</h6>
            <div className="text-muted small" style={{ fontSize: '0.78rem' }}>Latest finalized customer transactions</div>
          </div>
          <NavLink to="/sales/invoices" className="btn btn-outline-zenith btn-sm text-nowrap">
            View Full Sales Register <i className="bi bi-arrow-right ms-1"></i>
          </NavLink>
        </div>

        {/* Desktop & Tablet Table View (Hidden on mobile < 768px) */}
        <div className="table-responsive d-none d-md-block">
          <table className="table table-zenith mb-0">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-end">Amount (₹)</th>
                <th className="text-center">Payment Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data?.recentInvoices || data.recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No recent invoices created yet. Click "New Invoice" to create your first bill!
                  </td>
                </tr>
              ) : (
                data.recentInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <span className="fw-bold font-mono text-primary">#{inv.invoiceNo}</span>
                    </td>
                    <td className="small text-muted">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td className="fw-bold">{inv.customerNameSnapshot}</td>
                    <td className="text-end fw-bold font-mono">₹{inv.grandTotal?.toFixed(2)}</td>
                    <td className="text-center">
                      <span
                        className={`badge-status ${
                          inv.paymentStatus === 'paid'
                            ? 'badge-paid'
                            : inv.paymentStatus === 'partially_paid'
                            ? 'badge-partial'
                            : 'badge-unpaid'
                        }`}
                      >
                        {inv.paymentStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary py-0 px-2"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => {
                          setPreviewInvoice(inv);
                          setShowPreviewModal(true);
                        }}
                      >
                        <i className="bi bi-printer me-1"></i> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Touch-Friendly Card List (Visible on mobile < 768px) */}
        <div className="d-md-none border rounded overflow-hidden">
          {!data?.recentInvoices || data.recentInvoices.length === 0 ? (
            <div className="p-4 text-center text-muted small">
              No recent invoices created yet. Click "New Invoice" to create your first bill!
            </div>
          ) : (
            data.recentInvoices.map((inv) => (
              <div
                key={inv._id}
                className="mobile-invoice-card"
                onClick={() => {
                  setPreviewInvoice(inv);
                  setShowPreviewModal(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold font-mono text-primary">#{inv.invoiceNo}</span>
                  <span className="fw-bold font-mono fs-6 text-dark">₹{inv.grandTotal?.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="small fw-semibold text-truncate me-2">{inv.customerNameSnapshot}</div>
                  <span
                    className={`badge-status ${
                      inv.paymentStatus === 'paid'
                        ? 'badge-paid'
                        : inv.paymentStatus === 'partially_paid'
                        ? 'badge-partial'
                        : 'badge-unpaid'
                    }`}
                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                  >
                    {inv.paymentStatus?.toUpperCase()}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center small text-muted" style={{ fontSize: '0.72rem' }}>
                  <span>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</span>
                  <span className="text-primary fw-bold">Tap to Print / PDF <i className="bi bi-chevron-right"></i></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoice Preview & PDF Modal */}
      {showPreviewModal && previewInvoice && (
        <InvoiceModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          invoice={previewInvoice}
          business={activeBusiness}
        />
      )}
    </div>
  );
};

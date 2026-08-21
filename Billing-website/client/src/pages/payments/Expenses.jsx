import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const Expenses = () => {
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tdsSections, setTdsSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    categoryName: 'Office Rent',
    vendorName: '',
    vendorGSTIN: '',
    amount: 5000,
    taxRate: 0,
    tdsSectionId: '',
    paymentMode: 'bank',
    referenceNo: '',
    notes: ''
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/expenses');
      if (res.data.success) setExpenses(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    const loadMasters = async () => {
      try {
        const [catRes, tdsRes] = await Promise.allSettled([
          api.get('/payments/expenses/categories'),
          api.get('/tax/tds')
        ]);
        if (catRes.status === 'fulfilled' && catRes.value?.data?.success) {
          setCategories(catRes.value.data.data);
        }
        if (tdsRes.status === 'fulfilled' && tdsRes.value?.data?.success) {
          setTdsSections(tdsRes.value.data.data.sections || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadMasters();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      categoryName: categories[0]?.name || 'Office Rent',
      vendorName: '',
      vendorGSTIN: '',
      amount: 5000,
      taxRate: 0,
      tdsSectionId: '',
      paymentMode: 'bank',
      referenceNo: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      addToast('Please enter a valid expense amount', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/payments/expenses', formData);
      if (res.data.success) {
        addToast('Expense recorded & journal ledger posted!', 'success');
        setShowModal(false);
        fetchExpenses();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to record expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered Expenses
  const filteredExpenses = expenses.filter((e) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      e.expenseNo?.toLowerCase().includes(term) ||
      e.categoryName?.toLowerCase().includes(term) ||
      e.vendorName?.toLowerCase().includes(term) ||
      e.referenceNo?.toLowerCase().includes(term);
    const matchesCategory = !categoryFilter || e.categoryName === categoryFilter;
    const matchesMode = !modeFilter || e.paymentMode === modeFilter;
    return matchesSearch && matchesCategory && matchesMode;
  });

  // Top Metrics Calculation
  const totalGrossExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalNetPaid = expenses.reduce((sum, e) => sum + (Number(e.netPayable) || 0), 0);
  const totalTDSDeducted = expenses.reduce((sum, e) => sum + (Number(e.tdsAmount) || 0), 0);
  const totalEntriesCount = expenses.length;

  const columns = [
    {
      header: 'Expense #',
      accessor: 'expenseNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.expenseNo}</span>
          <div className="small text-muted">{new Date(row.date).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Category & Vendor',
      accessor: 'categoryName',
      render: (row) => (
        <div>
          <span className="badge bg-light text-dark border">{row.categoryName}</span>
          <div className="small text-muted mt-1">{row.vendorName || 'Direct Overhead'}</div>
        </div>
      )
    },
    {
      header: 'Payment Mode',
      accessor: 'paymentMode',
      render: (row) => (
        <div>
          <span className="badge bg-light text-muted border text-uppercase" style={{ fontSize: '0.68rem' }}>
            {row.paymentMode}
          </span>
          {row.referenceNo && (
            <div className="small text-muted font-mono mt-1" style={{ fontSize: '0.72rem' }}>
              Ref: {row.referenceNo}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Gross (₹)',
      accessor: 'amount',
      align: 'right',
      render: (row) => <span className="font-mono">₹{fmt(row.amount)}</span>
    },
    {
      header: 'TDS (₹)',
      accessor: 'tdsAmount',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-warning">
          {row.tdsAmount > 0 ? `-₹${fmt(row.tdsAmount)} (${row.tdsRate}%)` : '-'}
        </span>
      )
    },
    {
      header: 'Net Outflow (₹)',
      accessor: 'netPayable',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-danger">₹{fmt(row.netPayable)}</span>
    }
  ];

  return (
    <div className="expenses-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Business Expenses & Operating Costs
          </h4>
          <p className="text-muted small mb-0">
            Record overhead operating expenditures, track vendor payouts, and automate Section 194 TDS deductions
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0" onClick={handleOpenAdd}>
            <i className="bi bi-plus-lg"></i> Record Expense
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL OPERATING EXPENSES</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalGrossExpense)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <i className="bi bi-wallet2"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>NET OUTFLOW PAID</div>
              <div className="fw-bold font-mono text-truncate text-warning" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalNetPaid)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-shield-lock"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TDS DEDUCTED</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalTDSDeducted)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <i className="bi bi-receipt"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL EXPENSES</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalEntriesCount} Entries
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by expense #, category, vendor, ref #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-sm btn-link text-muted position-absolute end-0 top-0 p-1"
                  onClick={() => setSearch('')}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Expense Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="">All Payment Modes</option>
              <option value="bank">Bank Transfer / NEFT</option>
              <option value="upi">UPI / QR</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div className="col-12 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchExpenses}
              title="Refresh Expenses"
            >
              <i className="bi bi-arrow-clockwise"></i> <span className="d-md-none ms-1">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={filteredExpenses}
          loading={loading}
          emptyMessage="No expenses recorded"
          emptyIcon="bi-cash-stack"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-cash-stack fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Expenses Found</div>
            <div className="small">Click "Record Expense" to log your first business expenditure.</div>
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div key={exp._id} className="invoice-card-mobile">
              {/* Header */}
              <div className="invoice-card-mobile-header">
                <div>
                  <span className="fw-bold font-mono text-primary fs-6">#{exp.expenseNo}</span>
                  <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                    {new Date(exp.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="fw-extrabold font-mono fs-6 text-danger">
                  -₹{fmt(exp.netPayable)}
                </div>
              </div>

              {/* Category & Vendor */}
              <div className="mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-light text-dark border">{exp.categoryName}</span>
                  <span className="small text-dark fw-semibold">{exp.vendorName || 'Direct Expense'}</span>
                </div>
              </div>

              {/* Amounts Breakdown */}
              <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small">
                <div className="text-muted">
                  Gross: <span className="text-dark fw-bold">₹{fmt(exp.amount)}</span>
                </div>
                {exp.tdsAmount > 0 && (
                  <div className="text-warning fw-semibold">
                    TDS: -₹{fmt(exp.tdsAmount)}
                  </div>
                )}
                <span className="badge bg-light text-muted border text-uppercase" style={{ fontSize: '0.68rem' }}>
                  {exp.paymentMode}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div className="modal-header bg-light" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-cash-coin text-danger me-2"></i>
                  Record Business Expenditure
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleCreateExpense}>
                <div className="modal-body p-3 p-sm-4" style={{ background: '#f8fafc' }}>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Expense Category*</label>
                      <select
                        className="form-select fw-bold"
                        value={formData.categoryName}
                        onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Vendor / Service Provider Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Landlord, Electricity Board, Airtel"
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6 col-md-4">
                      <label className="form-label">Expense Amount (₹)*</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control font-mono fw-bold text-danger"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label">GST Tax Rate %</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                      >
                        <option value="0">0% (No GST)</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">TDS Section (Optional)</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.tdsSectionId}
                        onChange={(e) => setFormData({ ...formData, tdsSectionId: e.target.value })}
                      >
                        <option value="">No TDS Deduction</option>
                        {tdsSections.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.section} - {s.name} ({s.rate}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label">Payment Mode*</label>
                      <select
                        className="form-select fw-semibold"
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                        required
                      >
                        <option value="bank">Bank Transfer / NEFT</option>
                        <option value="upi">UPI / QR</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Transaction / Cheque Ref</label>
                      <input
                        type="text"
                        className="form-control font-mono"
                        placeholder="Ref No / UTR"
                        value={formData.referenceNo}
                        onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Notes / Purpose Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Expense justification, invoice ref..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-white">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm fw-bold" disabled={submitting}>
                    {submitting ? 'Posting...' : 'Post Expense & Ledger Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

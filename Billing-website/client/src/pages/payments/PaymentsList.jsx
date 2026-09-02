import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';
import { ExportButtons } from '../../components/ExportButtons';

export const PaymentsList = () => {
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    paymentType: 'in', // 'in' or 'out'
    partyId: '',
    amount: '',
    paymentMode: 'bank',
    date: new Date().toISOString().split('T')[0],
    referenceNo: '',
    notes: ''
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = '/payments';
      if (typeFilter) url += `?paymentType=${typeFilter}`;
      const res = await api.get(url);
      if (res.data.success) setPayments(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [typeFilter]);

  useEffect(() => {
    const loadParties = async () => {
      try {
        const [custRes, supRes] = await Promise.allSettled([
          api.get('/customers?limit=200'),
          api.get('/suppliers?limit=200')
        ]);
        if (custRes.status === 'fulfilled' && custRes.value?.data?.success) {
          setCustomers(custRes.value.data.data);
        }
        if (supRes.status === 'fulfilled' && supRes.value?.data?.success) {
          setSuppliers(supRes.value.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadParties();
  }, []);

  const handleOpenModal = (type) => {
    setFormData({
      paymentType: type,
      partyId: '',
      amount: '',
      paymentMode: 'bank',
      date: new Date().toISOString().split('T')[0],
      referenceNo: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!formData.partyId || !formData.amount || Number(formData.amount) <= 0) {
      addToast('Please select a party and enter a positive amount', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/payments', formData);
      if (res.data.success) {
        addToast(
          `Payment ${formData.paymentType === 'in' ? 'Receipt' : 'Voucher'} created & posted to ledger!`,
          'success'
        );
        setShowModal(false);
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to record payment', 'error');
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

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.paymentNo?.toLowerCase().includes(term) ||
      p.partyNameSnapshot?.toLowerCase().includes(term) ||
      p.referenceNo?.toLowerCase().includes(term);
    const matchesMode = !modeFilter || p.paymentMode === modeFilter;
    return matchesSearch && matchesMode;
  });

  // Top Metrics Calculation
  const totalInward = payments
    .filter((p) => p.paymentType === 'in')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalOutward = payments
    .filter((p) => p.paymentType === 'out')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const netFlow = totalInward - totalOutward;
  const totalTxCount = payments.length;

  const columns = [
    {
      header: 'Voucher #',
      accessor: 'paymentNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.paymentNo}</span>
          <div className="small text-muted">{new Date(row.date).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'paymentType',
      align: 'center',
      render: (row) => {
        const isIn = row.paymentType === 'in';
        return (
          <span
            className={`badge ${
              isIn
                ? 'bg-success-subtle text-success border border-success-subtle'
                : 'bg-danger-subtle text-danger border border-danger-subtle'
            } fw-bold`}
            style={{ fontSize: '0.72rem' }}
          >
            {isIn ? '+ RECEIPT (IN)' : '- PAYMENT (OUT)'}
          </span>
        );
      }
    },
    {
      header: 'Party Name',
      accessor: 'partyNameSnapshot',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.partyNameSnapshot}</div>
          <span className="badge bg-light text-muted border text-capitalize" style={{ fontSize: '0.68rem' }}>
            {row.partyType}
          </span>
        </div>
      )
    },
    {
      header: 'Payment Mode',
      accessor: 'paymentMode',
      render: (row) => (
        <div>
          <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '0.72rem' }}>
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
      header: 'Amount (₹)',
      accessor: 'amount',
      align: 'right',
      render: (row) => (
        <span
          className={`fw-bold font-mono fs-6 ${row.paymentType === 'in' ? 'text-success' : 'text-danger'}`}
        >
          {row.paymentType === 'in' ? '+' : '-'}₹{fmt(row.amount)}
        </span>
      )
    }
  ];

  return (
    <div className="payments-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Payment Receipts & Outward Vouchers
          </h4>
          <p className="text-muted small mb-0">
            Record customer receipts, vendor supplier disbursements, and track double-entry cash flow
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center flex-wrap">
          <ExportButtons
            filename="Payments_Register"
            title="Payment Receipts & Outward Vouchers"
            headers={['Payment #', 'Date', 'Type', 'Party Name', 'Party Type', 'Amount (Rs)', 'Unallocated (Rs)', 'Payment Mode', 'Reference No', 'Status']}
            data={filteredPayments.map((p) => [
              p.paymentNo,
              new Date(p.date).toLocaleDateString('en-IN'),
              p.paymentType === 'in' ? 'RECEIPT (IN)' : 'PAYMENT (OUT)',
              p.partyNameSnapshot || p.partyId?.name || 'Party',
              p.partyType?.toUpperCase() || '-',
              p.amount || 0,
              p.unallocatedAmount || 0,
              p.paymentMode?.toUpperCase() || 'BANK',
              p.referenceNo || '-',
              p.status?.toUpperCase()
            ])}
          />
          <button
            className="btn btn-success btn-sm flex-fill flex-sm-grow-0 text-nowrap"
            onClick={() => handleOpenModal('in')}
          >
            <i className="bi bi-arrow-down-left-circle me-1"></i> + Payment In
          </button>
          <button
            className="btn btn-danger btn-sm flex-fill flex-sm-grow-0 text-nowrap"
            onClick={() => handleOpenModal('out')}
          >
            <i className="bi bi-arrow-up-right-circle me-1"></i> - Payment Out
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-arrow-down-left"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>INWARD RECEIPTS (IN)</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                +₹{fmt(totalInward)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-arrow-up-right"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>OUTWARD PAYMENTS (OUT)</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                -₹{fmt(totalOutward)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>NET CASH BALANCE</div>
              <div className={`fw-bold font-mono text-truncate ${netFlow >= 0 ? 'text-primary' : 'text-danger'}`} style={{ fontSize: '0.95rem' }}>
                {netFlow >= 0 ? `+₹${fmt(netFlow)}` : `-₹${fmt(Math.abs(netFlow))}`}
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL TRANSACTIONS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalTxCount} Vouchers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by voucher #, party name, ref #..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Voucher Types</option>
              <option value="in">Receipts (Payment In)</option>
              <option value="out">Disbursements (Payment Out)</option>
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
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div className="col-12 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchPayments}
              title="Refresh Payments"
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
          data={filteredPayments}
          loading={loading}
          emptyMessage="No payment transactions recorded"
          emptyIcon="bi-wallet2"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-wallet2 fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Payments Found</div>
            <div className="small">Record a customer receipt or vendor payment to log transactions.</div>
          </div>
        ) : (
          filteredPayments.map((pm) => {
            const isIn = pm.paymentType === 'in';

            return (
              <div key={pm._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div>
                    <span className="fw-bold font-mono text-primary fs-6">#{pm.paymentNo}</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                      {new Date(pm.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className={`fw-extrabold font-mono fs-6 ${isIn ? 'text-success' : 'text-danger'}`}>
                    {isIn ? '+' : '-'}₹{fmt(pm.amount)}
                  </div>
                </div>

                {/* Party & Mode */}
                <div className="mb-2">
                  <div className="fw-bold text-dark small">{pm.partyNameSnapshot}</div>
                  <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                    <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '0.68rem' }}>
                      {pm.paymentMode}
                    </span>
                    <span className="badge bg-light text-muted border text-capitalize" style={{ fontSize: '0.68rem' }}>
                      {pm.partyType}
                    </span>
                    {pm.referenceNo && (
                      <span className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                        Ref: {pm.referenceNo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
              <div className="modal-header bg-light px-3 px-sm-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h5 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2">
                    <i className={`bi ${formData.paymentType === 'in' ? 'bi-arrow-down-left-circle text-success' : 'bi-arrow-up-right-circle text-danger'}`}></i>
                    {formData.paymentType === 'in' ? 'Record Payment In (Receipt)' : 'Record Payment Out (Disbursement)'}
                  </h5>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    {formData.paymentType === 'in' ? 'Customer receivable collection receipt' : 'Vendor supplier payable disbursement voucher'}
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleCreatePayment}>
                <div className="modal-body p-3 p-sm-4" style={{ background: '#f8fafc', maxHeight: 'calc(80vh - 120px)' }}>
                  <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      1. Party & Settlement Amount
                    </div>

                    {/* Select Customer / Supplier */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold mb-1">
                        {formData.paymentType === 'in' ? 'Select Customer (Payee)*' : 'Select Supplier (Vendor)*'}
                      </label>
                      <select
                        className="form-select form-select-sm fw-bold"
                        value={formData.partyId}
                        onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                        required
                      >
                        <option value="">
                          {formData.paymentType === 'in' ? '-- Choose Customer --' : '-- Choose Supplier --'}
                        </option>
                        {formData.paymentType === 'in'
                          ? customers.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name} {c.businessName ? `(${c.businessName})` : ''} - Due: ₹{fmt(c.currentBalance)}
                              </option>
                            ))
                          : suppliers.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name} {s.companyName ? `(${s.companyName})` : ''} - Payable: ₹{fmt(s.currentBalance)}
                              </option>
                            ))}
                      </select>
                    </div>

                    {/* Party Balance Callout */}
                    {(() => {
                      const selectedParty = formData.paymentType === 'in'
                        ? customers.find((c) => c._id === formData.partyId)
                        : suppliers.find((s) => s._id === formData.partyId);

                      if (selectedParty) {
                        const currentBal = selectedParty.currentBalance || 0;
                        const payAmt = Number(formData.amount) || 0;
                        const projectedBal = Math.max(0, currentBal - payAmt);

                        return (
                          <div className="p-2 mb-3 bg-light rounded border small font-mono d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ fontSize: '0.75rem' }}>
                            <div>
                              <span className="text-muted">Current Balance:</span>{' '}
                              <strong className={currentBal > 0 ? 'text-danger' : 'text-success'}>₹{fmt(currentBal)}</strong>
                            </div>
                            {currentBal > 0 && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary py-0 px-2 fw-semibold"
                                style={{ fontSize: '0.72rem' }}
                                onClick={() => setFormData({ ...formData, amount: currentBal })}
                              >
                                Settle Full (₹{fmt(currentBal)})
                              </button>
                            )}
                            {payAmt > 0 && (
                              <div className="w-100 pt-1 border-top text-muted d-flex justify-content-between">
                                <span>Projected Balance:</span>
                                <strong className="text-dark">₹{fmt(projectedBal)}</strong>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Amount & Mode */}
                    <div className="row g-2 g-sm-3">
                      <div className="col-6">
                        <label className="form-label small fw-bold mb-1">Payment Amount (₹)*</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm font-mono fw-bold text-primary"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold mb-1">Payment Mode*</label>
                        <select
                          className="form-select form-select-sm fw-semibold"
                          value={formData.paymentMode}
                          onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                          required
                        >
                          <option value="bank">Bank Transfer / NEFT</option>
                          <option value="upi">UPI / QR</option>
                          <option value="cash">Cash</option>
                          <option value="cheque">Cheque</option>
                          <option value="card">Card</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="card p-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      2. Date & References
                    </div>

                    {/* Date & Ref */}
                    <div className="row g-2 g-sm-3 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Transaction Date*</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Reference / UTR #</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono"
                          placeholder="e.g. UTR-98214"
                          value={formData.referenceNo}
                          onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Remarks / Notes</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Payment settlement details, invoice references..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-white d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 p-3 border-top">
                  <button type="button" className="btn btn-outline-secondary btn-sm w-100 w-sm-auto text-nowrap" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-sm w-100 w-sm-auto text-nowrap fw-bold ${formData.paymentType === 'in' ? 'btn-success' : 'btn-danger'}`}
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Recording...'
                      : formData.paymentType === 'in'
                      ? 'Save Payment In Receipt'
                      : 'Save Payment Out Voucher'}
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

import React, { useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

export const PaymentModal = ({ isOpen, onClose, invoice, onPaymentSuccess }) => {
  const { addToast } = useToast();
  const [amount, setAmount] = useState(invoice?.balanceAmount || 0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      addToast('Please enter a valid payment amount', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/payments', {
        paymentType: 'in',
        partyId: invoice.customerId?._id || invoice.customerId,
        amount: Number(amount),
        paymentMode,
        referenceNo,
        notes: notes || `Payment for Invoice #${invoice.invoiceNo}`,
        allocations: [
          {
            documentType: 'invoice',
            documentId: invoice._id,
            amount: Number(amount)
          }
        ]
      });

      if (res.data.success) {
        addToast('Payment recorded and allocated successfully!', 'success');
        if (onPaymentSuccess) onPaymentSuccess();
        onClose();
      }
    } catch (err) {
      console.error('[Payment Error]:', err);
      addToast(err.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '14px' }}>
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-wallet2 text-success me-2"></i> Record Payment Receipt
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="bg-light p-3 rounded mb-3 border">
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">Invoice No:</span>
                  <strong>{invoice.invoiceNo}</strong>
                </div>
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">Customer:</span>
                  <strong>{invoice.customerNameSnapshot}</strong>
                </div>
                <div className="d-flex justify-content-between small">
                  <span className="text-muted">Balance Due:</span>
                  <strong className="text-danger">₹{invoice.balanceAmount?.toFixed(2)}</strong>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Payment Amount (₹)*</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-lg font-mono fw-bold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={invoice.balanceAmount}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Payment Mode*</label>
                <select
                  className="form-select"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="cash">Cash in Hand</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="bank">Bank Transfer / NEFT / RTGS</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Transaction / Reference No</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. UPI Ref, UTR No, Cheque No"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Notes / Remarks</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Optional payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-zenith" disabled={submitting}>
                {submitting ? 'Recording...' : 'Record Payment Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

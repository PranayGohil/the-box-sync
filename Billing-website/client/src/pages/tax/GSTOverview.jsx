import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const GSTOverview = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [reconciling, setReconciling] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState(null);

  const fetchGST = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/gst-summary');
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load GST summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGST();
  }, []);

  const handleSimulateReconciliation = async () => {
    setReconciling(true);
    try {
      // Simulate external GSTR-2B records
      const sampleExternal = [
        {
          gstin: '27AAAAA1111A1Z1',
          supplierName: 'Sony Distributorship India Ltd',
          invoiceNo: 'INV-9982',
          invoiceValue: 54000,
          taxableValue: 45762.71,
          totalTax: 8237.29
        }
      ];

      const res = await api.post('/tax/gst-reconcile', {
        returnPeriod: '042026',
        externalRecords: sampleExternal
      });

      if (res.data.success) {
        setReconciliationResult(res.data.data);
        addToast('GSTR-2B Reconciliation completed!', 'success');
      }
    } catch (err) {
      addToast('Failed to run reconciliation', 'error');
    } finally {
      setReconciling(false);
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="gst-compliance-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            GST Compliance & Tax Returns (GSTR-1 / 3B)
          </h4>
          <p className="text-muted small mb-0">
            Live Output GST vs Input ITC calculations, B2B/B2C schedules, HSN summaries, and 2B reconciliation
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button className="btn btn-outline-secondary btn-sm flex-fill flex-sm-grow-0" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Print / Export
          </button>
          <button className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0" onClick={fetchGST}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* 2. Responsive Segmented Tab Selector */}
      <div className="card-zenith p-2 mb-4">
        <div className="d-flex overflow-auto gap-1" style={{ whiteSpace: 'nowrap' }}>
          <button
            className={`btn btn-sm flex-fill ${
              activeTab === 'summary'
                ? 'btn-primary text-white fw-bold shadow-sm'
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setActiveTab('summary')}
          >
            <i className="bi bi-calculator me-1"></i> GSTR-3B Summary & ITC
          </button>
          <button
            className={`btn btn-sm flex-fill ${
              activeTab === 'gstr1'
                ? 'btn-primary text-white fw-bold shadow-sm'
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setActiveTab('gstr1')}
          >
            <i className="bi bi-table me-1"></i> GSTR-1 (Outward Supplies)
          </button>
          <button
            className={`btn btn-sm flex-fill ${
              activeTab === 'reconcile'
                ? 'btn-primary text-white fw-bold shadow-sm'
                : 'btn-outline-secondary bg-white text-dark'
            }`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setActiveTab('reconcile')}
          >
            <i className="bi bi-arrow-repeat me-1"></i> GSTR-2B Auto-Reconciliation
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="small text-muted mt-2">Computing GST tax liabilities & ITC registers...</div>
        </div>
      ) : (
        <>
          {/* --- 1. GSTR-3B SUMMARY & COMPONENT BREAKDOWN --- */}
          {activeTab === 'summary' && data && (
            <div>
              {/* Top 3 Executive Cards */}
              <div className="row g-2 mb-4">
                <div className="col-12 col-md-4">
                  <div className="card-zenith p-3 p-sm-4 border-primary">
                    <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      OUTPUT GST (TAX ON SALES)
                    </div>
                    <div className="fs-3 fw-extrabold text-primary font-mono my-1">
                      ₹{fmt(data.gstr3b?.outputTaxTotal)}
                    </div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Total tax collected from customer invoices
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="card-zenith p-3 p-sm-4 border-success">
                    <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      ELIGIBLE INPUT TAX CREDIT (ITC)
                    </div>
                    <div className="fs-3 fw-extrabold text-success font-mono my-1">
                      ₹{fmt(data.gstr3b?.inputITCTotal)}
                    </div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Input GST on purchases & business expenses
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="card-zenith p-3 p-sm-4 border-danger">
                    <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                      NET GST PAYABLE IN CASH
                    </div>
                    <div className="fs-3 fw-extrabold text-danger font-mono my-1">
                      ₹{fmt(data.gstr3b?.netGstPayable)}
                    </div>
                    <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                      Net government cash liability after ITC set-off
                    </div>
                  </div>
                </div>
              </div>

              {/* Table 3.1 & Table 4 Breakdown Card */}
              <div className="card-zenith p-3 p-sm-4">
                <h6 className="fw-bold mb-3 text-dark">
                  <i className="bi bi-grid-3x3 text-primary me-2"></i>
                  Table 3.1 & Table 4 - Component Tax Liability & Credit Register
                </h6>

                {/* Desktop View */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ width: '40%' }}>Component Details</th>
                        <th style={{ width: '15%' }} className="text-end">IGST (Integrated)</th>
                        <th style={{ width: '15%' }} className="text-end">CGST (Central)</th>
                        <th style={{ width: '15%' }} className="text-end">SGST (State)</th>
                        <th style={{ width: '15%' }} className="text-end">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-bold text-primary">3.1 Outward Taxable Supplies (Output)</td>
                        <td className="text-end font-mono">₹{fmt(data.gstr3b?.igstOutput)}</td>
                        <td className="text-end font-mono">₹{fmt(data.gstr3b?.cgstOutput)}</td>
                        <td className="text-end font-mono">₹{fmt(data.gstr3b?.sgstOutput)}</td>
                        <td className="text-end font-mono fw-bold text-primary">
                          ₹{fmt(data.gstr3b?.outputTaxTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-success">4. Eligible ITC (Input Credit Claim)</td>
                        <td className="text-end font-mono">₹{fmt(data.gstr3b?.igstInput)}</td>
                        <td className="text-end font-mono">₹{fmt(data.gstr3b?.cgstInput)}</td>
                        <td className="text-end font-mono">₹{fmt(data.gstr3b?.sgstInput)}</td>
                        <td className="text-end font-mono fw-bold text-success">
                          ₹{fmt(data.gstr3b?.inputITCTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="d-md-none">
                  {/* Outward Mobile Card */}
                  <div className="p-3 mb-3 bg-light rounded border">
                    <div className="fw-bold text-primary small mb-2">3.1 Outward Taxable Supplies (Output)</div>
                    <div className="d-flex justify-content-between py-1 font-mono small">
                      <span className="text-muted">IGST:</span>
                      <span>₹{fmt(data.gstr3b?.igstOutput)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 font-mono small">
                      <span className="text-muted">CGST:</span>
                      <span>₹{fmt(data.gstr3b?.cgstOutput)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 font-mono small">
                      <span className="text-muted">SGST:</span>
                      <span>₹{fmt(data.gstr3b?.sgstOutput)}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-2 border-top fw-bold font-mono">
                      <span>Total Output:</span>
                      <span className="text-primary">₹{fmt(data.gstr3b?.outputTaxTotal)}</span>
                    </div>
                  </div>

                  {/* ITC Mobile Card */}
                  <div className="p-3 bg-light rounded border">
                    <div className="fw-bold text-success small mb-2">4. Eligible ITC (Input Credit Claim)</div>
                    <div className="d-flex justify-content-between py-1 font-mono small">
                      <span className="text-muted">IGST:</span>
                      <span>₹{fmt(data.gstr3b?.igstInput)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 font-mono small">
                      <span className="text-muted">CGST:</span>
                      <span>₹{fmt(data.gstr3b?.cgstInput)}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 font-mono small">
                      <span className="text-muted">SGST:</span>
                      <span>₹{fmt(data.gstr3b?.sgstInput)}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-2 border-top fw-bold font-mono">
                      <span>Total ITC:</span>
                      <span className="text-success">₹{fmt(data.gstr3b?.inputITCTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- 2. GSTR-1 OUTWARD SUPPLIES & HSN --- */}
          {activeTab === 'gstr1' && data && (
            <div>
              {/* Section Summary Tiles */}
              <div className="row g-2 mb-4">
                <div className="col-4">
                  <div className="metric-tile p-2 p-sm-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>4A - B2B INVOICES</div>
                      <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                        {data.gstr1?.b2b?.length || 0} Invoices
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-4">
                  <div className="metric-tile p-2 p-sm-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>7 - B2C RETAIL SALES</div>
                      <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                        {data.gstr1?.b2cs?.length || 0} Invoices
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-4">
                  <div className="metric-tile p-2 p-sm-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL TAXABLE</div>
                      <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                        ₹{fmt(data.gstr1?.totalTaxableValue)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HSN Summary */}
              <div className="card-zenith p-3 p-sm-4">
                <h6 className="fw-bold mb-3 text-dark">
                  <i className="bi bi-upc-scan text-primary me-2"></i>
                  Table 12 - HSN/SAC Outward Summary
                </h6>

                {/* Desktop View Table */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th>HSN / SAC Code</th>
                        <th>Description</th>
                        <th className="text-center">UQC</th>
                        <th className="text-center">Total Qty</th>
                        <th className="text-end">Taxable Value (₹)</th>
                        <th className="text-end">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!data.gstr1?.hsnSummary || data.gstr1?.hsnSummary.length === 0) ? (
                        <tr><td colSpan="6" className="text-center text-muted py-3">No HSN entries recorded</td></tr>
                      ) : (
                        data.gstr1.hsnSummary.map((h, idx) => (
                          <tr key={idx}>
                            <td className="font-mono fw-bold text-primary">{h.hsnSacCode}</td>
                            <td>{h.description}</td>
                            <td className="text-center">{h.uqc}</td>
                            <td className="text-center font-mono">{h.totalQuantity}</td>
                            <td className="text-end font-mono">₹{fmt(h.totalTaxableValue)}</td>
                            <td className="text-end font-mono fw-bold text-primary">₹{fmt(h.totalTax)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="d-md-none">
                  {(!data.gstr1?.hsnSummary || data.gstr1?.hsnSummary.length === 0) ? (
                    <div className="text-center text-muted py-4">No HSN entries found</div>
                  ) : (
                    data.gstr1.hsnSummary.map((h, idx) => (
                      <div key={idx} className="invoice-card-mobile">
                        <div className="invoice-card-mobile-header">
                          <span className="font-mono fw-bold text-primary fs-6">HSN: {h.hsnSacCode}</span>
                          <span className="fw-extrabold font-mono text-dark">₹{fmt(h.totalTaxableValue)}</span>
                        </div>
                        <div className="small text-dark mb-1">{h.description}</div>
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small text-muted">
                          <span>Qty: {h.totalQuantity} {h.uqc}</span>
                          <span>Tax: <strong className="text-primary">₹{fmt(h.totalTax)}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- 3. GSTR-2B RECONCILIATION --- */}
          {activeTab === 'reconcile' && (
            <div className="card-zenith p-3 p-sm-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
                <div>
                  <h6 className="fw-bold mb-1 text-dark">
                    <i className="bi bi-arrow-repeat text-primary me-2"></i>
                    GSTR-2B vs Purchase Register Automatic Reconciler
                  </h6>
                  <p className="text-muted small mb-0">
                    Match supplier uploaded invoices with internal purchase books to claim maximum ITC without notice
                  </p>
                </div>
                <button
                  className="btn btn-primary-zenith btn-sm text-nowrap w-100 w-sm-auto"
                  onClick={handleSimulateReconciliation}
                  disabled={reconciling}
                >
                  <i className="bi bi-play-fill me-1"></i> {reconciling ? 'Running Matching...' : 'Run Auto-Reconciliation'}
                </button>
              </div>

              {reconciliationResult ? (
                <div>
                  {/* 3 Result Metric Tiles */}
                  <div className="row g-2 mb-4">
                    <div className="col-4">
                      <div className="p-2 p-sm-3 bg-success-subtle text-success rounded text-center border border-success-subtle">
                        <div className="small fw-bold" style={{ fontSize: '0.72rem' }}>MATCHED INVOICES</div>
                        <div className="fs-4 fw-bold font-mono">{reconciliationResult.matchedCount}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 p-sm-3 bg-warning-subtle text-warning-emphasis rounded text-center border border-warning-subtle">
                        <div className="small fw-bold" style={{ fontSize: '0.72rem' }}>AMOUNT MISMATCHES</div>
                        <div className="fs-4 fw-bold font-mono">{reconciliationResult.mismatchCount}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 p-sm-3 bg-danger-subtle text-danger rounded text-center border border-danger-subtle">
                        <div className="small fw-bold" style={{ fontSize: '0.72rem' }}>MISSING IN BOOKS</div>
                        <div className="fs-4 fw-bold font-mono">{reconciliationResult.missingInBooksCount}</div>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold small mb-2 text-dark">Reconciliation Line Items:</h6>

                  {/* Desktop Table */}
                  <div className="table-responsive border rounded d-none d-md-block">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="bg-light">
                        <tr style={{ fontSize: '0.78rem' }}>
                          <th>Supplier GSTIN</th>
                          <th>Invoice #</th>
                          <th className="text-end">Taxable (₹)</th>
                          <th className="text-end">Tax (₹)</th>
                          <th className="text-center">Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconciliationResult.items?.map((it, idx) => (
                          <tr key={idx}>
                            <td className="font-mono">{it.gstin}</td>
                            <td className="font-mono fw-bold text-primary">#{it.invoiceNo}</td>
                            <td className="font-mono text-end">₹{fmt(it.taxableValue)}</td>
                            <td className="font-mono text-end">₹{fmt(it.totalTax)}</td>
                            <td className="text-center">
                              <span className={`badge ${it.status === 'MATCHED' ? 'bg-success' : 'bg-danger'}`}>
                                {it.status}
                              </span>
                            </td>
                            <td className="small text-muted">{it.discrepancyDetails || 'Fully reconciled'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Touch Cards */}
                  <div className="d-md-none">
                    {reconciliationResult.items?.map((it, idx) => (
                      <div key={idx} className="invoice-card-mobile">
                        <div className="invoice-card-mobile-header">
                          <span className="font-mono fw-bold text-primary fs-6">#{it.invoiceNo}</span>
                          <span className={`badge ${it.status === 'MATCHED' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.68rem' }}>
                            {it.status}
                          </span>
                        </div>
                        <div className="small font-mono text-muted mb-1">GSTIN: {it.gstin}</div>
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small">
                          <span>Taxable: <strong>₹{fmt(it.taxableValue)}</strong></span>
                          <span>Tax: <strong>₹{fmt(it.totalTax)}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-file-earmark-diff fs-1 d-block mb-2 text-primary opacity-50"></i>
                  <div className="fw-bold">Ready to Reconcile</div>
                  <div className="small">Click "Run Auto-Reconciliation" above to compare GSTR-2B portal data with your purchase bills.</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

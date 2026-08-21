import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';

export const ReportsHub = () => {
  const { addToast } = useToast();
  const [activeReport, setActiveReport] = useState('sales_register');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeReport === 'sales_register') {
        const res = await api.get('/reports/sales-register');
        if (res.data.success) setData(res.data.data);
      } else if (activeReport === 'purchase_register') {
        const res = await api.get('/reports/purchase-register');
        if (res.data.success) setData(res.data.data);
      } else if (activeReport === 'stock_valuation') {
        const res = await api.get('/reports/stock-valuation');
        if (res.data.success) setData(res.data.data);
      } else if (activeReport === 'receivables_aging') {
        const res = await api.get('/reports/receivables-aging');
        if (res.data.success) setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleExportExcel = () => {
    try {
      let exportRows = [];
      let filename = 'Report.xlsx';

      if (activeReport === 'sales_register') {
        exportRows =
          data?.invoices?.map((i) => ({
            'Invoice No': i.invoiceNo,
            Date: new Date(i.invoiceDate).toLocaleDateString('en-IN'),
            Customer: i.customerNameSnapshot,
            GSTIN: i.customerGSTINSnapshot || 'B2C',
            'Taxable Value': i.taxableAmount,
            'Total Tax': i.totalTax,
            'Grand Total': i.grandTotal,
            Paid: i.paidAmount,
            Balance: i.balanceAmount
          })) || [];
        filename = 'Sales_Register.xlsx';
      } else if (activeReport === 'purchase_register') {
        exportRows =
          data?.bills?.map((b) => ({
            'Bill No': b.billNo,
            Date: new Date(b.billDate).toLocaleDateString('en-IN'),
            Supplier: b.supplierNameSnapshot,
            GSTIN: b.supplierGSTINSnapshot || 'Unregistered',
            'Taxable Value': b.taxableAmount,
            'Total Tax': b.totalTax,
            'Grand Total': b.grandTotal,
            Paid: b.paidAmount,
            Balance: b.balanceAmount
          })) || [];
        filename = 'Purchase_Register.xlsx';
      } else if (activeReport === 'stock_valuation') {
        exportRows =
          data?.items?.map((item) => ({
            Product: item.productName,
            SKU: item.sku,
            Warehouse: item.warehouseName,
            'Quantity on Hand': item.quantity,
            'Unit Cost': item.unitCost,
            'Total Valuation': item.totalValue
          })) || [];
        filename = 'Stock_Valuation_Report.xlsx';
      } else if (activeReport === 'receivables_aging') {
        exportRows =
          data?.items?.map((item) => ({
            'Invoice No': item.invoiceNo,
            Date: new Date(item.invoiceDate).toLocaleDateString('en-IN'),
            Customer: item.customerName,
            'Grand Total': item.grandTotal,
            'Outstanding Balance': item.balanceAmount,
            'Days Overdue': item.daysOverdue,
            'Aging Bucket': item.bucket
          })) || [];
        filename = 'Customer_Receivables_Aging.xlsx';
      }

      if (exportRows.length === 0) {
        addToast('No data available to export', 'warning');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
      XLSX.writeFile(wb, filename);

      addToast(`Exported ${filename} successfully!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to export Excel file', 'error');
    }
  };

  return (
    <div className="reports-hub-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Reports & Analytics Hub
          </h4>
          <p className="text-muted small mb-0">
            Exportable statutory registers, inventory valuations, and debtor aging analyses
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button
            className="btn btn-success btn-sm flex-fill flex-sm-grow-0 d-flex align-items-center justify-content-center gap-2"
            onClick={handleExportExcel}
          >
            <i className="bi bi-file-earmark-spreadsheet-fill"></i> Export Excel (.xlsx)
          </button>
          <button
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 d-flex align-items-center justify-content-center gap-1"
            onClick={fetchReport}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* 2. Responsive Segmented Report Selector */}
      <div className="card-zenith p-2 mb-4">
        <div className="d-flex overflow-auto gap-1" style={{ whiteSpace: 'nowrap' }}>
          {[
            { id: 'sales_register', label: 'Sales Register', icon: 'bi-receipt' },
            { id: 'purchase_register', label: 'Purchase Register', icon: 'bi-receipt-cutoff' },
            { id: 'stock_valuation', label: 'Stock Valuation', icon: 'bi-boxes' },
            { id: 'receivables_aging', label: 'Receivables Aging', icon: 'bi-clock-history' }
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              className={`btn btn-sm flex-fill ${
                activeReport === r.id
                  ? 'btn-primary text-white fw-bold shadow-sm'
                  : 'btn-outline-secondary bg-white text-dark'
              }`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => setActiveReport(r.id)}
            >
              <i className={`bi ${r.icon} me-1`}></i> {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="small text-muted mt-2">Computing report analytics...</div>
        </div>
      ) : (
        <div>
          {/* --- 1. SALES REGISTER --- */}
          {activeReport === 'sales_register' && data && (
            <div>
              {/* 3 Metric Tiles */}
              <div className="row g-2 mb-4">
                <div className="col-12 col-md-4">
                  <div className="metric-tile p-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>TAXABLE TURNOVER</div>
                      <div className="fs-5 fw-bold font-mono text-dark">₹{fmt(data.summary?.totalTaxable)}</div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="metric-tile p-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>GST COLLECTED</div>
                      <div className="fs-5 fw-bold font-mono text-primary">₹{fmt(data.summary?.totalTax)}</div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="metric-tile p-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>GROSS SALES VOLUME</div>
                      <div className="fs-5 fw-bold font-mono text-success">₹{fmt(data.summary?.grandTotal)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="card-zenith p-3 p-sm-4 d-none d-md-block">
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Customer Name</th>
                        <th className="text-end">Taxable (₹)</th>
                        <th className="text-end">Total Tax (₹)</th>
                        <th className="text-end">Grand Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.invoices?.map((i) => (
                        <tr key={i._id}>
                          <td className="font-mono fw-bold text-primary">#{i.invoiceNo}</td>
                          <td>{new Date(i.invoiceDate).toLocaleDateString('en-IN')}</td>
                          <td className="fw-bold">{i.customerNameSnapshot}</td>
                          <td className="text-end font-mono">₹{fmt(i.taxableAmount)}</td>
                          <td className="text-end font-mono">₹{fmt(i.totalTax)}</td>
                          <td className="text-end font-mono fw-bold text-dark">₹{fmt(i.grandTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Touch Cards */}
              <div className="d-md-none">
                {data.invoices?.map((i) => (
                  <div key={i._id} className="invoice-card-mobile">
                    <div className="invoice-card-mobile-header">
                      <div>
                        <span className="fw-bold font-mono text-primary fs-6">#{i.invoiceNo}</span>
                        <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                          {new Date(i.invoiceDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="fw-extrabold font-mono fs-6 text-dark">
                        ₹{fmt(i.grandTotal)}
                      </div>
                    </div>
                    <div className="small fw-bold text-dark mb-2">{i.customerNameSnapshot}</div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small text-muted">
                      <span>Taxable: <strong>₹{fmt(i.taxableAmount)}</strong></span>
                      <span>GST: <strong>₹{fmt(i.totalTax)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- 2. PURCHASE REGISTER --- */}
          {activeReport === 'purchase_register' && data && (
            <div>
              {/* 3 Metric Tiles */}
              <div className="row g-2 mb-4">
                <div className="col-12 col-md-4">
                  <div className="metric-tile p-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>TAXABLE PURCHASES</div>
                      <div className="fs-5 fw-bold font-mono text-dark">₹{fmt(data.summary?.totalTaxable)}</div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="metric-tile p-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>INPUT GST / ITC</div>
                      <div className="fs-5 fw-bold font-mono text-success">₹{fmt(data.summary?.totalTax)}</div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="metric-tile p-3">
                    <div className="overflow-hidden">
                      <div className="text-muted small" style={{ fontSize: '0.72rem' }}>GROSS INWARD PROCUREMENT</div>
                      <div className="fs-5 fw-bold font-mono text-primary">₹{fmt(data.summary?.grandTotal)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="card-zenith p-3 p-sm-4 d-none d-md-block">
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th>Bill #</th>
                        <th>Date</th>
                        <th>Supplier Name</th>
                        <th className="text-end">Taxable (₹)</th>
                        <th className="text-end">Total ITC (₹)</th>
                        <th className="text-end">Grand Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bills?.map((b) => (
                        <tr key={b._id}>
                          <td className="font-mono fw-bold text-primary">#{b.billNo}</td>
                          <td>{new Date(b.billDate).toLocaleDateString('en-IN')}</td>
                          <td className="fw-bold">{b.supplierNameSnapshot}</td>
                          <td className="text-end font-mono">₹{fmt(b.taxableAmount)}</td>
                          <td className="text-end font-mono text-success">₹{fmt(b.totalTax)}</td>
                          <td className="text-end font-mono fw-bold text-dark">₹{fmt(b.grandTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="d-md-none">
                {data.bills?.map((b) => (
                  <div key={b._id} className="invoice-card-mobile">
                    <div className="invoice-card-mobile-header">
                      <div>
                        <span className="fw-bold font-mono text-primary fs-6">#{b.billNo}</span>
                        <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                          {new Date(b.billDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="fw-extrabold font-mono fs-6 text-dark">
                        ₹{fmt(b.grandTotal)}
                      </div>
                    </div>
                    <div className="small fw-bold text-dark mb-2">{b.supplierNameSnapshot}</div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small text-muted">
                      <span>Taxable: <strong>₹{fmt(b.taxableAmount)}</strong></span>
                      <span>ITC: <strong className="text-success">₹{fmt(b.totalTax)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- 3. STOCK VALUATION --- */}
          {activeReport === 'stock_valuation' && data && (
            <div className="card-zenith p-3 p-sm-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3 pb-3 border-bottom">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-boxes text-primary me-2"></i>
                  Total Closing Inventory Valuation:
                </h6>
                <span className="fs-4 fw-extrabold text-primary font-mono">
                  ₹{fmt(data.totalValuation)}
                </span>
              </div>

              {/* Desktop Table */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="bg-light">
                    <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                      <th>Product</th>
                      <th>Warehouse</th>
                      <th className="text-center">Stock on Hand</th>
                      <th className="text-end">Unit Cost (₹)</th>
                      <th className="text-end">Total Valuation (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold text-dark">{item.productName}</td>
                        <td>
                          <span className="badge bg-light text-dark border">{item.warehouseName}</span>
                        </td>
                        <td className="text-center font-mono fw-bold">{item.quantity}</td>
                        <td className="text-end font-mono">₹{fmt(item.unitCost)}</td>
                        <td className="text-end font-mono fw-bold text-primary">₹{fmt(item.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="d-md-none">
                {data.items?.map((item, idx) => (
                  <div key={idx} className="invoice-card-mobile">
                    <div className="invoice-card-mobile-header">
                      <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                        {item.productName}
                      </div>
                      <div className="fw-extrabold font-mono fs-6 text-primary">
                        ₹{fmt(item.totalValue)}
                      </div>
                    </div>
                    <div className="small text-muted font-mono mb-2">{item.warehouseName}</div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small">
                      <span>Stock: <strong>{item.quantity} Units</strong></span>
                      <span>Unit Cost: <strong>₹{fmt(item.unitCost)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- 4. RECEIVABLES AGING --- */}
          {activeReport === 'receivables_aging' && data && (
            <div>
              {/* 4 Bucket Cards */}
              <div className="row g-2 mb-4">
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-success-subtle text-success rounded text-center border border-success-subtle">
                    <div className="small fw-bold" style={{ fontSize: '0.72rem' }}>0-30 DAYS</div>
                    <div className="fs-5 font-mono fw-bold">₹{fmt(data.bucket0_30)}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-primary-subtle text-primary rounded text-center border border-primary-subtle">
                    <div className="small fw-bold" style={{ fontSize: '0.72rem' }}>31-60 DAYS</div>
                    <div className="fs-5 font-mono fw-bold">₹{fmt(data.bucket31_60)}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-warning-subtle text-warning-emphasis rounded text-center border border-warning-subtle">
                    <div className="small fw-bold" style={{ fontSize: '0.72rem' }}>61-90 DAYS</div>
                    <div className="fs-5 font-mono fw-bold">₹{fmt(data.bucket61_90)}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-danger-subtle text-danger rounded text-center border border-danger-subtle">
                    <div className="small fw-bold" style={{ fontSize: '0.72rem' }}>90+ DAYS OVERDUE</div>
                    <div className="fs-5 font-mono fw-bold">₹{fmt(data.bucket90_plus)}</div>
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="card-zenith p-3 p-sm-4 d-none d-md-block">
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Customer Name</th>
                        <th>Aging Bucket</th>
                        <th className="text-center">Days Overdue</th>
                        <th className="text-end">Balance Due (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-mono fw-bold text-primary">#{item.invoiceNo}</td>
                          <td>{new Date(item.invoiceDate).toLocaleDateString('en-IN')}</td>
                          <td className="fw-bold">{item.customerName}</td>
                          <td>
                            <span className="badge bg-light text-dark border">{item.bucket}</span>
                          </td>
                          <td className="text-center font-mono text-danger fw-bold">{item.daysOverdue} days</td>
                          <td className="text-end font-mono fw-bold text-danger">₹{fmt(item.balanceAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="d-md-none">
                {data.items?.map((item, idx) => (
                  <div key={idx} className="invoice-card-mobile">
                    <div className="invoice-card-mobile-header">
                      <div>
                        <span className="fw-bold font-mono text-primary fs-6">#{item.invoiceNo}</span>
                        <span className="badge bg-light text-dark border ms-2" style={{ fontSize: '0.68rem' }}>
                          {item.bucket}
                        </span>
                      </div>
                      <div className="fw-extrabold font-mono fs-6 text-danger">
                        ₹{fmt(item.balanceAmount)}
                      </div>
                    </div>
                    <div className="small fw-bold text-dark mb-1">{item.customerName}</div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small">
                      <span className="text-muted">{new Date(item.invoiceDate).toLocaleDateString('en-IN')}</span>
                      <span className="text-danger fw-bold">{item.daysOverdue} days overdue</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

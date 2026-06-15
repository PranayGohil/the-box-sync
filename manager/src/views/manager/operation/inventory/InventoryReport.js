import React, { useState, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getDailyReport, exportDailyReportExcel } from 'api/inventory';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const customStyles = `
    .inventory-container {
      background: #f8fafc;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .page-card {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02) !important;
      overflow: hidden;
    }
    .modern-input {
      border-radius: 12px !important;
      padding: 0.8rem 1.25rem !important;
      border: 1.5px solid #e2e8f0 !important;
      font-weight: 600 !important;
      color: #334155 !important;
      transition: all 0.3s ease !important;
      background: #fcfdfe !important;
      height: 48px !important;
    }
    .modern-input:focus {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
      background: #ffffff !important;
    }
    .section-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .sh-5 {
      width: 44px !important;
      height: 44px !important;
      border-radius: 12px !important;
    }
    .table {
      border-collapse: separate !important;
      border-spacing: 0 10px !important;
    }
    .table thead th {
      border: none !important;
      background: transparent !important;
      color: #64748b !important;
      font-weight: 700 !important;
      font-size: 0.85rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      padding: 0.75rem 1.5rem !important;
    }
    .table tbody tr {
      transition: all 0.2s ease-in-out !important;
    }
    .table tbody tr:hover {
      transform: translateY(-2px);
    }
    .table tbody td {
      background: #ffffff !important;
      border-top: 1px solid #f1f5f9 !important;
      border-bottom: 1px solid #f1f5f9 !important;
      padding: 1.25rem 1.5rem !important;
      vertical-align: middle !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01) !important;
    }
    .table tbody tr td:first-child {
      border-left: 1px solid #f1f5f9 !important;
      border-top-left-radius: 1rem !important;
      border-bottom-left-radius: 1rem !important;
    }
    .table tbody tr td:last-child {
      border-right: 1px solid #f1f5f9 !important;
      border-top-right-radius: 1rem !important;
      border-bottom-right-radius: 1rem !important;
    }
    .inventory-container .btn {
      transition: all 0.2s ease-in-out !important;
    }
    .inventory-container .btn:hover {
      transform: translateY(-2px) !important;
    }
    .inventory-container .btn:not(.btn-sm) {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 10px 28px !important;
      height: 48px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      font-size: 0.95rem !important;
    }
    .inventory-container .btn.btn-sm {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 6px 16px !important;
      height: 36px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-size: 0.85rem !important;
    }
    .inventory-container .btn-primary {
      background-color: #23b3f4 !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
    }
    .inventory-container .btn-primary:hover {
      background-color: #179edb !important;
      border-color: #179edb !important;
      box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
    }
    .inventory-container .btn-outline-primary {
      border: 1px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #ffffff !important;
    }
    .inventory-container .btn-outline-primary:hover {
      background-color: #23b3f4 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .inventory-container .btn-outline-primary:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-container .btn-outline-danger {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background-color: #ffffff !important;
    }
    .inventory-container .btn-outline-danger:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
    .inventory-container .btn-outline-danger:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-container .btn-outline-warning {
      border: 1px solid #f59e0b !important;
      color: #f59e0b !important;
      background-color: #ffffff !important;
    }
    .inventory-container .btn-outline-warning:hover {
      background-color: #f59e0b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25) !important;
    }
    .inventory-container .btn-outline-warning:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-container .btn-outline-secondary {
      border: 1px solid #64748b !important;
      color: #64748b !important;
      background-color: #ffffff !important;
    }
    .inventory-container .btn-outline-secondary:hover {
      background-color: #64748b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
    }
    .inventory-container .btn-outline-secondary:hover svg {
      stroke: #ffffff !important;
    }
`;

const PRESETS = [
  { label: 'Today', getValue: () => ({ from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Yesterday', getValue: () => ({ from: format(subDays(new Date(), 1), 'yyyy-MM-dd'), to: format(subDays(new Date(), 1), 'yyyy-MM-dd') }) },
  { label: 'This Week', getValue: () => ({ from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') }) },
  { label: 'Last 7 Days', getValue: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'This Month', getValue: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
];

const InventoryReport = () => {
  const title = 'Inventory Report';
  const description = 'Daily inventory usage, wastage, and reorder suggestions.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/inventory-report', text: 'Inventory' },
    { to: 'operations/inventory-report', title: 'Inventory Report' },
  ];

  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activePreset, setActivePreset] = useState('Last 7 Days');

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDailyReport({ from: fromDate, to: toDate });
      if (res.data.success) setReportData(res.data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const applyPreset = (preset) => {
    const { from, to } = preset.getValue();
    setFromDate(from);
    setToDate(to);
    setActivePreset(preset.label);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportDailyReportExcel({ from: fromDate, to: toDate });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Report_${fromDate}_to_${toDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const typeColors = { expired: 'danger', spillage: 'info', damaged: 'warning', overcook: 'secondary', theft: 'dark', other: 'light' };

  return (
    <div className="inventory-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-4 pt-4">
          <Row className="g-3 align-items-center">
            <Col lg="7">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

      {/* Date Filter */}
      <Card className="page-card border-0 mb-4 shadow-sm">
        <Card.Body className="p-4">
          <Row className="g-2 align-items-end">
            <Col xs={12} className="mb-2">
              <div className="d-flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant={activePreset === p.label ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => applyPreset(p)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </Col>
            <Col md={3}>
              <Form.Label className="text-muted small fw-bold">From Date</Form.Label>
              <Form.Control type="date" className="modern-input" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setActivePreset('Custom'); }} />
            </Col>
            <Col md={3}>
              <Form.Label className="text-muted small fw-bold">To Date</Form.Label>
              <Form.Control type="date" className="modern-input" value={toDate} onChange={(e) => { setToDate(e.target.value); setActivePreset('Custom'); }} />
            </Col>
            <Col md="auto" className="d-flex gap-2">
              <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={fetchReport} disabled={loading} style={{ height: '45px' }}>
                <CsLineIcons icon="sync" className="me-2" size="14" />
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              {reportData && (
                <Button variant="outline-success" className="rounded-pill px-4 fw-bold border-2" onClick={handleExport} disabled={exporting} style={{ height: '45px' }}>
                  <CsLineIcons icon="download" className="me-2" size="14" />
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {!loading && reportData && (
        <>
          {/* Summary Cards */}
          <Row className="mb-4 g-3">
            {[
              { label: 'Total Received', value: reportData.summary.total_received, color: 'primary', icon: 'boxes' },
              { label: 'Total Used', value: reportData.summary.total_used, color: 'success', icon: 'check-circle' },
              { label: 'Total Wasted', value: reportData.summary.total_wasted, color: 'danger', icon: 'bin' },
              { label: 'Current Stock Items', value: reportData.summary.total_current_stock, color: 'warning', icon: 'layers' },
            ].map((c) => (
              <Col key={c.label} lg={3} md={6}>
                <Card className="page-card border-0 h-100 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="text-muted small">{c.label}</div>
                        <div className={`h3 mb-0 text-${c.color}`}>{c.value ?? 0}</div>
                      </div>
                      <div className={`sh-5 sw-5 bg-${c.color} rounded-xl d-flex justify-content-center align-items-center`}>
                        <CsLineIcons icon={c.icon} className="text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Low Stock Alert */}
          {reportData.summary.low_stock_items > 0 && (
            <Alert variant="warning" className="mb-4 d-flex align-items-center gap-2">
              <CsLineIcons icon="warning-hexagon" size="20" />
              <strong>{reportData.summary.low_stock_items} items are below their low stock threshold.</strong>
              <span className="ms-1 text-muted">Check the reorder section below.</span>
            </Alert>
          )}

          {/* Item Summary Table */}
          <Card className="page-card border-0 mb-4 shadow-sm">
            <Card.Header className="bg-white border-bottom p-4">
              <h6 className="mb-0 fw-bold">Item-wise Summary</h6>
              <small className="text-muted">Received vs Used vs Wasted vs Current Stock for the selected period</small>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-uppercase text-muted text-small ps-3">Item</th>
                    <th className="text-uppercase text-muted text-small">Unit</th>
                    <th className="text-uppercase text-muted text-small text-primary">Received</th>
                    <th className="text-uppercase text-muted text-small text-success">Used</th>
                    <th className="text-uppercase text-muted text-small text-danger">Wasted</th>
                    <th className="text-uppercase text-muted text-small">Current Stock</th>
                    <th className="text-uppercase text-muted text-small">Wastage %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.itemSummary.map((item) => (
                    <tr key={item.item_name} className={item.wastage_percent > 20 ? 'table-danger' : ''}>
                      <td className="align-middle fw-semibold ps-3">{item.item_name}</td>
                      <td className="align-middle text-muted">{item.unit || '—'}</td>
                      <td className="align-middle text-primary fw-bold">{item.received}</td>
                      <td className="align-middle text-success fw-bold">{item.used}</td>
                      <td className="align-middle text-danger fw-bold">{item.wasted}</td>
                      <td className="align-middle fw-bold">{item.current_stock}</td>
                      <td className="align-middle">
                        {item.wastage_percent > 0 ? (
                          <Badge bg={item.wastage_percent > 20 ? 'danger' : item.wastage_percent > 10 ? 'warning' : 'success'}>
                            {item.wastage_percent}%
                          </Badge>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Wastage Pattern */}
          {reportData.wastagePattern?.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">
                  <CsLineIcons icon="bin" className="me-2" size="16" />
                  Wastage Pattern Summary
                  <small className="text-muted ms-2 fw-normal">Items wasted most in this period</small>
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase text-muted text-small ps-3">Item</th>
                      <th className="text-uppercase text-muted text-small">Unit</th>
                      <th className="text-uppercase text-muted text-small">Total Used</th>
                      <th className="text-uppercase text-muted text-small">Total Wasted</th>
                      <th className="text-uppercase text-muted text-small">Wastage %</th>
                      <th className="text-uppercase text-muted text-small">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.wastagePattern.map((item) => (
                      <tr key={item.item_name}>
                        <td className="align-middle fw-semibold ps-3">{item.item_name}</td>
                        <td className="align-middle text-muted">{item.unit || '—'}</td>
                        <td className="align-middle">{item.used}</td>
                        <td className="align-middle text-danger fw-bold">{item.wasted}</td>
                        <td className="align-middle">
                          <Badge bg={item.wastage_percent > 20 ? 'danger' : 'warning'}>
                            {item.wastage_percent}%
                          </Badge>
                        </td>
                        <td className="align-middle">{item.current_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Reorder Suggestions */}
          {reportData.reorderSuggestions?.filter((s) => s.needs_reorder || s.is_below_threshold).length > 0 && (
            <Card className="mb-4">
              <Card.Header className="bg-warning bg-opacity-10">
                <h6 className="mb-0">
                  <CsLineIcons icon="notification" className="me-2 text-warning" size="16" />
                  Smart Reorder Suggestions
                  <small className="text-muted ms-2 fw-normal">Items that may run out soon (based on last 7 days usage)</small>
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase text-muted text-small ps-3">Item</th>
                      <th className="text-uppercase text-muted text-small">Current Stock</th>
                      <th className="text-uppercase text-muted text-small">Avg Daily Use</th>
                      <th className="text-uppercase text-muted text-small">Days Until Stockout</th>
                      <th className="text-uppercase text-muted text-small">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.reorderSuggestions
                      .filter((s) => s.needs_reorder || s.is_below_threshold)
                      .map((item) => (
                        <tr key={item.item_name} className={item.days_until_stockout !== null && item.days_until_stockout <= 1 ? 'table-danger' : 'table-warning'}>
                          <td className="align-middle fw-semibold ps-3">{item.item_name}</td>
                          <td className="align-middle fw-bold">
                            {item.current_stock} {item.unit}
                            {item.is_below_threshold && <Badge bg="danger" className="ms-2">Below Min</Badge>}
                          </td>
                          <td className="align-middle">{item.avg_daily_usage} {item.unit}/day</td>
                          <td className="align-middle">
                            {item.days_until_stockout !== null ? (
                              <span className={item.days_until_stockout <= 1 ? 'text-danger fw-bold' : 'text-warning fw-bold'}>
                                ~{item.days_until_stockout} days
                              </span>
                            ) : '—'}
                          </td>
                          <td className="align-middle">
                            <Badge bg={item.days_until_stockout !== null && item.days_until_stockout <= 1 ? 'danger' : 'warning'}>
                              {item.days_until_stockout !== null && item.days_until_stockout <= 1 ? '🚨 Urgent' : '⚠ Reorder Soon'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {!loading && !reportData && (
        <Alert variant="light" className="text-center py-5">
          <CsLineIcons icon="chart-2" size="40" className="text-muted mb-3 d-block mx-auto" />
          <h5 className="text-muted">Select a date range and click Generate Report</h5>
        </Alert>
      )}
    </div>
  </div>
  );
};

export default InventoryReport;

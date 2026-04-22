import React, { useState, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getDailyReport, exportDailyReportExcel } from 'api/inventory';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

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
    <>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <Row className="g-0">
          <Col className="col-auto mb-3 mb-sm-0 me-auto">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {/* Date Filter */}
      <Card className="mb-4">
        <Card.Body>
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
              <Form.Label className="text-muted small">From Date</Form.Label>
              <Form.Control type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setActivePreset('Custom'); }} />
            </Col>
            <Col md={3}>
              <Form.Label className="text-muted small">To Date</Form.Label>
              <Form.Control type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setActivePreset('Custom'); }} />
            </Col>
            <Col md="auto" className="d-flex gap-2">
              <Button variant="primary" onClick={fetchReport} disabled={loading}>
                <CsLineIcons icon="sync" className="me-1" size="14" />
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
              {reportData && (
                <Button variant="success" onClick={handleExport} disabled={exporting}>
                  <CsLineIcons icon="download" className="me-1" size="14" />
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
                <Card className={`border-${c.color}`}>
                  <Card.Body>
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
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Item-wise Summary</h6>
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
    </>
  );
};

export default InventoryReport;

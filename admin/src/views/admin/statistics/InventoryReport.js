import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Col, Row, Card, Form, Spinner, Badge, ProgressBar, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getDailyReport, exportDailyReportExcel } from 'api/inventory';
import axios from 'axios';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Re-using the FilterSelect from MenuPerformanceReport for perfectly responsive mobile dropdowns
const FilterSelect = ({ value, onChange, options, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="filter-select" ref={ref}>
      <div className={`filter-select-value ${disabled ? 'disabled' : ''}`} onClick={() => !disabled && setOpen(!open)}>
        {selected ? selected.label : 'Select...'}
        <CsLineIcons icon="chevron-down" size="14" />
      </div>
      {open && (
        <div className="filter-select-options">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`filter-select-option${opt.value === value ? ' is-selected' : ''}${opt.disabled ? ' is-disabled' : ''}`}
              onMouseDown={(e) => {
                if (opt.disabled) return;
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
              onTouchEnd={(e) => {
                if (opt.disabled) return;
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const customStyles = `
    .interactive-card {
      background: rgba(255, 255, 255, 0.98) !important;
      backdrop-filter: blur(15px) !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(255, 255, 255, 0.8) !important;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05) !important;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
      overflow: hidden;
      position: relative;
    }
    .interactive-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px -10px rgba(35, 179, 244, 0.15) !important;
      border-color: rgba(35, 179, 244, 0.4) !important;
    }
    .filter-card {
      overflow: visible !important;
      z-index: 10 !important;
    }
    .card-title-container {
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
      border-bottom: 1.5px solid rgba(35, 179, 244, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .stat-card-inner {
      background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(35, 179, 244, 0.02) 100%);
    }
    .custom-btn-outline {
      background: #ffffff !important;
      border: 1.5px solid #23b3f4 !important;
      color: #23b3f4 !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 700 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .custom-btn-outline:hover {
      background: #23b3f4 !important;
      color: #ffffff !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(35, 179, 244, 0.2) !important;
    }
    .preset-pill {
      border-radius: 50px !important;
      padding: 0.35rem 1rem !important;
      font-weight: 700 !important;
      font-size: 0.75rem !important;
      border-width: 1.5px !important;
      margin-right: 0.4rem;
      margin-bottom: 0.4rem;
    }
    .stat-label {
      font-size: 0.7rem !important;
      font-weight: 800 !important;
      color: #64748b !important;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .stat-value {
      font-size: 1.8rem !important;
      font-weight: 900 !important;
      color: #0f172a !important;
      line-height: 1;
    }
    .form-control {
      border-radius: 0.8rem !important;
      padding: 0.6rem 1rem !important;
      border: 1.5px solid rgba(0,0,0,0.05) !important;
      background: rgba(0,0,0,0.01) !important;
      font-weight: 600 !important;
    }
    .data-table thead th {
      background: #f8fafc !important;
      color: #475569 !important;
      font-size: 0.7rem !important;
      font-weight: 800 !important;
      text-transform: uppercase;
      border: none !important;
      padding: 1rem !important;
    }
    
    /* FilterSelect CSS */
    .filter-select {
      position: relative;
      width: 100%;
    }
    .filter-select-value {
      border-radius: 0.8rem !important;
      padding: 0.6rem 1rem !important;
      border: 1.5px solid rgba(0,0,0,0.05) !important;
      background: rgba(0,0,0,0.01) !important;
      font-weight: 600 !important;
      color: #495057;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 42px;
      user-select: none;
    }
    .filter-select-value.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: rgba(0,0,0,0.03) !important;
    }
    .filter-select-options {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: #ffffff;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 0.8rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      z-index: 9999;
      max-height: 250px;
      overflow-y: auto;
      padding: 0.5rem 0;
    }
    .filter-select-option {
      padding: 0.6rem 1rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      color: #495057;
      transition: background 0.2s;
    }
    .filter-select-option:hover {
      background: rgba(35, 179, 244, 0.05);
      color: #23b3f4;
    }
    .filter-select-option.is-selected {
      background: rgba(35, 179, 244, 0.1);
      color: #23b3f4;
    }
    .filter-select-option.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .filter-select-option.is-disabled:hover {
      background: none;
      color: inherit;
    }
`;

const PRESETS = [
  { label: 'Today', getValue: () => ({ from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: '7 Days', getValue: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  {
    label: 'Week',
    getValue: () => ({
      from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }),
  },
  { label: '30 Days', getValue: () => ({ from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Month', getValue: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
];

const InventoryReport = () => {
  const title = 'Unified Inventory Hub';
  const brandColor = '#23b3f4';
  const brandBg = 'rgba(35, 179, 244, 0.08)';

  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activePreset, setActivePreset] = useState('7 Days');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const API_BASE = process.env.REACT_APP_API;
  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchUnifiedReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = { period: 'custom', start_date: fromDate, end_date: toDate };
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedCategory !== 'all') params.category = selectedCategory;

      const [resOper, resStats] = await Promise.all([
        getDailyReport({ from: fromDate, to: toDate }),
        axios.get(`${API_BASE}/statistics/inventory`, { ...getHeaders(), params }),
      ]);

      if (resOper.data.success) setReportData(resOper.data);
      if (resStats.data) setStatsData(resStats.data);
    } catch (err) {
      toast.error('Failed to load unified intelligence');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedStatus, selectedCategory, API_BASE]);

  useEffect(() => {
    fetchUnifiedReport();
  }, [fetchUnifiedReport]);

  useEffect(() => {
    const cleanup = () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
    if (!reportData?.chartData?.length || !chartRef.current) return cleanup;
    cleanup();

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: reportData.chartData.map((d) => format(new Date(d.date), 'dd MMM')),
        datasets: [
          { label: 'Purchased', data: reportData.chartData.map((d) => d.purchased || 0), backgroundColor: '#3b82f6', borderRadius: 6 },
          { label: 'Used', data: reportData.chartData.map((d) => d.used || 0), backgroundColor: '#10b981', borderRadius: 6 },
          { label: 'Wasted', data: reportData.chartData.map((d) => d.wasted || 0), backgroundColor: '#ef4444', borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top', labels: { usePointStyle: true, font: { weight: 'bold', size: 11 } } } },
        scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } },
      },
    });
    return cleanup;
  }, [reportData]);

  const applyPreset = (preset) => {
    const { from, to } = preset.getValue();
    setFromDate(from);
    setToDate(to);
    setActivePreset(preset.label);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await exportDailyReportExcel({ from: fromDate, to: toDate });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Intelligence.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Excel exported');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  const statusOptions = ['all', 'Completed', 'Pending', 'Partially Paid'].map((s) => ({ value: s, label: s === 'all' ? 'All' : s }));
  const categoryOptions = ['all', ...new Set(statsData?.categoryPerformance?.map((c) => c.category) || [])].map((c) => ({
    value: c,
    label: c === 'all' ? 'All' : c,
  }));

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} />

      <div className="page-title-container mb-4 mt-5 mt-lg-0 no-print">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>
              {title}
            </h1>
            <BreadcrumbList
              items={[
                { to: '', text: 'Home' },
                { to: 'statistics', text: 'Statistics' },
                { to: 'reports/inventory', text: 'Unified Hub' },
              ]}
            />
          </Col>
        </Row>
      </div>

      {/* Hub Filters */}
      <Card className="interactive-card filter-card border-0 mb-4 no-print shadow-sm">
        <Card.Body className="p-4">
          <div className="card-title-container">
            <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
              Intelligence Parameters
            </h2>
            <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
          </div>

          <div className="d-flex flex-wrap mb-4">
            {PRESETS.map((p) => (
              <Button key={p.label} variant={activePreset === p.label ? 'primary' : 'outline-primary'} className="preset-pill" onClick={() => applyPreset(p)}>
                {p.label}
              </Button>
            ))}
          </div>

          <Row className="g-3">
            <Col xs={12} md={3}>
              <Form.Label className="stat-label mb-2">Start Date</Form.Label>
              <Form.Control
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActivePreset('Custom');
                }}
              />
            </Col>
            <Col xs={12} md={3}>
              <Form.Label className="stat-label mb-2">End Date</Form.Label>
              <Form.Control
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActivePreset('Custom');
                }}
              />
            </Col>
            <Col xs={12} md={2}>
              <Form.Label className="stat-label mb-2">Status</Form.Label>
              <FilterSelect value={selectedStatus} onChange={setSelectedStatus} options={statusOptions} />
            </Col>
            <Col xs={12} md={2}>
              <Form.Label className="stat-label mb-2">Category</Form.Label>
              <FilterSelect value={selectedCategory} onChange={setSelectedCategory} options={categoryOptions} />
            </Col>
            <Col xs={12} md={2} className="d-flex align-items-end">
              <Button className="custom-btn-outline w-100" onClick={fetchUnifiedReport} disabled={loading}>
                <CsLineIcons icon="sync" className={`me-2 ${loading ? 'spin' : ''}`} size="15" />
                {loading ? 'Processing...' : 'Generate Hub'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Action Bar */}
      <Card className="interactive-card border-0 mb-4 no-print shadow-sm">
        <Card.Body className="p-4 d-flex justify-content-between align-items-center">
          <div className="d-flex gap-3 align-items-center">
            <Button variant="outline-success" className="custom-btn-outline border-success text-success" onClick={handleExportExcel} disabled={exporting}>
              <CsLineIcons icon="file-text" className="me-2" size="15" /> Excel
            </Button>
            <Button variant="outline-danger" className="custom-btn-outline border-danger text-danger" onClick={() => window.print()} disabled={!reportData}>
              <CsLineIcons icon="file-text" className="me-2" size="15" /> PDF
            </Button>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      ) : reportData && statsData ? (
        <>
          {/* KPI Section 1: Operations */}
          <h2 className="small-title mt-4 mb-3" style={{ color: brandColor, fontWeight: '800' }}>
            Operational Performance Metrics
          </h2>
          <Row className="mb-4 g-4">
            {[
              { label: 'Received', value: reportData.summary.total_received, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: 'boxes' },
              { label: 'Used', value: reportData.summary.total_used, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: 'check-circle' },
              { label: 'Wasted', value: reportData.summary.total_wasted, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: 'bin' },
              { label: 'Stock On Hand', value: reportData.summary.total_current_stock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: 'archive' },
            ].map((c) => (
              <Col key={c.label} xl="3" md="6" xs="12">
                <Card className="interactive-card border-0 h-100 shadow-sm">
                  <Card.Body className="p-4 stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="stat-label mb-2">{c.label}</div>
                        <div className="stat-value" style={{ color: c.color }}>
                          {c.value}
                        </div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: c.bg }}>
                        <CsLineIcons icon={c.icon} size="24" style={{ color: c.color }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* KPI Section 2: Financials */}
          <h2 className="small-title mt-4 mb-3" style={{ color: brandColor, fontWeight: '800' }}>
            Financial Procurement Analytics
          </h2>
          <Row className="mb-4 g-4">
            {[
              {
                label: 'Total Investment',
                value: formatCurrency(statsData.summary.totalAmount),
                color: '#3b82f6',
                bg: 'rgba(59, 130, 246, 0.1)',
                icon: 'wallet',
              },
              {
                label: 'Unpaid Dues',
                value: formatCurrency(statsData.summary.totalUnpaid),
                color: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.1)',
                icon: 'credit-card',
              },
              { label: 'Payment Rate', value: `${statsData.summary.paymentRate}%`, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: 'activity' },
              { label: 'Avg PO Value', value: formatCurrency(statsData.summary.avgPurchaseValue), color: '#23b3f4', bg: brandBg, icon: 'trend-up' },
            ].map((c) => (
              <Col key={c.label} xl="3" md="6" xs="12">
                <Card className="interactive-card border-0 h-100 shadow-sm">
                  <Card.Body className="p-4 stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="stat-label mb-2">{c.label}</div>
                        <div className="stat-value text-dark h3">{c.value}</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: c.bg }}>
                        <CsLineIcons icon={c.icon} size="24" style={{ color: c.color }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="g-4 mb-4">
            {/* Left Column: Alerts, Charts, and Insights */}
            <Col xl={4}>
              {/* Reorder Suggestions (Operational) */}
              {reportData.reorderSuggestions?.filter((s) => s.needs_reorder || s.is_below_threshold).length > 0 && (
                <Card className="interactive-card border-0 shadow-sm mb-4" style={{ border: '2px solid rgba(239, 68, 68, 0.3) !important' }}>
                  <Card.Body className="p-4">
                    <div className="card-title-container border-0 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center bg-danger shadow-sm">
                          <CsLineIcons icon="notification" className="text-white" size="20" />
                        </div>
                        <h2 className="small-title mb-0" style={{ color: '#ef4444', fontWeight: '800' }}>
                          Smart Reorder Alerts
                        </h2>
                      </div>
                    </div>
                    {reportData.reorderSuggestions
                      .filter((s) => s.needs_reorder || s.is_below_threshold)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded mb-2"
                          style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderLeft: '4px solid #ef4444' }}
                        >
                          <div className="d-flex justify-content-between w-100 align-items-center">
                            <div>
                              <div className="fw-bold text-dark">{item.item_name}</div>
                              <div className="smaller text-muted mt-1 fw-bold">
                                {item.current_stock} {item.unit} left
                              </div>
                            </div>
                            <Badge bg="danger" className="rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.65rem' }}>
                              URGENT
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </Card.Body>
                </Card>
              )}

              {/* Daily Trend Chart (Operational) */}
              <Card className="interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                      Stock Movement Trend
                    </h2>
                    <CsLineIcons icon="chart-4" size="18" style={{ color: brandColor }} />
                  </div>
                  <div style={{ height: '300px' }}>
                    <canvas ref={chartRef} />
                  </div>
                </Card.Body>
              </Card>

              {/* Category Performance (Statistical) */}
              <Card className="interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                      Category Allocation Insights
                    </h2>
                    <CsLineIcons icon="pie-chart" size="18" style={{ color: brandColor }} />
                  </div>
                  {statsData.categoryPerformance.map((category, idx) => (
                    <div key={idx} className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-bold small text-dark">{category.category}</div>
                        <div className="small text-muted fw-bold">{formatCurrency(category.totalAmount)}</div>
                      </div>
                      <ProgressBar now={(category.paidAmount / category.totalAmount) * 100} variant="info" className="progress-sm" style={{ height: '6px' }} />
                    </div>
                  ))}
                </Card.Body>
              </Card>

              {/* Executive Insights (Statistical) */}
              <Card className="interactive-card border-0 shadow-sm mb-4" style={{ backgroundColor: 'rgba(35, 179, 244, 0.03)' }}>
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                      Executive Stock Intelligence
                    </h2>
                    <CsLineIcons icon="star" size="18" style={{ color: brandColor }} />
                  </div>
                  {[
                    {
                      title: 'Vendor Health',
                      text: `Working with ${statsData.vendorPerformance.length} vendors. Top vendor contributes ${
                        statsData.vendorPerformance.length > 0
                          ? ((statsData.vendorPerformance[0].totalAmount / statsData.summary.totalAmount) * 100).toFixed(1)
                          : 0
                      }% of load.`,
                      icon: 'shield',
                    },
                    {
                      title: 'Fiscal Discipline',
                      text: `Payment rate at ${statsData.summary.paymentRate}%. ${
                        statsData.summary.unpaidCount > 0 ? `${statsData.summary.unpaidCount} POs pending.` : 'Excellent compliance.'
                      }`,
                      icon: 'credit-card',
                    },
                  ].map((insight, i) => (
                    <div key={i} className="mb-4 d-flex gap-3 align-items-start">
                      <div
                        className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0"
                        style={{ backgroundColor: brandBg }}
                      >
                        <CsLineIcons icon={insight.icon} size="18" style={{ color: brandColor }} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark mb-1">{insight.title}</div>
                        <div className="smaller text-muted fw-bold">{insight.text}</div>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column: Detailed Tables */}
            <Col xl={8}>
              {/* Ingredient Movement Audit */}
              <Card className="interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                      Ingredient Movement Audit
                    </h2>
                    <CsLineIcons icon="list" size="18" style={{ color: brandColor }} />
                  </div>

                  <div className="d-none d-md-block table-responsive">
                    <Table borderless hover className="align-middle mb-0">
                      <thead className="stat-label">
                        <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                          <th className="py-3">Ingredient</th>
                          <th className="py-3 text-center">Received</th>
                          <th className="py-3 text-center">Used</th>
                          <th className="py-3 text-center">Wasted</th>
                          <th className="py-3 text-center">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.itemSummary.slice(0, 10).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3">
                              <div className="d-flex align-items-center gap-2">
                                <div className="bg-light p-2 rounded-2">
                                  <CsLineIcons icon="box" size="14" className="text-muted" />
                                </div>
                                <div>
                                  <div className="fw-bold text-dark">{item.item_name}</div>
                                  <div className="smaller text-muted fw-bold">{item.unit}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-center fw-bold text-primary">{item.received}</td>
                            <td className="py-3 text-center fw-bold text-success">{item.used}</td>
                            <td className="py-3 text-center fw-bold text-danger">{item.wasted}</td>
                            <td className="py-3 text-center">
                              <Badge
                                bg={item.wastage_percent > 15 ? 'danger' : 'success'}
                                className="rounded-pill px-3 py-2 fw-bold"
                                style={{ fontSize: '0.65rem' }}
                              >
                                {100 - item.wastage_percent}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Mobile Layout */}
                  <div className="d-md-none d-flex flex-column gap-3 mt-2">
                    {reportData.itemSummary.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <CsLineIcons icon="box" size="16" className="text-muted" />
                            <span className="fw-bold text-dark fs-6">
                              {item.item_name} <span className="smaller text-muted">({item.unit})</span>
                            </span>
                          </div>
                          <Badge bg={item.wastage_percent > 15 ? 'danger' : 'success'} className="rounded-pill px-2 py-1" style={{ fontSize: '0.65rem' }}>
                            {100 - item.wastage_percent}% EFFICIENCY
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Received:</span>
                          <span className="fw-bold text-primary">{item.received}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Used:</span>
                          <span className="fw-bold text-success">{item.used}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center smaller">
                          <span className="text-muted fw-bold">Wasted:</span>
                          <span className="fw-bold text-danger">{item.wasted}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>

              {/* Top Stock Item Performance */}
              <Card className="interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                      Top Stock Item Performance
                    </h2>
                    <CsLineIcons icon="trend-up" size="18" style={{ color: brandColor }} />
                  </div>

                  <div className="d-none d-md-block table-responsive">
                    <Table borderless hover className="align-middle mb-0">
                      <thead className="stat-label">
                        <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                          <th className="py-3">Item Details</th>
                          <th className="py-3 text-center">Volume</th>
                          <th className="py-3 text-end">Total Value</th>
                          <th className="py-3 text-end">Avg Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.topItemsByQuantity.slice(0, 10).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3">
                              <div className="d-flex align-items-center gap-3">
                                <Badge bg={idx < 3 ? 'primary' : 'light'} className={`rounded-pill px-2 py-1 ${idx < 3 ? '' : 'text-dark'}`}>
                                  {idx + 1}
                                </Badge>
                                <div>
                                  <div className="fw-bold text-dark">{item.itemName}</div>
                                  <div className="smaller text-muted fw-bold">{item.unit || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-center fw-bold text-primary">{item.totalQuantity}</td>
                            <td className="py-3 text-end fw-bold text-dark">{formatCurrency(item.totalValue)}</td>
                            <td className="py-3 text-end text-muted fw-bold smaller">{formatCurrency(item.avgPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Mobile Layout */}
                  <div className="d-md-none d-flex flex-column gap-3 mt-2">
                    {statsData.topItemsByQuantity.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg={idx < 3 ? 'primary' : 'light'} className={`rounded-pill px-2 py-1 ${idx < 3 ? '' : 'text-dark'}`}>
                              {idx + 1}
                            </Badge>
                            <span className="fw-bold text-dark fs-6">
                              {item.itemName} <span className="smaller text-muted">({item.unit || 'N/A'})</span>
                            </span>
                          </div>
                          <span className="fw-bold text-primary">
                            {item.totalQuantity} <span className="smaller text-muted">vol</span>
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Total Value:</span>
                          <span className="fw-bold text-dark">{formatCurrency(item.totalValue)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center smaller">
                          <span className="text-muted fw-bold">Avg Price:</span>
                          <span className="fw-bold text-muted">{formatCurrency(item.avgPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>

              {/* Vendor Relationship Audit */}
              <Card className="interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                      Vendor Relationship Audit
                    </h2>
                    <CsLineIcons icon="shield" size="18" style={{ color: brandColor }} />
                  </div>

                  <div className="d-none d-md-block table-responsive">
                    <Table borderless hover className="align-middle mb-0">
                      <thead className="stat-label">
                        <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                          <th className="py-3">Vendor</th>
                          <th className="py-3 text-end">Total PO</th>
                          <th className="py-3 text-end">Dues</th>
                          <th className="py-3 text-center">Credit Health</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.vendorPerformance.slice(0, 5).map((vendor, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3">
                              <div className="d-flex align-items-center gap-3">
                                <div className="sw-4 sh-4 rounded-circle d-flex justify-content-center align-items-center bg-primary bg-opacity-10 text-primary fw-bold smaller">{idx + 1}</div>
                                <div>
                                  <div className="fw-bold text-dark">{vendor.vendorName || 'Unknown Vendor'}</div>
                                  <div className="smaller text-muted fw-bold">{vendor.purchaseCount} Orders</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-end fw-bold text-dark">{formatCurrency(vendor.totalAmount)}</td>
                            <td className="py-3 text-end fw-bold text-danger">{formatCurrency(vendor.unpaidAmount)}</td>
                            <td className="py-3 text-center">
                              <Badge
                                bg={vendor.paymentRate >= 90 ? 'success' : 'warning'}
                                className="rounded-pill px-3 py-2 fw-bold"
                                style={{ fontSize: '0.65rem' }}
                              >
                                {vendor.paymentRate}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Mobile Layout */}
                  <div className="d-md-none d-flex flex-column gap-3 mt-2">
                    {statsData.vendorPerformance.slice(0, 5).map((vendor, idx) => (
                      <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="sw-4 sh-4 rounded-circle d-flex justify-content-center align-items-center bg-primary bg-opacity-10 text-primary fw-bold smaller">{idx + 1}</div>
                            <span className="fw-bold text-dark fs-6">{vendor.vendorName || 'Unknown Vendor'}</span>
                          </div>
                          <Badge bg={vendor.paymentRate >= 90 ? 'success' : 'warning'} className="rounded-pill px-2 py-1" style={{ fontSize: '0.65rem' }}>
                            {vendor.paymentRate}% HEALTH
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Orders:</span>
                          <span className="fw-bold text-muted">{vendor.purchaseCount}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Total PO:</span>
                          <span className="fw-bold text-dark">{formatCurrency(vendor.totalAmount)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center smaller">
                          <span className="text-muted fw-bold">Dues:</span>
                          <span className="fw-bold text-danger">{formatCurrency(vendor.unpaidAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>

              {/* Fiscal Status Ledger */}
              <Card className="interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                      Fiscal Status Ledger
                    </h2>
                    <CsLineIcons icon="book" size="18" style={{ color: brandColor }} />
                  </div>

                  <div className="d-none d-md-block table-responsive">
                    <Table borderless hover className="align-middle mb-0">
                      <thead className="stat-label">
                        <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                          <th className="py-3">Status</th>
                          <th className="py-3 text-center">Orders</th>
                          <th className="py-3 text-end">Allocation</th>
                          <th className="py-3 text-end">Portfolio %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.statusBreakdown.map((status, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3">
                              <Badge
                                bg={status.status === 'Completed' ? 'success' : 'warning'}
                                className="rounded-pill px-3 py-2 fw-bold"
                                style={{ fontSize: '0.65rem' }}
                              >
                                {status.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3 text-center fw-bold text-muted">{status.count}</td>
                            <td className="py-3 text-end fw-bold text-primary">{formatCurrency(status.totalAmount)}</td>
                            <td className="py-3 text-end fw-bold text-muted smaller">
                              {((status.totalAmount / statsData.summary.totalAmount) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Mobile Layout */}
                  <div className="d-md-none d-flex flex-column gap-3 mt-2">
                    {statsData.statusBreakdown.map((status, idx) => (
                      <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <Badge
                            bg={status.status === 'Completed' ? 'success' : 'warning'}
                            className="rounded-pill px-3 py-2 fw-bold"
                            style={{ fontSize: '0.65rem' }}
                          >
                            {status.status.toUpperCase()}
                          </Badge>
                          <span className="fw-bold text-muted">
                            {status.count} <span className="smaller">orders</span>
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Allocation:</span>
                          <span className="fw-bold text-primary">{formatCurrency(status.totalAmount)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center smaller">
                          <span className="text-muted fw-bold">Portfolio %:</span>
                          <span className="fw-bold text-muted">{((status.totalAmount / statsData.summary.totalAmount) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div className="text-center py-5">
          <CsLineIcons icon="chart-2" size="48" className="text-muted mb-3 d-block mx-auto" />
          <div className="h5 text-muted">Select a range and generate intelligence</div>
        </div>
      )}
    </>
  );
};

export default InventoryReport;

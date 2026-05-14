import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Col, Row, Card, Form, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getDailyReport, exportDailyReportExcel } from 'api/inventory';
import axios from 'axios';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const customStyles = `
    .report-container {
      background: #f9f9fb;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .filter-bar {
      background: #ffffff !important;
      border-radius: 1rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      padding: 1rem 1.5rem !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.01) !important;
      max-width: 1400px;
      margin: 0 auto 1.5rem;
    }
    .stats-card {
      background: #ffffff !important;
      border-radius: 1.25rem !important;
      border: 1.5px solid #f1f5f9 !important;
      padding: 1.25rem !important;
      transition: all 0.2s ease;
      height: 100%;
    }
    .stats-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.02);
      border-color: #23b3f4;
    }
    .workstation-card {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      padding: 1.5rem !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01) !important;
      max-width: 1400px;
      margin: 0 auto 1.5rem;
    }
    .item-row-card {
      background: #f8fafc !important;
      border-radius: 0.75rem !important;
      padding: 0.75rem 1rem !important;
      margin-bottom: 0.5rem;
      border: 1px solid #f1f5f9 !important;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
    }
    .item-row-card:hover {
      background: #ffffff !important;
      border-color: #23b3f4 !important;
    }
    .btn-pill-action {
      border-radius: 50px !important;
      padding: 0.45rem 1.25rem !important;
      font-weight: 700 !important;
      border-width: 2px !important;
      font-size: 0.75rem !important;
    }
    .modern-input {
      border-radius: 10px !important;
      border: 1.5px solid #f1f5f9 !important;
      padding: 0.5rem 0.75rem !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
    }
    .header-text {
      font-size: 0.6rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stats-val { font-weight: 900; line-height: 1.1; }
    .status-pill {
      padding: 0.35rem 0.75rem;
      border-radius: 50px;
      font-weight: 800;
      font-size: 0.6rem;
      text-transform: uppercase;
    }
    .preset-pill {
      border-radius: 50px !important;
      padding: 0.35rem 1rem !important;
      font-weight: 700 !important;
      font-size: 0.65rem !important;
      border-width: 1.5px !important;
      margin-right: 0.4rem;
      margin-bottom: 0.4rem;
    }
    .section-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(35, 179, 244, 0.2), transparent);
      margin: 2rem 0;
      width: 100%;
    }

    @media print {
      .filter-bar, .btn-pill-action, .preset-pill, .breadcrumb-container { display: none !important; }
      .workstation-card { box-shadow: none !important; border: 1px solid #eee !important; margin-bottom: 2rem !important; }
      .report-container { background: #ffffff !important; padding: 0 !important; }
      .stats-card { border: 1px solid #eee !important; box-shadow: none !important; }
      body { background: #fff !important; }
    }

    @media (max-width: 991px) {
      .workstation-card { padding: 1rem !important; }
      .item-row-card { flex-direction: column; align-items: flex-start; padding: 1rem !important; }
      .mobile-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        width: 100%;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid #f1f5f9;
      }
    }
`;

const PRESETS = [
  { label: 'Today', getValue: () => ({ from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: '7 Days', getValue: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Week', getValue: () => ({ from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') }) },
  { label: '30 Days', getValue: () => ({ from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Month', getValue: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
];

const InventoryReport = () => {
  const title = 'Unified Inventory Hub';
  const brandColor = '#23b3f4';
  
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
        axios.get(`${API_BASE}/statistics/inventory`, { ...getHeaders(), params })
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
  }, []);

  useEffect(() => {
    const cleanup = () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
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
        scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
      },
    });
    return cleanup;
  }, [reportData]);

  const applyPreset = (preset) => {
    const { from, to } = preset.getValue();
    setFromDate(from); setToDate(to); setActivePreset(preset.label);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await exportDailyReportExcel({ from: fromDate, to: toDate });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Intelligence.xlsx`);
      document.body.appendChild(link); link.click(); link.parentNode.removeChild(link);
      toast.success('Excel exported');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="report-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} />
      <div className="container-fluid px-3 px-lg-5 pt-3">
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <div><h2 className="fw-bold mb-0" style={{color: brandColor}}>{title}</h2><BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'statistics', text: 'Statistics' }, { to: '', title: 'Unified Hub' }]} /></div>
        </div>

        <Card className="filter-bar border-0">
          <Row className="g-2 align-items-end">
            <Col xs={12} className="mb-2">
              <div className="d-flex flex-wrap">
                {PRESETS.map((p) => (
                  <Button key={p.label} variant={activePreset === p.label ? 'primary' : 'outline-primary'} className="preset-pill" onClick={() => applyPreset(p)}>{p.label}</Button>
                ))}
              </div>
            </Col>
            <Col md={3}><div><div className="header-text mb-1">Start Date</div><Form.Control type="date" className="modern-input w-100" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setActivePreset('Custom'); }} /></div></Col>
            <Col md={3}><div><div className="header-text mb-1">End Date</div><Form.Control type="date" className="modern-input w-100" value={toDate} onChange={(e) => { setToDate(e.target.value); setActivePreset('Custom'); }} /></div></Col>
            <Col md={2}>
              <div>
                <div className="header-text mb-1">Status</div>
                <Form.Select className="modern-input w-100" value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); }}>
                  {['all', 'Completed', 'Pending', 'Partially Paid'].map(s => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </div>
            </Col>
            <Col md={2}>
              <div>
                <div className="header-text mb-1">Category</div>
                <Form.Select className="modern-input w-100" value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); }}>
                  {['all', ...new Set(statsData?.categoryPerformance?.map(c => c.category) || [])].map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </div>
            </Col>
            <Col md="auto" className="d-flex gap-2 flex-wrap mt-2">
              <Button variant="primary" className="btn-pill-action border-2 px-3" onClick={fetchUnifiedReport} disabled={loading}>{loading ? <Spinner animation="border" size="sm" /> : 'Generate Hub'}</Button>
              <Button variant="outline-success" className="btn-pill-action border-2 px-3" onClick={handleExportExcel} disabled={exporting}>Excel</Button>
              <Button variant="outline-danger" className="btn-pill-action border-2 px-3" onClick={() => window.print()} disabled={!reportData}>PDF</Button>
            </Col>
          </Row>
        </Card>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (reportData && statsData) ? (
          <div style={{maxWidth: '1400px', margin: '0 auto'}}>
            
            {/* KPI Section 1: Operations */}
            <div className="header-text mb-3 px-2">Operational Performance Metrics</div>
            <Row className="mb-4 g-3">
              {[
                { label: 'Received', value: reportData.summary.total_received, color: '#3b82f6', icon: 'boxes' },
                { label: 'Used', value: reportData.summary.total_used, color: '#10b981', icon: 'check-circle' },
                { label: 'Wasted', value: reportData.summary.total_wasted, color: '#ef4444', icon: 'bin' },
                { label: 'Stock On Hand', value: reportData.summary.total_current_stock, color: '#f59e0b', icon: 'layers' },
              ].map((c) => (
                <Col key={c.label} lg={3} md={6} xs={6}>
                  <div className="stats-card">
                    <div className="d-flex justify-content-between mb-2">
                       <div className="header-text">{c.label}</div>
                       <CsLineIcons icon={c.icon} size="14" style={{color: c.color}} />
                    </div>
                    <div className="stats-val h4 mb-0" style={{color: c.color}}>{c.value}</div>
                  </div>
                </Col>
              ))}
            </Row>

            {/* KPI Section 2: Financials */}
            <div className="header-text mb-3 px-2">Financial Procurement Analytics</div>
            <Row className="mb-4 g-3">
              {[
                { label: 'Total Investment', value: formatCurrency(statsData.summary.totalAmount), color: '#3b82f6', icon: 'wallet' },
                { label: 'Unpaid Dues', value: formatCurrency(statsData.summary.totalUnpaid), color: '#ef4444', icon: 'credit-card' },
                { label: 'Payment Rate', value: `${statsData.summary.paymentRate}%`, color: '#10b981', icon: 'activity' },
                { label: 'Avg PO Value', value: formatCurrency(statsData.summary.avgPurchaseValue), color: '#23b3f4', icon: 'trend-up' },
              ].map((c) => (
                <Col key={c.label} lg={3} md={6} xs={6}>
                  <div className="stats-card">
                    <div className="d-flex justify-content-between mb-2">
                       <div className="header-text">{c.label}</div>
                       <CsLineIcons icon={c.icon} size="14" style={{color: c.color}} />
                    </div>
                    <div className="stats-val h4 mb-0" style={{color: c.color}}>{c.value}</div>
                  </div>
                </Col>
              ))}
            </Row>

            <div className="section-divider" />

            <Row className="g-4">
               {/* Left Column: Alerts, Charts, and Insights */}
               <Col xl={4}>
                  {/* Reorder Suggestions (Operational) */}
                  {reportData.reorderSuggestions?.filter((s) => s.needs_reorder || s.is_below_threshold).length > 0 && (
                    <div className="workstation-card mb-4 border-danger" style={{borderWidth: '2px'}}>
                      <div className="d-flex align-items-center gap-2 mb-4">
                         <div className="bg-danger p-2 rounded-3 shadow-sm"><CsLineIcons icon="notification" className="text-white" size="18" /></div>
                         <div className="h6 fw-bold mb-0">Smart Reorder Alerts</div>
                      </div>
                      {reportData.reorderSuggestions.filter((s) => s.needs_reorder || s.is_below_threshold).map((item) => (
                        <div key={item.item_name} className="item-row-card border-danger" style={{borderLeftWidth: '4px'}}>
                           <div className="d-flex justify-content-between w-100 align-items-center">
                              <div><div className="fw-bold small">{item.item_name}</div><div className="x-small text-muted">{item.current_stock} {item.unit} left</div></div>
                              <Badge bg="danger" className="status-pill text-white">URGENT</Badge>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Daily Trend Chart (Operational) */}
                  <div className="workstation-card">
                    <div className="header-text mb-4">Stock Movement Trend</div>
                    <div style={{height: '300px'}}><canvas ref={chartRef} /></div>
                  </div>

                  {/* Category Performance (Statistical) */}
                  <div className="workstation-card mt-4">
                    <div className="header-text mb-4">Category Allocation Insights</div>
                    {statsData.categoryPerformance.map((category, idx) => (
                       <div key={idx} className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                             <div className="fw-bold small text-dark">{category.category}</div>
                             <div className="x-small text-muted fw-bold">{formatCurrency(category.totalAmount)}</div>
                          </div>
                          <ProgressBar now={(category.paidAmount / category.totalAmount) * 100} variant="success" className="progress-pill" style={{height: '4px'}} />
                       </div>
                    ))}
                  </div>

                  {/* Executive Insights (Statistical) */}
                  <div className="workstation-card mt-4 bg-primary bg-opacity-10 border-0">
                     <div className="header-text mb-4">Executive Stock Intelligence</div>
                     {[
                        { title: 'Vendor Health', text: `Working with ${statsData.vendorPerformance.length} vendors. Top vendor contributes ${statsData.vendorPerformance.length > 0 ? ((statsData.vendorPerformance[0].totalAmount / statsData.summary.totalAmount) * 100).toFixed(1) : 0}% of load.`, icon: 'shield' },
                        { title: 'Fiscal Discipline', text: `Payment rate at ${statsData.summary.paymentRate}%. ${statsData.summary.unpaidCount > 0 ? `${statsData.summary.unpaidCount} POs pending.` : 'Excellent compliance.'}`, icon: 'credit-card' },
                     ].map((insight, i) => (
                        <div key={i} className="mb-3 d-flex gap-2">
                           <div className="text-primary mt-1"><CsLineIcons icon={insight.icon} size="16" /></div>
                           <div><div className="fw-bold small text-dark">{insight.title}</div><div className="x-small text-muted fw-bold">{insight.text}</div></div>
                        </div>
                     ))}
                  </div>
               </Col>

               {/* Right Column: Detailed Tables */}
               <Col xl={8}>
                  {/* Top Items by Quantity (Statistical) */}
                  <div className="workstation-card mb-4">
                     <div className="header-text mb-4">Top Stock Item Performance</div>
                     <div className="d-none d-lg-flex px-3 mb-2">
                        <div style={{flex: 2}} className="header-text">Item Details</div>
                        <div style={{flex: 1}} className="header-text text-center">Volume</div>
                        <div style={{flex: 1}} className="header-text text-center">Total Value</div>
                        <div style={{flex: 1}} className="header-text text-center">Avg Price</div>
                     </div>
                     {statsData.topItemsByQuantity.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="item-row-card">
                           <div style={{flex: 2}} className="d-flex align-items-center gap-2">
                              <div className="bg-light p-1 rounded-2 fw-bold x-small text-muted">{idx+1}</div>
                              <div><div className="fw-bold text-dark small">{item.itemName}</div><div className="x-small text-muted fw-bold">{item.unit || 'N/A'}</div></div>
                           </div>
                           <div className="text-center" style={{flex: 1}}><div className="fw-bold small text-primary">{item.totalQuantity}</div></div>
                           <div className="text-center" style={{flex: 1}}><div className="fw-bold small">{formatCurrency(item.totalValue)}</div></div>
                           <div className="text-center" style={{flex: 1}}><div className="small text-muted fw-bold">{formatCurrency(item.avgPrice)}</div></div>
                        </div>
                     ))}
                  </div>

                  {/* Ingredient Performance (Operational) */}
                  <div className="workstation-card mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                       <div><div className="h5 fw-bold mb-0">Ingredient Movement Audit</div><div className="text-muted small fw-medium">Real-time usage vs wastage efficiency</div></div>
                    </div>
                    <div className="d-none d-lg-flex px-3 mb-2">
                      <div style={{flex: 2}} className="header-text">Ingredient</div>
                      <div style={{flex: 1}} className="header-text text-center">Rec.</div>
                      <div style={{flex: 1}} className="header-text text-center">Used</div>
                      <div style={{flex: 1}} className="header-text text-center">Waste</div>
                      <div style={{flex: 1}} className="header-text text-center">Efficiency</div>
                    </div>
                    {reportData.itemSummary.slice(0, 10).map((item) => (
                      <div key={item.item_name} className="item-row-card">
                        <div style={{flex: 2}} className="d-flex align-items-center gap-2">
                          <div className="bg-light p-1 rounded-2"><CsLineIcons icon="box" size="12" className="text-muted" /></div>
                          <div><div className="fw-bold text-dark small">{item.item_name}</div><div className="x-small text-muted fw-bold">{item.unit}</div></div>
                        </div>
                        <div className="d-none d-lg-block text-center" style={{flex: 1}}><div className="fw-bold small text-primary">{item.received}</div></div>
                        <div className="d-none d-lg-block text-center" style={{flex: 1}}><div className="fw-bold small text-success">{item.used}</div></div>
                        <div className="d-none d-lg-block text-center" style={{flex: 1}}><div className="fw-bold small text-danger">{item.wasted}</div></div>
                        <div className="d-none d-lg-block text-center" style={{flex: 1}}>
                           <Badge bg={item.wastage_percent > 15 ? 'danger' : 'success'} className="status-pill text-white">{100 - item.wastage_percent}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vendor Performance (Statistical) */}
                  <div className="workstation-card mb-4">
                     <div className="header-text mb-4">Vendor Relationship Audit</div>
                     {statsData.vendorPerformance.slice(0, 5).map((vendor, idx) => (
                        <div key={idx} className="item-row-card">
                           <div style={{flex: 2}} className="d-flex align-items-center gap-2">
                              <div className="bg-primary bg-opacity-10 p-2 rounded-circle fw-bold small text-primary">{idx+1}</div>
                              <div><div className="fw-bold text-dark small">{vendor.vendorName}</div><div className="x-small text-muted">{vendor.purchaseCount} Orders</div></div>
                           </div>
                           <div style={{flex: 1}} className="text-end"><div className="header-text mb-1">Total PO</div><div className="fw-bold small">{formatCurrency(vendor.totalAmount)}</div></div>
                           <div style={{flex: 1}} className="text-end"><div className="header-text mb-1">Dues</div><div className="fw-bold small text-danger">{formatCurrency(vendor.unpaidAmount)}</div></div>
                           <div style={{flex: 1}} className="text-center d-none d-lg-block">
                              <div className="header-text mb-1">Credit Health</div>
                              <Badge bg={vendor.paymentRate >= 90 ? 'success' : 'warning'} className="status-pill text-white">{vendor.paymentRate}%</Badge>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Fiscal Status Ledger (Statistical) */}
                  <div className="workstation-card">
                     <div className="header-text mb-4">Fiscal Status Ledger</div>
                     <div className="d-none d-lg-flex px-3 mb-2">
                        <div style={{flex: 2}} className="header-text">Status</div>
                        <div style={{flex: 1}} className="header-text text-center">Orders</div>
                        <div style={{flex: 2}} className="header-text text-center">Allocation</div>
                        <div style={{flex: 1}} className="header-text text-center">Portfolio %</div>
                     </div>
                     {statsData.statusBreakdown.map((status, idx) => (
                        <div key={idx} className="item-row-card">
                           <div style={{flex: 2}}><Badge bg={status.status === 'Completed' ? 'success' : 'warning'} className="status-pill text-white">{status.status}</Badge></div>
                           <div style={{flex: 1}} className="text-center fw-bold small text-muted">{status.count}</div>
                           <div style={{flex: 2}} className="text-center fw-bold small text-primary">{formatCurrency(status.totalAmount)}</div>
                           <div style={{flex: 1}} className="text-center fw-bold x-small text-muted">{((status.totalAmount / statsData.summary.totalAmount) * 100).toFixed(1)}%</div>
                        </div>
                     ))}
                  </div>
               </Col>
            </Row>
          </div>
        ) : (
          <div className="text-center py-5"><CsLineIcons icon="chart-2" size="48" className="text-muted mb-3 d-block mx-auto" /><div className="h5 text-muted">Select a range and generate intelligence</div></div>
        )}
      </div>
    </div>
  );
};

export default InventoryReport;
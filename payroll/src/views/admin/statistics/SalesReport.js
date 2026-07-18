import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, Modal, ProgressBar, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isToday, isYesterday } from 'date-fns';
import { enIN } from 'date-fns/locale';
import { AuthContext } from 'contexts/AuthContext';

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
    .dish-row-highlight-0 { background: linear-gradient(90deg, rgba(255, 215, 0, 0.08) 0%, transparent 100%) !important; }
    .dish-row-highlight-1 { background: linear-gradient(90deg, rgba(192, 192, 192, 0.1) 0%, transparent 100%) !important; }
    .dish-row-highlight-2 { background: linear-gradient(90deg, rgba(205, 127, 50, 0.06) 0%, transparent 100%) !important; }
    
    .form-control, .form-select {
      border-radius: 0.8rem !important;
      padding: 0.6rem 1rem !important;
      border: 1.5px solid rgba(0,0,0,0.05) !important;
      background: rgba(0,0,0,0.01) !important;
      font-weight: 600 !important;
    }
    .form-control:focus, .form-select:focus {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 0.25rem rgba(35, 179, 244, 0.1) !important;
      background: #fff !important;
    }
`;

const SalesReport = () => {
  const title = 'Sales Performance';
  const description = 'Detailed Sales Analysis and Reports';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Overview' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/sales', text: 'Sales Report' },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const { currentUser, activePlans } = useContext(AuthContext);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeSummary: true,
    includeRevenueTrends: true,
    includeTopDishes: true,
    topDishesLimit: 20,
    includeOrderTypes: true,
    includeCharts: true,
  });

  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [groupBy, setGroupBy] = useState('day');
  const [orderType, setOrderType] = useState('all');

  const API_BASE = process.env.REACT_APP_API;
  const COMPANY_NAME = `${currentUser?.name || 'TheBox'}`;

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatCurrencyPDF = (amount) => {
    const value = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount || 0);
    return `Rs. ${value}`;
  };

  const getAllowedGroupBy = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 2) return ['hour', 'day'];
    if (diffDays <= 60) return ['day'];
    return ['month'];
  };

  useEffect(() => {
    const allowed = getAllowedGroupBy();
    if (!allowed.includes(groupBy)) {
      setGroupBy(allowed[0]);
    }
  }, [startDate, endDate]);

  const formatTrendDate = (item) => {
    const { _id } = item;
    const date = new Date(_id.year, (_id.month || 1) - 1, _id.day || 1);

    if (groupBy === 'hour') {
      if (_id.hour === undefined) return '—';
      date.setHours(_id.hour, 0, 0, 0);
       if (isToday(date)) return `Today ${format(date, 'hh:mm a')}`;
       if (isYesterday(date)) return `Yesterday ${format(date, 'hh:mm a')}`;
       return format(date, 'dd-MM-yyyy hh:mm a', { locale: enIN });
    }

    if (groupBy === 'day') {
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'dd-MM-yyyy', { locale: enIN });
    }

    if (groupBy === 'month') {
      return format(date, 'MMMM yyyy', { locale: enIN });
    }

    return '';
  };

  const getItemDate = (item) => {
    const { _id } = item;
    const date = new Date(_id.year, (_id.month || 1) - 1, _id.day || 1);

    if (groupBy === 'hour' && _id.hour !== undefined) {
      date.setHours(_id.hour, 0, 0, 0);
    }

    return date;
  };

  const fetchSalesReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
        group_by: groupBy,
      };

      const [revenueRes, orderRes, dishesRes] = await Promise.all([
        axios.get(`${API_BASE}/statistics/revenue`, { ...getHeaders(), params }),
        axios.get(`${API_BASE}/statistics/orders`, {
          ...getHeaders(),
          params: { ...params, group_by: orderType === 'all' ? 'type' : 'status' },
        }),
        axios.get(`${API_BASE}/statistics/dishes/top`, {
          ...getHeaders(),
          params: { ...params, limit: 20 },
        }),
      ]);

      setReportData({
        revenue: revenueRes.data,
        orders: orderRes.data,
        dishes: dishesRes.data,
      });
    } catch (err) {
      console.error('Error fetching sales report:', err);
      setError(err.response?.data?.error || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, []);

  useEffect(() => {
    fetchSalesReport();
  }, [groupBy, startDate, endDate]);

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const sortedRevenueData = reportData ? [...reportData.revenue.data].sort((a, b) => getItemDate(b) - getItemDate(a)) : [];

  const exportToExcel = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();
      if (exportOptions.includeSummary) {
        const dashboardData = [
          ['SALES REPORT DASHBOARD'],
          [],
          ['Company:', COMPANY_NAME],
          ['Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`],
          ['Generated:', format(new Date(), 'dd MMM yyyy hh:mm a')],
          [],
          ['METRICS'],
          ['Metric', 'Value'],
          ['Total Revenue', reportData.revenue.summary.totalRevenue],
          ['Total Orders', reportData.revenue.summary.totalOrders],
          ['Average Order Value', reportData.revenue.summary.averageOrderValue],
        ];
        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Summary');
      }
      if (exportOptions.includeRevenueTrends) {
        const revData = [['REVENUE TREND'], [], ['Date', 'Revenue', 'Orders']];
        [...reportData.revenue.data].sort((a, b) => getItemDate(a) - getItemDate(b)).forEach(item => {
          revData.push([formatTrendDate(item), item.value, item.orderCount]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revData), 'Revenue Details');
      }
      XLSX.writeFile(wb, `Sales_Report_${startDate}_to_${endDate}.xlsx`);
      showSuccessToast('Excel report exported successfully!');
    } catch (err) {
      showSuccessToast('Error exporting Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportType('PDF');
    try {
      const doc = new jsPDF();
      doc.text('Sales Report', 105, 20, { align: 'center' });
      doc.text(COMPANY_NAME, 105, 30, { align: 'center' });
      autoTable(doc, {
        startY: 40,
        head: [['Metric', 'Value']],
        body: [
          ['Total Revenue', formatCurrencyPDF(reportData.revenue.summary.totalRevenue)],
          ['Total Orders', reportData.revenue.summary.totalOrders.toString()],
          ['Average Order Value', formatCurrencyPDF(reportData.revenue.summary.averageOrderValue)]
        ]
      });
      doc.save(`Sales_Report_${startDate}_to_${endDate}.pdf`);
      showSuccessToast('PDF exported successfully!');
    } catch (err) {
      showSuccessToast('Error exporting PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportClick = (type) => {
    setShowExportModal(true);
    setExportType(type);
  };

  const handleExportConfirm = () => {
    setShowExportModal(false);
    if (exportType === 'Excel') exportToExcel();
    else if (exportType === 'PDF') exportToPDF();
  };

  const brandColor = '#23b3f4';
  const brandBg = 'rgba(35, 179, 244, 0.08)';

  if (loading && !reportData) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ width: '3rem', height: '3rem', color: brandColor }} />
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4 no-print">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {/* Filters Section */}
      {activePlans?.includes('Dynamic Reports') && (
        <Card className="interactive-card border-0 mb-4 no-print shadow-sm">
          <Card.Body className="p-4">
            <div className="card-title-container">
              <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Report Filters</h2>
              <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
            </div>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label className="stat-label mb-2">Start Date</Form.Label>
                <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="stat-label mb-2">End Date</Form.Label>
                <Form.Control type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label className="stat-label mb-2">Group By</Form.Label>
                <Form.Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  {['hour', 'day', 'month'].map((option) => (
                    <option key={option} value={option} disabled={!getAllowedGroupBy().includes(option)}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="stat-label mb-2">Order Type</Form.Label>
                <Form.Select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button className="custom-btn-outline w-100" onClick={fetchSalesReport} disabled={loading}>
                  <CsLineIcons icon="sync" className={`me-2 ${loading ? 'spin' : ''}`} size="15" />
                  {loading ? 'Processing...' : 'Generate Report'}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {error && <Alert variant="danger" className="mb-4 interactive-card border-0">{error}</Alert>}

      {reportData && (
        <>
          {/* Action Bar */}
          <Card className="interactive-card border-0 mb-4 no-print shadow-sm">
            <Card.Body className="p-4 d-flex justify-content-between align-items-center">
              <div className="d-flex gap-3 align-items-center">
                <Button variant="outline-success" className="custom-btn-outline border-success text-success" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                  <CsLineIcons icon="file-text" className="me-2" size="15" /> Excel
                </Button>
                <Button variant="outline-danger" className="custom-btn-outline border-danger text-danger" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                  <CsLineIcons icon="file-text" className="me-2" size="15" /> PDF
                </Button>
              </div>
              {exporting && (
                <div className="flex-grow-1 ms-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="smaller fw-bold text-muted">Preparing {exportType}...</span>
                    <span className="smaller fw-bold text-primary">{exportProgress}%</span>
                  </div>
                  <ProgressBar now={exportProgress} className="progress-sm" variant="info" style={{ height: '6px' }} />
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Key Metrics */}
          <Row className="g-4 mb-4">
            <Col xl="3" md="6">
              <Card className="interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
                <Card.Body className="p-4 stat-card-inner">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="stat-label mb-2">Total Revenue</div>
                      <div className="stat-value text-primary">{formatCurrency(reportData.revenue.summary.totalRevenue)}</div>
                    </div>
                    <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: brandBg }}>
                      <CsLineIcons icon="coin" size="24" style={{ color: brandColor }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl="3" md="6">
              <Card className="interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
                <Card.Body className="p-4 stat-card-inner">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="stat-label mb-2">Total Orders</div>
                      <div className="stat-value">{reportData.revenue.summary.totalOrders}</div>
                    </div>
                    <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                      <CsLineIcons icon="cart" size="24" style={{ color: '#10b981' }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl="3" md="6">
              <Card className="interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #6366f1' }}>
                <Card.Body className="p-4 stat-card-inner">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="stat-label mb-2">Avg Order Value</div>
                      <div className="stat-value">{formatCurrency(reportData.revenue.summary.averageOrderValue)}</div>
                    </div>
                    <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                      <CsLineIcons icon="trend-up" size="24" style={{ color: '#6366f1' }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl="3" md="6">
              <Card className="interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
                <Card.Body className="p-4 stat-card-inner">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="stat-label mb-2">Report Period</div>
                      <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                        {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd')}
                      </div>
                    </div>
                    <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: brandBg }}>
                      <CsLineIcons icon="calendar" size="24" style={{ color: brandColor }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tables Section */}
          <Row className="g-4 mb-4">
            <Col lg={12}>
              <Card className="interactive-card border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Revenue Trends</h2>
                    <CsLineIcons icon="chart-4" size="18" style={{ color: brandColor }} />
                  </div>
                  <div className="table-responsive">
                    <Table borderless hover className="align-middle mb-0">
                      <thead className="stat-label">
                        <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                          <th className="py-3">Date Period</th>
                          <th className="py-3 text-end">Total Revenue</th>
                          <th className="py-3 text-end">Total Orders</th>
                          <th className="py-3 text-end">Order Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRevenueData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3 fw-bold text-dark">{formatTrendDate(item)}</td>
                            <td className="py-3 text-end fw-bold text-primary">{formatCurrency(item.value)}</td>
                            <td className="py-3 text-end fw-bold text-dark">{item.orderCount}</td>
                            <td className="py-3 text-end text-muted fw-bold">{formatCurrency(item.orderCount > 0 ? item.value / item.orderCount : 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={7}>
              <Card className="interactive-card border-0 shadow-sm h-100">
                <Card.Body className="p-0">
                  <div className="p-4 card-title-container" style={{ marginBottom: '0' }}>
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Dish Performance Ranking</h2>
                    <CsLineIcons icon="burger" size="18" style={{ color: brandColor }} />
                  </div>
                  <div className="d-flex flex-column">
                    {reportData.dishes.data.slice(0, 15).map((dish, idx) => {
                      const highlightClass = idx < 3 ? `dish-row-highlight-${idx}` : '';
                      return (
                        <div key={idx} className={`px-4 py-3 d-flex align-items-center justify-content-between ${highlightClass}`}>
                          <div className="d-flex align-items-center overflow-hidden">
                            <div className="sw-4 sh-4 rounded-circle d-flex justify-content-center align-items-center fw-bold me-3 text-muted smaller" 
                                 style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
                              {idx + 1}
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-truncate fw-bold small mb-0">{dish.dishName}</div>
                              <div className="text-muted smaller fw-bold" style={{ fontSize: '0.65rem' }}>{dish.category || 'Main Course'}</div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold small text-primary">{dish.totalQuantity} items</div>
                            <div className="text-muted smaller fw-bold" style={{ fontSize: '0.65rem' }}>{formatCurrency(dish.totalRevenue)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="interactive-card border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Order Type Breakdown</h2>
                    <CsLineIcons icon="destination" size="18" style={{ color: brandColor }} />
                  </div>
                  <div className="d-flex flex-column gap-4 mt-3">
                    {reportData.orders.data.map((order, idx) => {
                      const percentage = ((order.totalRevenue / reportData.revenue.summary.totalRevenue) * 100).toFixed(1);
                      return (
                        <div key={idx}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center">
                              <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3" style={{ backgroundColor: brandBg }}>
                                <CsLineIcons 
                                  icon={order.category === 'Dine In' ? 'main-course' : order.category === 'Takeaway' ? 'burger' : 'destination'} 
                                  size="18" 
                                  style={{ color: brandColor }} 
                                />
                              </div>
                              <div>
                                <div className="fw-bold text-dark smaller">{order.category}</div>
                                <div className="text-muted smaller fw-bold">{order.count} orders</div>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-primary mb-0">{formatCurrency(order.totalRevenue)}</div>
                              <div className="text-muted smaller fw-bold">{percentage}% of sales</div>
                            </div>
                          </div>
                          <ProgressBar now={percentage} className="progress-sm" style={{ height: '4px', background: 'rgba(0,0,0,0.03)' }} />
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Export Options Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered contentClassName="interactive-card border-0 shadow-lg">
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>Export {exportType} Report</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted smaller fw-bold mb-4">Select which sections to include in your generated file.</p>
          <Form className="d-flex flex-column gap-3">
            {[
              { id: 'includeSummary', label: 'Executive Summary Metrics', key: 'includeSummary' },
              { id: 'includeRevenueTrends', label: 'Detailed Revenue Trends', key: 'includeRevenueTrends' },
              { id: 'includeTopDishes', label: 'Top Dish Performance', key: 'includeTopDishes' },
              { id: 'includeOrderTypes', label: 'Order Type Breakdown', key: 'includeOrderTypes' },
              { id: 'includeCharts', label: 'Charts & Visualizations', key: 'includeCharts' }
            ].map(option => (
              <Form.Check 
                key={option.id}
                type="switch"
                id={option.id}
                label={<span className="fw-bold smaller text-dark ms-2">{option.label}</span>}
                checked={exportOptions[option.key]}
                onChange={(e) => setExportOptions({ ...exportOptions, [option.key]: e.target.checked })}
              />
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="light" className="custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>Close</Button>
          <Button className="custom-btn-outline px-4" onClick={handleExportConfirm}>Start Exporting</Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="white" className="interactive-card border-0">
          <Toast.Body className="p-3 d-flex align-items-center">
            <CsLineIcons icon="check-circle" className="text-success me-2" size="20" />
            <span className="fw-bold smaller text-dark">{toastMessage}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default SalesReport;

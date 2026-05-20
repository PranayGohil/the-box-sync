import React, { useState, useEffect, useContext, useRef } from 'react';
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



const FilterSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: open ? 1000 : 1 }}>
      <button type="button" className="sales-report-filter-select-btn" onClick={() => setOpen((p) => !p)}>
        <span>{selected?.label || 'Select...'}</span>
        <span style={{ fontSize: '10px', color: 'var(--muted,#6c757d)', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="sales-report-filter-select-dropdown">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`sales-report-filter-select-option${opt.value === value ? ' sales-report-is-selected' : ''}${opt.disabled ? ' sales-report-is-disabled' : ''}`}
              onMouseDown={(e) => { if (opt.disabled) return; e.preventDefault(); onChange(opt.value); setOpen(false); }}
              onTouchEnd={(e) => { if (opt.disabled) return; e.preventDefault(); onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
      if (isToday(date)) return `Today ${format(date, 'HH:mm')}`;
      if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
      return format(date, 'dd-MM-yyyy HH:mm', { locale: enIN });
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
      const allData = [];

      allData.push(['SALES REPORT']);
      allData.push(['Company:', COMPANY_NAME]);
      allData.push(['Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`]);
      allData.push(['Generated:', format(new Date(), 'dd MMM yyyy HH:mm')]);
      allData.push([]);

      if (exportOptions.includeSummary) {
        allData.push(['EXECUTIVE SUMMARY']);
        allData.push(['Metric', 'Value']);
        allData.push(['Total Revenue', reportData.revenue.summary.totalRevenue]);
        allData.push(['Total Orders', reportData.revenue.summary.totalOrders]);
        allData.push(['Average Order Value', reportData.revenue.summary.averageOrderValue]);
        allData.push([]);
        allData.push([]);
      }
      
      if (exportOptions.includeRevenueTrends) {
        allData.push(['REVENUE TRENDS']);
        allData.push(['Date Period', 'Total Revenue', 'Total Orders', 'Order Average']);
        [...reportData.revenue.data].sort((a, b) => getItemDate(a) - getItemDate(b)).forEach(item => {
          const orderAvg = item.orderCount > 0 ? item.value / item.orderCount : 0;
          allData.push([formatTrendDate(item), item.value, item.orderCount, orderAvg]);
        });
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeTopDishes) {
        allData.push(['DISH PERFORMANCE RANKING']);
        allData.push(['Rank', 'Dish Name', 'Category', 'Quantity Sold', 'Revenue']);
        reportData.dishes.data.forEach((dish, index) => {
          allData.push([index + 1, dish.dishName, dish.category || 'Main Course', dish.totalQuantity, dish.totalRevenue]);
        });
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeOrderTypes) {
        allData.push(['ORDER TYPE BREAKDOWN']);
        allData.push(['Order Type', 'Orders', 'Revenue', 'Percentage']);
        reportData.orders.data.forEach(order => {
          const percentage = ((order.totalRevenue / reportData.revenue.summary.totalRevenue) * 100).toFixed(1);
          allData.push([order.category, order.count, order.totalRevenue, `${percentage}%`]);
        });
        allData.push([]);
        allData.push([]);
      }

      const sheet = XLSX.utils.aoa_to_sheet(allData);
      
      // Auto-size columns slightly for better readability
      const colWidths = [{ wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      sheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, sheet, 'Sales Report');

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
      
      doc.setFontSize(16);
      doc.text('Sales Report', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(COMPANY_NAME, 105, 22, { align: 'center' });
      doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 28, { align: 'center' });

      let currentY = 35;

      if (exportOptions.includeSummary) {
        doc.setFontSize(12);
        doc.text('Executive Summary', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Metric', 'Value']],
          body: [
            ['Total Revenue', formatCurrencyPDF(reportData.revenue.summary.totalRevenue)],
            ['Total Orders', reportData.revenue.summary.totalOrders.toString()],
            ['Average Order Value', formatCurrencyPDF(reportData.revenue.summary.averageOrderValue)]
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeRevenueTrends) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Revenue Trends', 14, currentY);
        
        const revBody = [...reportData.revenue.data]
          .sort((a, b) => getItemDate(a) - getItemDate(b))
          .map(item => [
            formatTrendDate(item), 
            formatCurrencyPDF(item.value), 
            item.orderCount.toString(),
            formatCurrencyPDF(item.orderCount > 0 ? item.value / item.orderCount : 0)
          ]);
          
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Date Period', 'Total Revenue', 'Total Orders', 'Order Average']],
          body: revBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeTopDishes) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Dish Performance Ranking', 14, currentY);
        
        const dishBody = reportData.dishes.data.map((dish, index) => [
          (index + 1).toString(),
          dish.dishName,
          dish.category || 'Main Course',
          dish.totalQuantity.toString(),
          formatCurrencyPDF(dish.totalRevenue)
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Rank', 'Dish Name', 'Category', 'Quantity Sold', 'Revenue']],
          body: dishBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeOrderTypes) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Order Type Breakdown', 14, currentY);
        
        const typeBody = reportData.orders.data.map((order) => [
          order.category,
          order.count.toString(),
          formatCurrencyPDF(order.totalRevenue),
          `${((order.totalRevenue / reportData.revenue.summary.totalRevenue) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Order Type', 'Orders', 'Revenue', 'Percentage']],
          body: typeBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
      }

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
      <HtmlHead title={title} description={description} />
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0 no-print">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        {/* Filters Section */}
        {activePlans?.includes('Dynamic Reports') && (
          <Card className="sales-report-interactive-card sales-report-filter-card border-0 mb-4 no-print shadow-sm">
            <Card.Body className="p-4">
              <div className="sales-report-card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Report Filters</h2>
                <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
              </div>
              <Row className="g-3">
                <Col xs={12} md={3}>
                  <Form.Group>
                    <Form.Label className="sales-report-stat-label mb-2">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={3}>
                  <Form.Group>
                    <Form.Label className="sales-report-stat-label mb-2">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={2}>
                  <Form.Group>
                    <Form.Label className="sales-report-stat-label mb-2">Group By</Form.Label>
                    <FilterSelect
                      value={groupBy}
                      onChange={setGroupBy}
                      options={['hour', 'day', 'month'].map((o) => ({
                        value: o,
                        label: o.charAt(0).toUpperCase() + o.slice(1),
                        disabled: !getAllowedGroupBy().includes(o),
                      }))}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={2}>
                  <Form.Group>
                    <Form.Label className="sales-report-stat-label mb-2">Order Type</Form.Label>
                    <FilterSelect
                      value={orderType}
                      onChange={setOrderType}
                      options={[
                        { value: 'all', label: 'All Types' },
                        { value: 'dine-in', label: 'Dine In' },
                        { value: 'takeaway', label: 'Takeaway' },
                        { value: 'delivery', label: 'Delivery' },
                      ]}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={2} className="d-flex align-items-end">
                  <Button className="sales-report-custom-btn-outline w-100" onClick={fetchSalesReport} disabled={loading}>
                    <CsLineIcons icon="sync" className={`me-2 ${loading ? 'spin' : ''}`} size="15" />
                    {loading ? 'Processing...' : 'Generate'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {error && <Alert variant="danger" className="mb-4 sales-report-interactive-card border-0">{error}</Alert>}

        {reportData && (
          <>
            {/* Action Bar */}
            <Card className="sales-report-interactive-card border-0 mb-4 no-print shadow-sm">
              <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div className="d-flex gap-3 align-items-center">
                  <Button variant="outline-success" className="sales-report-custom-btn-outline border-success text-success px-4" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                    <CsLineIcons icon="file-text" className="me-2" size="15" /> Excel
                  </Button>
                  <Button variant="outline-danger" className="sales-report-custom-btn-outline border-danger text-danger px-4" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                    <CsLineIcons icon="file-text" className="me-2" size="15" /> PDF
                  </Button>
                </div>
                {exporting && (
                  <div className="flex-grow-1 ms-md-4">
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
            <Row className="g-3 mb-4">
              <Col xl="3" md="6">
                <Card className="sales-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
                  <Card.Body className="p-4 sales-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="sales-report-stat-label mb-2">Total Revenue</div>
                        <div className="sales-report-stat-value text-primary">{formatCurrency(reportData.revenue.summary.totalRevenue)}</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: brandBg }}>
                        <CsLineIcons icon="coin" size="24" style={{ color: brandColor }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="sales-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
                  <Card.Body className="p-4 sales-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="sales-report-stat-label mb-2">Total Orders</div>
                        <div className="sales-report-stat-value">{reportData.revenue.summary.totalOrders}</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <CsLineIcons icon="cart" size="24" style={{ color: '#10b981' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="sales-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #6366f1' }}>
                  <Card.Body className="p-4 sales-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="sales-report-stat-label mb-2">Avg Order Value</div>
                        <div className="sales-report-stat-value">{formatCurrency(reportData.revenue.summary.averageOrderValue)}</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <CsLineIcons icon="trend-up" size="24" style={{ color: '#6366f1' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="sales-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
                  <Card.Body className="p-4 sales-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="sales-report-stat-label mb-2">Report Period</div>
                        <div className="sales-report-stat-value" style={{ fontSize: '1.2rem' }}>
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
            <Row className="g-3 mb-4">
              <Col lg={12}>
                <Card className="sales-report-interactive-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="sales-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Revenue Trends</h2>
                      <CsLineIcons icon="chart-4" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="table-responsive d-none d-md-block">
                      <Table borderless hover className="align-middle mb-0 sales-report-table-mobile-optimized">
                        <thead className="sales-report-stat-label">
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

                    {/* Mobile Card View */}
                    <div className="d-block d-md-none mt-3">
                      {sortedRevenueData.map((item, idx) => (
                        <div key={idx} className="p-3 mb-3 border rounded-3 shadow-sm" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{formatTrendDate(item)}</div>
                            <div className="fw-bold text-primary" style={{ fontSize: '0.95rem' }}>{formatCurrency(item.value)}</div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Total Orders</span>
                              <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{item.orderCount}</span>
                            </div>
                            <div className="text-end">
                              <span className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Order Avg</span>
                              <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{formatCurrency(item.orderCount > 0 ? item.value / item.orderCount : 0)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={7}>
                <Card className="sales-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-0">
                    <div className="p-4 sales-report-card-title-container" style={{ marginBottom: '0' }}>
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Dish Performance Ranking</h2>
                      <CsLineIcons icon="burger" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="d-flex flex-column">
                      {reportData.dishes.data.slice(0, 15).map((dish, idx) => {
                        const highlightClass = idx < 3 ? `sales-report-dish-row-highlight-${idx}` : '';
                        return (
                          <div key={idx} className={`px-4 py-3 d-flex align-items-center justify-content-between ${highlightClass}`}>
                            <div className="d-flex align-items-center overflow-hidden">
                              <div className="sw-4 sh-4 rounded-circle d-flex justify-content-center align-items-center fw-bold me-3 text-muted smaller" 
                                   style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
                                {idx + 1}
                              </div>
                              <div className="overflow-hidden">
                                <div className="text-truncate fw-bold small mb-0">{dish.dishName}</div>
                                <div className="text-muted smaller fw-bold text-truncate" style={{ fontSize: '0.65rem' }}>{dish.category || 'Main Course'}</div>
                              </div>
                            </div>
                            <div className="text-end ms-2">
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
                <Card className="sales-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="sales-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Order Type Breakdown</h2>
                      <CsLineIcons icon="destination" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="d-flex flex-column gap-4 mt-3">
                      {reportData.orders.data.map((order, idx) => {
                        const percentage = ((order.totalRevenue / reportData.revenue.summary.totalRevenue) * 100).toFixed(1);
                        return (
                          <div key={idx}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="d-flex align-items-center overflow-hidden">
                                <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3" style={{ backgroundColor: brandBg }}>
                                  <CsLineIcons 
                                    icon={order.category === 'Dine In' ? 'main-course' : order.category === 'Takeaway' ? 'burger' : 'destination'} 
                                    size="18" 
                                    style={{ color: brandColor }} 
                                  />
                                </div>
                                <div className="overflow-hidden">
                                  <div className="fw-bold text-dark smaller text-truncate">{order.category}</div>
                                  <div className="text-muted smaller fw-bold">{order.count} orders</div>
                                </div>
                              </div>
                              <div className="text-end ms-2">
                                <div className="fw-bold text-primary mb-0 smaller">{formatCurrency(order.totalRevenue)}</div>
                                <div className="text-muted smaller fw-bold">{percentage}%</div>
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
      </div>

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
          <Button variant="light" className="sales-report-custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>Close</Button>
          <Button className="sales-report-custom-btn-outline px-4" onClick={handleExportConfirm}>Start Exporting</Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="white" className="sales-report-interactive-card border-0">
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

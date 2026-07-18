import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar, Modal, Toast, ToastContainer, Pagination } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';
import ReportPagination from './components/ReportPagination';

const FilterSelect = ({ value, onChange, options }) => {
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
    <div ref={ref} style={{ position: 'relative', zIndex: open ? 1000 : 1 }}>
      <button type="button" className="menu-performance-report-filter-select-btn" onClick={() => setOpen((p) => !p)}>
        <span>{selected?.label || 'Select...'}</span>
        <span style={{ fontSize: '10px', color: 'var(--muted,#6c757d)', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="menu-performance-report-filter-select-dropdown">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`menu-performance-report-filter-select-option${opt.value === value ? ' menu-performance-report-is-selected' : ''}${
                opt.disabled ? ' menu-performance-report-is-disabled' : ''
              }`}
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

const MenuPerformanceReport = () => {
  const brandColor = '#23b3f4';
  const brandBg = 'rgba(35, 179, 244, 0.08)';
  const title = 'Menu Performance Report';
  const description = 'Comprehensive Menu and Dish Performance Analysis';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/menu', text: 'Menu Performance' },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [catPage, setCatPage] = useState(1);
  const catPerPage = 6;
  const [dishPage, setDishPage] = useState(1);
  const dishPerPage = 10;

  const { currentUser, activePlans } = useContext(AuthContext);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeSummary: true,
    includeAllDishes: true,
    dishesLimit: 'all',
    includeCategoryPerformance: true,
    includeMealTypePerformance: true,
    includePerformanceDistribution: true,
    includeCharts: true,
  });

  const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMealType, setSelectedMealType] = useState('all');

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

  const fetchMenuReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { period: 'custom', start_date: startDate, end_date: endDate };
      const response = await axios.get(`${API_BASE}/statistics/menu/report`, { ...getHeaders(), params });
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching menu report:', err);
      setError(err.response?.data?.error || 'Failed to load menu report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuReport();
  }, [startDate, endDate]);

  const getPerformanceLevel = (dish) => {
    if (!reportData) return 'average';
    const avgRevenue = reportData.summary.totalRevenue / reportData.summary.totalDishes;
    if (dish.totalRevenue >= avgRevenue * 1.5) return 'excellent';
    if (dish.totalRevenue >= avgRevenue * 0.7) return 'good';
    return 'poor';
  };

  const getFilteredDishes = () => {
    if (!reportData) return [];
    return reportData.dishPerformance.filter((dish) => {
      const categoryMatch = selectedCategory === 'all' || dish.category === selectedCategory;
      const mealTypeMatch = selectedMealType === 'all' || dish.mealType === selectedMealType;
      return categoryMatch && mealTypeMatch;
    });
  };

  const filteredDishes = getFilteredDishes();
  const categories = reportData ? ['all', ...new Set(reportData.dishPerformance.map((d) => d.category).filter(Boolean))] : ['all'];
  const mealTypes = reportData ? ['all', ...new Set(reportData.dishPerformance.map((d) => d.mealType).filter(Boolean))] : ['all'];

  const exportToExcel = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();
      const allData = [];

      allData.push(['MENU PERFORMANCE REPORT']);
      allData.push(['Company:', COMPANY_NAME]);
      allData.push(['Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`]);
      allData.push(['Generated:', format(new Date(), 'dd MMM yyyy hh:mm a')]);
      allData.push([]);

      if (exportOptions.includeSummary) {
        setExportProgress(20);
        allData.push(['SUMMARY METRICS']);
        allData.push(['Metric', 'Value']);
        allData.push(['Total Items Sold', reportData.dishPerformance.reduce((sum, d) => sum + d.totalQuantity, 0)]);
        allData.push(['Total Menu Revenue', reportData.summary.totalRevenue]);
        allData.push(['Total Categories', reportData.summary.totalCategories]);
        allData.push(['Top Performer', reportData.dishPerformance[0]?.dishName || 'N/A']);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includePerformanceDistribution) {
        setExportProgress(35);
        allData.push(['PERFORMANCE DISTRIBUTION INSIGHTS']);
        allData.push(['Status', 'Dish Count', '% of Menu']);

        const topPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent').length;
        const stableItems = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good').length;
        const lowPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor').length;
        const total = reportData.dishPerformance.length;

        allData.push(['Top Performers', topPerformers, total > 0 ? `${((topPerformers / total) * 100).toFixed(1)}%` : '0%']);
        allData.push(['Stable Items', stableItems, total > 0 ? `${((stableItems / total) * 100).toFixed(1)}%` : '0%']);
        allData.push(['Low Performers', lowPerformers, total > 0 ? `${((lowPerformers / total) * 100).toFixed(1)}%` : '0%']);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeCategoryPerformance && reportData.categoryPerformance?.length > 0) {
        setExportProgress(50);
        allData.push(['CATEGORY YIELD INSIGHTS']);
        allData.push(['Category', 'Orders', 'Revenue', 'Yield per Dish', '% of Total Revenue']);

        reportData.categoryPerformance.forEach((cat) => {
          const percent = reportData.summary.totalRevenue > 0 ? ((cat.totalRevenue / reportData.summary.totalRevenue) * 100).toFixed(1) : 0;
          allData.push([cat.category, cat.orderCount, cat.totalRevenue, cat.avgRevenuePerDish, `${percent}%`]);
        });
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeMealTypePerformance && reportData.mealTypePerformance?.length > 0) {
        setExportProgress(65);
        allData.push(['MEAL TYPE UTILIZATION TRENDS']);
        allData.push(['Meal Type', 'Qty Sold', 'Revenue', 'Orders', '% Revenue', 'Status']);

        reportData.mealTypePerformance.forEach((meal) => {
          const percent = reportData.summary.totalRevenue > 0 ? (meal.totalRevenue / reportData.summary.totalRevenue) * 100 : 0;
          const status = percent >= 40 ? 'High Load' : percent >= 20 ? 'Balanced' : 'Light';
          allData.push([meal.mealType || 'Not Specified', meal.totalQuantity, meal.totalRevenue, meal.orderCount, `${percent.toFixed(1)}%`, status]);
        });
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeAllDishes && filteredDishes?.length > 0) {
        setExportProgress(80);
        allData.push(['MENU ITEM PERFORMANCE AUDIT']);
        allData.push(['Rank', 'Dish Name', 'Category', 'Qty Sold', 'Revenue', 'Avg Price', 'Status']);

        filteredDishes.forEach((dish, idx) => {
          allData.push([
            idx + 1,
            dish.dishName,
            dish.category || 'N/A',
            dish.totalQuantity,
            dish.totalRevenue,
            dish.avgPrice,
            getPerformanceLevel(dish).toUpperCase(),
          ]);
        });
        allData.push([]);
        allData.push([]);
      }

      const ws = XLSX.utils.aoa_to_sheet(allData);
      ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Menu Performance');

      XLSX.writeFile(wb, `Menu_Report_${startDate}_to_${endDate}.xlsx`);
      setToastMessage('Excel report exported successfully!');
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage('Error exporting Excel report');
      setShowToast(true);
    } finally {
      setExporting(false);
      setExportProgress(0);
      setExportType('');
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');
    try {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Menu Performance Report', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(COMPANY_NAME, 105, 22, { align: 'center' });
      doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 28, { align: 'center' });

      let currentY = 35;

      if (exportOptions.includeSummary) {
        setExportProgress(20);
        doc.setFontSize(12);
        doc.text('Summary Metrics', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Metric', 'Value']],
          body: [
            ['Total Items Sold', reportData.dishPerformance.reduce((sum, d) => sum + d.totalQuantity, 0).toString()],
            ['Total Menu Revenue', formatCurrencyPDF(reportData.summary.totalRevenue)],
            ['Total Categories', reportData.summary.totalCategories.toString()],
            ['Top Performer', reportData.dishPerformance[0]?.dishName || 'N/A'],
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includePerformanceDistribution) {
        setExportProgress(35);
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Performance Distribution Insights', 14, currentY);

        const topPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent').length;
        const stableItems = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good').length;
        const lowPerformers = reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor').length;
        const total = reportData.dishPerformance.length;

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Status', 'Dish Count', '% of Menu']],
          body: [
            ['Top Performers', topPerformers.toString(), total > 0 ? `${((topPerformers / total) * 100).toFixed(1)}%` : '0%'],
            ['Stable Items', stableItems.toString(), total > 0 ? `${((stableItems / total) * 100).toFixed(1)}%` : '0%'],
            ['Low Performers', lowPerformers.toString(), total > 0 ? `${((lowPerformers / total) * 100).toFixed(1)}%` : '0%'],
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeCategoryPerformance && reportData.categoryPerformance?.length > 0) {
        setExportProgress(50);
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Category Yield Insights', 14, currentY);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Category', 'Orders', 'Revenue', 'Yield per Dish', '% Rev']],
          body: reportData.categoryPerformance.map((cat) => {
            const percent = reportData.summary.totalRevenue > 0 ? ((cat.totalRevenue / reportData.summary.totalRevenue) * 100).toFixed(1) : 0;
            return [cat.category, cat.orderCount.toString(), formatCurrencyPDF(cat.totalRevenue), formatCurrencyPDF(cat.avgRevenuePerDish), `${percent}%`];
          }),
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeMealTypePerformance && reportData.mealTypePerformance?.length > 0) {
        setExportProgress(65);
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Meal Type Utilization Trends', 14, currentY);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Meal Type', 'Qty Sold', 'Revenue', 'Orders', '% Rev', 'Status']],
          body: reportData.mealTypePerformance.map((meal) => {
            const percent = reportData.summary.totalRevenue > 0 ? (meal.totalRevenue / reportData.summary.totalRevenue) * 100 : 0;
            const status = percent >= 40 ? 'High Load' : percent >= 20 ? 'Balanced' : 'Light';
            return [
              meal.mealType || 'Not Specified',
              meal.totalQuantity.toString(),
              formatCurrencyPDF(meal.totalRevenue),
              meal.orderCount.toString(),
              `${percent.toFixed(1)}%`,
              status,
            ];
          }),
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeAllDishes && filteredDishes?.length > 0) {
        setExportProgress(80);
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Menu Item Performance Audit', 14, currentY);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Rank', 'Dish Name', 'Category', 'Qty Sold', 'Revenue', 'Avg Price', 'Status']],
          body: filteredDishes
            .slice(0, 100)
            .map((dish, idx) => [
              (idx + 1).toString(),
              dish.dishName,
              dish.category || 'N/A',
              dish.totalQuantity.toString(),
              formatCurrencyPDF(dish.totalRevenue),
              formatCurrencyPDF(dish.avgPrice),
              getPerformanceLevel(dish).toUpperCase(),
            ]),
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
      }

      doc.save(`Menu_Report_${startDate}_to_${endDate}.pdf`);
      setToastMessage('PDF report exported successfully!');
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage('Error exporting PDF report');
      setShowToast(true);
    } finally {
      setExporting(false);
      setExportProgress(0);
      setExportType('');
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

  if (loading && !reportData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid qsr-page-container">
        <div className="qsr-page-title-container no-print">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="qsr-page-title">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        {activePlans?.includes('Dynamic Reports') && (
          <Card className="menu-performance-report-interactive-card menu-performance-report-filter-card border-0 mb-4 no-print shadow-sm">
            <Card.Body className="p-4">
              <div className="menu-performance-report-card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                  Menu Analytics Parameters
                </h2>
                <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
              </div>
              <Row className="g-4 mt-1">
                <Col xs={12} md={6} lg={2}>
                  <Form.Label className="menu-performance-report-stat-label mb-2">Start Date</Form.Label>
                  <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Col>
                <Col xs={12} md={6} lg={2}>
                  <Form.Label className="menu-performance-report-stat-label mb-2">End Date</Form.Label>
                  <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Col>
                <Col xs={12} md={4} lg={3}>
                  <Form.Label className="menu-performance-report-stat-label mb-2">Category</Form.Label>
                  <FilterSelect
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categories.map((cat) => ({ value: cat, label: cat === 'all' ? 'All Categories' : cat }))}
                  />
                </Col>
                <Col xs={12} md={4} lg={3}>
                  <Form.Label className="menu-performance-report-stat-label mb-2">Meal Type</Form.Label>
                  <FilterSelect
                    value={selectedMealType}
                    onChange={setSelectedMealType}
                    options={mealTypes.map((type) => ({ value: type, label: type === 'all' ? 'All Meal Types' : type }))}
                  />
                </Col>
                
              </Row>
            </Card.Body>
          </Card>
        )}

        {error && (
          <Alert variant="danger" className="mb-4 menu-performance-report-interactive-card border-0">
            {error}
          </Alert>
        )}

        {reportData && (
          <>
            {/* Action Bar */}
            <Card className="menu-performance-report-interactive-card border-0 mb-4 no-print shadow-sm">
              <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div className="d-flex gap-3 align-items-center">
                  <Button
                    variant="outline-success"
                    className="menu-performance-report-custom-btn-outline border-success text-success px-4"
                    onClick={() => handleExportClick('Excel')}
                    disabled={exporting}
                  >
                    <CsLineIcons icon="file-text" className="me-2" size="15" /> Excel
                  </Button>
                  <Button
                    variant="outline-danger"
                    className="menu-performance-report-custom-btn-outline border-danger text-danger px-4"
                    onClick={() => handleExportClick('PDF')}
                    disabled={exporting}
                  >
                    <CsLineIcons icon="file-text" className="me-2" size="15" /> PDF
                  </Button>
                </div>
                {exporting && (
                  <div className="flex-grow-1 ms-md-4 mt-3 mt-md-0">
                    <div className="d-flex align-items-center mb-2">
                      <Spinner animation="border" size="sm" className="me-2" style={{ color: brandColor }} />
                      <span className="smaller fw-bold text-muted">
                        Generating {exportType}... {exportProgress}%
                      </span>
                    </div>
                    <ProgressBar now={exportProgress} className="progress-sm" variant="info" style={{ height: '6px' }} />
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Key Metrics */}
            <Row className="g-3 mb-4">
              <Col xl="3" md="6">
                <Card className="menu-performance-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
                  <Card.Body className="p-4 menu-performance-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="menu-performance-report-stat-label mb-2">Total Items Sold</div>
                        <div className="menu-performance-report-stat-value text-primary">
                          {reportData.dishPerformance.reduce((sum, d) => sum + d.totalQuantity, 0)}
                        </div>
                        <div className="smaller text-muted fw-bold mt-1">Total quantity sold</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: brandBg }}>
                        <CsLineIcons icon="cart" size="24" style={{ color: brandColor }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="menu-performance-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
                  <Card.Body className="p-4 menu-performance-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="menu-performance-report-stat-label mb-2">Menu Revenue</div>
                        <div className="menu-performance-report-stat-value text-success">{formatCurrency(reportData.summary.totalRevenue)}</div>
                        <div className="smaller text-muted fw-bold mt-1">From all dishes</div>
                      </div>
                      <div
                        className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                      >
                        <CsLineIcons icon="money" size="24" style={{ color: '#10b981' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="menu-performance-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #06b6d4' }}>
                  <Card.Body className="p-4 menu-performance-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="menu-performance-report-stat-label mb-2">Menu Categories</div>
                        <div className="menu-performance-report-stat-value text-info">{reportData.summary.totalCategories}</div>
                        <div className="smaller text-muted fw-bold mt-1">Unique groups</div>
                      </div>
                      <div
                        className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center"
                        style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                      >
                        <CsLineIcons icon="grid-5" size="24" style={{ color: '#06b6d4' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="menu-performance-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #f59e0b' }}>
                  <Card.Body className="p-4 menu-performance-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="overflow-hidden">
                        <div className="menu-performance-report-stat-label mb-2">Top Performer</div>
                        <div className="menu-performance-report-stat-value text-warning text-truncate" style={{ fontSize: '1.4rem' }}>
                          {reportData.dishPerformance[0]?.dishName || 'N/A'}
                        </div>
                        <div className="smaller text-muted fw-bold mt-1">Best selling item</div>
                      </div>
                      <div
                        className="rounded-circle d-flex justify-content-center align-items-center flex-shrink-0 ms-2"
                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', width: '52px', height: '52px' }}
                      >
                        <CsLineIcons icon="star" size="24" style={{ color: '#f59e0b' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Performance Distribution */}
            <Card className="menu-performance-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="menu-performance-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Performance Distribution Insights
                  </h2>
                  <CsLineIcons icon="activity" size="18" style={{ color: brandColor }} />
                </div>
                <Row className="g-3 mt-1">
                  <Col md={4}>
                    <Card className="menu-performance-report-interactive-card border-0 p-3 h-100" style={{ background: 'rgba(16, 185, 129, 0.05) !important' }}>
                      <div className="d-flex align-items-center">
                        <div className="sw-5 sh-5 rounded-circle bg-success d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="trend-up" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="menu-performance-report-stat-label">Top Performers</div>
                          <div className="h4 mb-0 fw-900 text-success">
                            {reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent').length}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="menu-performance-report-interactive-card border-0 p-3 h-100" style={{ background: 'rgba(35, 179, 244, 0.05) !important' }}>
                      <div className="d-flex align-items-center">
                        <div className="sw-5 sh-5 rounded-circle bg-info d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="check" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="menu-performance-report-stat-label">Stable Items</div>
                          <div className="h4 mb-0 fw-900 text-info">{reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good').length}</div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="menu-performance-report-interactive-card border-0 p-3 h-100" style={{ background: 'rgba(244, 63, 94, 0.05) !important' }}>
                      <div className="d-flex align-items-center">
                        <div className="sw-5 sh-5 rounded-circle bg-danger d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="trend-down" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="menu-performance-report-stat-label">Low Performers</div>
                          <div className="h4 mb-0 fw-900 text-danger">{reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor').length}</div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
                <Alert variant="info" className="mt-4 menu-performance-report-interactive-card border-0 mb-0 shadow-none">
                  <div className="d-flex align-items-center">
                    <CsLineIcons icon="info-circle" className="text-info me-3 flex-shrink-0" size="24" />
                    <div>
                      <div className="fw-bold text-dark smaller">Optimization Recommendation</div>
                      <div className="smaller text-muted">
                        Top performers contribute to{' '}
                        {(
                          (reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent').reduce((sum, d) => sum + d.totalRevenue, 0) /
                            reportData.summary.totalRevenue) *
                          100
                        ).toFixed(0)}
                        % of your net revenue. Consider highlighting "Low Performers" in daily specials or optimizing their recipe costs.
                      </div>
                    </div>
                  </div>
                </Alert>
              </Card.Body>
            </Card>

            {/* Category Overview Grid */}
            <Card className="menu-performance-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="menu-performance-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Category Yield Insights
                  </h2>
                  <CsLineIcons icon="pie-chart" size="18" style={{ color: brandColor }} />
                </div>
                <Row className="g-3 mt-1">
                  {reportData.categoryPerformance.slice((catPage - 1) * catPerPage, catPage * catPerPage).map((category, idx) => (
                    <Col lg="4" key={idx}>
                      <Card
                        className="menu-performance-report-interactive-card border-0 p-3 h-100"
                        style={{ background: 'rgba(0,0,0,0.01) !important', border: '1px solid rgba(0,0,0,0.05) !important' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="fw-bold text-dark mb-0 text-truncate">{category.category}</div>
                          <Badge bg="primary" className="rounded-pill px-2 flex-shrink-0 ms-2" style={{ fontSize: '0.65rem', backgroundColor: brandColor }}>
                            {category.orderCount} orders
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-1 smaller">
                          <span className="text-muted fw-bold">Revenue:</span>
                          <span className="text-primary fw-bold">{formatCurrency(category.totalRevenue)}</span>
                        </div>
                        <ProgressBar
                          now={(category.totalRevenue / reportData.summary.totalRevenue) * 100}
                          variant="info"
                          className="progress-sm mb-2"
                          style={{ height: '3px' }}
                        />
                        <div className="d-flex justify-content-between smaller">
                          <span className="text-muted">Yield per Dish:</span>
                          <span className="fw-bold text-dark">{formatCurrency(category.avgRevenuePerDish)}</span>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {reportData.categoryPerformance.length > catPerPage && (
                  <div className="d-flex justify-content-center mt-4">
                    <ReportPagination
                      currentPage={catPage}
                      totalPages={Math.ceil(reportData.categoryPerformance.length / catPerPage)}
                      onChangePage={setCatPage}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Meal Type Performance */}
            <Card className="menu-performance-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="menu-performance-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Meal Type Utilization Trends
                  </h2>
                  <CsLineIcons icon="compass" size="18" style={{ color: brandColor }} />
                </div>
                <div className="d-none d-md-block table-responsive mt-3">
                  <Table borderless hover className="align-middle mb-0">
                    <thead className="menu-performance-report-stat-label">
                      <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                        <th className="py-3">Meal Type</th>
                        <th className="py-3 text-end">Qty Sold</th>
                        <th className="py-3 text-end">Revenue</th>
                        <th className="py-3 text-end">Orders</th>
                        <th className="py-3 text-end">% Revenue</th>
                        <th className="py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.mealTypePerformance.map((mealType, idx) => {
                        const percent = (mealType.totalRevenue / reportData.summary.totalRevenue) * 100;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3 fw-bold text-dark">{mealType.mealType || 'Not Specified'}</td>
                            <td className="py-3 text-end fw-bold text-muted smaller">{mealType.totalQuantity}</td>
                            <td className="py-3 text-end fw-bold text-primary">{formatCurrency(mealType.totalRevenue)}</td>
                            <td className="py-3 text-end fw-bold text-dark smaller">{mealType.orderCount}</td>
                            <td className="py-3 text-end fw-bold text-info smaller">{percent.toFixed(1)}%</td>
                            <td className="py-3 text-center">
                              <Badge
                                bg={percent >= 40 ? 'success' : percent >= 20 ? 'info' : 'secondary'}
                                className="rounded-pill px-3 py-2 fw-bold"
                                style={{ fontSize: '0.65rem' }}
                              >
                                {percent >= 40 ? '🔥 HIGH LOAD' : percent >= 20 ? '📊 BALANCED' : '📉 LIGHT'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                <div className="d-md-none d-flex flex-column gap-3 mt-2">
                  {reportData.mealTypePerformance.map((mealType, idx) => {
                    const percent = (mealType.totalRevenue / reportData.summary.totalRevenue) * 100;
                    return (
                      <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.05)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-bold text-dark fs-6">{mealType.mealType || 'Not Specified'}</span>
                          <Badge
                            bg={percent >= 40 ? 'success' : percent >= 20 ? 'info' : 'secondary'}
                            className="rounded-pill px-2 py-1"
                            style={{ fontSize: '0.65rem' }}
                          >
                            {percent >= 40 ? '🔥 HIGH LOAD' : percent >= 20 ? '📊 BALANCED' : '📉 LIGHT'}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Qty Sold:</span>
                          <span className="fw-bold text-dark">{mealType.totalQuantity}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Orders:</span>
                          <span className="fw-bold text-dark">{mealType.orderCount}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                          <span className="text-muted fw-bold">Revenue:</span>
                          <span className="fw-bold text-primary">{formatCurrency(mealType.totalRevenue)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center smaller">
                          <span className="text-muted fw-bold">% Revenue:</span>
                          <span className="fw-bold text-info">{percent.toFixed(1)}%</span>
                        </div>
                      </div>
                      );
                    })}

                  </div>
                </Card.Body>
              </Card>

            {/* Detailed Audit Table */}
            <Card className="menu-performance-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="menu-performance-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: '#23b3f4', fontWeight: '800' }}>
                    Menu Item Performance Audit
                  </h2>
                  <CsLineIcons icon="list" size="18" style={{ color: '#23b3f4' }} />
                </div>
                <div className="d-none d-md-block table-responsive mt-3">
                  <Table borderless hover className="align-middle mb-0">
                    <thead className="menu-performance-report-stat-label">
                      <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                        <th className="py-3">Rank</th>
                        <th className="py-3">Dish Name</th>
                        <th className="py-3">Category</th>
                        <th className="py-3 text-end">Qty Sold</th>
                        <th className="py-3 text-end">Revenue</th>
                        <th className="py-3 text-end">Avg Price</th>
                        <th className="py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDishes.slice((dishPage - 1) * dishPerPage, dishPage * dishPerPage).map((dish, idx) => {
                        const performance = getPerformanceLevel(dish);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3">
                              <Badge bg={idx < 10 ? 'primary' : 'light'} className={`rounded-pill px-3 py-2 ${idx < 10 ? '' : 'text-dark'}`}>
                                {(dishPage - 1) * dishPerPage + idx + 1}
                              </Badge>
                            </td>
                            <td className="py-3 fw-bold text-dark">{dish.dishName}</td>
                            <td className="py-3">
                              <Badge bg="light" className="text-dark rounded-pill px-3 py-2 smaller fw-bold">
                                {dish.category || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 text-end fw-bold text-muted smaller">{dish.totalQuantity}</td>
                            <td className="py-3 text-end fw-bold text-primary">{formatCurrency(dish.totalRevenue)}</td>
                            <td className="py-3 text-end fw-bold text-dark smaller">{formatCurrency(dish.avgPrice)}</td>
                            <td className="py-3 text-center">
                              <Badge
                                bg={performance === 'excellent' ? 'success' : performance === 'good' ? 'info' : 'danger'}
                                className="rounded-pill px-3 py-2 fw-bold"
                                style={{ fontSize: '0.65rem' }}
                              >
                                {performance === 'excellent' ? '🔥 TOP SELLER' : performance === 'good' ? '👍 HEALTHY' : '📈 IMPROVING'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                <div className="d-md-none d-flex flex-column gap-3 mt-3">
                  {filteredDishes.slice((dishPage - 1) * dishPerPage, dishPage * dishPerPage).map((dish, idx) => {
                    const performance = getPerformanceLevel(dish);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded position-relative"
                        style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.05)' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center">
                            <Badge bg={idx < 10 ? 'primary' : 'light'} className={`rounded-pill px-2 py-1 me-2 ${idx < 10 ? '' : 'text-dark'}`}>
                              {(dishPage - 1) * dishPerPage + idx + 1}
                            </Badge>
                            <span className="fw-bold text-dark">{dish.dishName}</span>
                          </div>
                          <Badge
                            bg={performance === 'excellent' ? 'success' : performance === 'good' ? 'info' : 'danger'}
                            className="rounded-pill px-2 py-1 fw-bold"
                            style={{ fontSize: '0.65rem' }}
                          >
                            {performance === 'excellent' ? '🔥 TOP SELLER' : performance === 'good' ? '👍 HEALTHY' : '📈 IMPROVING'}
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <Badge bg="white" className="text-dark border px-2 py-1 smaller fw-bold">
                            {dish.category || 'N/A'}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-1 smaller">
                          <span className="text-muted fw-bold">Qty Sold:</span>
                          <span className="fw-bold text-dark">{dish.totalQuantity}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1 smaller">
                          <span className="text-muted fw-bold">Revenue:</span>
                          <span className="fw-bold text-primary">{formatCurrency(dish.totalRevenue)}</span>
                        </div>
                        <div className="d-flex justify-content-between smaller">
                          <span className="text-muted fw-bold">Avg Price:</span>
                          <span className="fw-bold text-dark">{formatCurrency(dish.avgPrice)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredDishes.length > dishPerPage && (
                  <div className="d-flex justify-content-center mt-4">
                    <ReportPagination
                      currentPage={dishPage}
                      totalPages={Math.ceil(filteredDishes.length / dishPerPage)}
                      onChangePage={setDishPage}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}
      </div>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered contentClassName="interactive-card border-0 shadow-lg">
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>
            Menu Intelligence Export
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted smaller fw-bold mb-4">Customize your menu performance report for optimized decision making.</p>
          <Form className="d-flex flex-column gap-3">
            {[
              { label: 'Executive Summary Metrics', key: 'includeSummary' },
              { label: 'All Dishes Performance Audit', key: 'includeAllDishes' },
              { label: 'Category Yield Analysis', key: 'includeCategoryPerformance' },
              { label: 'Meal Type Utilization', key: 'includeMealTypePerformance' },
              { label: 'Performance Distribution Insights', key: 'includePerformanceDistribution' },
            ].map((option) => (
              <Form.Check
                key={option.key}
                type="switch"
                id={option.key}
                label={<span className="fw-bold smaller text-dark ms-2">{option.label}</span>}
                checked={exportOptions[option.key]}
                onChange={(e) => setExportOptions({ ...exportOptions, [option.key]: e.target.checked })}
              />
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="light" className="menu-performance-report-custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button className="menu-performance-report-custom-btn-outline px-4" onClick={handleExportConfirm}>
            Generate Audit Report
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="white"
          className="menu-performance-report-interactive-card border-0"
        >
          <Toast.Body className="p-3 d-flex align-items-center">
            <CsLineIcons icon="check-circle" className="text-success me-2" size="20" />
            <span className="fw-bold smaller text-dark">{toastMessage}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default MenuPerformanceReport;

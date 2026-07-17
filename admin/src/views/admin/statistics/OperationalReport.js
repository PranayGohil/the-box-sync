import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, Modal, ProgressBar, Toast, ToastContainer, Pagination } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';

const OperationalReport = () => {
  const brandColor = '#23b3f4';
  const brandBg = 'rgba(35, 179, 244, 0.08)';
  const title = 'Operational Performance Report';
  const description = 'Staff, Table, and Time-based Performance Analysis';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/operational', text: 'Operational Report' },
  ];

  const [loading, setLoading] = useState(false);
  const [waiterPage, setWaiterPage] = useState(1);
  const waiterPerPage = 10;
  const [tablePage, setTablePage] = useState(1);
  const tablePerPage = 10;
  const [hourPage, setHourPage] = useState(1);
  const hourPerPage = 10;
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const { currentUser, activePlans } = useContext(AuthContext);

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Export options modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeWaiterPerformance: true,
    includeTablePerformance: true,
    includePeakHours: true,
    includeDayOfWeek: true,
    includeAreaPerformance: true,
    includeInsights: true,
  });

  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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

  const fetchOperationalReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
      };

      const response = await axios.get(`${API_BASE}/statistics/operational`, {
        ...getHeaders(),
        params,
      });

      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching operational report:', err);
      setError(err.response?.data?.error || 'Failed to load operational report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationalReport();
  }, [startDate, endDate]);

  const getBusiestHour = () => {
    if (!reportData?.peakHours || reportData.peakHours.length === 0) return null;
    return reportData.peakHours.reduce((max, hour) => (hour.orderCount > max.orderCount ? hour : max), reportData.peakHours[0]);
  };

  const getBusiestDay = () => {
    if (!reportData?.dayOfWeekAnalysis || reportData.dayOfWeekAnalysis.length === 0) return null;
    return reportData.dayOfWeekAnalysis.reduce((max, day) => (day.orderCount > max.orderCount ? day : max), reportData.dayOfWeekAnalysis[0]);
  };

  const exportToExcel = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');

    try {
      const wb = XLSX.utils.book_new();
      const allData = [];

      const busiestHour = getBusiestHour();
      const busiestDay = getBusiestDay();

      allData.push(['OPERATIONAL PERFORMANCE REPORT']);
      allData.push(['Company:', COMPANY_NAME]);
      allData.push(['Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`]);
      allData.push(['Generated:', format(new Date(), 'dd MMM yyyy hh:mm a')]);
      allData.push([]);

      // Executive Insights
      if (exportOptions.includeInsights) {
        allData.push(['KEY OPERATIONAL METRICS']);
        allData.push(['Metric', 'Value']);
        allData.push(['Total Active Staff', reportData.waiterPerformance?.length || 0]);
        allData.push(['Active Tables', reportData.tablePerformance?.length || 0]);
        allData.push(['Busiest Hour', busiestHour ? `${busiestHour.hour}:00` : 'N/A']);
        allData.push(['Peak Hour Orders', busiestHour ? busiestHour.orderCount : 0]);
        allData.push(['Busiest Day', busiestDay ? busiestDay.dayName : 'N/A']);
        allData.push(['Peak Day Orders', busiestDay ? busiestDay.orderCount : 0]);
        allData.push([]);
        allData.push([]);
      }

      // Waiter Performance
      if (exportOptions.includeWaiterPerformance && reportData.waiterPerformance?.length > 0) {
        allData.push(['STAFF PERFORMANCE RANKING']);
        allData.push(['Rank', 'Name', 'Total Orders', 'Revenue', 'Avg Ticket', 'Tables Served', 'Efficiency']);

        const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;

        reportData.waiterPerformance.forEach((waiter, idx) => {
          const performance = waiter.totalRevenue >= avgRevenue * 1.2 ? 'Excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? 'Good' : 'Needs Improvement';
          allData.push([idx + 1, waiter.waiter, waiter.totalOrders, waiter.totalRevenue, waiter.avgOrderValue, waiter.tablesServed, performance]);
        });
        allData.push([]);
        allData.push([]);
      }

      // Table Performance
      if (exportOptions.includeTablePerformance && reportData.tablePerformance?.length > 0) {
        allData.push(['TABLE UTILIZATION MATRIX']);
        allData.push(['Rank', 'Table No', 'Area', 'Orders', 'Revenue', 'Avg Ticket', 'Footfall', 'Rev/Person']);

        reportData.tablePerformance.slice(0, 50).forEach((table, idx) => {
          allData.push([
            idx + 1,
            table.tableNo,
            table.tableArea || 'GENERAL',
            table.orderCount,
            table.totalRevenue,
            table.avgOrderValue,
            table.totalPersons,
            table.revenuePerPerson,
          ]);
        });
        allData.push([]);
        allData.push([]);
      }

      // Peak Hours
      if (exportOptions.includePeakHours && reportData.peakHours?.length > 0) {
        allData.push(['HOURLY LOAD ANALYSIS']);
        allData.push(['Hour Range', 'Orders', 'Revenue', 'Avg Order Value', 'Activity Level']);
        const maxOrders = Math.max(...reportData.peakHours.map((h) => h.orderCount));

        reportData.peakHours.forEach((hour) => {
          const activityPercent = maxOrders > 0 ? (hour.orderCount / maxOrders) * 100 : 0;
          const activityLevel = activityPercent >= 80 ? 'Peak' : activityPercent >= 50 ? 'Busy' : activityPercent >= 25 ? 'Moderate' : 'Slow';
          allData.push([`${hour.hour}:00 - ${hour.hour + 1}:00`, hour.orderCount, hour.totalRevenue, hour.avgOrderValue, activityLevel]);
        });
        allData.push([]);
        allData.push([]);
      }

      // Day of Week
      if (exportOptions.includeDayOfWeek && reportData.dayOfWeekAnalysis?.length > 0) {
        allData.push(['WEEKLY PERFORMANCE']);
        allData.push(['Day', 'Orders', 'Revenue', 'Avg Order Value']);
        reportData.dayOfWeekAnalysis.forEach((day) => {
          allData.push([day.dayName, day.orderCount, day.totalRevenue, day.avgOrderValue]);
        });
        allData.push([]);
        allData.push([]);
      }

      // Area Performance
      if (exportOptions.includeAreaPerformance && reportData.areaPerformance?.length > 0) {
        allData.push(['AREA PERFORMANCE ANALYTICS']);
        allData.push(['Area', 'Orders', 'Revenue', 'Avg Ticket', 'Tables', 'Revenue/Table']);

        reportData.areaPerformance.forEach((area) => {
          allData.push([area.area, area.orderCount, area.totalRevenue, area.avgOrderValue, area.tableCount, area.revenuePerTable]);
        });
        allData.push([]);
        allData.push([]);
      }

      const sheet = XLSX.utils.aoa_to_sheet(allData);
      sheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(wb, sheet, 'Operational Report');

      XLSX.writeFile(wb, `Operational_Report_${startDate}_to_${endDate}.xlsx`);
      setToastMessage('Excel report exported successfully!');
      setShowToast(true);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setToastMessage('Error exporting Excel file');
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
    setExportType('PDF');
    try {
      const doc = new jsPDF();

      const busiestHour = getBusiestHour();
      const busiestDay = getBusiestDay();

      doc.setFontSize(16);
      doc.text('Operational Performance Report', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(COMPANY_NAME, 105, 22, { align: 'center' });
      doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 28, { align: 'center' });

      let currentY = 35;

      if (exportOptions.includeInsights) {
        doc.setFontSize(12);
        doc.text('Executive Summary', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Metric', 'Value']],
          body: [
            ['Total Active Staff', (reportData.waiterPerformance?.length || 0).toString()],
            ['Active Tables', (reportData.tablePerformance?.length || 0).toString()],
            ['Busiest Hour', busiestHour ? `${busiestHour.hour}:00 (${busiestHour.orderCount} orders)` : 'N/A'],
            ['Busiest Day', busiestDay ? `${busiestDay.dayName} (${busiestDay.orderCount} orders)` : 'N/A'],
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeWaiterPerformance && reportData.waiterPerformance?.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Staff Performance Ranking', 14, currentY);

        const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;

        const waiterBody = reportData.waiterPerformance.map((waiter, index) => {
          const performance = waiter.totalRevenue >= avgRevenue * 1.2 ? 'Excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? 'Good' : 'Needs Improvement';
          return [
            (index + 1).toString(),
            waiter.waiter,
            waiter.totalOrders.toString(),
            formatCurrencyPDF(waiter.totalRevenue),
            formatCurrencyPDF(waiter.avgOrderValue),
            waiter.tablesServed.toString(),
            performance,
          ];
        });

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Rank', 'Name', 'Orders', 'Revenue', 'Avg Ticket', 'Tables', 'Efficiency']],
          body: waiterBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeTablePerformance && reportData.tablePerformance?.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Table Utilization Matrix', 14, currentY);

        const tableBody = reportData.tablePerformance
          .slice(0, 50)
          .map((table, index) => [
            (index + 1).toString(),
            table.tableNo,
            table.tableArea || 'GENERAL',
            table.orderCount.toString(),
            formatCurrencyPDF(table.totalRevenue),
            table.totalPersons.toString(),
          ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Rank', 'Table', 'Area', 'Orders', 'Revenue', 'Footfall']],
          body: tableBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includePeakHours && reportData.peakHours?.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Hourly Load Analysis', 14, currentY);

        const maxOrders = Math.max(...reportData.peakHours.map((h) => h.orderCount));

        const hoursBody = reportData.peakHours.map((hour) => {
          const activityPercent = maxOrders > 0 ? (hour.orderCount / maxOrders) * 100 : 0;
          const activityLevel = activityPercent >= 80 ? 'Peak' : activityPercent >= 50 ? 'Busy' : activityPercent >= 25 ? 'Moderate' : 'Slow';
          return [`${hour.hour}:00 - ${hour.hour + 1}:00`, hour.orderCount.toString(), formatCurrencyPDF(hour.totalRevenue), activityLevel];
        });

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Hour Range', 'Orders', 'Revenue', 'Activity']],
          body: hoursBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeDayOfWeek && reportData.dayOfWeekAnalysis?.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Weekly Performance', 14, currentY);

        const dayBody = reportData.dayOfWeekAnalysis.map((day) => [
          day.dayName,
          day.orderCount.toString(),
          formatCurrencyPDF(day.totalRevenue),
          formatCurrencyPDF(day.avgOrderValue),
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Day', 'Orders', 'Revenue', 'Avg Order Value']],
          body: dayBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeAreaPerformance && reportData.areaPerformance?.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.text('Area Performance Analytics', 14, currentY);

        const areaBody = reportData.areaPerformance.map((area) => [
          area.area,
          area.tableCount.toString(),
          area.orderCount.toString(),
          formatCurrencyPDF(area.totalRevenue),
          formatCurrencyPDF(area.avgOrderValue),
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Area', 'Tables', 'Orders', 'Revenue', 'Avg Ticket']],
          body: areaBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
        });
      }

      doc.save(`Operational_Report_${startDate}_to_${endDate}.pdf`);
      setToastMessage('PDF report exported successfully!');
      setShowToast(true);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setToastMessage('Error exporting PDF file');
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
    if (exportType === 'Excel') {
      exportToExcel();
    } else if (exportType === 'PDF') {
      exportToPDF();
    }
  };

  if (loading && !reportData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const busiestHour = getBusiestHour();
  const busiestDay = getBusiestDay();

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
          <Card className="operational-report-interactive-card border-0 mb-4 no-print shadow-sm">
            <Card.Body className="p-4">
              <div className="operational-report-card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                  Operational Parameters
                </h2>
                <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
              </div>
              <Row className="g-3 align-items-end">
                <Col xs={12} md={5}>
                  <Form.Label className="operational-report-stat-label mb-2">Start Date</Form.Label>
                  <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Col>
                <Col xs={12} md={5}>
                  <Form.Label className="operational-report-stat-label mb-2">End Date</Form.Label>
                  <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Col>
                
              </Row>
            </Card.Body>
          </Card>
        )}

        {error && (
          <Alert variant="danger" className="mb-4 operational-report-interactive-card border-0">
            {error}
          </Alert>
        )}

        {reportData && (
          <>
            {/* Action Bar */}
            <Card className="operational-report-interactive-card border-0 mb-4 no-print shadow-sm">
              <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div className="d-flex gap-3 align-items-center">
                  <Button
                    variant="outline-success"
                    className="operational-report-custom-btn-outline border-success text-success px-4"
                    onClick={() => handleExportClick('Excel')}
                    disabled={exporting}
                  >
                    <CsLineIcons icon="file-text" className="me-2" size="15" /> Excel
                  </Button>
                  <Button
                    variant="outline-danger"
                    className="operational-report-custom-btn-outline border-danger text-danger px-4"
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

            {/* Key Insights Row */}
            <Row className="g-3 mb-4">
              <Col xl="3" md="6">
                <Card className="operational-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
                  <Card.Body className="p-4 operational-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="operational-report-stat-label mb-2">Total Staff</div>
                        <div className="operational-report-stat-value text-primary">{reportData.waiterPerformance?.length || 0}</div>
                        <div className="smaller text-muted fw-bold mt-1">Active waiters</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: brandBg }}>
                        <CsLineIcons icon="user" size="24" style={{ color: brandColor }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="operational-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #f59e0b' }}>
                  <Card.Body className="p-4 operational-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="operational-report-stat-label mb-2">Busiest Hour</div>
                        <div className="operational-report-stat-value text-warning">{busiestHour ? `${busiestHour.hour}:00` : 'N/A'}</div>
                        <div className="smaller text-muted fw-bold mt-1">{busiestHour ? `${busiestHour.orderCount} orders` : 'No data'}</div>
                      </div>
                      <div
                        className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center"
                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                      >
                        <CsLineIcons icon="clock" size="24" style={{ color: '#f59e0b' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="operational-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
                  <Card.Body className="p-4 operational-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="operational-report-stat-label mb-2">Busiest Day</div>
                        <div className="operational-report-stat-value text-success">{busiestDay ? busiestDay.dayName : 'N/A'}</div>
                        <div className="smaller text-muted fw-bold mt-1">{busiestDay ? `${busiestDay.orderCount} orders` : 'No data'}</div>
                      </div>
                      <div
                        className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                      >
                        <CsLineIcons icon="calendar" size="24" style={{ color: '#10b981' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="operational-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #06b6d4' }}>
                  <Card.Body className="p-4 operational-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="operational-report-stat-label mb-2">Active Tables</div>
                        <div className="operational-report-stat-value text-info">{reportData.tablePerformance?.length || 0}</div>
                        <div className="smaller text-muted fw-bold mt-1">Tables served</div>
                      </div>
                      <div
                        className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center"
                        style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                      >
                        <CsLineIcons icon="layout-5" size="24" style={{ color: '#06b6d4' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Waiter Performance */}
            <Card className="operational-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="operational-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Staff Performance Ranking
                  </h2>
                  <CsLineIcons icon="star" size="18" style={{ color: brandColor }} />
                </div>
                <div className="table-responsive mt-3">
                  <Table borderless hover className="align-middle mb-0">
                    <thead className="operational-report-stat-label">
                      <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                        <th className="py-3">Rank</th>
                        <th className="py-3">Name</th>
                        <th className="py-3 text-end">Orders</th>
                        <th className="py-3 text-end">Revenue</th>
                        <th className="py-3 text-end d-none d-md-table-cell">Avg Ticket</th>
                        <th className="py-3 text-end d-none d-lg-table-cell">Tables</th>
                        <th className="py-3 text-center d-none d-sm-table-cell">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.waiterPerformance.slice((waiterPage - 1) * waiterPerPage, waiterPage * waiterPerPage).map((waiter, idx) => {
                        const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;
                        const performance =
                          waiter.totalRevenue >= avgRevenue * 1.2 ? 'excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? 'good' : 'needs-improvement';
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                            <td className="py-3">
                              <Badge bg={idx < 3 ? 'primary' : 'light'} className={`rounded-pill px-3 py-2 ${idx < 3 ? '' : 'text-dark'}`}>
                                {idx + 1}
                              </Badge>
                            </td>
                            <td className="py-3 fw-bold text-dark">{waiter.waiter}</td>
                            <td className="py-3 text-end fw-bold text-muted smaller">{waiter.totalOrders}</td>
                            <td className="py-3 text-end fw-bold text-primary">{formatCurrency(waiter.totalRevenue)}</td>
                            <td className="py-3 text-end fw-bold text-dark smaller d-none d-md-table-cell">{formatCurrency(waiter.avgOrderValue)}</td>
                            <td className="py-3 text-end fw-bold text-muted smaller d-none d-lg-table-cell">{waiter.tablesServed}</td>
                            <td className="py-3 text-center d-none d-sm-table-cell">
                              <Badge
                                bg={performance === 'excellent' ? 'success' : performance === 'good' ? 'info' : 'warning'}
                                className="rounded-pill px-3 py-2 fw-bold"
                                style={{ fontSize: '0.65rem' }}
                              >
                                {performance === 'excellent' ? '⭐ TOP PERFORMER' : performance === 'good' ? '👍 STABLE' : '📈 IMPROVING'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  {reportData.waiterPerformance.length > waiterPerPage && (
                    <div className="d-flex justify-content-end mt-3">
                      <Pagination size="sm">
                        <Pagination.Prev onClick={() => setWaiterPage(p => Math.max(1, p - 1))} disabled={waiterPage === 1} />
                        <Pagination.Item active>{waiterPage}</Pagination.Item>
                        <Pagination.Next onClick={() => setWaiterPage(p => Math.min(Math.ceil(reportData.waiterPerformance.length / waiterPerPage), p + 1))} disabled={waiterPage === Math.ceil(reportData.waiterPerformance.length / waiterPerPage)} />
                      </Pagination>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Table Performance */}
            <Card className="operational-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="operational-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Table Utilization Matrix
                  </h2>
                  <CsLineIcons icon="grid-5" size="18" style={{ color: brandColor }} />
                </div>
                <div className="table-responsive mt-3">
                  <Table borderless hover className="align-middle mb-0">
                    <thead className="operational-report-stat-label">
                      <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                        <th className="py-3">Table No</th>
                        <th className="py-3 d-none d-sm-table-cell">Area</th>
                        <th className="py-3 text-end">Orders</th>
                        <th className="py-3 text-end">Revenue</th>
                        <th className="py-3 text-end d-none d-md-table-cell">Avg Ticket</th>
                        <th className="py-3 text-end d-none d-lg-table-cell">Footfall</th>
                        <th className="py-3 text-end d-none d-xl-table-cell">Rev/Person</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.tablePerformance.slice((tablePage - 1) * tablePerPage, tablePage * tablePerPage).map((table, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                          <td className="py-3 fw-bold text-dark">{table.tableNo}</td>
                          <td className="py-3 d-none d-sm-table-cell">
                            <Badge bg="light" className="text-dark rounded-pill px-3 py-2 smaller">
                              {table.tableArea || 'GENERAL'}
                            </Badge>
                          </td>
                          <td className="py-3 text-end fw-bold text-muted smaller">{table.orderCount}</td>
                          <td className="py-3 text-end fw-bold text-success">{formatCurrency(table.totalRevenue)}</td>
                          <td className="py-3 text-end fw-bold text-dark smaller d-none d-md-table-cell">{formatCurrency(table.avgOrderValue)}</td>
                          <td className="py-3 text-end fw-bold text-muted smaller d-none d-lg-table-cell">{table.totalPersons}</td>
                          <td className="py-3 text-end fw-bold text-info smaller d-none d-xl-table-cell">{formatCurrency(table.revenuePerPerson)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {reportData.tablePerformance.length > tablePerPage && (
                    <div className="d-flex justify-content-end mt-3">
                      <Pagination size="sm">
                        <Pagination.Prev onClick={() => setTablePage(p => Math.max(1, p - 1))} disabled={tablePage === 1} />
                        <Pagination.Item active>{tablePage}</Pagination.Item>
                        <Pagination.Next onClick={() => setTablePage(p => Math.min(Math.ceil(reportData.tablePerformance.length / tablePerPage), p + 1))} disabled={tablePage === Math.ceil(reportData.tablePerformance.length / tablePerPage)} />
                      </Pagination>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Peak Hours & Day Trends */}
            <Row className="g-3 mb-4">
              <Col lg="6">
                <Card className="operational-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="operational-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                        Hourly Load Analysis
                      </h2>
                      <CsLineIcons icon="activity" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="d-flex flex-column gap-3 mt-3">
                      {reportData.peakHours.slice((hourPage - 1) * hourPerPage, hourPage * hourPerPage).map((hour, idx) => {
                        const maxOrders = Math.max(...reportData.peakHours.map((h) => h.orderCount));
                        const activityPercent = (hour.orderCount / maxOrders) * 100;
                        const level = activityPercent >= 80 ? 'danger' : activityPercent >= 50 ? 'warning' : 'info';
                        return (
                          <div key={idx}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="smaller fw-bold text-dark">
                                {hour.hour}:00 - {hour.hour + 1}:00
                              </span>
                              <span className={`smaller fw-bold text-${level}`}>{hour.orderCount} Orders</span>
                            </div>
                            <ProgressBar now={activityPercent} variant={level} className="progress-sm" style={{ height: '4px' }} />
                          </div>
                        );
                      })}
                    </div>
                    {reportData.peakHours.length > hourPerPage && (
                      <div className="d-flex justify-content-center mt-3">
                        <Pagination size="sm">
                          <Pagination.Prev onClick={() => setHourPage(p => Math.max(1, p - 1))} disabled={hourPage === 1} />
                          <Pagination.Item active>{hourPage}</Pagination.Item>
                          <Pagination.Next onClick={() => setHourPage(p => Math.min(Math.ceil(reportData.peakHours.length / hourPerPage), p + 1))} disabled={hourPage === Math.ceil(reportData.peakHours.length / hourPerPage)} />
                        </Pagination>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col lg="6">
                <Card className="operational-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="operational-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                        Weekly Performance
                      </h2>
                      <CsLineIcons icon="trend-up" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="d-flex flex-column gap-4 mt-3">
                      {(() => {
                        if (!reportData.dayOfWeekAnalysis || reportData.dayOfWeekAnalysis.length === 0) return null;
                        const avgRevenue = reportData.dayOfWeekAnalysis.reduce((sum, d) => sum + d.totalRevenue, 0) / reportData.dayOfWeekAnalysis.length;
                        return reportData.dayOfWeekAnalysis.map((day, idx) => {
                          const isBest = day.totalRevenue >= avgRevenue * 1.2;
                          const isSlow = day.totalRevenue < avgRevenue * 0.8;
                          const badgeBg = isBest ? 'success' : isSlow ? 'warning' : 'light';
                          const badgeText = isBest ? 'BEST DAY' : isSlow ? 'SLOW DAY' : 'NORMAL';
                          const textClass = isBest ? 'text-white' : isSlow ? 'text-dark' : 'text-dark';
                          return (
                            <div key={idx} className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center overflow-hidden">
                                <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3 flex-shrink-0" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                  <span className="fw-bold smaller text-muted">{day.dayName.substring(0, 1)}</span>
                                </div>
                                <div className="overflow-hidden">
                                  <div className="fw-bold text-dark mb-0 text-truncate">{day.dayName}</div>
                                  <div className="smaller text-muted fw-bold">{day.orderCount} Orders</div>
                                </div>
                              </div>
                              <div className="text-end ms-2 flex-shrink-0">
                                <div className="fw-bold text-primary smaller">{formatCurrency(day.totalRevenue)}</div>
                                <Badge bg={badgeBg} className={`rounded-pill px-2 py-1 ${textClass}`} style={{ fontSize: '0.6rem' }}>{badgeText}</Badge>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Area Performance */}
            {reportData.areaPerformance && reportData.areaPerformance.length > 0 && (
              <Card className="operational-report-interactive-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="operational-report-card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                      Area Performance Analytics
                    </h2>
                    <CsLineIcons icon="pin" size="18" style={{ color: brandColor }} />
                  </div>
                  <Row className="g-3 mt-1">
                    {reportData.areaPerformance.map((area, idx) => (
                      <Col lg="4" key={idx}>
                        <Card className="operational-report-interactive-card border-0 p-3 h-100" style={{ background: 'rgba(0,0,0,0.01) !important', border: '1px solid rgba(0,0,0,0.05) !important' }}>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <div className="fw-bold text-dark mb-0">{area.area}</div>
                              <div className="smaller text-muted fw-bold">{area.tableCount} Tables</div>
                            </div>
                            <Badge bg="primary" style={{ backgroundColor: brandColor }}>{area.orderCount} orders</Badge>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="smaller text-muted fw-bold">Revenue:</span>
                            <span className="smaller text-primary fw-bold">{formatCurrency(area.totalRevenue)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="smaller text-muted fw-bold">Avg Order:</span>
                            <span className="smaller text-success fw-bold">{formatCurrency(area.avgOrderValue)}</span>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered contentClassName="interactive-card border-0 shadow-lg">
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>
            Operational Intelligence Export
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted smaller fw-bold mb-4">Select performance modules to include in your {exportType} analysis.</p>
          <Form className="d-flex flex-column gap-3">
            {[
              { label: 'Staff Performance Ranking', key: 'includeWaiterPerformance' },
              { label: 'Table Utilization Matrix', key: 'includeTablePerformance' },
              { label: 'Peak Hourly Load Analysis', key: 'includePeakHours' },
              { label: 'Weekly Performance Trends', key: 'includeDayOfWeek' },
              { label: 'Area Optimization Data', key: 'includeAreaPerformance' },
              { label: 'Executive Insights', key: 'includeInsights' },
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
          <Button variant="light" className="operational-report-custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button className="operational-report-custom-btn-outline px-4" onClick={handleExportConfirm}>
            Generate Intelligence Report
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="white" className="operational-report-interactive-card border-0">
          <Toast.Body className="p-3 d-flex align-items-center">
            <CsLineIcons icon="check-circle" className="text-success me-2" size="20" />
            <span className="fw-bold smaller text-dark">{toastMessage}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default OperationalReport;

import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, Modal, ProgressBar, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    .form-control, .form-select {
      border-radius: 0.8rem !important;
      padding: 0.6rem 1rem !important;
      border: 1.5px solid rgba(0,0,0,0.05) !important;
      background: rgba(0,0,0,0.01) !important;
      font-weight: 600 !important;
    }
`;

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
  }, []);

  const getBusiestHour = () => {
    if (!reportData?.peakHours || reportData.peakHours.length === 0) return null;
    return reportData.peakHours.reduce((max, hour) => (hour.orderCount > max.orderCount ? hour : max), reportData.peakHours[0]);
  };

  const getBusiestDay = () => {
    if (!reportData?.dayOfWeekAnalysis || reportData.dayOfWeekAnalysis.length === 0) return null;
    return reportData.dayOfWeekAnalysis.reduce((max, day) => (day.orderCount > max.orderCount ? day : max), reportData.dayOfWeekAnalysis[0]);
  };

  // Enhanced Excel Export
  const exportToExcel = async () => {
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');

    try {
      const wb = XLSX.utils.book_new();

      const busiestHour = getBusiestHour();
      const busiestDay = getBusiestDay();

      // Dashboard Sheet
      if (exportOptions.includeInsights) {
        setExportProgress(15);
        const dashboardData = [
          ['OPERATIONAL PERFORMANCE DASHBOARD'],
          [],
          ['Company:', COMPANY_NAME],
          ['Report Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`],
          ['Generated On:', format(new Date(), 'dd MMM yyyy HH:mm')],
          [],
          ['KEY OPERATIONAL METRICS'],
          ['Metric', 'Value'],
          ['Total Active Staff', reportData.waiterPerformance?.length || 0],
          ['Active Tables', reportData.tablePerformance?.length || 0],
          ['Busiest Hour', busiestHour ? `${busiestHour.hour}:00` : 'N/A'],
          ['Peak Hour Orders', busiestHour ? busiestHour.orderCount : 0],
          ['Busiest Day', busiestDay ? busiestDay.dayName : 'N/A'],
          ['Peak Day Orders', busiestDay ? busiestDay.orderCount : 0],
          [],
          ['TOP PERFORMERS'],
          ['Category', 'Name', 'Performance'],
        ];

        // Add top waiter
        if (reportData.waiterPerformance && reportData.waiterPerformance.length > 0) {
          const topWaiter = reportData.waiterPerformance[0];
          dashboardData.push(['Top Waiter', topWaiter.waiter, `${topWaiter.totalOrders} orders`]);
        }

        // Add top table
        if (reportData.tablePerformance && reportData.tablePerformance.length > 0) {
          const topTable = reportData.tablePerformance[0];
          dashboardData.push(['Top Table', topTable.tableNo, `${topTable.orderCount} orders`]);
        }

        const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
        dashboardSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, dashboardSheet, 'Dashboard');
      }

      // Waiter Performance Sheet
      if (exportOptions.includeWaiterPerformance) {
        setExportProgress(30);
        const waiterData = [
          ['WAITER PERFORMANCE ANALYSIS'],
          [],
          ['Rank', 'Waiter', 'Total Orders', 'Revenue', 'Avg Order Value', 'Tables Served', 'Total Discount', 'Revenue/Order', 'Performance Rating'],
        ];

        const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;

        reportData.waiterPerformance.forEach((waiter, idx) => {
          const performance = waiter.totalRevenue >= avgRevenue * 1.2 ? 'Excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? 'Good' : 'Needs Improvement';

          waiterData.push([
            idx + 1,
            waiter.waiter,
            waiter.totalOrders,
            waiter.totalRevenue,
            waiter.avgOrderValue,
            waiter.tablesServed,
            waiter.totalDiscount,
            waiter.revenuePerOrder,
            performance,
          ]);
        });

        const waiterSheet = XLSX.utils.aoa_to_sheet(waiterData);
        waiterSheet['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 14 }, { wch: 15 }, { wch: 16 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
        
        const range = XLSX.utils.decode_range(waiterSheet['!ref']);
        for (let R = 3; R <= range.e.r; R += 1) {
          const revenueCell = XLSX.utils.encode_cell({ r: R, c: 3 });
          const avgCell = XLSX.utils.encode_cell({ r: R, c: 4 });
          if (waiterSheet[revenueCell]) waiterSheet[revenueCell].z = '"Rs. "#,##0';
          if (waiterSheet[avgCell]) waiterSheet[avgCell].z = '"Rs. "#,##0';
        }

        XLSX.utils.book_append_sheet(wb, waiterSheet, 'Waiter Performance');
      }

      // Table Performance Sheet
      if (exportOptions.includeTablePerformance) {
        setExportProgress(45);
        const tableData = [
          ['TABLE PERFORMANCE ANALYSIS'],
          [],
          ['Rank', 'Table No', 'Area', 'Orders', 'Revenue', 'Avg Order', 'Total Persons', 'Avg Persons', 'Revenue/Person'],
        ];

        reportData.tablePerformance.forEach((table, idx) => {
          tableData.push([
            idx + 1,
            table.tableNo,
            table.tableArea || 'N/A',
            table.orderCount,
            table.totalRevenue,
            table.avgOrderValue,
            table.totalPersons,
            table.avgPersonsPerOrder,
            table.revenuePerPerson,
          ]);
        });

        const tableSheet = XLSX.utils.aoa_to_sheet(tableData);
        tableSheet['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, tableSheet, 'Table Performance');
      }

      // Peak Hours Sheet
      if (exportOptions.includePeakHours) {
        setExportProgress(60);
        const hoursData = [['HOURLY PERFORMANCE ANALYSIS'], [], ['Hour', 'Time Range', 'Orders', 'Revenue', 'Avg Order Value', 'Activity Level']];
        const maxOrders = Math.max(...reportData.peakHours.map((h) => h.orderCount));

        reportData.peakHours.forEach((hour) => {
          const activityPercent = (hour.orderCount / maxOrders) * 100;
          const activityLevel = activityPercent >= 80 ? 'Peak' : activityPercent >= 50 ? 'Busy' : activityPercent >= 25 ? 'Moderate' : 'Slow';
          hoursData.push([hour.hour, `${hour.hour}:00 - ${hour.hour + 1}:00`, hour.orderCount, hour.totalRevenue, hour.avgOrderValue, activityLevel]);
        });

        const hoursSheet = XLSX.utils.aoa_to_sheet(hoursData);
        hoursSheet['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 16 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, hoursSheet, 'Peak Hours');
      }

      // Day of Week Sheet
      if (exportOptions.includeDayOfWeek) {
        setExportProgress(75);
        const dayData = [['DAY OF WEEK ANALYSIS'], [], ['Day', 'Orders', 'Revenue', 'Avg Order Value', 'Performance Rating']];
        const avgRevenue = reportData.dayOfWeekAnalysis.reduce((sum, d) => sum + d.totalRevenue, 0) / reportData.dayOfWeekAnalysis.length;

        reportData.dayOfWeekAnalysis.forEach((day) => {
          const performance = day.totalRevenue >= avgRevenue * 1.2 ? 'Best Day' : day.totalRevenue >= avgRevenue * 0.8 ? 'Average' : 'Below Average';
          dayData.push([day.dayName, day.orderCount, day.totalRevenue, day.avgOrderValue, performance]);
        });

        const daySheet = XLSX.utils.aoa_to_sheet(dayData);
        daySheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 16 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, daySheet, 'Day of Week');
      }

      // Area Performance Sheet
      if (exportOptions.includeAreaPerformance && reportData.areaPerformance && reportData.areaPerformance.length > 0) {
        setExportProgress(85);
        const areaData = [['TABLE AREA PERFORMANCE'], [], ['Area', 'Orders', 'Revenue', 'Avg Order', 'Tables', 'Revenue/Table']];

        reportData.areaPerformance.forEach((area) => {
          areaData.push([area.area, area.orderCount, area.totalRevenue, area.avgOrderValue, area.tableCount, area.revenuePerTable]);
        });

        const areaSheet = XLSX.utils.aoa_to_sheet(areaData);
        areaSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, areaSheet, 'Area Performance');
      }

      setExportProgress(95);
      XLSX.writeFile(wb, `Operational_Report_${startDate}_to_${endDate}.xlsx`);
      setExportProgress(100);
      setToastMessage('Excel report exported successfully!');
      setShowToast(true);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setToastMessage('Error exporting Excel file');
      setShowToast(true);
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
    }
  };

  // Enhanced PDF Export
  const exportToPDF = async () => {
    if (!reportData) return;

    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');

    try {
      const doc = new jsPDF('landscape');
      let yPosition = 20;

      const busiestHour = getBusiestHour();
      const busiestDay = getBusiestDay();

      // Executive Summary Page
      setExportProgress(15);
      doc.setFillColor(35, 179, 244);
      doc.rect(0, 0, 297, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('OPERATIONAL PERFORMANCE REPORT', 148.5, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text(COMPANY_NAME, 148.5, 30, { align: 'center' });

      yPosition = 50;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Report Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`, 20, yPosition);
      yPosition += 15;

      if (exportOptions.includeInsights) {
        doc.setFontSize(16);
        doc.text('Executive Summary', 20, yPosition);
        yPosition += 12;

        const metrics = [
          { label: 'Active Staff', value: (reportData.waiterPerformance?.length || 0).toString(), color: [35, 179, 244] },
          { label: 'Active Tables', value: (reportData.tablePerformance?.length || 0).toString(), color: [16, 185, 129] },
          { label: 'Busiest Hour', value: busiestHour ? `${busiestHour.hour}:00` : 'N/A', color: [245, 158, 11] },
          { label: 'Busiest Day', value: busiestDay ? busiestDay.dayName : 'N/A', color: [139, 92, 246] },
        ];

        metrics.forEach((metric, idx) => {
          const xPos = 20 + idx * 65;
          doc.setFillColor(...metric.color);
          doc.roundedRect(xPos, yPosition, 60, 25, 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.text(metric.label, xPos + 30, yPosition + 9, { align: 'center' });
          doc.setFontSize(14);
          doc.text(metric.value, xPos + 30, yPosition + 19, { align: 'center' });
        });

        yPosition += 40;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const topWaiter = reportData.waiterPerformance?.[0];
        const insights = [
          `• Top performing waiter: ${topWaiter?.waiter || 'N/A'} (${topWaiter?.totalOrders || 0} orders)`,
          `• Peak business hours: ${busiestHour ? `${busiestHour.hour}:00-${busiestHour.hour + 1}:00` : 'N/A'} with ${busiestHour?.orderCount || 0} orders`,
          `• Busiest day of week: ${busiestDay?.dayName || 'N/A'} with ${formatCurrencyPDF(busiestDay?.totalRevenue || 0)} revenue`,
        ];
        insights.forEach((insight) => {
          doc.text(insight, 20, yPosition);
          yPosition += 7;
        });

        doc.addPage();
        yPosition = 20;
      }

      // Tables
      if (exportOptions.includeWaiterPerformance) {
        setExportProgress(40);
        doc.setFontSize(14);
        doc.text('Waiter Performance Analysis', 20, yPosition);
        autoTable(doc, {
          startY: yPosition + 8,
          head: [['Rank', 'Waiter', 'Orders', 'Revenue', 'Avg Order', 'Tables', 'Performance']],
          body: reportData.waiterPerformance.map((waiter, idx) => [
            (idx + 1).toString(),
            waiter.waiter,
            waiter.totalOrders.toString(),
            formatCurrencyPDF(waiter.totalRevenue),
            formatCurrencyPDF(waiter.avgOrderValue),
            waiter.tablesServed.toString(),
            waiter.totalRevenue >= 10000 ? '⭐ Excellent' : '👍 Good'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeTablePerformance) {
        setExportProgress(60);
        if (yPosition > 180) { doc.addPage(); yPosition = 20; }
        doc.setFontSize(14);
        doc.text('Table Performance Analysis', 20, yPosition);
        autoTable(doc, {
          startY: yPosition + 8,
          head: [['Table', 'Area', 'Orders', 'Revenue', 'Avg Order', 'Rev/Person']],
          body: reportData.tablePerformance.slice(0, 15).map(table => [
            table.tableNo,
            table.tableArea || 'N/A',
            table.orderCount.toString(),
            formatCurrencyPDF(table.totalRevenue),
            formatCurrencyPDF(table.avgOrderValue),
            formatCurrencyPDF(table.revenuePerPerson)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [35, 179, 244] }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      setExportProgress(95);
      doc.save(`Operational_Report_${startDate}_to_${endDate}.pdf`);
      setExportProgress(100);
      setToastMessage('PDF report exported successfully!');
      setShowToast(true);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setToastMessage('Error exporting PDF file');
      setShowToast(true);
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportType('');
      }, 500);
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
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4 mt-5 mt-lg-0 no-print">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {activePlans?.includes('Dynamic Reports') && (
        <Card className="interactive-card border-0 mb-4 no-print shadow-sm">
          <Card.Body className="p-4">
            <div className="card-title-container">
              <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Operational Parameters</h2>
              <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
            </div>
            <Row className="g-3 align-items-end">
              <Col md={5}>
                <Form.Label className="stat-label mb-2">Start Date</Form.Label>
                <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Col>
              <Col md={5}>
                <Form.Label className="stat-label mb-2">End Date</Form.Label>
                <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Col>
              <Col md={2}>
                <Button className="custom-btn-outline w-100" onClick={fetchOperationalReport} disabled={loading}>
                  <CsLineIcons icon="sync" className={`me-2 ${loading ? 'spin' : ''}`} size="15" />
                  {loading ? 'Processing...' : 'Generate'}
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
                  <div className="d-flex align-items-center mb-2">
                    <Spinner animation="border" size="sm" className="me-2" style={{ color: brandColor }} />
                    <span className="smaller fw-bold text-muted">Generating {exportType}...</span>
                  </div>
                  <ProgressBar now={exportProgress} className="progress-sm" variant="info" style={{ height: '6px' }} />
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Key Insights Row */}
          <Row className="g-4 mb-4">
            <Col xl="3" md="6">
              <Card className="interactive-card border-0 h-100 shadow-sm">
                <Card.Body className="p-4 stat-card-inner">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="stat-label mb-2">Total Staff</div>
                      <div className="stat-value text-primary">{reportData.waiterPerformance?.length || 0}</div>
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
              <Card className="interactive-card border-0 h-100 shadow-sm">
                <Card.Body className="p-4 stat-card-inner">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="stat-label mb-2">Busiest Hour</div>
                      <div className="stat-value text-warning">{busiestHour ? `${busiestHour.hour}:00` : 'N/A'}</div>
                      <div className="smaller text-muted fw-bold mt-1">{busiestHour ? `${busiestHour.orderCount} orders` : 'No data'}</div>
                    </div>
                    <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                      <CsLineIcons icon="clock" size="24" style={{ color: '#f59e0b' }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl="3" md="6">
              <Card className="interactive-card border-0 h-100 shadow-sm">
                <Card.Body className="p-4 stat-card-inner">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="stat-label mb-2">Busiest Day</div>
                      <div className="stat-value text-success">{busiestDay ? busiestDay.dayName : 'N/A'}</div>
                      <div className="smaller text-muted fw-bold mt-1">{busiestDay ? `${busiestDay.orderCount} orders` : 'No data'}</div>
                    </div>
                    <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                      <CsLineIcons icon="calendar" size="24" style={{ color: '#10b981' }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl="3" md="6">
              <Card className="interactive-card border-0 h-100 shadow-sm">
                <Card.Body className="p-4 stat-card-inner">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="stat-label mb-2">Active Tables</div>
                      <div className="stat-value text-info">{reportData.tablePerformance?.length || 0}</div>
                      <div className="smaller text-muted fw-bold mt-1">Tables served</div>
                    </div>
                    <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                      <CsLineIcons icon="layout-5" size="24" style={{ color: '#06b6d4' }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Waiter Performance */}
          <Card className="interactive-card border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Waiter Performance Ranking</h2>
                <CsLineIcons icon="star" size="18" style={{ color: brandColor }} />
              </div>
              <div className="table-responsive">
                <Table borderless hover className="align-middle mb-0">
                  <thead className="stat-label">
                    <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                      <th className="py-3">Rank</th>
                      <th className="py-3">Waiter Name</th>
                      <th className="py-3 text-end">Orders</th>
                      <th className="py-3 text-end">Revenue</th>
                      <th className="py-3 text-end d-none d-md-table-cell">Avg Ticket</th>
                      <th className="py-3 text-end d-none d-lg-table-cell">Tables</th>
                      <th className="py-3 text-center d-none d-sm-table-cell">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.waiterPerformance.map((waiter, idx) => {
                      const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;
                      const performance = waiter.totalRevenue >= avgRevenue * 1.2 ? 'excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? 'good' : 'needs-improvement';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                          <td className="py-3"><Badge bg={idx < 3 ? 'primary' : 'light'} className={`rounded-pill px-3 py-2 ${idx < 3 ? '' : 'text-dark'}`}>{idx + 1}</Badge></td>
                          <td className="py-3 fw-bold text-dark">{waiter.waiter}</td>
                          <td className="py-3 text-end fw-bold text-muted smaller">{waiter.totalOrders}</td>
                          <td className="py-3 text-end fw-bold text-primary">{formatCurrency(waiter.totalRevenue)}</td>
                          <td className="py-3 text-end fw-bold text-dark smaller d-none d-md-table-cell">{formatCurrency(waiter.avgOrderValue)}</td>
                          <td className="py-3 text-end fw-bold text-muted smaller d-none d-lg-table-cell">{waiter.tablesServed}</td>
                          <td className="py-3 text-center d-none d-sm-table-cell">
                            <Badge bg={performance === 'excellent' ? 'success' : performance === 'good' ? 'info' : 'warning'} className="rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.65rem' }}>
                              {performance === 'excellent' ? '⭐ TOP PERFORMER' : performance === 'good' ? '👍 STABLE' : '📈 IMPROVING'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Table Performance */}
          <Card className="interactive-card border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Table Performance Matrix</h2>
                <CsLineIcons icon="grid-5" size="18" style={{ color: brandColor }} />
              </div>
              <div className="table-responsive">
                <Table borderless hover className="align-middle mb-0">
                  <thead className="stat-label">
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
                    {reportData.tablePerformance.map((table, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                        <td className="py-3 fw-bold text-dark">{table.tableNo}</td>
                        <td className="py-3 d-none d-sm-table-cell"><Badge bg="light" className="text-dark rounded-pill px-3 py-2 smaller">{table.tableArea || 'GENERAL'}</Badge></td>
                        <td className="py-3 text-end fw-bold text-muted smaller">{table.orderCount}</td>
                        <td className="py-3 text-end fw-bold text-success">{formatCurrency(table.totalRevenue)}</td>
                        <td className="py-3 text-end fw-bold text-dark smaller d-none d-md-table-cell">{formatCurrency(table.avgOrderValue)}</td>
                        <td className="py-3 text-end fw-bold text-muted smaller d-none d-lg-table-cell">{table.totalPersons}</td>
                        <td className="py-3 text-end fw-bold text-info smaller d-none d-xl-table-cell">{formatCurrency(table.revenuePerPerson)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Peak Hours & Day Trends */}
          <Row className="g-4 mb-4">
            <Col lg="6">
              <Card className="interactive-card border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Hourly Activity Analysis</h2>
                    <CsLineIcons icon="activity" size="18" style={{ color: brandColor }} />
                  </div>
                  <div className="d-flex flex-column gap-3 mt-3">
                    {reportData.peakHours.map((hour, idx) => {
                      const maxOrders = Math.max(...reportData.peakHours.map(h => h.orderCount));
                      const activityPercent = (hour.orderCount / maxOrders) * 100;
                      const level = activityPercent >= 80 ? 'danger' : activityPercent >= 50 ? 'warning' : 'info';
                      return (
                        <div key={idx}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="smaller fw-bold text-dark">{hour.hour}:00 - {hour.hour + 1}:00</span>
                            <span className={`smaller fw-bold text-${level}`}>{hour.orderCount} Orders</span>
                          </div>
                          <ProgressBar now={activityPercent} variant={level} className="progress-sm" style={{ height: '4px' }} />
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg="6">
              <Card className="interactive-card border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Weekly Performance Trends</h2>
                    <CsLineIcons icon="trend-up" size="18" style={{ color: brandColor }} />
                  </div>
                  <div className="d-flex flex-column gap-4 mt-3">
                    {reportData.dayOfWeekAnalysis.map((day, idx) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                            <span className="fw-bold smaller text-muted">{day.dayName.substring(0, 1)}</span>
                          </div>
                          <div>
                            <div className="fw-bold text-dark mb-0">{day.dayName}</div>
                            <div className="smaller text-muted fw-bold">{day.orderCount} Orders</div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-primary smaller">{formatCurrency(day.totalRevenue)}</div>
                          <Badge bg={day.totalRevenue >= 10000 ? 'success' : 'light'} className="rounded-pill px-2 py-1 text-dark" style={{ fontSize: '0.6rem' }}>NORMAL</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Area Performance */}
          {reportData.areaPerformance && reportData.areaPerformance.length > 0 && (
            <Card className="interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Table Area Analytics</h2>
                  <CsLineIcons icon="pin" size="18" style={{ color: brandColor }} />
                </div>
                <Row className="g-4">
                  {reportData.areaPerformance.map((area, idx) => (
                    <Col lg="4" key={idx}>
                      <Card className="interactive-card border-0 p-3 h-100" style={{ background: 'rgba(0,0,0,0.01) !important', border: '1px solid rgba(0,0,0,0.05) !important' }}>
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

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered contentClassName="interactive-card border-0 shadow-lg">
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>Operational Intelligence Export</Modal.Title>
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
              { label: 'Executive Insights', key: 'includeInsights' }
            ].map(option => (
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
          <Button variant="light" className="custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button className="custom-btn-outline px-4" onClick={handleExportConfirm}>Generate Intelligence Report</Button>
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

export default OperationalReport;

import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar, Modal, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';



const FinancialReport = () => {
  const brandColor = '#23b3f4';
  const brandBg = 'rgba(35, 179, 244, 0.08)';
  const title = 'Financial Report';
  const description = 'Comprehensive Financial Analysis and Summary';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/financial', text: 'Financial Report' },
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
    includeDailyBreakdown: true,
    includeTaxBreakdown: true,
    includePaymentMethods: true,
    includeFinancialInsights: true,
    includeCharts: true,
  });

  const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
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

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchFinancialReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { period: 'custom', start_date: startDate, end_date: endDate };
      const response = await axios.get(`${API_BASE}/statistics/financial`, { ...getHeaders(), params });
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching financial report:', err);
      setError(err.response?.data?.error || 'Failed to load financial report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialReport();
  }, []);

  const sortedDailyFinancials = reportData
    ? [...reportData.dailyFinancials].sort((a, b) => {
      const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
      const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
      return dateB - dateA;
    })
    : [];

  const exportToExcel = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();
      const allData = [];

      allData.push(['FINANCIAL AUDIT REPORT']);
      allData.push(['Company:', COMPANY_NAME]);
      allData.push(['Period:', `${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`]);
      allData.push(['Generated:', format(new Date(), 'dd MMM yyyy HH:mm')]);
      allData.push([]);

      if (exportOptions.includeSummary) {
        setExportProgress(20);
        allData.push(['EXECUTIVE FISCAL SUMMARY']);
        allData.push(['Metric', 'Value', 'Note']);
        allData.push(['Gross Revenue', reportData.summary.grossRevenue, 'Total realization']);
        allData.push(['Net Revenue', reportData.summary.netRevenue, 'Post-deduction yield']);
        allData.push(['Total Deductions', reportData.summary.totalDiscount + reportData.summary.totalWaveOff, `${reportData.summary.discountPercentage}% ratio`]);
        allData.push(['Fiscal Tax', reportData.summary.totalTax, `${reportData.summary.taxPercentage}% effective`]);
        allData.push(['Gross Profit Estimate', reportData.summary.grossProfit, `Margin: ${reportData.summary.grossProfitMargin}%`]);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeDailyBreakdown && sortedDailyFinancials?.length > 0) {
        setExportProgress(40);
        allData.push(['DAILY OPERATIONAL LEDGER']);
        allData.push(['Date', 'Gross Rev', 'Deductions', 'Net Yield', 'Fiscal Tax', 'Orders']);
        sortedDailyFinancials.forEach(day => {
          allData.push([`${day.date.day}-${day.date.month}-${day.date.year}`, day.grossRevenue, day.discount + day.waveOff, day.netRevenue, day.tax, day.orders]);
        });
        allData.push(['Audit Period Total', reportData.summary.grossRevenue, reportData.summary.totalDiscount + reportData.summary.totalWaveOff, reportData.summary.netRevenue, reportData.summary.totalTax, reportData.summary.totalOrders]);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeTaxBreakdown) {
        setExportProgress(60);
        allData.push(['TAX COMPLIANCE BREAKDOWN']);
        allData.push(['Tax Type', 'Amount']);
        allData.push(['CGST / SGST', reportData.summary.cgstAmount + reportData.summary.sgstAmount]);
        allData.push(['VAT', reportData.summary.vatAmount]);
        allData.push(['Total Tax', reportData.summary.totalTax]);
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includePaymentMethods && reportData.paymentMethodFinancials?.length > 0) {
        setExportProgress(75);
        allData.push(['PAYMENT CHANNEL ANALYSIS']);
        allData.push(['Payment Method', 'Orders', 'Net Yield', 'Collected Amount']);
        reportData.paymentMethodFinancials.forEach(payment => {
          allData.push([payment.paymentMethod, payment.orderCount, payment.totalAmount, payment.paidAmount]);
        });
        allData.push([]);
        allData.push([]);
      }

      if (exportOptions.includeFinancialInsights) {
        setExportProgress(85);
        allData.push(['FISCAL INTELLIGENCE ALERTS']);
        allData.push(['Alert', 'Detail']);
        allData.push(['Discount Policy', `Rate: ${reportData.summary.discountPercentage}%. ${reportData.summary.discountPercentage > 15 ? 'Alert: Exposure detected.' : 'Healthy parameters.'}`]);
        allData.push(['Tax Remittance', `Total: ${reportData.summary.totalTax}. Modules ready for compliance filing.`]);
        allData.push(['Revenue Yield', `Net Yield: ${reportData.summary.netRevenue}. Avg Order: ${(reportData.summary.netRevenue / reportData.summary.totalOrders).toFixed(2)}.`]);
        allData.push(['Collection Rate', `${((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%`]);
        allData.push([]);
        allData.push([]);
      }

      const ws = XLSX.utils.aoa_to_sheet(allData);
      ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');

      XLSX.writeFile(wb, `Financial_Report_${startDate}_to_${endDate}.xlsx`);
      showSuccessToast('Excel report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting Excel report');
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
      doc.text('Financial Audit Report', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(COMPANY_NAME, 105, 22, { align: 'center' });
      doc.text(`Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}`, 105, 28, { align: 'center' });

      let currentY = 35;

      if (exportOptions.includeSummary) {
        setExportProgress(20);
        doc.setFontSize(12);
        doc.text('Executive Fiscal Summary', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Metric', 'Value', 'Note']],
          body: [
            ['Gross Revenue', formatCurrencyPDF(reportData.summary.grossRevenue), 'Total realization'],
            ['Net Revenue', formatCurrencyPDF(reportData.summary.netRevenue), 'Post-deduction yield'],
            ['Total Deductions', formatCurrencyPDF(reportData.summary.totalDiscount + reportData.summary.totalWaveOff), `${reportData.summary.discountPercentage}% ratio`],
            ['Fiscal Tax', formatCurrencyPDF(reportData.summary.totalTax), `${reportData.summary.taxPercentage}% effective`],
            ['Gross Profit Estimate', formatCurrencyPDF(reportData.summary.grossProfit), `Margin: ${reportData.summary.grossProfitMargin}%`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeTaxBreakdown) {
        setExportProgress(35);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Tax Compliance Breakdown', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Tax Type', 'Amount']],
          body: [
            ['CGST / SGST', formatCurrencyPDF(reportData.summary.cgstAmount + reportData.summary.sgstAmount)],
            ['VAT', formatCurrencyPDF(reportData.summary.vatAmount)],
            ['Total Tax', formatCurrencyPDF(reportData.summary.totalTax)]
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includePaymentMethods && reportData.paymentMethodFinancials?.length > 0) {
        setExportProgress(50);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Payment Channel Analysis', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Payment Method', 'Orders', 'Net Yield', 'Collected Amount']],
          body: reportData.paymentMethodFinancials.map(payment => [
            payment.paymentMethod,
            payment.orderCount.toString(),
            formatCurrencyPDF(payment.totalAmount),
            formatCurrencyPDF(payment.paidAmount)
          ]),
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeDailyBreakdown && sortedDailyFinancials?.length > 0) {
        setExportProgress(70);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Daily Operational Ledger', 14, currentY);
        
        const dailyBody = sortedDailyFinancials.map(day => [
          `${day.date.day}-${day.date.month}-${day.date.year}`,
          formatCurrencyPDF(day.grossRevenue),
          formatCurrencyPDF(day.discount + day.waveOff),
          formatCurrencyPDF(day.netRevenue),
          formatCurrencyPDF(day.tax),
          day.orders.toString()
        ]);

        dailyBody.push([
          'Audit Period Total',
          formatCurrencyPDF(reportData.summary.grossRevenue),
          formatCurrencyPDF(reportData.summary.totalDiscount + reportData.summary.totalWaveOff),
          formatCurrencyPDF(reportData.summary.netRevenue),
          formatCurrencyPDF(reportData.summary.totalTax),
          reportData.summary.totalOrders.toString()
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Date', 'Gross Rev', 'Deductions', 'Net Yield', 'Fiscal Tax', 'Orders']],
          body: dailyBody,
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 },
          didParseCell(data) {
            if (data.row.index === dailyBody.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      if (exportOptions.includeFinancialInsights) {
        setExportProgress(90);
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('Fiscal Intelligence Alerts', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Alert', 'Detail']],
          body: [
            ['Discount Policy', `Rate: ${reportData.summary.discountPercentage}%. ${reportData.summary.discountPercentage > 15 ? 'Alert: Exposure detected.' : 'Healthy parameters.'}`],
            ['Tax Remittance', `Total: ${formatCurrencyPDF(reportData.summary.totalTax)}. Modules ready for compliance filing.`],
            ['Revenue Yield', `Net Yield: ${formatCurrencyPDF(reportData.summary.netRevenue)}. Avg Order: ${formatCurrencyPDF(reportData.summary.netRevenue / reportData.summary.totalOrders)}.`],
            ['Collection Rate', `${((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [35, 179, 244] },
          margin: { bottom: 15 }
        });
      }

      doc.save(`Financial_Report_${startDate}_to_${endDate}.pdf`);
      showSuccessToast('PDF report exported successfully!');
    } catch (err) {
      console.error(err);
      showSuccessToast('Error exporting PDF report');
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
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0 no-print">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        {/* Audit Filters */}
        <Card className="financial-report-interactive-card financial-report-filter-card border-0 mb-4 no-print shadow-sm">
          <Card.Body className="p-4">
            <div className="financial-report-card-title-container">
              <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Fiscal Audit Parameters</h2>
              <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
            </div>
            <Row className="g-3 align-items-end mt-1">
              <Col xs={12} md={5}>
                <Form.Label className="financial-report-stat-label mb-2">Audit Start Date</Form.Label>
                <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Col>
              <Col xs={12} md={5}>
                <Form.Label className="financial-report-stat-label mb-2">Audit End Date</Form.Label>
                <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Col>
              <Col xs={12} md={2}>
                <Button className="financial-report-custom-btn-outline w-100" onClick={fetchFinancialReport} disabled={loading}>
                  <CsLineIcons icon="sync" className={`me-2 ${loading ? 'spin' : ''}`} size="15" />
                  {loading ? 'Processing...' : 'Generate'}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Action Bar */}
        <Card className="financial-report-interactive-card border-0 mb-4 no-print shadow-sm">
          <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex gap-3 align-items-center">
              <Button variant="outline-success" className="financial-report-custom-btn-outline border-success text-success px-4" onClick={() => handleExportClick('Excel')} disabled={exporting}>
                <CsLineIcons icon="file-text" className="me-2" size="15" /> Excel
              </Button>
              <Button variant="outline-danger" className="financial-report-custom-btn-outline border-danger text-danger px-4" onClick={() => handleExportClick('PDF')} disabled={exporting}>
                <CsLineIcons icon="file-text" className="me-2" size="15" /> PDF
              </Button>
            </div>
            {exporting && (
              <div className="flex-grow-1 ms-md-4 mt-3 mt-md-0">
                <div className="d-flex align-items-center mb-2">
                  <Spinner animation="border" size="sm" className="me-2" style={{ color: brandColor }} />
                  <span className="smaller fw-bold text-muted">Generating {exportType}... {exportProgress}%</span>
                </div>
                <ProgressBar now={exportProgress} className="progress-sm" variant="info" style={{ height: '6px' }} />
              </div>
            )}
          </Card.Body>
        </Card>

        {error && <Alert variant="danger" className="mb-4 financial-report-interactive-card border-0">{error}</Alert>}

        {reportData && (
          <>
            {/* Key Financial Metrics */}
            <Row className="g-3 mb-4">
              {[
                { label: 'Gross Revenue', value: reportData.summary.grossRevenue, note: 'Total realization', icon: 'wallet', color: brandColor, bg: brandBg, border: brandColor },
                { label: 'Net Revenue', value: reportData.summary.netRevenue, note: 'Post-deduction yield', icon: 'money', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
                { label: 'Total Deductions', value: reportData.summary.totalDiscount + reportData.summary.totalWaveOff, note: `${reportData.summary.discountPercentage}% ratio`, icon: 'tag', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', border: '#f43f5e' },
                { label: 'Fiscal Tax', value: reportData.summary.totalTax, note: `${reportData.summary.taxPercentage}% effective`, icon: 'dollar', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' }
              ].map((stat, idx) => (
                <Col xl="3" md="6" key={idx}>
                  <Card className="financial-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${stat.border}` }}>
                    <Card.Body className="p-4 financial-report-stat-card-inner">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="financial-report-stat-label mb-2">{stat.label}</div>
                          <div className="financial-report-stat-value" style={{ color: stat.color }}>{formatCurrency(stat.value)}</div>
                          <div className="smaller text-muted fw-bold mt-1">{stat.note}</div>
                        </div>
                        <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: stat.bg }}>
                          <CsLineIcons icon={stat.icon} size="24" style={{ color: stat.color }} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Revenue Flow & Health Indicators */}
            <Row className="g-3 mb-4">
              <Col lg={7}>
                <Card className="financial-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="financial-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Revenue Architecture Analysis</h2>
                      <CsLineIcons icon="activity" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="mb-4 mt-3">
                      <div className="d-flex justify-content-between mb-2 smaller fw-bold">
                        <span className="text-muted">Gross Realized</span>
                        <span className="text-primary">{formatCurrency(reportData.summary.grossRevenue)}</span>
                      </div>
                      <ProgressBar now={100} variant="primary" className="progress-pill" style={{ height: '8px' }} />
                    </div>
                    <div className="mb-4 ms-4">
                      <div className="d-flex justify-content-between mb-2 smaller text-danger fw-bold">
                        <span>- Deductions (Discount + Waveoff)</span>
                        <span>{formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}</span>
                      </div>
                      <ProgressBar now={((reportData.summary.totalDiscount + reportData.summary.totalWaveOff) / reportData.summary.grossRevenue) * 100} variant="danger" className="progress-pill" style={{ height: '6px' }} />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-2 fw-bold">
                        <span className="text-muted">Net Yield (Post-Deduction)</span>
                        <span className="text-success">{formatCurrency(reportData.summary.netRevenue)}</span>
                      </div>
                      <ProgressBar now={(reportData.summary.netRevenue / reportData.summary.grossRevenue) * 100} variant="success" className="progress-pill" style={{ height: '8px' }} />
                    </div>
                    <div className="p-4 rounded-3 mt-4" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="financial-report-stat-label mb-1 text-success">Estimated Operational Profit</div>
                          <div className="financial-report-stat-value text-success h3 mb-0" style={{ fontSize: '1.6rem' }}>{formatCurrency(reportData.summary.grossProfit)}</div>
                        </div>
                        <Badge bg="success" className="rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.65rem' }}>MARGIN: {reportData.summary.grossProfitMargin}%</Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={5}>
                <Card className="financial-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="financial-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Fiscal Health Indicators</h2>
                      <CsLineIcons icon="heart" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="mb-4 mt-3">
                      <div className="d-flex justify-content-between mb-2 align-items-center">
                        <span className="financial-report-stat-label">Collection Rate</span>
                        <Badge bg="success" className="rounded-pill px-3 py-2">{((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%</Badge>
                      </div>
                      <ProgressBar now={(reportData.summary.totalPaid / reportData.summary.netRevenue) * 100} variant="success" className="progress-pill" style={{ height: '8px' }} />
                      <small className="text-muted smaller d-block mt-2 fw-bold">Actual payments collected vs net yield</small>
                    </div>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-2 align-items-center">
                        <span className="financial-report-stat-label">Discount Exposure</span>
                        <Badge bg={reportData.summary.discountPercentage > 15 ? 'danger' : 'success'} className="rounded-pill px-3 py-2">{reportData.summary.discountPercentage}%</Badge>
                      </div>
                      <ProgressBar now={reportData.summary.discountPercentage} max={20} variant={reportData.summary.discountPercentage > 15 ? 'danger' : 'success'} className="progress-pill" style={{ height: '8px' }} />
                      <small className="text-muted smaller d-block mt-2 fw-bold">Ideal: Under 10% of gross</small>
                    </div>
                    <div className="p-4 rounded-3" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div className="financial-report-stat-label mb-3">Tax Compliance Breakdown</div>
                      <div className="d-flex justify-content-between mb-2 smaller fw-bold">
                          <span className="text-muted">CGST / SGST</span>
                          <span className="text-dark">{formatCurrency(reportData.summary.cgstAmount + reportData.summary.sgstAmount)}</span>
                      </div>
                      <div className="d-flex justify-content-between smaller fw-bold">
                          <span className="text-muted">VAT</span>
                          <span className="text-dark">{formatCurrency(reportData.summary.vatAmount)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Payment Method Breakdown */}
            <Card className="financial-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="financial-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Payment Channel Distribution</h2>
                  <CsLineIcons icon="pie-chart" size="18" style={{ color: brandColor }} />
                </div>
                <Row className="g-3 mt-1">
                  {reportData.paymentMethodFinancials.map((payment, idx) => (
                    <Col lg="4" key={idx}>
                      <Card className="financial-report-interactive-card border-0 p-3 h-100" style={{ background: 'rgba(0,0,0,0.01) !important', border: '1px solid rgba(0,0,0,0.05) !important' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="fw-bold text-dark mb-0 text-truncate">{payment.paymentMethod}</div>
                          <Badge bg="primary" className="rounded-pill px-2 flex-shrink-0 ms-2" style={{fontSize: '0.65rem', backgroundColor: brandColor}}>{payment.orderCount} orders</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-1 smaller">
                          <span className="text-muted fw-bold">Net Yield:</span>
                          <span className="text-primary fw-bold">{formatCurrency(payment.totalAmount)}</span>
                        </div>
                        <ProgressBar now={(payment.totalAmount / reportData.summary.netRevenue) * 100} variant="info" className="progress-sm mb-2" style={{height: '3px'}} />
                        <div className="d-flex justify-content-between smaller">
                          <span className="text-muted">Collected:</span>
                          <span className="fw-bold text-success">{formatCurrency(payment.paidAmount)}</span>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            {/* Daily Financial Audit Table */}
            <Card className="financial-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="financial-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Daily Operational Fiscal Audit</h2>
                  <CsLineIcons icon="list" size="18" style={{ color: brandColor }} />
                </div>
                <div className="d-none d-md-block table-responsive mt-3">
                  <Table borderless hover className="align-middle mb-0">
                    <thead className="financial-report-stat-label">
                      <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                        <th className="py-3">Audit Date</th>
                        <th className="py-3 text-end">Gross Rev</th>
                        <th className="py-3 text-end">Deductions</th>
                        <th className="py-3 text-end">Net Yield</th>
                        <th className="py-3 text-end">Fiscal Tax</th>
                        <th className="py-3 text-center">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDailyFinancials.map((day, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                          <td className="py-3 fw-bold text-dark">{`${day.date.day}-${day.date.month}-${day.date.year}`}</td>
                          <td className="py-3 text-end fw-bold text-muted smaller">{formatCurrency(day.grossRevenue)}</td>
                          <td className="py-3 text-end fw-bold text-danger smaller">{formatCurrency(day.discount + day.waveOff)}</td>
                          <td className="py-3 text-end fw-bold text-primary">{formatCurrency(day.netRevenue)}</td>
                          <td className="py-3 text-end fw-bold text-warning smaller">{formatCurrency(day.tax)}</td>
                          <td className="py-3 text-center">
                            <Badge bg="light" className="text-dark rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.65rem' }}>
                              {day.orders} ORDERS
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="fw-bold" style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <tr>
                        <td className="py-4 financial-report-stat-label">Audit Period Total</td>
                        <td className="py-4 text-end text-primary">{formatCurrency(reportData.summary.grossRevenue)}</td>
                        <td className="py-4 text-end text-danger">{formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}</td>
                        <td className="py-4 text-end text-success">{formatCurrency(reportData.summary.netRevenue)}</td>
                        <td className="py-4 text-end text-warning">{formatCurrency(reportData.summary.totalTax)}</td>
                        <td className="py-4 text-center"><Badge bg="primary" className="rounded-pill px-3 py-2" style={{ backgroundColor: brandColor }}>{reportData.summary.totalOrders} TOTAL</Badge></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
                
                <div className="d-md-none d-flex flex-column gap-3 mt-3">
                  {sortedDailyFinancials.map((day, idx) => (
                    <div key={idx} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold text-dark fs-6">{`${day.date.day}-${day.date.month}-${day.date.year}`}</span>
                        <Badge bg="light" className="text-dark rounded-pill px-2 py-1 fw-bold" style={{ fontSize: '0.65rem' }}>
                          {day.orders} ORDERS
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                        <span className="text-muted fw-bold">Gross Rev:</span>
                        <span className="fw-bold text-muted">{formatCurrency(day.grossRevenue)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                        <span className="text-muted fw-bold">Deductions:</span>
                        <span className="fw-bold text-danger">{formatCurrency(day.discount + day.waveOff)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                        <span className="text-muted fw-bold">Fiscal Tax:</span>
                        <span className="fw-bold text-warning">{formatCurrency(day.tax)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center smaller">
                        <span className="text-muted fw-bold">Net Yield:</span>
                        <span className="fw-bold text-primary">{formatCurrency(day.netRevenue)}</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3 rounded mt-2 border border-primary" style={{ backgroundColor: 'rgba(35, 179, 244, 0.05)' }}>
                    <div className="financial-report-stat-label mb-3 text-primary text-center">Audit Period Total</div>
                    <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                        <span className="text-muted fw-bold">Gross Rev:</span>
                        <span className="fw-bold text-primary">{formatCurrency(reportData.summary.grossRevenue)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                        <span className="text-muted fw-bold">Deductions:</span>
                        <span className="fw-bold text-danger">{formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                        <span className="text-muted fw-bold">Fiscal Tax:</span>
                        <span className="fw-bold text-warning">{formatCurrency(reportData.summary.totalTax)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 smaller">
                        <span className="text-muted fw-bold">Net Yield:</span>
                        <span className="fw-bold text-success">{formatCurrency(reportData.summary.netRevenue)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center smaller">
                        <span className="text-muted fw-bold">Total Volume:</span>
                        <span className="fw-bold text-dark">{reportData.summary.totalOrders} ORDERS</span>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Fiscal Intelligence Alerts */}
            <Card className="financial-report-interactive-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="financial-report-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Executive Fiscal Intelligence</h2>
                  <CsLineIcons icon="star" size="18" style={{ color: brandColor }} />
                </div>
                <Row className="g-3 mt-1">
                  {[
                    { title: 'Discount Policy', text: `Rate: ${reportData.summary.discountPercentage}%. ${reportData.summary.discountPercentage > 15 ? 'Alert: Exposure detected.' : 'Healthy parameters.'}`, variant: reportData.summary.discountPercentage > 15 ? 'danger' : 'success', icon: 'tag' },
                    { title: 'Tax Remittance', text: `Total: ${formatCurrency(reportData.summary.totalTax)}. Modules ready for compliance filing.`, variant: 'info', icon: 'dollar' },
                    { title: 'Revenue Yield', text: `Net Yield: ${formatCurrency(reportData.summary.netRevenue)}. Avg Order: ${formatCurrency(reportData.summary.netRevenue / reportData.summary.totalOrders)}.`, variant: 'primary', icon: 'trend-up' }
                  ].map((insight, i) => (
                    <Col md={4} key={i}>
                      <Alert variant={insight.variant} className="financial-report-interactive-card border-0 h-100 p-4 mb-0 shadow-none" style={{ background: `rgba(var(--bs-${insight.variant}-rgb), 0.05)` }}>
                        <div className="d-flex align-items-center mb-3">
                          <CsLineIcons icon={insight.icon} size="20" className={`text-${insight.variant} me-3`} />
                          <div className="fw-bold text-dark text-uppercase smaller">{insight.title}</div>
                        </div>
                        <div className="smaller text-muted fw-bold">{insight.text}</div>
                      </Alert>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </>
        )}
      </div>

      {/* Export Options Modal (Styled like Menu Report) */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered contentClassName="interactive-card border-0 shadow-lg">
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>Fiscal Intelligence Export</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted smaller fw-bold mb-4">Customize your fiscal audit report for compliance and accounting.</p>
          <Form className="d-flex flex-column gap-3">
             {[
              { label: 'Executive Fiscal Summary', key: 'includeSummary' },
              { label: 'Daily Operational Ledger', key: 'includeDailyBreakdown' },
              { label: 'Tax Compliance Breakdown', key: 'includeTaxBreakdown' },
              { label: 'Payment Channel Analysis', key: 'includePaymentMethods' },
              { label: 'Fiscal Intelligence Alerts', key: 'includeFinancialInsights' }
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
          <Button variant="light" className="financial-report-custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button className="financial-report-custom-btn-outline px-4" onClick={handleExportConfirm}>Generate Fiscal Audit</Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="white" className="financial-report-interactive-card border-0">
          <Toast.Body className="p-3 d-flex align-items-center">
            <CsLineIcons icon="check-circle" className="text-success me-2" size="20" />
            <span className="fw-bold smaller text-dark">{toastMessage}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default FinancialReport;

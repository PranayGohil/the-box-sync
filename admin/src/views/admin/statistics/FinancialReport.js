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
    .data-table thead th {
      background: #f8fafc !important;
      color: #475569 !important;
      font-size: 0.7rem !important;
      font-weight: 800 !important;
      text-transform: uppercase;
      border: none !important;
      padding: 1rem !important;
    }
`;

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

  const exportToExcel = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();
      if (exportOptions.includeSummary) {
        const dashboardData = [['FINANCIAL REPORT DASHBOARD'], [], ['Company:', COMPANY_NAME], ['Period:', `${startDate} to ${endDate}`], [], ['Metric', 'Value'], ['Gross', reportData.summary.grossRevenue], ['Net', reportData.summary.netRevenue]];
        const ws = XLSX.utils.aoa_to_sheet(dashboardData);
        XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
      }
      XLSX.writeFile(wb, `Financial_Report_${startDate}_to_${endDate}.xlsx`);
      showSuccessToast('Excel report exported successfully!');
    } catch (err) { console.error(err); } finally { setExporting(false); setExportProgress(0); }
  };

  const exportToPDF = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('PDF');
    try {
      const doc = new jsPDF();
      doc.text('FINANCIAL AUDIT', 105, 20, { align: 'center' });
      doc.save(`Financial_Report_${startDate}_to_${endDate}.pdf`);
      showSuccessToast('PDF report exported successfully!');
    } catch (err) { console.error(err); } finally { setExporting(false); setExportProgress(0); }
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

  const sortedDailyFinancials = reportData
    ? [...reportData.dailyFinancials].sort((a, b) => {
      const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
      const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
      return dateB - dateA;
    })
    : [];

  if (loading && !reportData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

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

      {/* Audit Filters (Styled like Menu Report) */}
      <Card className="interactive-card border-0 mb-4 no-print shadow-sm">
        <Card.Body className="p-4">
          <div className="card-title-container">
            <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Fiscal Audit Parameters</h2>
            <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
          </div>
          <Row className="g-3 align-items-end">
            <Col md={5}>
              <Form.Label className="stat-label mb-2">Audit Start Date</Form.Label>
              <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Col>
            <Col md={5}>
              <Form.Label className="stat-label mb-2">Audit End Date</Form.Label>
              <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Col>
            <Col md={2}>
              <Button className="custom-btn-outline w-100" onClick={fetchFinancialReport} disabled={loading}>
                <CsLineIcons icon="sync" className={`me-2 ${loading ? 'spin' : ''}`} size="15" />
                {loading ? '...' : 'Generate'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Action Bar (Excel/PDF) */}
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
                <span className="smaller fw-bold text-muted">Generating {exportType}... {exportProgress}%</span>
              </div>
              <ProgressBar now={exportProgress} className="progress-sm" variant="info" style={{ height: '6px' }} />
            </div>
          )}
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4 interactive-card border-0">{error}</Alert>}

      {reportData && (
        <>
          {/* Key Financial Metrics (Styled like Menu Report) */}
          <Row className="g-4 mb-4">
            {[
              { label: 'Gross Revenue', value: reportData.summary.grossRevenue, note: 'Total realization', icon: 'wallet', color: brandColor, bg: brandBg },
              { label: 'Net Revenue', value: reportData.summary.netRevenue, note: 'Post-deduction yield', icon: 'money', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
              { label: 'Total Deductions', value: reportData.summary.totalDiscount + reportData.summary.totalWaveOff, note: `${reportData.summary.discountPercentage}% ratio`, icon: 'tag', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
              { label: 'Fiscal Tax', value: reportData.summary.totalTax, note: `${reportData.summary.taxPercentage}% effective`, icon: 'dollar', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
            ].map((stat, idx) => (
              <Col xl="3" md="6" key={idx}>
                <Card className="interactive-card border-0 h-100 shadow-sm">
                  <Card.Body className="p-4 stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="stat-label mb-2">{stat.label}</div>
                        <div className="stat-value" style={{ color: stat.color }}>{formatCurrency(stat.value)}</div>
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

          {/* Revenue Flow & Health Indicators (Styled like Menu Report) */}
          <Row className="g-4 mb-4">
            <Col lg={7}>
              <Card className="interactive-card border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Revenue Architecture Analysis</h2>
                    <CsLineIcons icon="activity" size="18" style={{ color: brandColor }} />
                  </div>
                  <div className="mb-4">
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
                        <div className="stat-label mb-1 text-success">Estimated Operational Profit</div>
                        <div className="stat-value text-success h3 mb-0">{formatCurrency(reportData.summary.grossProfit)}</div>
                      </div>
                      <Badge bg="success" className="rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.65rem' }}>MARGIN: {reportData.summary.grossProfitMargin}%</Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={5}>
              <Card className="interactive-card border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Fiscal Health Indicators</h2>
                    <CsLineIcons icon="heart" size="18" style={{ color: brandColor }} />
                  </div>
                  <div className="mb-5">
                    <div className="d-flex justify-content-between mb-2 align-items-center">
                      <span className="stat-label">Collection Rate</span>
                      <Badge bg="success" className="rounded-pill px-3 py-2">{((reportData.summary.totalPaid / reportData.summary.netRevenue) * 100).toFixed(1)}%</Badge>
                    </div>
                    <ProgressBar now={(reportData.summary.totalPaid / reportData.summary.netRevenue) * 100} variant="success" className="progress-pill" style={{ height: '8px' }} />
                    <small className="text-muted smaller d-block mt-2 fw-bold">Actual payments collected vs net yield</small>
                  </div>
                  <div className="mb-5">
                    <div className="d-flex justify-content-between mb-2 align-items-center">
                      <span className="stat-label">Discount Exposure</span>
                      <Badge bg={reportData.summary.discountPercentage > 15 ? 'danger' : 'success'} className="rounded-pill px-3 py-2">{reportData.summary.discountPercentage}%</Badge>
                    </div>
                    <ProgressBar now={reportData.summary.discountPercentage} max={20} variant={reportData.summary.discountPercentage > 15 ? 'danger' : 'success'} className="progress-pill" style={{ height: '8px' }} />
                    <small className="text-muted smaller d-block mt-2 fw-bold">Ideal: Under 10% of gross</small>
                  </div>
                  <div className="p-4 rounded-3" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="stat-label mb-3">Tax Compliance Breakdown</div>
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

          {/* Payment Method Breakdown (Styled like Menu Report) */}
          <Card className="interactive-card border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Payment Channel Distribution</h2>
                <CsLineIcons icon="pie-chart" size="18" style={{ color: brandColor }} />
              </div>
              <Row className="g-4">
                {reportData.paymentMethodFinancials.map((payment, idx) => (
                  <Col lg="4" key={idx}>
                    <Card className="interactive-card border-0 p-3 h-100" style={{ background: 'rgba(0,0,0,0.01) !important', border: '1px solid rgba(0,0,0,0.05) !important' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="fw-bold text-dark mb-0">{payment.paymentMethod}</div>
                        <Badge bg="primary" className="rounded-pill px-2" style={{fontSize: '0.65rem'}}>{payment.orderCount} orders</Badge>
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

          {/* Daily Financial Audit Table (Styled like Menu Report) */}
          <Card className="interactive-card border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Daily Operational Fiscal Audit</h2>
                <CsLineIcons icon="list" size="18" style={{ color: brandColor }} />
              </div>
              <div className="d-none d-md-block table-responsive">
                <Table borderless hover className="align-middle mb-0">
                  <thead className="stat-label">
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
                      <td className="py-4 stat-label">Audit Period Total</td>
                      <td className="py-4 text-end text-primary">{formatCurrency(reportData.summary.grossRevenue)}</td>
                      <td className="py-4 text-end text-danger">{formatCurrency(reportData.summary.totalDiscount + reportData.summary.totalWaveOff)}</td>
                      <td className="py-4 text-end text-success">{formatCurrency(reportData.summary.netRevenue)}</td>
                      <td className="py-4 text-end text-warning">{formatCurrency(reportData.summary.totalTax)}</td>
                      <td className="py-4 text-center"><Badge bg="primary" className="rounded-pill px-3 py-2">{reportData.summary.totalOrders} TOTAL</Badge></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
              
              <div className="d-md-none d-flex flex-column gap-3 mt-2">
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
                  <div className="stat-label mb-3 text-primary text-center">Audit Period Total</div>
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

          {/* Fiscal Intelligence Alerts (Styled like Menu Report) */}
          <Card className="interactive-card border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Executive Fiscal Intelligence</h2>
                <CsLineIcons icon="star" size="18" style={{ color: brandColor }} />
              </div>
              <Row className="g-4">
                {[
                  { title: 'Discount Policy', text: `Rate: ${reportData.summary.discountPercentage}%. ${reportData.summary.discountPercentage > 15 ? 'Alert: Exposure detected.' : 'Healthy parameters.'}`, variant: reportData.summary.discountPercentage > 15 ? 'danger' : 'success', icon: 'tag' },
                  { title: 'Tax Remittance', text: `Total: ${formatCurrency(reportData.summary.totalTax)}. Modules ready for compliance filing.`, variant: 'info', icon: 'dollar' },
                  { title: 'Revenue Yield', text: `Net Yield: ${formatCurrency(reportData.summary.netRevenue)}. Avg Order: ${formatCurrency(reportData.summary.netRevenue / reportData.summary.totalOrders)}.`, variant: 'primary', icon: 'trend-up' }
                ].map((insight, i) => (
                  <Col md={4} key={i}>
                    <Alert variant={insight.variant} className="interactive-card border-0 h-100 p-4 mb-0 shadow-none" style={{ background: `rgba(var(--bs-${insight.variant}-rgb), 0.05)` }}>
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
          <Button variant="light" className="custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button className="custom-btn-outline px-4" onClick={handleExportConfirm}>Generate Fiscal Audit</Button>
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

export default FinancialReport;

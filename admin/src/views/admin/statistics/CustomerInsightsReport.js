import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar, Modal, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';
import { enIN } from 'date-fns/locale';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from 'contexts/AuthContext';



const CustomerInsightsReport = () => {
  const title = 'Customer Insights';
  const description = 'Detailed Customer Analysis and Behavior Patterns';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Overview' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/customers', text: 'Customer Insights' },
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
    includeTopCustomers: true,
    topCustomersLimit: 50,
    includeSegmentation: true,
    includeLoyaltyAnalysis: true,
    includeLifetimeValue: true,
    includeAcquisitionTrend: true,
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

  const fetchCustomerReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { period: 'custom', start_date: startDate, end_date: endDate };
      const response = await axios.get(`${API_BASE}/statistics/customers/insights`, { ...getHeaders(), params });
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerReport();
  }, []);

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const repeatCustomerData = reportData?.repeatCustomerAnalysis || [];
  const oneTimeCustomers = repeatCustomerData.find((item) => item._id === 'one-time')?.count || 0;
  const repeatCustomers = repeatCustomerData.find((item) => item._id === 'repeat')?.count || 0;
  const totalCustomers = oneTimeCustomers + repeatCustomers;
  const repeatRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0;

  const exportToExcel = async () => {
    if (!reportData) return;
    setExporting(true);
    setExportProgress(10);
    setExportType('Excel');
    try {
      const wb = XLSX.utils.book_new();
      const wsData = [['Customer Insights Report'], [], ['Report Period', `${startDate} to ${endDate}`], []];
      wsData.push(['Metric', 'Value']);
      wsData.push(['Total Customers', totalCustomers]);
      wsData.push(['Repeat Customers', repeatCustomers]);
      wsData.push(['Repeat Rate', `${repeatRate}%`]);
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      XLSX.writeFile(wb, `Customer_Report_${startDate}_to_${endDate}.xlsx`);
      showSuccessToast('Excel exported successfully!');
    } catch (err) {
      console.error(err);
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
      doc.text('Customer Insights Report', 105, 20, { align: 'center' });
      autoTable(doc, {
        startY: 30,
        head: [['Metric', 'Value']],
        body: [['Total Customers', totalCustomers.toString()], ['Repeat Rate', `${repeatRate}%`]]
      });
      doc.save(`Customer_Report_${startDate}_to_${endDate}.pdf`);
      showSuccessToast('PDF exported successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportConfirm = () => {
    setShowExportModal(false);
    if (exportType === 'Excel') exportToExcel();
    else exportToPDF();
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

        {/* Filters Card */}
        {activePlans?.includes('Dynamic Reports') && (
          <Card className="customer-insights-report-interactive-card border-0 mb-4 no-print shadow-sm">
            <Card.Body className="p-4">
              <div className="customer-insights-report-card-title-container">
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Analysis Scope</h2>
                <CsLineIcons icon="filter" size="18" style={{ color: brandColor }} />
              </div>
              <Row className="g-3">
                <Col xs={12} md={5}>
                  <Form.Group>
                    <Form.Label className="customer-insights-report-stat-label mb-2">Start Date</Form.Label>
                    <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col xs={12} md={5}>
                  <Form.Group>
                    <Form.Label className="customer-insights-report-stat-label mb-2">End Date</Form.Label>
                    <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col xs={12} md={2} className="d-flex align-items-end">
                  <Button className="customer-insights-report-custom-btn-outline w-100" onClick={fetchCustomerReport} disabled={loading}>
                    <CsLineIcons icon="sync" className={`me-2 ${loading ? 'spin' : ''}`} size="15" />
                    {loading ? 'Analyzing...' : 'Generate'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {error && <Alert variant="danger" className="mb-4 customer-insights-report-interactive-card border-0">{error}</Alert>}

        {reportData && (
          <>
            {/* Action Bar */}
            <Card className="customer-insights-report-interactive-card border-0 mb-4 no-print shadow-sm">
              <Card.Body className="p-4 d-flex flex-column flex-md-row gap-3 justify-content-between align-items-md-center">
                <div className="d-flex gap-3 align-items-center">
                  <Button variant="outline-success" className="customer-insights-report-custom-btn-outline border-success text-success px-4"
                    onClick={() => { setExportType('Excel'); setShowExportModal(true); }} disabled={exporting || !reportData}>
                    <CsLineIcons icon="file-text" className="me-2" size="15" /> Excel
                  </Button>
                  <Button variant="outline-danger" className="customer-insights-report-custom-btn-outline border-danger text-danger px-4"
                    onClick={() => { setExportType('PDF'); setShowExportModal(true); }} disabled={exporting || !reportData}>
                    <CsLineIcons icon="file-text" className="me-2" size="15" /> PDF
                  </Button>
                </div>
                {exporting && (
                  <div className="flex-grow-1 ms-md-4 mt-3 mt-md-0">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="smaller fw-bold text-muted">Preparing {exportType}...</span>
                      <span className="smaller fw-bold text-primary">{exportProgress}%</span>
                    </div>
                    <ProgressBar now={exportProgress} className="progress-sm" variant="info" style={{ height: '6px' }} />
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Key Summary Metrics */}
            <Row className="g-3 mb-4">
              <Col xl="3" md="6">
                <Card className="customer-insights-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
                  <Card.Body className="p-4 customer-insights-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="customer-insights-report-stat-label mb-2">Total Customers</div>
                        <div className="customer-insights-report-stat-value text-primary">{totalCustomers}</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: brandBg }}>
                         <CsLineIcons icon="user" size="24" style={{ color: brandColor }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="customer-insights-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
                  <Card.Body className="p-4 customer-insights-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="customer-insights-report-stat-label mb-2">Repeat Customers</div>
                        <div className="customer-insights-report-stat-value text-success">{repeatCustomers}</div>
                        <div className="smaller fw-bold text-success mt-1">{repeatRate}% Loyalty</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                         <CsLineIcons icon="check-circle" size="24" style={{ color: '#10b981' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="customer-insights-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #f59e0b' }}>
                  <Card.Body className="p-4 customer-insights-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="customer-insights-report-stat-label mb-2">One-Time Visitors</div>
                        <div className="customer-insights-report-stat-value text-warning">{oneTimeCustomers}</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                        <CsLineIcons icon="user" size="24" style={{ color: '#f59e0b' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl="3" md="6">
                <Card className="customer-insights-report-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #6366f1' }}>
                  <Card.Body className="p-4 customer-insights-report-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="customer-insights-report-stat-label mb-2">Avg Lifetime Value</div>
                        <div className="customer-insights-report-stat-value" style={{ color: '#6366f1' }}>{formatCurrency(reportData.topCustomers?.[0]?.avgOrderValue || 0)}</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <CsLineIcons icon="trend-up" size="24" style={{ color: '#6366f1' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Detailed Analytics Detail Row */}
            <Row className="g-3 mb-4">
              {/* Customer Performance Ranking */}
              <Col lg="4">
                <Card className="customer-insights-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-0">
                    <div className="p-4 customer-insights-report-card-title-container" style={{ marginBottom: '0' }}>
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Customer Ranking</h2>
                      <CsLineIcons icon="star" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="d-flex flex-column">
                      {reportData.topCustomers.length > 0 ? (
                        reportData.topCustomers.slice(0, 8).map((customer, idx) => {
                          const highlightClass = idx < 3 ? `customer-insights-report-dish-row-highlight-${idx}` : '';
                          return (
                            <div key={idx} className={`px-4 py-3 d-flex align-items-center justify-content-between ${highlightClass}`}>
                              <div className="d-flex align-items-center overflow-hidden">
                                <div className="sw-4 sh-4 rounded-circle d-flex justify-content-center align-items-center fw-bold me-3 text-muted smaller" 
                                     style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
                                  {idx + 1}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="text-truncate fw-bold small mb-0">{customer.customerName || 'Guest'}</div>
                                  <div className="text-muted smaller fw-bold" style={{ fontSize: '0.65rem' }}>{customer.totalOrders} visits</div>
                                </div>
                              </div>
                              <div className="text-end ms-2">
                                <div className="fw-bold small text-primary">{formatCurrency(customer.totalSpent)}</div>
                                <div className="text-muted smaller fw-bold" style={{ fontSize: '0.65rem' }}>Total Spent</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-muted text-center py-5">No rankings available</div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Visit Frequency */}
              <Col lg="4">
                <Card className="customer-insights-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="customer-insights-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Visit Frequency</h2>
                      <CsLineIcons icon="activity" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="d-flex flex-column gap-3 mt-3">
                      {reportData.customerSegmentation.length > 0 ? (
                        reportData.customerSegmentation.map((segment, idx) => {
                          const labels = ['1 Order', '2-4 Orders', '5-9 Orders', '10-19 Orders', '20+ Orders'];
                          const percentage = totalCustomers > 0 ? ((segment.customerCount / totalCustomers) * 100).toFixed(1) : 0;
                          return (
                            <div key={idx}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="smaller fw-bold text-dark">{labels[segment._id - 1] || 'Other'}</span>
                                <span className="smaller fw-bold text-primary">{segment.customerCount} Users</span>
                              </div>
                              <ProgressBar now={percentage} className="progress-sm" style={{ height: '4px' }} />
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-muted text-center py-5">No frequency data</div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Value Distribution */}
              <Col lg="4">
                <Card className="customer-insights-report-interactive-card border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="customer-insights-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>LTV Distribution</h2>
                      <CsLineIcons icon="tag" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="d-flex flex-column gap-3 mt-3">
                      {reportData.lifetimeValueDistribution.length > 0 ? (
                        reportData.lifetimeValueDistribution.slice(0, 6).map((item, idx) => {
                          const ranges = ['₹0-1K', '₹1K-5K', '₹5K-10K', '₹10K-25K', '₹25K-50K', '₹50K+'];
                          const percentage = totalCustomers > 0 ? ((item.customerCount / totalCustomers) * 100).toFixed(1) : 0;
                          return (
                            <div key={idx}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="smaller fw-bold text-dark">{ranges[item._id] || 'Elite'}</span>
                                <div className="text-end">
                                  <span className="smaller fw-bold text-muted me-2">{percentage}%</span>
                                  <span className="smaller fw-bold text-success">{item.customerCount}</span>
                                </div>
                              </div>
                              <ProgressBar now={percentage} variant="success" className="progress-sm" style={{ height: '4px' }} />
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-muted text-center py-5">No distribution data</div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Customer Acquisition Trend */}
            <Row className="g-3 mb-4">
              <Col lg="12">
                <Card className="customer-insights-report-interactive-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="customer-insights-report-card-title-container">
                      <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Acquisition & Growth Trend</h2>
                      <CsLineIcons icon="trend-up" size="18" style={{ color: brandColor }} />
                    </div>
                    <div className="table-responsive mt-3">
                      <Table borderless hover className="align-middle mb-0">
                        <thead className="customer-insights-report-stat-label">
                          <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.05)' }}>
                            <th className="py-3">Date</th>
                            <th className="py-3 text-center">New Customers</th>
                            <th className="py-3 text-center">Growth Progress</th>
                            <th className="py-3 text-end">Retention</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.acquisitionTrend && reportData.acquisitionTrend.length > 0 ? (
                            [...reportData.acquisitionTrend].reverse().slice(0, 10).map((item, idx) => {
                              const totalNew = reportData.acquisitionTrend.reduce((sum, i) => sum + i.newCustomers, 0);
                              const percentage = totalNew > 0 ? ((item.newCustomers / totalNew) * 100).toFixed(1) : 0;
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                                  <td className="py-3 fw-bold text-dark">
                                    {`${String(item._id.day).padStart(2, '0')}-${String(item._id.month).padStart(2, '0')}-${item._id.year}`}
                                  </td>
                                  <td className="py-3 text-center">
                                    <Badge bg="rgba(35, 179, 244, 0.1)" className="text-primary px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '0.8rem' }}>
                                      {item.newCustomers} New
                                    </Badge>
                                  </td>
                                  <td className="py-3">
                                    <div className="d-flex align-items-center justify-content-center">
                                      <div className="flex-grow-1 me-3 d-none d-md-block" style={{ maxWidth: '100px' }}>
                                        <ProgressBar now={percentage * 5} variant="info" className="progress-sm" style={{ height: '4px' }} />
                                      </div>
                                      <span className="smaller fw-bold text-muted">{percentage}%</span>
                                    </div>
                                  </td>
                                  <td className="py-3 text-end fw-bold text-success">
                                    {item.newCustomers > 0 ? 'High' : 'Stable'}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-5">No acquisition data available</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
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
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>Export Insights</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted smaller fw-bold mb-4">Select analytics modules for the export.</p>
          <Form className="d-flex flex-column gap-3">
            {[
              { label: 'Customer Performance Ranking', key: 'includeTopCustomers' },
              { label: 'Segmentation Analytics', key: 'includeSegmentation' },
              { label: 'Loyalty Analysis', key: 'includeLoyaltyAnalysis' },
              { label: 'Lifetime Value Distribution', key: 'includeLifetimeValue' },
              { label: 'Growth Trend Visuals', key: 'includeCharts' }
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
          <Button variant="light" className="customer-insights-report-custom-btn-outline border-0 text-muted" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button className="customer-insights-report-custom-btn-outline px-4" onClick={handleExportConfirm}>
            Generate {exportType || 'Report'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="white" className="customer-insights-report-interactive-card border-0">
          <Toast.Body className="p-3 d-flex align-items-center">
            <CsLineIcons icon="check-circle" className="text-success me-2" size="20" />
            <span className="fw-bold smaller text-dark">{toastMessage}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default CustomerInsightsReport;

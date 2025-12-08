import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const CustomerInsightsReport = () => {
  const title = 'Customer Insights Report';
  const description = 'Detailed Customer Analysis and Behavior Patterns';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/customers', text: 'Customer Insights' },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const API_BASE = process.env.REACT_APP_API;
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
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
      };

      const response = await axios.get(`${API_BASE}/statistics/customers/insights`, {
        ...getHeaders(),
        params,
      });

      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching customer report:', err);
      setError(err.response?.data?.error || 'Failed to load customer report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerReport();
  }, []);

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Top Customers Sheet
    const customersData = [
      ['Rank', 'Customer Name', 'Total Orders', 'Total Spent', 'Avg Order Value', 'Total Discount', 'Last Order Date'],
      ...reportData.topCustomers.map((customer, idx) => [
        idx + 1,
        customer.customerName || 'Guest',
        customer.totalOrders,
        customer.totalSpent,
        customer.avgOrderValue,
        customer.totalDiscount,
        format(new Date(customer.lastOrderDate), 'PPP'),
      ]),
    ];
    const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, customersSheet, 'Top Customers');

    // Segmentation Sheet
    const segmentLabels = ['1 order', '2-4 orders', '5-9 orders', '10-19 orders', '20+ orders'];
    const segmentData = [
      ['Segment', 'Customer Count', 'Total Revenue', 'Avg Orders per Customer'],
      ...reportData.customerSegmentation.map((seg, idx) => [
        segmentLabels[idx] || 'Other',
        seg.customerCount,
        seg.totalRevenue,
        seg.avgOrdersPerCustomer.toFixed(2),
      ]),
    ];
    const segmentSheet = XLSX.utils.aoa_to_sheet(segmentData);
    XLSX.utils.book_append_sheet(wb, segmentSheet, 'Segmentation');

    XLSX.writeFile(wb, `Customer_Insights_Report_${startDate}_to_${endDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(20);
    doc.text('Customer Insights Report', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, yPosition);
    yPosition += 15;

    // Top 20 Customers
    doc.setFontSize(14);
    doc.text('Top 20 Customers by Spending', 14, yPosition);
    yPosition += 8;

    doc.autoTable({
      startY: yPosition,
      head: [['Rank', 'Customer', 'Orders', 'Total Spent', 'Avg Value']],
      body: reportData.topCustomers
        .slice(0, 20)
        .map((customer, idx) => [
          idx + 1,
          customer.customerName || 'Guest',
          customer.totalOrders,
          formatCurrency(customer.totalSpent),
          formatCurrency(customer.avgOrderValue),
        ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
    });

    doc.save(`Customer_Insights_Report_${startDate}_to_${endDate}.pdf`);
  };

  if (loading && !reportData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const repeatCustomerData = reportData?.repeatCustomerAnalysis || [];
  const oneTimeCustomers = repeatCustomerData.find((item) => item._id === 'one-time')?.count || 0;
  const repeatCustomers = repeatCustomerData.find((item) => item._id === 'repeat')?.count || 0;
  const totalCustomers = oneTimeCustomers + repeatCustomers;
  const repeatRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : 0;

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-3">
        <Row>
          <Col>
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Col>
            <Col md={4}>
              <Button variant="primary" className="w-100" onClick={fetchCustomerReport}>
                <CsLineIcons icon="sync" className="me-2" />
                Generate Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {reportData && (
        <>
          {/* Export Buttons */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex gap-2">
                <Button variant="success" onClick={exportToExcel}>
                  <CsLineIcons icon="file-text" className="me-2" />
                  Export to Excel
                </Button>
                <Button variant="danger" onClick={exportToPDF}>
                  <CsLineIcons icon="file-pdf" className="me-2" />
                  Export to PDF
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Total Customers</div>
                  <div className="text-primary h3 mb-0">{totalCustomers}</div>
                  <div className="text-small text-muted mt-1">In selected period</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Repeat Customers</div>
                  <div className="text-success h3 mb-0">{repeatCustomers}</div>
                  <div className="text-small text-muted mt-1">{repeatRate}% repeat rate</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">One-Time Customers</div>
                  <div className="text-warning h3 mb-0">{oneTimeCustomers}</div>
                  <div className="text-small text-muted mt-1">{totalCustomers > 0 ? ((oneTimeCustomers / totalCustomers) * 100).toFixed(1) : 0}% of total</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">New Customers</div>
                  <div className="text-info h3 mb-0">{reportData.acquisitionTrend?.reduce((sum, item) => sum + item.newCustomers, 0) || 0}</div>
                  <div className="text-small text-muted mt-1">First-time visitors</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Customer Loyalty Analysis */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Customer Loyalty Analysis</h5>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Repeat Customers</span>
                      <span className="font-weight-bold">
                        {repeatCustomers} ({repeatRate}%)
                      </span>
                    </div>
                    <ProgressBar now={repeatRate} variant="success" />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>One-Time Customers</span>
                      <span className="font-weight-bold">
                        {oneTimeCustomers} ({totalCustomers > 0 ? ((oneTimeCustomers / totalCustomers) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <ProgressBar now={totalCustomers > 0 ? (oneTimeCustomers / totalCustomers) * 100 : 0} variant="warning" />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3">
                    <h6 className="mb-3">Customer Retention Insights</h6>
                    <div className="text-small">
                      <p className="mb-2">
                        <strong>{repeatRate}%</strong> of customers made repeat purchases, showing{' '}
                        {repeatRate > 40 ? 'excellent' : repeatRate > 25 ? 'good' : 'moderate'} customer loyalty.
                      </p>
                      <p className="mb-0">
                        Focus on converting {oneTimeCustomers} one-time customers into repeat visitors through loyalty programs and personalized offers.
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Customer Segmentation */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Customer Segmentation by Order Frequency</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Segment</th>
                      <th className="text-end">Customer Count</th>
                      <th className="text-end">Total Revenue</th>
                      <th className="text-end">Avg Orders</th>
                      <th className="text-end">Revenue per Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customerSegmentation.map((segment, idx) => {
                      const segmentLabels = ['1 order', '2-4 orders', '5-9 orders', '10-19 orders', '20+ orders'];
                      const revenuePerCustomer = segment.customerCount > 0 ? segment.totalRevenue / segment.customerCount : 0;

                      return (
                        <tr key={idx}>
                          <td className="font-weight-bold">{segmentLabels[segment._id - 1] || 'Other'}</td>
                          <td className="text-end">{segment.customerCount}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(segment.totalRevenue)}</td>
                          <td className="text-end">{segment.avgOrdersPerCustomer.toFixed(2)}</td>
                          <td className="text-end">{formatCurrency(revenuePerCustomer)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Top Customers */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Top 50 Customers by Spending</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Customer Name</th>
                      <th className="text-end">Total Orders</th>
                      <th className="text-end">Total Spent</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-end">Total Discount</th>
                      <th>Last Order</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topCustomers.map((customer, idx) => {
                      const daysSinceLastOrder = Math.floor((new Date() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24));

                      return (
                        <tr key={idx}>
                          <td>
                            <Badge bg={idx < 3 ? 'primary' : idx < 10 ? 'info' : 'secondary'}>{idx + 1}</Badge>
                          </td>
                          <td className="font-weight-bold">{customer.customerName || 'Guest Customer'}</td>
                          <td className="text-end">{customer.totalOrders}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(customer.totalSpent)}</td>
                          <td className="text-end">{formatCurrency(customer.avgOrderValue)}</td>
                          <td className="text-end text-danger">{formatCurrency(customer.totalDiscount)}</td>
                          <td>{format(new Date(customer.lastOrderDate), 'MMM dd, yyyy')}</td>
                          <td className="text-center">
                            <Badge bg={daysSinceLastOrder < 7 ? 'success' : daysSinceLastOrder < 30 ? 'warning' : 'danger'}>
                              {daysSinceLastOrder < 7 ? 'Active' : daysSinceLastOrder < 30 ? 'Recent' : 'Inactive'}
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

          {/* Lifetime Value Distribution */}
          {reportData.lifetimeValueDistribution && reportData.lifetimeValueDistribution.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Customer Lifetime Value Distribution</h5>
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Value Range</th>
                        <th className="text-end">Customer Count</th>
                        <th className="text-end">Total Value</th>
                        <th className="text-end">Avg per Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.lifetimeValueDistribution.map((item, idx) => {
                        const ranges = ['₹0 - ₹1,000', '₹1,000 - ₹5,000', '₹5,000 - ₹10,000', '₹10,000 - ₹25,000', '₹25,000 - ₹50,000', '₹50,000 - ₹1,00,000'];
                        const avgPerCustomer = item.customerCount > 0 ? item.totalValue / item.customerCount : 0;

                        return (
                          <tr key={idx}>
                            <td className="font-weight-bold">{ranges[item._id] || '₹1,00,000+'}</td>
                            <td className="text-end">{item.customerCount}</td>
                            <td className="text-end font-weight-bold text-primary">{formatCurrency(item.totalValue)}</td>
                            <td className="text-end">{formatCurrency(avgPerCustomer)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Customer Acquisition Trend */}
          {reportData.acquisitionTrend && reportData.acquisitionTrend.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">New Customer Acquisition Trend</h5>
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="text-end">New Customers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.acquisitionTrend.map((item, idx) => (
                        <tr key={idx}>
                          <td>{`${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`}</td>
                          <td className="text-end font-weight-bold">{item.newCustomers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </>
  );
};

export default CustomerInsightsReport;

import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SalesReport = () => {
  const title = 'Sales Report';
  const description = 'Detailed Sales Analysis and Reports';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
    { to: 'statistics', text: 'Statistics' },
    { to: 'reports/sales', text: 'Sales Report' },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [groupBy, setGroupBy] = useState('day');
  const [orderType, setOrderType] = useState('all');

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

  const formatCurrencyPDF = (amount) => {
    const value = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount || 0);

    return `Rs. ${value}`;
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

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Sales Report'],
      ['Period', `${startDate} to ${endDate}`],
      ['Generated', format(new Date(), 'PPpp')],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', reportData.revenue.summary.totalRevenue],
      ['Total Orders', reportData.revenue.summary.totalOrders],
      ['Average Order Value', reportData.revenue.summary.averageOrderValue],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Revenue Details
    const revenueData = [
      ['Date', 'Revenue', 'Orders', 'Avg Order Value'],
      ...reportData.revenue.data.map((item) => [
        `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day || 1).padStart(2, '0')}`,
        item.value,
        item.orderCount,
        item.orderCount > 0 ? (item.value / item.orderCount).toFixed(2) : 0,
      ]),
    ];
    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue Details');

    // Top Dishes
    const dishesData = [
      ['Rank', 'Dish Name', 'Category', 'Quantity Sold', 'Revenue', 'Orders'],
      ...reportData.dishes.data.map((dish, idx) => [idx + 1, dish.dishName, dish.category || 'N/A', dish.totalQuantity, dish.totalRevenue, dish.orderCount]),
    ];
    const dishesSheet = XLSX.utils.aoa_to_sheet(dishesData);
    XLSX.utils.book_append_sheet(wb, dishesSheet, 'Top Dishes');

    // Order Type Breakdown
    const orderTypeData = [
      ['Order Type', 'Count', 'Revenue', 'Avg Order Value'],
      ...reportData.orders.data.map((order) => [order.category, order.count, order.totalRevenue, order.avgOrderValue]),
    ];
    const orderTypeSheet = XLSX.utils.aoa_to_sheet(orderTypeData);
    XLSX.utils.book_append_sheet(wb, orderTypeSheet, 'Order Types');

    XLSX.writeFile(wb, `Sales_Report_${startDate}_to_${endDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text('Sales Report', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, yPosition);
    yPosition += 15;

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 14, yPosition);
    yPosition += 8;

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', formatCurrencyPDF(reportData.revenue.summary.totalRevenue)],
        ['Total Orders', reportData.revenue.summary.totalOrders],
        ['Average Order Value', formatCurrencyPDF(reportData.revenue.summary.averageOrderValue)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Top 10 Dishes
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Top 10 Dishes', 14, yPosition);
    yPosition += 8;

    autoTable(doc, {
      startY: yPosition,
      head: [['Rank', 'Dish', 'Category', 'Qty', 'Revenue']],
      body: reportData.dishes.data
        .slice(0, 10)
        .map((dish, idx) => [
          idx + 1,
          dish.dishName,
          dish.category || 'N/A',
          dish.totalQuantity,
          formatCurrencyPDF(dish.totalRevenue),
        ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Order Type Breakdown
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Order Type Breakdown', 14, yPosition);
    yPosition += 8;

    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Count', 'Revenue', 'Avg Value']],
      body: reportData.orders.data.map((order) => [
        order.category,
        order.count,
        formatCurrencyPDF(order.totalRevenue),
        formatCurrencyPDF(order.avgOrderValue),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Sales_Report_${startDate}_to_${endDate}.pdf`);
  };


  const printReport = () => {
    window.print();
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
            <Col md={3}>
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label>Group By</Form.Label>
              <Form.Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="hour">Hour</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Order Type</Form.Label>
              <Form.Select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="dine-in">Dine In</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="primary" className="w-100" onClick={fetchSalesReport}>
                <CsLineIcons icon="sync" className="me-2" />
                Generate
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
                <Button variant="info" onClick={printReport}>
                  <CsLineIcons icon="print" className="me-2" />
                  Print Report
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Total Revenue</div>
                  <div className="text-primary h3 mb-0">{formatCurrency(reportData.revenue.summary.totalRevenue)}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Total Orders</div>
                  <div className="text-primary h3 mb-0">{reportData.revenue.summary.totalOrders}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Average Order Value</div>
                  <div className="text-primary h3 mb-0">{formatCurrency(reportData.revenue.summary.averageOrderValue)}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Report Period</div>
                  <div className="text-primary h5 mb-0">
                    {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd')}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Revenue Trend Table */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Revenue Trend</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.revenue.data.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          {groupBy === 'day'
                            ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`
                            : `${item._id.year}-${String(item._id.month).padStart(2, '0')}`}
                        </td>
                        <td className="text-end font-weight-bold">{formatCurrency(item.value)}</td>
                        <td className="text-end">{item.orderCount}</td>
                        <td className="text-end">{formatCurrency(item.orderCount > 0 ? item.value / item.orderCount : 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Top Dishes Table */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Top Selling Dishes</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Dish Name</th>
                      <th>Category</th>
                      <th className="text-end">Quantity</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Orders</th>
                      <th className="text-center">Special</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dishes.data.map((dish, idx) => (
                      <tr key={idx}>
                        <td>
                          <Badge bg={idx < 3 ? 'primary' : 'secondary'}>{idx + 1}</Badge>
                        </td>
                        <td className="font-weight-bold">{dish.dishName}</td>
                        <td>{dish.category || 'N/A'}</td>
                        <td className="text-end">{dish.totalQuantity}</td>
                        <td className="text-end font-weight-bold text-primary">{formatCurrency(dish.totalRevenue)}</td>
                        <td className="text-end">{dish.orderCount}</td>
                        <td className="text-center">{dish.isSpecial ? <Badge bg="warning">★</Badge> : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Order Type Breakdown */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Order Type Breakdown</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Order Type</th>
                      <th className="text-end">Count</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-end">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.data.map((order, idx) => (
                      <tr key={idx}>
                        <td className="font-weight-bold">{order.category}</td>
                        <td className="text-end">{order.count}</td>
                        <td className="text-end font-weight-bold text-primary">{formatCurrency(order.totalRevenue)}</td>
                        <td className="text-end">{formatCurrency(order.avgOrderValue)}</td>
                        <td className="text-end">{((order.totalRevenue / reportData.revenue.summary.totalRevenue) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
};

export default SalesReport;

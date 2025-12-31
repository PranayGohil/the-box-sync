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

const OperationalReport = () => {
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

  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'));
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

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Waiter Performance
    const waiterData = [
      ['Waiter', 'Total Orders', 'Revenue', 'Avg Order Value', 'Tables Served', 'Total Discount', 'Revenue/Order'],
      ...reportData.waiterPerformance.map((waiter) => [
        waiter.waiter,
        waiter.totalOrders,
        waiter.totalRevenue,
        waiter.avgOrderValue,
        waiter.tablesServed,
        waiter.totalDiscount,
        waiter.revenuePerOrder,
      ]),
    ];
    const waiterSheet = XLSX.utils.aoa_to_sheet(waiterData);
    XLSX.utils.book_append_sheet(wb, waiterSheet, 'Waiter Performance');

    // Table Performance
    const tableData = [
      ['Table No', 'Area', 'Orders', 'Revenue', 'Avg Order', 'Total Persons', 'Avg Persons', 'Revenue/Person'],
      ...reportData.tablePerformance.map((table) => [
        table.tableNo,
        table.tableArea || 'N/A',
        table.orderCount,
        table.totalRevenue,
        table.avgOrderValue,
        table.totalPersons,
        table.avgPersonsPerOrder,
        table.revenuePerPerson,
      ]),
    ];
    const tableSheet = XLSX.utils.aoa_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, tableSheet, 'Table Performance');

    // Peak Hours
    const hoursData = [
      ['Hour', 'Orders', 'Revenue', 'Avg Order Value'],
      ...reportData.peakHours.map((hour) => [`${hour.hour}:00`, hour.orderCount, hour.totalRevenue, hour.avgOrderValue]),
    ];
    const hoursSheet = XLSX.utils.aoa_to_sheet(hoursData);
    XLSX.utils.book_append_sheet(wb, hoursSheet, 'Peak Hours');

    XLSX.writeFile(wb, `Operational_Report_${startDate}_to_${endDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF('landscape');
    let yPosition = 20;

    doc.setFontSize(20);
    doc.text('Operational Performance Report', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, yPosition);
    yPosition += 15;

    // Waiter Performance
    doc.setFontSize(14);
    doc.text('Waiter Performance', 14, yPosition);
    yPosition += 8;

    autoTable({
      startY: yPosition,
      head: [['Waiter', 'Orders', 'Revenue', 'Avg Order', 'Tables']],
      body: reportData.waiterPerformance.map((waiter) => [
        waiter.waiter,
        waiter.totalOrders,
        formatCurrency(waiter.totalRevenue),
        formatCurrency(waiter.avgOrderValue),
        waiter.tablesServed,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Table Performance
    if (yPosition > 150) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Top 15 Tables by Revenue', 14, yPosition);
    yPosition += 8;

    autoTable({
      startY: yPosition,
      head: [['Table', 'Area', 'Orders', 'Revenue', 'Avg Order']],
      body: reportData.tablePerformance
        .slice(0, 15)
        .map((table) => [table.tableNo, table.tableArea || 'N/A', table.orderCount, formatCurrency(table.totalRevenue), formatCurrency(table.avgOrderValue)]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Operational_Report_${startDate}_to_${endDate}.pdf`);
  };

  if (loading && !reportData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const getBusiestHour = () => {
    if (!reportData?.peakHours || reportData.peakHours.length === 0) return null;
    return reportData.peakHours.reduce((max, hour) => (hour.orderCount > max.orderCount ? hour : max), reportData.peakHours[0]);
  };

  const getBusiestDay = () => {
    if (!reportData?.dayOfWeekAnalysis || reportData.dayOfWeekAnalysis.length === 0) return null;
    return reportData.dayOfWeekAnalysis.reduce((max, day) => (day.orderCount > max.orderCount ? day : max), reportData.dayOfWeekAnalysis[0]);
  };

  const busiestHour = getBusiestHour();
  const busiestDay = getBusiestDay();

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
              <Button variant="primary" className="w-100" onClick={fetchOperationalReport}>
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

          {/* Key Insights */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Total Staff</div>
                  <div className="text-primary h3 mb-0">{reportData.waiterPerformance?.length || 0}</div>
                  <div className="text-small text-muted">Active waiters</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Busiest Hour</div>
                  <div className="text-primary h3 mb-0">{busiestHour ? `${busiestHour.hour}:00` : 'N/A'}</div>
                  <div className="text-small text-muted">{busiestHour ? `${busiestHour.orderCount} orders` : ''}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Busiest Day</div>
                  <div className="text-primary h3 mb-0">{busiestDay ? busiestDay.dayName : 'N/A'}</div>
                  <div className="text-small text-muted">{busiestDay ? `${busiestDay.orderCount} orders` : ''}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="text-muted text-small mb-1">Active Tables</div>
                  <div className="text-primary h3 mb-0">{reportData.tablePerformance?.length || 0}</div>
                  <div className="text-small text-muted">Tables used</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Waiter Performance */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Waiter Performance</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Waiter</th>
                      <th className="text-end">Total Orders</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-end">Tables Served</th>
                      <th className="text-end">Total Discount</th>
                      <th className="text-end">Revenue/Order</th>
                      <th className="text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.waiterPerformance.map((waiter, idx) => {
                      const avgRevenue = reportData.waiterPerformance.reduce((sum, w) => sum + w.totalRevenue, 0) / reportData.waiterPerformance.length;
                      const performance =
                        waiter.totalRevenue >= avgRevenue * 1.2 ? 'excellent' : waiter.totalRevenue >= avgRevenue * 0.8 ? 'good' : 'needs-improvement';

                      return (
                        <tr key={idx}>
                          <td>
                            <Badge bg={idx < 3 ? 'primary' : 'secondary'}>{idx + 1}</Badge>
                          </td>
                          <td className="font-weight-bold">{waiter.waiter}</td>
                          <td className="text-end">{waiter.totalOrders}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(waiter.totalRevenue)}</td>
                          <td className="text-end">{formatCurrency(waiter.avgOrderValue)}</td>
                          <td className="text-end">{waiter.tablesServed}</td>
                          <td className="text-end text-danger">{formatCurrency(waiter.totalDiscount)}</td>
                          <td className="text-end">{formatCurrency(waiter.revenuePerOrder)}</td>
                          <td className="text-center">
                            <Badge bg={performance === 'excellent' ? 'success' : performance === 'good' ? 'info' : 'warning'}>
                              {performance === 'excellent' ? '⭐ Excellent' : performance === 'good' ? '👍 Good' : '📈 Improving'}
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
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Table Performance</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Table No</th>
                      <th>Area</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order</th>
                      <th className="text-end">Total Persons</th>
                      <th className="text-end">Avg Persons</th>
                      <th className="text-end">Revenue/Person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.tablePerformance.map((table, idx) => (
                      <tr key={idx}>
                        <td>
                          <Badge bg={idx < 5 ? 'primary' : 'secondary'}>{idx + 1}</Badge>
                        </td>
                        <td className="font-weight-bold">{table.tableNo}</td>
                        <td>{table.tableArea || 'N/A'}</td>
                        <td className="text-end">{table.orderCount}</td>
                        <td className="text-end font-weight-bold text-primary">{formatCurrency(table.totalRevenue)}</td>
                        <td className="text-end">{formatCurrency(table.avgOrderValue)}</td>
                        <td className="text-end">{table.totalPersons}</td>
                        <td className="text-end">{table.avgPersonsPerOrder}</td>
                        <td className="text-end">{formatCurrency(table.revenuePerPerson)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Peak Hours Analysis */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Hourly Performance Analysis</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Hour</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-center">Activity Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.peakHours.map((hour, idx) => {
                      const maxOrders = Math.max(...reportData.peakHours.map((h) => h.orderCount));
                      const activityPercent = (hour.orderCount / maxOrders) * 100;
                      const activityLevel = activityPercent >= 80 ? 'peak' : activityPercent >= 50 ? 'busy' : activityPercent >= 25 ? 'moderate' : 'slow';

                      return (
                        <tr key={idx}>
                          <td className="font-weight-bold">
                            {hour.hour}:00 - {hour.hour + 1}:00
                          </td>
                          <td className="text-end">{hour.orderCount}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(hour.totalRevenue)}</td>
                          <td className="text-end">{formatCurrency(hour.avgOrderValue)}</td>
                          <td className="text-center">
                            <Badge
                              bg={
                                activityLevel === 'peak' ? 'danger' : activityLevel === 'busy' ? 'warning' : activityLevel === 'moderate' ? 'info' : 'secondary'
                              }
                            >
                              {activityLevel === 'peak'
                                ? '🔥 Peak'
                                : activityLevel === 'busy'
                                ? '📈 Busy'
                                : activityLevel === 'moderate'
                                ? '➡️ Moderate'
                                : '😴 Slow'}
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

          {/* Day of Week Analysis */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Day of Week Performance</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Avg Order Value</th>
                      <th className="text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dayOfWeekAnalysis.map((day, idx) => {
                      const avgRevenue = reportData.dayOfWeekAnalysis.reduce((sum, d) => sum + d.totalRevenue, 0) / reportData.dayOfWeekAnalysis.length;
                      const performance = day.totalRevenue >= avgRevenue * 1.2 ? 'best' : day.totalRevenue >= avgRevenue * 0.8 ? 'average' : 'below';

                      return (
                        <tr key={idx}>
                          <td className="font-weight-bold">{day.dayName}</td>
                          <td className="text-end">{day.orderCount}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(day.totalRevenue)}</td>
                          <td className="text-end">{formatCurrency(day.avgOrderValue)}</td>
                          <td className="text-center">
                            <Badge bg={performance === 'best' ? 'success' : performance === 'average' ? 'info' : 'warning'}>
                              {performance === 'best' ? '⭐ Best Day' : performance === 'average' ? '📊 Average' : '📉 Below Avg'}
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

          {/* Area Performance */}
          {reportData.areaPerformance && reportData.areaPerformance.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Table Area Performance</h5>
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Area</th>
                        <th className="text-end">Orders</th>
                        <th className="text-end">Revenue</th>
                        <th className="text-end">Avg Order</th>
                        <th className="text-end">Tables</th>
                        <th className="text-end">Revenue/Table</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.areaPerformance.map((area, idx) => (
                        <tr key={idx}>
                          <td className="font-weight-bold">{area.area}</td>
                          <td className="text-end">{area.orderCount}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(area.totalRevenue)}</td>
                          <td className="text-end">{formatCurrency(area.avgOrderValue)}</td>
                          <td className="text-end">{area.tableCount}</td>
                          <td className="text-end">{formatCurrency(area.revenuePerTable)}</td>
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

export default OperationalReport;

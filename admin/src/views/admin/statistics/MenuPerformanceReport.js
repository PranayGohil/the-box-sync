import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Table, Form, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MenuPerformanceReport = () => {
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

  const [startDate, setStartDate] = useState(format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMealType, setSelectedMealType] = useState('all');

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

  const fetchMenuReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        period: 'custom',
        start_date: startDate,
        end_date: endDate,
      };

      const response = await axios.get(`${API_BASE}/statistics/menu/report`, {
        ...getHeaders(),
        params,
      });

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
  }, []);

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Menu Performance Report'],
      ['Period', `${startDate} to ${endDate}`],
      ['Generated', format(new Date(), 'PPpp')],
      [],
      ['Metric', 'Value'],
      ['Total Dishes', reportData.summary.totalDishes],
      ['Total Revenue', reportData.summary.totalRevenue],
      ['Total Categories', reportData.summary.totalCategories],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // All Dishes Performance
    const dishesData = [
      ['Rank', 'Dish Name', 'Category', 'Meal Type', 'Special', 'Quantity', 'Revenue', 'Orders', 'Avg Price', 'Revenue/Item'],
      ...reportData.dishPerformance.map((dish, idx) => [
        idx + 1,
        dish.dishName,
        dish.category || 'N/A',
        dish.mealType || 'N/A',
        dish.isSpecial ? 'Yes' : 'No',
        dish.totalQuantity,
        dish.totalRevenue,
        dish.orderCount,
        dish.avgPrice,
        dish.revenuePerItem,
      ]),
    ];
    const dishesSheet = XLSX.utils.aoa_to_sheet(dishesData);
    XLSX.utils.book_append_sheet(wb, dishesSheet, 'All Dishes');

    // Category Performance
    const categoryData = [
      ['Category', 'Quantity Sold', 'Revenue', 'Orders', 'Unique Dishes', 'Avg Revenue/Dish'],
      ...reportData.categoryPerformance.map((cat) => [
        cat.category,
        cat.totalQuantity,
        cat.totalRevenue,
        cat.orderCount,
        cat.uniqueDishCount,
        cat.avgRevenuePerDish,
      ]),
    ];
    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categorySheet, 'Category Performance');

    // Meal Type Performance
    const mealTypeData = [
      ['Meal Type', 'Quantity Sold', 'Revenue', 'Orders'],
      ...reportData.mealTypePerformance.map((meal) => [meal.mealType, meal.totalQuantity, meal.totalRevenue, meal.orderCount]),
    ];
    const mealTypeSheet = XLSX.utils.aoa_to_sheet(mealTypeData);
    XLSX.utils.book_append_sheet(wb, mealTypeSheet, 'Meal Type Performance');

    XLSX.writeFile(wb, `Menu_Performance_Report_${startDate}_to_${endDate}.xlsx`);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF('landscape');
    let yPosition = 20;

    doc.setFontSize(20);
    doc.text('Menu Performance Report', 14, yPosition);
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

    autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Dishes', reportData.summary.totalDishes],
        ['Total Revenue', formatCurrency(reportData.summary.totalRevenue)],
        ['Total Categories', reportData.summary.totalCategories],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Top 20 Dishes
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.text('Top 20 Dishes by Revenue', 14, yPosition);
    yPosition += 8;

    autoTable({
      startY: yPosition,
      head: [['Rank', 'Dish', 'Category', 'Qty', 'Revenue', 'Special']],
      body: reportData.dishPerformance
        .slice(0, 20)
        .map((dish, idx) => [
          idx + 1,
          dish.dishName.substring(0, 30),
          dish.category || 'N/A',
          dish.totalQuantity,
          formatCurrency(dish.totalRevenue),
          dish.isSpecial ? '⭐' : '-',
        ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Category Performance
    if (yPosition > 150) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Category Performance', 14, yPosition);
    yPosition += 8;

    autoTable({
      startY: yPosition,
      head: [['Category', 'Quantity', 'Revenue', 'Dishes']],
      body: reportData.categoryPerformance.map((cat) => [cat.category, cat.totalQuantity, formatCurrency(cat.totalRevenue), cat.uniqueDishCount]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Menu_Performance_Report_${startDate}_to_${endDate}.pdf`);
  };

  if (loading && !reportData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Filter dishes based on selected category and meal type
  const getFilteredDishes = () => {
    if (!reportData) return [];

    return reportData.dishPerformance.filter((dish) => {
      const categoryMatch = selectedCategory === 'all' || dish.category === selectedCategory;
      const mealTypeMatch = selectedMealType === 'all' || dish.mealType === selectedMealType;
      return categoryMatch && mealTypeMatch;
    });
  };

  const filteredDishes = getFilteredDishes();

  // Get unique categories and meal types for filters
  const categories = reportData ? ['all', ...new Set(reportData.dishPerformance.map((d) => d.category).filter(Boolean))] : ['all'];
  const mealTypes = reportData ? ['all', ...new Set(reportData.dishPerformance.map((d) => d.mealType).filter(Boolean))] : ['all'];

  // Calculate performance metrics
  const getPerformanceLevel = (dish) => {
    if (!reportData) return 'average';
    const avgRevenue = reportData.summary.totalRevenue / reportData.summary.totalDishes;
    if (dish.totalRevenue >= avgRevenue * 1.5) return 'excellent';
    if (dish.totalRevenue >= avgRevenue * 0.7) return 'good';
    return 'poor';
  };

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
              <Form.Label>Category</Form.Label>
              <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Meal Type</Form.Label>
              <Form.Select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)}>
                {mealTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="primary" className="w-100" onClick={fetchMenuReport}>
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
              </div>
            </Card.Body>
          </Card>

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Total Dishes</div>
                  <div className="text-primary h3 mb-0">{reportData.summary.totalDishes}</div>
                  <div className="text-small text-muted mt-1">Active in menu</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Total Revenue</div>
                  <div className="text-success h3 mb-0">{formatCurrency(reportData.summary.totalRevenue)}</div>
                  <div className="text-small text-muted mt-1">From all dishes</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Categories</div>
                  <div className="text-info h3 mb-0">{reportData.summary.totalCategories}</div>
                  <div className="text-small text-muted mt-1">Menu categories</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6} className="mb-3">
              <Card className="sh-13">
                <Card.Body>
                  <div className="text-muted text-small mb-1">Avg Revenue/Dish</div>
                  <div className="text-warning h3 mb-0">{formatCurrency(reportData.summary.totalRevenue / reportData.summary.totalDishes)}</div>
                  <div className="text-small text-muted mt-1">Per dish average</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Category Performance */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Category Performance Overview</h5>
              <Row>
                {reportData.categoryPerformance.map((category, idx) => (
                  <Col lg={4} md={6} key={idx} className="mb-3">
                    <Card className="border">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">{category.category}</h6>
                            <div className="text-muted text-small">{category.uniqueDishCount} dishes</div>
                          </div>
                          <Badge bg="primary">{category.orderCount} orders</Badge>
                        </div>

                        <div className="mb-2">
                          <div className="d-flex justify-content-between text-small mb-1">
                            <span>Revenue</span>
                            <span className="font-weight-bold text-primary">{formatCurrency(category.totalRevenue)}</span>
                          </div>
                          <ProgressBar now={(category.totalRevenue / reportData.summary.totalRevenue) * 100} variant="success" />
                        </div>

                        <div className="d-flex justify-content-between text-small">
                          <span>Quantity Sold:</span>
                          <span className="font-weight-bold">{category.totalQuantity}</span>
                        </div>
                        <div className="d-flex justify-content-between text-small">
                          <span>Avg Revenue/Dish:</span>
                          <span className="font-weight-bold">{formatCurrency(category.avgRevenuePerDish)}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Meal Type Performance */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Meal Type Performance</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Meal Type</th>
                      <th className="text-end">Quantity Sold</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">% of Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.mealTypePerformance.map((mealType, idx) => (
                      <tr key={idx}>
                        <td className="font-weight-bold">{mealType.mealType || 'Not Specified'}</td>
                        <td className="text-end">{mealType.totalQuantity}</td>
                        <td className="text-end font-weight-bold text-primary">{formatCurrency(mealType.totalRevenue)}</td>
                        <td className="text-end">{mealType.orderCount}</td>
                        <td className="text-end">{((mealType.totalRevenue / reportData.summary.totalRevenue) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* All Dishes Performance */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">All Dishes Performance</h5>
                <Badge bg="secondary">{filteredDishes.length} dishes</Badge>
              </div>

              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Dish Name</th>
                      <th>Category</th>
                      <th>Meal Type</th>
                      <th className="text-end">Quantity</th>
                      <th className="text-end">Revenue</th>
                      <th className="text-end">Orders</th>
                      <th className="text-end">Avg Price</th>
                      <th className="text-end">Revenue/Item</th>
                      <th className="text-center">Special</th>
                      <th className="text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDishes.map((dish, idx) => {
                      const performance = getPerformanceLevel(dish);

                      return (
                        <tr key={idx}>
                          <td>
                            <Badge bg={idx < 10 ? 'primary' : idx < 25 ? 'info' : 'secondary'}>{idx + 1}</Badge>
                          </td>
                          <td className="font-weight-bold">{dish.dishName}</td>
                          <td>{dish.category || 'N/A'}</td>
                          <td>{dish.mealType || 'N/A'}</td>
                          <td className="text-end">{dish.totalQuantity}</td>
                          <td className="text-end font-weight-bold text-primary">{formatCurrency(dish.totalRevenue)}</td>
                          <td className="text-end">{dish.orderCount}</td>
                          <td className="text-end">{formatCurrency(dish.avgPrice)}</td>
                          <td className="text-end">{formatCurrency(dish.revenuePerItem)}</td>
                          <td className="text-center">{dish.isSpecial ? <Badge bg="warning">⭐</Badge> : <span className="text-muted">-</span>}</td>
                          <td className="text-center">
                            <Badge bg={performance === 'excellent' ? 'success' : performance === 'good' ? 'info' : 'danger'}>
                              {performance === 'excellent' ? '🔥 Top Seller' : performance === 'good' ? '👍 Good' : '📉 Low'}
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

          {/* Performance Distribution */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Performance Distribution</h5>
              <Row>
                <Col md={4}>
                  <Card className="border-success">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="sh-5 sw-5 bg-success rounded-xl d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="trend-up" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="text-muted text-small">Top Performers</div>
                          <div className="h4 mb-0">{reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'excellent').length}</div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-info">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="sh-5 sw-5 bg-info rounded-xl d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="activity" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="text-muted text-small">Average Performers</div>
                          <div className="h4 mb-0">{reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'good').length}</div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-danger">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="sh-5 sw-5 bg-danger rounded-xl d-flex justify-content-center align-items-center me-3">
                          <CsLineIcons icon="trend-down" className="text-white" size="20" />
                        </div>
                        <div>
                          <div className="text-muted text-small">Low Performers</div>
                          <div className="h4 mb-0">{reportData.dishPerformance.filter((d) => getPerformanceLevel(d) === 'poor').length}</div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Alert variant="info" className="mt-3">
                <Alert.Heading className="h6">Performance Insights</Alert.Heading>
                <p className="mb-0 text-small">
                  Top performers generate 150% or more of average revenue. Consider promoting low performers or removing them from the menu. Special dishes
                  should ideally be top performers to justify their premium positioning.
                </p>
              </Alert>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
};

export default MenuPerformanceReport;

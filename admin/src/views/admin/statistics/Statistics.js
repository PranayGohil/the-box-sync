import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Dropdown, Badge, Spinner, Alert } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ChartDoughnut from './components/ChartDoughnut';
import ChartPie from './components/ChartPie';
import ChartHorizontalBar from './components/ChartHorizontalBar';

const Statistics = () => {
  const title = 'Analytics Dashboard';
  const description = 'Comprehensive Analytics Dashboard';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboards', text: 'Dashboards' },
  ];

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Data states
  const [overview, setOverview] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [comparison, setComparison] = useState(null);

  // API configuration
  const API_BASE = process.env.REACT_APP_API;
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Fetch all dashboard data
  const fetchDashboardData = async (period = 'today') => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [
        overviewRes,
        categoryRes,
        orderRes,
        revenueRes,
        topDishesRes,
        comparisonRes
      ] = await Promise.all([
        axios.get(`${API_BASE}/statistics/overview?period=${period}`, getHeaders()),
        axios.get(`${API_BASE}/statistics/categories?period=${period}`, getHeaders()),
        axios.get(`${API_BASE}/statistics/orders?period=${period}&group_by=type`, getHeaders()),
        axios.get(`${API_BASE}/statistics/revenue?period=${period === 'today' ? 'week' : period}&group_by=day`, getHeaders()),
        axios.get(`${API_BASE}/statistics/dishes/top?period=${period}&limit=10`, getHeaders()),
        axios.get(`${API_BASE}/statistics/comparison?metric=revenue`, getHeaders())
      ]);

      setOverview(overviewRes.data);
      setCategoryStats(categoryRes.data.data || []);
      setOrderStats(orderRes.data.data || []);
      setRevenueStats(revenueRes.data.data || []);
      setTopDishes(topDishesRes.data.data || []);
      setComparison(comparisonRes.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedPeriod);
  }, [selectedPeriod]);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Helper function to format date
  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const { day, month, year } = dateObj;
    return format(new Date(year, month - 1, day), 'MMM dd');
  };

  // Prepare data for ChartHorizontalBar (Revenue Chart)
  const prepareRevenueChartData = () => {
    if (!revenueStats || revenueStats.length === 0) {
      return { labels: [], values: [], min: 0, max: 100 };
    }

    const labels = revenueStats.map(item => formatDate(item._id));
    const values = revenueStats.map(item => item.value || 0);
    const max = Math.max(...values, 100);
    const min = 0;

    return { labels, values, min, max };
  };

  // Prepare data for ChartDoughnut (Category Chart)
  const prepareCategoryChartData = () => {
    if (!categoryStats || categoryStats.length === 0) {
      return [];
    }
    return categoryStats.map(item => ({
      category: item.category || 'Unknown',
      totalOrders: item.totalQuantity || 0
    }));
  };

  // Prepare data for ChartPie (Order Type Chart)
  const prepareOrderTypeChartData = () => {
    if (!orderStats || orderStats.length === 0) {
      return [];
    }
    return orderStats.map(item => ({
      orderType: item.category || 'Unknown',
      totalOrders: item.count || 0
    }));
  };

  // Period options
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  // Loading state
  if (loading && !overview) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <Alert.Heading>Error Loading Dashboard</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={() => fetchDashboardData(selectedPeriod)}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />

      {/* Header Section */}
      <div className="page-title-container mb-3">
        <Row className="align-items-center">
          <Col md="7">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md="5" className="d-flex justify-content-end align-items-center">
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary d-flex align-items-center" size="sm">
                <CsLineIcons icon="calendar" className="me-2" />
                {periodOptions.find(p => p.value === selectedPeriod)?.label}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {periodOptions.map((period) => (
                  <Dropdown.Item
                    key={period.value}
                    active={selectedPeriod === period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                  >
                    {period.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      </div>

      {/* Key Metrics Cards */}
      <Row className="mb-4">
        <Col xl="3" md="6" className="mb-3">
          <Card className="sh-13 hover-scale-up cursor-pointer">
            <Card.Body className="h-100 d-flex flex-column justify-content-between">
              <div className="h-100 d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted text-small mb-1">Total Revenue</div>
                  <div className="text-primary cta-4">{formatCurrency(overview?.summary?.totalRevenue)}</div>
                  {comparison && (
                    <div className="d-flex align-items-center">
                      <CsLineIcons
                        icon={comparison.trend === 'up' ? 'arrow-top' : comparison.trend === 'down' ? 'arrow-bottom' : 'minus'}
                        className={`me-1 ${comparison.trend === 'up' ? 'text-success' : comparison.trend === 'down' ? 'text-danger' : 'text-muted'}`}
                        size="14"
                      />
                      <span className={`text-small ${comparison.trend === 'up' ? 'text-success' : comparison.trend === 'down' ? 'text-danger' : 'text-muted'}`}>
                        {Math.abs(comparison.change)}% vs last period
                      </span>
                    </div>
                  )}
                </div>
                <div className="sh-5 sw-5 bg-gradient-light rounded-xl d-flex justify-content-center align-items-center">
                  <CsLineIcons icon="money" className="text-white" />
                </div>
              </div>

            </Card.Body>
          </Card>
        </Col>

        <Col xl="3" md="6" className="mb-3">
          <Card className="sh-13 hover-scale-up cursor-pointer">
            <Card.Body className="h-100 d-flex flex-column justify-content-between">
              <div className="h-100 d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted text-small mb-1">Total Orders</div>
                  <div className="text-primary cta-4">{overview?.summary?.totalOrders || 0}</div>
                  <div className="text-small text-muted">
                    Avg: {formatCurrency(overview?.summary?.avgOrderValue)}
                  </div>
                </div>
                <div className="sh-5 sw-5 bg-gradient-light rounded-xl d-flex justify-content-center align-items-center">
                  <CsLineIcons icon="handbag" className="text-white" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl="3" md="6" className="mb-3">
          <Card className="sh-13 hover-scale-up cursor-pointer">
            <Card.Body className="h-100 d-flex flex-column justify-content-between">
              <div className="h-100 d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted text-small mb-1">Discounts Given</div>
                  <div className="text-danger cta-4">{formatCurrency(overview?.summary?.totalDiscount)}</div>
                  <div className="text-small text-muted">
                    Wave Off: {formatCurrency(overview?.summary?.totalWaveOff)}
                  </div>
                </div>
                <div className="sh-5 sw-5 bg-gradient-light rounded-xl d-flex justify-content-center align-items-center">
                  <CsLineIcons icon="tag" className="text-white" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl="3" md="6" className="mb-3">
          <Card className="sh-13 hover-scale-up cursor-pointer">
            <Card.Body className="h-100 d-flex flex-column justify-content-between">
              <div className="h-100 
              d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted text-small mb-1">Average Order</div>
                  <div className="text-primary cta-4">{formatCurrency(overview?.summary?.avgOrderValue)}</div>
                  <div className="text-small text-muted">
                    Per order value
                  </div>
                </div>
                <div className="sh-5 sw-5 bg-gradient-light rounded-xl d-flex justify-content-center align-items-center">
                  <CsLineIcons icon="trend-up" className="text-white" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        <Col lg="4">
          <h2 className="small-title">Category Performance</h2>
          <Card className="mb-5 sh-40">
            <Card.Body style={{ height: 'inherit' }}>
              {categoryStats.length > 0 ? (
                <ChartDoughnut orderCategoryWise={prepareCategoryChartData()} />
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <span className="text-muted">No data available</span>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg="4">
          <h2 className="small-title">Order Types</h2>
          <Card className="mb-5 sh-40">
            <Card.Body style={{ height: 'inherit' }}>
              {orderStats.length > 0 ? (
                <ChartPie orderTypeWise={prepareOrderTypeChartData()} />
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <span className="text-muted">No data available</span>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg="4">
          <h2 className="small-title">Revenue Trend</h2>
          <Card className="mb-5 sh-40">
            <Card.Body style={{ height: 'inherit' }}>
              {revenueStats.length > 0 ? (
                <ChartHorizontalBar revenueSummary={prepareRevenueChartData()} />
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <span className="text-muted">No data available</span>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payment Methods & Top Dishes */}
      <Row>
        <Col lg="6" className="mb-5">
          <div className="d-flex justify-content-between mb-2">
            <h2 className="small-title">Payment Methods</h2>
          </div>
          <Card>
            <Card.Body>
              {overview?.paymentMethods && overview.paymentMethods.length > 0 ? (
                <div className="mb-n2">
                  {overview.paymentMethods.map((payment, index) => (
                    <div key={index} className="border-bottom pb-3 mb-3">
                      <Row className="g-0 align-items-center">
                        <Col xs="6">
                          <div className="d-flex align-items-center">
                            <div className="sw-3 sh-3 me-3 rounded-xl d-flex justify-content-center align-items-center bg-gradient-light">
                              <CsLineIcons
                                icon={payment._id === 'Cash' ? 'money' : payment._id === 'Card' ? 'credit-card' : 'mobile'}
                                size="17"
                                className="text-white"
                              />
                            </div>
                            <div>
                              <div className="font-weight-bold">{payment._id || 'Unknown'}</div>
                              <div className="text-muted text-small">{payment.count} orders</div>
                            </div>
                          </div>
                        </Col>
                        <Col xs="6" className="text-end">
                          <div className="text-primary font-weight-bold">{formatCurrency(payment.amount)}</div>
                          <div className="text-muted text-small">
                            {overview.summary?.totalRevenue > 0
                              ? `${((payment.amount / overview.summary.totalRevenue) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-5">No payment data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg="6" className="mb-5">
          <div className="d-flex justify-content-between mb-2">
            <h2 className="small-title">Top Selling Dishes</h2>
            <Button
              variant="background-alternate"
              size="xs"
              className="btn-icon btn-icon-end p-0 text-small"
            >
              <span className="align-bottom">View All</span>
              <CsLineIcons icon="chevron-right" className="align-middle" size="12" />
            </Button>
          </div>
          <Card>
            <Card.Body>
              {topDishes && topDishes.length > 0 ? (
                <div className="mb-n2">
                  {topDishes.slice(0, 8).map((dish, index) => (
                    <Card key={index} className="mb-2 sh-11 sh-md-8 hover-scale-up cursor-pointer">
                      <Card.Body className="pt-0 pb-0 h-100">
                        <Row className="g-0 h-100 align-content-center">
                          <Col xs="1" className="d-flex align-items-center">
                            <div className={`badge rounded-pill ${index < 3 ? 'bg-primary' : 'bg-muted'}`}>
                              {index + 1}
                            </div>
                          </Col>
                          <Col xs="5" className="d-flex align-items-center mb-2 mb-md-0 ps-3">
                            <div>
                              <div className="font-weight-bold text-truncate">{dish.dishName}</div>
                              <div className="text-muted text-small">{dish.category || 'N/A'}</div>
                            </div>
                          </Col>
                          <Col xs="3" className="d-flex align-items-center justify-content-center">
                            <Badge bg={dish.isSpecial ? 'primary' : 'outline-secondary'} className="me-1">
                              {dish.isSpecial ? '⭐ Special' : dish.mealType || 'Regular'}
                            </Badge>
                          </Col>
                          <Col xs="3" className="d-flex align-items-center justify-content-end">
                            <div className="text-end">
                              <div className="font-weight-bold text-primary">{dish.totalQuantity}</div>
                              <div className="text-muted text-small">{formatCurrency(dish.totalRevenue)}</div>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-5">No dishes data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Types Summary */}
      <Row>
        <Col lg="12" className="mb-5">
          <h2 className="small-title">Order Type Summary</h2>
          <Card>
            <Card.Body>
              <Row>
                {overview?.orderTypes && overview.orderTypes.length > 0 ? (
                  overview.orderTypes.map((type, index) => (
                    <Col md="4" key={index} className="mb-3">
                      <div className="border rounded-md p-3 h-100">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="mb-1">{type._id || 'Unknown'}</h5>
                            <div className="text-muted text-small">Total Orders</div>
                          </div>
                          <div className="sh-5 sw-5 bg-gradient-light rounded-xl d-flex justify-content-center align-items-center">
                            <CsLineIcons
                              icon={type._id === 'Dine In' ? 'shop' : type._id === 'Takeaway' ? 'handbag' : 'cart'}
                              className="text-white"
                            />
                          </div>
                        </div>
                        <div className="text-primary h3 mb-2">{type.count}</div>
                        <div className="d-flex justify-content-between text-small">
                          <span className="text-muted">Revenue:</span>
                          <span className="font-weight-bold">{formatCurrency(type.revenue)}</span>
                        </div>
                      </div>
                    </Col>
                  ))
                ) : (
                  <Col xs="12" className="text-center text-muted py-5">
                    No order type data available
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Statistics;
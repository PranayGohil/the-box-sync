import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Dropdown, Badge, Spinner, Alert } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ChartHorizontal from './ChartBar';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Restaurant Dashboard';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboard' },
  ];

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Data states
  const [overview, setOverview] = useState(null);
  const [orderStats, setOrderStats] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [comparison, setComparison] = useState(null);

  // API configuration
  const API_BASE = process.env.REACT_APP_API;
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Fetch dashboard data
  const fetchDashboardData = async (period = 'today') => {
    setLoading(true);
    setError(null);

    try {
      const [overviewRes, orderRes, revenueRes, topDishesRes, comparisonRes] = await Promise.all([
        axios.get(`${API_BASE}/statistics/overview?period=${period}`, getHeaders()),
        axios.get(`${API_BASE}/statistics/orders?period=${period}&group_by=type`, getHeaders()),
        axios.get(`${API_BASE}/statistics/revenue?period=week&group_by=day`, getHeaders()),
        axios.get(`${API_BASE}/statistics/dishes/top?period=${period}&limit=10`, getHeaders()),
        axios.get(`${API_BASE}/statistics/comparison?metric=revenue`, getHeaders())
      ]);

      setOverview(overviewRes.data);
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

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const { day, month, year } = dateObj;
    return format(new Date(year, month - 1, day), 'EEE');
  };

  // Prepare data for ChartHorizontal
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

  // Get order count by type
  const getOrderCountByType = (type) => {
    const orderType = orderStats.find(
      item => item.category?.toLowerCase() === type.toLowerCase()
    );
    return orderType?.count || 0;
  };

  // Get total orders
  const getTotalOrders = () => {
    return orderStats.reduce((sum, item) => sum + (item.count || 0), 0);
  };

  // Period options
  const periodOptions = [
    { value: 'today', label: "Today's" },
    { value: 'yesterday', label: "Yesterday's" },
    { value: 'week', label: "This Week's" },
    { value: 'month', label: "This Month's" }
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

      {/* Title and Top Buttons Start */}
      <div className="page-title-container">
        <Row>
          <Col md="7">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md="5" className="d-flex justify-content-end align-items-center">
            {/* Period Selector */}
            <Dropdown className="d-inline-block">
              <Dropdown.Toggle
                variant="outline-primary"
                size="sm"
                className="d-flex align-items-center justify-content-center"
              >
                <CsLineIcons icon="calendar" className="me-2" />
                {periodOptions.find(p => p.value === selectedPeriod)?.label || 'Today'}
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
      {/* Title and Top Buttons End */}

      <Row>
        <Col lg="6">
          {/* Stats Start */}
          <div className="d-flex align-items-center mb-2">
            <h2 className="small-title mb-0">
              {periodOptions.find(p => p.value === selectedPeriod)?.label || 'Today'} Stats
            </h2>
            {comparison && selectedPeriod === 'today' && (
              <div className="ms-3 d-flex align-items-center">
                <CsLineIcons
                  icon={comparison.trend === 'up' ? 'arrow-top' : comparison.trend === 'down' ? 'arrow-bottom' : 'minus'}
                  className={`me-1 mb-3 ${comparison.trend === 'up' ? 'text-success' : comparison.trend === 'down' ? 'text-danger' : 'text-muted'}`}
                  size="15px"
                />
                <span className={`mb-3 text-small ${comparison.trend === 'up' ? 'text-success' : comparison.trend === 'down' ? 'text-danger' : 'text-muted'}`}>
                  {Math.abs(comparison.change)}%
                </span>
              </div>
            )}
          </div>

          <div className="mb-5">
            <Row className="g-2">
              {/* Total Orders Card */}
              <Col sm="6">
                <Card className="sh-11 hover-scale-up cursor-pointer">
                  <Card.Body className="h-100 py-3 align-items-center">
                    <Row className="g-0 h-100 align-items-center">
                      <Col xs="auto" className="pe-3">
                        <div className="bg-gradient-light sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                          <CsLineIcons icon="file-chart" className="text-white" />
                        </div>
                      </Col>
                      <Col>
                        <Row className="gx-2 d-flex align-content-center">
                          <Col xs="12" className="col-12 d-flex">
                            <div className="d-flex align-items-center lh-1-25" style={{ fontSize: '14px' }}>Total Orders</div>
                          </Col>
                          <Col xl="auto" className="col-12">
                            <div className="cta-2 text-primary" style={{ fontSize: '14px' }}>{getTotalOrders()}</div>
                          </Col>
                          <Col xs="12" className="col-12">
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                              Revenue: {formatCurrency(overview?.summary?.totalRevenue)}
                            </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              {/* Dine-In Card */}
              <Col sm="6">
                <Card className="sh-11 hover-scale-up cursor-pointer">
                  <Card.Body className="h-100 py-3 align-items-center">
                    <Row className="g-0 h-100 align-items-center">
                      <Col xs="auto" className="pe-3">
                        <div className="bg-gradient-light sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                          <CsLineIcons icon="shop" className="text-white" />
                        </div>
                      </Col>
                      <Col>
                        <Row className="gx-2 d-flex align-content-center">
                          <Col xs="12" className="col-12 d-flex">
                            <div className="d-flex align-items-center lh-1-25" style={{ fontSize: '14px' }}>Dine-In</div>
                          </Col>
                          <Col xl="auto" className="col-12">
                            <div className="cta-2 text-primary" style={{ fontSize: '14px' }}>
                              {getOrderCountByType('Dine-In') || getOrderCountByType('Dine In')}
                            </div>
                          </Col>
                          <Col xs="12" className="col-12">
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                              {orderStats.find(item =>
                                item.category?.toLowerCase().includes('dine')
                              ) ? formatCurrency(orderStats.find(item =>
                                item.category?.toLowerCase().includes('dine')
                              ).totalRevenue) : '₹0'}
                            </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              {/* Takeaway Card */}
              <Col sm="6">
                <Card className="sh-11 hover-scale-up cursor-pointer">
                  <Card.Body className="h-100 py-3 align-items-center">
                    <Row className="g-0 h-100 align-items-center">
                      <Col xs="auto" className="pe-3">
                        <div className="bg-gradient-light sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                          <CsLineIcons icon="handbag" className="text-white" />
                        </div>
                      </Col>
                      <Col>
                        <Row className="gx-2 d-flex align-content-center">
                          <Col xs="12" className="col-12 d-flex">
                            <div className="d-flex align-items-center lh-1-25" style={{ fontSize: '14px' }}>Takeaway</div>
                          </Col>
                          <Col xl="auto" className="col-12">
                            <div className="cta-2 text-primary" style={{ fontSize: '14px' }}>
                              {getOrderCountByType('Takeaway') || getOrderCountByType('Take Away')}
                            </div>
                          </Col>
                          <Col xs="12" className="col-12">
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                              {orderStats.find(item =>
                                item.category?.toLowerCase().includes('take')
                              ) ? formatCurrency(orderStats.find(item =>
                                item.category?.toLowerCase().includes('take')
                              ).totalRevenue) : '₹0'}
                            </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              {/* Delivery Card */}
              <Col sm="6">
                <Card className="sh-11 hover-scale-up cursor-pointer">
                  <Card.Body className="h-100 py-3 align-items-center">
                    <Row className="g-0 h-100 align-items-center">
                      <Col xs="auto" className="pe-3">
                        <div className="bg-gradient-light sh-5 sw-5 rounded-xl d-flex justify-content-center align-items-center">
                          <CsLineIcons icon="cart" className="text-white" />
                        </div>
                      </Col>
                      <Col>
                        <Row className="gx-2 d-flex align-content-center">
                          <Col xs="12" className="col-12 d-flex">
                            <div className="d-flex align-items-center lh-1-25" style={{ fontSize: '14px' }}>Delivery</div>
                          </Col>
                          <Col xl="auto" className="col-12">
                            <div className="cta-2 text-primary" style={{ fontSize: '14px' }}>
                              {getOrderCountByType('Delivery')}
                            </div>
                          </Col>
                          <Col xs="12" className="col-12">
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                              {orderStats.find(item =>
                                item.category?.toLowerCase() === 'delivery'
                              ) ? formatCurrency(orderStats.find(item =>
                                item.category?.toLowerCase() === 'delivery'
                              ).totalRevenue) : '₹0'}
                            </div>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
          {/* Stats End */}

          {/* Revenue Insights Cards */}
          <h2 className="small-title">Quick Insights</h2>
          <div className="mb-5">
            <Row className="g-2">
              <Col sm="6">
                <Card className="sh-11">
                  <Card.Body className="h-100 py-3">
                    <div className="d-flex flex-column justify-content-between h-100">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="text-muted" style={{ fontSize: '14px' }}>Average Order Value</div>
                        <CsLineIcons icon="trending-up" className="text-primary" size="17" />
                      </div>
                      <div className="cta-3 text-primary mt-2" style={{ fontSize: '12px' }}>
                        {formatCurrency(overview?.summary?.avgOrderValue)}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm="6">
                <Card className="sh-11">
                  <Card.Body className="h-100 py-3">
                    <div className="d-flex flex-column justify-content-between h-100">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="text-muted" style={{ fontSize: '14px' }}>Total Discount</div>
                        <CsLineIcons icon="tag" className="text-danger" size="17" />
                      </div>
                      <div className="cta-3 text-danger mt-2" style={{ fontSize: '12px' }}>
                        {formatCurrency(overview?.summary?.totalDiscount)}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Revenue Chart Start */}
          <h2 className="small-title">Last Week Revenue</h2>
          <Card className="mb-5 sh-40">
            <Card.Body>
              {revenueStats.length > 0 ? (
                <ChartHorizontal weeklyRevenue={prepareRevenueChartData()} />
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <span className="text-muted">No revenue data available</span>
                </div>
              )}
            </Card.Body>
          </Card>
          {/* Revenue Chart End */}
        </Col>

        <Col lg="6" className="mb-5">
          {/* Top Selling Dishes Start */}
          <div className="d-flex justify-content-between mb-2">
            <h2 className="small-title">Top Selling Dish</h2>
            <Button
              variant="background-alternate"
              size="xs"
              className="btn-icon btn-icon-end p-0 text-small"
              as={NavLink}
              to="/dashboards/statistics"
            >
              <span className="align-bottom" style={{ fontSize: '14px' }}>View More</span>
              <CsLineIcons icon="chevron-right" className="align-middle" size="12" />
            </Button>
          </div>

          {topDishes && topDishes.length > 0 ? (
            <div className="mb-n2">
              {topDishes.map((dish, idx) => (
                <Card className="mb-2 sh-10 sh-md-8 hover-scale-up cursor-pointer" key={idx}>
                  <Card.Body className="pt-0 pb-0 h-100">
                    <Row className="g-0 h-100 align-content-center">
                      <Col xs="1" className="d-flex align-items-center">
                        <div className={`badge rounded-pill ${idx < 3 ? 'bg-primary' : 'bg-muted'}`}>
                          {idx + 1}
                        </div>
                      </Col>
                      <Col md="5" className="d-flex align-items-center mb-2 mb-md-0 ps-2">
                        <div>
                          <div className="body-link text-truncate font-weight-bold" style={{ fontSize: '14px' }}>
                            {dish.dishName}
                          </div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                            {dish.category || 'N/A'}
                          </div>
                        </div>
                      </Col>
                      <Col md="3" className="d-flex align-items-center text-muted mb-1 mb-md-0">
                        <Badge bg={dish.isSpecial ? 'primary' : 'outline-secondary'} className="me-1" style={{ fontSize: '10px' }}>
                          {dish.isSpecial ? '⭐ Special' : 'Regular'}
                        </Badge>
                      </Col>
                      <Col md="3" className="d-flex flex-column align-items-end justify-content-center text-muted text-small">
                        <div className="text-primary font-weight-bold" style={{ fontSize: '14px' }}>{dish.totalQuantity} sold</div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>{formatCurrency(dish.totalRevenue)}</div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="sh-40">
              <Card.Body className="d-flex justify-content-center align-items-center">
                <span className="text-muted">No data available</span>
              </Card.Body>
            </Card>
          )}
          {/* Top Selling Dishes End */}

          {/* Payment Methods Summary */}
          <div className="mt-4">
            <h2 className="small-title">Payment Methods</h2>
            <Card>
              <Card.Body>
                {overview?.paymentMethods && overview.paymentMethods.length > 0 ? (
                  <Row className="g-2">
                    {overview.paymentMethods.map((payment, index) => (
                      <Col xs="12" key={index}>
                        <div className="border-bottom pb-3 mb-2">
                          <Row className="g-0 align-items-center">
                            <Col xs="7">
                              <div className="d-flex align-items-center">
                                <div className="sw-3 sh-3 me-3 rounded-xl d-flex justify-content-center align-items-center bg-gradient-light" style={{ fontSize: '14px' }}>
                                  <CsLineIcons
                                    icon={payment._id === 'Cash' ? 'wallet' : payment._id === 'Card' ? 'credit-card' : 'mobile'}
                                    size="17"
                                    className="text-primary"
                                  />
                                </div>
                                <div>
                                  <div className="font-weight-bold" style={{ fontSize: '12px' }}>{payment._id || 'Unknown'}</div>
                                  <div className="text-muted" style={{ fontSize: '12px' }}>{payment.count} transactions</div>
                                </div>
                              </div>
                            </Col>
                            <Col xs="5" className="text-end">
                              <div className="text-primary font-weight-bold" style={{ fontSize: '14px' }}>{formatCurrency(payment.amount)}</div>
                              <div className="text-muted" style={{ fontSize: '12px' }}>
                                {overview.summary?.totalRevenue > 0
                                  ? `${((payment.amount / overview.summary.totalRevenue) * 100).toFixed(1)}%`
                                  : '0%'
                                }
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="text-center text-muted py-3">No data available</div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
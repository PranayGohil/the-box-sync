import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Dropdown, Badge, Spinner, Alert } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { AuthContext } from 'contexts/AuthContext';
import ChartDoughnut from './components/ChartDoughnut';
import ChartPie from './components/ChartPie';
import ChartHorizontal from './components/ChartBar';

const CustomToggle = React.forwardRef(({ children, onClick, style }, ref) => (
  <div
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="d-flex align-items-center justify-content-center px-3 rounded-pill shadow-sm bg-white cursor-pointer transition-all hover-scale-up"
    style={{ ...style, height: '34px', minWidth: '130px', fontSize: '0.8rem', fontWeight: '700', color: '#23b3f4', border: '1.5px solid #23b3f4' }}
  >
    {children}
  </div>
));

const Statistics = () => {
  const { activePlans } = React.useContext(AuthContext);
  const title = 'Analytics & Insights';
  const description = 'Deep dive into restaurant performance';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Overview' },
  ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const [overview, setOverview] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [comparison, setComparison] = useState(null);

  const API_BASE = process.env.REACT_APP_API;
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const fetchDashboardData = async (period = 'today') => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, categoryRes, orderRes, revenueRes, topDishesRes, comparisonRes] = await Promise.all([
        axios.get(`${API_BASE}/statistics/overview?period=${period}`, getHeaders()),
        axios.get(`${API_BASE}/statistics/categories?period=${period}`, getHeaders()),
        axios.get(`${API_BASE}/statistics/orders?period=${period}&group_by=type`, getHeaders()),
        axios.get(`${API_BASE}/statistics/revenue?period=${period === 'today' ? 'week' : period}&group_by=day`, getHeaders()),
        axios.get(`${API_BASE}/statistics/dishes/top?period=${period}&limit=12`, getHeaders()),
        axios.get(`${API_BASE}/statistics/comparison?metric=revenue`, getHeaders()),
      ]);

      setOverview(overviewRes.data);
      setCategoryStats(categoryRes.data.data || []);
      setOrderStats(orderRes.data.data || []);
      setRevenueStats(revenueRes.data.data || []);
      setTopDishes(topDishesRes.data.data || []);
      setComparison(comparisonRes.data);
    } catch (err) {
      console.error('Error fetching statistics data:', err);
      setError(err.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedPeriod);
  }, [selectedPeriod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const { day, month, year } = dateObj;
    return format(new Date(year, month - 1, day), 'EEE');
  };

  const prepareRevenueChartData = () => {
    if (!revenueStats || revenueStats.length === 0) {
      return { labels: [], values: [], min: 0, max: 100 };
    }
    const labels = revenueStats.map((item) => formatDate(item._id));
    const values = revenueStats.map((item) => item.value || 0);
    const max = Math.max(...values, 100);
    return { labels, values, min: 0, max };
  };

  const prepareCategoryChartData = () => {
    if (!categoryStats || categoryStats.length === 0) return [];
    return categoryStats.map((item) => ({
      category: item.category || 'Unknown',
      totalOrders: item.totalQuantity || 0,
    }));
  };

  const prepareOrderTypeChartData = () => {
    if (!orderStats || orderStats.length === 0) return [];
    return orderStats.map((item) => ({
      orderType: item.category || 'Unknown',
      totalOrders: item.count || 0,
    }));
  };

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  if (loading && !overview) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ width: '3rem', height: '3rem', color: '#23b3f4' }} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3 statistics-interactive-card border-0">
        <Alert.Heading className="fw-bold">
          <CsLineIcons icon="error-hexagon" className="me-2" />
          Error
        </Alert.Heading>
        <p>{error}</p>
        <Button variant="danger" className="statistics-custom-btn-outline mt-2" onClick={() => fetchDashboardData(selectedPeriod)}>
          Retry
        </Button>
      </Alert>
    );
  }

  const brandColor = '#23b3f4';
  const brandBg = 'rgba(35, 179, 244, 0.08)';

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="auto" className="d-flex justify-content-end gap-2 mt-3 mt-md-0">
              <Dropdown className="d-inline-block">
                <Dropdown.Toggle as={CustomToggle}>
                  <CsLineIcons icon="calendar" className="me-2" size="13" />
                  <span>{periodOptions.find((p) => p.value === selectedPeriod)?.label}</span>
                  <CsLineIcons icon="chevron-down" className="ms-2" size="10" />
                </Dropdown.Toggle>
                <Dropdown.Menu className="statistics-interactive-card border-0 mt-2 shadow-lg" style={{ borderRadius: '1rem', padding: '0.5rem' }}>
                  {periodOptions.map((period) => {
                    const isActive = period.value === selectedPeriod;
                    return (
                      <Dropdown.Item
                        key={period.value}
                        onClick={() => setSelectedPeriod(period.value)}
                        active={isActive}
                        className={`d-flex align-items-center justify-content-between my-1 px-3 py-2 ${isActive ? 'fw-bold text-white' : 'text-dark'}`}
                        style={{
                          backgroundColor: isActive ? brandColor : 'transparent',
                          color: isActive ? '#fff' : '#495057',
                          borderRadius: '0.75rem',
                          fontSize: '0.8rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span className={isActive ? 'text-white' : ''}>{period.label}</span>
                        {isActive && <CsLineIcons icon="check" size="10" className="text-white ms-2" />}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </div>

        <Row className="g-3 mb-4">
          <Col xl="3" md="6">
            <Card className="statistics-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
              <Card.Body className="p-4 statistics-stat-card-inner">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="statistics-stat-label mb-2">Total Revenue</div>
                    <div className="statistics-stat-value text-primary">{formatCurrency(overview?.summary?.totalRevenue)}</div>
                    {comparison && (
                      <div className={`mt-2 fw-bold ${comparison.trend === 'up' ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.7rem' }}>
                        {comparison.trend === 'up' ? '↑' : '↓'} {Math.abs(comparison.change)}% vs last period
                      </div>
                    )}
                  </div>
                  <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: brandBg }}>
                    <CsLineIcons icon="coin" size="24" style={{ color: brandColor }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl="3" md="6">
            <Card className="statistics-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
              <Card.Body className="p-4 statistics-stat-card-inner">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="statistics-stat-label mb-2">Total Orders</div>
                    <div className="statistics-stat-value">{overview?.summary?.totalOrders || 0}</div>
                    <div className="text-muted fw-bold mt-2" style={{ fontSize: '0.7rem' }}>Avg: {formatCurrency(overview?.summary?.avgOrderValue)}</div>
                  </div>
                  <div
                    className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <CsLineIcons icon="cart" size="24" style={{ color: '#10b981' }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl="3" md="6">
            <Card className="statistics-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #f59e0b' }}>
              <Card.Body className="p-4 statistics-stat-card-inner">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="statistics-stat-label mb-2">Total Discounts</div>
                    <div className="statistics-stat-value text-warning">{formatCurrency(overview?.summary?.totalDiscount)}</div>
                    <div className="text-muted fw-bold mt-2" style={{ fontSize: '0.7rem' }}>Wave Off: {formatCurrency(overview?.summary?.totalWaveOff)}</div>
                  </div>
                  <div
                    className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                  >
                    <CsLineIcons icon="tag" size="24" style={{ color: '#f59e0b' }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl="3" md="6">
            <Card className="statistics-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #6366f1' }}>
              <Card.Body className="p-4 statistics-stat-card-inner">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="statistics-stat-label mb-2">Avg Order Value</div>
                    <div className="statistics-stat-value">{formatCurrency(overview?.summary?.avgOrderValue)}</div>
                    <div className="text-muted fw-bold mt-2" style={{ fontSize: '0.7rem' }}>Daily performance</div>
                  </div>
                  <div
                    className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                  >
                    <CsLineIcons icon="trend-up" size="24" style={{ color: '#6366f1' }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3 mb-4">
          <Col lg="4">
            <Card className="statistics-interactive-card border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <div className="statistics-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Category Sales
                  </h2>
                  <CsLineIcons icon="layout-5" size="18" style={{ color: brandColor }} />
                </div>
                <div className="statistics-chart-container-expandable">
                  {categoryStats.length > 0 ? (
                    <ChartDoughnut orderCategoryWise={prepareCategoryChartData()} />
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">No data available</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg="4">
            <Card className="statistics-interactive-card border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <div className="statistics-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Order Types
                  </h2>
                  <CsLineIcons icon="main-course" size="18" style={{ color: brandColor }} />
                </div>
                <div className="statistics-chart-container-expandable">
                  {orderStats.length > 0 ? (
                    <ChartPie orderTypeWise={prepareOrderTypeChartData()} />
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">No data available</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg="4">
            <Card className="statistics-interactive-card border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <div className="statistics-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Revenue Trend
                  </h2>
                  <CsLineIcons icon="chart-4" size="18" style={{ color: brandColor }} />
                </div>
                <div className="statistics-chart-container-responsive">
                  {revenueStats.length > 0 ? (
                    <ChartHorizontal revenueSummary={prepareRevenueChartData()} />
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">No data available</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3 mb-4">
          <Col lg="4">
            <Card className="statistics-interactive-card border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <div className="statistics-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Payment Analytics
                  </h2>
                  <CsLineIcons icon="credit-card" size="18" style={{ color: brandColor }} />
                </div>
                <div className="d-flex flex-column gap-3 mt-3">
                  {overview?.paymentMethods?.length > 0 ? (
                    overview.paymentMethods.map((pay, idx) => {
                      const percentage = overview.summary?.totalRevenue > 0 ? ((pay.amount / overview.summary.totalRevenue) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={idx}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center overflow-hidden">
                              <div
                                className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3"
                                style={{ backgroundColor: brandBg }}
                              >
                                <CsLineIcons icon={pay._id === 'Cash' ? 'money' : 'credit-card'} size="18" style={{ color: brandColor }} />
                              </div>
                              <div className="overflow-hidden">
                                <div className="fw-bold text-dark mb-0 smaller text-truncate">{pay._id || 'Unknown'}</div>
                                <div className="text-muted smaller fw-bold">{pay.count} transactions</div>
                              </div>
                            </div>
                            <div className="text-end ms-2">
                              <div className="fw-bold text-primary smaller mb-0">{formatCurrency(pay.amount)}</div>
                              <div className="text-muted smaller fw-bold">{percentage}% share</div>
                            </div>
                          </div>
                          {idx !== overview.paymentMethods.length - 1 && <hr className="my-2 opacity-10" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-muted text-center py-5">No data available</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg="4">
            <Card className="statistics-interactive-card border-0 shadow-sm h-100">
              <Card.Body className="p-0">
                <div className="p-4 statistics-card-title-container" style={{ marginBottom: '0' }}>
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Dish Performance
                  </h2>
                  <CsLineIcons icon="burger" size="18" style={{ color: brandColor }} />
                </div>
                <div className="d-flex flex-column">
                  {topDishes.length > 0 ? (
                    topDishes.slice(0, 8).map((dish, idx) => {
                      const highlightClass = idx < 3 ? `statistics-dish-row-highlight-${idx}` : '';
                      return (
                        <div
                          key={idx}
                          className={`px-4 py-3 d-flex align-items-center justify-content-between ${highlightClass}`}
                          style={{ transition: 'all 0.3s' }}
                        >
                          <div className="d-flex align-items-center overflow-hidden">
                            <div
                              className="sw-4 sh-4 rounded-circle d-flex justify-content-center align-items-center fw-bold me-3 text-muted smaller"
                              style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}
                            >
                              {idx + 1}
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-truncate fw-bold small mb-0">{dish.dishName}</div>
                              <div className="text-muted smaller fw-bold text-truncate" style={{ fontSize: '0.65rem' }}>
                                {dish.category || 'Main Course'}
                              </div>
                            </div>
                          </div>
                          <div className="text-end ms-2">
                            <div className="fw-bold small text-primary">{dish.totalQuantity} sold</div>
                            <div className="text-muted smaller fw-bold" style={{ fontSize: '0.65rem' }}>
                              {formatCurrency(dish.totalRevenue)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-muted text-center py-5">No data available</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg="4">
            <Card className="statistics-interactive-card border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <div className="statistics-card-title-container">
                  <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>
                    Service Analysis
                  </h2>
                  <CsLineIcons icon="destination" size="18" style={{ color: brandColor }} />
                </div>
                <div className="d-flex flex-column gap-3 mt-3">
                  {overview?.orderTypes && overview.orderTypes.length > 0 ? (
                    overview.orderTypes.map((type, index) => (
                      <div key={index}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center overflow-hidden">
                            <div
                              className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3"
                              style={{ backgroundColor: brandBg }}
                            >
                              <CsLineIcons
                                icon={type._id === 'Dine In' ? 'main-course' : type._id === 'Takeaway' ? 'burger' : 'destination'}
                                size="18"
                                style={{ color: brandColor }}
                              />
                            </div>
                            <div className="overflow-hidden">
                              <div className="fw-bold text-dark mb-0 smaller text-truncate">{type._id || 'Unknown'}</div>
                              <div className="text-muted smaller fw-bold">{type.count} orders</div>
                            </div>
                          </div>
                          <div className="text-end ms-2">
                            <div className="fw-bold text-primary smaller mb-0">{formatCurrency(type.revenue)}</div>
                            <div className="text-muted smaller fw-bold">Revenue</div>
                          </div>
                        </div>
                        {index !== overview.orderTypes.length - 1 && <hr className="my-2 opacity-10" />}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted text-center py-5">No data available</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Statistics;

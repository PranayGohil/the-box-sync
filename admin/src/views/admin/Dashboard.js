import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Dropdown, Badge, Spinner, Alert } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ChartHorizontal from './ChartBar';



const CustomToggle = React.forwardRef(({ children, onClick, style }, ref) => (
  <div
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="d-flex align-items-center justify-content-center px-4 rounded-pill shadow-sm bg-white cursor-pointer transition-all hover-scale-up"
    style={{ ...style, height: '42px', minWidth: '170px', fontWeight: '700', color: '#23b3f4', border: '1.5px solid #23b3f4' }}
  >
    {children}
  </div>
));

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Restaurant performance and insights';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboards' },
  ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const [overview, setOverview] = useState(null);
  const [orderStats, setOrderStats] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [comparison, setComparison] = useState(null);

  const API_BASE = process.env.REACT_APP_API;
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchDashboardData = async (period = 'today') => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, orderRes, revenueRes, topDishesRes, comparisonRes] = await Promise.all([
        axios.get(`${API_BASE}/statistics/overview?period=${period}`, getHeaders()),
        axios.get(`${API_BASE}/statistics/orders?period=${period}&group_by=type`, getHeaders()),
        axios.get(`${API_BASE}/statistics/revenue?period=week&group_by=day`, getHeaders()),
        axios.get(`${API_BASE}/statistics/dishes/top?period=${period}&limit=12`, getHeaders()),
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

  const prepareRevenueChartData = () => {
    if (!revenueStats || revenueStats.length === 0) {
      return { labels: [], values: [], min: 0, max: 100 };
    }
    const labels = revenueStats.map(item => formatDate(item._id));
    const values = revenueStats.map(item => item.value || 0);
    const max = Math.max(...values, 100);
    return { labels, values, min: 0, max };
  };

  const getTotalOrders = () => orderStats.reduce((sum, item) => sum + (item.count || 0), 0);

  const periodOptions = [
    { value: 'today', label: "Today" },
    { value: 'yesterday', label: "Yesterday" },
    { value: 'week', label: "This Week" },
    { value: 'month', label: "This Month" }
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
      <Alert variant="danger" className="m-3 dashboard-interactive-card border-0">
        <Alert.Heading className="fw-bold"><CsLineIcons icon="error-hexagon" className="me-2" />Error</Alert.Heading>
        <p>{error}</p>
        <Button variant="danger" className="dashboard-custom-btn-outline mt-2" onClick={() => fetchDashboardData(selectedPeriod)}>Retry</Button>
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
            <Col xs="auto">
              <Dropdown className="d-inline-block">
                <Dropdown.Toggle as={CustomToggle}>
                  <CsLineIcons icon="calendar" className="me-2" size="15" />
                  <span>{periodOptions.find(p => p.value === selectedPeriod)?.label}</span>
                  <CsLineIcons icon="chevron-down" className="ms-2" size="12" />
                </Dropdown.Toggle>
                <Dropdown.Menu className="dashboard-interactive-card border-0 mt-2 shadow-lg" style={{ borderRadius: '1rem', padding: '0.5rem' }}>
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
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span className={isActive ? 'text-white' : ''}>{period.label}</span>
                        {isActive && <CsLineIcons icon="check" size="12" className="text-white ms-2" />}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </div>

      <Row className="g-4">
        {/* Main Section (9 Columns) */}
        <Col lg="9">
          {/* Today's Stats */}
          <div className="mb-4">
            <Row className="g-3">
              <Col md="4" sm="6">
                <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${brandColor}` }}>
                  <Card.Body className="p-4 dashboard-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="dashboard-stat-label mb-2">Total Orders</div>
                        <div className="dashboard-stat-value">{getTotalOrders()}</div>
                        <div className="text-muted smaller fw-bold" style={{ color: brandColor }}>
                          Rev: {formatCurrency(overview?.summary?.totalRevenue)}
                        </div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: brandBg }}>
                        <CsLineIcons icon="cart" size="24" style={{ color: brandColor }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md="4" sm="6">
                <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #06b6d4' }}>
                  <Card.Body className="p-4 dashboard-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="dashboard-stat-label mb-2">Dine-In</div>
                        <div className="dashboard-stat-value">
                          {orderStats.find(o => o.category === 'Dine In')?.count || 0}
                        </div>
                        <div className="text-muted smaller fw-bold" style={{ color: '#06b6d4' }}>
                          {formatCurrency(orderStats.find(o => o.category === 'Dine In')?.totalRevenue || 0)}
                        </div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                        <CsLineIcons icon="main-course" size="24" style={{ color: '#06b6d4' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md="4" sm="6">
                <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #f59e0b' }}>
                  <Card.Body className="p-4 dashboard-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="dashboard-stat-label mb-2">Takeaway</div>
                        <div className="dashboard-stat-value">
                          {orderStats.find(o => o.category === 'Takeaway')?.count || 0}
                        </div>
                        <div className="text-muted smaller fw-bold" style={{ color: '#f59e0b' }}>
                          {formatCurrency(orderStats.find(o => o.category === 'Takeaway')?.totalRevenue || 0)}
                        </div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                        <CsLineIcons icon="burger" size="24" style={{ color: '#f59e0b' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md="4" sm="6">
                <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #ef4444' }}>
                  <Card.Body className="p-4 dashboard-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="dashboard-stat-label mb-2">Delivery</div>
                        <div className="dashboard-stat-value">
                          {orderStats.find(o => o.category === 'Delivery')?.count || 0}
                        </div>
                        <div className="text-muted smaller fw-bold" style={{ color: '#ef4444' }}>
                          {formatCurrency(orderStats.find(o => o.category === 'Delivery')?.totalRevenue || 0)}
                        </div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        <CsLineIcons icon="destination" size="24" style={{ color: '#ef4444' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md="4" sm="6">
                <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
                  <Card.Body className="p-4 dashboard-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="dashboard-stat-label mb-2">Avg Value</div>
                        <div className="dashboard-stat-value">
                          {formatCurrency(overview?.summary?.avgOrderValue)}
                        </div>
                        <div className="text-muted smaller fw-bold" style={{ color: '#10b981' }}>Per order avg</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <CsLineIcons icon="trend-up" size="24" style={{ color: '#10b981' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md="4" sm="6">
                <Card className="dashboard-interactive-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #6366f1' }}>
                  <Card.Body className="p-4 dashboard-stat-card-inner">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="dashboard-stat-label mb-2">Discounts</div>
                        <div className="dashboard-stat-value">
                          {formatCurrency(overview?.summary?.totalDiscount)}
                        </div>
                        <div className="text-muted smaller fw-bold" style={{ color: '#6366f1' }}>Total given</div>
                      </div>
                      <div className="sw-6 sh-6 rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <CsLineIcons icon="tag" size="24" style={{ color: '#6366f1' }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Bottom Grid: Revenue (8/12) and Payments (4/12) */}
          <Row className="g-3">
            <Col lg="8">
              <Card className="dashboard-interactive-card border-0 shadow-sm h-100" style={{ borderTop: `4px solid ${brandColor}` }}>
                <Card.Body className="p-4">
                  <div className="dashboard-card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Last Week Revenue</h2>
                    <CsLineIcons icon="chart-4" size="18" style={{ color: brandColor }} />
                  </div>
                  <div style={{ height: '320px' }}>
                    <ChartHorizontal weeklyRevenue={prepareRevenueChartData()} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg="4">
              <Card className="dashboard-interactive-card border-0 shadow-sm h-100" style={{ borderTop: `4px solid ${brandColor}` }}>
                <Card.Body className="p-4">
                  <div className="dashboard-card-title-container">
                    <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Payment Methods</h2>
                    <CsLineIcons icon="credit-card" size="18" style={{ color: brandColor }} />
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {overview?.paymentMethods?.length > 0 ? (
                      (() => {
                        const totalPaymentAmount = overview.paymentMethods.reduce((acc, curr) => acc + curr.amount, 0);
                        return overview.paymentMethods.map((pay, idx) => {
                          const percentage = totalPaymentAmount > 0 ? ((pay.amount / totalPaymentAmount) * 100).toFixed(1) : '0.0';
                          return (
                            <div key={idx}>
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center overflow-hidden">
                                  <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-2" style={{ backgroundColor: brandBg }}>
                                    <CsLineIcons icon={pay._id === 'Cash' ? 'money' : 'credit-card'} size="16" style={{ color: brandColor }} />
                                  </div>
                                  <div className="overflow-hidden">
                                    <div className="fw-bold text-dark mb-0 smaller text-truncate">{pay._id}</div>
                                    <div className="text-muted smaller fw-bold">{pay.count} txns</div>
                                  </div>
                                </div>
                                <div className="text-end ms-1">
                                  <div className="fw-bold text-primary smaller mb-0">{formatCurrency(pay.amount)}</div>
                                  <div className="text-muted smaller fw-bold">{percentage}%</div>
                                </div>
                              </div>
                              {idx !== overview.paymentMethods.length - 1 && <hr className="my-2 opacity-25" />}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="text-muted text-center py-5">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Sidebar (3 Columns) */}
        <Col lg="3">
          <Card className="dashboard-interactive-card border-0 h-100 shadow-sm overflow-hidden" style={{ borderTop: `4px solid ${brandColor}` }}>
            <Card.Body className="p-0">
              <div className="p-4 dashboard-card-title-container" style={{ marginBottom: '0' }}>
                <h2 className="small-title mb-0" style={{ color: brandColor, fontWeight: '800' }}>Top Selling Dish</h2>
                <NavLink to="/statistics/menu" className="small fw-bold" style={{ color: brandColor }}>View All</NavLink>
              </div>
              <div className="d-flex flex-column">
                {topDishes.length > 0 ? (
                  topDishes.slice(0, 12).map((dish, idx) => {
                    const highlightClass = idx < 3 ? `dish-row-highlight-${idx}` : '';

                    return (
                      <div key={idx} 
                           className={`px-4 py-2 d-flex align-items-center justify-content-between ${highlightClass}`}
                           style={{ transition: 'background 0.3s ease' }}>
                        <div className="d-flex align-items-center overflow-hidden">
                          <div className="sw-4 sh-4 rounded-circle d-flex justify-content-center align-items-center fw-bold me-3 text-muted" 
                               style={{ backgroundColor: 'rgba(0,0,0,0.04)', fontSize: '11px', border: '1px solid rgba(0,0,0,0.02)' }}>
                            {idx + 1}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-truncate fw-bold small mb-0" style={{ color: '#1e293b' }}>{dish.dishName}</div>
                            <div className="text-muted smaller fw-bold" style={{ fontSize: '0.7rem' }}>{dish.category || 'Main Course'}</div>
                          </div>
                        </div>
                        <div className="text-end ms-2">
                          <div className="fw-bold small" style={{ color: brandColor }}>{dish.totalQuantity} sold</div>
                          <div className="text-muted smaller fw-bold" style={{ fontSize: '0.7rem' }}>{formatCurrency(dish.totalRevenue || 0)}</div>
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
        </Row>
      </div>
    </>
  );
};

export default Dashboard;
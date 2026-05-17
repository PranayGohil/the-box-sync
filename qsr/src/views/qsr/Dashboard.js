import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route } from 'react-router-dom';
import { Button, Row, Col, Card, Badge, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import UnifiedOrder from './order/UnifiedOrder';

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
  const title = 'Analytics Dashboard';
  const description = 'Restaurant performance and insights';
  const history = useHistory();

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboards' },
  ];

  const [activeTakeawaysAndDeliveries, setActiveTakeawaysAndDeliveries] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const fetchActiveOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/order/get-active`, {
        params: { source: 'QSR' },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setActiveTakeawaysAndDeliveries(response.data.activeTakeawaysAndDeliveries || []);
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const createNewOrder = () => {
    history.push('/order/new?mode=new');
  };

  const handleOrderClick = (order) => {
    history.push(`/order/new?orderId=${order._id}&mode=edit`);
  };

  const brandColor = '#23b3f4';

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div className="container-fluid px-3 px-lg-4 mb-5 pb-5">
        {/* Top Header Section */}
        <div className="page-title-container dashboard-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>
                {title}
              </h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-3 align-items-center">
                <Button className="custom-btn-outline d-flex align-items-center gap-2" onClick={createNewOrder}>
                  <CsLineIcons icon="plus" size="20" />
                  <span>New Order</span>
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        <Row className="g-4">
          {/* Section 1: Takeaways & Deliveries */}
          <Col xs="12" lg="6">
            <h3 className="section-title">
              <CsLineIcons icon="bag" size="22" style={{ color: '#23b3f4' }} className="me-2" />
              Takeaways & Deliveries
              <span className="ms-2 status-badge qsr-badge-active">
                {activeTakeawaysAndDeliveries.length} Active
              </span>
            </h3>

            <div className="custom-scrollbar pe-2 pt-2 pb-2" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {activeTakeawaysAndDeliveries.length === 0 ? (
                <Card className="dashboard-interactive-card border-0 py-5">
                  <Card.Body className="text-center">
                    <div className="dashboard-card-icon-wrapper mx-auto mb-3" style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                      <CsLineIcons icon="inbox" size="24" />
                    </div>
                    <p className="text-muted fw-bold mb-0">No active takeaway or delivery orders.</p>
                  </Card.Body>
                </Card>
              ) : (
                activeTakeawaysAndDeliveries.map((order) => (
                  <Card key={order._id} className="order-card mb-3 cursor-pointer" onClick={() => handleOrderClick(order)}>
                    <Card.Body className="p-3">
                      {/* Header Info */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className={`status-badge ${order.order_type === 'Takeaway' ? 'qsr-badge-active' : 'qsr-badge-delivery'}`}>
                          {order.order_type?.toUpperCase()}
                        </span>
                        <span className={`status-badge ${order.order_status === 'Paid' ? 'qsr-badge-paid' : 'qsr-badge-requested'}`}>
                          {order.order_status?.toUpperCase()}
                        </span>
                      </div>

                      {/* Title & Token */}
                      <div className="d-flex justify-content-between align-items-baseline mb-3">
                        <h5 className="fw-800 text-slate-800 mb-0" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                          {order.order_type === 'Takeaway' ? `Token #${order.token}` : order.customer_name || 'Anonymous Customer'}
                        </h5>
                        {order.order_type !== 'Takeaway' && order.token && (
                          <span className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                            #{order.token}
                          </span>
                        )}
                      </div>

                      {/* Item List */}
                      <div className="pt-2 border-top border-light-dashed">
                        <div className="d-flex flex-wrap gap-2">
                          {order.order_items.slice(0, 3).map((item, i) => (
                            <span key={i} className="item-chip">
                              {item.dish_name} <span className="text-primary ms-1" style={{ fontWeight: '900' }}>×{item.quantity}</span>
                            </span>
                          ))}
                          {order.order_items.length > 3 && (
                            <span className="item-chip bg-dark text-white border-0">
                              +{order.order_items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>
          </Col>

          {/* Section 2: Online Partners */}
          <Col xs="12" lg="6">
            <h3 className="section-title">
              <CsLineIcons icon="external-link" size="22" style={{ color: '#ef4444' }} className="me-2" />
              Online Partners
              <span className="ms-2 status-badge qsr-badge-incoming">
                1 Incoming
              </span>
            </h3>

            <div className="custom-scrollbar pe-2 pt-2 pb-2" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <Card className="order-card incoming-pulse-card mb-3 cursor-pointer">
                <Card.Body className="p-3">
                  {/* Header Info */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="status-badge qsr-badge-incoming">
                      ZOMATO
                    </span>
                    <span className="status-badge qsr-badge-requested">
                      REQUESTED
                    </span>
                  </div>

                  {/* Title & Token */}
                  <div className="d-flex justify-content-between align-items-baseline mb-3">
                    <h5 className="fw-800 text-slate-800 mb-0" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                      John Doe (Zomato)
                    </h5>
                    <span className="text-muted fw-bold" style={{ fontSize: '0.8rem' }}>
                      #12345
                    </span>
                  </div>

                  {/* Item List */}
                  <div className="pt-2 border-top border-light-dashed">
                    <div className="d-flex flex-wrap gap-2">
                      <span className="item-chip">
                        Paneer masala <span className="text-primary ms-1" style={{ fontWeight: '900' }}>×2</span>
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      <Switch>
        <Route path="/order/new" component={UnifiedOrder} />
      </Switch>

      {/* Mobile sticky bottom action bar — Standardized with elevation */}
      <div
        className="d-md-none"
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          right: '10px',
          background: '#ffffff',
          padding: '12px 20px',
          zIndex: 1040,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          borderRadius: '20px',
          border: '1px solid #f1f5f9',
        }}
      >
        <div className="d-flex gap-3 align-items-center">
          <Button
            className="custom-btn-outline flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-3"
            style={{ height: '54px' }}
            onClick={createNewOrder}
          >
            <CsLineIcons icon="plus" size="20" />
            <span style={{ fontSize: '1rem' }}>New Order</span>
          </Button>
          <Button
            variant="light"
            className="d-flex align-items-center justify-content-center p-0"
            style={{ width: '54px', height: '54px', borderRadius: '15px', border: '1.5px solid #f1f5f9', background: '#f8fafc' }}
            onClick={() => history.push('/order/delivery-partners')}
          >
            <CsLineIcons icon="shipping" size="24" style={{ color: '#475569' }} />
          </Button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

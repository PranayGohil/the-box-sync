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

      {/* Top Header Section — Standard Admin Layout */}
      <div className="page-title-container mb-4 mt-5 mt-lg-0">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="mb-0 pb-0 fw-800" style={{ color: brandColor, fontSize: '1.5rem' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-3 align-items-center">
              <Dropdown className="d-none d-md-inline-block">
                <Dropdown.Toggle as={CustomToggle}>
                  <CsLineIcons icon="calendar" className="me-2" size="15" />
                  <span>{periodOptions.find((p) => p.value === selectedPeriod)?.label}</span>
                  <CsLineIcons icon="chevron-down" className="ms-2" size="12" />
                </Dropdown.Toggle>
                <Dropdown.Menu className="interactive-card border-0 mt-2 shadow-lg">
                  {periodOptions.map((period) => (
                    <Dropdown.Item key={period.value} onClick={() => setSelectedPeriod(period.value)}>
                      {period.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Button className="action-btn-main d-flex align-items-center gap-2" onClick={createNewOrder}>
                <CsLineIcons icon="plus" size="20" />
                <span>New Order</span>
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      <Row className="g-3">
        {/* Section 1: Takeaways & Deliveries */}
        <Col xs="12" lg="6">
          <h3 className="section-title">
            <div
              style={{
                background: '#23b3f4',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <CsLineIcons icon="bag" size="18" />
            </div>
            Takeaways & Deliveries
            <Badge pill bg="primary" className="ms-2" style={{ fontSize: '12px', background: '#23b3f4' }}>
              {activeTakeawaysAndDeliveries.length}
            </Badge>
          </h3>

          <div className="custom-scrollbar" style={{ maxHeight: '68vh', overflowY: 'auto', paddingRight: '4px' }}>
            {activeTakeawaysAndDeliveries.length === 0 ? (
              <div className="empty-state">
                <CsLineIcons icon="inbox" size="40" className="text-muted opacity-10 mb-3" />
                <p className="text-muted small mb-0">No active takeaway or delivery orders.</p>
              </div>
            ) : (
              activeTakeawaysAndDeliveries.map((order) => (
                <Card key={order._id} className="order-card mb-3 cursor-pointer" onClick={() => handleOrderClick(order)}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex flex-column gap-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className={`order-type-tag ${order.order_type === 'Takeaway' ? 'tag-takeaway' : 'tag-delivery'}`}>{order.order_type}</span>
                          {order.token && (
                            <span className="fw-800" style={{ color: '#64748b', fontSize: '14px' }}>
                              #{order.token}
                            </span>
                          )}
                        </div>
                        <h5 className="fw-bold mb-0 mt-1" style={{ color: '#1e293b', fontSize: '1.2rem' }}>
                          {order.order_type === 'Takeaway' ? `Token: ${order.token}` : order.customer_name || 'Customer'}
                        </h5>
                      </div>
                      <Badge
                        className="status-badge"
                        style={{
                          background: order.order_status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: order.order_status === 'Paid' ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {order.order_status?.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="d-flex flex-wrap gap-2 pt-3 border-top">
                      {order.order_items.slice(0, 3).map((item, i) => (
                        <span key={i} className="item-chip">
                          {item.dish_name} <span className="text-primary ms-1">×{item.quantity}</span>
                        </span>
                      ))}
                      {order.order_items.length > 3 && (
                        <span className="item-chip" style={{ background: '#1e293b', color: '#fff', border: 'none' }}>
                          +{order.order_items.length - 3} more
                        </span>
                      )}
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
            <div
              style={{
                background: '#ef4444',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <CsLineIcons icon="external-link" size="16" />
            </div>
            Online Partners
            <Badge pill bg="danger" className="ms-2" style={{ fontSize: '11px' }}>
              1
            </Badge>
          </h3>

          <div className="custom-scrollbar" style={{ maxHeight: '68vh', overflowY: 'auto', paddingRight: '4px' }}>
            <Card className="order-card mb-3 cursor-pointer">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex flex-column gap-1">
                    <div className="d-flex align-items-center gap-2">
                      <span className="order-type-tag" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        ZOMATO
                      </span>
                      <span className="fw-800" style={{ color: '#64748b', fontSize: '14px' }}>
                        #12345
                      </span>
                    </div>
                    <h5 className="fw-bold mb-0 mt-1" style={{ color: '#1e293b', fontSize: '1.2rem' }}>
                      John Doe (Zomato)
                    </h5>
                  </div>
                  <Badge bg="warning" className="status-badge">
                    REQUESTED
                  </Badge>
                </div>

                <div className="d-flex flex-wrap gap-2 pt-3 border-top">
                  <span className="item-chip">
                    Paneer masala <span className="text-primary ms-1">×2</span>
                  </span>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

      <Switch>
        <Route path="/order/new" component={UnifiedOrder} />
      </Switch>

      {/* Mobile sticky bottom action bar */}
      <div
        className="d-md-none"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          padding: '16px',
          zIndex: 1040,
          boxShadow: '0 -8px 30px rgba(0,0,0,0.08)',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <div className="d-flex gap-3">
          <Button className="action-btn-main flex-grow-1 d-flex align-items-center justify-content-center gap-2" onClick={createNewOrder}>
            <CsLineIcons icon="plus" size="18" />
            <span>New Order</span>
          </Button>
          <Button
            variant="outline-secondary"
            className="d-flex align-items-center justify-content-center p-0"
            style={{ width: '56px', height: '56px', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}
            onClick={() => history.push('/order/delivery-partners')}
          >
            <CsLineIcons icon="shipping" size="24" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

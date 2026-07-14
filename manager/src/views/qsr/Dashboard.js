import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route } from 'react-router-dom';
import { Button, Row, Col, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSocket } from 'contexts/SocketContext';
import UnifiedOrder from './order/UnifiedOrder';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Restaurant performance and insights';
  const history = useHistory();
  const { socket } = useSocket();

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboards' },
  ];

  const [activeTakeawaysAndDeliveries, setActiveTakeawaysAndDeliveries] = useState([]);
  const [showOnlinePartners, setShowOnlinePartners] = useState(false);

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

  useEffect(() => {
    if (!socket) return () => {};
    const handleSocketUpdate = () => {
      console.log('Realtime order update (QSR): fetching active orders');
      fetchActiveOrders();
    };
    socket.on('kot_update', handleSocketUpdate);
    socket.on('order_updated', handleSocketUpdate);
    return () => {
      socket.off('kot_update', handleSocketUpdate);
      socket.off('order_updated', handleSocketUpdate);
    };
  }, [socket]);

  const takeawaysAndDeliveriesFiltered = activeTakeawaysAndDeliveries.filter((order) => order.order_status !== 'Requested');

  const websiteIncomingOrders = activeTakeawaysAndDeliveries.filter(
    (order) => order.order_source === 'Restaurant Website' && order.order_status === 'Requested'
  );

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}/order/update-status/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        fetchActiveOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const createNewOrder = () => {
    history.push('/order/qsr-pos?mode=new');
  };

  const handleOrderClick = (order) => {
    history.push(`/order/qsr-pos?orderId=${order._id}&mode=edit`);
  };

  const brandColor = '#23b3f4';
  const glassCardStyle = {
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid rgba(35, 179, 244, 0.1)',
    boxShadow: '0 10px 30px rgba(35, 179, 244, 0.05)',
    color: '#333333',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: 'pointer',
    position: 'relative',
  };

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

        <Row className="gy-4 gx-lg-5">
          {/* Section 1: Takeaways & Deliveries */}
          <Col xs="12" lg="6" className={showOnlinePartners ? 'd-none d-lg-block' : 'd-block'}>
            <div className="d-flex align-items-center mb-4">
              <div
                style={{
                  width: '8px',
                  height: '24px',
                  background: '#23b3f4',
                  borderRadius: '4px',
                  marginRight: '12px',
                  boxShadow: '0 2px 5px rgba(35,179,244,0.3)',
                }}
              />
              <h3 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#23b3f4', letterSpacing: '0.5px' }}>
                Takeaways & Deliveries
                <span className="ms-2 status-badge qsr-badge-active" style={{ fontSize: '12px', padding: '4px 10px', height: 'fit-content' }}>
                  {takeawaysAndDeliveriesFiltered.length} Active
                </span>
              </h3>
            </div>

            <div className="custom-scrollbar pe-2 pt-2 pb-2" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {takeawaysAndDeliveriesFiltered.length === 0 ? (
                <div style={{ ...glassCardStyle, borderStyle: 'dashed' }} className="text-center p-4">
                  <CsLineIcons icon="delivery" size="30" stroke="rgba(35,179,244,0.4)" className="mb-2" />
                  <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '13px' }}>
                    No active takeaway or delivery orders.
                  </p>
                </div>
              ) : (
                takeawaysAndDeliveriesFiltered.map((order) => (
                  <div
                    key={order._id}
                    className="mb-3"
                    style={glassCardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 15px 30px rgba(35,179,244,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = glassCardStyle.boxShadow;
                    }}
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1 fw-bold d-flex align-items-center gap-2" style={{ color: '#1a1a1a', fontSize: '14px' }}>
                            {order.order_type === 'Takeaway' ? (
                              <CsLineIcons icon="shop" size="16" stroke="#23b3f4" />
                            ) : (
                              <CsLineIcons icon="car" size="16" stroke="#23b3f4" />
                            )}
                            {order.order_type}
                            {order.token && <span style={{ color: '#23b3f4' }}>#{order.token}</span>}
                          </h5>
                          <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                            {order.order_type === 'Takeaway'
                              ? order.token
                                ? `Token: ${order.token}`
                                : order.customer_name || 'Draft Takeaway'
                              : `Customer: ${order.customer_name || 'N/A'}`}
                          </p>
                        </div>
                        <Badge
                          bg={
                            order.order_status === 'Paid' || order.order_status === 'Save' || order.order_status === 'Delivered'
                              ? 'success'
                              : order.order_status === 'Out for Delivery'
                              ? 'info'
                              : 'warning'
                          }
                          className={order.order_status === 'KOT' ? 'text-dark' : 'text-white'}
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}
                        >
                          {order.order_status === 'KOT' ? 'PREPARING' : order.order_status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {order.order_items.slice(0, 3).map((item, i) => (
                          <div
                            key={i}
                            style={{
                              background: 'rgba(35, 179, 244, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#1a1a1a',
                              border: '1px solid rgba(35,179,244,0.12)',
                            }}
                          >
                            {item.dish_name}{' '}
                            <strong className="ms-1" style={{ color: '#23b3f4' }}>
                              x{item.quantity}
                            </strong>
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div
                            style={{
                              background: '#f8f9fa',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#6c757d',
                              border: '1px dashed #dee2e6',
                            }}
                          >
                            +{order.order_items.length - 3} more
                          </div>
                        )}
                      </div>

                      {order.order_source === 'Restaurant Website' && (
                        <div className="d-flex gap-2 justify-content-end mt-3 pt-2 border-top border-light-dashed">
                          {order.order_status === 'KOT' && (
                            <Button
                              variant="primary"
                              size="sm"
                              style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', background: '#23b3f4', border: 'none' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order._id, 'Out for Delivery');
                              }}
                            >
                              Dispatch Order
                            </Button>
                          )}
                          {order.order_status === 'Out for Delivery' && (
                            <Button
                              variant="info"
                              size="sm"
                              className="text-white"
                              style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', background: '#0ea5e9', border: 'none' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order._id, 'Delivered');
                              }}
                            >
                              Mark Delivered
                            </Button>
                          )}
                          {order.order_status === 'Delivered' && (
                            <Button
                              variant="success"
                              size="sm"
                              style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', background: '#22c55e', border: 'none' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order._id, 'Paid');
                              }}
                            >
                              Complete & Paid
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Col>

          {/* Section 2: Online Partners */}
          <Col xs="12" lg="6" className={showOnlinePartners ? 'd-block' : 'd-none d-lg-block'}>
            <div className="d-flex align-items-center mb-4">
              <div
                style={{
                  width: '8px',
                  height: '24px',
                  background: '#23b3f4',
                  borderRadius: '4px',
                  marginRight: '12px',
                  boxShadow: '0 2px 5px rgba(35,179,244,0.3)',
                }}
              />
              <h3 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#23b3f4', letterSpacing: '0.5px' }}>
                Online Partners
                <span className="ms-2 status-badge qsr-badge-incoming" style={{ fontSize: '12px', padding: '4px 10px', height: 'fit-content' }}>
                  {websiteIncomingOrders.length} Incoming
                </span>
              </h3>
            </div>

            <div className="custom-scrollbar pe-2 pt-2 pb-2" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {websiteIncomingOrders.length === 0 ? (
                <div style={{ ...glassCardStyle, borderStyle: 'dashed' }} className="text-center p-4">
                  <CsLineIcons icon="notification" size="30" stroke="rgba(35,179,244,0.4)" className="mb-2" />
                  <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '13px' }}>
                    No incoming website orders.
                  </p>
                </div>
              ) : (
                websiteIncomingOrders.map((order) => (
                  <Card key={order._id} className="order-card incoming-pulse-card mb-3 cursor-pointer">
                    <Card.Body className="p-3">
                      {/* Header Info */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span
                          className="status-badge"
                          style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#23b3f4',
                            background: 'rgba(35, 179, 244, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          WEBSITE ORDER
                        </span>
                        <Badge
                          bg="warning"
                          className="text-dark"
                          style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {order.order_status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Title & Token */}
                      <div className="d-flex justify-content-between align-items-baseline mb-3">
                        <h5 className="fw-bold mb-0" style={{ color: '#1a1a1a', fontSize: '14px' }}>
                          {order.customer_name || 'Web Customer'}
                        </h5>
                        <span className="text-muted fw-bold font-monospace" style={{ fontSize: '0.8rem' }}>
                          #{order._id.substring(18).toUpperCase()}
                        </span>
                      </div>

                      {/* Item List */}
                      <div className="pt-2 border-top border-light-dashed">
                        <div className="d-flex flex-wrap gap-2">
                          {order.order_items.map((item, idx) => (
                            <span
                              key={idx}
                              className="item-chip"
                              style={{
                                background: 'rgba(35, 179, 244, 0.08)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: '#1a1a1a',
                                border: '1px solid rgba(35,179,244,0.12)',
                              }}
                            >
                              {item.dish_name}{' '}
                              <span className="text-primary ms-1" style={{ fontWeight: '900' }}>
                                ×{item.quantity}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Total and Action Buttons */}
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light-dashed">
                        <span className="fw-bold text-slate-800" style={{ fontSize: '0.9rem' }}>
                          Total: ₹{Number(order.total_amount || order.bill_amount || 0).toFixed(2)}
                        </span>
                        <div className="d-flex gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order._id, 'Cancelled');
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', background: '#22c55e', border: 'none' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order._id, 'KOT');
                            }}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>
          </Col>
        </Row>
      </div>

      <Switch>
        <Route path="/order/qsr-pos" component={UnifiedOrder} />
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
          padding: '10px 16px',
          zIndex: 1040,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          borderRadius: '20px',
          border: '1px solid #f1f5f9',
        }}
      >
        <div className="d-flex gap-3 align-items-center">
          <Button
            className="custom-btn-outline flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2"
            style={{ height: '42px' }}
            onClick={createNewOrder}
          >
            <CsLineIcons icon="plus" size="18" />
            <span style={{ fontSize: '0.95rem' }}>New Order</span>
          </Button>
          {showOnlinePartners ? (
            <Button
              variant="light"
              className="d-flex align-items-center justify-content-center p-0 position-relative"
              style={{ width: '42px', height: '42px', borderRadius: '12px', border: '1.5px solid #f1f5f9', background: '#f8fafc' }}
              onClick={() => setShowOnlinePartners(false)}
            >
              <CsLineIcons icon="close" size="20" style={{ color: '#dc3545' }} />
            </Button>
          ) : (
            <Button
              variant="light"
              className="d-flex align-items-center justify-content-center p-0 position-relative"
              style={{ width: '42px', height: '42px', borderRadius: '12px', border: '1.5px solid #f1f5f9', background: '#f8fafc' }}
              onClick={() => setShowOnlinePartners(true)}
            >
              <CsLineIcons icon="shipping" size="20" style={{ color: '#475569' }} />
              {websiteIncomingOrders.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#dc3545',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(220, 53, 69, 0.4)',
                    zIndex: 10,
                  }}
                >
                  {websiteIncomingOrders.length}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route } from 'react-router-dom';
import { Button, Row, Col, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import UnifiedOrder from './order/UnifiedOrder';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Restaurant Management Dashboard';
  const history = useHistory();

  const [activeDineInOrders, setActiveDineInOrders] = useState([]);
  const [activeTakeawaysAndDeliveries, setActiveTakeawaysAndDeliveries] = useState([]);

  const fetchActiveOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/order/get-active`, {
        params: {
          source: 'QSR',
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log(response.data)
      setActiveDineInOrders(response.data.activeDineInTables);
      setActiveTakeawaysAndDeliveries(response.data.activeTakeawaysAndDeliveries);
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const handleOrderClick = (order) => {
    history.push(`/order/new?orderId=${order._id}&mode=edit`);
  };

  const createNewOrder = () => {
    history.push('/order/new?mode=new');
  };

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container">
        <Row className="align-items-center gy-2">
          {/* Desktop buttons — hidden on mobile */}
          <Col xs="12" className="d-none d-md-flex align-items-center justify-content-start gap-2 flex-wrap">
            <Button variant="outline-primary" size="sm" onClick={createNewOrder}>
              + New Order
            </Button>
            <Button variant="outline-primary" size="sm" onClick={() => history.push('/order/delivery-partners')}>
              Delivery Partners
            </Button>
          </Col>
        </Row>
      </div>

      <Row className="gy-4">
        {/* Active Orders Section */}
        <Col xs="12" lg="6">
          <h3 className="mb-3 text-primary small-title">Active Takeaways & Deliveries</h3>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {activeTakeawaysAndDeliveries.length === 0 ? (
              <Card className="text-center p-4">
                <Card.Body>
                  <p className="text-muted mb-0">No active takeaway or delivery orders</p>
                </Card.Body>
              </Card>
            ) : (
              activeTakeawaysAndDeliveries.map((order) => {
                return (
                  <Card key={order._id} className="mb-3 hover-border-primary cursor-pointer" onClick={() => handleOrderClick(order)}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1">
                            {order.order_type}
                            {order.token && <span className="text-info fs-5"> #{order.token}</span>}
                          </h5>
                          <p className="mb-0 px-2">
                            {order.order_type === 'Takeaway' ? `Token: ${order.token}` : `Customer: ${order.customer_name || 'N/A'}`}
                          </p>
                        </div>
                        <Badge bg={order.order_status === 'Paid' || order.order_status === 'Save' ? 'success' : 'warning'} className="text-white">
                          {order.order_status}
                        </Badge>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {order.order_items.slice(0, 3).map((item, i) => (
                          <small key={i} className="badge bg-light text-dark">
                            {item.dish_name} x{item.quantity}
                          </small>
                        ))}
                        {order.order_items.length > 3 && <small className="badge bg-secondary">+{order.order_items.length - 3} more</small>}
                      </div>
                    </Card.Body>
                  </Card>
                )
              })
            )}
          </div>
        </Col>
        <Col xs="12" lg="6">
          <h3 className="mb-3 text-primary small-title">Active Delivery Partners's Orders</h3>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <Card className="mb-3 hover-border-primary cursor-pointer">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="mb-1">
                      Zomato Order
                      <span className="text-info fs-5"> #12345</span>
                    </h5>
                    <p className="mb-0 px-2">
                      Customer: John Doe
                    </p>
                  </div>
                  <Badge bg="warning" className="text-white">
                    Requested
                  </Badge>
                </div>
                <div className="d-flex flex-wrap gap-1">

                  <small className="badge bg-light text-dark">
                    Paneer masala x 2
                  </small>
                  {/* {order.order_items.length > 3 && <small className="badge bg-secondary">+{order.order_items.length - 3} more</small>} */}
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

      <Switch>
        <Route path="/order/new" component={UnifiedOrder} />
      </Switch>
      {/* Spacer so sticky bar doesn't overlap last content on mobile */}
      <div className="d-md-none" style={{ height: '80px' }} />
      {/* Mobile sticky bottom action bar */}
      <div className="d-md-none" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#ffffff', padding: '12px 16px',
        zIndex: 1040,
        boxShadow: '0 -4px 15px rgba(0,0,0,0.1)',
        borderTop: '1px solid #dee2e6',
      }}>
        <div className="d-flex gap-2">
          <Button variant="primary" className="flex-grow-1" onClick={createNewOrder}>
            + New Order
          </Button>
          <Button variant="outline-secondary" className="d-flex align-items-center justify-content-center p-0" style={{ width: '50px' }} onClick={() => history.push('/order/delivery-partners')}>
            <CsLineIcons icon="shipping" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

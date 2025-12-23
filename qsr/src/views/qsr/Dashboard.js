import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route, Redirect } from 'react-router-dom';
import { Button, Row, Col, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';

import DineInOrder from './order/DineInOrder';
import TakeawayOrder from './order/TakeawayOrder';
import DeliveryOrder from './order/DeliveryOrder';

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
    const orderType = order.order_type.toLowerCase().replace(' ', '-');
    history.push(`/order/${orderType}?orderId=${order._id}&mode=edit`);
  };

  const createNewOrder = (orderType) => {
    history.push(`/order/${orderType}?mode=new`);
  };

  return (
    <>
      <HtmlHead title={title} description={description} />

      <Row>
        <Col lg="6">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h2 className="small-title mb-0 mx-3">Active Dine In</h2>
            <div className="d-flex gap-2 mx-2">
              <Button variant="outline-primary" onClick={() => createNewOrder('dine-in')}>
                + New Dine In
              </Button>
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {activeDineInOrders.length === 0 ? (
              <Card className="text-center p-4">
                <Card.Body>
                  <p className="text-muted mb-0">No active dine in orders</p>
                </Card.Body>
              </Card>
            ) : (
              activeDineInOrders.map((order) => {

                const preparingCount = order.order_items.filter(
                  (item) => item.status === 'Preparing' || item.status === 'Pending'
                ).length;

                const completedCount = order.order_items.filter(
                  (item) => item.status === 'Completed'
                ).length;

                return (
                  <Card
                    key={order._id}
                    className="mb-3 hover-border-primary cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1">
                            {order.order_type}
                            {order.token && <span className="text-muted"> #{order.token}</span>}
                          </h5>
                          <p className="mb-0 text-muted">Token: {order.token}</p>
                        </div>
                        <div className="d-flex gap-2">
                          {order.order_status === 'Save' && (
                            <Badge bg="success">
                              {order.order_status}
                            </Badge>
                          )}
                          {order.order_status === 'KOT' && (
                            <>
                              {preparingCount > 0 && (
                                <Badge bg="warning">
                                  KOT: {preparingCount}
                                </Badge>
                              )}
                              {completedCount > 0 && (
                                <Badge bg="success">
                                  Served: {completedCount}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
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

        {/* Active Orders Section */}
        <Col lg="6">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h2 className="small-title mb-0 mx-3">Active Takeaways & Deliveries</h2>

            <div className="d-flex gap-2 mx-2">
              <Button variant="outline-primary" onClick={() => createNewOrder('takeaway')}>
                + New Takeaway
              </Button>
              <Button variant="outline-primary" onClick={() => createNewOrder('delivery')}>
                + New Delivery
              </Button>
            </div>
          </div>
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
                            {order.token && <span className="text-muted"> #{order.token}</span>}
                          </h5>
                          <p className="mb-0 text-muted">
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
      </Row>

      <Switch>
        <Route exact path="/order/dine-in" render={() => <DineInOrder />} />
        <Route exact path="/order/takeaway" render={() => <TakeawayOrder />} />
        <Route exact path="/order/delivery" render={() => <DeliveryOrder />} />
      </Switch>
    </>
  );
};

export default Dashboard;

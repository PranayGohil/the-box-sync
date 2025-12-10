import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route, Redirect } from 'react-router-dom';
import { Button, Row, Col, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Glide from 'components/carousel/Glide';

import DineInOrder from './order/DineInOrder';
import TakeawayOrder from './order/TakeawayOrder';
import DeliveryOrder from './order/DeliveryOrder';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Restaurant Management Dashboard';
  const history = useHistory();

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboard' },
  ];

  const [activeDineInOrders, setActiveDineInOrders] = useState([]);
  const [activeTakeawaysAndDeliveries, setActiveTakeawaysAndDeliveries] = useState([]);
  const [specialDishes, setSpecialDishes] = useState([]);

  const fetchActiveOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/order/get-active`, {
        params: {
          source: 'QSR',
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setActiveDineInOrders(response.data.activeDineInTables);
      setActiveTakeawaysAndDeliveries(response.data.activeTakeawaysAndDeliveries);
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  };

  const fetchSpecialDishes = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/menu/get`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const specialDishesRes = response.data.data
        .flatMap((category) => category.dishes)
        .filter((dish) => dish.is_special)
        .slice(0, 6);

      setSpecialDishes(specialDishesRes);
    } catch (error) {
      console.error('Error fetching special dishes:', error);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    fetchSpecialDishes();
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

      <div className="page-title-container">
        <Row>
          <Col md="7">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          {/* <Col md="5" className="d-flex align-items-start justify-content-end gap-2">
            <Button variant="outline-primary" onClick={() => createNewOrder('takeaway')}>
              + New Takeaway
            </Button>
            <Button variant="outline-primary" onClick={() => createNewOrder('delivery')}>
              + New Delivery
            </Button>
          </Col> */}
        </Row>
      </div>

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
              activeDineInOrders.map((order) => (
                <Card key={order._id} className="mb-3 hover-border-primary cursor-pointer" onClick={() => handleOrderClick(order)}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="mb-1">
                          {order.order_type}
                          {order.token && <span className="text-muted"> #{order.token}</span>}
                        </h5>
                        <p className="mb-0 text-muted">Token: {order.token}</p>
                      </div>
                      <Badge bg={order.order_status === 'Paid' ? 'success' : order.order_status === 'Save' ? 'primary' : 'warning'} className="text-white">
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
              ))
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
              activeTakeawaysAndDeliveries.map((order) => (
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
                      <Badge bg={order.order_status === 'Paid' ? 'success' : 'warning'} className="text-white">
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
              ))
            )}
          </div>
        </Col>
      </Row>

      {/* Special Dishes Section */}
      <div className="mt-5">
        <h2 className="small-title mb-4">Today's Special</h2>
        <Row className="g-2">
          {specialDishes.map((dish) => (
            <Col md="3" sm="6" lg="2" key={dish._id}>
              <Card className="bg-gradient-light text-white">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">{dish.dish_name}</h6>
                      <small className="opacity-75">₹{dish.dish_price}</small>
                    </div>
                    <Badge bg="warning" className="text-dark">
                      Special
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Switch>
        <Route exact path="/order/dine-in" render={() => <DineInOrder />} />
        <Route exact path="/order/takeaway" render={() => <TakeawayOrder />} />
        <Route exact path="/order/delivery" render={() => <DeliveryOrder />} />
      </Switch>
    </>
  );
};

export default Dashboard;

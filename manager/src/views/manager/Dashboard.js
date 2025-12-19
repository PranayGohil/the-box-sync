import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route } from 'react-router-dom';
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

  const [tables, setTables] = useState([]);
  const [activeDineInOrders, setActiveDineInOrders] = useState([]);
  const [activeTakeawaysAndDeliveries, setActiveTakeawaysAndDeliveries] = useState([]);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/table/get-all`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setTables(response.data.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/order/get-active`, {
        params: {
          source: 'Manager',
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log("Resaponse : ", response.data.activeDineInTables);

      setActiveDineInOrders(response.data.activeDineInTables);
      setActiveTakeawaysAndDeliveries(response.data.activeTakeawaysAndDeliveries);
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchActiveOrders();
  }, []);

  const handleTableClick = async (tableId, orderId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/table/get/${tableId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const tableInfo = response.data;
      if (orderId) {
        history.push(`/order/dine-in?tableId=${tableId}&orderId=${orderId}&mode=edit`);
      } else {
        history.push(`/order/dine-in?tableId=${tableId}&mode=new`);
      }
    } catch (error) {
      console.error('Error fetching table details:', error);
    }
  };

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
            <h1 className="mb-0 pb-0 display-4">Dine-In Tables</h1>
          </Col>
          <Col md="5" className="d-flex align-items-start justify-content-end gap-2">
            <Button variant="outline-primary" onClick={() => createNewOrder('takeaway')}>
              + New Takeaway
            </Button>
            <Button variant="outline-primary" onClick={() => createNewOrder('delivery')}>
              + New Delivery
            </Button>
          </Col>
        </Row>
      </div>

      <Row>
        <Col lg="12">
          {tables.map((tableArea) => (
            <div className="gx-2" key={tableArea._id}>
              <h3 className="mb-3 text-primary">{tableArea.area}</h3>
              <Col className="p-0">
                <Row className="g-3">
                  {tableArea.tables
                    .sort((a, b) => a.table_no - b.table_no)
                    .map((table) => {
                      const activeOrder = activeDineInOrders.find((order) => order.table_no === table.table_no && order.table_area === tableArea.area);

                      let preparingCount = 0;
                      let completedCount = 0;

                      if (activeOrder) {
                        preparingCount = activeOrder.order_items.filter(
                          (item) => item.status === 'Preparing' || item.status === 'Pending'
                        ).length;

                        completedCount = activeOrder.order_items.filter(
                          (item) => item.status === 'Completed'
                        ).length;
                      }

                      let bgClass = '';
                      let statusColor = '';

                      if (activeOrder) {
                        if (activeOrder.order_status === 'Save') {
                          bgClass = 'border-success';
                          statusColor = 'success';
                        } else if (activeOrder.order_status === 'KOT') {
                          bgClass = 'border-warning';
                          statusColor = 'warning';
                        }
                      }

                      return (
                        <Col key={table._id} xs="4" sm="4" md="3" lg="1"
                          style={{ position: "relative" }}
                        >
                          {completedCount > 0 && (
                            <Badge bg="success"
                              style={{
                                position: 'absolute',
                                zIndex: 1,
                                top: '-5px',
                                right: '0'
                              }}>
                              Served: {completedCount}
                            </Badge>
                          )}
                          <Card
                            key={table._id}
                            className={`sh-20 hover-border-primary mb-5 ${bgClass}`}
                            onClick={() => handleTableClick(table._id, activeOrder?._id)}
                          >
                            <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                              <div className="d-flex sh-7 sw-7 bg-gradient-light mb-3 align-items-center justify-content-center rounded-xl">
                                <h2 className="mb-0 lh-1 text-white">{table.table_no}</h2>
                              </div>
                              <div>
                                <p className="mb-0 lh-1">Max Person</p>
                                <p className="cta-3 mb-0 text-primary">{table.max_person}</p>
                                {activeOrder && (
                                  activeOrder.order_status === 'KOT' ?
                                    (
                                      <div className="d-flex flex-column gap-1">
                                        {preparingCount >= 0 && (
                                          <Badge bg="warning">
                                            KOT: {preparingCount}
                                          </Badge>
                                        )}
                                      </div>
                                    ) :
                                    activeOrder.order_status === 'Save' &&
                                    (
                                      <div className="d-flex flex-column gap-1">
                                        {preparingCount >= 0 && (
                                          <Badge bg="success">
                                            Save: {preparingCount}
                                          </Badge>
                                        )}
                                      </div>
                                    )
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                </Row>
              </Col>
            </div>
          ))}
        </Col>

        {/* Active Orders Section */}
        <Col lg="6">
          <h2 className="small-title mb-4">Active Takeaways & Deliveries</h2>
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

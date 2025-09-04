import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route, Redirect } from 'react-router-dom';
import { Button, Row, Col, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import Glide from 'components/carousel/Glide';

import DineInOrder from './order/DineInOrder';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Restaurant Management Dashboard';
  const history = useHistory();

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboard' },
  ];

  const [tables, setTables] = useState([]);
  const [activeDineInOrders, setActiveDineInOrders] = useState([]);
  const [specialDishes, setSpecialDishes] = useState([]);

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
      const response = await axios.post(`${process.env.REACT_APP_API}/order/get-active`, {
        source: 'Manager',
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log(response.data.data);

      setActiveDineInOrders(response.data.activeDineInTables);
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
    fetchTables();
    fetchActiveOrders();
    fetchSpecialDishes();
  }, []);

  const handleTableClick = async (tableId, orderId) => {
    try {
      if (orderId) {
        history.push(`/order/dine-in?tableId=${tableId}&orderId=${orderId}&mode=edit`);
      } else {
        history.push(`/order/dine-in?tableId=${tableId}&mode=new`);
      }
    } catch (error) {
      console.error('Error fetching table details:', error);
    }
  };


  return (
    <>
      <HtmlHead title={title} description={description} />

      <Row>
        <Col lg="12">
          {tables.map((tableArea) => (
            <div className="gx-2" key={tableArea._id}>
              <h3 className="mb-3 text-primary">{tableArea.area}</h3>
              <Col className="p-0">
                <Glide
                  options={{
                    gap: 15,
                    rewind: false,
                    bound: true,
                    perView: 8,
                    breakpoints: {
                      400: { perView: 2 },
                      600: { perView: 3 },
                      1200: { perView: 4 },
                      1600: { perView: 8 },
                    },
                  }}
                >
                  {tableArea.tables
                    .sort((a, b) => a.table_no - b.table_no)
                    .map((table) => {
                      const activeOrder = activeDineInOrders.find((order) => order.table_no === table.table_no && order.table_area === tableArea.area);

                      let bgClass = '';
                      let statusColor = 'secondary';

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
                        <Glide.Item key={table._id}>
                          <Card className={`sh-20 hover-border-primary mb-5 ${bgClass}`} onClick={() => handleTableClick(table._id, activeOrder?._id)}>
                            <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                              <div className="d-flex sh-7 sw-7 bg-gradient-light mb-3 align-items-center justify-content-center rounded-xl">
                                <h2 className="mb-0 lh-1 text-white">{table.table_no}</h2>
                              </div>
                              <div>
                                <p className="mb-0 lh-1">Max Person</p>
                                <p className="cta-3 mb-0 text-primary">{table.max_person}</p>
                                {activeOrder && (
                                  <Badge bg={statusColor} className="text-white">
                                    {activeOrder.order_status}
                                  </Badge>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Glide.Item>
                      );
                    })}
                </Glide>
              </Col>
            </div>
          ))}
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
      </Switch>
    </>
  );
};

export default Dashboard;

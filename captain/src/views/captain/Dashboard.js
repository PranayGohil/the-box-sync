import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route } from 'react-router-dom';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';

import DineInOrder from './order/DineInOrder';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Restaurant Management Dashboard';
  const history = useHistory();

  const [tables, setTables] = useState([]);
  const [activeDineInOrders, setActiveDineInOrders] = useState([]);

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
      console.log(response.data.data);

      setActiveDineInOrders(response.data.activeDineInTables);
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
      </Row>
      <Switch>
        <Route exact path="/order/dine-in" render={() => <DineInOrder />} />
      </Switch>
    </>
  );
};

export default Dashboard;

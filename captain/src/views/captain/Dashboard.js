import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route } from 'react-router-dom';
import { Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { useSocket } from 'contexts/SocketContext';
import UnifiedOrder from './order/UnifiedOrder';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Captain Management Dashboard';
  const history = useHistory();
  const { socket } = useSocket();

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboard' },
  ];

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
        params: { source: 'Manager' },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setActiveDineInOrders(response.data.activeDineInTables);
    } catch (error) {
      console.error('Error fetching active orders:', error);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return () => {};
    const handleSocketUpdate = () => {
      fetchActiveOrders();
    };
    socket.on('kot_update', handleSocketUpdate);
    socket.on('order_updated', handleSocketUpdate);
    return () => {
      socket.off('kot_update', handleSocketUpdate);
      socket.off('order_updated', handleSocketUpdate);
    };
  }, [socket]);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const getOccupiedDuration = (orderDate) => {
    if (!orderDate) return '';
    const diffMs = new Date() - new Date(orderDate);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    const diffHours = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    return `${diffHours}h ${remMins}m`;
  };

  const getOccupiedMinutes = (orderDate) => {
    if (!orderDate) return 0;
    const diffMs = new Date() - new Date(orderDate);
    return Math.floor(diffMs / 60000);
  };

  const getBadgeStyle = (orderDate) => {
    const mins = getOccupiedMinutes(orderDate);
    if (mins < 10) {
      return {
        border: '1px solid rgba(25, 135, 84, 0.25)',
        backgroundColor: 'rgba(25, 135, 84, 0.05)',
        color: '#198754',
      };
    } else if (mins <= 20) {
      return {
        border: '1px solid rgba(255, 193, 7, 0.35)',
        backgroundColor: 'rgba(255, 193, 7, 0.08)',
        color: '#d39e00',
      };
    } else {
      return {
        border: '1px solid rgba(220, 53, 69, 0.25)',
        backgroundColor: 'rgba(220, 53, 69, 0.05)',
        color: '#dc3545',
      };
    }
  };

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
        <div className="page-title-container dashboard-title-container mb-4 mt-2 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold dashboard-main-title">Dashboard</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        <Row className="gy-4 gx-lg-5">
          <Col xs="12">
            {tables.map((tableArea) => (
              <div className="gx-2 mb-5" key={tableArea._id}>
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
                  <h3 className="mb-0 fw-bold" style={{ color: '#23b3f4', letterSpacing: '0.5px' }}>
                    {tableArea.area}
                  </h3>
                </div>
                <Col className="p-0">
                  <Row className="g-4">
                    {tableArea.tables
                      .sort((a, b) => a.table_no - b.table_no)
                      .map((table) => {
                        const activeOrder = activeDineInOrders.find((order) => order.table_no === table.table_no && order.table_area === tableArea.area);

                        let preparingCount = 0;
                        let completedCount = 0;

                        if (activeOrder) {
                          preparingCount = activeOrder.order_items.filter((item) => item.status === 'Preparing' || item.status === 'Pending').length;

                          completedCount = activeOrder.order_items.filter((item) => item.status === 'Completed').length;
                        }

                        let borderStyle = '1px solid rgba(35, 179, 244, 0.15)';
                        if (activeOrder) {
                          if (activeOrder.order_status === 'Save') {
                            borderStyle = '2px solid #198754';
                          } else if (activeOrder.order_status === 'KOT') {
                            borderStyle = '2px solid #ffc107';
                          }
                        }

                        return (
                          <Col key={table._id} xs="6" sm="4" md="3" lg="3" xl="2" style={{ position: 'relative' }}>
                            {completedCount > 0 && (
                              <Badge
                                bg="success"
                                style={{
                                  position: 'absolute',
                                  zIndex: 10,
                                  top: '-8px',
                                  right: '-2px',
                                  fontSize: '11px',
                                  padding: '6px 10px',
                                  borderRadius: '10px',
                                  boxShadow: '0 4px 10px rgba(25,135,84,0.3)',
                                }}
                              >
                                Served: {completedCount}
                              </Badge>
                            )}
                            <div
                              style={{ ...glassCardStyle, border: borderStyle, height: '100%' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 15px 35px rgba(35,179,244,0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = glassCardStyle.boxShadow;
                              }}
                              onClick={() => handleTableClick(table._id, activeOrder?._id)}
                            >
                              <div className={`p-2 p-sm-3 text-center d-flex flex-column h-100 align-items-center ${activeOrder ? 'justify-content-between' : 'justify-content-start'}`}>
                                <div
                                  className="d-flex align-items-center justify-content-center mb-2 mb-sm-3 dashboard-table-circle"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(35, 179, 244, 0.1) 0%, rgba(35, 179, 244, 0.2) 100%)',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(35,179,244,0.3)',
                                  }}
                                >
                                  <h3 className="mb-0 fw-bold dashboard-table-no" style={{ color: '#23b3f4' }}>
                                    {table.table_no}
                                  </h3>
                                </div>
                                <div className="w-100">
                                  <p className="dashboard-table-max-person mb-1">Max Person</p>
                                  <p className="dashboard-table-capacity mb-2 fw-bold" style={{ color: '#23b3f4' }}>
                                    {table.max_person}
                                  </p>
                                  {activeOrder && (
                                    <div className="mb-2">
                                      <Badge
                                        bg="none"
                                        className="rounded-pill px-2 py-1"
                                        style={{
                                          fontSize: '10px',
                                          fontWeight: 'bold',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          ...getBadgeStyle(activeOrder.order_date),
                                        }}
                                      >
                                        <i className="far fa-clock" style={{ fontSize: '9px' }} />
                                        <span>{getOccupiedDuration(activeOrder.order_date)}</span>
                                      </Badge>
                                    </div>
                                  )}
                                  {activeOrder &&
                                    (activeOrder.order_status === 'KOT' ? (
                                      <div className="w-100 mt-1 mt-sm-2">
                                        {preparingCount >= 0 && (
                                          <Badge bg="warning" className="dashboard-table-badge w-100 rounded-3 shadow-sm text-dark fw-bold">
                                            KOT: {preparingCount}
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      activeOrder.order_status === 'Save' && (
                                        <div className="w-100 mt-1 mt-sm-2">
                                          {preparingCount >= 0 && (
                                            <Badge bg="success" className="dashboard-table-badge w-100 rounded-3 shadow-sm fw-bold">
                                              Save: {preparingCount}
                                            </Badge>
                                          )}
                                        </div>
                                      )
                                    ))}
                                </div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                  </Row>
                </Col>
              </div>
            ))}
          </Col>
        </Row>
      </div>

      <Switch>
        <Route exact path="/order/dine-in" render={() => <UnifiedOrder />} />
      </Switch>
    </>
  );
};

export default Dashboard;

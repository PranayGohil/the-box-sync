import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route } from 'react-router-dom';
import { Button, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import DineInOrder from "./order/DineInOrder";
import TakeawayOrder from "./order/TakeawayOrder";
import DeliveryOrder from "./order/DeliveryOrder";

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
  const [activeTakeawaysAndDeliveries, setActiveTakeawaysAndDeliveries] = useState([]);

  const findTableId = (tableNo, tableArea) => {
    for (const area of tables) {
      if (area.area === tableArea) {
        const tbl = area.tables.find((t) => t.table_no === tableNo);
        if (tbl) return tbl._id;
      }
    }
    return null;
  };

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

  const glassCardStyle = {
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid rgba(35, 179, 244, 0.1)',
    boxShadow: '0 10px 30px rgba(35, 179, 244, 0.05)',
    color: '#333333',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: 'pointer',
    position: 'relative'
  };

  const glassBtnStyle = {
    background: 'rgba(35, 179, 244, 0.08)',
    border: '1px solid rgba(35, 179, 244, 0.2)',
    color: '#23b3f4',
    borderRadius: '14px',
    padding: '8px 16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
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
            <Col xs="auto" className="d-none d-md-flex align-items-center justify-content-md-end gap-3 flex-wrap">
              <Button
                className="custom-btn-outline"
                onClick={() => createNewOrder('takeaway')}>
                <CsLineIcons icon="plus" size="15" className="me-2" />
                Takeaway
              </Button>
              <Button
                className="custom-btn-outline"
                onClick={() => createNewOrder('delivery')}>
                <CsLineIcons icon="plus" size="15" className="me-2" />
                Delivery
              </Button>
              <Button
                className="custom-btn-outline"
                onClick={() => history.push('/order/delivery-partners')}>
                Delivery Partners
              </Button>
            </Col>
          </Row>
        </div>

        <Row className="gy-4 gx-lg-5">
          <Col xs="12" lg="8">
            {tables.map((tableArea) => (
              <div className="gx-2 mb-5" key={tableArea._id}>
                <div className="d-flex align-items-center mb-4">
                  <div style={{ width: '8px', height: '24px', background: '#23b3f4', borderRadius: '4px', marginRight: '12px', boxShadow: '0 2px 5px rgba(35,179,244,0.3)' }} />
                  <h3 className="mb-0 fw-bold" style={{ color: '#23b3f4', letterSpacing: '0.5px' }}>{tableArea.area}</h3>
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
                          preparingCount = activeOrder.order_items.filter(
                            (item) => item.status === 'Preparing' || item.status === 'Pending'
                          ).length;

                          completedCount = activeOrder.order_items.filter(
                            (item) => item.status === 'Completed'
                          ).length;
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
                              <Badge bg="success"
                                style={{
                                  position: 'absolute',
                                  zIndex: 10,
                                  top: '-8px',
                                  right: '-2px',
                                  fontSize: '11px',
                                  padding: '6px 10px',
                                  borderRadius: '10px',
                                  boxShadow: '0 4px 10px rgba(25,135,84,0.3)'
                                }}>
                                Served: {completedCount}
                              </Badge>
                            )}
                            <div
                              style={{ ...glassCardStyle, border: borderStyle, height: '100%' }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(35,179,244,0.15)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glassCardStyle.boxShadow; }}
                              onClick={() => handleTableClick(table._id, activeOrder?._id)}
                            >
                              <div className="p-3 text-center d-flex flex-column h-100 justify-content-between align-items-center">
                                <div
                                  className="d-flex align-items-center justify-content-center mb-3"
                                  style={{
                                    width: '56px', height: '56px',
                                    background: 'linear-gradient(135deg, rgba(35, 179, 244, 0.1) 0%, rgba(35, 179, 244, 0.2) 100%)',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(35,179,244,0.3)'
                                  }}
                                >
                                  <h3 className="mb-0 fw-bold" style={{ color: '#23b3f4' }}>{table.table_no}</h3>
                                </div>
                                <div className="w-100">
                                  <p className="mb-1" style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase' }}>Max Person</p>
                                  <p className="mb-2 fw-bold" style={{ color: '#23b3f4', fontSize: '1.2rem' }}>{table.max_person}</p>
                                  {activeOrder && (
                                    activeOrder.order_status === 'KOT' ?
                                      (
                                        <div className="w-100 mt-2">
                                          {preparingCount >= 0 && (
                                            <Badge bg="warning" className="w-100 py-2 rounded-3 shadow-sm text-dark fw-bold">
                                              KOT: {preparingCount}
                                            </Badge>
                                          )}
                                        </div>
                                      ) :
                                      activeOrder.order_status === 'Save' &&
                                      (
                                        <div className="w-100 mt-2">
                                          {preparingCount >= 0 && (
                                            <Badge bg="success" className="w-100 py-2 rounded-3 shadow-sm fw-bold">
                                              Save: {preparingCount}
                                            </Badge>
                                          )}
                                        </div>
                                      )
                                  )}
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

          {/* Active Side Section */}
          <Col xs="12" lg="4">
            {/* Section 1: Active Dine-In Orders */}
            <div className="d-flex align-items-center mb-4">
              <div style={{ width: '8px', height: '24px', background: '#23b3f4', borderRadius: '4px', marginRight: '12px', boxShadow: '0 2px 5px rgba(35,179,244,0.3)' }} />
              <h3 className="mb-0 fw-bold" style={{ color: '#23b3f4', letterSpacing: '0.5px' }}>Active Dine-In</h3>
            </div>
            <div style={{ maxHeight: '40vh', overflowY: 'auto', paddingRight: '5px', marginBottom: '2.5rem' }} className="custom-scrollbar">
              {activeDineInOrders.length === 0 ? (
                <div style={{ ...glassCardStyle, borderStyle: 'dashed' }} className="text-center p-4">
                  <CsLineIcons icon="tag" size="30" stroke="rgba(35,179,244,0.4)" className="mb-2" />
                  <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '13px' }}>No active Dine-In tables</p>
                </div>
              ) : (
                activeDineInOrders.map((order) => (
                  <div
                    key={order._id}
                    className="mb-3"
                    style={glassCardStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(35,179,244,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glassCardStyle.boxShadow }}
                    onClick={() => {
                      const tableId = findTableId(order.table_no, order.table_area);
                      if (tableId) handleTableClick(tableId, order._id);
                    }}
                  >
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1 fw-bold d-flex align-items-center gap-2" style={{ color: '#1a1a1a', fontSize: '14px' }}>
                            <CsLineIcons icon="tag" size="16" stroke="#23b3f4" />
                            Table {order.table_no} ({order.table_area})
                          </h5>
                          <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                            Order #{order.token || order._id.slice(-6)}
                          </p>
                        </div>
                        <Badge
                          bg={order.order_status === 'Paid' || order.order_status === 'Save' ? 'success' : 'warning'}
                          className={order.order_status === 'KOT' ? 'text-dark' : 'text-white'}
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}
                        >
                          {order.order_status}
                        </Badge>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {order.order_items.slice(0, 3).map((item, i) => (
                          <div key={i} style={{ background: 'rgba(35, 179, 244, 0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#1a1a1a', border: '1px solid rgba(35,179,244,0.12)' }}>
                            {item.dish_name} <strong className="ms-1" style={{ color: '#23b3f4' }}>x{item.quantity}</strong>
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div style={{ background: '#f8f9fa', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#6c757d', border: '1px dashed #dee2e6' }}>
                            +{order.order_items.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Section 2: Active Takeaways & Deliveries */}
            <div className="d-flex align-items-center mb-4">
              <div style={{ width: '8px', height: '24px', background: '#23b3f4', borderRadius: '4px', marginRight: '12px', boxShadow: '0 2px 5px rgba(35,179,244,0.3)' }} />
              <h3 className="mb-0 fw-bold" style={{ color: '#23b3f4', letterSpacing: '0.5px' }}>Active Takeaways & Deliveries</h3>
            </div>
            <div style={{ maxHeight: '40vh', overflowY: 'auto', paddingRight: '5px' }} className="custom-scrollbar">
              {activeTakeawaysAndDeliveries.length === 0 ? (
                <div style={{ ...glassCardStyle, borderStyle: 'dashed' }} className="text-center p-4">
                  <CsLineIcons icon="delivery" size="30" stroke="rgba(35,179,244,0.4)" className="mb-2" />
                  <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '13px' }}>No active orders at the moment</p>
                </div>
              ) : (
                activeTakeawaysAndDeliveries.map((order) => (
                  <div
                    key={order._id}
                    className="mb-3"
                    style={glassCardStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(35,179,244,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glassCardStyle.boxShadow }}
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1 fw-bold d-flex align-items-center gap-2" style={{ color: '#1a1a1a', fontSize: '14px' }}>
                            {order.order_type === 'Takeaway' ? <CsLineIcons icon="shop" size="16" stroke="#23b3f4" /> : <CsLineIcons icon="car" size="16" stroke="#23b3f4" />}
                            {order.order_type}
                            {order.token && <span style={{ color: '#23b3f4' }}>#{order.token}</span>}
                          </h5>
                          <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                            {order.order_type === 'Takeaway' ? `Token: ${order.token}` : `Customer: ${order.customer_name || 'N/A'}`}
                          </p>
                        </div>
                        <Badge
                          bg={order.order_status === 'Paid' || order.order_status === 'Save' ? 'success' : 'warning'}
                          className={order.order_status === 'KOT' ? 'text-dark' : 'text-white'}
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}
                        >
                          {order.order_status}
                        </Badge>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {order.order_items.slice(0, 3).map((item, i) => (
                          <div key={i} style={{ background: 'rgba(35, 179, 244, 0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#1a1a1a', border: '1px solid rgba(35,179,244,0.12)' }}>
                            {item.dish_name} <strong className="ms-1" style={{ color: '#23b3f4' }}>x{item.quantity}</strong>
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div style={{ background: '#f8f9fa', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#6c757d', border: '1px dashed #dee2e6' }}>
                            +{order.order_items.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Col>
        </Row>
      </div>

      {/* <Switch>
        <Route exact path="/order/dine-in" render={() => <DineInOrder />} />
        <Route exact path="/order/takeaway" render={() => <TakeawayOrder />} />
        <Route exact path="/order/delivery" render={() => <DeliveryOrder />} />
      </Switch> */}

      {/* Spacer so sticky bar doesn't overlap last content on mobile */}
      <div className="d-md-none" style={{ height: '90px' }} />

      {/* Mobile sticky bottom action bar */}
      <div className="d-md-none" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px',
        zIndex: 1040,
        boxShadow: '0 -10px 30px rgba(35,179,244,0.1)',
        borderTop: '1px solid rgba(35,179,244,0.1)',
      }}>
        <div className="d-flex gap-2">
          <Button className="flex-grow-1 custom-btn-outline" onClick={() => createNewOrder('takeaway')}>
            + Takeaway
          </Button>
          <Button className="flex-grow-1 custom-btn-outline" onClick={() => createNewOrder('delivery')}>
            + Delivery
          </Button>
          <Button className="d-flex align-items-center justify-content-center custom-btn-outline" style={{ width: '56px', padding: '0 !important' }} onClick={() => history.push('/order/delivery-partners')}>
            <CsLineIcons icon="shipping" />
          </Button>
        </div>
      </div>

    </>
  );
};

export default Dashboard;

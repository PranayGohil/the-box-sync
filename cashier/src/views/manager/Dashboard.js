import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Row, Col, Badge, Card } from 'react-bootstrap';
import axios from 'axios';
import { useSelector } from 'react-redux';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { useSocket } from 'contexts/SocketContext';
import Select from 'react-select';

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Restaurant Management Dashboard';
  const history = useHistory();
  const { attrMobile } = useSelector((state) => state.menu);
  const { socket } = useSocket();

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'dashboard', text: 'Dashboard' },
  ];

  const [tables, setTables] = useState([]);
  const [activeDineInOrders, setActiveDineInOrders] = useState([]);
  const [activeTakeawaysAndDeliveries, setActiveTakeawaysAndDeliveries] = useState([]);
  const [mobileActiveSection, setMobileActiveSection] = useState('dine-in');
  const [selectedArea, setSelectedArea] = useState('');

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
    const interval = setInterval(fetchActiveOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return () => { };
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
            <Col xs="auto" className="d-none d-md-flex align-items-center justify-content-md-end gap-3 flex-wrap">
              <Button className="custom-btn-outline" onClick={() => createNewOrder('takeaway')}>
                <CsLineIcons icon="plus" size="15" className="me-2" />
                Takeaway
              </Button>
              <Button className="custom-btn-outline" onClick={() => createNewOrder('delivery')}>
                <CsLineIcons icon="plus" size="15" className="me-2" />
                Delivery
              </Button>
              <Button className="custom-btn-outline" onClick={() => history.push('/order/delivery-partners')}>
                Delivery Partners
              </Button>
            </Col>
          </Row>
        </div>

        {/* Dynamic Mobile Section Segment Control */}
        <div className="d-flex d-lg-none justify-content-center mb-4">
          <div
            className="d-flex p-1 bg-light rounded-pill shadow-sm"
            style={{ border: '1px solid rgba(35, 179, 244, 0.15)', width: '100%', maxWidth: '400px' }}
          >
            <Button
              variant="none"
              className={`flex-grow-1 rounded-pill py-2 fw-bold text-center border-0 transition-all d-flex align-items-center justify-content-center ${mobileActiveSection === 'dine-in' ? 'bg-primary text-white shadow-sm' : 'text-muted'
                }`}
              style={{ fontSize: '0.85rem' }}
              onClick={() => setMobileActiveSection('dine-in')}
            >
              <CsLineIcons icon="room" size="15" className="me-2" />
              Dine In
            </Button>
            <Button
              variant="none"
              className={`flex-grow-1 rounded-pill py-2 fw-bold text-center border-0 transition-all d-flex align-items-center justify-content-center ${mobileActiveSection === 'takeaway-delivery' ? 'bg-primary text-white shadow-sm' : 'text-muted'
                }`}
              style={{ fontSize: '0.85rem' }}
              onClick={() => setMobileActiveSection('takeaway-delivery')}
            >
              <CsLineIcons icon="delivery" size="15" className="me-2" />
              Orders
              {activeTakeawaysAndDeliveries.length > 0 && (
                <Badge
                  bg={mobileActiveSection === 'takeaway-delivery' ? 'light' : 'primary'}
                  className={`ms-2 ${mobileActiveSection === 'takeaway-delivery' ? 'text-primary' : 'text-white'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25em 0.5em' }}
                >
                  {activeTakeawaysAndDeliveries.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <Row className="gy-4 gx-lg-5">
          <Col xs="12" lg="8" className={mobileActiveSection === 'dine-in' ? 'd-block' : 'd-none d-lg-block'}>
            <div className="mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-2" style={{ position: 'relative', zIndex: 100 }}>
              <div className="d-flex align-items-center">
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
                <h3 className="mb-0 fw-bold" style={{ color: '#23b3f4', letterSpacing: '0.5px' }}>Dine-In Tables</h3>
              </div>
              <div className="area-select-wrapper" style={{ width: '200px' }}>
                <Select
                  classNamePrefix="react-select"
                  options={[{ value: '', label: 'All Areas' }, ...tables.map((t) => ({ value: t.area, label: t.area }))]}
                  value={selectedArea ? { value: selectedArea, label: selectedArea } : { value: '', label: 'All Areas' }}
                  onChange={(selected) => setSelectedArea(selected ? selected.value : '')}
                  placeholder="All Areas"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '50px',
                      minHeight: '38px',
                      height: '38px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#23b3f4' },
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.12)',
                      zIndex: 9999,
                    }),
                    option: (base) => ({ ...base, whiteSpace: 'nowrap' }),
                    placeholder: (base) => ({ ...base, color: '#23b3f4', fontWeight: '600', fontSize: '13px' }),
                    singleValue: (base) => ({ ...base, color: '#23b3f4', fontWeight: '600', fontSize: '13px' }),
                  }}
                />
              </div>
            </div>

            {tables
              .filter((tableArea) => !selectedArea || tableArea.area === selectedArea)
              .map((tableArea) => (
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
                      .sort((a, b) => String(a.table_no).localeCompare(String(b.table_no), undefined, { numeric: true, sensitivity: 'base' }))
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
                              style={{ ...glassCardStyle, border: borderStyle, height: 'auto' }}
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
                              <div className={`p-3 text-center d-flex flex-column h-100 align-items-center ${activeOrder ? 'justify-content-between' : 'justify-content-start'}`}>
                                <div
                                  className="d-flex align-items-center justify-content-center mb-2 mb-sm-3 dashboard-table-circle"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(35, 179, 244, 0.1) 0%, rgba(35, 179, 244, 0.2) 100%)',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(35,179,244,0.3)',
                                  }}
                                >
                                  <h3
                                    className="mb-0 fw-bold dashboard-table-no"
                                    style={{
                                      color: '#23b3f4',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      fontSize:
                                        String(table.table_no).length <= 2
                                          ? '1.5rem'
                                          : String(table.table_no).length <= 4
                                            ? '1.1rem'
                                            : '0.75rem',
                                    }}
                                  >
                                    {table.table_no}
                                  </h3>
                                </div>
                                <div className="w-100">
                                  <p className="dashboard-table-max-person mb-2">
                                    Capacity: <span className="fw-bold" style={{ color: '#23b3f4', fontSize: '13px' }}>{table.max_person}</span>
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

          {/* Active Takeaways & Deliveries Column */}
          <Col xs="12" lg="4" className={mobileActiveSection === 'takeaway-delivery' ? 'd-block' : 'd-none d-lg-block'}>
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
                Active Takeaways &amp; Deliveries
              </h3>
            </div>
            <div style={{ maxHeight: '90vh', overflowY: 'auto', paddingRight: '5px' }} className="custom-scrollbar">
              {activeTakeawaysAndDeliveries.length === 0 ? (
                <div style={{ ...glassCardStyle, borderStyle: 'dashed' }} className="text-center p-4">
                  <CsLineIcons icon="delivery" size="30" stroke="rgba(35,179,244,0.4)" className="mb-2" />
                  <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '13px' }}>
                    No active orders at the moment
                  </p>
                </div>
              ) : (
                activeTakeawaysAndDeliveries.map((order) => (
                  <Card key={order._id} className="order-card mb-3 cursor-pointer" onClick={() => handleOrderClick(order)}>
                    <Card.Body className="p-3">
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
                    </Card.Body>
                  </Card>
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

      {/* Mobile sticky bottom action bar — floating pill */}
      {!attrMobile && (
        <div
          className="d-md-none"
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            right: '10px',
            background: '#ffffff',
            padding: '8px 10px',
            zIndex: 1040,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
          }}
        >
          <div className="d-flex gap-2 align-items-center">
            <Button
              className="custom-btn-outline flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 py-2 px-1"
              style={{ height: '40px' }}
              onClick={() => createNewOrder('takeaway')}
            >
              <CsLineIcons icon="plus" size="14" />
              <span style={{ fontSize: '0.85rem' }}>Takeaway</span>
            </Button>
            <Button
              className="custom-btn-outline flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 py-2 px-1"
              style={{ height: '40px' }}
              onClick={() => createNewOrder('delivery')}
            >
              <CsLineIcons icon="plus" size="14" />
              <span style={{ fontSize: '0.85rem' }}>Delivery</span>
            </Button>
            <Button
              variant="light"
              className="d-flex align-items-center justify-content-center p-0 flex-shrink-0"
              style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '12px', border: '1.5px solid #f1f5f9', background: '#f8fafc' }}
              onClick={() => history.push('/order/delivery-partners')}
            >
              <CsLineIcons icon="shipping" size="18" style={{ color: '#475569' }} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useHistory, Switch, Route } from 'react-router-dom';
import { Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import UnifiedOrder from './order/UnifiedOrder';

const customStyles = `
  .page-title-container h1 {
    color: #23b3f4 !important;
  }

  /* Force container fluid full width on both mobile and desktop viewports */
  .container, .container-sm, .container-md, .container-lg, .container-xl, .container-xxl {
    max-width: 100% !important;
    width: 100% !important;
    padding-left: var(--bs-gutter-x, 1rem) !important;
    padding-right: var(--bs-gutter-x, 1rem) !important;
  }
    
  .container-fluid {
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
  }

  .custom-btn-outline {
    border: 1.5px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    font-weight: 700 !important;
    border-radius: 50px !important;
  }
  .custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }

  /* Laptop View Optimization: Decrease gap between header and title slightly */
  @media (min-width: 992px) {
    .page-title-container {
     margin-top: -0.25rem !important;
    }
  }

  /* Mobile View Optimization: Increase gap between header and title */
  @media (max-width: 768px) {
    .page-title-container {
      margin-top: 2.5rem !important;
    }
    .page-title-container h1 {
      font-size: 1.75rem !important;
      margin-bottom: 0.5rem !important;
      margin-top: -0.5rem;
      color: #23b3f4 !important;
    }
    .container-fluid {
      padding-left: 1.25rem !important;
      padding-right: 1.25rem !important;
    }
  }
`;

const Dashboard = () => {
  const title = 'Dashboard';
  const description = 'Captain Management Dashboard';
  const history = useHistory();

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
    <div className="container-fluid">
      <HtmlHead title={title} description={description} />
      <style>{customStyles}</style>

      <div className="page-title-container mb-4 mt-3">
        <Row className="align-items-center gy-2">
          <Col xs="12" md="6" className="mb-1 mb-md-0">
            <h1 className="mb-0 pb-0 display-4 fw-bold">Dashboard</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>

        </Row>
      </div>

      <Row className="gy-4" style={{ justifyContent: 'center' }}>
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
                            <div className="p-3 text-center d-flex flex-column h-100 justify-content-between align-items-center">
                              <div
                                className="d-flex align-items-center justify-content-center mb-3"
                                style={{
                                  width: '56px',
                                  height: '56px',
                                  background: 'linear-gradient(135deg, rgba(35, 179, 244, 0.1) 0%, rgba(35, 179, 244, 0.2) 100%)',
                                  borderRadius: '50%',
                                  border: '2px solid rgba(35,179,244,0.3)',
                                }}
                              >
                                <h3 className="mb-0 fw-bold" style={{ color: '#23b3f4' }}>
                                  {table.table_no}
                                </h3>
                              </div>
                              <div className="w-100">
                                <p className="mb-1" style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase' }}>
                                  Max Person
                                </p>
                                <p className="mb-2 fw-bold" style={{ color: '#23b3f4', fontSize: '1.2rem' }}>
                                  {table.max_person}
                                </p>
                                {activeOrder &&
                                  (activeOrder.order_status === 'KOT' ? (
                                    <div className="w-100 mt-2">
                                      {preparingCount >= 0 && (
                                        <Badge bg="warning" className="w-100 py-2 rounded-3 shadow-sm text-dark fw-bold">
                                          KOT: {preparingCount}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    activeOrder.order_status === 'Save' && (
                                      <div className="w-100 mt-2">
                                        {preparingCount >= 0 && (
                                          <Badge bg="success" className="w-100 py-2 rounded-3 shadow-sm fw-bold">
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

      <Switch>
        <Route exact path="/order/dine-in" render={() => <UnifiedOrder />} />
      </Switch>





    </div>
  );
};

export default Dashboard;

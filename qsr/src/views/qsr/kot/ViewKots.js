import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';

const ViewKots = () => {
  const title = 'Manage KOTs';
  const description = 'View and manage all KOT orders with dish status updates';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/view-kots', title: 'Manage KOTs' },
  ];

  const [kotData, setKotData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrderData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/kot/showkots`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      console.log(response.data);
      setKotData(response.data);
    } catch (error) {
      console.log('Error fetching order data:', error);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  const updateDishStatus = async (orderId, dishId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API}/kot/updatedishstatus`,
        { orderId, dishId, status: 'Completed' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchOrderData();
    } catch (error) {
      console.log('Error updating dish status:', error);
    }
  };

  const updateAllDishStatus = async (orderId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API}/kot/updatealldishstatus`,
        { orderId, status: 'Completed' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchOrderData();
    } catch (error) {
      console.log('Error updating all dish statuses:', error);
    }
  };

  // Search filter
  const filteredKOTs = kotData.filter(
    (kot) =>
      kot.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kot.order_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kot.token?.toString().includes(searchTerm)
  );

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container mb-4">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </div>

          <Form className="mb-4">
            <Row className="align-items-center justify-content-between">
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Search by customer, type, or token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={4} className="d-flex align-items-center justify-content-end">
                <div>Pending Dishes to Complete : </div>
                <div className='mx-2 fs-3 fw-bold'>{filteredKOTs.reduce((total, kot) => total + kot.order_items.filter((item) => item.status === 'Preparing').length, 0)}</div>
              </Col>
            </Row>
          </Form>

          <Row>
            {filteredKOTs.map((data) => {
              const allDishesCompleted = data.order_items.every((dish) => dish.status === 'Completed');

              return (
                <Col md={4} lg={4} key={data._id}>
                  <Card body className="mb-4 shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="mb-1">{data.order_type}</h5>
                        <div className="text-muted small">{data.customer_name || 'Guest'}</div>
                      </div>
                      {data.order_type === 'Takeaway' && (
                        <div className="text-end">
                          <h5 className="mb-1">Token</h5>
                          <div className="d-flex justify-content-end">
                            <div className="fw-bold bg-primary rounded-pill py-2 px-3 text-center text-white">{data.token}</div>
                          </div>
                        </div>
                      )}
                      {data.order_type === 'Dine In' && (
                        <div className="text-end">
                          <h5 className="mb-1">
                            Area: <span className="fw-bold">{data.table_area}</span>
                          </h5>
                          <div className="d-flex justify-content-end">
                            <div className="fw-bold bg-primary rounded-pill py-2 px-3 text-center text-white">{data.table_no}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="table-responsive mb-3">
                      <table className="table table-sm table-striped">
                        <thead>
                          <tr>
                            <th>Dish</th>
                            <th>Qty</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.order_items.map((dish) =>
                            dish.special_notes !== 'Parcel Charge' ? (
                              <tr key={dish._id}>
                                <td>{dish.dish_name}</td>
                                <td>{dish.quantity}</td>
                                <td>
                                  {dish.status === 'Preparing' ? (
                                    <Button
                                      size="sm"
                                      className="btn btn-sm btn-icon"
                                      variant="outline-success"
                                      onClick={() => updateDishStatus(data._id, dish._id)}
                                      title="Mark as Completed"
                                    >
                                      <CsLineIcons icon="check" />
                                    </Button>
                                  ) : (
                                    <span className="text-success fw-bold">
                                      <CsLineIcons icon="check-circle" /> Done
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ) : null
                          )}
                        </tbody>
                      </table>
                    </div>

                    {data.comment && (
                      <div className="mb-3">
                        <strong>Notes: </strong>
                        <span>{data.comment}</span>
                      </div>
                    )}

                    {!allDishesCompleted && (
                      <div className="text-end">
                        <Button variant="primary" className="btn btn-sm btn-icon" size="sm" onClick={() => updateAllDishStatus(data._id)}>
                          <CsLineIcons icon="check-square" /> Mark All Completed
                        </Button>
                      </div>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Col>
      </Row>
    </>
  );
};

export default ViewKots;

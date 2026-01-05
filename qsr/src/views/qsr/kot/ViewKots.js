import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { toast } from 'react-toastify';

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
  const [loading, setLoading] = useState({
    initial: true,
    updatingDish: false,
    updatingAllDishes: false,
  });
  const [error, setError] = useState('');
  const [updatingDishId, setUpdatingDishId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchOrderData = async () => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));
      setError('');
      const response = await axios.get(`${process.env.REACT_APP_API}/kot/show?order_source=QSR`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setKotData(response.data.data);
    } catch (err) {
      console.log('Error fetching order data:', err);
      setError('Failed to fetch KOT data. Please try again.');
      toast.error('Failed to load KOTs.');
    } finally {
      setLoading((prev) => ({ ...prev, initial: false }));
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  const updateDishStatus = async (orderId, dishId) => {
    try {
      setUpdatingDishId(dishId);
      await axios.put(
        `${process.env.REACT_APP_API}/kot/dish/update-status`,
        { orderId, dishId, status: 'Completed' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Dish marked as completed!');
      fetchOrderData();
    } catch (err) {
      console.log('Error updating dish status:', err);
      toast.error('Failed to update dish status.');
    } finally {
      setUpdatingDishId(null);
    }
  };

  const updateAllDishStatus = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      await axios.put(
        `${process.env.REACT_APP_API}/kot/dish/update-all-status`,
        { orderId, status: 'Completed' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('All dishes marked as completed!');
      fetchOrderData();
    } catch (err) {
      console.log('Error updating all dish statuses:', err);
      toast.error('Failed to update dishes.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Search filter
  const filteredKOTs = kotData.filter(
    (kot) =>
      kot.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kot.order_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kot.token?.toString().includes(searchTerm)
  );

  if (loading.initial) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="d-flex justify-contentent-between">
              <div className="page-title-container mb-4">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </div>
              <div>Date: {new Date().toLocaleDateString('en-IN')}</div>
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading KOTs...</h5>
              <p className="text-muted">Please wait while we fetch kitchen orders</p>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="d-flex justify-content-between">
            <div className="page-title-container mb-4">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <div>
              <span>Date:</span> <span className='fw-bold fs-5'>{new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
              <Button variant="outline-danger" size="sm" className="ms-3" onClick={fetchOrderData}>
                Retry
              </Button>
            </Alert>
          )}

          <Form className="mb-4">
            <Row className="align-items-center justify-content-between">
              <Col md={4}>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Search by customer, type, or token..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <div
                      className="position-absolute"
                      style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                      onClick={() => setSearchTerm('')}
                    >
                      <CsLineIcons icon="close" size="14" className="text-muted" />
                    </div>
                  )}
                </div>
              </Col>
              <Col md={4} className="d-flex align-items-center justify-content-end">
                <div>Pending Dishes to Complete : </div>
                <div className="mx-2 fs-3 fw-bold">
                  {loading.initial ? (
                    <Spinner animation="border" size="sm" className="ms-2" />
                  ) : (
                    filteredKOTs.reduce((total, kot) => total + kot.order_items.filter((item) => item.status === 'Preparing').length, 0)
                  )}
                </div>
              </Col>
            </Row>
          </Form>

          {filteredKOTs.length === 0 ? (
            <Row className="justify-content-center my-5">
              <Col xs={12} md={8} lg={6} className="text-center">
                <div className="py-5">
                  <CsLineIcons icon="inbox" size="48" className="text-muted mb-3" />
                  <h5>No KOTs Found</h5>
                  <p className="text-muted">{searchTerm ? `No KOTs matching "${searchTerm}"` : 'No kitchen orders available'}</p>
                </div>
              </Col>
            </Row>
          ) : (
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
                        {(data.order_type === 'Takeaway' || data.order_type === 'Delivery') && (
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
                                      <div className="position-relative">
                                        <Button
                                          size="sm"
                                          className="btn btn-sm btn-icon"
                                          variant="outline-success"
                                          onClick={() => updateDishStatus(data._id, dish._id)}
                                          title="Mark as Completed"
                                          disabled={updatingDishId === dish._id}
                                        >
                                          {updatingDishId === dish._id ? (
                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                          ) : (
                                            <CsLineIcons icon="check" />
                                          )}
                                        </Button>
                                      </div>
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
                          <Button
                            variant="primary"
                            className="btn btn-sm btn-icon"
                            size="sm"
                            onClick={() => updateAllDishStatus(data._id)}
                            disabled={updatingOrderId === data._id}
                          >
                            {updatingOrderId === data._id ? (
                              <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <CsLineIcons icon="check-square" /> Mark All Completed
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      <div>
                        Order source: <strong>{data.order_source}</strong>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          {/* Full page loader for bulk updates */}
          {updatingOrderId && (
            <div
              className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 9999,
                backdropFilter: 'blur(2px)',
              }}
            >
              <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
                <Card.Body className="text-center p-4">
                  <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                  <h5 className="mb-0">Updating Dishes...</h5>
                  <small className="text-muted">Please wait a moment</small>
                </Card.Body>
              </Card>
            </div>
          )}
        </Col>
      </Row>
    </>
  );
};

export default ViewKots;

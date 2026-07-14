import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Alert, Table, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { toast } from 'react-toastify';

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.25rem !important;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05) !important;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .glass-card:hover { 
    transform: translateY(-5px); 
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.1) !important;
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
  .token-badge {
    background: #23b3f4 !important;
    color: #fff !important;
    font-weight: 800;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3);
  }
  
  /* Toggle Switch */
  .kot-toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .kot-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }
  .kot-toggle-slider {
    position: absolute;
    inset: 0;
    background: #e2e8f0;
    border-radius: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .kot-toggle-slider::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    left: 3px;
    top: 3px;
    background: #fff;
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .kot-toggle.completed .kot-toggle-slider {
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
  }
  .kot-toggle.completed .kot-toggle-slider::before {
    transform: translateX(20px);
  }
  .kot-toggle.loading .kot-toggle-slider {
    background: #cbd5e1;
  }

  /* Mobile Optimizations */
  @media (max-width: 768px) {
    .mobile-header-stats {
      margin-top: 1rem;
      border-top: 1px solid rgba(0,0,0,0.05);
      padding-top: 1rem;
    }
  }
`;

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const fetchOrderData = async () => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));
      setError('');
      const response = await axios.get(`${process.env.REACT_APP_API}/kot/show?order_source=Manager,Captain,QSR`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Response:', response);
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

  const updateDishStatus = async (orderSource, orderId, dishId, status = 'Completed') => {
    try {
      setUpdatingDishId(dishId);
      await axios.put(
        `${process.env.REACT_APP_API}/kot/dish/update-status`,
        { orderSource, orderId, dishId, status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success(status === 'Completed' ? 'Dish marked as completed!' : 'Dish updated!');
      fetchOrderData();
    } catch (err) {
      console.log('Error updating dish status:', err);
      toast.error('Failed to update dish status.');
    } finally {
      setUpdatingDishId(null);
    }
  };

  const handleDishToggle = (data, dish) => {
    if (dish.status === 'Completed') {
      updateDishStatus(data.order_source, data._id, dish._id, 'Preparing');
      return;
    }

    if (dish.status !== 'Preparing') return;

    const pendingItems = data.order_items.filter((item) => item.special_notes !== 'Parcel Charge' && item.status !== 'Completed');

    if (pendingItems.length === 1 && pendingItems[0]._id === dish._id) {
      setConfirmData({ orderSource: data.order_source, orderId: data._id, dishId: dish._id, type: 'SINGLE' });
      setShowConfirmModal(true);
    } else {
      updateDishStatus(data.order_source, data._id, dish._id, 'Completed');
    }
  };

  const handleCompleteAll = (orderSource, orderId) => {
    setConfirmData({ orderSource, orderId, type: 'ALL' });
    setShowConfirmModal(true);
  };

  const updateAllDishStatus = async (orderSource, orderId) => {
    try {
      setUpdatingOrderId(orderId);
      await axios.put(
        `${process.env.REACT_APP_API}/kot/dish/update-all-status`,
        { orderSource, orderId, status: 'Completed' },
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

  const pendingItemsCount = filteredKOTs.reduce((total, kot) => total + kot.order_items.filter((item) => item.status === 'Preparing').length, 0);

  if (loading.initial) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: '#23b3f4' }} />
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      {/* Header Section */}
      <div className="qsr-page-title-container dashboard-title-container text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="auto" className="text-md-end mt-3 mt-md-0 mobile-header-stats">
            <div className="text-muted fw-bold d-flex align-items-center justify-content-md-end">
              <span className="me-2">Date:</span>
              <span className="text-dark">{new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </Col>
        </Row>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4 d-flex align-items-center justify-content-between" style={{ borderRadius: '1rem' }}>
          <div>
            <CsLineIcons icon="error" className="me-2" />
            {error}
          </div>
          <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={fetchOrderData}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Controls Section */}
      <Row className="mb-4 align-items-center">
        <Col xs="12" md="6" lg="4" className="mb-3 mb-md-0">
          <div className="shadow-sm rounded-pill bg-white border d-flex align-items-center px-3" style={{ height: '45px' }}>
            <CsLineIcons icon="search" size="18" className="text-primary opacity-75" />
            <Form.Control
              type="text"
              placeholder="Search KOTs by customer, type, or token..."
              className="border-0 bg-transparent shadow-none flex-grow-1 ms-2"
              style={{ fontSize: '14px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="cursor-pointer text-muted px-1" onClick={() => setSearchTerm('')}>
                <CsLineIcons icon="close" size="14" />
              </div>
            )}
          </div>
        </Col>
        <Col xs="12" md="6" lg="8" className="text-md-end">
          <div className="d-inline-flex align-items-center bg-white shadow-sm border rounded-pill px-4 py-2">
            <span className="text-muted fw-bold small text-uppercase letter-spacing-1 me-2">Pending Items:</span>
            <span className="h4 mb-0 fw-800 text-primary">{pendingItemsCount}</span>
          </div>
        </Col>
      </Row>

      {/* KOT Cards Section */}
      {filteredKOTs.length === 0 ? (
        <Card className="border-0 glass-card py-5 text-center">
          <Card.Body>
            <CsLineIcons icon="inbox" size="48" className="text-muted mb-3" />
            <h5 className="fw-bold">No Active KOTs</h5>
            <p className="text-muted">{searchTerm ? `No KOTs matching "${searchTerm}"` : 'No kitchen orders available'}</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {filteredKOTs.map((data) => {
            const allDishesCompleted = data.order_items.every((dish) => dish.status === 'Completed');

            return (
              <Col md={6} lg={4} key={data._id}>
                <Card className="border-0 glass-card h-100">
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <div>
                        <h5 className="fw-bold mb-0 text-primary">{data.order_type}</h5>
                        {data.order_type === 'Dine In' ? (
                          <div className="text-muted small fw-bold mt-1">
                            {data.customer_name || 'Guest'}
                            <div className="text-primary mt-1" style={{ fontSize: '0.8rem' }}>
                              Area: {data.table_area || 'Default'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted small fw-bold mt-1">{data.customer_name || 'Guest'}</div>
                        )}
                      </div>
                      {data.order_type === 'Dine In' ? (
                        <div className="token-badge" style={{ fontSize: '0.9rem', fontWeight: '800' }}>
                          T-{data.table_no}
                        </div>
                      ) : (
                        <div className="token-badge">#{data.token}</div>
                      )}
                    </div>

                    <div className="table-responsive flex-grow-1 mb-4">
                      <Table borderless size="sm" className="align-middle mb-0">
                        <thead>
                          <tr className="text-muted border-bottom" style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px' }}>
                            <th className="px-0 pb-2">ITEM</th>
                            <th className="text-center pb-2">QTY</th>
                            <th className="text-end px-0 pb-2">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.order_items.map((dish, index) =>
                            dish.special_notes !== 'Parcel Charge' ? (
                              <tr key={dish._id || index} className="border-bottom-light">
                                <td className="px-0 py-3 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                  {dish.dish_name}
                                  {((dish.selected_variant && dish.selected_variant.size_name) ||
                                    (Array.isArray(dish.selected_addons) && dish.selected_addons.filter((a) => a && a.addon_name).length > 0)) && (
                                    <div
                                      style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', marginTop: '2px', lineHeight: 1.2, whiteSpace: 'normal' }}
                                    >
                                      {dish.selected_variant && (dish.selected_variant.size_name || dish.selected_variant.extra) && (
                                        <>
                                          {dish.selected_variant.size_name ? `Size: ${dish.selected_variant.size_name}` : ''}
                                          {dish.selected_variant.extra && ` (${dish.selected_variant.extra})`}
                                        </>
                                      )}
                                      {dish.selected_variant &&
                                        dish.selected_variant.size_name &&
                                        Array.isArray(dish.selected_addons) &&
                                        dish.selected_addons.filter((a) => a && a.addon_name).length > 0 &&
                                        ' • '}
                                      {Array.isArray(dish.selected_addons) &&
                                        dish.selected_addons
                                          .filter((a) => a && a.addon_name)
                                          .map((addon) => addon.addon_name)
                                          .join(' • ')}
                                    </div>
                                  )}
                                </td>
                                <td className="text-center fw-bold text-dark">{dish.quantity}</td>
                                <td className="text-end px-0">
                                  <label
                                    className={`kot-toggle ${dish.status === 'Completed' ? 'completed' : ''} ${updatingDishId === dish._id ? 'loading' : ''}`}
                                    title={dish.status === 'Completed' ? 'Mark as preparing' : 'Mark as done'}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={dish.status === 'Completed'}
                                      disabled={updatingDishId === dish._id}
                                      onChange={() => handleDishToggle(data, dish)}
                                    />
                                    <span className="kot-toggle-slider" />
                                  </label>
                                </td>
                              </tr>
                            ) : null
                          )}
                        </tbody>
                      </Table>
                    </div>

                    {data.comment && <div className="mb-4 p-3 bg-light rounded small fw-bold text-muted border">Note: {data.comment}</div>}

                    <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <div className="small text-muted fw-bold">
                        Source: <span className="text-dark">{data.order_source}</span>
                      </div>
                      {!allDishesCompleted && (
                        <Button
                          className="custom-btn-outline py-2 px-3"
                          style={{ fontSize: '0.8rem' }}
                          onClick={() => handleCompleteAll(data.order_source, data._id)}
                          disabled={updatingOrderId === data._id}
                        >
                          {updatingOrderId === data._id ? <Spinner size="sm" /> : 'Complete KOT'}
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Full page loader for bulk updates */}
      {updatingOrderId && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999,
            backdropFilter: 'blur(2px)',
          }}
        >
          <Card className="shadow-lg border-0" style={{ minWidth: '200px', borderRadius: '1.5rem' }}>
            <Card.Body className="text-center p-4">
              <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
              <h5 className="mb-0 fw-bold">Updating KOT Status...</h5>
              <small className="text-muted">Please wait a moment</small>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Confirmation Modal for Last Item */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        contentClassName="border-0 shadow-lg"
        style={{ borderRadius: '1.5rem' }}
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>
            Complete KOT?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <p className="text-muted fw-bold mb-0">
            {confirmData?.type === 'SINGLE'
              ? 'This is the last pending item. Marking it as completed will complete the entire KOT. Do you want to proceed?'
              : 'Are you sure you want to mark the entire KOT and all its items as completed?'}
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="custom-btn-outline border-0 text-muted" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            className="custom-btn-outline"
            onClick={() => {
              if (confirmData) {
                if (confirmData.type === 'SINGLE') {
                  updateDishStatus(confirmData.orderSource, confirmData.orderId, confirmData.dishId);
                } else {
                  updateAllDishStatus(confirmData.orderSource, confirmData.orderId);
                }
              }
              setShowConfirmModal(false);
            }}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ViewKots;

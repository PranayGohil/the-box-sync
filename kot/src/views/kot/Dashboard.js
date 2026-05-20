import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Table, Modal } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { useSocket } from 'contexts/SocketContext';
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
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 1rem;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3);
    text-align: center;
    padding: 5px;
    line-height: 1.1;
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

  /* Laptop View Optimization: Decrease gap between header and title */
  @media (min-width: 992px) {
    .page-title-container {
     margin-top: 0rem !important;
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
    }
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
    { to: '', title: 'Manage KOTs' },
  ];

  const { socket } = useSocket();
  const [kotData, setKotData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState({
    initial: true,
    updatingDish: false,
    updatingAllDishes: false,
  });
  const [updatingDishId, setUpdatingDishId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const fetchOrderData = async () => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));
      const response = await axios.get(`${process.env.REACT_APP_API}/kot/show`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setKotData(response.data.data);
    } catch (err) {
      console.log('Error fetching order data:', err);
    } finally {
      setLoading((prev) => ({ ...prev, initial: false }));
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  useEffect(() => {
    if (!socket) return () => {};
    socket.on('kot_update', () => {
      fetchOrderData();
    });
    return () => {
      socket.off('kot_update');
    };
  }, [socket]);

  const updateDishStatus = async (orderSource, orderId, dishId) => {
    try {
      setUpdatingDishId(dishId);
      await axios.put(
        `${process.env.REACT_APP_API}/kot/dish/update-status`,
        { orderSource, orderId, dishId, status: 'Completed' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      toast.success('Dish completed!');
      fetchOrderData();
    } catch (err) {
      toast.error('Failed to update.');
    } finally {
      setUpdatingDishId(null);
    }
  };

  const updateAllDishStatus = async (orderSource, orderId) => {
    try {
      setUpdatingOrderId(orderId);
      await axios.put(
        `${process.env.REACT_APP_API}/kot/dish/update-all-status`,
        { orderSource, orderId, status: 'Completed' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      toast.success('KOT completed!');
      fetchOrderData();
    } catch (err) {
      toast.error('Failed to update.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDishToggle = (data, dish) => {
    if (dish.status !== 'Preparing') return;
    
    const pendingItems = data.order_items.filter(item => item.special_notes !== 'Parcel Charge' && item.status !== 'Completed');
    
    if (pendingItems.length === 1 && pendingItems[0]._id === dish._id) {
      setConfirmData({ orderSource: data.order_source, orderId: data._id, dishId: dish._id, type: 'SINGLE' });
      setShowConfirmModal(true);
    } else {
      updateDishStatus(data.order_source, data._id, dish._id);
    }
  };

  const handleCompleteAll = (orderSource, orderId) => {
    setConfirmData({ orderSource, orderId, type: 'ALL' });
    setShowConfirmModal(true);
  };

  const filteredKOTs = kotData.filter(
    (kot) =>
      kot.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kot.order_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kot.token?.toString().includes(searchTerm)
  );

  const pendingItemsCount = filteredKOTs.reduce((t, k) => t + k.order_items.filter((i) => i.status === 'Preparing').length, 0);

  if (loading.initial) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: '#23b3f4' }} />
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5 mb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      {/* Header Section aligned with QSR */}
      <div className="page-title-container dashboard-title-container mb-4 mt-4 mt-lg-2 text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>
              {title}
            </h1>
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

      {/* Controls Section */}
      <Row className="mb-4 align-items-center">
        <Col xs="12" md="6" lg="4" className="mb-3 mb-md-0">
          <div className="shadow-sm rounded-pill bg-white border d-flex align-items-center px-3" style={{ height: '45px' }}>
            <CsLineIcons icon="search" size="18" className="text-primary opacity-75" />
            <Form.Control
              type="text"
              placeholder="Search KOTs..."
              className="border-0 bg-transparent shadow-none flex-grow-1 ms-2"
              style={{ fontSize: '14px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {filteredKOTs.map((kot) => {
            const allCompleted = kot.order_items.every((i) => i.status === 'Completed');
            return (
              <Col md={6} lg={4} key={kot._id}>
                <Card className="border-0 glass-card h-100">
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <div>
                        <h5 className="fw-bold mb-0 text-primary">{kot.order_type}</h5>
                        <div className="text-muted small fw-bold mt-1">
                          {kot.customer_name || 'Guest'}
                          {kot.order_type === 'Dine In' && kot.table_area && (
                            <span className="ms-2 badge bg-light text-muted fw-bold">Area: {kot.table_area}</span>
                          )}
                        </div>
                      </div>
                      <div className="token-badge">{kot.order_type === 'Dine In' && kot.table_no ? `T-${kot.table_no}` : `#${kot.token}`}</div>
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
                          {kot.order_items.map((item) =>
                            item.special_notes !== 'Parcel Charge' ? (
                              <tr key={item._id} className="border-bottom-light">
                                <td className="px-0 py-3 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                  {item.dish_name}
                                </td>
                                <td className="text-center fw-bold text-dark">{item.quantity}</td>
                                <td className="text-end px-0">
                                  <label
                                    className={`kot-toggle ${item.status === 'Completed' ? 'completed' : ''} ${updatingDishId === item._id ? 'loading' : ''}`}
                                    title={item.status === 'Completed' ? 'Completed' : 'Mark as done'}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.status === 'Completed'}
                                      disabled={item.status === 'Completed' || updatingDishId === item._id}
                                      onChange={() => handleDishToggle(kot, item)}                                    />
                                    <span className="kot-toggle-slider" />
                                  </label>
                                </td>
                              </tr>
                            ) : null
                          )}
                        </tbody>
                      </Table>
                    </div>

                    {kot.comment && <div className="mb-4 p-3 bg-light rounded small fw-bold text-muted border">Note: {kot.comment}</div>}

                    <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                      <div className="small text-muted fw-bold">
                        Source: <span className="text-primary">{kot.order_source}</span>
                      </div>
                      {!allCompleted && (
                        <div style={{ width: '60%' }}>
                          <Button
                            className="custom-btn-outline w-100 py-2"
                            onClick={() => handleCompleteAll(kot.order_source, kot._id)}                            disabled={updatingOrderId === kot._id}
                          >
                            {updatingOrderId === kot._id ? <Spinner size="sm" /> : 'Mark KOT Complete'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Confirmation Modal for Last Item / All Items */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered contentClassName="border-0 shadow-lg" style={{ borderRadius: '1.5rem' }}>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>Complete KOT?</Modal.Title>
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
          <Button className="custom-btn-outline" onClick={() => {
            if (confirmData) {
              if (confirmData.type === 'SINGLE') {
                updateDishStatus(confirmData.orderSource, confirmData.orderId, confirmData.dishId);
              } else {
                updateAllDishStatus(confirmData.orderSource, confirmData.orderId);
              }
            }
            setShowConfirmModal(false);
          }}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ViewKots;

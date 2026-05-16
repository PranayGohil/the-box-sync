import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Alert, Table } from 'react-bootstrap';
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
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07) !important;
    transition: transform 0.3s ease;
  }
  .glass-card:hover { transform: translateY(-5px); }
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
    padding: 0.75rem 1.25rem;
    border-radius: 50px;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3);
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

  const fetchOrderData = async () => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));
      const response = await axios.get(`${process.env.REACT_APP_API}/kot/show?order_source=QSR`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setKotData(response.data.data);
    } catch (err) {
      setError('Failed to fetch KOT data.');
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
      await axios.put(`${process.env.REACT_APP_API}/kot/dish/update-status`, { orderId, dishId, status: 'Completed' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Dish completed!');
      fetchOrderData();
    } catch (err) {
      toast.error('Failed to update.');
    } finally {
      setUpdatingDishId(null);
    }
  };

  const updateAllDishStatus = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      await axios.put(`${process.env.REACT_APP_API}/kot/dish/update-all-status`, { orderId, status: 'Completed' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('KOT completed!');
      fetchOrderData();
    } catch (err) {
      toast.error('Failed to update.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredKOTs = kotData.filter(kot => 
    kot.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kot.order_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kot.token?.toString().includes(searchTerm)
  );

  const brandColor = '#23b3f4';

  if (loading.initial) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" style={{ color: brandColor }} />
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      
      <div className="page-title-container mb-4">
        <Row className="align-items-center">
          <Col xs="12" md="7">
            <h1 className="mb-0 pb-0 fw-800" style={{ color: brandColor, fontSize: '1.5rem' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="5" className="text-end text-muted fw-bold">
            Date: {new Date().toLocaleDateString('en-IN')}
          </Col>
        </Row>
      </div>

      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div className="shadow-sm rounded-pill bg-white border d-flex align-items-center px-3" style={{ height: '44px', width: '350px' }}>
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
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted fw-bold">Pending Items:</span>
          <span className="h4 mb-0 fw-800 text-primary">
            {filteredKOTs.reduce((t, k) => t + k.order_items.filter(i => i.status === 'Preparing').length, 0)}
          </span>
        </div>
      </div>

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
            const allCompleted = kot.order_items.every(i => i.status === 'Completed');
            return (
              <Col md={6} lg={4} key={kot._id}>
                <Card className="border-0 glass-card h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <div>
                        <h5 className="fw-bold mb-0 text-primary">{kot.order_type}</h5>
                        <div className="text-muted small fw-bold mt-1">{kot.customer_name || 'Guest'}</div>
                      </div>
                      <div className="token-badge">#{kot.token}</div>
                    </div>

                    <div className="table-responsive mb-4">
                      <Table borderless size="sm" className="align-middle">
                        <thead>
                          <tr className="text-muted text-small text-uppercase border-bottom">
                            <th className="px-0">Item</th>
                            <th className="text-center">Qty</th>
                            <th className="text-end px-0">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kot.order_items.map((item) => (
                            <tr key={item._id} className="border-bottom-light">
                              <td className="px-0 py-2 fw-bold">{item.dish_name}</td>
                              <td className="text-center fw-bold">{item.quantity}</td>
                              <td className="text-end px-0">
                                {item.status === 'Preparing' ? (
                                  <Button 
                                    variant="outline-success" 
                                    className="p-0 rounded-circle d-inline-flex align-items-center justify-content-center" 
                                    style={{ width: '28px', height: '28px' }} 
                                    onClick={() => updateDishStatus(kot._id, item._id)} 
                                    disabled={updatingDishId === item._id}
                                  >
                                    {updatingDishId === item._id ? <Spinner size="sm" /> : <CsLineIcons icon="check" size="16" />}
                                  </Button>
                                ) : (
                                  <span className="text-success"><CsLineIcons icon="check-circle" size="18" /></span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {kot.comment && <div className="mb-4 p-2 bg-light rounded small fw-bold text-muted">Note: {kot.comment}</div>}

                    {!allCompleted && (
                      <Button className="custom-btn-outline w-100 py-2" onClick={() => updateAllDishStatus(kot._id)} disabled={updatingOrderId === kot._id}>
                        {updatingOrderId === kot._id ? <Spinner size="sm" /> : 'Mark KOT Complete'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default ViewKots;

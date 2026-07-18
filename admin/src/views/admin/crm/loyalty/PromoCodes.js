import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Modal, Table, Badge, Spinner, InputGroup } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const PromoCodes = () => {
  const [codes, setCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCodeId, setCurrentCodeId] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxDiscountAmount: '',
    freeItemDescription: '',
    activationDate: '',
    expiryDate: '',
    isActive: true
  });


  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${process.env.REACT_APP_API}/promocodes/list`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCodes(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load promo code');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleOpenModal = (code = null) => {
    if (code) {
      setIsEditing(true);
      setCurrentCodeId(code._id);
      setFormData({
        code: code.code,
        discountType: code.discountType,
        discountValue: code.discountValue || '',
        minOrderValue: code.minOrderValue || '',
        maxDiscountAmount: code.maxDiscountAmount || '',
        freeItemDescription: code.freeItemDescription || '',
        activationDate: code.activationDate ? new Date(code.activationDate).toISOString().split('T')[0] : '',
        expiryDate: code.expiryDate ? new Date(code.expiryDate).toISOString().split('T')[0] : '',
        isActive: code.isActive
      });
    } else {
      setIsEditing(false);
      setCurrentCodeId(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderValue: '',
        maxDiscountAmount: '',
        freeItemDescription: '',
        activationDate: '',
        expiryDate: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code) {
      toast.error('Please enter a promo code string');
      return;
    }
    if ((formData.discountType === 'percentage' || formData.discountType === 'flat') && !formData.discountValue) {
      toast.error('Please enter a discount value');
      return;
    }
    if ((formData.discountType === 'bogo' || formData.discountType === 'free_item') && !formData.freeItemDescription) {
      toast.error('Please describe the free item');
      return;
    }

    try {
      const payload = { ...formData };
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isEditing) {
        const res = await axios.put(`${process.env.REACT_APP_API}/promocodes/${currentCodeId}`, payload, config);
        if (res.data.success) {
          toast.success('Promo code updated successfully');
          setShowModal(false);
          fetchPromoCodes();
        }
      } else {
        const res = await axios.post(`${process.env.REACT_APP_API}/promocodes`, payload, config);
        if (res.data.success) {
          toast.success('Promo code created successfully');
          setShowModal(false);
          fetchPromoCodes();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving promo code');
    }
  };

  const toggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${process.env.REACT_APP_API}/promocodes/toggle/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Status updated');
        fetchPromoCodes();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deleteCode = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return; // eslint-disable-line no-alert
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${process.env.REACT_APP_API}/promocodes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Promo code deleted');
        fetchPromoCodes();
      }
    } catch (err) {
      toast.error('Failed to delete promo code');
    }
  };

  const renderDiscountBadge = (item) => {
    if (item.discountType === 'percentage') return <Badge className="badge-percentage px-3 py-2 fs-6 border-0">{item.discountValue}% OFF</Badge>;
    if (item.discountType === 'flat') return <Badge className="badge-flat px-3 py-2 fs-6 border-0">₹{item.discountValue} OFF</Badge>;
    if (item.discountType === 'bogo') return <Badge className="badge-bogo px-3 py-2 fs-6 border-0">BOGO: {item.freeItemDescription}</Badge>;
    if (item.discountType === 'free_item') return <Badge className="badge-free px-3 py-2 fs-6 border-0">FREE: {item.freeItemDescription}</Badge>;
    return null;
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 crm-text-heading">Promo Code</h2>
          <p className="text-muted mb-0">Create advanced discount codes and BOGO offers</p>
        </div>
        <Button
          className="crm-custom-btn-primary d-flex align-items-center gap-2"
          onClick={() => handleOpenModal()}
        >
          <CsLineIcons icon="plus" size="15" />
          <span>Create Promo Code</span>
        </Button>
      </div>

      {/* Main Content */}
      <Card className="crm-card border-0 shadow-sm p-4">
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <CsLineIcons icon="tag" size="48" className="mb-3 opacity-50" />
            <h5>No Promo Code Found</h5>
            <p>Create your first promo code to start offering discounts.</p>
          </div>
        ) : (
          <>
            <Table responsive hover className="align-middle crm-table d-none d-md-table">
              <thead>
                <tr>
                  <th className="text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Promo Code</th>
                  <th className="text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Reward</th>
                  <th className="text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Conditions</th>
                  <th className="text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Status</th>
                  <th className="text-uppercase text-muted text-end" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {codes.map((item) => (
                  <tr key={item._id}>
                    <td className="text-nowrap">
                      <div className="fw-bold text-primary" style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>
                        {item.code}
                      </div>
                    </td>
                    <td className="text-nowrap">
                      {renderDiscountBadge(item)}
                    </td>
                    <td className="text-nowrap">
                      {item.minOrderValue > 0 ? (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                          Min order: <b>₹{item.minOrderValue}</b>
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>No minimum</span>
                      )}
                      {item.discountType === 'percentage' && item.maxDiscountAmount > 0 && (
                        <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                          Max discount: <b>₹{item.maxDiscountAmount}</b>
                        </div>
                      )}
                    </td>
                    <td className="text-nowrap">
                      <Form.Check
                        type="switch"
                        id={`switch-${item._id}`}
                        checked={item.isActive}
                        onChange={() => toggleStatus(item._id)}
                        className="crm-switch m-0"
                      />
                    </td>
                    <td className="text-end text-nowrap">
                      <button type="button" className="action-btn edit me-2" onClick={() => handleOpenModal(item)}>
                        <CsLineIcons icon="edit" size="16" />
                      </button>
                      <button type="button" className="action-btn delete" onClick={() => deleteCode(item._id)}>
                        <CsLineIcons icon="bin" size="16" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-block d-md-none">
              {codes.map((item) => (
                <div key={item._id} className="border rounded-3 p-3 mb-3 bg-white shadow-sm position-relative">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-bold text-primary" style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>
                      {item.code}
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="action-btn edit p-1" onClick={() => handleOpenModal(item)}>
                        <CsLineIcons icon="edit" size="16" />
                      </button>
                      <button type="button" className="action-btn delete p-1" onClick={() => deleteCode(item._id)}>
                        <CsLineIcons icon="bin" size="16" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-2">
                    {renderDiscountBadge(item)}
                  </div>
                  <div className="mb-2">
                    {item.minOrderValue > 0 ? (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Min order: <b>₹{item.minOrderValue}</b>
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>No minimum</span>
                    )}
                    {item.discountType === 'percentage' && item.maxDiscountAmount > 0 && (
                      <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                        Max discount: <b>₹{item.maxDiscountAmount}</b>
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                    <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status</span>
                    <Form.Check
                      type="switch"
                      id={`switch-mobile-${item._id}`}
                      checked={item.isActive}
                      onChange={() => toggleStatus(item._id)}
                      className="crm-switch m-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Builder Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold crm-text-heading">
            {isEditing ? 'Edit Promo Code' : 'Build Promo Code'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-2 pb-4">
            <Row className="g-4">

              {/* Left Column: Basic Info */}
              <Col md={6}>
                <div className="p-3 bg-light rounded-3 h-100 border">
                  <h6 className="fw-bold mb-3 text-primary"><CsLineIcons icon="tag" size="15" className="me-2" />Code Details</h6>

                  <Form.Group className="mb-3">
                    <Form.Label className="crm-form-label text-xs">CODE STRING</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. SUMMER20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                      className="crm-form-control fw-bold text-primary"
                      style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="crm-form-label text-xs">PROMO TYPE</Form.Label>
                    <Form.Select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value, discountValue: '', freeItemDescription: '' })}
                      className="crm-form-select"
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="flat">Flat Discount Amount (₹)</option>
                      <option value="bogo">Buy One Get One (BOGO)</option>
                      <option value="free_item">Free Item on Order</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Dynamic Reward Value */}
                  {(formData.discountType === 'percentage' || formData.discountType === 'flat') && (
                    <Form.Group>
                      <Form.Label className="crm-form-label text-xs">
                        {formData.discountType === 'percentage' ? 'DISCOUNT PERCENTAGE' : 'DISCOUNT AMOUNT'}
                      </Form.Label>
                      <InputGroup>
                        {formData.discountType === 'flat' && <InputGroup.Text className="bg-white border-end-0">₹</InputGroup.Text>}
                        <Form.Control
                          type="number"
                          placeholder={formData.discountType === 'percentage' ? "e.g. 20" : "e.g. 150"}
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                          min="1"
                          max={formData.discountType === 'percentage' ? "100" : undefined}
                          className={`crm-form-control ${formData.discountType === 'flat' ? 'border-start-0 ps-0' : ''}`}
                        />
                        {formData.discountType === 'percentage' && <InputGroup.Text className="bg-white border-start-0">%</InputGroup.Text>}
                      </InputGroup>
                    </Form.Group>
                  )}

                  {(formData.discountType === 'bogo' || formData.discountType === 'free_item') && (
                    <Form.Group>
                      <Form.Label className="crm-form-label text-xs">WHAT DO THEY GET FOR FREE?</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Free Garlic Bread"
                        value={formData.freeItemDescription}
                        onChange={(e) => setFormData({ ...formData, freeItemDescription: e.target.value })}
                        className="crm-form-control"
                      />
                      <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Briefly describe the free item. The cashier will see this when the code is applied.
                      </Form.Text>
                    </Form.Group>
                  )}
                </div>
              </Col>

              {/* Right Column: Conditions */}
              <Col md={6}>
                <div className="p-3 bg-light rounded-3 h-100 border">
                  <h6 className="fw-bold mb-3 text-warning"><CsLineIcons icon="shield" size="15" className="me-2" />Rules & Conditions</h6>

                  <Form.Group className="mb-3">
                    <Form.Label className="crm-form-label text-xs">MINIMUM ORDER AMOUNT (OPTIONAL)</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white border-end-0">₹</InputGroup.Text>
                      <Form.Control
                        type="number"
                        placeholder="e.g. 500"
                        value={formData.minOrderValue}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        min="0"
                        className="crm-form-control border-start-0 ps-0"
                      />
                    </InputGroup>
                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Cart subtotal must exceed this value for code to work.
                    </Form.Text>
                  </Form.Group>

                  {formData.discountType === 'percentage' && (
                    <Form.Group className="mb-3">
                      <Form.Label className="crm-form-label text-xs">MAXIMUM DISCOUNT CAP (OPTIONAL)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">₹</InputGroup.Text>
                        <Form.Control
                          type="number"
                          placeholder="e.g. 100"
                          value={formData.maxDiscountAmount}
                          onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                          min="0"
                          className="crm-form-control border-start-0 ps-0"
                        />
                      </InputGroup>
                      <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Limit the maximum amount they can save with this percentage.
                      </Form.Text>
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label className="crm-form-label text-xs">ACTIVATION DATE (OPTIONAL)</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.activationDate}
                      onChange={(e) => setFormData({ ...formData, activationDate: e.target.value })}
                      className="crm-form-control"
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Code will not work before this date.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="crm-form-label text-xs">EXPIRY DATE (OPTIONAL)</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="crm-form-control"
                    />
                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Code will not work after this date.
                    </Form.Text>
                  </Form.Group>

                </div>
              </Col>

            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowModal(false)} className="rounded-pill px-4 fw-bold">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-pill px-5 shadow-sm fw-bold">
              {isEditing ? 'Save Changes' : 'Create Promo Code'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .badge-percentage {
          background-color: rgba(30, 168, 231, 0.1) !important;
          color: #1ea8e7 !important;
        }
        .badge-flat {
          background-color: rgba(34, 197, 94, 0.1) !important;
          color: #22c55e !important;
        }
        .badge-bogo {
          background-color: rgba(245, 158, 11, 0.1) !important;
          color: #f59e0b !important;
        }
        .badge-free {
          background-color: rgba(139, 92, 246, 0.1) !important;
          color: #8b5cf6 !important;
        }
        .crm-card {
          border-radius: 20px;
          background: #ffffff;
        }
        .crm-text-heading { color: #1e293b; }
        .crm-form-label {
          font-weight: 700;
          color: #64748b;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }
        .text-xs { font-size: 0.75rem; }
        .crm-form-control, .crm-form-select {
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          height: 38px;
          padding: 0 1rem;
          font-weight: 500;
        }
        .crm-form-control:focus, .crm-form-select:focus {
          border-color: #1ea8e7;
          box-shadow: 0 0 0 3px rgba(30, 168, 231, 0.15);
          background: #ffffff;
        }
        .input-group-text {
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          color: #64748b;
          font-weight: 600;
        }
        .crm-custom-btn-primary {
          background: #ffffff !important;
          border: 2px solid #2db5e4 !important;
          border-radius: 50px !important;
          padding: 0.6rem 1.5rem !important;
          font-weight: 600 !important;
          color: #2db5e4 !important;
          transition: all 0.2s;
        }
        .crm-custom-btn-primary:hover {
          background: #2db5e4 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(45, 181, 228, 0.2);
        }
        .crm-switch .form-check-input {
          width: 3rem;
          height: 1.5rem;
          cursor: pointer;
        }
        .crm-switch .form-check-input:checked {
          background-color: #2db5e4;
          border-color: #2db5e4;
        }
        .action-btn {
          background: none;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .action-btn.edit { color: #1ea8e7; }
        .action-btn.edit:hover { background: rgba(30, 168, 231, 0.1); }
        .action-btn.delete { color: #ef4444; }
        .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); }
      `}</style>
    </>
  );
};

export default PromoCodes;

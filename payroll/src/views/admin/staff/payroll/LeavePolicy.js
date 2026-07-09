import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getLeavePolicy, updateLeavePolicy } from 'api/payrollConfig';
import Select from 'react-select';
import axios from 'axios';

const LeavePolicy = () => {
  const title = 'Leave Policy Configuration';
  const description = 'Define leave types, accrual rules, and carry-forward logic for your organization.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'staff/view', text: 'Staff' },
    { to: 'staff/leave-policy', text: 'Leave Policy' },
  ];

  const payTypeOptions = [
    { value: 'true', label: 'Paid Leave' },
    { value: 'false', label: 'Unpaid Leave (LWP)' }
  ];

  const accrualOptions = [
    { value: 'upfront', label: 'Upfront (All days credited at year start)' },
    { value: 'monthly', label: 'Monthly (Pro-rated per month)' }
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [modalBranch, setModalBranch] = useState({ value: null, label: 'Global / All Branches' });

  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [form, setForm] = useState({
    leave_type_id: '',
    name: '',
    short_code: '',
    days_per_year: 0,
    is_paid: true,
    accrual_type: 'monthly',
    carry_forward: false,
    max_carry_forward: 0,
    color: '#1ea8e7',
  });

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API}/branch/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setBranches(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch branches', err);
    }
  };

  const fetchPolicy = async (branchId = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = branchId 
        ? `${process.env.REACT_APP_API}/leave-policy?branch_id=${branchId}`
        : `${process.env.REACT_APP_API}/leave-policy`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setLeaveTypes(res.data.data.leave_types || []);
      }
    } catch (err) {
      toast.error('Failed to fetch leave policy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchPolicy();
  }, []);

  const handleShowModal = (index = null) => {
    setModalBranch(selectedBranch || { value: null, label: 'Global / All Branches' });
    if (index !== null) {
      setEditingIndex(index);
      setForm({ ...leaveTypes[index] });
    } else {
      setEditingIndex(null);
      setForm({
        leave_type_id: `lt_${Date.now()}`,
        name: '',
        short_code: '',
        days_per_year: 12,
        is_paid: true,
        accrual_type: 'monthly',
        carry_forward: false,
        max_carry_forward: 0,
        color: '#1ea8e7',
      });
    }
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const targetBranchId = modalBranch?.value || null;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // 1. Fetch target branch's existing policy list
      const getUrl = targetBranchId 
        ? `${process.env.REACT_APP_API}/leave-policy?branch_id=${targetBranchId}`
        : `${process.env.REACT_APP_API}/leave-policy`;
      const getRes = await axios.get(getUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let targetLeaveTypes = [];
      if (getRes.data && getRes.data.success && getRes.data.data) {
        targetLeaveTypes = getRes.data.data.leave_types || [];
      }

      const isSameBranch = (selectedBranch?.value || null) === targetBranchId;

      if (editingIndex !== null) {
        if (isSameBranch) {
          // Edit in place
          targetLeaveTypes[editingIndex] = { ...form };
        } else {
          // Branch has changed:
          // A. Remove from the current filtered branch policy
          const updatedCurrent = [...leaveTypes];
          updatedCurrent.splice(editingIndex, 1);
          const currentBranchId = selectedBranch?.value || '';
          const currentPutUrl = currentBranchId 
            ? `${process.env.REACT_APP_API}/leave-policy?branch_id=${currentBranchId}`
            : `${process.env.REACT_APP_API}/leave-policy`;
          
          await axios.put(currentPutUrl, { leave_types: updatedCurrent }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // B. Add/Update in target branch policy
          const existingIdx = targetLeaveTypes.findIndex(lt => lt.leave_type_id === form.leave_type_id);
          if (existingIdx >= 0) {
            targetLeaveTypes[existingIdx] = { ...form };
          } else {
            targetLeaveTypes.push({ ...form });
          }
        }
      } else {
        // Add new
        targetLeaveTypes.push({ ...form });
      }

      // 2. Save the target branch's policy
      const putUrl = targetBranchId 
        ? `${process.env.REACT_APP_API}/leave-policy?branch_id=${targetBranchId}`
        : `${process.env.REACT_APP_API}/leave-policy`;
      
      const res = await axios.put(putUrl, { leave_types: targetLeaveTypes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.success) {
        toast.success('Leave policy updated');
        // Refresh the current filter view
        fetchPolicy(selectedBranch?.value || null);
        setShowModal(false);
      }
    } catch (err) {
      toast.error('Failed to save leave policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Delete this leave type? Active leave requests may be affected.')) return;
    const updated = [...leaveTypes];
    updated.splice(index, 1);
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const branchId = selectedBranch?.value || '';
      const url = branchId 
        ? `${process.env.REACT_APP_API}/leave-policy?branch_id=${branchId}`
        : `${process.env.REACT_APP_API}/leave-policy`;
      
      const res = await axios.put(url, { leave_types: updated }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Leave type deleted');
        setLeaveTypes(res.data.data.leave_types || []);
      }
    } catch (err) {
      toast.error('Failed to delete leave type');
    } finally {
      setSaving(false);
    }
  };

  const customStyles = `
      .leave-policy-glass-card {
        background: #ffffff !important;
        border: 1px solid #edf2f7 !important;
        border-radius: 1.5rem !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        overflow: hidden;
        position: relative !important;
      }
      .leave-policy-glass-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(30, 168, 231, 0.08) !important;
        border-color: rgba(30, 168, 231, 0.2) !important;
      }

      /* All buttons styled premium pill outline matching Manage Tables exactly */
      .leave-policy-custom-btn-outline {
        border: 1px solid #1ea8e7 !important;
        color: #1ea8e7 !important;
        background-color: #fff !important;
        transition: all 0.2s ease-in-out !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        border-radius: 50px !important;
      }
      .leave-policy-custom-btn-outline:hover {
        background-color: #1ea8e7 !important;
        color: #fff !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
      }
      .leave-policy-custom-btn-outline:hover svg {
        stroke: #ffffff !important;
        color: #ffffff !important;
      }

      .leave-policy-custom-btn-solid {
        border: 1px solid #1ea8e7 !important;
        color: #1ea8e7 !important;
        background-color: #fff !important;
        transition: all 0.2s ease-in-out !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        border-radius: 50px !important;
      }
      .leave-policy-custom-btn-solid:hover {
        background-color: #1ea8e7 !important;
        color: #fff !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
      }
      .leave-policy-custom-btn-solid:hover svg {
        stroke: #ffffff !important;
        color: #ffffff !important;
      }
      
      .leave-policy-card-icon-btn {
        width: 36px !important;
        height: 36px !important;
        border-radius: 50% !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s ease !important;
        padding: 0 !important;
        border: 1.5px solid transparent !important;
        background: transparent !important;
        cursor: pointer !important;
      }
      .leave-policy-card-icon-btn.edit-btn {
        border-color: rgba(30, 168, 231, 0.15) !important;
        color: #1ea8e7 !important;
      }
      .leave-policy-card-icon-btn.edit-btn:hover {
        background-color: #1ea8e7 !important;
        color: #ffffff !important;
        transform: scale(1.08);
      }
      .leave-policy-card-icon-btn.delete-btn {
        border-color: rgba(239, 68, 68, 0.15) !important;
        color: #ef4444 !important;
      }
      .leave-policy-card-icon-btn.delete-btn:hover {
        background-color: #ef4444 !important;
        color: #ffffff !important;
        transform: scale(1.08);
      }

      .leave-policy-data-row {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 0.5rem 0 !important;
        font-size: 0.9rem !important;
      }

      /* Form & Modal premium elements */
      .leave-policy-modal .modal-content {
        border-radius: 1.5rem !important;
        border: none !important;
        box-shadow: 0 20px 50px rgba(0,0,0,0.1) !important;
        overflow: hidden;
      }
      
      .leave-policy-modal .modal-header {
        border-bottom: 1px solid #edf2f7 !important;
        padding: 1rem 1.25rem !important;
      }
      @media (min-width: 768px) {
        .leave-policy-modal .modal-header {
          padding: 1.5rem 2rem !important;
        }
      }

      .leave-policy-modal .modal-title {
        font-weight: 800 !important;
        color: #1ea8e7 !important;
        letter-spacing: -0.02em !important;
      }
      
      .leave-policy-modal .modal-body {
        padding: 1.25rem !important;
      }
      @media (min-width: 768px) {
        .leave-policy-modal .modal-body {
          padding: 2rem !important;
        }
      }

      .leave-policy-modal .modal-footer {
        border-top: 1px solid #edf2f7 !important;
        padding: 1rem 1.25rem !important;
      }
      @media (min-width: 768px) {
        .leave-policy-modal .modal-footer {
          padding: 1.25rem 2rem !important;
        }
      }

      @media (max-width: 575.98px) {
        .leave-policy-modal .modal-footer {
          flex-direction: column-reverse;
          gap: 0.5rem;
        }
        .leave-policy-modal .modal-footer button {
          width: 100% !important;
        }
      }

      .leave-policy-input {
        border-radius: 12px !important;
        padding: 0.65rem 1.25rem !important;
        border: 1.5px solid #edf2f7 !important;
        background-color: #f8fafc !important;
        font-weight: 600 !important;
        color: #334155 !important;
        transition: all 0.25s ease-in-out !important;
      }
      .leave-policy-input:focus {
        border-color: #1ea8e7 !important;
        background-color: #ffffff !important;
        box-shadow: 0 0 0 3px rgba(30, 168, 231, 0.15) !important;
        outline: none !important;
      }

      .leave-policy-badge-code {
        padding: 0.35rem 0.6rem !important;
        font-size: 0.85rem !important;
        border-radius: 8px !important;
      }
      @media (min-width: 768px) {
        .leave-policy-badge-code {
          padding: 0.5rem 0.85rem !important;
          font-size: 1rem !important;
          border-radius: 10px !important;
        }
      }

      .leave-policy-title {
        font-size: 1.1rem !important;
        font-weight: 700 !important;
      }
      @media (min-width: 768px) {
        .leave-policy-title {
          font-size: 1.25rem !important;
        }
      }
      
      @media (max-width: 767.98px) {
        .page-title-container {
          margin-top: 1rem !important;
        }
      }
    `;

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4">
        <Row className="g-3 align-items-center">
          <Col xs="12" md="5" lg="5">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="7" lg="7" className="d-flex flex-wrap align-items-center justify-content-md-end gap-3 mt-3 mt-md-0">
            {branches.length > 0 && (
              <div style={{ minWidth: '220px', flex: '1 1 auto', maxWidth: '320px' }} className="w-100 w-sm-auto">
                <Select
                  classNamePrefix="react-select"
                  options={[
                    { value: null, label: 'Global / All Branches' },
                    ...branches.map(b => ({ value: b._id, label: `${b.name} Branch` }))
                  ]}
                  value={selectedBranch || { value: null, label: 'Global / All Branches' }}
                  onChange={(selected) => {
                    setSelectedBranch(selected);
                    fetchPolicy(selected ? selected.value : null);
                  }}
                  placeholder="Select Branch Policy"
                  className="react-select-premium shadow-sm"
                />
              </div>
            )}
            <Button
              variant="none"
              onClick={() => handleShowModal()}
              className="px-4 py-2 rounded-pill d-flex align-items-center justify-content-center leave-policy-custom-btn-outline shadow-sm w-100 w-sm-auto"
              style={{ height: '38px' }}
            >
              <CsLineIcons icon="plus" className="me-2" size="18" stroke="currentColor" />
              <span>Add Leave Type</span>
            </Button>
          </Col>
        </Row>
      </div>

      {loading || saving ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} />
        </div>
      ) : (
        <Row className="g-4">
          {leaveTypes.map((lt, idx) => (
            <Col xs="12" md="6" lg="4" key={lt.leave_type_id || idx}>
              <Card className="leave-policy-glass-card border-0 h-100 shadow-sm" style={{ borderTop: `4px solid ${lt.color || '#1ea8e7'}`, borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="d-flex align-items-center">
                      <Badge
                        bg="none"
                        className="me-3 fw-bold border-0 leave-policy-badge-code"
                        style={{
                          backgroundColor: `${lt.color}15`,
                          color: lt.color,
                        }}
                      >
                        {lt.short_code}
                      </Badge>
                      <span className="text-dark leave-policy-title">{lt.name}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <Button variant="none" className="leave-policy-card-icon-btn edit-btn me-1.5" onClick={() => handleShowModal(idx)} title="Edit">
                        <CsLineIcons icon="edit" size="15" />
                      </Button>
                      <Button variant="none" className="leave-policy-card-icon-btn delete-btn" onClick={() => handleDelete(idx)} title="Delete">
                        <CsLineIcons icon="bin" size="15" />
                      </Button>
                    </div>
                  </div>

                  <div className="leave-policy-data-row">
                    <span className="text-muted fw-bold small">Total Days / Year:</span>
                    <span className="fw-bold text-dark">{lt.days_per_year} Days</span>
                  </div>

                  <div className="leave-policy-data-row align-items-center">
                    <span className="text-muted fw-bold small">Type:</span>
                    <span>
                      {lt.is_paid ? (
                        <Badge
                          bg="none"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            borderRadius: '50px',
                            padding: '0.35rem 0.75rem',
                            fontWeight: '700',
                          }}
                        >
                          Paid Leave
                        </Badge>
                      ) : (
                        <Badge
                          bg="none"
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                            color: '#d97706',
                            border: '1px solid rgba(245, 158, 11, 0.15)',
                            borderRadius: '50px',
                            padding: '0.35rem 0.75rem',
                            fontWeight: '700',
                          }}
                        >
                          Unpaid
                        </Badge>
                      )}
                    </span>
                  </div>

                  <div className="leave-policy-data-row">
                    <span className="text-muted fw-bold small">Accrual Method:</span>
                    <span className="text-capitalize fw-bold text-dark">{lt.accrual_type}</span>
                  </div>

                  <div className="leave-policy-data-row">
                    <span className="text-muted fw-bold small">Carry Forward:</span>
                    <span className="fw-bold text-dark">
                      {lt.carry_forward ? (
                        <Badge
                          bg="none"
                          style={{
                            backgroundColor: 'rgba(30, 168, 231, 0.08)',
                            color: '#1ea8e7',
                            border: '1px solid rgba(30, 168, 231, 0.15)',
                            borderRadius: '50px',
                            padding: '0.35rem 0.75rem',
                            fontWeight: '700',
                          }}
                        >
                          Max: {lt.max_carry_forward}
                        </Badge>
                      ) : (
                        <span className="text-muted fw-medium">Disabled</span>
                      )}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {leaveTypes.length === 0 && (
            <Col xs="12">
              <Card className="leave-policy-glass-card text-center py-5 border-0 shadow-sm">
                <Card.Body className="text-muted py-5">
                  <CsLineIcons icon="book-open" size="48" className="text-muted opacity-50 mb-3" />
                  <h5 className="fw-bold mt-2">No Leave Types Configured</h5>
                  <p className="small mb-0">Click 'Add Leave Type' to configure leave structure for your team.</p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className="leave-policy-modal">
        <Form onSubmit={handleModalSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingIndex !== null ? 'Edit Leave Type' : 'Add Leave Type'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              {branches.length > 0 && (
                <Col xs="12" className="mb-3">
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Branch</Form.Label>
                    <Select
                      classNamePrefix="react-select"
                      options={[
                        { value: null, label: 'Global / All Branches' },
                        ...branches.map(b => ({ value: b._id, label: `${b.name} Branch` }))
                      ]}
                      value={modalBranch}
                      onChange={(selected) => setModalBranch(selected)}
                      placeholder="Select Branch"
                    />
                  </Form.Group>
                </Col>
              )}
              <Col md="6" className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">
                    Leave Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Casual Leave"
                    className="leave-policy-input"
                  />
                </Form.Group>
              </Col>
              <Col md="6" className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">
                    Short Code <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    required
                    value={form.short_code}
                    onChange={(e) => setForm({ ...form, short_code: e.target.value })}
                    placeholder="e.g. CL"
                    maxLength={4}
                    className="text-uppercase leave-policy-input"
                  />
                </Form.Group>
              </Col>
              <Col md="6" className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">
                    Total Days Per Year <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min="0"
                    value={form.days_per_year}
                    onChange={(e) => setForm({ ...form, days_per_year: Number(e.target.value) })}
                    className="leave-policy-input"
                  />
                </Form.Group>
              </Col>
              <Col md="6" className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Pay Type</Form.Label>
                  <Select
                    classNamePrefix="react-select"
                    options={payTypeOptions}
                    value={payTypeOptions.find(opt => opt.value === (form.is_paid ? 'true' : 'false'))}
                    onChange={(selected) => setForm({ ...form, is_paid: selected.value === 'true' })}
                    placeholder="Select Pay Type"
                  />
                </Form.Group>
              </Col>
              <Col md="6" className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Accrual Method</Form.Label>
                  <Select
                    classNamePrefix="react-select"
                    options={accrualOptions}
                    value={accrualOptions.find(opt => opt.value === form.accrual_type)}
                    onChange={(selected) => setForm({ ...form, accrual_type: selected.value })}
                    placeholder="Select Accrual Method"
                  />
                </Form.Group>
              </Col>
              <Col md="6" className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Color Code (UI)</Form.Label>
                  <Form.Control
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    title="Choose your color"
                    className="leave-policy-input"
                    style={{ height: '44px', cursor: 'pointer', padding: '0.35rem 0.75rem' }}
                  />
                </Form.Group>
              </Col>
              <Col xs="12">
                <Form.Group className="mb-3 d-flex align-items-center">
                  <Form.Check
                    type="switch"
                    label="Allow Carry Forward to Next Year"
                    checked={form.carry_forward}
                    onChange={(e) => setForm({ ...form, carry_forward: e.target.checked })}
                    style={{ fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                  />
                </Form.Group>
                {form.carry_forward && (
                  <Form.Group className="ms-4 mb-2 animate__animated animate__fadeIn">
                    <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Max Days to Carry Forward</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={form.max_carry_forward}
                      onChange={(e) => setForm({ ...form, max_carry_forward: Number(e.target.value) })}
                      style={{ width: '150px' }}
                      className="leave-policy-input"
                    />
                  </Form.Group>
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="none" className="leave-policy-custom-btn-outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="none" className="leave-policy-custom-btn-outline" type="submit">
              Update List
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default LeavePolicy;

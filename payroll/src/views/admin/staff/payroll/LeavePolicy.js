import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getLeavePolicy, updateLeavePolicy } from 'api/payrollConfig';
import Select from 'react-select';
import axios from 'axios';
import Holidays from './Holidays';

const LeavePolicy = () => {
  const title = 'Leave Policy';
  const description = 'Define leave types, holiday rules, and weekly off logic for your organization.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'staff/view', text: 'Staff' },
    { to: 'staff/leave-policy', text: 'Leave Policy' },
  ];

  const history = useHistory();

  const [activeTab, setActiveTab] = useState('policy');

  const payTypeOptions = [
    { value: 'true', label: 'Paid Leave' },
    { value: 'false', label: 'Unpaid Leave (LWP)' }
  ];

  const accrualOptions = [
    { value: 'upfront', label: 'Upfront (All days credited at year start)' },
    { value: 'monthly', label: 'Monthly (Pro-rated per month)' }
  ];

  const leaveCycleOptions = [
    { value: 'january', label: 'January (Jan - Dec)' },
    { value: 'april', label: 'April (Apr - Mar)' }
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [modalBranch, setModalBranch] = useState({ value: null, label: 'Global / All Branches' });

  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    leave_type_id: '',
    name: '',
    short_code: '',
    days_per_year: 0,
    is_paid: true,
    accrual_type: 'monthly',
    leave_cycle_start: 'january',
    carry_forward: false,
    max_carry_forward: 0,
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
    setLoading(true);
    try {
      const res = await getLeavePolicy(branchId);
      if (res.data && res.data.success && res.data.data) {
        setLeaveTypes(res.data.data.leave_types || []);
      } else {
        setLeaveTypes([]);
      }
    } catch (err) {
      toast.error('Failed to load leave policy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchPolicy();
  }, []);

  const handleShowModal = (index = null) => {
    if (index !== null) {
      const lt = leaveTypes[index];
      setEditingIndex(index);
      setForm({
        leave_cycle_start: 'january',
        ...lt,
      });
    } else {
      setEditingIndex(null);
      setForm({
        leave_type_id: '',
        name: '',
        short_code: '',
        days_per_year: 0,
        is_paid: true,
        accrual_type: 'monthly',
        leave_cycle_start: 'january',
        carry_forward: false,
        max_carry_forward: 0,
      });
    }
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updated = [...leaveTypes];
    if (editingIndex !== null) {
      updated[editingIndex] = form;
    } else {
      const newId = form.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      updated.push({ ...form, leave_type_id: form.leave_type_id || newId });
    }

    try {
      const token = localStorage.getItem('token');
      const branchId = selectedBranch?.value || '';
      const url = branchId
        ? `${process.env.REACT_APP_API}/leave-policy?branch_id=${branchId}`
        : `${process.env.REACT_APP_API}/leave-policy`;

      const res = await axios.put(url, { leave_types: updated }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        toast.success('Leave policy updated');
        fetchPolicy(selectedBranch?.value || null);
        setShowModal(false);
      }
    } catch (err) {
      toast.error('Failed to save leave policy');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteLeaveType = (index) => {
    setIndexToDelete(index);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (indexToDelete === null) return;
    setDeleting(true);
    const updated = [...leaveTypes];
    updated.splice(indexToDelete, 1);

    try {
      const token = localStorage.getItem('token');
      const branchId = selectedBranch?.value || '';
      const url = branchId
        ? `${process.env.REACT_APP_API}/leave-policy?branch_id=${branchId}`
        : `${process.env.REACT_APP_API}/leave-policy`;

      const res = await axios.put(url, { leave_types: updated }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Leave type deleted successfully');
        setLeaveTypes(res.data.data.leave_types || []);
        setShowDeleteModal(false);
        setIndexToDelete(null);
      }
    } catch (err) {
      toast.error('Failed to delete leave type');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container-fluid px-lg-4 px-xl-5 pb-5">
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4">
        <Row className="g-3 align-items-center">
          <Col xs="12" lg="4" xl="4">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7', whiteSpace: 'nowrap' }}>
              {title}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" lg="8" xl="8" className="d-flex flex-wrap flex-lg-nowrap justify-content-lg-end align-items-center gap-2">
            <Button
              variant="outline-primary"
              onClick={() => history.push('/staff/holidays')}
              className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm flex-grow-1 flex-sm-grow-0 flex-shrink-0"
              style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              <CsLineIcons icon="calendar" size="16" />
              <span>Holidays</span>
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => history.push('/staff/week-off')}
              className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm flex-grow-1 flex-sm-grow-0 flex-shrink-0"
              style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              <CsLineIcons icon="clock" size="16" />
              <span>Week Off</span>
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => handleShowModal()}
              className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm flex-grow-1 flex-sm-grow-0 flex-shrink-0"
              style={{ height: '38px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              <CsLineIcons icon="plus" size="16" />
              <span>Add Leave Type</span>
            </Button>
            <div style={{ minWidth: '170px' }} className="flex-grow-1 flex-sm-grow-0 flex-shrink-0">
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
                placeholder="Select Branch"
                isSearchable={false}
                className="react-select-premium shadow-sm"
                menuPortalTarget={document.body}
                styles={{
                  container: (base) => ({ ...base, minWidth: '170px' }),
                  control: (base) => ({ ...base, borderRadius: '20px', minHeight: '38px' }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>
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
                  <Card className="leave-policy-glass-card border-0 h-100 shadow-sm" style={{ borderTop: '4px solid #1ea8e7', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <div className="d-flex align-items-center">
                          <Badge
                            bg="none"
                            className="me-3 fw-bold border-0 leave-policy-badge-code"
                            style={{
                              backgroundColor: 'rgba(30, 168, 231, 0.1)',
                              color: '#1ea8e7',
                            }}
                          >
                            {lt.short_code}
                          </Badge>
                          <span className="text-dark leave-policy-title">{lt.name}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="btn-icon btn-icon-only rounded-circle shadow-sm me-1"
                            onClick={() => handleShowModal(idx)}
                            title="Edit Leave Type"
                          >
                            <CsLineIcons icon="edit" size="14" />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="btn-icon btn-icon-only rounded-circle shadow-sm"
                            onClick={() => confirmDeleteLeaveType(idx)}
                            title="Delete Leave Type"
                          >
                            <CsLineIcons icon="bin" size="14" />
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
                        <span className="text-muted fw-bold small">Leave Cycle:</span>
                        <span className="fw-bold text-dark">
                          {lt.leave_cycle_start === 'april' ? 'April (Apr - Mar)' : 'January (Jan - Dec)'}
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
                  <Form.Label className="small fw-bold text-muted text-uppercase ms-1 mb-2">Leave Cycle</Form.Label>
                  <Select
                    classNamePrefix="react-select"
                    options={leaveCycleOptions}
                    value={leaveCycleOptions.find(opt => opt.value === (form.leave_cycle_start || 'january'))}
                    onChange={(selected) => setForm({ ...form, leave_cycle_start: selected ? selected.value : 'january' })}
                    placeholder="Select Leave Cycle"
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
            <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="rounded-pill px-4" type="submit">
              {editingIndex !== null ? 'Save Changes' : 'Add Leave Type'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !deleting && setShowDeleteModal(false)} centered size="sm">
        <Modal.Body className="p-4 text-center">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: '56px', height: '56px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
          >
            <CsLineIcons icon="bin" size="24" />
          </div>
          <h5 className="fw-bold mb-2">Delete Leave Type?</h5>
          <p className="text-muted small mb-4">
            Are you sure you want to delete <strong className="text-dark">{indexToDelete !== null && leaveTypes[indexToDelete]?.name}</strong>? Active leave requests may be affected.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Button
              variant="light"
              className="rounded-pill px-4 fw-bold border"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="rounded-pill px-4 fw-bold shadow-sm"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? <Spinner size="sm" animation="border" /> : 'Delete'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LeavePolicy;

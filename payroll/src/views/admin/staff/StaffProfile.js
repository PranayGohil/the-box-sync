import React, { useEffect, useState } from 'react';
import { useParams, NavLink, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, Row, Col, Card, Nav, Tab, Spinner, Alert, Form, Table, Badge, Modal } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import useCustomLayout from 'hooks/useCustomLayout';
import { LAYOUT } from 'constants.js';
import axios from 'axios';
import { format } from 'date-fns';
import { enIN } from 'date-fns/locale';

import DeleteStaffModal from './DeleteStaffModal';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .profile-photo-wrapper {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    padding: 5px;
    background: linear-gradient(135deg, #1ea8e7 0%, #007bff 100%);
    margin-bottom: 1.5rem;
    box-shadow: 0 10px 25px rgba(30, 168, 231, 0.2);
  }
  .profile-photo-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #fff;
    padding: 3px;
    overflow: hidden;
  }
  .profile-photo-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-danger-outline {
    border: 1px solid #ef4444 !important;
    color: #ef4444 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-danger-outline:hover {
    background-color: #ef4444 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2) !important;
  }
  .nav-pills-premium .nav-link {
    border-radius: 12px !important;
    padding: 0.8rem 1.25rem !important;
    color: #64748b !important;
    font-weight: 600 !important;
    margin-bottom: 0.5rem !important;
    transition: all 0.2s ease !important;
    border: 1px solid transparent !important;
  }
  .nav-pills-premium .nav-link.active {
    background: #f0f9ff !important;
    color: #1ea8e7 !important;
    border: 1px solid #bae6fd !important;
  }
  .info-label {
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }
  .info-value {
    color: #1e293b;
    font-weight: 600;
    font-size: 1rem;
  }
  .doc-card {
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid #eef2f6;
    transition: all 0.3s ease;
  }
  .doc-card:hover {
    border-color: #1ea8e7;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  }
`;

const StaffProfile = () => {
  const { id } = useParams();
  const history = useHistory();

  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [globalLeavePolicies, setGlobalLeavePolicies] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const title = 'Staff Profile';
  const description = 'Staff Profile Details';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'staff', text: 'Staff' },
    { to: `staff/${id}`, text: 'Profile' },
  ];

  useCustomLayout({ layout: LAYOUT.Boxed });

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return format(d, 'dd MMMM, yyyy', { locale: enIN });
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${process.env.REACT_APP_API}/staff/get/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStaff(res.data.data);

      try {
        const [balRes, leavePolicyRes, expenseRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API}/leave/balances?staff_id=${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get(`${process.env.REACT_APP_API}/leave-policy`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get(`${process.env.REACT_APP_API}/expenses/staff/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        
        if (balRes.data.success && balRes.data.data.length > 0) {
          setLeaveBalances(balRes.data.data[0].balances || []);
        } else {
          setLeaveBalances([]);
        }

        if (leavePolicyRes?.data?.success && leavePolicyRes?.data?.data?.leave_types) {
          setGlobalLeavePolicies(leavePolicyRes.data.data.leave_types);
        }

        if (expenseRes?.data?.success) {
          setExpenses(expenseRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching leave balances/policies:', err);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to fetch staff details. Please try again.');
      toast.error('Failed to fetch staff.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [id]);

  const handleDeleteSuccess = () => {
    history.push('/staff/view');
  };

  const [sendingLetter, setSendingLetter] = useState(false);

  const handleSendJoiningLetter = async () => {
    try {
      setSendingLetter(true);
      const res = await axios.post(`${process.env.REACT_APP_API}/staff/send-joining-letter/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Joining letter sent successfully!');
      } else {
        toast.error(res.data.message || 'Failed to send joining letter.');
      }
    } catch (err) {
      console.error('Error sending joining letter:', err);
      toast.error(err.response?.data?.message || 'Error sending joining letter. Please check if the template is set in Payroll Settings.');
    } finally {
      setSendingLetter(false);
    }
  };

  const handleToggleSpecificLeave = async (leave_type_id, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const res = await axios.put(`${process.env.REACT_APP_API}/staff/toggle-specific-leave/${id}`, {
        leave_type_id,
        is_active: newStatus
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setStaff(res.data.data);
        toast.success(res.data.message);
      }
    } catch (err) {
      console.error('Error toggling specific leave:', err);
      toast.error('Failed to update leave status');
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5 mt-5">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="container-fluid py-5 text-center">
        <Alert variant="danger" className="glass-card border-0 p-5 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
          <CsLineIcons icon="error" className="text-danger mb-3" size="48" />
          <h4 className="fw-bold mb-3">{error || 'Staff Not Found'}</h4>
          <Button className="custom-btn-outline px-4" onClick={() => history.push('/staff/view')}>
            <CsLineIcons icon="arrow-left" className="me-2" size="18" /> Back to Staff List
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-5">
        <Row className="g-3 align-items-center">
          <Col md={6}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
              {staff.f_name} {staff.l_name}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md={6} className="d-flex flex-wrap justify-content-md-end align-items-center gap-2">
            <Button
              className="custom-btn-outline px-4 py-2 d-flex align-items-center gap-2"
              onClick={() => history.goBack()}
            >
              <CsLineIcons icon="arrow-left" size="18" /> <span>Back</span>
            </Button>
            <Button
              className="custom-btn-outline px-4 py-2 d-flex align-items-center gap-2"
              onClick={handleSendJoiningLetter}
              disabled={sendingLetter || !staff.email}
              title={!staff.email ? "Staff member does not have an email address" : "Send Joining Letter PDF via Email"}
            >
              {sendingLetter ? <Spinner size="sm" animation="border" /> : <CsLineIcons icon="email" size="18" />}
              <span>Send Joining Letter</span>
            </Button>
            <Button className="custom-btn-outline px-4 py-2 d-flex align-items-center gap-2" as={NavLink} to={`/staff/edit/${id}`}>
              <CsLineIcons icon="edit-square" size="18" /> <span>Edit Profile</span>
            </Button>
            <Button
              className="custom-btn-danger-outline px-4 py-2 d-flex align-items-center gap-2"
              onClick={() => {
                setShowDeleteModal(true);
                setStaffToDelete(staff);
              }}
            >
              <CsLineIcons icon="bin" size="18" /> <span>Delete</span>
            </Button>
          </Col>
        </Row>
      </div>

      <Tab.Container id="staffProfileTabs" defaultActiveKey="personal">
        <Row className="g-4">
          {/* Sidebar */}
          <Col xl={3}>
            <Card className="glass-card border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <div className="d-flex flex-column align-items-center text-center">
                  <div className="profile-photo-wrapper">
                    <div className="profile-photo-inner">
                      {!staff.photo ? (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                          <CsLineIcons icon="user" size="48" />
                        </div>
                      ) : (
                        <img
                          src={`${process.env.REACT_APP_UPLOAD_DIR}${staff.photo}`}
                          alt="profile"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <h4 className="fw-bold mb-1 text-dark">{staff.f_name} {staff.l_name}</h4>
                  <div className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill mb-3" style={{ fontSize: '0.8rem' }}>
                    {staff.position}
                  </div>
                  <div className="text-muted small d-flex align-items-center gap-1 mb-4">
                    <CsLineIcons icon="pin" size="14" />
                    <span>{staff.city}, {staff.state}</span>
                  </div>
                </div>

                <Nav variant="pills" className="flex-column nav-pills-premium">
                  <Nav.Item>
                    <Nav.Link eventKey="personal" className="d-flex align-items-center gap-2">
                      <CsLineIcons icon="user" size="18" /> Personal Details
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="documents" className="d-flex align-items-center gap-2">
                      <CsLineIcons icon="file-text" size="18" /> Documents & ID
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="leave" className="d-flex align-items-center gap-2">
                      <CsLineIcons icon="calendar" size="18" /> Leave Information
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="expenses" className="d-flex align-items-center gap-2">
                      <CsLineIcons icon="coin" size="18" /> Expenses
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Content Area */}
          <Col xl={9}>
            <Tab.Content>
              {/* Personal Details Tab */}
              <Tab.Pane eventKey="personal">
                {staff.resignation && staff.resignation.status && staff.resignation.status !== 'none' && (
                  <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '1.5rem', borderLeft: `5px solid ${staff.resignation.status === 'approved' ? '#10b981' : staff.resignation.status === 'rejected' ? '#ef4444' : '#f59e0b'}`, background: staff.resignation.status === 'approved' ? '#f0fdf4' : staff.resignation.status === 'rejected' ? '#fef2f2' : '#fffbeb' }}>
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className={`p-2 rounded-3 bg-white text-${staff.resignation.status === 'approved' ? 'success' : staff.resignation.status === 'rejected' ? 'danger' : 'warning'} shadow-sm`}>
                          <CsLineIcons icon="warning-hexagon" size="20" />
                        </div>
                        <h5 className="fw-bold mb-0 text-dark">Resignation / Exit Details</h5>
                      </div>
                      
                      <div className="mb-3">
                        <span className="fw-bold text-uppercase small text-muted d-block mb-1" style={{ fontSize: '0.65rem' }}>Approval Status</span>
                        <Badge bg={staff.resignation.status === 'approved' ? 'success' : staff.resignation.status === 'rejected' ? 'danger' : 'warning'} className="px-3 py-2 rounded-pill text-uppercase">
                          {staff.resignation.status}
                        </Badge>
                      </div>

                      <Row className="g-3">
                        <Col md={12}>
                          <div className="info-label text-muted" style={{ fontSize: '0.65rem' }}>Reason for Exit</div>
                          <div className="text-dark fw-bold">{staff.resignation.reason || 'No reason provided'}</div>
                        </Col>
                        <Col md={4}>
                          <div className="info-label text-muted" style={{ fontSize: '0.65rem' }}>Submitted On</div>
                          <div className="text-dark fw-bold">{formatDate(staff.resignation.submitted_on)}</div>
                        </Col>
                        <Col md={4}>
                          <div className="info-label text-muted" style={{ fontSize: '0.65rem' }}>Notice Period</div>
                          <div className="text-dark fw-bold">{staff.resignation.notice_period_days} Days</div>
                        </Col>
                        {staff.resignation.last_working_day && (
                          <Col md={4}>
                            <div className="info-label text-muted" style={{ fontSize: '0.65rem' }}>Last Working Day</div>
                            <div className="text-danger fw-bold">{formatDate(staff.resignation.last_working_day)}</div>
                          </Col>
                        )}
                        {staff.resignation.admin_remarks && (
                          <Col md={12} className="mt-2">
                            <div className="info-label text-muted" style={{ fontSize: '0.65rem' }}>Admin remarks / reason</div>
                            <div className="text-dark fw-semibold" style={{ fontSize: '0.9rem' }}>{staff.resignation.admin_remarks}</div>
                          </Col>
                        )}
                      </Row>
                    </Card.Body>
                  </Card>
                )}
                <Card className="glass-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="user" className="text-primary" size="20" />
                      </div>
                      <h5 className="fw-bold mb-0">Employment & Contact Information</h5>
                    </div>
                    
                    <Row className="g-4 mb-4">
                      <Col md={4}>
                        <div className="info-label">Staff ID</div>
                        <div className="info-value">#{staff.staff_id}</div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">Position</div>
                        <div className="info-value">{staff.position}</div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">Current Salary</div>
                        <div className="info-value text-primary">₹{staff.salary?.toLocaleString('en-IN')}</div>
                      </Col>
                    </Row>

                    <Row className="g-4 mb-4">
                      <Col md={4}>
                        <div className="info-label">Joining Date</div>
                        <div className="info-value">{formatDate(staff.joining_date)}</div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">Birth Date</div>
                        <div className="info-value">{formatDate(staff.birth_date)}</div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">Phone Number</div>
                        <div className="info-value">{staff.phone_no}</div>
                      </Col>
                    </Row>

                    <Row className="g-4">
                      <Col md={4}>
                        <div className="info-label">Email Address</div>
                        <div className="info-value">{staff.email}</div>
                      </Col>
                      <Col md={8}>
                        <div className="info-label">Residential Address</div>
                        <div className="info-value">{staff.address}, {staff.city}, {staff.state}, {staff.country}</div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Bank & Statutory Information Card */}
                <Card className="glass-card border-0 shadow-sm mt-4">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="wallet" className="text-primary" size="20" />
                      </div>
                      <h5 className="fw-bold mb-0">Bank & Compliance Details</h5>
                    </div>
                    
                    <Row className="g-4 mb-4">
                      <Col md={4}>
                        <div className="info-label">Account Number</div>
                        <div className="info-value fw-bold">{staff.bank_account?.account_number || '-'}</div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">Bank Name</div>
                        <div className="info-value">{staff.bank_account?.bank_name || '-'}</div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">Branch & IFSC</div>
                        <div className="info-value">{staff.bank_account?.ifsc_code ? `${staff.bank_account.branch} (${staff.bank_account.ifsc_code})` : '-'}</div>
                      </Col>
                    </Row>

                    <Row className="g-4">
                      <Col md={4}>
                        <div className="info-label">PAN Number</div>
                        <div className="info-value fw-bold">{staff.pan_number || '-'}</div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">PF / UAN Number</div>
                        <div className="info-value fw-bold">{staff.uan_number || '-'}</div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

              </Tab.Pane>

              {/* Leave Information Tab */}
              <Tab.Pane eventKey="leave">
                <Card className="glass-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-soft-success p-2 rounded-3">
                          <CsLineIcons icon="calendar" className="text-success" size="20" />
                        </div>
                        <h5 className="fw-bold mb-0">Leave Information</h5>
                      </div>
                    </div>
                    
                    {globalLeavePolicies.length > 0 ? (
                      <Row className="g-3">
                        {globalLeavePolicies.map((policy) => {
                          const currentConfig = staff.leave_policy_configuration?.find(c => c.leave_type_id === policy.leave_type_id);
                          const isActive = currentConfig ? currentConfig.is_active : false;
                          const bal = leaveBalances.find(b => b.leave_type_id === policy.leave_type_id) || {};
                          
                          return (
                          <Col md={6} key={policy.leave_type_id}>
                            <div className={`border rounded-3 p-3 bg-light h-100 ${!isActive ? 'opacity-50' : ''}`}>
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                  <h6 className="fw-bold mb-1 text-primary">{policy.name}</h6>
                                  <div className="text-muted small">{policy.days_per_year} Days / Year</div>
                                </div>
                                <Button 
                                  variant={isActive ? "outline-danger" : "outline-success"} 
                                  size="sm"
                                  className="rounded-pill fw-bold"
                                  onClick={() => handleToggleSpecificLeave(policy.leave_type_id, isActive)}
                                >
                                  {isActive ? 'Disable' : 'Enable'}
                                </Button>
                              </div>
                              
                              <div className="d-flex justify-content-between mt-3 px-2 bg-white rounded p-2 border">
                                <div className="text-center">
                                  <div className="info-label mb-0" style={{ fontSize: '0.65rem' }}>Used</div>
                                  <div className="fw-bold text-dark">{bal.taken || 0}</div>
                                </div>
                                <div className="text-center">
                                  <div className="info-label mb-0" style={{ fontSize: '0.65rem' }}>Pending</div>
                                  <div className="fw-bold text-warning">{bal.pending || 0}</div>
                                </div>
                                <div className="text-center">
                                  <div className="info-label mb-0" style={{ fontSize: '0.65rem' }}>Balance</div>
                                  <div className="fw-bold text-success">{bal.entitled !== undefined ? ((bal.entitled || 0) + (bal.carried_forward || 0) - (bal.taken || 0) - (bal.pending || 0)) : policy.days_per_year}</div>
                                </div>
                              </div>
                            </div>
                          </Col>
                        )})}
                      </Row>
                    ) : (
                      <div className="text-muted text-center py-4 bg-light rounded border">
                        No leave policies found in the system.
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Documents Tab */}
              <Tab.Pane eventKey="documents">
                <Card className="glass-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="file-text" className="text-primary" size="20" />
                      </div>
                      <h5 className="fw-bold mb-0">Identity Proof & Documents</h5>
                    </div>

                    <Row className="g-4 mb-5">
                      <Col md={6}>
                        <div className="info-label">Document Type</div>
                        <div className="info-value">{staff.document_type || 'Not Specified'}</div>
                      </Col>
                      <Col md={6}>
                        <div className="info-label">ID / Document Number</div>
                        <div className="info-value">{staff.id_number || 'N/A'}</div>
                      </Col>
                    </Row>

                    <h6 className="fw-bold text-muted mb-3 text-uppercase xsmall letter-spacing-1">Document Scans</h6>
                    <Row className="g-4">
                      {staff.front_image && (
                        <Col md={6}>
                          <div className="doc-card bg-light">
                            <div className="p-3 bg-white border-bottom small fw-bold text-muted d-flex align-items-center gap-2">
                              <CsLineIcons icon="file-image" size="14" /> Front Side
                            </div>
                            <img
                              src={`${process.env.REACT_APP_UPLOAD_DIR}${staff.front_image}`}
                              alt="Front ID"
                              className="img-fluid w-100"
                              style={{ height: '240px', objectFit: 'contain', background: '#f8fafc' }}
                            />
                          </div>
                        </Col>
                      )}
                      {staff.back_image && (
                        <Col md={6}>
                          <div className="doc-card bg-light">
                            <div className="p-3 bg-white border-bottom small fw-bold text-muted d-flex align-items-center gap-2">
                              <CsLineIcons icon="file-image" size="14" /> Back Side
                            </div>
                            <img
                              src={`${process.env.REACT_APP_UPLOAD_DIR}${staff.back_image}`}
                              alt="Back ID"
                              className="img-fluid w-100"
                              style={{ height: '240px', objectFit: 'contain', background: '#f8fafc' }}
                            />
                          </div>
                        </Col>
                      )}
                      {!staff.front_image && !staff.back_image && (
                        <Col xs={12}>
                          <div className="text-center py-5 border rounded-4 bg-light opacity-50">
                            <CsLineIcons icon="info-circle" size="32" className="mb-2" />
                            <p className="mb-0">No document images uploaded for this staff member.</p>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Expenses Tab */}
              <Tab.Pane eventKey="expenses">
                <Card className="glass-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-soft-primary p-2 rounded-3">
                          <CsLineIcons icon="wallet" className="text-primary" size="20" />
                        </div>
                        <h5 className="fw-bold mb-0">Expense Claims</h5>
                      </div>
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="table-responsive d-none d-lg-block">
                      <Table hover className="react-table-modern mb-0">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Date</th>
                            <th className="text-end">Amount</th>
                            <th className="text-center">Receipt</th>
                            <th className="text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-4 text-muted border-bottom-0">
                                No expenses found for this staff member.
                              </td>
                            </tr>
                          ) : (
                            expenses.map(exp => (
                              <tr key={exp._id}>
                                <td className="fw-bold">{exp.category}</td>
                                <td>{exp.date}</td>
                                <td className="text-end fw-bold text-dark">₹{exp.amount}</td>
                                <td className="text-center">
                                  {exp.receipt ? (
                                    <a href={`${process.env.REACT_APP_UPLOAD_DIR}${exp.receipt}`} target="_blank" rel="noreferrer">
                                      <Button variant="link" size="sm" className="p-0"><CsLineIcons icon="image" size="18" /></Button>
                                    </a>
                                  ) : '-'}
                                </td>
                                <td className="text-center">
                                  <Badge bg={exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'danger' : 'warning'} className="px-3 py-2 rounded-pill text-uppercase" style={{ fontSize: '0.7rem' }}>
                                    {exp.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="d-lg-none">
                      {expenses.length === 0 ? (
                        <div className="text-center py-4 text-muted bg-light rounded border border-light">
                          No expenses found for this staff member.
                        </div>
                      ) : (
                        expenses.map(exp => (
                          <div key={exp._id} className="mb-3 p-3 border rounded-3 bg-white shadow-sm">
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                              <div className="fw-bold text-dark">{exp.category}</div>
                              <Badge bg={exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'danger' : 'warning'} className="px-2 py-1 rounded-pill text-uppercase" style={{ fontSize: '0.65rem' }}>
                                {exp.status}
                              </Badge>
                            </div>
                            <div className="mb-2 d-flex justify-content-between">
                              <span className="text-muted small">Date:</span>
                              <span className="fw-medium small">{exp.date}</span>
                            </div>
                            <div className="mb-2 d-flex justify-content-between align-items-center">
                              <span className="text-muted small">Amount:</span>
                              <span className="fw-bold text-dark">₹{exp.amount}</span>
                            </div>
                            {exp.receipt && (
                              <div className="text-end pt-2 border-top">
                                <a href={`${process.env.REACT_APP_UPLOAD_DIR}${exp.receipt}`} target="_blank" rel="noreferrer">
                                  <Button variant="link" size="sm" className="p-0 text-primary">
                                    <CsLineIcons icon="image" size="18" className="me-1" /> View Receipt
                                  </Button>
                                </a>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      {showDeleteModal && (
        <DeleteStaffModal
          show={showDeleteModal}
          handleClose={() => {
            setShowDeleteModal(false);
            setStaffToDelete(null);
          }}
          data={staffToDelete}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}

    </div>
  );
};

export default StaffProfile;

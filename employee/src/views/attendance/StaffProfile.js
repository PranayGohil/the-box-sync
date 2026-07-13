import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Row, Col, Card, Nav, Tab, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import axios from 'axios';
import { format } from 'date-fns';
import { enIN } from 'date-fns/locale';

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.85) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04) !important;
    transition: all 0.3s ease;
  }
  .profile-photo-wrapper {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    padding: 5px;
    background: linear-gradient(135deg, #1ea8e7 0%, #0d6efd 100%);
    margin-bottom: 1.5rem;
    box-shadow: 0 10px 25px rgba(30, 168, 231, 0.25);
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
    background: #e0f2fe !important;
    color: #0284c7 !important;
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
  const { currentUser } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [globalLeavePolicies, setGlobalLeavePolicies] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payrollConfig, setPayrollConfig] = useState(null);
  const [error, setError] = useState('');

  const title = 'My Profile';
  const description = 'View your employment details and personal records.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'profile', text: 'My Profile' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return '—';
      return format(d, 'dd/MM/yyyy', { locale: enIN });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '—';
    }
  };

  const fetchStaff = async () => {
    try {
      if (!currentUser?._id) return;
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API}/staff/get/${currentUser._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStaff(res.data.data);

      try {
        const [balRes, leavePolicyRes, expenseRes, configRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API}/leave/balances?staff_id=${currentUser._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API}/leave-policy`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API}/expenses/staff/${currentUser._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API}/payroll-config`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (balRes.data?.success && balRes.data.data?.length > 0) {
          setLeaveBalances(balRes.data.data[0].balances || []);
        } else {
          setLeaveBalances([]);
        }

        if (leavePolicyRes.data?.success && leavePolicyRes.data.data?.leave_types) {
          setGlobalLeavePolicies(leavePolicyRes.data.data.leave_types);
        } else {
          setGlobalLeavePolicies([]);
        }

        setExpenses(expenseRes.data?.data || []);
        setPayrollConfig(configRes.data?.data || null);
      } catch (err) {
        console.error('Error fetching additional details:', err);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to fetch profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentUser]);

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
          <h4 className="fw-bold mb-3">{error || 'Profile Not Found'}</h4>
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
          <Col md={12}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
              My Profile
            </h1>
            <BreadcrumbList items={breadcrumbs} />
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
                    <Nav.Link eventKey="work" className="d-flex align-items-center gap-2">
                      <CsLineIcons icon="money" size="18" /> Work & Salary
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="leave" className="d-flex align-items-center gap-2">
                      <CsLineIcons icon="calendar" size="18" /> Leave Information
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="expenses" className="d-flex align-items-center gap-2">
                      <CsLineIcons icon="wallet" size="18" /> Expenses
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
                <Card className="glass-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-soft-primary p-2 rounded-3" style={{ backgroundColor: 'rgba(30,168,231,0.08)' }}>
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

              {/* Work & Salary Tab */}
              <Tab.Pane eventKey="work">
                <Card className="glass-card border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="clock" className="text-primary" size="20" />
                      </div>
                      <h5 className="fw-bold mb-0">Employment & Payroll Info</h5>
                    </div>
                    
                    <Row className="g-4 mb-4">
                      <Col md={4}>
                        <div className="info-label">Shift Details</div>
                        <div className="info-value">{staff.shift_time?.shift_name || '-'}</div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">Overtime Allowed</div>
                        <div className="info-value">
                          <span className={`badge ${staff.is_overtime_allowed ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'} rounded-pill px-3`}>
                            {staff.is_overtime_allowed ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="info-label">Web Portal Access</div>
                        <div className="info-value">
                          <span className={`badge ${staff.is_web_access ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'} rounded-pill px-3`}>
                            {staff.is_web_access ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="glass-card border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="calendar" className="text-primary" size="20" />
                      </div>
                      <h5 className="fw-bold mb-0">Weekly Off Policy</h5>
                    </div>
                    
                    <Row className="g-4">
                      <Col md={6}>
                        <div className="bg-light rounded-3 p-3 shadow-sm border border-faint h-100">
                          <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Standard Weekly Off</div>
                          <div className="d-flex flex-wrap gap-2">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                              const isOff = staff.weekly_off_policy?.standard_weekly_off?.includes(day);
                              return (
                                <div key={day} className={`px-3 py-2 rounded-2 fw-bold text-center ${isOff ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted border'}`} style={{ fontSize: '0.8rem', minWidth: '80px' }}>
                                  {day.substring(0, 3)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="bg-light rounded-3 p-3 shadow-sm border border-faint h-100">
                          <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Alternating Weekly Off</div>
                          {(!staff.weekly_off_policy?.alternating_weekly_off || staff.weekly_off_policy.alternating_weekly_off.length === 0) ? (
                            <div className="text-muted small">No alternating off days configured.</div>
                          ) : (
                            staff.weekly_off_policy.alternating_weekly_off.map((alt, idx) => (
                              <div key={idx} className="mb-2 p-2 bg-white rounded border d-flex justify-content-between align-items-center">
                                <span className="fw-bold text-dark">{alt.day}</span>
                                <span className="badge bg-soft-primary text-primary px-2 rounded-pill">
                                  {alt.weeks.map(w => `Week ${w}`).join(', ')}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="glass-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-soft-primary p-2 rounded-3">
                        <CsLineIcons icon="money" className="text-primary" size="20" />
                      </div>
                      <h5 className="fw-bold mb-0">Salary Structure Breakdown</h5>
                    </div>
                    
                    <Row className="g-4">
                      <Col md={6}>
                        <div className="bg-light rounded-3 p-3 shadow-sm border border-faint h-100">
                          <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Monthly Earnings</div>
                          {payrollConfig?.custom_earnings?.filter(e => e.is_active).map((earning) => {
                            const val = staff.salary_structure?.custom_earnings?.[earning.id] || 0;
                            return (
                              <div key={earning.id} className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                <span className="small fw-bold opacity-75">{earning.label}</span>
                                <span className="fw-bold text-success">₹{val.toLocaleString('en-IN')}</span>
                              </div>
                            );
                          })}
                          {(!payrollConfig?.custom_earnings || payrollConfig.custom_earnings.filter(e => e.is_active).length === 0) && (
                            <div className="text-muted small">No active earning components defined.</div>
                          )}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="bg-light rounded-3 p-3 shadow-sm border border-faint h-100">
                          <div className="small fw-bold text-muted mb-3 text-uppercase letter-spacing-1">Statutory Deductions</div>
                          <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                            <span className="small fw-bold opacity-75">PF (%)</span>
                            <span className="fw-bold text-danger">{staff.salary_structure?.deductions?.pf_percentage || 0}%</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                            <span className="small fw-bold opacity-75">ESI (%)</span>
                            <span className="fw-bold text-danger">{staff.salary_structure?.deductions?.esi_percentage || 0}%</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                            <span className="small fw-bold opacity-75">PT (Monthly)</span>
                            <span className="fw-bold text-danger">₹{staff.salary_structure?.deductions?.pt || 0}</span>
                          </div>
                          {payrollConfig?.custom_deductions?.filter(d => d.is_active).length > 0 && (
                            <>
                              <div className="small fw-bold text-muted mt-3 mb-2 text-uppercase letter-spacing-1">Custom Deductions</div>
                              {payrollConfig.custom_deductions.filter(d => d.is_active).map((deduction) => {
                                const val = staff.salary_structure?.custom_deductions?.[deduction.id] || 0;
                                return (
                                  <div key={deduction.id} className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                    <span className="small fw-bold opacity-75">{deduction.label}</span>
                                    <span className="fw-bold text-danger">₹{val.toLocaleString('en-IN')}</span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Documents Tab */}
              <Tab.Pane eventKey="documents">
                <Card className="glass-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div className="bg-soft-primary p-2 rounded-3" style={{ backgroundColor: 'rgba(30,168,231,0.08)' }}>
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
                            <p className="mb-0">No document images uploaded.</p>
                          </div>
                        </Col>
                      )}
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
                      <Row className="g-4">
                        {globalLeavePolicies.map(policy => {
                          const bal = leaveBalances.find(b => b.leave_type_id === policy.leave_type_id) || {};
                          return (
                          <Col md={6} xl={4} key={policy.leave_type_id}>
                            <div className="border rounded-4 p-3 bg-light shadow-sm position-relative overflow-hidden h-100 d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="fw-bold text-dark mb-1">{policy.name}</h6>
                                  <div className="text-muted small d-flex align-items-center gap-1">
                                    <CsLineIcons icon="calendar" size="14" /> {policy.days_per_year} Days / Year
                                  </div>
                                </div>
                              </div>
                              
                              <div className="d-flex justify-content-between mt-auto pt-3 px-2 bg-white rounded p-2 border">
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
                                No expenses found.
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
                          No expenses found.
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
    </div>
  );
};

export default StaffProfile;

import React, { useEffect, useState } from 'react';
import { useParams, NavLink, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, Row, Col, Card, Nav, Tab, Spinner, Alert } from 'react-bootstrap';
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
          <Col md={7}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>
              {staff.f_name} {staff.l_name}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md={5} className="d-flex justify-content-md-end gap-2">
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

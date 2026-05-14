import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Glide from 'components/carousel/Glide';
import { toast } from 'react-toastify';

const customStyles = `
  .glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s ease;
  }
  .staff-card {
    background: #ffffff !important;
    border: 1px solid #f1f5f9 !important;
    border-radius: 1.25rem !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    height: 100% !important;
  }
  .staff-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(30, 168, 231, 0.08) !important;
    border-color: #1ea8e7 !important;
  }
  .staff-photo-wrapper {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    padding: 4px;
    background: linear-gradient(135deg, #1ea8e7 0%, #007bff 100%);
    margin-bottom: 1.25rem;
  }
  .staff-photo-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #fff;
    padding: 2px;
    overflow: hidden;
  }
  .staff-photo-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .position-badge {
    background: #f1f5f9;
    color: #64748b;
    padding: 0.25rem 0.75rem;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
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
  .custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .custom-btn-solid {
    background-color: #1ea8e7 !important;
    border: 1px solid #1ea8e7 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
  .custom-btn-solid:hover {
    background-color: #158dc4 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
  }
  .hr-dropdown-toggle::after {
    display: none !important;
  }
  .group-title {
    color: #1ea8e7;
    font-weight: 800;
    letter-spacing: -0.02em;
    position: relative;
    padding-left: 1.25rem;
  }
  .group-title::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 24px;
    background: #1ea8e7;
    border-radius: 2px;
  }
`;

const ViewStaff = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${process.env.REACT_APP_API}/staff/get-all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStaff(response.data.data);
    } catch (err) {
      console.error('Error fetching staff data:', err);
      setError('Failed to fetch staff data. Please try again.');
      toast.error('Failed to fetch staff data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const groupedStaff = staff.reduce((groups, member) => {
    const position = member.position || 'Other';
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(member);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5 mt-5">
        <Spinner animation="border" style={{ color: '#1ea8e7' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5">
        <Alert variant="danger" className="glass-card border-0 p-5 text-center shadow-sm">
          <CsLineIcons icon="error" className="text-danger mb-3" size="48" />
          <h4 className="fw-bold mb-3">Failed to Load Staff</h4>
          <p className="text-muted mb-4">{error}</p>
          <Button className="custom-btn-solid px-5" onClick={fetchStaff}>
            <CsLineIcons icon="refresh" className="me-2" size="18" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      
      <div className="page-title-container mb-5">
        <Row className="g-3 align-items-center">
          <Col md={4}>
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>Manage Staff</h1>
            <div className="text-muted mt-1 small">Overview and management of your restaurant team</div>
          </Col>
          <Col md={8} className="d-flex flex-wrap justify-content-md-end gap-2 align-items-center">
            <Button className="custom-btn-outline px-3 py-2 d-flex align-items-center gap-2" onClick={() => history.push('/staff/add')}>
              <CsLineIcons icon="plus" size="18" /> Add Staff
            </Button>
          </Col>
        </Row>
      </div>

      {Object.keys(groupedStaff).length > 0 ? (
        Object.entries(groupedStaff).map(([position, members]) => (
          <div key={position} className="mb-5">
            <div className="d-flex justify-content-between align-items-end mb-4 px-1">
              <div>
                <h4 className="group-title mb-1 text-uppercase small letter-spacing-1">{position}</h4>
                <div className="text-muted small fw-medium">
                  {members.length} team member{members.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <Glide
              options={{
                gap: 20,
                rewind: false,
                bound: true,
                perView: 6,
                breakpoints: {
                  400: { perView: 1.2 },
                  600: { perView: 2.2 },
                  1024: { perView: 3.2 },
                  1400: { perView: 4.2 },
                  1600: { perView: 5.2 },
                },
                noControls: true,
              }}
            >
              {members.map((staffMember) => (
                <Link to={`/staff/profile/${staffMember._id}`} key={staffMember._id} className="text-decoration-none">
                  <Glide.Item className="h-100 py-3">
                    <Card className="staff-card border-0 shadow-sm">
                      <Card.Body className="p-4 text-center d-flex flex-column align-items-center">
                        <div className="staff-photo-wrapper shadow-sm">
                          <div className="staff-photo-inner">
                            {!staffMember.photo ? (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                                <CsLineIcons icon="user" size="32" />
                              </div>
                            ) : (
                              <img
                                src={`${process.env.REACT_APP_UPLOAD_DIR}${staffMember.photo}`}
                                alt={`${staffMember.f_name} ${staffMember.l_name}`}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                                }}
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="position-badge">{staffMember.position}</div>
                        
                        <h5 className="mb-1 fw-bold text-dark text-truncate w-100 px-2">
                          {staffMember.f_name} {staffMember.l_name}
                        </h5>
                        
                        <div className="mt-3 pt-3 border-top w-100">
                          <div className="text-primary small fw-bold d-flex align-items-center justify-content-center gap-1">
                            <span>View Profile</span>
                            <CsLineIcons icon="chevron-right" size="12" />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Glide.Item>
                </Link>
              ))}
            </Glide>
          </div>
        ))
      ) : (
        <div className="text-center py-5 my-5 glass-card border-0 mx-auto" style={{ maxWidth: '600px' }}>
          <div className="mb-4">
            <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
              <CsLineIcons icon="inbox" size="48" className="text-muted" />
            </div>
            <h3 className="fw-bold text-dark">No Staff Found</h3>
            <p className="text-muted px-5">Your staff list is currently empty. Start building your team by adding your first member.</p>
          </div>
          <Button className="custom-btn-outline px-5 py-2" onClick={() => history.push('/staff/add')}>
            <CsLineIcons icon="plus" className="me-2" size="18" />
            Add First Staff Member
          </Button>
        </div>
      )}
    </div>
  );
};

export default ViewStaff;

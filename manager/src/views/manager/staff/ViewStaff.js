import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Glide from 'components/carousel/Glide';
import { toast } from 'react-toastify';

const customStyles = `
  .view-staff-staff-container {
    min-height: 100vh;
  }
  .view-staff-glass-card {
    background: #ffffff !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 1.5rem !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04) !important;
  }
  .view-staff-staff-card {
    background: #ffffff !important;
    border: 1px solid #f1f5f9 !important;
    border-radius: 1.5rem !important;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
    height: 100% !important;
    position: relative;
    overflow: hidden;
  }
  .view-staff-staff-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #23b3f4, #0ea5e9);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .view-staff-staff-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(35, 179, 244, 0.12) !important;
    border-color: rgba(35, 179, 244, 0.3) !important;
  }
  .view-staff-staff-card:hover::before {
    opacity: 1;
  }
  .view-staff-staff-photo-wrapper {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    padding: 5px;
    background: linear-gradient(135deg, rgba(35, 179, 244, 0.1) 0%, rgba(35, 179, 244, 0.05) 100%);
    margin-bottom: 1.5rem;
    position: relative;
  }
  .view-staff-staff-photo-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #fff;
    padding: 3px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  }
  .view-staff-staff-photo-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .view-staff-position-badge {
    background: #f0f9ff;
    color: #0369a1;
    padding: 0.35rem 0.85rem;
    border-radius: 50px;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
    border: 1px solid #e0f2fe;
  }
  .view-staff-custom-btn-outline {
    border: 2px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: transparent !important;
    transition: all 0.3s ease !important;
    border-radius: 50px !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    padding: 0.6rem 1.5rem !important;
  }
  .view-staff-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(35, 179, 244, 0.2) !important;
  }
  .view-staff-custom-btn-solid {
    background-color: #23b3f4 !important;
    border: 2px solid #23b3f4 !important;
    color: #fff !important;
    transition: all 0.3s ease !important;
    border-radius: 50px !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    padding: 0.6rem 1.5rem !important;
  }
  .view-staff-custom-btn-solid:hover {
    background-color: #1ea8e7 !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(35, 179, 244, 0.3) !important;
  }
  .view-staff-group-title {
    color: #23b3f4;
    font-weight: 800;
    letter-spacing: 0.05em;
    position: relative;
    padding-left: 1.25rem;
    text-transform: uppercase;
    font-size: 0.8rem;
  }
  .view-staff-group-title::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 20px;
    background: #23b3f4;
    border-radius: 2px;
  }
  .view-staff-profile-link {
    color: #23b3f4;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s ease;
  }
  .view-staff-profile-link:hover {
    color: #0ea5e9;
    letter-spacing: 0.08em;
  }
`;

const ViewStaff = () => {
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
        <Spinner animation="border" style={{ color: '#23b3f4' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5 text-start">
        <style>{customStyles}</style>
        <Alert variant="danger" className="view-staff-glass-card border-0 p-5 text-center shadow-sm">
          <CsLineIcons icon="error" className="text-danger mb-3" size="48" />
          <h4 className="fw-bold mb-3">Failed to Load Staff</h4>
          <p className="text-muted mb-4">{error}</p>
          <Button className="view-staff-custom-btn-solid px-5" onClick={fetchStaff}>
            <CsLineIcons icon="refresh" className="me-2" size="18" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="view-staff-staff-container pb-5 text-start">
      <style>{customStyles}</style>
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-md-n3">
          <Row className="g-3 align-items-center">
            <Col xs="12">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>
                Manage Staff
              </h1>
              <div className="text-muted mt-1 small">Overview of your restaurant team</div>
            </Col>
          </Row>
        </div>

        {Object.keys(groupedStaff).length > 0 ? (
          Object.entries(groupedStaff).map(([position, members]) => (
            <div key={position} className="mb-5">
              <div className="d-flex justify-content-between align-items-end mb-3 px-1">
                <div>
                  <h4 className="view-staff-group-title mb-1">{position}</h4>
                  <div className="text-muted small fw-bold" style={{ letterSpacing: '0.02em', marginLeft: '1.25rem' }}>
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
                    576: { perView: 1.2 },
                    768: { perView: 2.2 },
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
                      <Card className="view-staff-staff-card border-0 shadow-sm">
                        <Card.Body className="p-4 text-center d-flex flex-column align-items-center">
                          <div className="view-staff-staff-photo-wrapper">
                            <div className="view-staff-staff-photo-inner">
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
                                    e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          <div className="view-staff-position-badge">{staffMember.position}</div>

                          <h5 className="mb-0 fw-bold text-dark text-truncate w-100 px-1">
                            {staffMember.f_name} {staffMember.l_name}
                          </h5>

                          <div className="mt-4 pt-3 border-top w-100">
                            <div className="view-staff-profile-link d-flex align-items-center justify-content-center gap-2">
                              <span>Profile</span>
                              <CsLineIcons icon="arrow-right" size="14" />
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
          <div className="text-center py-5 my-5 view-staff-glass-card border-0 mx-auto" style={{ maxWidth: '600px' }}>
            <div className="mb-4">
              <div className="bg-light d-inline-flex p-4 rounded-circle mb-3">
                <CsLineIcons icon="inbox" size="48" className="text-muted" />
              </div>
              <h3 className="fw-bold text-dark">No Staff Found</h3>
              <p className="text-muted px-5">Your staff list is currently empty. Team members can be added by the administrator.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewStaff;
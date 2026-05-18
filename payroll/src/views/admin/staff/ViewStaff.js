import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Glide from 'components/carousel/Glide';
import { toast } from 'react-toastify';

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
    <div className="view-staff-staff-container pb-5">
      <div className="container-fluid ps-lg-4 pe-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-md-n3">
          <Row className="g-3 align-items-center">
            <Col xs="12" md="7">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>
                Manage Staff
              </h1>
              <div className="text-muted mt-1 small">Overview and management of your restaurant team</div>
            </Col>
            <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button className="view-staff-custom-btn-outline d-flex align-items-center gap-2" onClick={() => history.push('/staff/add')}>
                <CsLineIcons icon="plus" size="18" /> Add Staff
              </Button>
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
              <p className="text-muted px-5">Your staff list is currently empty. Start building your team by adding your first member.</p>
            </div>
            <Button className="view-staff-custom-btn-outline px-5 py-2" onClick={() => history.push('/staff/add')}>
              <CsLineIcons icon="plus" className="me-2" size="18" />
              Add First Staff Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewStaff;

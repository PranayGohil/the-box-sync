import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Card, Spinner, Alert, Table, Modal, Form } from 'react-bootstrap';
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

  // Group staff by position
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
      <Row className="justify-content-center my-5">
        <Col xs={12} className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Loading...</h5>
        </Col>
      </Row>
    );
  }

  if (error) {
    return (
      <Row className="justify-content-center my-5">
        <Col xs={12} md={8} lg={6}>
          <Alert variant="danger" className="text-center">
            <CsLineIcons icon="error" className="me-2" size="24" />
            <h5 className="mt-2">Failed to Load Staff</h5>
            <p>{error}</p>
            <Button variant="outline-primary" onClick={fetchStaff} className="mt-2">
              <CsLineIcons icon="refresh" className="me-2" />
              Retry
            </Button>
          </Alert>
        </Col>
      </Row>
    );
  }

  return (
    <>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="display-5 fw-bold">Manage Staff</h1>
        </Col>
        <Col className="text-end">
          <Button variant="outline-primary" onClick={() => history.push('/staff/add')} className="me-2" disabled={loading}>
            <CsLineIcons icon="plus" className="me-2" /> Add Staff
          </Button>
          <Button variant="outline-primary" onClick={() => history.push('/staff/attendance')} disabled={loading}>
            <CsLineIcons icon="calendar" className="me-2" />
            Manage Attendance
          </Button>
        </Col>
      </Row>

      {/* Staff Cards Section */}
      {Object.keys(groupedStaff).length > 0 ? (
        Object.entries(groupedStaff).map(([position, members]) => (
          <div key={position} className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold mb-0">{position}</h4>
              <span className="text-muted">
                {members.length} staff member{members.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Glide
              options={{
                gap: 0,
                rewind: false,
                bound: true,
                perView: 6,
                breakpoints: {
                  400: { perView: 2 },
                  600: { perView: 3 },
                  1400: { perView: 4 },
                  1600: { perView: 5 },
                  1900: { perView: 6 },
                  3840: { perView: 6 },
                },
                noControls: true,
              }}
            >
              {members.map((staffMember) => (
                <Link to={`/staff/profile/${staffMember._id}`} key={staffMember._id} className="my-3">
                  <Glide.Item className="my-3">
                    <Card className="sh-20 hover-shadow hover-border-primary cursor-pointer position-relative">
                      <Card.Body className="p-3 text-center d-flex flex-column align-items-center justify-content-between">
                        <div className="position-relative sh-8 sw-8 bg-gradient-light rounded-xl overflow-hidden mb-2">
                          {!staffMember.photo ? (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                              <CsLineIcons icon="user" size="24" className="text-muted" />
                            </div>
                          ) : (
                            <img
                              src={`${process.env.REACT_APP_UPLOAD_DIR}${staffMember.photo}`}
                              alt={`${staffMember.f_name} ${staffMember.l_name}`}
                              className="w-100 h-100 object-fit-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.parentElement.innerHTML = `
                                  <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                                    <i class="text-muted">No Image</i>
                                  </div>
                                `;
                              }}
                            />
                          )}
                        </div>
                        <p className="mb-0 lh-1 fw-bold text-truncate w-100" title={`${staffMember.f_name} ${staffMember.l_name}`}>
                          {staffMember.f_name} {staffMember.l_name}
                        </p>
                        <small className="text-muted text-truncate w-100" title={staffMember.position}>
                          {staffMember.position}
                        </small>
                        <div>
                          <small className="text-primary">
                            <CsLineIcons icon="eye" size="12" className="me-1" />
                            View Profile
                          </small>
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
        <Row className="justify-content-center my-5">
          <Col xs={12} md={8} lg={6} className="text-center">
            <div className="py-5">
              <CsLineIcons icon="inbox" size="48" className="text-muted mb-3" />
              <h5>No Staff Members Found</h5>
              <p className="text-muted mb-4">Get started by adding your first staff member</p>
              <Button variant="primary" onClick={() => history.push('/staff/add')} size="lg">
                <CsLineIcons icon="plus" className="me-2" />
                Add First Staff
              </Button>
            </div>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ViewStaff;

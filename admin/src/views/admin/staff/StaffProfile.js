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

import DeleteStaffModal from './DeleteStaffModal';

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
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading...</h5>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <Alert variant="danger" className="my-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
              <div className="mt-3">
                <Button variant="outline-primary" onClick={() => history.push('/staff/view')}>
                  <CsLineIcons icon="arrow-left" className="me-2" />
                  Back to Staff List
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </>
    );
  }

  if (!staff) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <Alert variant="info" className="my-4">
              <CsLineIcons icon="inbox" className="me-2" />
              Staff not found.
              <div className="mt-3">
                <Button variant="outline-primary" onClick={() => history.push('/staff/view')}>
                  <CsLineIcons icon="arrow-left" className="me-2" />
                  Back to Staff List
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />

      {/* Title */}
      <div className="page-title-container">
        <Row>
          <Col md="7">
            <h1 className="mb-0 pb-0 display-4">
              {staff.f_name} {staff.l_name}
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col md="5" className="d-flex align-items-start justify-content-end">
            <Button
              variant="outline-primary"
              className="btn-icon btn-icon-start btn-icon w-100 w-md-auto ms-1"
              as={NavLink}
              to={`/staff/edit/${id}`}
            >
              <CsLineIcons icon="edit-square" /> <span>Edit</span>
            </Button>
            <Button
              variant="outline-danger"
              className="btn-icon btn-icon-start btn-icon w-100 w-md-auto ms-3"
              onClick={() => {
                setShowDeleteModal(true);
                setStaffToDelete(staff);
              }}
            >
              <CsLineIcons icon="bin" /> <span>Delete</span>
            </Button>
          </Col>
        </Row>
      </div>

      <Row className="g-5">
        <Tab.Container id="profileStandard" defaultActiveKey="personal-details">
          {/* Sidebar */}
          <Col xl="4" xxl="3">
            <h2 className="small-title">Profile</h2>
            <Card className="mb-5">
              <Card.Body>
                <div className="d-flex align-items-center flex-column mb-4">
                  <div className="sw-13 position-relative mb-3">
                    <img
                      src={`${process.env.REACT_APP_UPLOAD_DIR}${staff.photo}` || '/img/profile/default.png'}
                      className="img-fluid rounded-xl"
                      alt="profile"
                      style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/img/profile/default.png';
                      }}
                    />
                  </div>
                  <div className="h5 mb-0">
                    {staff.f_name} {staff.l_name}
                  </div>
                  <div className="text-muted">{staff.position}</div>
                  <div className="text-muted">
                    <CsLineIcons icon="pin" className="me-1" />
                    <span className="align-middle">
                      {staff.city}, {staff.country}
                    </span>
                  </div>
                </div>
                <Nav className="flex-column">
                  <Nav.Link className="px-0 border-bottom border-separator-light cursor-pointer" eventKey="personal-details">
                    <CsLineIcons icon="activity" className="me-2" size="17" />
                    <span className="align-middle">Personal Details</span>
                  </Nav.Link>
                  <Nav.Link className="px-0 border-bottom border-separator-light cursor-pointer" eventKey="id-docs">
                    <CsLineIcons icon="suitcase" className="me-2" size="17" />
                    <span className="align-middle">ID Proof & Documents</span>
                  </Nav.Link>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Content */}
          <Col xl="8" xxl="9">
            <Tab.Content>
              {/* Personal Details */}
              <Tab.Pane eventKey="personal-details">
                <h2 className="small-title">Personal Details</h2>
                <Card>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Staff ID:</strong> {staff.staff_id}{' '}
                      </Col>
                      <Col md={6}>
                        <strong>Full Name:</strong> {staff.f_name} {staff.l_name}
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Birth Date:</strong> {staff.birth_date}
                      </Col>
                      <Col md={6}>
                        <strong>Joining Date:</strong> {staff.joining_date}
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Position:</strong> {staff.position}
                      </Col>
                      <Col md={6}>
                        <strong>Salary:</strong> ₹{staff.salary}
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Phone:</strong> {staff.phone_no}
                      </Col>
                      <Col md={6}>
                        <strong>Email:</strong> {staff.email}
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={12}>
                        <strong>Address:</strong> {staff.address}, {staff.city}, {staff.state}, {staff.country}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* ID Proof & Documents */}
              <Tab.Pane eventKey="id-docs">
                <h2 className="small-title">ID Proof & Documents</h2>
                <Card>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col md={6}>
                        <strong>Document Type:</strong> {staff.document_type}
                      </Col>
                      <Col md={6}>
                        <strong>ID Number:</strong> {staff.id_number}
                      </Col>
                    </Row>
                    <Row>
                      <strong>Document Images:</strong>
                      <div className="d-flex flex-wrap gap-3 mt-2">
                        {staff.front_image && (
                          <div className="position-relative">
                            <img
                              src={`${process.env.REACT_APP_UPLOAD_DIR}${staff.front_image}` || '/img/placeholder.png'}
                              alt="Front ID"
                              className="img-fluid rounded border"
                              style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/img/placeholder.png';
                              }}
                            />
                            <small className="text-muted d-block mt-1 text-center">Front Image</small>
                          </div>
                        )}
                        {staff.back_image && (
                          <div className="position-relative">
                            <img
                              src={`${process.env.REACT_APP_UPLOAD_DIR}${staff.back_image}` || '/img/placeholder.png'}
                              alt="Back ID"
                              className="img-fluid rounded border"
                              style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/img/placeholder.png';
                              }}
                            />
                            <small className="text-muted d-block mt-1 text-center">Back Image</small>
                          </div>
                        )}
                      </div>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Tab.Container>
      </Row>

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
    </>
  );
};

export default StaffProfile;
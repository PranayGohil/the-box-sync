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

  // Waiter state
  const [waiters, setWaiters] = useState([]);
  const [showWaiterSection, setShowWaiterSection] = useState(false);
  const [loadingWaiters, setLoadingWaiters] = useState(false);
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState(null);
  const [deletingWaiter, setDeletingWaiter] = useState(null);
  const [waiterFormData, setWaiterFormData] = useState({ full_name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchWaiters = async () => {
    try {
      setLoadingWaiters(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/waiter/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setWaiters(response.data.data);
    } catch (err) {
      console.error('Error fetching waiters:', err);
      toast.error('Failed to fetch waiters.');
    } finally {
      setLoadingWaiters(false);
    }
  };

  const handleAddWaiter = async () => {
    try {
      if (!waiterFormData.full_name.trim()) {
        toast.error('Please enter waiter name');
        return;
      }

      await axios.post(
        `${process.env.REACT_APP_API}/waiter/add`,
        waiterFormData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      toast.success('Waiter added successfully');
      setShowWaiterModal(false);
      setWaiterFormData({ full_name: '' });
      fetchWaiters();
    } catch (err) {
      console.error('Error adding waiter:', err);
      toast.error('Failed to add waiter');
    }
  };

  const handleEditWaiter = async () => {
    try {
      if (!waiterFormData.full_name.trim()) {
        toast.error('Please enter waiter name');
        return;
      }

      await axios.put(
        `${process.env.REACT_APP_API}/waiter/edit/${editingWaiter._id}`,
        waiterFormData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      toast.success('Waiter updated successfully');
      setShowWaiterModal(false);
      setEditingWaiter(null);
      setWaiterFormData({ full_name: '' });
      fetchWaiters();
    } catch (err) {
      console.error('Error updating waiter:', err);
      toast.error('Failed to update waiter');
    }
  };

  const handleDeleteWaiter = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`${process.env.REACT_APP_API}/waiter/delete/${deletingWaiter._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Waiter deleted successfully');
      setShowDeleteModal(false);
      setDeletingWaiter(null);
      fetchWaiters();
    } catch (err) {
      console.error('Error deleting waiter:', err);
      toast.error('Failed to delete waiter');
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddWaiterModal = () => {
    setEditingWaiter(null);
    setWaiterFormData({ full_name: '' });
    setShowWaiterModal(true);
  };

  const openEditWaiterModal = (waiter) => {
    setEditingWaiter(waiter);
    setWaiterFormData({ full_name: waiter.full_name });
    setShowWaiterModal(true);
  };

  const openDeleteModal = (waiter) => {
    setDeletingWaiter(waiter);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowWaiterModal(false);
    setEditingWaiter(null);
    setWaiterFormData({ full_name: '' });
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDeletingWaiter(null);
  };

  const toggleWaiterSection = () => {
    if (!showWaiterSection && waiters.length === 0) {
      fetchWaiters();
    }
    setShowWaiterSection(!showWaiterSection);
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
          <h5>Loading Staff Members...</h5>
          <p className="text-muted">Please wait while we fetch staff information</p>
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
          <Button
            variant="outline-primary"
            onClick={() => history.push('/staff/add')}
            className="me-2"
            disabled={loading}
          >
            <CsLineIcons icon="plus" className="me-2" /> Add Staff
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => history.push('/staff/attendance')}
            disabled={loading}
          >
            <CsLineIcons icon="calendar" className="me-2" />
            Manage Attendance
          </Button>
        </Col>
      </Row>

      {/* Waiter Management Section */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light cursor-pointer border" onClick={toggleWaiterSection}>
          <h5 className="mb-0 d-flex align-items-center">
            <CsLineIcons icon="user" className="me-2" />
            Waiter Management
          </h5>
          <div>
            <CsLineIcons
              icon={showWaiterSection ? "chevron-top" : "chevron-bottom"}
              size="20"
            />
          </div>
        </Card.Header>

        {showWaiterSection && (
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className='d-flex'>
                <h6 className="mb-0">Waiters List</h6>
                <span className="badge bg-primary ms-2">{waiters.length}</span>
              </div>
              <Button variant="primary" size="sm" onClick={openAddWaiterModal}>
                <CsLineIcons icon="plus" className="me-1" size="14" />
                Add Waiter
              </Button>
            </div>

            {loadingWaiters ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" size="sm" />
                <p className="text-muted mt-2 mb-0">Loading waiters...</p>
              </div>
            ) : waiters.length > 0 ? (
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>#</th>
                    <th>Full Name</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {waiters.map((waiter, index) => (
                    <tr key={waiter._id}>
                      <td>{index + 1}</td>
                      <td>{waiter.full_name}</td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => openEditWaiterModal(waiter)}
                        >
                          <CsLineIcons icon="edit" size="14" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDeleteModal(waiter)}
                        >
                          <CsLineIcons icon="bin" size="14" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Alert variant="info" className="mb-0 text-center">
                <CsLineIcons icon="inbox" size="24" className="mb-2" />
                <p className="mb-0">No waiters found. Add your first waiter to get started.</p>
              </Alert>
            )}
          </Card.Body>
        )}
      </Card>

      {/* Staff Cards Section */}
      {Object.keys(groupedStaff).length > 0 ? (
        Object.entries(groupedStaff).map(([position, members]) => (
          <div key={position} className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold mb-0">{position}</h4>
              <span className="text-muted">{members.length} staff member{members.length !== 1 ? 's' : ''}</span>
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
                    <Card
                      className="sh-20 hover-shadow hover-border-primary cursor-pointer position-relative"
                    >
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
              <Button
                variant="primary"
                onClick={() => history.push('/staff/add')}
                size="lg"
              >
                <CsLineIcons icon="plus" className="me-2" />
                Add First Staff
              </Button>
            </div>
          </Col>
        </Row>
      )}

      {/* Waiter Add/Edit Modal */}
      <Modal show={showWaiterModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingWaiter ? 'Edit Waiter' : 'Add Waiter'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter waiter's full name"
                value={waiterFormData.full_name}
                onChange={(e) => setWaiterFormData({ full_name: e.target.value })}
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={editingWaiter ? handleEditWaiter : handleAddWaiter}
          >
            <CsLineIcons icon={editingWaiter ? "save" : "plus"} className="me-1" size="14" />
            {editingWaiter ? 'Update' : 'Add'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleDeleteModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons icon="warning-hexagon" className="me-2 text-danger" size="24" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <div className="mb-3">
              <CsLineIcons icon="bin" size="48" className="text-danger" />
            </div>
            <h5>Are you sure you want to delete this waiter?</h5>
            {deletingWaiter && (
              <p className="text-muted mb-0">
                <strong>{deletingWaiter.full_name}</strong> will be permanently removed from the system.
              </p>
            )}
            <Alert variant="warning" className="mt-3 mb-0 text-start">
              <small>
                <strong>Warning:</strong> This action cannot be undone.
              </small>
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteModalClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteWaiter}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <CsLineIcons icon="bin" className="me-1" size="14" />
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewStaff;
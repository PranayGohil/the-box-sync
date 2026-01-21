import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const ManageWaiters = () => {
  const title = 'Waiter Management';
  const description = 'Manage restaurant waiters and staff';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-waiters', title: 'Manage Waiters' },
  ];

  const [loading, setLoading] = useState(true);
  const [waiters, setWaiters] = useState([]);
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState(null);
  const [deletingWaiter, setDeletingWaiter] = useState(null);
  const [waiterFormData, setWaiterFormData] = useState({ full_name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWaiters = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/waiter/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setWaiters(response.data.data || []);
    } catch (err) {
      console.error('Error fetching waiters:', err);
      toast.error('Failed to fetch waiters.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWaiter = async () => {
    if (!waiterFormData.full_name.trim()) {
      toast.error('Please enter waiter name');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${process.env.REACT_APP_API}/waiter/add`, waiterFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Waiter added successfully');
      setShowWaiterModal(false);
      setWaiterFormData({ full_name: '' });
      fetchWaiters();
    } catch (err) {
      console.error('Error adding waiter:', err);
      toast.error(err.response?.data?.message || 'Failed to add waiter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWaiter = async () => {
    if (!waiterFormData.full_name.trim()) {
      toast.error('Please enter waiter name');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(`${process.env.REACT_APP_API}/waiter/edit/${editingWaiter._id}`, waiterFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Waiter updated successfully');
      setShowWaiterModal(false);
      setEditingWaiter(null);
      setWaiterFormData({ full_name: '' });
      fetchWaiters();
    } catch (err) {
      console.error('Error updating waiter:', err);
      toast.error(err.response?.data?.message || 'Failed to update waiter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWaiter = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/waiter/delete/${deletingWaiter._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Waiter deleted successfully');
      setShowDeleteModal(false);
      setDeletingWaiter(null);
      fetchWaiters();
    } catch (err) {
      console.error('Error deleting waiter:', err);
      toast.error(err.response?.data?.message || 'Failed to delete waiter');
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

  useEffect(() => {
    fetchWaiters();
  }, []);

  const columns = React.useMemo(
    () => [
      {
        Header: '#',
        id: 'index',
        headerClassName: 'text-muted text-small text-uppercase w-5',
        Cell: ({ row }) => <span className="text-muted">{row.index + 1}</span>,
      },
      {
        Header: 'Full Name',
        accessor: 'full_name',
        headerClassName: 'text-muted text-small text-uppercase w-30',
        Cell: ({ value }) => <strong>{value}</strong>,
      },
      {
        Header: 'Status',
        accessor: 'status',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: () => <Badge bg="success">Active</Badge>,
      },
      // {
      //   Header: 'Created Date',
      //   accessor: 'createdAt',
      //   headerClassName: 'text-muted text-small text-uppercase w-20',
      //   Cell: ({ value }) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
      // },
      {
        Header: 'Actions',
        id: 'actions',
        headerClassName: 'text-muted text-small text-uppercase w-20 text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center">
            <Button
              variant="outline-primary"
              size="sm"
              className="btn-icon btn-icon-only me-1"
              onClick={() => openEditWaiterModal(row.original)}
              title="Edit"
              disabled={loading}
            >
              <CsLineIcons icon="edit" />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              className="btn-icon btn-icon-only"
              onClick={() => openDeleteModal(row.original)}
              title="Delete"
              disabled={loading}
            >
              <CsLineIcons icon="bin" />
            </Button>
          </div>
        ),
      },
    ],
    [loading]
  );

  const tableInstance = useTable(
    {
      columns,
      data: waiters,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  return (
    <>
      <HtmlHead title={title} description={description} />

      <Row>
        <Col>
          <div className="page-title-container">
            <Row>
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="d-flex align-items-start justify-content-end">
                <Button variant="primary" onClick={openAddWaiterModal} disabled={loading}>
                  <CsLineIcons icon="plus" className="me-2" /> Add Waiter
                </Button>
              </Col>
            </Row>
          </div>

          {/* Loading State */}
          {loading && (
            <Row className="justify-content-center my-5">
              <Col xs={12} className="text-center">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p>Loading waiters data...</p>
              </Col>
            </Row>
          )}

          {/* Content */}
          {!loading && (
            <div className="mt-3">
              <Row className="mb-3">
                <Col sm="12" md="5" lg="3" xxl="2">
                  <div className="d-inline-block float-md-start me-1 mb-1 mb-md-0 search-input-container w-100 shadow bg-foreground">
                    <ControlsSearch tableInstance={tableInstance} />
                  </div>
                </Col>
                <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
                  <div className="d-inline-block">
                    <ControlsPageSize tableInstance={tableInstance} />
                  </div>
                </Col>
              </Row>
              <Row>
                <Col xs="12">
                  {waiters.length === 0 ? (
                    <Alert variant="info" className="text-center">
                      <CsLineIcons icon="inbox" className="me-2" />
                      No waiters found. Add your first waiter to get started.
                    </Alert>
                  ) : (
                    <Row>
                      <Col xs="12" style={{ overflow: 'auto' }}>
                        <Table className="react-table rows" tableInstance={tableInstance} />
                      </Col>
                      <Col xs="12">
                        <TablePagination tableInstance={tableInstance} />
                      </Col>
                    </Row>
                  )}
                </Col>
              </Row>
            </div>
          )}
        </Col>
      </Row>

      {/* Waiter Add/Edit Modal */}
      <Modal className="modal-right large" show={showWaiterModal} onHide={handleModalClose} backdrop="static">
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
                disabled={isSubmitting}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleModalClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={editingWaiter ? handleEditWaiter : handleAddWaiter} disabled={isSubmitting || !waiterFormData.full_name.trim()}>
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                {editingWaiter ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <CsLineIcons icon={editingWaiter ? 'save' : 'plus'} className="me-1" />
                {editingWaiter ? 'Update' : 'Add'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleDeleteModalClose} backdrop="static" centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Waiter?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            This Waiter(<strong>{deletingWaiter?.full_name}</strong>) was permanently deleted from your waiter list.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleDeleteModalClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteWaiter} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <CsLineIcons icon="bin" className="me-1" />
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ManageWaiters;

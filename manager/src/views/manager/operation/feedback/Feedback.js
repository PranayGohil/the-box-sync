import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button, Modal, Spinner } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

import DeleteFeedbackModal from './DeleteFeedbackModal';

const Feedback = () => {
  const title = 'Feedback Management';
  const description = 'View and manage customer feedback';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'feedback-management', text: 'Feedback' },
  ];

  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/feedback/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data.success === true) {
        setFeedbacks(response.data.feedbacks);
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
    setLoading(false);
  };

  // Fetch feedbacks from the backend
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Open reply modal
  const handleReply = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyMessage('');
    setShowReplyModal(true);
  };

  // Send reply
  const handleSendReply = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/feedback/reply/${selectedFeedback._id}`,
        { reply: replyMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setShowReplyModal(false);
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
    }
    setLoading(false);
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Customer Name',
        accessor: 'customer_name',
        headerClassName: 'text-muted text-small text-uppercase w-15',
      },
      {
        Header: 'Email',
        accessor: 'customer_email',
        headerClassName: 'text-muted text-small text-uppercase w-20',
        Cell: ({ value }) => value || 'N/A',
      },
      {
        Header: 'Phone',
        accessor: 'customer_phone',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ value }) => value || 'N/A',
      },
      {
        Header: 'Rating',
        accessor: 'rating',
        headerClassName: 'text-muted text-small text-uppercase w-10',
        Cell: ({ value }) => <Badge bg={value >= 4 ? 'success' : value >= 3 ? 'warning' : 'danger'}>{value} ★</Badge>,
      },
      {
        Header: 'Feedback',
        accessor: 'feedback',
        headerClassName: 'text-muted text-small text-uppercase w-20',
        Cell: ({ value }) => (
          <div className="text-truncate" style={{ maxWidth: '200px' }} title={value}>
            {value}
          </div>
        ),
      },
      {
        Header: 'Date',
        accessor: 'createdAt',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ value }) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
      },
      {
        Header: 'Actions',
        id: 'actions',
        headerClassName: 'text-muted text-small text-uppercase w-10 text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center">
            <Button variant="outline-primary" size="sm" className="btn-icon btn-icon-only me-1" onClick={() => handleReply(row.original)} title="Reply">
              <CsLineIcons icon="message" />
            </Button>
            <Button variant="outline-danger" size="sm" className="btn-icon btn-icon-only" onClick={() => {
              setSelectedFeedback(row.original);
              setShowDeleteModal(true);
            }}
              title="Delete">
              <CsLineIcons icon="bin" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const tableInstance = useTable(
    {
      columns,
      data: feedbacks,
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
                <Button variant='primary' onClick={() => history.push('/operations/qr-for-feedback')}>
                  <CsLineIcons icon="qr-code" className="me-2" /> Feedback QR
                </Button>
              </Col>
            </Row>
          </div>

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
                <Table className="react-table rows" tableInstance={tableInstance} />
              </Col>
              <Col xs="12">
                <TablePagination tableInstance={tableInstance} />
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Reply Modal */}
      <Modal className="modal-right large" show={showReplyModal} onHide={() => setShowReplyModal(false)} backdrop="static" >
        <Modal.Header closeButton>
          <Modal.Title>Reply to Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFeedback && (
            <>
              <div className="mb-3">
                <h6>Customer Feedback:</h6>
                <p className="text-muted">{selectedFeedback.feedback}</p>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Your Reply</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write your reply message here..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReplyModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendReply} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Send Reply'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <DeleteFeedbackModal show={showDeleteModal} handleClose={() => {
        setShowDeleteModal(false);
        setSelectedFeedback(null);
      }} data={selectedFeedback} fetchFeedbacks={fetchFeedbacks} />
    </>
  );
};

export default Feedback;

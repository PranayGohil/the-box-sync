import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button, Modal, Spinner, Alert, Card } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';
import DeleteFeedbackModal from './DeleteFeedbackModal';

const customStyles = `
  .pill-input {
    border-radius: 15px !important;
    padding: 0.8rem 1.5rem 0.8rem 3.5rem !important;
    border: 1px solid #f0f0f0 !important;
    background: #ffffff !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    color: #333;
  }
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-outline:hover svg,
  .custom-btn-outline:hover i {
    color: #fff !important;
    stroke: #fff !important;
  }
  .custom-btn-solid {
    background-color: #1ea8e7 !important;
    border: 1px solid #1ea8e7 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-solid:hover {
    background-color: #158dc4 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
  }
  .action-btn-circle {
    width: 36px !important;
    height: 36px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    transition: all 0.3s ease !important;
    background: #fff !important;
    border: 1.5px solid #e2e8f0 !important;
    color: #64748b !important;
  }
  .action-btn-circle:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.08) !important;
  }
  .btn-reply-active { border-color: #1ea8e7 !important; color: #1ea8e7 !important; }
  .btn-reply-active:hover { background: #1ea8e7 !important; color: #fff !important; }
  .btn-delete-active { border-color: #cf2637 !important; color: #cf2637 !important; }
  .btn-delete-active:hover { background: #cf2637 !important; color: #fff !important; }
  
  .rating-badge {
    border-radius: 6px !important;
    padding: 4px 10px !important;
    font-weight: 700 !important;
    font-size: 0.75rem !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    background: #198754 !important;
    color: #fff !important;
  }
  .rating-badge.warning { background: #ffc107 !important; color: #000 !important; }
  .rating-badge.danger { background: #dc3545 !important; }

  /* Desktop Table Refinements */
  .react-table.rows {
    border-spacing: 0 10px !important;
    border-collapse: separate !important;
  }
  .react-table.rows tbody tr {
    background: #fff !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03) !important;
    border-radius: 12px !important;
    transition: all 0.2s ease !important;
  }
  .react-table.rows tbody td {
    padding: 1rem 1.25rem !important;
    border: none !important;
    vertical-align: middle !important;
  }
  .react-table.rows tbody td:first-child { border-radius: 12px 0 0 12px !important; }
  .react-table.rows tbody td:last-child { border-radius: 0 12px 12px 0 !important; }
  
  .react-table thead th {
    border: none !important;
    padding: 0 1.25rem 0.5rem 1.25rem !important;
    font-weight: 700 !important;
    color: #94a3b8 !important;
    text-transform: uppercase !important;
    font-size: 0.7rem !important;
    letter-spacing: 0.08em !important;
  }

  .admin-reply-tag {
    font-size: 0.7rem !important;
    font-weight: 800 !important;
    color: #1ea8e7 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    display: block !important;
    margin-top: 0.5rem !important;
  }
  .admin-reply-content {
    font-size: 0.85rem !important;
    color: #64748b !important;
    display: block !important;
    margin-top: 0.2rem !important;
    padding-left: 0.75rem !important;
    border-left: 2px solid #e2e8f0 !important;
  }

  /* MOBILE VIEW - NATIVE CARDS STYLING */
  .mobile-feedback-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .feedback-mobile-card {
    border: 1px solid #f1f5f9 !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05) !important;
  }
  .mobile-field label {
    display: block;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    margin-bottom: 0.2rem;
  }
  .feedback-text-box {
    font-style: italic;
    color: #334155;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 12px;
    border-left: 4px solid #1ea8e7;
    line-height: 1.5;
    font-size: 0.95rem;
    margin-top: 0.25rem;
  }
  .mobile-reply-box {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: #f0f9ff;
    border-radius: 10px;
    border: 1px solid #bae6fd;
  }

  .datatable-search {
    border-radius: 50px !important;
    padding-left: 2.75rem !important;
    border: 1px solid #f0f0f0 !important;
    height: 44px !important;
    transition: all 0.3s ease !important;
    font-size: 0.9rem !important;
  }
  .search-magnifier-icon {
    left: 1rem !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    color: #94a3b8 !important;
    position: absolute !important;
  }
`;

const Feedback = () => {
  const title = 'Manage Feedback';
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
  const [sendingReply, setSendingReply] = useState(false);
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
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to fetch feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleReply = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyMessage(feedback.reply || '');
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message.');
      return;
    }

    setSendingReply(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/feedback/reply/${selectedFeedback._id}`,
        { reply: replyMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setShowReplyModal(false);
      toast.success('Reply sent successfully!');
      fetchFeedbacks();
    } catch (error) {
      toast.error('Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Customer Name',
        accessor: 'customer_name',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ value }) => <span className="fw-bold text-dark">{value}</span>
      },
      {
        Header: 'Contact Info',
        id: 'contact',
        headerClassName: 'text-muted text-small text-uppercase w-20',
        Cell: ({ row }) => (
          <div>
            <div className="text-dark small fw-medium">{row.original.customer_email || 'No Email'}</div>
            <div className="text-muted small mt-1">{row.original.customer_phone || 'No Phone'}</div>
          </div>
        ),
      },
      {
        Header: 'Rating',
        accessor: 'rating',
        headerClassName: 'text-muted text-small text-uppercase w-10',
        Cell: ({ value }) => {
          const status = value >= 4 ? '' : value >= 3 ? 'warning' : 'danger';
          return <div className={`rating-badge ${status}`}>{value} ★</div>;
        },
      },
      {
        Header: 'Feedback & Reply',
        accessor: 'feedback',
        headerClassName: 'text-muted text-small text-uppercase w-35',
        Cell: ({ row }) => (
          <div>
            <div className="text-dark italic" style={{ fontStyle: 'italic' }}>
              “{row.original.feedback}”
            </div>
            {row.original.reply && (
              <div className="mt-2 p-2 rounded bg-light" style={{ borderLeft: '3px solid #1ea8e7' }}>
                <span className="admin-reply-tag">Your Reply:</span>
                <span className="admin-reply-content">{row.original.reply}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        Header: 'Date',
        accessor: 'date',
        headerClassName: 'text-muted text-small text-uppercase w-10',
        Cell: ({ value }) => <span className="text-muted small">{value ? new Date(value).toLocaleDateString('en-IN') : 'N/A'}</span>,
      },
      {
        Header: 'Actions',
        id: 'actions',
        headerClassName: 'text-muted text-small text-uppercase w-10 text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center gap-2">
            {!row.original.reply && (
              <Button
                className="action-btn-circle btn-reply-active shadow-sm"
                onClick={() => handleReply(row.original)}
                title="Reply"
              >
                <CsLineIcons icon="message" size="16" stroke="currentColor" />
              </Button>
            )}
            <Button
              className="action-btn-circle btn-delete-active shadow-sm"
              onClick={() => {
                setSelectedFeedback(row.original);
                setShowDeleteModal(true);
              }}
              title="Delete"
            >
              <CsLineIcons icon="bin" size="16" stroke="currentColor" />
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
    <div className="container-fluid pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4">
        <Row className="g-3 align-items-center">
          <Col xs="12" md="7">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2">
            <Button 
              className="px-4 py-2 rounded-pill d-flex align-items-center custom-btn-outline"
              onClick={() => history.push('/operations/qr-for-feedback')}
            >
              <CsLineIcons icon="qr-code" size="18" stroke="currentColor" />
              Feedback QR
            </Button>
          </Col>
        </Row>
      </div>

      {loading ? (
        <div className="text-center py-5 mt-5">
          <Spinner animation="border" style={{ color: '#1ea8e7' }} />
          <p className="mt-3 text-muted">Synchronizing feedback data...</p>
        </div>
      ) : (
        <div className="mt-4">
          <Row className="mb-4 g-3 align-items-center">
            <Col sm="12" md="6" lg="4" className="position-relative">
              <ControlsSearch tableInstance={tableInstance} />
            </Col>
            <Col sm="12" md="6" lg="8" className="d-flex justify-content-md-end">
              <ControlsPageSize tableInstance={tableInstance} />
            </Col>
          </Row>

          {feedbacks.length === 0 ? (
            <Card className="border-0 shadow-sm text-center py-5 rounded-4 mt-4">
              <Card.Body>
                <div className="mb-3">
                  <CsLineIcons icon="inbox" size="48" className="text-muted opacity-50" />
                </div>
                <h5 className="text-muted fw-bold">No feedback received yet</h5>
                <p className="text-muted small mb-0">Share your Feedback QR with customers to start collecting reviews.</p>
              </Card.Body>
            </Card>
          ) : (
            <div className="feedback-content-wrapper">
              {/* DESKTOP VIEW - TABLE */}
              <div className="d-none d-lg-block table-responsive">
                <Table className="react-table rows" tableInstance={tableInstance} />
              </div>

              {/* MOBILE VIEW - DEDICATED CARDS */}
              <div className="d-lg-none mobile-feedback-list">
                {tableInstance.page.map((row, i) => {
                  tableInstance.prepareRow(row);
                  const feedbackData = row.original;
                  return (
                    <Card key={i} className="mb-2 border-0 shadow-sm rounded-4 overflow-hidden feedback-mobile-card">
                      <Card.Body className="p-4">
                        <div className="d-flex flex-column gap-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="mobile-field">
                              <label>Customer</label>
                              <div className="fw-bold text-dark">{feedbackData.customer_name}</div>
                              <div className="text-muted xsmall" style={{ fontSize: '0.75rem' }}>{feedbackData.customer_email || 'No email'}</div>
                            </div>
                            <div className={`rating-badge ${feedbackData.rating >= 4 ? '' : feedbackData.rating >= 3 ? 'warning' : 'danger'}`}>
                              {feedbackData.rating} ★
                            </div>
                          </div>

                          <div className="mobile-field">
                            <label>Feedback</label>
                            <div className="feedback-text-box">
                              “{feedbackData.feedback}”
                            </div>
                            {feedbackData.reply && (
                              <div className="mobile-reply-box">
                                <span className="admin-reply-tag mt-0">Your Response:</span>
                                <div className="text-muted small mt-1">{feedbackData.reply}</div>
                              </div>
                            )}
                          </div>

                          <div className="mobile-field pt-3 border-top d-flex justify-content-between align-items-center mt-1">
                            <div className="text-muted small">
                              {feedbackData.date ? new Date(feedbackData.date).toLocaleDateString('en-IN') : 'N/A'}
                            </div>
                            <div className="d-flex gap-2">
                              {!feedbackData.reply && (
                                <Button
                                  className="action-btn-circle btn-reply-active shadow-sm"
                                  onClick={() => handleReply(feedbackData)}
                                  title="Reply"
                                >
                                  <CsLineIcons icon="message" size="18" stroke="currentColor" />
                                </Button>
                              )}
                              <Button
                                className="action-btn-circle btn-delete-active shadow-sm"
                                onClick={() => {
                                  setSelectedFeedback(feedbackData);
                                  setShowDeleteModal(true);
                                }}
                                title="Delete"
                              >
                                <CsLineIcons icon="bin" size="18" stroke="currentColor" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-4 d-flex justify-content-center">
                <TablePagination tableInstance={tableInstance} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reply Modal */}
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} centered backdrop="static" className="rounded-4">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#1ea8e7' }}>Respond to Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {selectedFeedback && (
            <>
              <div className="mb-4 p-3 rounded-4 bg-light border">
                <div className="small fw-bold text-primary mb-1 text-uppercase letter-spacing-1">Customer Review</div>
                <p className="text-dark mb-0 italic" style={{ fontStyle: 'italic' }}>“{selectedFeedback.feedback}”</p>
              </div>
              <Form.Group className="mb-0">
                <Form.Label className="small fw-bold text-muted text-uppercase">Your Admin Response</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="rounded-4 border-light shadow-sm"
                  style={{ resize: 'none', padding: '1rem' }}
                  disabled={sendingReply}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 d-flex gap-3">
          <Button 
            className="px-4 py-2 custom-btn-outline flex-grow-1 d-flex align-items-center justify-content-center gap-2" 
            onClick={() => setShowReplyModal(false)}
            disabled={sendingReply}
          >
            Cancel
          </Button>
          <Button 
            className="px-4 py-2 custom-btn-solid flex-grow-1 d-flex align-items-center justify-content-center gap-2" 
            onClick={handleSendReply}
            disabled={sendingReply || !replyMessage.trim()}
          >
            {sendingReply ? <Spinner animation="border" size="sm" /> : 'Update Reply'}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteFeedbackModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setSelectedFeedback(null);
        }}
        data={selectedFeedback}
        fetchFeedbacks={fetchFeedbacks}
      />
    </div>
  );
};

export default Feedback;

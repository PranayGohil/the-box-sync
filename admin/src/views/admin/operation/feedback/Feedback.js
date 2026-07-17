import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Col, Form, Row, Button, Modal, Spinner, Card, Badge, Collapse, Alert, Dropdown } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import { toast } from 'react-toastify';
import classNames from 'classnames';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import TablePagination from './components/TablePagination';
import DeleteFeedbackModal from './DeleteFeedbackModal';

const customStyles = `
  .border-dashed, .alert-light.border-dashed {
    border: 1.5px dashed #cbd5e1 !important;
    background-color: #fafafa !important;
    background: #fafafa !important;
    color: #64748b !important;
    font-weight: 600 !important;
    border-radius: 1rem !important;
  }
  .inventory-history-interactive-card {
    background: #ffffff !important;
    border-radius: 1.5rem !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03) !important;
    overflow: hidden;
    margin-bottom: 3rem;
  }
  .inventory-history-section-title-wrapper {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 2rem;
  }
  .inventory-history-table-header-row {
    display: flex;
    padding: 0 1.5rem;
    margin-bottom: 1rem;
    background: #f8fafc;
    border-radius: 10px;
    padding: 1rem 1.5rem;
  }
  .inventory-history-table-header-col {
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    user-select: none;
    transition: color 0.2s ease;
  }
  .inventory-history-table-header-col:hover {
    color: #23b3f4;
  }
  .inventory-history-inventory-row-card {
    background: #ffffff !important;
    border-radius: 1rem !important;
    border: 1px solid #f1f5f9 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
    margin-bottom: 1rem;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    padding: 1.25rem 1.5rem !important;
  }
  .inventory-history-inventory-row-card:hover {
    transform: translateX(5px);
    border-color: #23b3f4 !important;
    box-shadow: 0 8px 20px rgba(35, 179, 244, 0.08) !important;
  }
  .inventory-history-col-val {
    font-weight: 600;
    color: #334155;
    font-size: 0.875rem;
  }
  .inventory-history-search-filter-hub {
    background: #ffffff;
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  }
  .inventory-history-search-input-container {
    border-radius: 50px !important;
    border: 1.5px solid #e2e8f0 !important;
    background: #ffffff !important;
    height: 40px !important;
    overflow: hidden;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
  }
  .inventory-history-search-input-container:focus-within {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
  }
  .inventory-history-filter-panel {
    background: #ffffff;
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid #f1f5f9;
    margin-top: 1rem;
  }
  .manage-menu-custom-btn-outline {
    border: 1.5px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    font-weight: 700 !important;
    border-radius: 50px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center;
  }
  .manage-menu-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .manage-menu-custom-btn-outline svg {
    color: #23b3f4 !important;
    transition: all 0.2s ease-in-out !important;
  }
  .manage-menu-custom-btn-outline:hover svg {
    color: #fff !important;
  }
  .feedback-custom-btn-outline {
    border: 1.5px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .feedback-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .feedback-custom-btn-outline:hover svg {
    stroke: #fff !important;
  }
  .feedback-custom-btn-solid {
    background-color: #23b3f4 !important;
    border: 1px solid #23b3f4 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .feedback-custom-btn-solid:hover {
    background-color: #179edb !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3) !important;
  }
  .feedback-action-btn-circle {
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
  .feedback-action-btn-circle:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08) !important;
  }
  .feedback-btn-reply-active {
    border-color: #23b3f4 !important;
    color: #23b3f4 !important;
  }
  .feedback-btn-reply-active:hover {
    background: #23b3f4 !important;
    color: #fff !important;
  }
  .feedback-btn-reply-active:hover svg {
    stroke: #fff !important;
  }
  .feedback-btn-delete-active {
    border-color: #cf2637 !important;
    color: #cf2637 !important;
  }
  .feedback-btn-delete-active:hover {
    background: #cf2637 !important;
    color: #fff !important;
  }
  .feedback-btn-delete-active:hover svg {
    stroke: #fff !important;
  }
  .feedback-rating-badge {
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
  .feedback-rating-badge.feedback-warning {
    background: #f59e0b !important;
  }
  .feedback-rating-badge.feedback-danger {
    background: #ef4444 !important;
  }
  .feedback-admin-reply-tag {
    font-size: 0.7rem !important;
    font-weight: 800 !important;
    color: #23b3f4 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    display: block !important;
    margin-top: 0.5rem !important;
  }
  .feedback-admin-reply-content {
    font-size: 0.85rem !important;
    color: #64748b !important;
    display: block !important;
    margin-top: 0.2rem !important;
    padding-left: 0.75rem !important;
    border-left: 2px solid #e2e8f0 !important;
  }
  @media (max-width: 991px) {
    .inventory-history-table-header-row { display: none !important; }
    .inventory-history-inventory-row-card { display: none !important; }
  }
  .feedback-page-size-toggle {
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    margin: 0 !important;
  }
  .inventory-history-search-filter-hub .row {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  .inventory-history-search-filter-hub .row > div {
    display: flex !important;
    align-items: center !important;
    height: 40px !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
  .inventory-history-search-filter-hub .dropdown,
  .inventory-history-search-filter-hub .dropdown-toggle {
    margin: 0 !important;
    display: flex !important;
    align-items: center !important;
    height: 40px !important;
  }
  @media (max-width: 767px) {
    .inventory-history-search-filter-hub .row > div {
      height: 32px !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }
    .inventory-history-interactive-card {
      margin-bottom: 1.5rem !important;
      border-radius: 12px !important;
    }
    .inventory-history-search-filter-hub {
      margin-bottom: 1rem !important;
      padding: 0.75rem !important;
      border-radius: 12px !important;
    }
    .qsr-page-title-container {
      margin-bottom: 1rem !important;
      padding: 0 0.25rem !important;
    }
    /* Sizing adjustments for search, filter, and page size dropdown */
    .inventory-history-search-input-container {
      height: 32px !important;
      margin: 0 !important;
    }
    .inventory-history-search-input-container input {
      font-size: 0.75rem !important;
      padding-top: 2px !important;
      padding-bottom: 2px !important;
    }
    .inventory-history-search-filter-hub .btn-icon-only {
      width: 32px !important;
      height: 32px !important;
      margin: 0 !important;
    }
    .inventory-history-search-filter-hub button.feedback-page-size-toggle,
    .inventory-history-search-filter-hub .feedback-page-size-toggle,
    .inventory-history-search-filter-hub .dropdown,
    .inventory-history-search-filter-hub .dropdown-toggle {
      font-size: 0.7rem !important;
      padding-left: 8px !important;
      padding-right: 8px !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      height: 32px !important;
      margin: 0 !important;
    }
  }
  .border-dashed-mobile {
    border-top: 1px dashed #e2e8f0 !important;
  }
  .mobile-actions-wrapper .d-flex {
    justify-content: flex-start !important;
  }
`;

const Feedback = () => {
  const title = 'Manage Feedback';
  const description = 'View and manage customer feedback';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'feedback-management', text: 'Feedback' },
    { to: 'feedback-management', title: 'Manage Feedback' },
  ];

  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', rating: '' });

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

  // Local Memoized Filtering Logic
  const filteredFeedbacks = React.useMemo(() => {
    return feedbacks.filter((fb) => {
      // 1. Date Filter
      if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        const fbDate = new Date(fb.date);
        from.setHours(0, 0, 0, 0);
        fbDate.setHours(0, 0, 0, 0);
        if (fbDate < from) return false;
      }
      if (filters.toDate) {
        const to = new Date(filters.toDate);
        const fbDate = new Date(fb.date);
        to.setHours(23, 59, 59, 999);
        fbDate.setHours(0, 0, 0, 0);
        if (fbDate > to) return false;
      }
      // 2. Rating Filter
      if (filters.rating) {
        if (Number(fb.rating) !== Number(filters.rating)) return false;
      }
      return true;
    });
  }, [feedbacks, filters]);

  const activeFilterCount = Object.values(filters).filter((x) => x !== '').length;

  const columns = React.useMemo(
    () => [
      {
        Header: 'Contact Info',
        id: 'contact',
        flex: 2.2,
        Cell: ({ row }) => (
          <div>
            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>
              {row.original.customer_name || 'Walk-in'}
            </div>
            <div className="text-dark small fw-medium mt-1">{row.original.customer_email || 'No Email'}</div>
            <div className="text-muted small mt-1">{row.original.customer_phone || 'No Phone'}</div>
          </div>
        ),
      },
      {
        Header: 'Date',
        accessor: 'date',
        flex: 1.2,
        Cell: ({ value }) => <span className="text-muted small">{value ? new Date(value).toLocaleDateString('en-IN') : 'N/A'}</span>,
      },
      {
        Header: 'Rating',
        accessor: 'rating',
        flex: 1,
        Cell: ({ value }) => {
          const status = value >= 4 ? '' : value >= 3 ? 'feedback-warning' : 'feedback-danger';
          return <div className={`feedback-rating-badge ${status}`}>{value} ★</div>;
        },
      },
      {
        Header: 'Feedback & Reply',
        accessor: 'feedback',
        flex: 4,
        Cell: ({ row }) => (
          <div>
            <div className="text-dark italic" style={{ fontStyle: 'italic' }}>
              “{row.original.feedback}”
            </div>
            {row.original.order_id && (
              <div className="mt-1">
                <Button
                  variant="link"
                  className="p-0 text-primary small d-inline-flex align-items-center gap-1"
                  style={{ fontSize: '11px', textDecoration: 'none' }}
                  onClick={() => history.push(`/operations/order-details/${row.original.order_id}`)}
                >
                  <CsLineIcons icon="shop" size="12" />
                  <span>View Linked Order</span>
                </Button>
              </div>
            )}
            {row.original.reply && (
              <div className="mt-2 p-2 rounded bg-light" style={{ borderLeft: '3px solid #23b3f4' }}>
                <span className="feedback-admin-reply-tag">Your Reply:</span>
                <span className="feedback-admin-reply-content">{row.original.reply}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        Header: 'Actions',
        id: 'actions',
        flex: 1.2,
        headerClassName: 'text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center gap-2">
            <Button
              className="feedback-action-btn-circle feedback-btn-reply-active shadow-sm"
              onClick={() => handleReply(row.original)}
              title={row.original.reply ? 'View / Edit Reply' : 'Reply'}
            >
              <CsLineIcons icon="message" size="16" stroke="currentColor" />
            </Button>
            <Button
              className="feedback-action-btn-circle feedback-btn-delete-active shadow-sm"
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
      data: filteredFeedbacks,
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
    <div className="inventory-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="container-fluid qsr-page-container px-0 px-sm-3">
        {/* Page Header */}
        <div className="qsr-page-title-container">
          <Row className="g-3 align-items-center">
            <Col xs="12" md="7">
              <h1 className="qsr-page-title">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button onClick={() => history.push('/operations/qr-for-feedback')} className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2">
                <CsLineIcons icon="qr-code" size="18" className="me-2" /> Feedback QR
              </Button>
            </Col>
          </Row>
        </div>

        {/* Content Card Wrapper */}
        <Card className="inventory-history-interactive-card border-0">
          <Card.Body className="p-2 p-sm-4 p-lg-5">
            {/* Title Section */}
            <div className="inventory-history-section-title-wrapper mb-4">
              <div
                className="sw-6 sh-6 rounded-xl d-flex align-items-center justify-content-center shadow-sm"
                style={{ background: 'rgba(35, 179, 244, 0.12)', borderRadius: '1rem', width: '48px', height: '48px' }}
              >
                <CsLineIcons icon="message" size="24" style={{ color: '#23b3f4' }} />
              </div>
              <div>
                <h2 className="h4 mb-0 fw-bold">Customer Feedback</h2>
                <p className="text-muted small mb-0">Reviews and responses from your guests</p>
              </div>
            </div>

            {/* Table Controls */}
            <div className="inventory-history-search-filter-hub border-0 shadow-sm">
              <Row className="g-2 g-md-3 align-items-center flex-nowrap">
                <Col xs className="flex-grow-1">
                  <div className="inventory-history-search-input-container">
                    <ControlsSearch tableInstance={tableInstance} />
                  </div>
                </Col>
                <Col xs="auto" className="px-1 d-flex justify-content-center align-items-center flex-shrink-0">
                  <Button
                    variant={showFilters ? 'primary' : 'outline-primary'}
                    className="btn-icon btn-icon-only position-relative rounded-circle border-2 d-inline-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px' }}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <CsLineIcons icon={showFilters ? 'close' : 'filter'} size="16" />
                    {activeFilterCount > 0 && (
                      <Badge
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle rounded-circle border border-2 border-white"
                        style={{ fontSize: '0.65rem', padding: '0.3em 0.5em' }}
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </Col>
                <Col xs="auto" className="ps-1 text-end d-flex align-items-center justify-content-end gap-2 gap-md-3 mt-0 flex-shrink-0">
                  <span className="d-none d-lg-inline-block smaller text-muted fw-bold">
                    {loading
                      ? 'Processing...'
                      : `Showing ${filteredFeedbacks.length > 0 ? tableInstance.state.pageIndex * tableInstance.state.pageSize + 1 : 0}-${Math.min(
                          (tableInstance.state.pageIndex + 1) * tableInstance.state.pageSize,
                          filteredFeedbacks.length
                        )} of ${filteredFeedbacks.length}`}
                  </span>
                  <ControlsPageSize tableInstance={tableInstance} />
                </Col>
              </Row>
            </div>

            {/* Collapsible Filter Panel */}
            <Collapse in={showFilters}>
              <div>
                <div className="inventory-history-filter-panel mb-4 shadow-sm">
                  <Row className="g-3">
                    <Col xs="6" md="4">
                      <span className="text-uppercase small fw-bold text-muted d-block mb-1">From Date</span>
                      <Form.Control type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
                    </Col>
                    <Col xs="6" md="4">
                      <span className="text-uppercase small fw-bold text-muted d-block mb-1">To Date</span>
                      <Form.Control type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
                    </Col>
                    <Col xs="12" md="3">
                      <span className="text-uppercase small fw-bold text-muted d-block mb-1">Rating</span>
                      <Form.Select value={filters.rating} onChange={(e) => setFilters({ ...filters, rating: e.target.value })}>
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </Form.Select>
                    </Col>
                    <Col xs="12" md="1" className="d-flex align-items-end justify-content-md-end justify-content-start mt-2 mt-md-0">
                      <Button
                        variant="light"
                        size="sm"
                        className="rounded-pill px-4 fw-bold w-100 w-md-auto"
                        onClick={() => setFilters({ fromDate: '', toDate: '', rating: '' })}
                      >
                        Clear
                      </Button>
                    </Col>
                  </Row>
                </div>
              </div>
            </Collapse>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" style={{ color: '#23b3f4' }} />
                <p className="mt-3 text-muted">Synchronizing feedback data...</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <Alert variant="light" className="text-center py-5 border-dashed rounded-4">
                No records found.
              </Alert>
            ) : (
              <>
                {/* Unified Card-List Row Layout */}
                <div className="inventory-list-wrapper">
                  {/* Table Header Row (Desktop only) */}
                  <div className="inventory-history-table-header-row">
                    {tableInstance.headerGroups[0].headers.map((column, idx) => (
                      <div
                        key={idx}
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className={classNames('inventory-history-table-header-col', column.headerClassName)}
                        style={{
                          width: column.width || 'auto',
                          flex: column.flex || 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {column.render('Header')}
                        {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                      </div>
                    ))}
                  </div>

                  {/* Card rows */}
                  {tableInstance.page.map((row, idx) => {
                    tableInstance.prepareRow(row);
                    
                    const contactCell = row.cells.find(c => c.column.id === 'contact');
                    const dateCell = row.cells.find(c => c.column.id === 'date');
                    const ratingCell = row.cells.find(c => c.column.id === 'rating');
                    const feedbackCell = row.cells.find(c => c.column.id === 'feedback');
                    const actionsCell = row.cells.find(c => c.column.id === 'actions');

                    return (
                      <React.Fragment key={idx}>
                        {/* Desktop Row view */}
                        <div className="d-none d-md-flex inventory-history-inventory-row-card shadow-sm">
                          {row.cells.map((cell, cidx) => (
                            <div
                              key={cidx}
                              style={{
                                width: cell.column.width || 'auto',
                                flex: cell.column.flex || (cell.column.id === 'actions' ? 1.2 : 1),
                              }}
                            >
                              <div className="inventory-history-col-val">{cell.render('Cell')}</div>
                            </div>
                          ))}
                        </div>

                        {/* Mobile Responsive Card view using Bootstrap elements */}
                        <Card className="d-md-none border mb-3 shadow-sm rounded-3 p-3">
                          <Row className="g-2">
                            {/* Contact Info (full width) */}
                            <Col xs={12} className="mb-2">
                              <span className="text-uppercase text-muted fw-bold d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Contact Info</span>
                              <div className="inventory-history-col-val">{contactCell.render('Cell')}</div>
                            </Col>

                            {/* Date (half width) */}
                            <Col xs={6} className="mb-2">
                              <span className="text-uppercase text-muted fw-bold d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Date</span>
                              <div className="inventory-history-col-val">{dateCell.render('Cell')}</div>
                            </Col>

                            {/* Rating (half width) */}
                            <Col xs={6} className="mb-2">
                              <span className="text-uppercase text-muted fw-bold d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Rating</span>
                              <div className="inventory-history-col-val">{ratingCell.render('Cell')}</div>
                            </Col>

                            {/* Feedback & Reply (full width) */}
                            <Col xs={12} className="mb-2">
                              <span className="text-uppercase text-muted fw-bold d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Feedback & Reply</span>
                              <div className="inventory-history-col-val">{feedbackCell.render('Cell')}</div>
                            </Col>

                            {/* Actions (full width) */}
                            <Col xs={12} className="pt-2 border-top border-dashed-mobile mt-1">
                              <span className="text-uppercase text-muted fw-bold d-block mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Actions</span>
                              <div className="mobile-actions-wrapper">
                                {actionsCell.render('Cell')}
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="mt-4 d-flex justify-content-center">
                  <TablePagination tableInstance={tableInstance} />
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Reply Modal */}
      <Modal
        show={showReplyModal}
        onHide={() => setShowReplyModal(false)}
        centered
        backdrop="static"
        className="rounded-4"
        style={{ backdropFilter: 'blur(5px)' }}
        contentClassName="border-0 shadow-lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#23b3f4' }}>
            Respond to Feedback
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {selectedFeedback && (
            <>
              <div className="mb-4 p-3 rounded-4 bg-light border">
                <div className="small fw-bold text-primary mb-1 text-uppercase letter-spacing-1">Customer Review</div>
                <p className="text-dark mb-0 italic" style={{ fontStyle: 'italic' }}>
                  “{selectedFeedback.feedback}”
                </p>
              </div>
              <Form.Group className="mb-0">
                <Form.Label className="small fw-bold text-muted text-uppercase">Your response</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response here..."
                  className="rounded-4 border-light shadow-sm bg-white"
                  style={{ resize: 'none', padding: '1rem', borderRadius: '12px' }}
                  disabled={sendingReply}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 d-flex gap-3">
          <Button
            className="px-4 py-2 feedback-custom-btn-outline flex-grow-1 d-flex align-items-center justify-content-center gap-2"
            onClick={() => setShowReplyModal(false)}
            disabled={sendingReply}
          >
            Cancel
          </Button>
          <Button
            className="px-4 py-2 feedback-custom-btn-solid flex-grow-1 d-flex align-items-center justify-content-center gap-2"
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

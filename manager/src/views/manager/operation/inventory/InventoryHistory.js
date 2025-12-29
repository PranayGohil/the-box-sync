import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Row, Modal, Spinner, Alert } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const InventoryHistory = () => {
  const history = useHistory();
  const title = 'Inventory History';
  const description = 'Completed and Rejected inventory with modern table UI.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/inventory-history', text: 'Operations' },
    { to: 'operations/inventory-history', title: 'Inventory History' },
  ];

  // Completed inventory state
  const [completedData, setCompletedData] = useState([]);
  const [completedPageIndex, setCompletedPageIndex] = useState(0);
  const [completedPageSize, setCompletedPageSize] = useState(10);
  const [completedTotalRecords, setCompletedTotalRecords] = useState(0);
  const [completedTotalPages, setCompletedTotalPages] = useState(0);
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');

  // Rejected inventory state
  const [rejectedData, setRejectedData] = useState([]);
  const [rejectedPageIndex, setRejectedPageIndex] = useState(0);
  const [rejectedPageSize, setRejectedPageSize] = useState(10);
  const [rejectedTotalRecords, setRejectedTotalRecords] = useState(0);
  const [rejectedTotalPages, setRejectedTotalPages] = useState(0);
  const [rejectedSearchTerm, setRejectedSearchTerm] = useState('');

  const [loading, setLoading] = useState({ completed: true, rejected: true });
  const [error, setError] = useState({ completed: '', rejected: '' });

  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);

  // Refs to prevent infinite loops
  const completedFetchRef = useRef(false);
  const rejectedFetchRef = useRef(false);

  const truncateWords = (text, limit = 8) => {
    if (!text) return '';
    const words = text.split(' ');
    return words.length > limit ? words.slice(0, limit).join(' ') : text;
  };

  const fetchCompletedInventory = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, completed: true }));
      setError(prev => ({ ...prev, completed: '' }));

      const params = {
        page: completedPageIndex + 1,
        limit: completedPageSize,
      };

      if (completedSearchTerm) {
        params.search = completedSearchTerm;
      }

      const res = await axios.get(
        `${process.env.REACT_APP_API}/inventory/get-by-status/Completed`,
        {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (res.data.success) {
        const completedInventory = res.data.data.map((item) => ({
          ...item,
          request_date_obj: new Date(item.request_date),
          formatted_request_date: new Date(item.request_date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          bill_date_obj: new Date(item.bill_date),
          formatted_bill_date: new Date(item.bill_date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        }));

        setCompletedData(completedInventory);

        if (res.data.pagination) {
          setCompletedTotalRecords(res.data.pagination.total || 0);
          setCompletedTotalPages(res.data.pagination.totalPages || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching completed inventory:', err);
      setError(prev => ({ ...prev, completed: 'Failed to load completed inventory.' }));
      toast.error('Failed to fetch completed inventory.');
    } finally {
      setLoading(prev => ({ ...prev, completed: false }));
      completedFetchRef.current = false;
    }
  }, [completedPageIndex, completedPageSize, completedSearchTerm]);

  const fetchRejectedInventory = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, rejected: true }));
      setError(prev => ({ ...prev, rejected: '' }));

      const params = {
        page: rejectedPageIndex + 1,
        limit: rejectedPageSize,
      };

      if (rejectedSearchTerm) {
        params.search = rejectedSearchTerm;
      }

      const res = await axios.get(
        `${process.env.REACT_APP_API}/inventory/get-by-status/Rejected`,
        {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (res.data.success) {
        const rejectedInventory = res.data.data.map((item) => ({
          ...item,
          request_date_obj: new Date(item.request_date),
          formatted_request_date: new Date(item.request_date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          bill_date_obj: new Date(item.bill_date),
          formatted_bill_date: new Date(item.bill_date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        }));

        setRejectedData(rejectedInventory);

        if (res.data.pagination) {
          setRejectedTotalRecords(res.data.pagination.total || 0);
          setRejectedTotalPages(res.data.pagination.totalPages || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching rejected inventory:', err);
      setError(prev => ({ ...prev, rejected: 'Failed to load rejected inventory.' }));
      toast.error('Failed to fetch rejected inventory.');
    } finally {
      setLoading(prev => ({ ...prev, rejected: false }));
      rejectedFetchRef.current = false;
    }
  }, [rejectedPageIndex, rejectedPageSize, rejectedSearchTerm]);

  useEffect(() => {
    if (!completedFetchRef.current) {
      completedFetchRef.current = true;
      fetchCompletedInventory();
    }
  }, [fetchCompletedInventory]);

  useEffect(() => {
    if (!rejectedFetchRef.current) {
      rejectedFetchRef.current = true;
      fetchRejectedInventory();
    }
  }, [fetchRejectedInventory]);

  const handleCompletedPageChange = (newPageIndex) => {
    setCompletedPageIndex(newPageIndex);
  };

  const handleCompletedPageSizeChange = (newPageSize) => {
    setCompletedPageSize(newPageSize);
    setCompletedPageIndex(0);
  };

  const handleCompletedSearch = useCallback((value) => {
    setCompletedSearchTerm(value);
    setCompletedPageIndex(0);
  }, []);

  const handleRejectedPageChange = (newPageIndex) => {
    setRejectedPageIndex(newPageIndex);
  };

  const handleRejectedPageSizeChange = (newPageSize) => {
    setRejectedPageSize(newPageSize);
    setRejectedPageIndex(0);
  };

  const handleRejectedSearch = useCallback((value) => {
    setRejectedSearchTerm(value);
    setRejectedPageIndex(0);
  }, []);

  const handleRefresh = () => {
    completedFetchRef.current = true;
    rejectedFetchRef.current = true;
    fetchCompletedInventory();
    fetchRejectedInventory();
  };

  const completedColumns = React.useMemo(
    () => [
      {
        Header: 'Requested Date',
        accessor: 'formatted_request_date',
        headerClassName: 'text-muted text-small text-uppercase',
      },
      {
        Header: 'Bill Date',
        accessor: 'formatted_bill_date',
        headerClassName: 'text-muted text-small text-uppercase',
      },
      {
        Header: 'Bill Number',
        accessor: 'bill_number',
        headerClassName: 'text-muted text-small text-uppercase',
      },
      {
        Header: 'Vendor Name',
        accessor: 'vendor_name',
        headerClassName: 'text-muted text-small text-uppercase',
      },
      {
        Header: 'Total Amount',
        accessor: 'total_amount',
        Cell: ({ value }) => <span className="fw-bold">₹{value}</span>,
        headerClassName: 'text-muted text-small text-uppercase',
      },
      {
        Header: 'Unpaid Amount',
        accessor: 'unpaid_amount',
        Cell: ({ value }) => (
          <span className={value > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
            ₹{value}
          </span>
        ),
        headerClassName: 'text-muted text-small text-uppercase',
      },
      {
        Header: 'Actions',
        headerClassName: 'text-muted text-small text-uppercase text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center">
            <Button
              variant="outline-primary"
              size="sm"
              title="View Details"
              onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}
              disabled={loading.completed || loading.rejected}
            >
              <CsLineIcons icon="eye" />
            </Button>
          </div>
        ),
      },
    ],
    [loading, history]
  );

  const rejectedColumns = React.useMemo(
    () => [
      {
        Header: 'Requested Date',
        accessor: 'formatted_request_date',
        headerClassName: 'text-muted text-small text-uppercase',
      },
      {
        Header: 'Items',
        accessor: 'items',
        Cell: ({ cell }) => (
          <div>
            {cell.value.slice(0, 2).map((item, i) => (
              <div key={i} className="text-truncate" style={{ maxWidth: '200px' }}>
                {item.item_name} - {item.item_quantity} {item.unit}
              </div>
            ))}
            {cell.value.length > 2 && (
              <small className="text-muted">+{cell.value.length - 2} more items</small>
            )}
          </div>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ cell }) => <Badge bg="danger">{cell.value}</Badge>,
      },
      {
        Header: 'Reject Reason',
        accessor: 'reject_reason',
        Cell: ({ cell }) => {
          const text = cell.value || '';
          const isLong = text.split(' ').length > 8;

          return (
            <div>
              <span>{truncateWords(text, 8)}</span>
              {isLong && (
                <>
                  {'... '}
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => {
                      setSelectedRejectReason(text);
                      setShowRejectReasonModal(true);
                    }}
                  >
                    More
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
      {
        Header: 'Actions',
        headerClassName: 'text-muted text-small text-uppercase text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center">
            <Button
              variant="outline-primary"
              size="sm"
              title="View Details"
              onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}
              disabled={loading.completed || loading.rejected}
            >
              <CsLineIcons icon="eye" />
            </Button>
          </div>
        ),
      },
    ],
    [loading, history]
  );

  const completedTable = useTable(
    {
      columns: completedColumns,
      data: completedData,
      manualPagination: true,
      manualSortBy: true,
      manualGlobalFilter: true,
      pageCount: completedTotalPages,
      autoResetPage: false,
      autoResetSortBy: false,
      autoResetGlobalFilter: false,
    },
    useGlobalFilter,
    useSortBy
  );

  const rejectedTable = useTable(
    {
      columns: rejectedColumns,
      data: rejectedData,
      manualPagination: true,
      manualSortBy: true,
      manualGlobalFilter: true,
      pageCount: rejectedTotalPages,
      autoResetPage: false,
      autoResetSortBy: false,
      autoResetGlobalFilter: false,
    },
    useGlobalFilter,
    useSortBy
  );

  const completedPaginationProps = {
    canPreviousPage: completedPageIndex > 0,
    canNextPage: completedPageIndex < completedTotalPages - 1,
    pageCount: completedTotalPages,
    pageIndex: completedPageIndex,
    gotoPage: handleCompletedPageChange,
    nextPage: () => handleCompletedPageChange(completedPageIndex + 1),
    previousPage: () => handleCompletedPageChange(completedPageIndex - 1),
  };

  const rejectedPaginationProps = {
    canPreviousPage: rejectedPageIndex > 0,
    canNextPage: rejectedPageIndex < rejectedTotalPages - 1,
    pageCount: rejectedTotalPages,
    pageIndex: rejectedPageIndex,
    gotoPage: handleRejectedPageChange,
    nextPage: () => handleRejectedPageChange(rejectedPageIndex + 1),
    previousPage: () => handleRejectedPageChange(rejectedPageIndex - 1),
  };

  return (
    <>
      <HtmlHead title={title} description={description} />
      <Row>
        <Col>
          <div className="page-title-container mb-3">
            <Row className="align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="text-md-end mt-2 mt-md-0">
                <Button
                  variant="outline-primary"
                  onClick={handleRefresh}
                  disabled={loading.completed || loading.rejected}
                >
                  <CsLineIcons icon="refresh" className="me-2" />
                  Refresh
                </Button>
              </Col>
            </Row>
          </div>

          {/* Completed Requests */}
          <div className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">
                Completed Requests
                <span className="text-muted ms-2">({completedTotalRecords})</span>
              </h4>
            </div>

            {/* Search and controls - Always visible */}
            <Row className="mb-3">
              <Col sm="12" md="5" lg="3" xxl="2">
                <div className="search-input-container w-100 shadow bg-foreground">
                  <ControlsSearch onSearch={handleCompletedSearch} />
                </div>
              </Col>
              <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
                <div className="d-inline-block me-2 text-muted">
                  {loading.completed ? (
                    'Loading...'
                  ) : (
                    <>
                      Showing {completedData.length > 0 ? completedPageIndex * completedPageSize + 1 : 0} to{' '}
                      {Math.min((completedPageIndex + 1) * completedPageSize, completedTotalRecords)} of{' '}
                      {completedTotalRecords} entries
                    </>
                  )}
                </div>
                <div className="d-inline-block">
                  <ControlsPageSize
                    pageSize={completedPageSize}
                    onPageSizeChange={handleCompletedPageSizeChange}
                  />
                </div>
              </Col>
            </Row>

            {loading.completed ? (
              <Row className="justify-content-center my-5">
                <Col xs={12} className="text-center">
                  <Spinner animation="border" variant="success" className="mb-3" />
                  <h5>Loading Completed Inventory...</h5>
                  <p className="text-muted">Please wait while we fetch completed requests</p>
                </Col>
              </Row>
            ) : error.completed ? (
              <Alert variant="danger" className="mb-4">
                <CsLineIcons icon="error" className="me-2" />
                {error.completed}
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="ms-3"
                  onClick={() => {
                    completedFetchRef.current = true;
                    fetchCompletedInventory();
                  }}
                >
                  Retry
                </Button>
              </Alert>
            ) : completedData.length === 0 ? (
              <Alert variant="info" className="mb-4">
                <CsLineIcons icon="inbox" className="me-2" />
                {completedSearchTerm
                  ? `No results found for "${completedSearchTerm}"`
                  : 'No completed inventory found.'}
              </Alert>
            ) : (
              <>
                <Table className="react-table rows" tableInstance={completedTable} />
                <TablePagination paginationProps={completedPaginationProps} />
              </>
            )}
          </div>

          {/* Rejected Requests */}
          <div className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">
                <CsLineIcons icon="x-circle" className="me-2 text-danger" />
                Rejected Requests
                <span className="text-muted ms-2">({rejectedTotalRecords})</span>
              </h4>
            </div>

            {/* Search and controls - Always visible */}
            <Row className="mb-3">
              <Col sm="12" md="5" lg="3" xxl="2">
                <div className="search-input-container w-100 shadow bg-foreground">
                  <ControlsSearch onSearch={handleRejectedSearch} />
                </div>
              </Col>
              <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
                <div className="d-inline-block me-2 text-muted">
                  {loading.rejected ? (
                    'Loading...'
                  ) : (
                    <>
                      Showing {rejectedData.length > 0 ? rejectedPageIndex * rejectedPageSize + 1 : 0} to{' '}
                      {Math.min((rejectedPageIndex + 1) * rejectedPageSize, rejectedTotalRecords)} of{' '}
                      {rejectedTotalRecords} entries
                    </>
                  )}
                </div>
                <div className="d-inline-block">
                  <ControlsPageSize
                    pageSize={rejectedPageSize}
                    onPageSizeChange={handleRejectedPageSizeChange}
                  />
                </div>
              </Col>
            </Row>

            {loading.rejected ? (
              <Row className="justify-content-center my-5">
                <Col xs={12} className="text-center">
                  <Spinner animation="border" variant="danger" className="mb-3" />
                  <h5>Loading Rejected Inventory...</h5>
                  <p className="text-muted">Please wait while we fetch rejected requests</p>
                </Col>
              </Row>
            ) : error.rejected ? (
              <Alert variant="danger" className="mb-4">
                <CsLineIcons icon="error" className="me-2" />
                {error.rejected}
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="ms-3"
                  onClick={() => {
                    rejectedFetchRef.current = true;
                    fetchRejectedInventory();
                  }}
                >
                  Retry
                </Button>
              </Alert>
            ) : rejectedData.length === 0 ? (
              <Alert variant="info" className="mb-4">
                <CsLineIcons icon="inbox" className="me-2" />
                {rejectedSearchTerm
                  ? `No results found for "${rejectedSearchTerm}"`
                  : 'No rejected inventory found.'}
              </Alert>
            ) : (
              <>
                <Table className="react-table rows" tableInstance={rejectedTable} />
                <TablePagination paginationProps={rejectedPaginationProps} />
              </>
            )}
          </div>
        </Col>
      </Row>

      <Modal
        show={showRejectReasonModal}
        onHide={() => setShowRejectReasonModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons icon="warning" className="text-danger me-2" />
            Reject Reason
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <p className="mb-0">{selectedRejectReason}</p>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectReasonModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryHistory;
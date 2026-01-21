import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Row, Modal, Spinner, Alert, Card, Collapse, Form } from 'react-bootstrap';
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
  const [completedFilters, setCompletedFilters] = useState({
    requestFromDate: '',
    requestToDate: '',
    billFromDate: '',
    billToDate: '',
  });

  // Rejected inventory state
  const [rejectedData, setRejectedData] = useState([]);
  const [rejectedPageIndex, setRejectedPageIndex] = useState(0);
  const [rejectedPageSize, setRejectedPageSize] = useState(10);
  const [rejectedTotalRecords, setRejectedTotalRecords] = useState(0);
  const [rejectedTotalPages, setRejectedTotalPages] = useState(0);
  const [rejectedSearchTerm, setRejectedSearchTerm] = useState('');
  const [rejectedFilters, setRejectedFilters] = useState({
    requestFromDate: '',
    requestToDate: '',
    billFromDate: '',
    billToDate: '',
  });

  const [loading, setLoading] = useState({ completed: true, rejected: true });
  const [show, setShow] = useState(false);
  const [data, setData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('');

  // Filter visibility state
  const [showCompletedFilters, setShowCompletedFilters] = useState(false);
  const [showRejectedFilters, setShowRejectedFilters] = useState(false);

  // Use refs to prevent infinite loops
  const completedFetchRef = useRef(false);
  const rejectedFetchRef = useRef(false);

  const handleShow = (rowData) => {
    setData(rowData);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setData(null);
  };

  const truncateWords = (text, limit = 8) => {
    if (!text) return '';
    const words = text.split(' ');
    return words.length > limit ? words.slice(0, limit).join(' ') : text;
  };

  const getCompletedActiveFilterCount = () => {
    let count = 0;
    if (completedFilters.requestFromDate) count++;
    if (completedFilters.requestToDate) count++;
    if (completedFilters.billFromDate) count++;
    if (completedFilters.billToDate) count++;
    if (completedSearchTerm) count++;
    return count;
  };

  const getRejectedActiveFilterCount = () => {
    let count = 0;
    if (rejectedFilters.requestFromDate) count++;
    if (rejectedFilters.requestToDate) count++;
    if (rejectedFilters.billFromDate) count++;
    if (rejectedFilters.billToDate) count++;
    if (rejectedSearchTerm) count++;
    return count;
  };

  const fetchCompletedInventory = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, completed: true }));

      const params = {
        page: completedPageIndex + 1,
        limit: completedPageSize,
      };

      if (completedSearchTerm) {
        params.search = completedSearchTerm;
      }

      if (completedFilters.requestFromDate) {
        params.request_from = completedFilters.requestFromDate;
      }

      if (completedFilters.requestToDate) {
        params.request_to = completedFilters.requestToDate;
      }

      if (completedFilters.billFromDate) {
        params.bill_from = completedFilters.billFromDate;
      }

      if (completedFilters.billToDate) {
        params.bill_to = completedFilters.billToDate;
      }

      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Completed`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

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
    } catch (error) {
      console.error('Error fetching completed inventory:', error);
      toast.error('Failed to fetch completed inventory. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, completed: false }));
      completedFetchRef.current = false;
    }
  }, [completedPageIndex, completedPageSize, completedSearchTerm, completedFilters]);

  const fetchRejectedInventory = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, rejected: true }));

      const params = {
        page: rejectedPageIndex + 1,
        limit: rejectedPageSize,
      };

      if (rejectedSearchTerm) {
        params.search = rejectedSearchTerm;
      }

      if (rejectedFilters.requestFromDate) {
        params.request_from = rejectedFilters.requestFromDate;
      }

      if (rejectedFilters.requestToDate) {
        params.request_to = rejectedFilters.requestToDate;
      }

      if (rejectedFilters.billFromDate) {
        params.bill_from = rejectedFilters.billFromDate;
      }

      if (rejectedFilters.billToDate) {
        params.bill_to = rejectedFilters.billToDate;
      }

      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Rejected`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

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
    } catch (error) {
      console.error('Error fetching rejected inventory:', error);
      toast.error('Failed to fetch rejected inventory. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, rejected: false }));
      rejectedFetchRef.current = false;
    }
  }, [rejectedPageIndex, rejectedPageSize, rejectedSearchTerm, rejectedFilters]);

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

  const handleCompletedFilterChange = (filterName, value) => {
    setCompletedFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCompletedPageIndex(0);
  };

  const handleClearCompletedFilters = () => {
    setCompletedFilters({
      requestFromDate: '',
      requestToDate: '',
      billFromDate: '',
      billToDate: '',
    });
    setCompletedSearchTerm('');
    setCompletedPageIndex(0);
  };

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

  const handleRejectedFilterChange = (filterName, value) => {
    setRejectedFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setRejectedPageIndex(0);
  };

  const handleClearRejectedFilters = () => {
    setRejectedFilters({
      requestFromDate: '',
      requestToDate: '',
      billFromDate: '',
      billToDate: '',
    });
    setRejectedSearchTerm('');
    setRejectedPageIndex(0);
  };

  const completedColumns = React.useMemo(
    () => [
      { Header: 'Requested Date', accessor: 'formatted_request_date' },
      { Header: 'Bill Date', accessor: 'formatted_bill_date' },
      { Header: 'Bill Number', accessor: 'bill_number' },
      { Header: 'Vendor Name', accessor: 'vendor_name' },
      { Header: 'Total Amount', accessor: 'total_amount' },
      { Header: 'Unpaid Amount', accessor: 'unpaid_amount' },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              title="View"
              className="btn-icon btn-icon-only"
              onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}
            >
              <CsLineIcons icon="eye" />
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              title="Edit"
              className="btn-icon btn-icon-only"
              onClick={() => history.push(`/operations/edit-inventory/${row.original._id}`)}
            >
              <CsLineIcons icon="edit" />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              title="Delete"
              className="btn-icon btn-icon-only"
              onClick={() => handleShow(row.original)}
              disabled={isDeleting}
            >
              <CsLineIcons icon="bin" />
            </Button>
          </div>
        ),
      },
    ],
    [history, isDeleting]
  );

  const rejectedColumns = React.useMemo(
    () => [
      { Header: 'Requested Date', accessor: 'formatted_request_date' },
      {
        Header: 'Items',
        accessor: 'items',
        Cell: ({ cell }) =>
          cell.value.map((item, i) => (
            <div key={i}>
              {item.item_name} - {item.item_quantity} {item.unit}
            </div>
          )),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ cell }) => <Badge bg="danger">{cell.value}</Badge>,
      },
      {
        Header: 'Reason',
        accessor: 'reject_reason',
        Cell: ({ cell }) => {
          const text = cell.value || '';
          const isLong = text.split(' ').length > 8;

          return (
            <div style={{ minWidth: '200px' }}>
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
        Cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              title="View"
              className="btn-icon btn-icon-only"
              onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}
            >
              <CsLineIcons icon="eye" />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              title="Delete"
              className="btn-icon btn-icon-only"
              onClick={() => handleShow(row.original)}
              disabled={isDeleting}
            >
              <CsLineIcons icon="bin" />
            </Button>
          </div>
        ),
      },
    ],
    [history, isDeleting]
  );

  const handleDelete = async () => {
    if (!data?._id) return;
    setIsDeleting(true);

    try {
      const res = await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${data._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.status === 200 || res.data.success) {
        toast.success('Inventory deleted successfully!');
        handleClose();
        // Refresh both lists
        completedFetchRef.current = true;
        rejectedFetchRef.current = true;
        fetchCompletedInventory();
        fetchRejectedInventory();
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast.error('Failed to delete inventory. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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
            <Row>
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
            </Row>
          </div>

          {/* Completed Requests */}
          <h4 className="mb-3">
            Completed Requests
            <span className="text-muted ms-2">({completedTotalRecords})</span>
          </h4>

          {/* Search and controls - Always visible */}
          <Row className="mb-3">
            <Col sm="12" md="5" lg="3" xxl="2">
              <div className="d-flex gap-2">
                <div className="search-input-container w-100 shadow bg-foreground">
                  <ControlsSearch onSearch={handleCompletedSearch} />
                </div>
                <Button
                  variant={`${showCompletedFilters ? 'secondary' : 'outline-secondary'}`}
                  size="sm"
                  className="btn-icon btn-icon-only position-relative"
                  onClick={() => setShowCompletedFilters(!showCompletedFilters)}
                  title="Filters"
                >
                  <CsLineIcons icon={`${showCompletedFilters ? 'close' : 'filter'}`} />
                  {getCompletedActiveFilterCount() > 0 && (
                    <Badge bg="primary" className="position-absolute top-0 start-100 translate-middle">
                      {getCompletedActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </div>
            </Col>
            <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
              <div className="d-inline-block me-2 text-muted">
                {loading.completed ? (
                  'Loading...'
                ) : (
                  <>
                    Showing {completedData.length > 0 ? completedPageIndex * completedPageSize + 1 : 0} to{' '}
                    {Math.min((completedPageIndex + 1) * completedPageSize, completedTotalRecords)} of {completedTotalRecords} entries
                  </>
                )}
              </div>
              <div className="d-inline-block">
                <ControlsPageSize pageSize={completedPageSize} onPageSizeChange={handleCompletedPageSizeChange} />
              </div>
            </Col>
          </Row>

          {/* Completed Filters */}
          <Collapse in={showCompletedFilters}>
            <Card className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Filters</h5>
                  {getCompletedActiveFilterCount() > 0 && (
                    <Button variant="outline-danger" size="sm" onClick={handleClearCompletedFilters}>
                      <CsLineIcons icon="close" className="me-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="mt-2">
                  <Row>
                    {/* Request Date Range */}
                    <Col md={4} className="mb-3">
                      <Form.Label className="small text-muted fw-bold">Request Date Range</Form.Label>
                      <Row>
                        <Col md={6}>
                          <Form.Label className="small text-muted">From</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={completedFilters.requestFromDate}
                            onChange={(e) => handleCompletedFilterChange('requestFromDate', e.target.value)}
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Label className="small text-muted">To</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={completedFilters.requestToDate}
                            onChange={(e) => handleCompletedFilterChange('requestToDate', e.target.value)}
                          />
                        </Col>
                      </Row>
                    </Col>

                    {/* Bill Date Range */}
                    <Col md={4} className="mb-3">
                      <Form.Label className="small text-muted fw-bold">Bill Date Range</Form.Label>
                      <Row>
                        <Col md={6}>
                          <Form.Label className="small text-muted">From</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={completedFilters.billFromDate}
                            onChange={(e) => handleCompletedFilterChange('billFromDate', e.target.value)}
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Label className="small text-muted">To</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={completedFilters.billToDate}
                            onChange={(e) => handleCompletedFilterChange('billToDate', e.target.value)}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Collapse>

          {loading.completed ? (
            <Row className="justify-content-center my-5">
              <Col xs={12} className="text-center">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p>Loading completed inventory...</p>
              </Col>
            </Row>
          ) : completedData.length === 0 ? (
            <Alert variant="info" className="mb-4">
              <CsLineIcons icon="inbox" className="me-2" />
              {completedSearchTerm || getCompletedActiveFilterCount() > 0
                ? 'No results found. Try adjusting your search or filters.'
                : 'No completed inventory found.'}
            </Alert>
          ) : (
            <Row>
              <Col xs="12" style={{ overflow: 'auto' }}>
                <Table className="react-table rows" tableInstance={completedTable} />
              </Col>
              <Col xs="12">
                <TablePagination paginationProps={completedPaginationProps} />
              </Col>
            </Row>
          )}

          {/* Rejected Requests */}
          <h4 className="mt-5 mb-3">
            Rejected Requests
            <span className="text-muted ms-2">({rejectedTotalRecords})</span>
          </h4>

          {/* Search and controls - Always visible */}
          <Row className="mb-3">
            <Col sm="12" md="5" lg="3" xxl="2">
              <div className="d-flex gap-2">
                <div className="search-input-container w-100 shadow bg-foreground">
                  <ControlsSearch onSearch={handleRejectedSearch} />
                </div>
                <Button
                  variant={`${showRejectedFilters ? 'secondary' : 'outline-secondary'}`}
                  size="sm"
                  className="btn-icon btn-icon-only position-relative"
                  onClick={() => setShowRejectedFilters(!showRejectedFilters)}
                  title="Filters"
                >
                  <CsLineIcons icon={`${showRejectedFilters ? 'close' : 'filter'}`} />
                  {getRejectedActiveFilterCount() > 0 && (
                    <Badge bg="primary" className="position-absolute top-0 start-100 translate-middle">
                      {getRejectedActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </div>
            </Col>
            <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
              <div className="d-inline-block me-2 text-muted">
                {loading.rejected ? (
                  'Loading...'
                ) : (
                  <>
                    Showing {rejectedData.length > 0 ? rejectedPageIndex * rejectedPageSize + 1 : 0} to{' '}
                    {Math.min((rejectedPageIndex + 1) * rejectedPageSize, rejectedTotalRecords)} of {rejectedTotalRecords} entries
                  </>
                )}
              </div>
              <div className="d-inline-block">
                <ControlsPageSize pageSize={rejectedPageSize} onPageSizeChange={handleRejectedPageSizeChange} />
              </div>
            </Col>
          </Row>

          {/* Rejected Filters */}
          <Collapse in={showRejectedFilters}>
            <Card className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Filters</h5>
                  {getRejectedActiveFilterCount() > 0 && (
                    <Button variant="outline-danger" size="sm" onClick={handleClearRejectedFilters}>
                      <CsLineIcons icon="close" className="me-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="mt-2">
                  <Row>
                    {/* Request Date Range */}
                    <Col md={4} className="mb-3">
                      <Form.Label className="small text-muted fw-bold">Request Date Range</Form.Label>
                      <Row>
                        <Col md={6}>
                          <Form.Label className="small text-muted">From</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={rejectedFilters.requestFromDate}
                            onChange={(e) => handleRejectedFilterChange('requestFromDate', e.target.value)}
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Label className="small text-muted">To</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={rejectedFilters.requestToDate}
                            onChange={(e) => handleRejectedFilterChange('requestToDate', e.target.value)}
                          />
                        </Col>
                      </Row>
                    </Col>

                    {/* Bill Date Range */}
                    <Col md={4} className="mb-3">
                      <Form.Label className="small text-muted fw-bold">Bill Date Range</Form.Label>
                      <Row>
                        <Col md={6}>
                          <Form.Label className="small text-muted">From</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={rejectedFilters.billFromDate}
                            onChange={(e) => handleRejectedFilterChange('billFromDate', e.target.value)}
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Label className="small text-muted">To</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={rejectedFilters.billToDate}
                            onChange={(e) => handleRejectedFilterChange('billToDate', e.target.value)}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Collapse>

          {loading.rejected ? (
            <Row className="justify-content-center my-5">
              <Col xs={12} className="text-center">
                <Spinner animation="border" variant="danger" className="mb-3" />
                <p>Loading...</p>
              </Col>
            </Row>
          ) : rejectedData.length === 0 ? (
            <Alert variant="info" className="mb-4">
              <CsLineIcons icon="inbox" className="me-2" />
              {rejectedSearchTerm || getRejectedActiveFilterCount() > 0
                ? 'No results found. Try adjusting your search or filters.'
                : 'No rejected inventory found.'}
            </Alert>
          ) : (
            <Row>
              <Col xs="12" style={{ overflow: 'auto' }}>
                <Table className="react-table rows" tableInstance={rejectedTable} />
              </Col>
              <Col xs="12">
                <TablePagination paginationProps={rejectedPaginationProps} />
              </Col>
            </Row>
          )}
        </Col>
      </Row>

      {/* Delete Inventory Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Inventory?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Delete this inventory item permanently</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal show={showRejectReasonModal} onHide={() => setShowRejectReasonModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reject Reason</Modal.Title>
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

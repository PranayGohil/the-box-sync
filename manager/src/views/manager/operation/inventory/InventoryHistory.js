import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Row, Modal, Spinner, Alert } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
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
  const description = 'Completed and Rejected inventory with modern table UI and dummy data.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/inventory-history', text: 'Operations' },
    { to: 'operations/inventory-history', title: 'Inventory History' },
  ];

  const [loading, setLoading] = useState({
    completed: true,
    rejected: true
  });
  const [completedData, setCompletedData] = useState([]);
  const [rejectedData, setRejectedData] = useState([]);
  const [error, setError] = useState({
    completed: '',
    rejected: ''
  });

  const [show, setShow] = useState(false);
  const [data, setData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);

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
    return words.length > limit
      ? words.slice(0, limit).join(' ')
      : text;
  };

  const fetchCompletedInventory = async () => {
    try {
      setLoading(prev => ({ ...prev, completed: true }));
      setError(prev => ({ ...prev, completed: '' }));

      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Completed`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.data.success) {
        const completedInventory = res.data.data
          .map((item) => ({
            ...item,
            request_date_obj: new Date(item.request_date),
            formatted_request_date: new Date(item.request_date).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            bill_date_obj: new Date(item.bill_date),
            formatted_bill_date: new Date(item.bill_date).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }));

        completedInventory.sort((a, b) => b.request_date_obj - a.request_date_obj);
        setCompletedData(completedInventory);
      }
    } catch (err) {
      console.error('Error fetching completed inventory:', err);
      setError(prev => ({ ...prev, completed: 'Failed to load completed inventory.' }));
      toast.error('Failed to fetch completed inventory.');
    } finally {
      setLoading(prev => ({ ...prev, completed: false }));
    }
  };

  const fetchRejectedInventory = async () => {
    try {
      setLoading(prev => ({ ...prev, rejected: true }));
      setError(prev => ({ ...prev, rejected: '' }));

      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Rejected`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.data.success) {
        const rejectedInventory = res.data.data
          .map((item) => ({
            ...item,
            request_date_obj: new Date(item.request_date),
            formatted_request_date: new Date(item.request_date).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            bill_date_obj: new Date(item.bill_date),
            formatted_bill_date: new Date(item.bill_date).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }));

        rejectedInventory.sort((a, b) => b.request_date_obj - a.request_date_obj);
        setRejectedData(rejectedInventory);
      }
    } catch (err) {
      console.error('Error fetching rejected inventory:', err);
      setError(prev => ({ ...prev, rejected: 'Failed to load rejected inventory.' }));
      toast.error('Failed to fetch rejected inventory.');
    } finally {
      setLoading(prev => ({ ...prev, rejected: false }));
    }
  };

  useEffect(() => {
    fetchCompletedInventory();
    fetchRejectedInventory();
  }, []);

  // Completed Table
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
    [loading]
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
    [loading]
  );

  const completedTable = useTable(
    {
      columns: completedColumns,
      data: completedData,
      initialState: { pageIndex: 0 }
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
  );

  const rejectedTable = useTable(
    {
      columns: rejectedColumns,
      data: rejectedData,
      initialState: { pageIndex: 0 }
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  const handleRefresh = () => {
    fetchCompletedInventory();
    fetchRejectedInventory();
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
                <span className="text-muted ms-2">({completedData.length})</span>
              </h4>
              <small className="text-muted">
                {loading.completed ? 'Loading...' : `${completedData.length} records found`}
              </small>
            </div>

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
                  onClick={fetchCompletedInventory}
                >
                  Retry
                </Button>
              </Alert>
            ) : completedData.length === 0 ? (
              <Alert variant="info" className="mb-4">
                <CsLineIcons icon="inbox" className="me-2" />
                No completed inventory found.
              </Alert>
            ) : (
              <>
                <Row className="mb-3">
                  <Col sm="12" md="5" lg="3" xxl="2">
                    <div className="search-input-container w-100 shadow bg-foreground">
                      <ControlsSearch tableInstance={completedTable} />
                    </div>
                  </Col>
                  <Col className="text-end">
                    <ControlsPageSize tableInstance={completedTable} />
                  </Col>
                </Row>
                <Table className="react-table rows" tableInstance={completedTable} />
                <TablePagination tableInstance={completedTable} />
              </>
            )}
          </div>

          {/* Rejected Requests */}
          <div className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">
                <CsLineIcons icon="x-circle" className="me-2 text-danger" />
                Rejected Requests
                <span className="text-muted ms-2">({rejectedData.length})</span>
              </h4>
              <small className="text-muted">
                {loading.rejected ? 'Loading...' : `${rejectedData.length} records found`}
              </small>
            </div>

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
                  onClick={fetchRejectedInventory}
                >
                  Retry
                </Button>
              </Alert>
            ) : rejectedData.length === 0 ? (
              <Alert variant="info" className="mb-4">
                <CsLineIcons icon="inbox" className="me-2" />
                No rejected inventory found.
              </Alert>
            ) : (
              <>
                <Row className="mb-3">
                  <Col sm="12" md="5" lg="3" xxl="2">
                    <div className="search-input-container w-100 shadow bg-foreground">
                      <ControlsSearch tableInstance={rejectedTable} />
                    </div>
                  </Col>
                  <Col className="text-end">
                    <ControlsPageSize tableInstance={rejectedTable} />
                  </Col>
                </Row>
                <Table className="react-table rows" tableInstance={rejectedTable} />
                <TablePagination tableInstance={rejectedTable} />
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
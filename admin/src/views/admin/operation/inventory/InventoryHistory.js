import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Form, Row, Modal, Spinner, Alert } from 'react-bootstrap';
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

  const [completedData, setCompletedData] = useState([]);
  const [rejectedData, setRejectedData] = useState([]);
  const [loading, setLoading] = useState({ completed: true, rejected: true });
  const [show, setShow] = useState(false);
  const [data, setData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('');

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
    } catch (error) {
      console.error('Error fetching completed inventory:', error);
      toast.error('Failed to fetch completed inventory. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, completed: false }));
    }
  };

  const fetchRejectedInventory = async () => {
    try {
      setLoading(prev => ({ ...prev, rejected: true }));
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
    } catch (error) {
      console.error('Error fetching rejected inventory:', error);
      toast.error('Failed to fetch rejected inventory. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, rejected: false }));
    }
  };

  useEffect(() => {
    fetchCompletedInventory();
    fetchRejectedInventory();
  }, []);

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
              onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}
            >
              <CsLineIcons icon="eye" />
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              title="Edit"
              onClick={() => history.push(`/operations/edit-inventory/${row.original._id}`)}
            >
              <CsLineIcons icon="edit" />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              title="Delete"
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
        Cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              title="View"
              onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}
            >
              <CsLineIcons icon="eye" />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              title="Delete"
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
        setCompletedData((prev) => prev.filter((item) => item._id !== data._id));
        setRejectedData((prev) => prev.filter((item) => item._id !== data._id));
        toast.success('Inventory deleted successfully!');
        handleClose();
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast.error('Failed to delete inventory. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const completedTable = useTable(
    { columns: completedColumns, data: completedData, initialState: { pageIndex: 0 } },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
  );

  const rejectedTable = useTable(
    { columns: rejectedColumns, data: rejectedData, initialState: { pageIndex: 0 } },
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
          <div className="page-title-container mb-3">
            <Row>
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
            </Row>
          </div>

          {/* Completed Requests */}
          <h4 className="mb-3">Completed Requests</h4>
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

          {/* Rejected Requests */}
          <h4 className="mt-5 mb-3">Rejected Requests</h4>
          {loading.rejected ? (
            <Row className="justify-content-center my-5">
              <Col xs={12} className="text-center">
                <Spinner animation="border" variant="danger" className="mb-3" />
                <p>Loading rejected inventory...</p>
              </Col>
            </Row>
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
        </Col>
      </Row>

      {/* Delete Inventory Modal */}
      <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons icon="warning" className="text-warning me-2" />
            Delete Inventory
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this inventory?</p>
          <p>
            <strong>{data?.bill_number}</strong> - {data?.vendor_name}
          </p>
          <Alert variant="warning" className="mt-3">
            <CsLineIcons icon="alert" className="me-2" />
            This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
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
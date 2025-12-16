import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Form, Card, Row, Modal, Spinner, Alert } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const RequestedInventory = () => {
  const title = 'Requested Inventory';
  const description = 'Requested inventory with modern table UI and dummy data.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/requested-inventory', text: 'Operations' },
    { to: 'operations/requested-inventory', title: 'Requested Inventory' },
  ];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectInventoryModal, setRejectInventoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState(null)

  const fetchRequestedInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Requested`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.data.success) {
        const requestedInventory = res.data.data
          .map((item) => ({
            ...item,
            request_date_obj: new Date(item.request_date),
            formatted_date: new Date(item.request_date).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          }));

        requestedInventory.sort((a, b) => b.request_date_obj - a.request_date_obj);
        setData(requestedInventory);
      }
    } catch (error) {
      console.error('Error fetching requested inventory:', error);
      toast.error('Failed to fetch requested inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequestedInventory();
  }, [])

  const rejectInventory = async (id) => {
    setRejecting(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/inventory/reject-request/${id}`,
        { reject_reason: rejectReason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setRejectInventoryModal(false);
      toast.success('Inventory rejected successfully!');
      fetchRequestedInventory();
    } catch (err) {
      console.error("Error rejecting inventory:", err);
      toast.error('Failed to reject inventory. Please try again.');
    } finally {
      setRejecting(false);
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Requested Date',
        accessor: 'formatted_date',
        Cell: ({ cell }) => <span> {cell.value} </span>,
      },
      {
        Header: 'Items',
        accessor: 'items',
        Cell: ({ cell }) => (
          <>
            {cell.value.map((item, i) => (
              <div key={i} className="mb-1">
                {item.item_name} - {item.item_quantity} {item.unit}
              </div>
            ))}
          </>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ cell }) => <Badge bg="warning" text="dark">{cell.value}</Badge>,
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              title="Complete"
              as={Link}
              to={`/operations/complete-inventory/${row.original._id}`}
            >
              <CsLineIcons icon="check" />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              title="Reject"
              onClick={() => {
                setSelectedItem(row.original);
                setRejectInventoryModal(true);
              }}
            >
              <CsLineIcons icon="close" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: 0 } },
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
            </Row>
          </div>

          {loading ? (
            <Row className="justify-content-center my-5">
              <Col xs={12} className="text-center">
                <Spinner animation="border" variant="warning" className="mb-3" />
                <p>Loading requested inventory...</p>
              </Col>
            </Row>
          ) : data.length === 0 ? (
            <Alert variant="info" className="mb-4">
              <CsLineIcons icon="inbox" className="me-2" />
              No requested inventory found.
            </Alert>
          ) : (
            <>
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
            </>
          )}
        </Col>
      </Row>

      {/* Reject Confirmation Modal */}
      <Modal className="modal-close-out" show={rejectInventoryModal} onHide={() => setRejectInventoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons icon="alert" className="text-warning me-2" />
            Reject Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to reject this inventory request?</p>
          {selectedItem && (
            <Alert variant="light" className="mt-3">
              <strong>Items:</strong>
              {selectedItem.items.map((item, i) => (
                <div key={i} className="ms-2">
                  • {item.item_name} - {item.item_quantity} {item.unit}
                </div>
              ))}
            </Alert>
          )}
          <Alert variant="warning" className="mt-3">
            <CsLineIcons icon="warning" className="me-2" />
            This action will move the inventory to rejected section.
          </Alert>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={5}
              name="reject_reason"
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
              }}
              placeholder="Enter reason for rejecting..."
              disabled={rejecting}
              className={rejecting ? 'bg-light' : ''}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRejectInventoryModal(false)} disabled={rejecting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => rejectInventory(selectedItem?._id)} disabled={rejecting}>
            {rejecting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Rejecting...
              </>
            ) : 'Reject Request'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RequestedInventory;
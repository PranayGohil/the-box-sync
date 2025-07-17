import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Col, Form, Card, Row, Modal } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import Scrollspy from 'components/scrollspy/Scrollspy';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

// Dummy data for requested inventory
const dummyData = [
  {
    id: 1,
    request_date: '2025-07-05T10:30:00Z',
    formatted_date: 'July 5, 2025, 10:30 AM',
    status: 'Requested',
    items: [
      { item_name: 'Flour', item_quantity: 5, unit: 'kg' },
      { item_name: 'Sugar', item_quantity: 2, unit: 'kg' },
    ],
  },
  {
    id: 2,
    request_date: '2025-07-04T14:15:00Z',
    formatted_date: 'July 4, 2025, 2:15 PM',
    status: 'Requested',
    items: [{ item_name: 'Milk', item_quantity: 10, unit: 'litre' }],
  },
  {
    id: 3,
    request_date: '2025-07-03T09:45:00Z',
    formatted_date: 'July 3, 2025, 9:45 AM',
    status: 'Requested',
    items: [{ item_name: 'Butter', item_quantity: 3, unit: 'kg' }],
  },
];

const RequestedInventory = () => {
  const title = 'Requested Inventory';
  const description = 'Requested inventory with modern table UI and dummy data.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/requested-inventory', text: 'Operations' },
    { to: 'operations/requested-inventory', title: 'Requested Inventory' },
  ];

  const [data, setData] = useState(dummyData);

  const scrollspyItems = [
    { id: 'title', text: 'Title' },
    { id: 'verticallyCentered', text: 'Vertically Centered' },
  ];
  const [rejectInventoryModal, setRejectInventoryModal] = useState(false);

  // Define table columns
  const columns = React.useMemo(
    () => [
      {
        Header: 'Requested Date',
        accessor: 'formatted_date',
        headerClassName: 'text-muted text-small text-uppercase',
      },
      {
        Header: 'Items',
        accessor: 'items',
        Cell: ({ cell }) => (
          <>
            {cell.value.map((item, i) => (
              <div key={i}>
                {item.item_name} - {item.item_quantity} {item.unit}
              </div>
            ))}
          </>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ cell }) => <Badge bg="outline-primary">{cell.value}</Badge>,
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <>
            <Link variant="link" size="sm" title="Complete" to="/operations/complete-inventory">
              <CsLineIcons icon="check" />
            </Link>
            <Button variant="link" size="sm" title="Reject" onClick={() => setRejectInventoryModal(true)}>
              <CsLineIcons icon="close" />
            </Button>
          </>
        ),
      },
    ],
    []
  );

  const tableInstance = useTable({ columns, data, initialState: { pageIndex: 0 } }, useGlobalFilter, useSortBy, usePagination, useRowSelect);

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
        </Col>
      </Row>

      {/* Vertically centered modal */}
      <Modal className="modal-close-out" show={rejectInventoryModal} onHide={() => setRejectInventoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reject Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to reject this request?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRejectInventoryModal(false)}>
            Close
          </Button>
          <Button onClick={() => setRejectInventoryModal(false)}>Reject</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RequestedInventory;

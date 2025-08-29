import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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

const RequestedInventory = () => {
  const title = 'Requested Inventory';
  const description = 'Requested inventory with modern table UI and dummy data.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/requested-inventory', text: 'Operations' },
    { to: 'operations/requested-inventory', title: 'Requested Inventory' },
  ];

  const [data, setData] = useState([]);

  const [rejectInventoryModal, setRejectInventoryModal] = useState(false);

  const fetchRequestedInventory = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Requested`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log(res.data);
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

        requestedInventory.sort(
          (a, b) => b.request_date_obj - a.request_date_obj
        );

        console.log(requestedInventory);
        setData(requestedInventory);
      }
    } catch (error) {
      console.error('Error fetching requested inventory:', error);
    }
  }

  useEffect(() => {
    fetchRequestedInventory();
  }, [])

  // Define table columns
  const columns = React.useMemo(
    () => [
      {
        Header: 'Requested Date',
        accessor: 'formatted_date',
        Cell: ({ cell }) => <span> {cell.value} </span>,
      },
      // {
      //   Header: 'Items',
      //   accessor: 'items',
      //   Cell: ({ cell }) => (
      //     <>
      //       {cell.value.map((item, i) => (
      //         <div key={i}>
      //           {item.item_name} - {item.item_quantity} {item.unit}
      //         </div>
      //       ))}
      //     </>
      //   ),
      // },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ cell }) => <Badge bg="outline-primary">{cell.value}</Badge>,
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <>
            <Link variant="link" size="sm" title="Complete" to={`/operations/complete-inventory/${row.original._id}`}>  {/* eslint-disable-line no-underscore-dangle */}
              <CsLineIcons icon="eye" />
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

  const rejectInventory = (id) => {
    axios
      .post(
        `${process.env.REACT_APP_API}/inventory/reject-request/${id}`,
        null,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      .then((res) => {
        console.log("Inventory rejected:", res.data);
        setRejectInventoryModal(false);
        fetchRequestedInventory();
      })
      .catch((err) => {
        console.error("Error rejecting inventory:", err);
      });
  };

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
          <Button variant="danger" onClick={() => rejectInventory(tableInstance.selectedFlatRows[0].original._id)}>Reject</Button> {/* eslint-disable-line no-underscore-dangle */}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RequestedInventory;

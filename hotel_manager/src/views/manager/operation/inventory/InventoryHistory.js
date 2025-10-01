import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Form, Row, Modal, Spinner } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
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

  const [show, setShow] = useState(false);
  const [data, setData] = useState(null); // For the selected inventory record
  const [isDeleting, setIsDeleting] = useState(false);

  const handleShow = (rowData) => {
    setData(rowData);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setData(null);
  };

  const fetchCompletedInventory = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Completed`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log("Completed Inventory", res.data);
      if (res.data.success) {
        const comnpletedInventory = res.data.data
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

        comnpletedInventory.sort(
          (a, b) => b.request_date_obj - a.request_date_obj
        );

        console.log(comnpletedInventory);
        setCompletedData(comnpletedInventory);
      }
    } catch (error) {
      console.error('Error fetching requested inventory:', error);
    }
  };

  const fetchRejectedInventory = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Rejected`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log("Rejected Inventory", res.data);
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

        rejectedInventory.sort(
          (a, b) => b.request_date_obj - a.request_date_obj
        );

        console.log(rejectedInventory);
        setRejectedData(rejectedInventory);
      }
    } catch (error) {
      console.error('Error fetching requested inventory:', error);
    }
  };

  useEffect(() => {
    fetchCompletedInventory();
    fetchRejectedInventory();
  }, []);

  // Completed Table
  const completedColumns = React.useMemo(
    () => [
      { Header: 'Requested Date', accessor: 'formatted_request_date' },
      { Header: 'Bill Date', accessor: 'formatted_bill_date' },
      { Header: 'Bill Number', accessor: 'bill_number' },
      { Header: 'Vendor Name', accessor: 'vendor_name' },
      { Header: 'Total Amount', accessor: 'total_amount' },
      { Header: 'Unpaid Amount', accessor: 'unpaid_amount' },
      // {
      //   Header: 'Items',
      //   accessor: 'items',
      //   Cell: ({ cell }) =>
      //     cell.value.map((item, i) => (
      //       <div key={i}>
      //         {item.item_name} - {item.item_quantity} {item.unit}
      //       </div>
      //     )),
      // },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center">
            <Button variant="link" size="sm" title="View" onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}> 
              <CsLineIcons icon="eye" />
            </Button>
            <Button variant="link" size="sm" title="Edit" onClick={() => history.push(`/operations/edit-inventory/${row.original._id}`)}> 
              <CsLineIcons icon="edit" />
            </Button>
            <Button
              variant="link"
              size="sm"
              title="Delete"
              onClick={() => handleShow(row.original)}
            >
              <CsLineIcons icon="bin" />
            </Button>

          </div>
        ),
      },
    ],
    []
  );

  const rejectedColumns = React.useMemo(
    () => [
      { Header: 'Requested Date', accessor: 'formatted_request_date' },
      // {
      //   Header: 'Items',
      //   accessor: 'items',
      //   Cell: ({ cell }) =>
      //     cell.value.map((item, i) => (
      //       <div key={i}>
      //         {item.item_name} - {item.item_quantity} {item.unit}
      //       </div>
      //     )),
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
            <Button variant="link" size="sm" title="View" onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}> {/* eslint-disable-line no-underscore-dangle */}
              <CsLineIcons icon="eye" />
            </Button>
            <Button
              variant="link"
              size="sm"
              title="Delete"
              onClick={() => handleShow(row.original)}
            >
              <CsLineIcons icon="bin" />
            </Button>

          </>
        ),
      },
    ],
    []
  );

  const handleDelete = async () => {
    if (!data?._id) return; // eslint-disable-line no-underscore-dangle
    setIsDeleting(true);

    try {
      const res = await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${data._id}`, { // eslint-disable-line no-underscore-dangle
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.status === 200 || res.data.success) {
        // Remove from local state UI
        setCompletedData((prev) => prev.filter((item) => item._id !== data._id)); // eslint-disable-line no-underscore-dangle
        setRejectedData((prev) => prev.filter((item) => item._id !== data._id)); // eslint-disable-line no-underscore-dangle

        handleClose();
      } else {
        console.error('Delete failed:', res.data);
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
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

  const rejectedTable = useTable({ columns: rejectedColumns, data: rejectedData, initialState: { pageIndex: 0 } }, useGlobalFilter, useSortBy, usePagination, useRowSelect,);

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

          {/* Rejected Requests */}
          <h4 className="mt-5 mb-3">Rejected Requests</h4>
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
        </Col>
      </Row>

      {/* Delete Inventory Modal */}
      <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Inventory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this inventory?</p>
          <p>
            <strong>{data?.bill_number}</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner animation="border" size="sm" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryHistory;

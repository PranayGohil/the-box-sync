import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Form, Row } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

// Dummy data
const dummyCompleted = [
  {
    id: 1,
    request_date: '2025-07-01T10:00:00Z',
    formatted_request_date: 'July 1, 2025',
    bill_date: '2025-07-02T11:00:00Z',
    formatted_bill_date: 'July 2, 2025',
    bill_number: 'INV-001',
    vendor_name: 'Vendor A',
    total_amount: 1000,
    unpaid_amount: 200,
    items: [{ item_name: 'Flour', item_quantity: 5, unit: 'kg' }],
  },
  {
    id: 2,
    request_date: '2025-06-28T09:00:00Z',
    formatted_request_date: 'June 28, 2025',
    bill_date: '2025-06-29T10:00:00Z',
    formatted_bill_date: 'June 29, 2025',
    bill_number: 'INV-002',
    vendor_name: 'Vendor B',
    total_amount: 2000,
    unpaid_amount: 0,
    items: [{ item_name: 'Sugar', item_quantity: 10, unit: 'kg' }],
  },
];

const dummyRejected = [
  {
    id: 3,
    request_date: '2025-06-25T08:00:00Z',
    formatted_request_date: 'June 25, 2025',
    status: 'Rejected',
    items: [{ item_name: 'Milk', item_quantity: 20, unit: 'litre' }],
  },
  {
    id: 4,
    request_date: '2025-06-24T14:00:00Z',
    formatted_request_date: 'June 24, 2025',
    status: 'Rejected',
    items: [{ item_name: 'Butter', item_quantity: 5, unit: 'kg' }],
  },
];

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
        Header: 'Actions',
        Cell: ({ row }) => (
          <>
            <Button variant="link" size="sm" title="View" onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}> {/* eslint-disable-line no-underscore-dangle */}
              <CsLineIcons icon="eye" />
            </Button>
            <Button variant="link" size="sm" title="Edit">
              <CsLineIcons icon="edit" />
            </Button>
            <Button variant="link" size="sm" title="Delete">
              <CsLineIcons icon="bin" />
            </Button>
          </>
        ),
      },
    ],
    []
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
        Cell: ({ cell }) => <Badge bg="outline-primary">{cell.value}</Badge>,
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <>
            <Button variant="link" size="sm" title="View" onClick={() => history.push(`/operations/inventory-details/${row.original._id}`)}> {/* eslint-disable-line no-underscore-dangle */}
              <CsLineIcons icon="eye" />
            </Button>
            <Button variant="link" size="sm" title="Delete">
              <CsLineIcons icon="bin" />
            </Button>
          </>
        ),
      },
    ],
    []
  );

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
    </>
  );
};

export default InventoryHistory;

// OrderHistory.js

import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy, usePagination, useRowSelect } from 'react-table'; // Removed useRowState
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const OrderHistory = () => {
  const title = 'Order History';
  const description = 'Separate rows with edit, delete and add.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/order-history', text: 'Operations' },
    { to: 'operations/order-history', title: 'Order History' },
  ];

  const history = useHistory();

  const [error, setError] = useState(null);
  const [data, setData] = React.useState([]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/order/get-orders`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.data.success) {
        const transformedOrders = res.data.data.map(({ _id, ...rest }) => ({
          ...rest,
          id: _id,
        }));
        console.log('Fetched Orders:', transformedOrders);
        const sortedOrders = transformedOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
        setData(sortedOrders);
      } else {
        console.log(res.data.message);
        setError(res.data.message);
      }
    } catch (err) {
      console.log(err);
      setError(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePrint = async (orderId) => {
    try {
      const orderResponse = await axios.get(`${process.env.REACT_APP_API}/order/get/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const userResponse = await axios.get(`${process.env.REACT_APP_API}/user/get`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

      const order = orderResponse.data.data;
      const userData = userResponse.data;

      const printDiv = document.createElement('div');
      printDiv.id = 'printable-invoice';
      printDiv.style.display = 'none';
      document.body.appendChild(printDiv);

      printDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 10px;">
          <div style="text-align: center; margin-bottom: 10px;">
            <h3 style="margin: 10px;">${userData.name}</h3>
            <p style="margin: 0; font-size: 12px;">${userData.address}</p>
            <p style="margin: 0; font-size: 12px;">${userData.city}, ${userData.state} ${userData.pincode}</p>
            <p style="margin: 10px; font-size: 12px;"><strong>Phone: </strong> ${userData.mobile}</p>
          </div>
          <hr style="border: 0.5px dashed #ccc;" />
          <p><strong>Name:</strong> ${order?.customer_name || '(M: 1234567890)'}</p>
          <hr style="border: 0.5px dashed #ccc;" />
          <table style="font-size: 12px; margin-bottom: 10px;">
            <tr>
            <td style="width: 50%; height: 30px;">
              <strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}</td>
                <td style="text-align: right;"><strong>${order.order_type}</strong>
                </td>
            </tr>
            <tr>
            <td colspan="2"><strong>Bill No:</strong> ${order._id}</td>
            
            </tr>
          </table>
          <hr style="border: 0.5px dashed #ccc;" />
          <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
            <thead>
              <tr>
                <th style="text-align: left; border-bottom: 1px dashed #ccc">Item</th>
                <th style="text-align: center; border-bottom: 1px dashed #ccc">Qty</th>
                <th style="text-align: center; border-bottom: 1px dashed #ccc">Price</th>
                <th style="text-align: right; border-bottom: 1px dashed #ccc">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items
                .map(
                  (item) => `
                  <tr>
                    <td>${item.dish_name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: center;">${item.dish_price}</td>
                    <td style="text-align: right;">₹ ${item.dish_price * item.quantity}</td>
                  </tr>
                `
                )
                .join('')}
              <tr>
                <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Sub Total: </strong></td>
                <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.sub_total}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>CGST (${order.cgst_amount || 0} %):</strong></td>
                <td style="text-align: right;">₹ ${((order.cgst_amount || 0) * order.bill_amount) / 100}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>SGST (${order.sgst_amount || 0} %):</strong></td>
                <td style="text-align: right;">₹ ${((order.sgst_amount || 0) * order.bill_amount) / 100}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Total: </strong></td>
                <td style="text-align: right;">₹ ${order.total_amount}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Discount: </strong></td>
                <td style="text-align: right;">- ₹ ${order.discount_amount || 0}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Paid Amount: </strong></td>
                <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.bill_amount}</td>
              </tr>
            </tbody>
          </table>
          <hr style="border: 0.5px dashed #ccc;" />
          <div style="text-align: center; font-size: 12px;">
            <p style="margin: 10px; font-size: 12px;"><strong>FSSAI Lic No:</strong> 11224333001459</p>
            <p style="margin: 10px; font-size: 12px;"><strong>GST No:</strong> ${userData.gst_no}</p>
            <p style="margin: 10px; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>
          </div>
        </div>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printDiv.innerHTML);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();

      document.body.removeChild(printDiv);
    } catch (err) {
      console.error('Error fetching order or user data:', err);
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Order Date',
        accessor: 'order_date',
        id: 'order_date_only',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ value }) => new Date(value).toLocaleDateString(),
      },
      {
        Header: 'Order Time',
        accessor: 'order_date',
        id: 'order_time_only',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ value }) => new Date(value).toLocaleTimeString(),
      },
      {
        Header: 'Customer Name',
        accessor: 'customer_name',
        headerClassName: 'text-muted text-small text-uppercase w-15',
      },
      {
        Header: 'Table No',
        accessor: 'table_no',
        headerClassName: 'text-muted text-small text-uppercase w-10',
      },
      {
        Header: 'Table Area',
        accessor: 'table_area',
        headerClassName: 'text-muted text-small text-uppercase w-10',
      },
      {
        Header: 'Order Type',
        accessor: 'order_type',
        headerClassName: 'text-muted text-small text-uppercase w-10',
      },
      {
        Header: 'Total Amount',
        accessor: 'total_amount',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        Cell: ({ value }) => `₹ ${value.toFixed(2)}`,
      },
      {
        Header: 'Action',
        id: 'action',
        headerClassName: 'text-muted text-small text-uppercase w-10 text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center">
            <Button variant="link" size="sm" title="View" className="px-1" onClick={() => history.push(`/operations/order-details/${row.original.id}`)}>
              <CsLineIcons icon="eye" />
            </Button>
            <Button variant="link" size="sm" title="Print" className="px-1" onClick={() => handlePrint(row.original.id)}>
              <CsLineIcons icon="print" />
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
      data,
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

          <div>
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
          </div>
          {/* If ModalAddEdit is not directly tied to individual row state or general table editing, it might not need tableInstance passed or could be removed. */}
          {/* <ModalAddEdit tableInstance={tableInstance} /> */}
        </Col>
      </Row>
    </>
  );
};

export default OrderHistory;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button, Spinner, Alert, Card, Collapse } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const OrderHistory = () => {
  const title = 'Order History';
  const description = 'Order history with advanced filters.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/order-history', text: 'Operations' },
    { to: 'operations/order-history', title: 'Order History' },
  ];

  const history = useHistory();

  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState({});

  // Server-side pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    orderStatus: '',
    orderType: '',
    fromDate: '',
    toDate: '',
  });

  // Ref to prevent infinite loops
  const fetchRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        sortBy,
        sortOrder,
        order_source: ['QSR'],
      };

      if (searchTerm.trim()) {
        params.search = searchTerm;
      }

      // Add filters to params
      if (filters.orderStatus) {
        params.order_status = filters.orderStatus;
      }
      if (filters.orderType) {
        params.order_type = filters.orderType;
      }
      if (filters.fromDate) {
        params.from = filters.fromDate;
      }
      if (filters.toDate) {
        params.to = filters.toDate;
      }

      const { data: resData } = await axios.get(
        `${process.env.REACT_APP_API}/order/get-orders`,
        {
          params,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (resData.success) {
        const transformedOrders = resData.data.map(({ _id, ...rest }) => ({
          ...rest,
          id: _id,
        }));

        setData(transformedOrders);

        if (resData.pagination) {
          setTotalRecords(resData.pagination.total || 0);
          setTotalPages(resData.pagination.totalPages || 0);
        }
      } else {
        setError(resData.message);
        toast.error(resData.message);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message || 'Failed to fetch orders');
      toast.error('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  }, [pageIndex, pageSize, searchTerm, sortBy, sortOrder, filters]);

  useEffect(() => {
    if (!fetchRef.current) {
      fetchRef.current = true;
      fetchOrders();
    }
  }, [fetchOrders]);

  const handlePageChange = (newPageIndex) => {
    if (newPageIndex !== pageIndex) {
      setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const handleSearch = useCallback((value) => {
    if (value !== searchTerm) {
      setSearchTerm(value);
      setPageIndex(0);
    }
  }, [searchTerm]);

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('desc');
    }
    setPageIndex(0);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
    setPageIndex(0);
  };

  const handleClearFilters = () => {
    setFilters({
      orderStatus: '',
      orderType: '',
      fromDate: '',
      toDate: '',
    });
    setSearchTerm('');
    setPageIndex(0);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.orderStatus) count++;
    if (filters.orderType) count++;
    if (filters.fromDate) count++;
    if (filters.toDate) count++;
    if (searchTerm) count++;
    return count;
  };

  const handlePrint = async (orderId) => {
    setPrinting(prev => ({ ...prev, [orderId]: true }));
    try {
      const orderResponse = await axios.get(
        `${process.env.REACT_APP_API}/order/get/${orderId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const userResponse = await axios.get(
        `${process.env.REACT_APP_API}/user/get`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const order = orderResponse.data.data;
      const userData = userResponse.data;

      const printDiv = document.createElement("div");
      printDiv.id = "printable-invoice";
      printDiv.style.display = "none";
      document.body.appendChild(printDiv);

      printDiv.innerHTML = `
         <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 10px;">
           <div style="text-align: center; margin-bottom: 10px;">
             <h3 style="margin: 10px;">${userData.name}</h3>
             <p style="margin: 0; font-size: 12px;">${userData.address}</p>
             <p style="margin: 0; font-size: 12px;">
               ${userData.city}, ${userData.state} - ${userData.pincode}
             </p>
             <p style="margin: 10px; font-size: 12px;"><strong>Ph.: </strong> ${userData.mobile}</p>
             ${userData.fssai_no && userData.fssai_no !== 'null' ? `<p style="margin: 10px; font-size: 12px;"><strong>FSSAI No:</strong> ${userData.fssai_no}</p>` : ''}
             <p style="margin: 10px; font-size: 12px;"><strong>GST No:</strong> ${userData.gst_no}</p>
           </div>
           <hr style="border: 0.5px dashed #ccc;" />
           <p></p>
            <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
             <tr>
               <td style="width: 50%; height: 30px;">
                 <strong> Name: </strong> ${order?.customer_name || "(M: 1234567890)"} 
               </td>
                <td style="text-align: right;">
                  <strong>${order.order_type}</strong>
               </td>
             </tr>
             <tr>
               <td style="width: 50%; height: 30px;">
                 <strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}
               </td>
              <td style="text-align: right;">
                   ${order.table_no ? ` <strong>Table No: </strong> <span style="margin-left: 5px; font-size: 16px;"> ${order.table_no} </span>` : order.token ? ` <strong>Token No: </strong> <span style="margin-left: 5px; font-size: 16px;"> ${order.token} </span>` : ''} </span>
               </td>
             </tr>
             <tr>
               <td colspan="2"><strong>Bill No:</strong> ${order.order_no || order._id}</td>
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
               ${order.order_items.map(item => `
                 <tr>
                   <td>${item.dish_name}</td>
                   <td style="text-align: center;">${item.quantity}</td>
                   <td style="text-align: center;">${item.dish_price}</td>
                   <td style="text-align: right;">₹ ${item.dish_price * item.quantity}</td>
                 </tr>
               `).join("")}
               <tr>
                 <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Sub Total: </strong></td>
                 <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.sub_total}</td>
               </tr>
               ${order.cgst_amount > 0 ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>CGST (${order.cgst_percent || 0} %):</strong></td>
                   <td style="text-align: right;">₹ ${order.cgst_amount || 0}</td> 
                 </tr>` : ""}
               ${order.sgst_amount > 0 ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>SGST (${order.sgst_percent || 0} %):</strong></td>
                   <td style="text-align: right;">₹ ${order.sgst_amount || 0}</td>
                 </tr>` : ""}
               ${order.vat_amount > 0 ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>VAT (${order.vat_percent || 0} %):</strong></td>
                   <td style="text-align: right;">₹ ${order.vat_amount || 0}</td>
                 </tr>` : ""}
               ${order.discount_amount > 0 ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>Discount: </strong></td>
                   <td style="text-align: right;">- ₹ ${order.discount_amount || 0}</td>
                 </tr>` : ""}
               <tr>
                 <td colspan="3" style="text-align: right;"><strong>Total: </strong></td>
                 <td style="text-align: right;">₹ ${order.total_amount}</td>
               </tr>
               <tr>
                 <td colspan="3" style="text-align: right; border-top: 1px dashed #ccc"><strong>Paid Amount: </strong></td>
                 <td style="text-align: right; border-top: 1px dashed #ccc">₹ ${order.paid_amount || order.bill_amount || 0}</td>
               </tr>
               ${order.waveoff_amount !== null && order.waveoff_amount !== undefined && order.waveoff_amount !== 0 ? `
                 <tr>
                   <td colspan="3" style="text-align: right;"><strong>Waveoff Amount: </strong></td>
                   <td style="text-align: right;"> ₹ ${order.waveoff_amount || 0}</td>
                 </tr>` : ""}
             </tbody>
           </table>
           <div style="text-align: center; font-size: 12px;">
             <p style="margin: 10px; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>
           </div>
         </div>
       `;

      const printWindow = window.open("", "_blank");
      printWindow.document.write(printDiv.innerHTML);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();

      document.body.removeChild(printDiv);
      toast.success('Invoice printed successfully!');
    } catch (err) {
      console.error("Error fetching order or user data:", err);
      toast.error('Failed to print invoice. Please try again.');
    } finally {
      setPrinting(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Order Number',
        accessor: 'order_no',
        id: 'order_no',
        headerClassName: 'text-muted text-small text-uppercase w-15',
      },
      {
        Header: 'Order Date',
        accessor: 'order_date',
        id: 'order_date',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'order_date',
        isSortedDesc: sortBy === 'order_date' && sortOrder === 'desc',
        Cell: ({ value }) => new Date(value).toLocaleDateString('en-IN'),
      },
      {
        Header: 'Order Time',
        accessor: 'order_date',
        id: 'order_time',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        disableSortBy: true,
        Cell: ({ value }) => new Date(value).toLocaleTimeString(),
      },
      {
        Header: 'Customer Name',
        accessor: 'customer_name',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'customer_name',
        isSortedDesc: sortBy === 'customer_name' && sortOrder === 'desc',
      },
      {
        Header: 'Order Type',
        accessor: 'order_type',
        headerClassName: 'text-muted text-small text-uppercase w-10',
        sortable: true,
        isSorted: sortBy === 'order_type',
        isSortedDesc: sortBy === 'order_type' && sortOrder === 'desc',
        Cell: ({ value }) => (
          <Badge bg={
            value === 'Dine In' ? 'primary' :
              value === 'Takeaway' ? 'warning' :
                value === 'Delivery' ? 'success' : 'secondary'
          }>
            {value}
          </Badge>
        ),
      },
      {
        Header: 'Total Amount',
        accessor: 'total_amount',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'total_amount',
        isSortedDesc: sortBy === 'total_amount' && sortOrder === 'desc',
        Cell: ({ value }) => `₹ ${parseFloat(value).toFixed(2)}`,
      },
      {
        Header: 'Status',
        accessor: 'order_status',
        headerClassName: 'text-muted text-small text-uppercase w-10',
        sortable: true,
        isSorted: sortBy === 'order_status',
        isSortedDesc: sortBy === 'order_status' && sortOrder === 'desc',
        Cell: ({ value }) => (
          <Badge bg={
            value === 'Paid' || value === 'Save' ? 'success' :
              value === 'KOT' ? 'warning' :
                value === 'Cancelled' ? 'danger' : 'secondary'
          }>
            {value}
          </Badge>
        ),
      },
      {
        Header: 'Action',
        id: 'action',
        headerClassName: 'text-muted text-small text-uppercase w-10 text-center',
        disableSortBy: true,
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              title="View"
              className="btn-icon btn-icon-only"
              onClick={() => history.push(`/operations/order-details/${row.original.id}`)}
            >
              <CsLineIcons icon="eye" />
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              title="Print"
              className="btn-icon btn-icon-only"
              onClick={() => handlePrint(row.original.id)}
              disabled={printing[row.original.id]}
            >
              {printing[row.original.id] ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <CsLineIcons icon="print" />
              )}
            </Button>
          </div>
        ),
      },
    ],
    [history, printing, sortBy, sortOrder]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      manualPagination: true,
      manualSortBy: true,
      pageCount: totalPages,
      autoResetPage: false,
      autoResetSortBy: false,
      autoResetGlobalFilter: false,
    },
    useGlobalFilter,
    useSortBy
  );

  const paginationProps = {
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex < totalPages - 1,
    pageCount: totalPages,
    pageIndex,
    gotoPage: handlePageChange,
    nextPage: () => handlePageChange(pageIndex + 1),
    previousPage: () => handlePageChange(pageIndex - 1),
  };

  if (loading && pageIndex === 0) {
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
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading Order History...</h5>
              <p className="text-muted">Please wait while we fetch your orders</p>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <HtmlHead title={title} description={description} />

      <Row>
        <Col>
          <div className="page-title-container">
            <Row className="align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
            </Row>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
            </Alert>
          )}

          {/* Filter Section */}
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <Button
                  variant="link"
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-0 text-decoration-none"
                >
                  <CsLineIcons icon="filter" className="me-2" />
                  <strong>Filters</strong>
                  {getActiveFilterCount() > 0 && (
                    <Badge bg="primary" className="ms-2">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                  <CsLineIcons
                    icon={showFilters ? 'chevron-top' : 'chevron-bottom'}
                    className="ms-2"
                  />
                </Button>
                {getActiveFilterCount() > 0 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    <CsLineIcons icon="close" className="me-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <Collapse in={showFilters}>
                <div className='mt-2'>
                  <Row>
                    {/* Date Range Filter */}
                    <Col md={3} className="mb-3">
                      <Form.Label className="small text-muted">From Date</Form.Label>
                      <Form.Control
                        type="date"
                        size="sm"
                        value={filters.fromDate}
                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                      />
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Label className="small text-muted">To Date</Form.Label>
                      <Form.Control
                        type="date"
                        size="sm"
                        value={filters.toDate}
                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                      />
                    </Col>

                    {/* Order Status Filter */}
                    <Col md={3} className="mb-3">
                      <Form.Label className="small text-muted">Order Status</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.orderStatus}
                        onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="Paid">Paid</option>
                        <option value="Save">Save</option>
                        <option value="KOT">KOT</option>
                        <option value="Cancelled">Cancelled</option>
                      </Form.Select>
                    </Col>

                    {/* Order Type Filter */}
                    <Col md={3} className="mb-3">
                      <Form.Label className="small text-muted">Order Type</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.orderType}
                        onChange={(e) => handleFilterChange('orderType', e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="Dine In">Dine In</option>
                        <option value="Takeaway">Takeaway</option>
                        <option value="Delivery">Delivery</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </Card.Body>
          </Card>

          {/* Search and Controls */}
          <div>
            <Row className="mb-3">
              <Col sm="12" md="5" lg="3" xxl="2">
                <div className="d-inline-block float-md-start me-1 mb-1 mb-md-0 search-input-container w-100 shadow bg-foreground">
                  <ControlsSearch onSearch={handleSearch} />
                </div>
              </Col>
              <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
                <div className="d-inline-block me-2 text-muted">
                  {loading ? (
                    'Loading...'
                  ) : (
                    <>
                      Showing {data.length > 0 ? pageIndex * pageSize + 1 : 0} to{' '}
                      {Math.min((pageIndex + 1) * pageSize, totalRecords)} of {totalRecords} entries
                    </>
                  )}
                </div>
                <div className="d-inline-block">
                  <ControlsPageSize pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
                </div>
              </Col>
            </Row>

            {/* Show table or "no data" message */}
            {data.length === 0 && !loading ? (
              <Alert variant="info" className="text-center">
                <CsLineIcons icon="inbox" size={24} className="me-2" />
                No orders found.{' '}
                {searchTerm || getActiveFilterCount() > 0
                  ? 'Try adjusting your search or filters.'
                  : 'Orders will appear here once created.'}
              </Alert>
            ) : (
              <>
                <Row>
                  <Col xs="12">
                    <Table className="react-table rows" tableInstance={tableInstance} onSort={handleSort} />
                  </Col>
                  <Col xs="12">
                    <TablePagination paginationProps={paginationProps} />
                  </Col>
                </Row>
              </>
            )}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default OrderHistory;
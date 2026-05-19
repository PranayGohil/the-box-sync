import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button, Spinner, Alert, Card, Collapse, Dropdown, Modal, ProgressBar } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { AuthContext } from 'contexts/AuthContext';
import { format } from 'date-fns';

import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const OrderHistory = () => {
  const title = 'Order History';
  const description = 'Order history with advanced filters.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/order-history', text: 'Order History' },
  ];

  const history = useHistory();
  const { currentUser } = useContext(AuthContext);

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

  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFilters, setExportFilters] = useState({
    orderStatus: '',
    orderType: '',
    orderSource: '',
    paymentMode: '',
    tableArea: '',
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

      const { data: resData } = await axios.get(`${process.env.REACT_APP_API}/order/get-orders`, {
        params,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

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
      toast.error('Failed to fetch orders.');
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

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setPageIndex(0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(localSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchTerm, handleSearch]);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
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
    setFilters((prev) => ({
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

  const handleExportClick = () => {
    setExportFilters({
      orderStatus: filters.orderStatus,
      orderType: filters.orderType,
      orderSource: '',
      paymentMode: '',
      tableArea: '',
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    setExporting(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setExportProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setExporting(false);
          setExportProgress(0);
          setShowExportModal(false);
          toast.success(`${exportFormat.toUpperCase()} generated successfully! (UI Demo)`);
        }, 500);
      }
    }, 200);
  };

  const printCounterBill = (ord, userData, counterName, items) => {
    return `
      <div style="page-break-after: always; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="margin: 5px;">${userData.name}</h3>
        </div>
        <hr style="border: 0.5px dashed #ccc;" />
        <div style="text-align: center; margin: 8px 0;">
          <span style="background: #000; color: #fff; padding: 4px 16px; border-radius: 4px; font-size: 14px; font-weight: bold;">
            ${counterName} Counter
          </span>
        </div>
        <hr style="border: 0.5px dashed #ccc;" />
        <table style="width: 100%; font-size: 12px; margin-bottom: 8px;">
          <tr>
            <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
            <td style="text-align: right;"><strong>${ord.order_type}</strong></td>
          </tr>
          <tr>
            <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString()}</td>
            <td style="text-align: right;">
              ${ord.table_no ? `<strong>Table:</strong> ${ord.table_no}` : ord.token ? `<strong>Token:</strong> ${ord.token}` : ''}
            </td>
          </tr>
        </table>
        <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #ccc;">Item</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const printFullBill = (ord, userData, items, subTotal) => {
    return `
      <div style="page-break-after: always; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 5px;">${userData.name}</h2>
          <p style="margin: 0; font-size: 14px;">${userData.address}</p>
          <p style="margin: 0; font-size: 14px;">${userData.city}, ${userData.state} - ${userData.pincode}</p>
          <p style="margin: 5px; font-size: 14px;"><strong>Ph:</strong> ${userData.mobile}</p>
        </div>
        <hr style="border: 0.5px dashed #ccc;" />
        <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
          <tr>
            <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
            <td style="text-align: right;"><strong>${ord.order_type}</strong></td>
          </tr>
          <tr>
            <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString()}</td>
            <td style="text-align: right;">
              ${ord.table_no ? `<strong>Table:</strong> ${ord.table_no}` : ord.token ? `<strong>Token:</strong> ${ord.token}` : ''}
            </td>
          </tr>
        </table>
        <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #ccc;">Item</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Qty</th>
              <th style="text-align: center; border-bottom: 1px solid #ccc;">Price</th>
              <th style="text-align: right; border-bottom: 1px solid #ccc;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: center;">₹${item.dish_price}</td>
                <td style="text-align: right;">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
            <tr>
              <td colspan="3" style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;"><strong>Total Amount:</strong></td>
              <td style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;"><strong>₹${parseFloat(ord.total_amount).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        <p style="text-align: center; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>
      </div>
    `;
  };

  const handlePrint = async (orderId) => {
    try {
      setPrinting((prev) => ({ ...prev, [orderId]: true }));
      const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const orderRes = await axios.get(`${process.env.REACT_APP_API}/order/get/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const order = orderRes.data.data;
      const userData = userRes.data;
      const groupedByCounter = {};
      order.order_items.forEach((item) => {
        const counterName = item.counter || 'Default';
        if (!groupedByCounter[counterName]) groupedByCounter[counterName] = [];
        groupedByCounter[counterName].push(item);
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup blocked! Please allow popups.');
        return;
      }

      let allBillsHTML = printFullBill(order, userData, order.order_items, order.sub_total);
      Object.entries(groupedByCounter).forEach(([counterName, items]) => {
        allBillsHTML += printCounterBill(order, userData, counterName, items);
      });

      printWindow.document.write(
        `<html><head><title>Print Bills</title></head><body>${allBillsHTML}<script>window.onload=function(){window.focus();window.print();setTimeout(function(){window.close();},100);};</script></body></html>`
      );
      printWindow.document.close();
    } catch (err) {
      console.error('Print error:', err);
      toast.error('Failed to print bills');
    } finally {
      setPrinting((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Order No.',
        accessor: 'order_no',
        id: 'order_no',
        headerClassName: 'text-small text-uppercase w-15',
      },
      {
        Header: 'Date',
        accessor: 'order_date',
        id: 'order_date',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'order_date',
        isSortedDesc: sortBy === 'order_date' && sortOrder === 'desc',
        Cell: ({ value }) => new Date(value).toLocaleDateString('en-IN'),
      },
      {
        Header: 'Name',
        accessor: 'customer_name',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'customer_name',
        isSortedDesc: sortBy === 'customer_name' && sortOrder === 'desc',
      },
      {
        Header: 'Type',
        accessor: 'order_type',
        headerClassName: 'text-small text-uppercase w-10',
        sortable: true,
        isSorted: sortBy === 'order_type',
        isSortedDesc: sortBy === 'order_type' && sortOrder === 'desc',
        Cell: ({ value }) => (
          <Badge bg={value === 'Dine In' ? 'primary' : value === 'Takeaway' ? 'warning' : value === 'Delivery' ? 'success' : 'secondary'}>
            {value}
          </Badge>
        ),
      },
      {
        Header: 'Amount',
        accessor: 'total_amount',
        headerClassName: 'text-small text-uppercase w-15',
        sortable: true,
        isSorted: sortBy === 'total_amount',
        isSortedDesc: sortBy === 'total_amount' && sortOrder === 'desc',
        Cell: ({ value }) => `₹ ${parseFloat(value).toFixed(2)}`,
      },
      {
        Header: 'Status',
        accessor: 'order_status',
        headerClassName: 'text-small text-uppercase w-10',
        sortable: true,
        isSorted: sortBy === 'order_status',
        isSortedDesc: sortBy === 'order_status' && sortOrder === 'desc',
        Cell: ({ value }) => (
          <Badge bg={value === 'Paid' || value === 'Save' ? 'success' : value === 'KOT' ? 'warning' : value === 'Cancelled' ? 'danger' : 'secondary'}>
            {value}
          </Badge>
        ),
      },
      {
        Header: 'Action',
        id: 'action',
        headerClassName: 'text-small text-uppercase w-10 text-center',
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
              <CsLineIcons icon="eye" size="15" />
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              title="Print"
              className="btn-icon btn-icon-only"
              onClick={() => handlePrint(row.original.id)}
              disabled={printing[row.original.id]}
            >
              {printing[row.original.id] ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="print" size="15" />}
            </Button>
          </div>
        ),
      },
    ],
    [history, printing]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      manualPagination: true,
      manualSortBy: true,
      pageCount: totalPages,
      autoResetPage: false,
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

  const brandColor = '#23b3f4';

  if (loading && pageIndex === 0) {
    return (
      <div className="container-fluid ps-lg-4 pe-lg-5 py-5 text-center">
        <Spinner animation="border" style={{ color: brandColor }} className="mb-3" />
        <h5>Loading Order History...</h5>
      </div>
    );
  }

  return (
    <>
      <div className="container-fluid pb-5">
        <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4 mt-5 pt-1 mt-md-0 pt-md-0">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto">
            <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>
              {title}
            </h1>
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

      {/* Search and Controls */}
      <div>
        <Row className="mb-3 g-2 align-items-center">
          <Col xs="12" sm="auto" className="flex-grow-1" style={{ minWidth: '200px' }}>
            <div className="order-history-custom-search-container shadow-sm d-flex align-items-center px-2">
              <CsLineIcons icon="search" size="18" className="text-primary opacity-75 ms-1 me-2" />
              <Form.Control
                type="text"
                className="border-0 bg-transparent shadow-none"
                placeholder="Search orders..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                style={{ height: '40px', fontSize: '14px' }}
              />
              {localSearchTerm && (
                <div className="cursor-pointer text-muted px-1" onClick={() => setLocalSearchTerm('')}>
                  <CsLineIcons icon="close" size="14" />
                </div>
              )}
            </div>
          </Col>
          <Col xs="auto" className="ms-auto ms-sm-0">
            <div className="d-flex gap-2">
              <Button
                className="order-history-custom-control-btn shadow-sm"
                onClick={handleExportClick}
                disabled={totalRecords === 0 || loading}
                title="Export Orders"
              >
                <CsLineIcons icon="download" size="18" />
              </Button>
              <Button
                className={`order-history-custom-control-btn shadow-sm ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
                title="Filters"
                disabled={loading}
              >
                <CsLineIcons icon={showFilters ? 'close' : 'filter'} size="18" />
                {getActiveFilterCount() > 0 && (
                  <Badge
                    bg="danger"
                    className="position-absolute rounded-pill border border-2 border-white"
                    style={{ top: '-5px', right: '-5px', fontSize: '10px', padding: '4px 6px' }}
                  >
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </Col>
          <Col className="text-end d-none d-lg-block">
            <div className="d-inline-block me-3 text-muted small">
              Showing {data.length > 0 ? pageIndex * pageSize + 1 : 0}-{Math.min((pageIndex + 1) * pageSize, totalRecords)} of {totalRecords}
            </div>
            <div className="d-inline-block">
              <ControlsPageSize pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
            </div>
          </Col>
        </Row>
      </div>

      <Collapse in={showFilters}>
        <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '1.25rem', backgroundColor: '#f8f9fa' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: brandColor }}>
                <CsLineIcons icon="filter" className="me-2" size="18" />
                Filter Records
              </h5>
              {getActiveFilterCount() > 0 && (
                <Button variant="link" className="p-0 text-danger text-decoration-none small fw-bold" onClick={handleClearFilters}>
                  <CsLineIcons icon="close" size="12" className="me-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div>
              <Row className="g-3">
                {/* Date Range Filter */}
                <Col xs="6" sm="6" md="3">
                  <Form.Label className="small fw-bold text-muted mb-1">From</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                    className="rounded-pill px-3 border-0 shadow-sm"
                    style={{ height: '44px', fontSize: '14px' }}
                  />
                </Col>
                <Col xs="6" sm="6" md="3">
                  <Form.Label className="small fw-bold text-muted mb-1">To</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                    className="rounded-pill px-3 border-0 shadow-sm"
                    style={{ height: '44px', fontSize: '14px' }}
                  />
                </Col>

                {/* Order Status Filter */}
                <Col xs="12" sm="6" md="3">
                  <Form.Label className="small fw-bold text-muted mb-1">Status</Form.Label>
                  <Dropdown className="w-100">
                    <Dropdown.Toggle
                      variant="white"
                      className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-3"
                      style={{ height: '44px', fontSize: '14px' }}
                    >
                      {filters.orderStatus || 'All Status'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      className="w-100 shadow-lg border-0 animate__animated animate__fadeIn"
                      style={{ borderRadius: '1.25rem', padding: '0.75rem', marginTop: '8px', maxHeight: '350px', overflowY: 'auto' }}
                    >
                      <Dropdown.Item onClick={() => handleFilterChange('orderStatus', '')}>All Status</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'Paid')}>Paid</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'Save')}>Save</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'KOT')}>KOT</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange('orderStatus', 'Cancelled')}>Cancelled</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>

                {/* Order Type Filter */}
                <Col xs="12" sm="6" md="3">
                  <Form.Label className="small fw-bold text-muted mb-1">Type</Form.Label>
                  <Dropdown className="w-100">
                    <Dropdown.Toggle
                      variant="white"
                      className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-3"
                      style={{ height: '44px', fontSize: '14px' }}
                    >
                      {filters.orderType || 'All Types'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      className="w-100 shadow-lg border-0 animate__animated animate__fadeIn"
                      style={{ borderRadius: '1.25rem', padding: '0.75rem', marginTop: '8px', maxHeight: '350px', overflowY: 'auto' }}
                    >
                      <Dropdown.Item onClick={() => handleFilterChange('orderType', '')}>All Types</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange('orderType', 'Dine In')}>Dine In</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange('orderType', 'Takeaway')}>Takeaway</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleFilterChange('orderType', 'Delivery')}>Delivery</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
              </Row>
            </div>
          </Card.Body>
        </Card>
      </Collapse>

      {data.length === 0 && !loading ? (
        <Alert variant="info" className="text-center border-0 shadow-sm" style={{ borderRadius: '1rem', backgroundColor: 'rgba(35, 179, 244, 0.05)', color: brandColor }}>
          <CsLineIcons icon="inbox" size="24" className="me-2" />
          No orders found. {searchTerm || getActiveFilterCount() > 0 ? 'Try adjusting your search or filters.' : 'Orders will appear here once created.'}
        </Alert>
      ) : (
        <>
          {/* Table View for Desktop */}
          <Row className="d-none d-md-flex">
            <Col xs="12">
              <Table className="react-table rows" tableInstance={tableInstance} onSort={handleSort} />
            </Col>
          </Row>

          {/* Card View for Mobile */}
          <Row className="d-md-none g-3">
            {data.map((order, idx) => (
              <Col key={idx} xs="12">
                <Card className="border-0 shadow-sm hover-scale-up" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
                  <Card.Body className="p-3 position-relative">
                    <div
                      className="position-absolute"
                      style={{
                        top: '-10px',
                        right: '-10px',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'rgba(35, 179, 244, 0.1)',
                        filter: 'blur(10px)',
                      }}
                    />
                    <div className="d-flex justify-content-between align-items-start mb-3 position-relative">
                      <div>
                        <div className="fw-bolder text-primary mb-1" style={{ fontSize: '14px' }}>
                          {order.order_no || 'ORD-0000'}
                        </div>
                        <div className="text-muted small fw-medium">{format(new Date(order.order_date), 'dd MMM yyyy, HH:mm')}</div>
                      </div>
                      <Badge
                        bg={order.order_status === 'Paid' || order.order_status === 'Completed' || order.order_status === 'Save' ? 'success' : order.order_status === 'KOT' ? 'warning' : order.order_status === 'Cancelled' ? 'danger' : 'secondary'}
                        className="rounded-pill px-3 py-1"
                      >
                        {order.order_status}
                      </Badge>
                    </div>

                    <Row className="mb-3 g-0 border-top pt-2" style={{ borderColor: '#f3f4f6' }}>
                      <Col xs="6">
                        <div className="text-muted small mb-1">Type</div>
                        <Badge bg={order.order_type === 'Dine In' ? 'primary' : order.order_type === 'Takeaway' ? 'warning' : order.order_type === 'Delivery' ? 'success' : 'secondary'} className="rounded-pill px-3 py-1">
                          {order.order_type}
                        </Badge>
                      </Col>
                      <Col xs="6" className="text-end">
                        <div className="text-muted small">Amount</div>
                        <div className="fw-bolder text-dark" style={{ fontSize: '15px' }}>
                          ₹{parseFloat(order.total_amount).toFixed(2)}
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-between align-items-center">
                      <Badge bg={order.order_source === 'Manager' ? 'info' : order.order_source === 'Captain' ? 'primary' : order.order_source === 'QSR' ? 'secondary' : 'dark'} className="rounded-pill px-3 py-1">
                        {order.order_source}
                      </Badge>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="btn-icon btn-icon-only rounded-circle"
                          onClick={() => history.push(`/operations/order-details/${order.id}`)}
                        >
                          <CsLineIcons icon="eye" size="14" />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="btn-icon btn-icon-only rounded-circle"
                          onClick={() => handlePrint(order.id)}
                          disabled={printing[order.id]}
                        >
                          {printing[order.id] ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="print" size="14" />}
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="mt-4">
            <Col xs="12">
              <TablePagination paginationProps={paginationProps} />
            </Col>
          </Row>
        </>
      )}
    </div>

    {/* Export Modal */}
    <Modal show={showExportModal} onHide={() => !exporting && setShowExportModal(false)} size="lg" centered className="modal-glass">
      <Modal.Header closeButton={!exporting} className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center">
          <div
            className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3"
            style={{ backgroundColor: 'rgba(30, 168, 231, 0.1)' }}
          >
            <CsLineIcons icon="download" size="20" style={{ color: '#1ea8e7' }} />
          </div>
          <span>Export Order History</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pt-4">
        {!exporting ? (
          <>
            <p className="text-muted mb-4">Select your preferred format and filters to generate the report.</p>

            <Form>
              {/* Export Format Selection */}
              <div className="mb-4">
                <Form.Label className="fw-bolder mb-3 text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                  Export Format
                </Form.Label>
                <Row className="g-3">
                  <Col xs="12" sm="6">
                    <Card
                      className={`border-2 transition-all cursor-pointer h-100 ${exportFormat === 'excel' ? 'border-primary' : 'border-separator-light'}`}
                      style={{ borderRadius: '1.25rem', backgroundColor: '#fff', transition: 'all 0.3s ease' }}
                      onClick={() => setExportFormat('excel')}
                    >
                      <Card.Body className="d-flex align-items-center p-3">
                        <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3 bg-light-success text-success">
                          <CsLineIcons icon="file-text" size="20" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold text-dark">Excel Data</div>
                          <div className="text-muted xsmall">Tabular .xlsx</div>
                        </div>
                        <div 
                          className={`sw-3 sh-3 rounded-circle border border-2 d-flex align-items-center justify-content-center ${exportFormat === 'excel' ? 'border-primary' : 'border-separator'}`}
                        >
                          {exportFormat === 'excel' && <div className="sw-1 sh-1 rounded-circle bg-primary" />}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs="12" sm="6">
                    <Card
                      className={`border-2 transition-all cursor-pointer h-100 ${exportFormat === 'pdf' ? 'border-primary' : 'border-separator-light'}`}
                      style={{ borderRadius: '1.25rem', backgroundColor: '#fff', transition: 'all 0.3s ease' }}
                      onClick={() => setExportFormat('pdf')}
                    >
                      <Card.Body className="d-flex align-items-center p-3">
                        <div className="sw-5 sh-5 rounded-circle d-flex justify-content-center align-items-center me-3 bg-light-danger text-danger">
                          <CsLineIcons icon="file-text" size="20" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold text-dark">PDF Report</div>
                          <div className="text-muted xsmall">Document .pdf</div>
                        </div>
                        <div 
                          className={`sw-3 sh-3 rounded-circle border border-2 d-flex align-items-center justify-content-center ${exportFormat === 'pdf' ? 'border-primary' : 'border-separator'}`}
                        >
                          {exportFormat === 'pdf' && <div className="sw-1 sh-1 rounded-circle bg-primary" />}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Export Filters */}
              <div className="mb-2">
                <Form.Label className="fw-bolder mb-3 text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                  Filter Data
                </Form.Label>
                <div className="p-4" style={{ borderRadius: '1.5rem', backgroundColor: '#f8f9fa' }}>
                  <Row className="g-3">
                    {/* Date Range */}
                    <Col xs={12}>
                      <Form.Label className="small fw-bold text-muted mb-2 ms-3">Date Range</Form.Label>
                      <div className="d-flex flex-column flex-sm-row gap-3">
                        <div className="flex-grow-1 position-relative">
                          <Form.Control
                            type="date"
                            value={exportFilters.fromDate}
                            onChange={(e) => setExportFilters({ ...exportFilters, fromDate: e.target.value })}
                            className="border-0 shadow-sm rounded-pill px-4"
                            style={{ height: '48px', fontSize: '14px' }}
                          />
                        </div>
                        <div className="flex-grow-1 position-relative">
                          <Form.Control
                            type="date"
                            value={exportFilters.toDate}
                            onChange={(e) => setExportFilters({ ...exportFilters, toDate: e.target.value })}
                            className="border-0 shadow-sm rounded-pill px-4"
                            style={{ height: '48px', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                    </Col>

                    {/* Status and Type */}
                    <Col xs={12} sm={6}>
                      <Form.Label className="small fw-bold text-muted mb-2 ms-3">Status</Form.Label>
                      <Dropdown className="w-100">
                        <Dropdown.Toggle
                          variant="white"
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4 no-dropdown-caret"
                          style={{ height: '48px', fontSize: '14px', color: '#1ea8e7' }}
                        >
                          <span>{exportFilters.orderStatus || 'All Status'}</span>
                          <CsLineIcons icon="chevron-right" size="13" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 shadow border-0" style={{ borderRadius: '1rem' }}>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: '' })}>All Status</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Paid' })}>Paid</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Save' })}>Save</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'KOT' })}>KOT</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderStatus: 'Cancelled' })}>Cancelled</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Label className="small fw-bold text-muted mb-2 ms-3">Order Type</Form.Label>
                      <Dropdown className="w-100">
                        <Dropdown.Toggle
                          variant="white"
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4 no-dropdown-caret"
                          style={{ height: '48px', fontSize: '14px', color: '#1ea8e7' }}
                        >
                          <span>{exportFilters.orderType || 'All Types'}</span>
                          <CsLineIcons icon="chevron-right" size="13" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 shadow border-0" style={{ borderRadius: '1rem' }}>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: '' })}>All Types</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Dine In' })}>Dine In</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Takeaway' })}>Takeaway</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, orderType: 'Delivery' })}>Delivery</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>

                    {/* Payment Mode */}
                    <Col xs={12}>
                      <Form.Label className="small fw-bold text-muted mb-2 ms-3">Payment Mode</Form.Label>
                      <Dropdown className="w-100">
                        <Dropdown.Toggle
                          variant="white"
                          className="w-100 rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-between px-4 no-dropdown-caret"
                          style={{ height: '48px', fontSize: '14px', color: '#1ea8e7' }}
                        >
                          <span>{exportFilters.paymentMode || 'All Payment Types'}</span>
                          <CsLineIcons icon="chevron-right" size="13" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100 shadow border-0" style={{ borderRadius: '1rem' }}>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentMode: '' })}>All Payment Types</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentMode: 'Cash' })}>Cash</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentMode: 'Card' })}>Card</Dropdown.Item>
                          <Dropdown.Item onClick={() => setExportFilters({ ...exportFilters, paymentMode: 'UPI' })}>UPI</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>
                  </Row>
                </div>
              </div>

              <div className="mt-4 px-2">
                <span className="text-primary small" style={{ cursor: 'default' }}>
                  Leave filters empty to export all records.
                </span>
              </div>
            </Form>
          </>
        ) : (
          <div className="text-center py-5">
            <div className="mb-4">
              <Spinner animation="border" style={{ color: brandColor, width: '3rem', height: '3rem' }} />
            </div>
            <h4 className="fw-bold mb-2">Generating Report</h4>
            <p className="text-muted mb-4">Please wait while we compile your data into {exportFormat === 'excel' ? 'Excel' : 'PDF'}...</p>
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              <ProgressBar now={exportProgress} animated style={{ height: '10px', borderRadius: '5px' }} />
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 pb-4 px-4">
        <Button variant="light" onClick={() => setShowExportModal(false)} disabled={exporting} className="rounded-pill px-4">
          Close
        </Button>
        <Button
          onClick={handleExportConfirm}
          disabled={exporting}
          className="rounded-pill px-4 hover-scale-up"
          style={{ backgroundColor: '#1ea8e7', borderColor: '#1ea8e7', color: '#fff' }}
        >
          {exporting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Generating...
            </>
          ) : (
            <>
              <CsLineIcons icon="download" className="me-2" />
              Download {exportFormat === 'excel' ? 'Excel' : 'PDF'}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default OrderHistory;

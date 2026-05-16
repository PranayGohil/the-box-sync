import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Badge, Col, Form, Row, Button, Spinner, Alert, Card, Collapse, Dropdown } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import { AuthContext } from 'contexts/AuthContext';

import ControlsPageSize from './components/ControlsPageSize';
import ControlsSearch from './components/ControlsSearch';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const customStyles = `
  .custom-control-btn {
    position: relative !important;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 10px !important;
    transition: all 0.2s ease !important;
    border: 1.5px solid #23b3f4 !important;
    background-color: #fff !important;
    color: #23b3f4 !important;
  }
  .custom-control-btn:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 8px rgba(35, 179, 244, 0.2) !important;
  }
  .custom-control-btn:hover svg {
    color: #fff !important;
    fill: #fff !important;
  }
  .custom-control-btn.active {
    background-color: #23b3f4 !important;
    color: #fff !important;
  }
  .custom-control-btn.active svg {
    color: #fff !important;
    fill: #fff !important;
  }
`;

const OrderHistory = () => {
  const title = 'Order History';
  const description = 'Order history with advanced filters.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/order-history', title: 'Order History' },
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
            ${items.map(item => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
              </tr>
            `).join('')}
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
            ${items.map(item => `
              <tr>
                <td>${item.dish_name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: center;">₹${item.dish_price}</td>
                <td style="text-align: right;">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
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
      setPrinting(prev => ({ ...prev, [orderId]: true }));
      const userRes = await axios.get(`${process.env.REACT_APP_API}/user/get`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const orderRes = await axios.get(`${process.env.REACT_APP_API}/order/get/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const order = orderRes.data.data;
      const userData = userRes.data;
      const groupedByCounter = {};
      order.order_items.forEach(item => {
        const counterName = item.counter || "Default";
        if (!groupedByCounter[counterName]) groupedByCounter[counterName] = [];
        groupedByCounter[counterName].push(item);
      });

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocked! Please allow popups.");
        return;
      }

      let allBillsHTML = printFullBill(order, userData, order.order_items, order.sub_total);
      Object.entries(groupedByCounter).forEach(([counterName, items]) => {
        allBillsHTML += printCounterBill(order, userData, counterName, items);
      });

      printWindow.document.write(`<html><head><title>Print Bills</title></head><body>${allBillsHTML}<script>window.onload=function(){window.focus();window.print();setTimeout(function(){window.close();},100);};</script></body></html>`);
      printWindow.document.close();
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print bills");
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
        Cell: ({ value }) => new Date(value).toLocaleDateString('en-IN'),
      },
      {
        Header: 'Customer Name',
        accessor: 'customer_name',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        sortable: true,
      },
      {
        Header: 'Order Type',
        accessor: 'order_type',
        headerClassName: 'text-muted text-small text-uppercase w-10',
        sortable: true,
        Cell: ({ value }) => (
          <Badge bg={value === 'Dine In' ? 'primary' : value === 'Takeaway' ? 'warning' : value === 'Delivery' ? 'success' : 'secondary'}>{value}</Badge>
        ),
      },
      {
        Header: 'Total Amount',
        accessor: 'total_amount',
        headerClassName: 'text-muted text-small text-uppercase w-15',
        sortable: true,
        Cell: ({ value }) => `₹ ${parseFloat(value).toFixed(2)}`,
      },
      {
        Header: 'Status',
        accessor: 'order_status',
        headerClassName: 'text-muted text-small text-uppercase w-10',
        sortable: true,
        Cell: ({ value }) => (
          <Badge bg={value === 'Paid' || value === 'Save' ? 'success' : value === 'KOT' ? 'warning' : value === 'Cancelled' ? 'danger' : 'secondary'}>
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
              {printing[row.original.id] ? <Spinner animation="border" size="sm" /> : <CsLineIcons icon="print" />}
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
      <>
        <HtmlHead title={title} description={description} />
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: brandColor }} className="mb-3" />
          <h5>Loading Order History...</h5>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />

      <div className="page-title-container mb-4 mt-5 mt-lg-0">
        <Row className="align-items-center">
          <Col xs="12" md="7">
            <h1 className="mb-0 pb-0 fw-800" style={{ color: brandColor, fontSize: '1.5rem' }}>{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Row className="mb-3 align-items-center">
        <Col xs="12" md="5" lg="3">
          <div className="d-flex gap-2">
            <div className="flex-grow-1 shadow-sm rounded-pill bg-white border d-flex align-items-center px-3" style={{ height: '40px' }}>
              <CsLineIcons icon="search" size="16" className="text-primary opacity-75" />
              <Form.Control 
                type="text" 
                placeholder="Search orders..." 
                className="border-0 bg-transparent shadow-none flex-grow-1 ms-2"
                style={{ fontSize: '14px' }}
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className={`custom-control-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <CsLineIcons icon="filter" size="18" />
              {getActiveFilterCount() > 0 && (
                <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '10px' }}>
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </div>
        </Col>
        <Col xs="12" md="7" lg="9" className="text-end">
          <div className="d-inline-block me-3 text-muted small fw-bold">
            Showing {data.length} of {totalRecords} entries
          </div>
          <div className="d-inline-block">
            <ControlsPageSize pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
          </div>
        </Col>
      </Row>

      <Collapse in={showFilters}>
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '1.25rem' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Advanced Filters</h6>
              <Button variant="link" className="text-danger p-0 fw-bold text-decoration-none" onClick={handleClearFilters}>Clear All</Button>
            </div>
            <Row className="g-3">
              <Col md={3}>
                <Form.Label className="small fw-bold text-muted">From Date</Form.Label>
                <Form.Control type="date" className="rounded-pill" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-bold text-muted">To Date</Form.Label>
                <Form.Control type="date" className="rounded-pill" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-bold text-muted">Order Status</Form.Label>
                <Form.Select className="rounded-pill" value={filters.orderStatus} onChange={(e) => handleFilterChange('orderStatus', e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="KOT">KOT</option>
                  <option value="Cancelled">Cancelled</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-bold text-muted">Order Type</Form.Label>
                <Form.Select className="rounded-pill" value={filters.orderType} onChange={(e) => handleFilterChange('orderType', e.target.value)}>
                  <option value="">All Types</option>
                  <option value="Takeaway">Takeaway</option>
                  <option value="Delivery">Delivery</option>
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Collapse>

      {data.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '1.25rem' }}>
          <Card.Body>
            <CsLineIcons icon="inbox" size="48" className="text-muted mb-3" />
            <h5 className="fw-bold">No Orders Found</h5>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '1.25rem' }}>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="react-table rows" tableInstance={tableInstance} onSort={handleSort} />
            </div>
            <div className="p-3 border-top">
              <TablePagination paginationProps={paginationProps} />
            </div>
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default OrderHistory;

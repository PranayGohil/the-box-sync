import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Badge, Table, Modal, Alert, Pagination, Dropdown, Collapse } from 'react-bootstrap';
import axios from 'axios';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import CreatableSelect from 'react-select/creatable';

const addValidationSchema = Yup.object().shape({
  bill_date: Yup.date().required('Date is required'),
  bill_number: Yup.string().required('Bill number is required'),
  vendor_name: Yup.string().required('Vendor name is required'),
  category: Yup.string().required('Category is required'),
  paid_amount: Yup.number().min(0, 'Paid amount cannot be negative').required('Paid amount is required'),
  tax: Yup.number().min(0).default(0),
  discount: Yup.number().min(0).default(0),
  items: Yup.array().of(
    Yup.object().shape({
      item_name: Yup.string().required('Item name required'),
      item_quantity: Yup.number().positive('Must be positive').required('Qty required'),
      unit: Yup.string().required('Unit required'),
      item_price: Yup.number().min(0, 'Cannot be negative').required('Price required'),
    })
  ).min(1, 'At least one item is required'),
});

const useValidationSchema = Yup.object().shape({
  item_name: Yup.string().required('Please select an item'),
  quantity_used: Yup.number().positive('Quantity must be greater than zero').required('Quantity is required'),
  comment: Yup.string().max(200, 'Comment must be under 200 characters'),
});

const DEFAULT_UNITS = [
  'kg',
  'g',
  'L',
  'ml',
  'pcs',
  'box',
  'pkt',
  'doz',
  'bottle',
  'can',
  'bag',
  'tin',
  'bunch',
  'tray',
  'roll'
];

const Inventory = () => {
  const history = useHistory();
  const [stock, setStock] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('bill_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filePreviews, setFilePreviews] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  useEffect(() => {
    const totalPages = Math.ceil(inventoryList.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [inventoryList.length, itemsPerPage, currentPage]);

  const fetchStock = useCallback(async () => {
    try {
      setLoadingStock(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/stock`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data?.success) {
        setStock(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load current stock');
    } finally {
      setLoadingStock(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      setLoadingList(true);
      // Fetch only Completed purchases to represent stock additions
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Completed`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data?.success) {
        setInventoryList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory logs');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
    fetchInventory();
  }, [fetchStock, fetchInventory]);

  const confirmDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${deleteTargetId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data?.success || res.status === 200) {
        toast.success('Inventory entry deleted successfully');
        fetchInventory();
        fetchStock();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete inventory entry');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  const sortedItems = useMemo(() => {
    return [...inventoryList].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (sortBy === 'bill_date') {
        valA = new Date(a.bill_date || a.request_date).getTime();
        valB = new Date(b.bill_date || b.request_date).getTime();
      } else if (sortBy === 'total_amount') {
        valA = Number(a.total_amount || 0);
        valB = Number(b.total_amount || 0);
      } else if (sortBy === 'paid_amount') {
        valA = Number(a.paid_amount || 0);
        valB = Number(b.paid_amount || 0);
      } else if (sortBy === 'unpaid_amount') {
        const dueA = a.unpaid_amount !== undefined ? Number(a.unpaid_amount) : Math.max(0, Number(a.total_amount || 0) - Number(a.paid_amount || 0));
        const dueB = b.unpaid_amount !== undefined ? Number(b.unpaid_amount) : Math.max(0, Number(b.total_amount || 0) - Number(b.paid_amount || 0));
        valA = dueA;
        valB = dueB;
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [inventoryList, sortBy, sortOrder]);

  const filteredItems = useMemo(() => {
    let result = sortedItems;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return (
          (item.bill_number || '').toLowerCase().includes(term) ||
          (item.vendor_name || '').toLowerCase().includes(term)
        );
      });
    }

    if (filters.status) {
      result = result.filter((item) => {
        const totalAmt = Number(item.total_amount || 0);
        const paidAmt = Number(item.paid_amount || 0);
        const dueAmt = item.unpaid_amount !== undefined && item.unpaid_amount !== null && item.unpaid_amount !== ''
          ? Number(item.unpaid_amount)
          : Math.max(0, totalAmt - paidAmt);
        const isDue = dueAmt > 0;
        return filters.status === 'Due' ? isDue : !isDue;
      });
    }

    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter((item) => {
        const itemDate = new Date(item.bill_date || item.request_date);
        return itemDate >= fromDate;
      });
    }

    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((item) => {
        const itemDate = new Date(item.bill_date || item.request_date);
        return itemDate <= toDate;
      });
    }

    return result;
  }, [sortedItems, searchTerm, filters]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.fromDate) count++;
    if (filters.toDate) count++;
    return count;
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      fromDate: '',
      toDate: '',
    });
    setLocalSearchTerm('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title="Inventory Management" description="Simple inventory management" />
      <style>{`
        .inventory-card-low-stock {
          background: rgba(239, 68, 68, 0.05) !important;
          border: 1.5px solid rgba(239, 68, 68, 0.25) !important;
          transition: all 0.2s ease-in-out;
        }
        .inventory-card-normal-stock {
          background: rgba(35, 179, 244, 0.04) !important;
          border: 1.5px solid rgba(35, 179, 244, 0.12) !important;
          transition: all 0.2s ease-in-out;
        }
        .inventory-card-low-stock:hover {
          background: rgba(239, 68, 68, 0.08) !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
        }
        .inventory-card-normal-stock:hover {
          background: rgba(35, 179, 244, 0.08) !important;
          box-shadow: 0 4px 12px rgba(35, 179, 244, 0.08);
        }
        .mobile-log-card {
          border-radius: 16px !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          background: #ffffff !important;
          margin-bottom: 16px !important;
          padding: 16px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative;
          overflow: hidden;
        }
        .mobile-log-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #23b3f4;
          opacity: 0.8;
        }
        .mobile-log-card.due-active::before {
          background: #ef4444;
        }
        .mobile-log-card:active, .mobile-log-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 24px rgba(35, 179, 244, 0.06) !important;
        }
        .mobile-log-card.due-active:active, .mobile-log-card.due-active:hover {
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.06) !important;
        }
        .mobile-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .mobile-card-actions {
          display: flex;
          gap: 6px;
        }
        .mobile-card-action-btn {
          border-radius: 50px !important;
          font-size: 0.72rem !important;
          font-weight: 700 !important;
          padding: 4px 12px !important;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          transition: all 0.2s ease;
        }
        .mobile-card-action-btn.btn-outline-primary {
          border-color: rgba(35, 179, 244, 0.25) !important;
          color: #23b3f4 !important;
          background: rgba(35, 179, 244, 0.02) !important;
        }
        .mobile-card-action-btn.btn-outline-primary:hover,
        .mobile-card-action-btn.btn-outline-primary:active {
          background: #23b3f4 !important;
          color: #ffffff !important;
          border-color: #23b3f4 !important;
        }
        .mobile-card-action-btn.btn-outline-warning {
          border-color: rgba(245, 158, 11, 0.25) !important;
          color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.02) !important;
        }
        .mobile-card-action-btn.btn-outline-warning:hover,
        .mobile-card-action-btn.btn-outline-warning:active {
          background: #f59e0b !important;
          color: #ffffff !important;
          border-color: #f59e0b !important;
        }
        .mobile-card-action-btn.btn-outline-danger {
          border-color: rgba(239, 68, 68, 0.25) !important;
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.02) !important;
        }
        .mobile-card-action-btn.btn-outline-danger:hover,
        .mobile-card-action-btn.btn-outline-danger:active {
          background: #ef4444 !important;
          color: #ffffff !important;
          border-color: #ef4444 !important;
        }
        .bg-light-danger {
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        .bg-light-success {
          background-color: rgba(34, 197, 94, 0.1) !important;
        }
        .pagination .page-item .page-link {
          color: #23b3f4 !important;
          border: 1px solid rgba(35, 179, 244, 0.15) !important;
          border-radius: 50% !important;
          margin: 0 2px !important;
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 700 !important;
          font-size: 0.78rem !important;
          transition: all 0.2s ease;
        }
        .pagination .page-item.active .page-link {
          background-color: #23b3f4 !important;
          border-color: #23b3f4 !important;
          color: #ffffff !important;
        }
        .pagination .page-item.disabled .page-link {
          color: #94a3b8 !important;
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        .inventory-delete-modal-content .btn {
          border-radius: 50px !important;
          font-weight: 600 !important;
          padding: 6px 20px !important;
          height: 38px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          font-size: 0.88rem !important;
        }
        .inventory-delete-modal-content .btn-outline-secondary {
          border: 1px solid #64748b !important;
          color: #64748b !important;
          background-color: #ffffff !important;
        }
        .inventory-delete-modal-content .btn-outline-secondary:hover {
          background-color: #64748b !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
        }
        .inventory-delete-modal-content .btn-outline-danger {
          border: 1px solid #ef4444 !important;
          color: #ef4444 !important;
          background-color: #ffffff !important;
        }
        .inventory-delete-modal-content .btn-outline-danger:hover {
          background-color: #ef4444 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
        }
        .inventory-delete-modal-content .btn-outline-danger:hover svg {
          stroke: #ffffff !important;
        }
      `}</style>
      
      <div className="qsr-page-title-container">
        <Row className="align-items-center g-3">
          <Col xs="12" md="auto" className="me-auto">
            <h1 className="qsr-page-title">Inventory Management</h1>
            <p className="text-muted mb-0">Record raw materials, update stock quantities, and log usage.</p>
          </Col>
          <Col xs="12" md="auto">
            <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto justify-content-md-end">
              <Button
                variant="outline-primary"
                className="rounded-pill px-4 shadow-sm w-100 w-sm-auto fw-bold"
                style={{ borderColor: '#23b3f4', color: '#23b3f4' }}
                onClick={() => setShowUseModal(true)}
              >
                <CsLineIcons icon="bin" className="me-2" /> Log Usage (Use Stock)
              </Button>
              <Button
                variant="outline-primary"
                className="rounded-pill px-4 shadow-sm w-100 w-sm-auto fw-bold"
                style={{ borderColor: '#23b3f4', color: '#23b3f4' }}
                onClick={() => { setFilePreviews([]); setShowAddModal(true); }}
              >
                <CsLineIcons icon="plus" className="me-2" /> Add Purchase (Add Stock)
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Stock Summary Strip */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center text-secondary">
            <CsLineIcons icon="activity" className="me-2 text-primary" size="20" />
            Current Stock Levels
          </h5>
          {loadingStock ? (
            <div className="text-center py-3"><Spinner animation="border" variant="primary" /></div>
          ) : stock.length === 0 ? (
            <Alert variant="light" className="text-center py-3 mb-0 border-dashed">No stock registered yet. Add a purchase to record stock.</Alert>
          ) : (
            <Row className="g-3">
              {stock.map((item) => {
                const isLow = item.totalStock <= (item.low_stock_threshold || 0);
                return (
                  <Col key={item._id} xs={6} sm={6} md={4} lg={3}>
                    <div 
                      className={`p-3 rounded-3 h-100 d-flex flex-column justify-content-between ${
                        isLow ? 'inventory-card-low-stock' : 'inventory-card-normal-stock'
                      }`}
                    >
                      <div>
                        <div className="fw-bold text-dark mb-1" style={{ fontSize: '13.5px', wordBreak: 'break-word' }}>
                          {item._id}
                        </div>
                        <h3 className={`fw-extrabold mb-0 ${isLow ? 'text-danger' : 'text-primary'}`} style={{ fontSize: '20px' }}>
                          {item.totalStock} <span className="fs-6 fw-normal text-muted">{item.unit}</span>
                        </h3>
                      </div>
                      {isLow && (
                        <div className="text-danger small mt-2 fw-semibold" style={{ fontSize: '10.5px' }}>
                          ⚠️ Low stock (min: {item.low_stock_threshold})
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Main Inventory Log Table */}
      <style>{`
        table.react-table.rows {
          border-collapse: separate !important;
          border-spacing: 0 10px !important;
        }
        table.react-table.rows thead th {
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.05em !important;
          color: #94a3b8 !important;
          text-transform: uppercase !important;
          border: none !important;
          padding: 0.5rem 1rem !important;
          user-select: none;
        }
        table.react-table.rows tbody tr td {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        .pagination .page-item .page-link {
          border-radius: 8px !important;
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `}</style>
      
      <div className="mb-4">
        {loadingList ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : inventoryList.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-5">
              <CsLineIcons icon="warning-hexagon" size="45" className="text-muted mb-3" />
              <h5 className="text-muted fw-bold">No purchase logs found</h5>
              <p className="text-muted small mb-0">Record a new purchase to see it logged here.</p>
            </Card.Body>
          </Card>
        ) : (
          <>
            {/* Search and Controls */}
            <Row className="mb-4 g-2 align-items-center">
              <Col xs="12" sm="auto" className="flex-grow-1" style={{ minWidth: '200px' }}>
                <div className="order-history-custom-search-container shadow-sm d-flex align-items-center px-2">
                  <CsLineIcons icon="search" size="18" className="text-primary opacity-75 ms-1 me-2" />
                  <Form.Control
                    type="text"
                    className="border-0 bg-transparent shadow-none"
                    placeholder="Search purchases..."
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
              <Col xs="auto">
                <Button
                  className={`order-history-custom-control-btn shadow-sm ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filters"
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
              </Col>
              <Col xs="auto" className="text-end d-flex align-items-center gap-3 ms-auto ms-sm-0">
                <div className="text-muted small">
                  Showing {filteredItems.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length}
                </div>
                <Dropdown className="d-inline-block" align="end">
                  <Dropdown.Toggle 
                    variant="outline-primary" 
                    className="rounded-pill shadow-sm px-3 fw-bold border-2 d-flex align-items-center justify-content-center dropdown-caret"
                    style={{ height: '40px', color: '#23b3f4', borderColor: '#23b3f4' }}
                  >
                    <span className="me-2">{itemsPerPage} Items</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    className="shadow-lg border-0"
                    style={{ borderRadius: '15px', overflow: 'hidden' }}
                  >
                    {[5, 10, 20, 50].map((pSize) => (
                      <Dropdown.Item
                        key={`pageSize.${pSize}`}
                        active={pSize === itemsPerPage}
                        onClick={() => {
                          setItemsPerPage(pSize);
                          setCurrentPage(1);
                        }}
                        className="px-4 py-2"
                      >
                        {pSize} Items
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>

            {/* Filter Collapse Panel */}
            <Collapse in={showFilters}>
              <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '1.25rem', backgroundColor: '#f8f9fa' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#23b3f4' }}>
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

                  <Row className="g-3">
                    <Col xs="12" sm="4">
                      <Form.Label className="small fw-bold text-muted mb-1">Status</Form.Label>
                      <Form.Select
                        className="rounded-pill px-3 border-0 shadow-sm"
                        style={{ height: '44px', fontSize: '14px' }}
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Due">Due</option>
                      </Form.Select>
                    </Col>
                    
                    <Col xs="12" sm="4">
                      <Form.Label className="small fw-bold text-muted mb-1">From Date</Form.Label>
                      <Form.Control
                        type="date"
                        className="rounded-pill px-3 border-0 shadow-sm"
                        style={{ height: '44px', fontSize: '14px' }}
                        value={filters.fromDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                      />
                    </Col>

                    <Col xs="12" sm="4">
                      <Form.Label className="small fw-bold text-muted mb-1">To Date</Form.Label>
                      <Form.Control
                        type="date"
                        className="rounded-pill px-3 border-0 shadow-sm"
                        style={{ height: '44px', fontSize: '14px' }}
                        value={filters.toDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Collapse>

            {/* Desktop Table View */}
            <div className="table-responsive d-none d-md-block">
              <table className="react-table rows align-middle mb-0">
                <thead>
                  <tr>
                    {(() => {
                      const renderHeader = (label, field) => {
                        const isSorted = sortBy === field;
                        return (
                          <th
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (sortBy === field) {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy(field);
                                setSortOrder('desc');
                              }
                              setCurrentPage(1);
                            }}
                          >
                            <div className="d-inline-flex align-items-center">
                              <span>{label}</span>
                              <span className="ms-1 text-muted" style={{ fontSize: '10px' }}>
                                {isSorted ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                              </span>
                            </div>
                          </th>
                        );
                      };
                      return (
                        <>
                          {renderHeader('Date', 'bill_date')}
                          {renderHeader('Bill #', 'bill_number')}
                          {renderHeader('Vendor', 'vendor_name')}
                          {renderHeader('Total Amount', 'total_amount')}
                          {renderHeader('Paid Amount', 'paid_amount')}
                          {renderHeader('Due Amount', 'unpaid_amount')}
                          <th className="text-end">Action</th>
                        </>
                      );
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => {
                    const totalAmt = Number(item.total_amount || 0);
                    const paidAmt = Number(item.paid_amount || 0);
                    const dueAmt = item.unpaid_amount !== undefined && item.unpaid_amount !== null && item.unpaid_amount !== ''
                      ? Number(item.unpaid_amount)
                      : Math.max(0, totalAmt - paidAmt);

                    return (
                      <tr key={item._id}>
                        <td>
                          {item.bill_date ? new Date(item.bill_date).toLocaleDateString('en-IN') : new Date(item.request_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="fw-bold text-dark">{item.bill_number || '—'}</td>
                        <td>{item.vendor_name || '—'}</td>
                        <td className="fw-bold text-primary" style={{ color: '#23b3f4' }}>₹{totalAmt.toFixed(2)}</td>
                        <td className="fw-bold text-success">₹{paidAmt.toFixed(2)}</td>
                        <td>
                          <span className={`fw-bold ${dueAmt > 0 ? 'text-danger' : 'text-success'}`}>
                            ₹{dueAmt.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="btn-icon btn-icon-only rounded-circle animate-scale" 
                              onClick={() => history.push(`/inventory/details/${item._id}`)}
                              title="View Details"
                            >
                              <CsLineIcons icon="eye" size="14" />
                            </Button>
                            <Button 
                              variant="outline-warning" 
                              size="sm" 
                              className="btn-icon btn-icon-only rounded-circle animate-scale" 
                              onClick={() => history.push(`/inventory/edit/${item._id}`)}
                              title="Edit"
                            >
                              <CsLineIcons icon="edit" size="14" />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              className="btn-icon btn-icon-only rounded-circle animate-scale" 
                              onClick={() => confirmDelete(item._id)}
                              title="Delete"
                            >
                              <CsLineIcons icon="bin" size="14" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>

            {/* Mobile Card List View */}
            <div className="d-block d-md-none">
              <div className="d-flex align-items-center mb-3">
                <h3 className="h5 fw-extrabold text-dark mb-0">Purchase Logs</h3>
              </div>
              {currentItems.map((item) => {
                const totalAmt = Number(item.total_amount || 0);
                const paidAmt = Number(item.paid_amount || 0);
                const dueAmt = item.unpaid_amount !== undefined && item.unpaid_amount !== null && item.unpaid_amount !== ''
                  ? Number(item.unpaid_amount)
                  : Math.max(0, totalAmt - paidAmt);
                const isDue = dueAmt > 0;

                return (
                  <div key={item._id} className={`mobile-log-card ${isDue ? 'due-active' : ''}`}>
                    <div className="mobile-card-header">
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted fw-bold" style={{ fontSize: '11px', letterSpacing: '0.03em' }}>
                          {item.bill_date ? new Date(item.bill_date).toLocaleDateString('en-IN') : new Date(item.request_date).toLocaleDateString('en-IN')}
                        </span>
                        <Badge bg={isDue ? 'light-danger' : 'light-success'} className={`px-2 py-1 rounded-pill ${isDue ? 'text-danger bg-light-danger' : 'text-success bg-light-success'}`} style={{ fontSize: '10px', fontWeight: '800' }}>
                          {isDue ? 'DUE' : 'PAID'}
                        </Badge>
                      </div>
                      <div className="mobile-card-actions d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="btn-icon btn-icon-only rounded-circle animate-scale" 
                          onClick={() => history.push(`/inventory/details/${item._id}`)}
                          title="View Details"
                        >
                          <CsLineIcons icon="eye" size="14" />
                        </Button>
                        <Button 
                          variant="outline-warning" 
                          size="sm" 
                          className="btn-icon btn-icon-only rounded-circle animate-scale" 
                          onClick={() => history.push(`/inventory/edit/${item._id}`)}
                          title="Edit"
                        >
                          <CsLineIcons icon="edit" size="14" />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="btn-icon btn-icon-only rounded-circle animate-scale" 
                          onClick={() => confirmDelete(item._id)}
                          title="Delete"
                        >
                          <CsLineIcons icon="bin" size="14" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="fw-extrabold text-dark d-flex align-items-center" style={{ fontSize: '14px', letterSpacing: '-0.01em' }}>
                        <CsLineIcons icon="file-text" size="14" className="text-muted me-1.5" />
                        <span>Bill: {item.bill_number || '—'}</span>
                      </div>
                      <div className="text-muted mt-1 d-flex align-items-center" style={{ fontSize: '12px' }}>
                        <CsLineIcons icon="user" size="12" className="text-muted me-1.5" />
                        <span>Vendor: <span className="fw-semibold text-dark">{item.vendor_name || '—'}</span></span>
                      </div>
                    </div>

                    <Row className="g-0 text-center rounded-3 p-2" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Col xs={4} className="border-end border-light">
                        <div className="text-muted fw-bold mb-0.5" style={{ fontSize: '9.5px', letterSpacing: '0.05em' }}>TOTAL</div>
                        <div className="fw-extrabold text-primary" style={{ fontSize: '13px' }}>₹{totalAmt.toFixed(2)}</div>
                      </Col>
                      <Col xs={4} className="border-end border-light">
                        <div className="text-muted fw-bold mb-0.5" style={{ fontSize: '9.5px', letterSpacing: '0.05em' }}>PAID</div>
                        <div className="fw-extrabold text-success" style={{ fontSize: '13px' }}>₹{paidAmt.toFixed(2)}</div>
                      </Col>
                      <Col xs={4}>
                        <div className="text-muted fw-bold mb-0.5" style={{ fontSize: '9.5px', letterSpacing: '0.05em' }}>DUE</div>
                        <div className={`fw-extrabold ${isDue ? 'text-danger' : 'text-success'}`} style={{ fontSize: '13px' }}>
                          ₹{dueAmt.toFixed(2)}
                        </div>
                      </Col>
                    </Row>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls (Shared) */}
            {(() => {
              const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
              return (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination size="sm" className="mb-0">
                    <Pagination.First
                      className="shadow"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <CsLineIcons icon="arrow-double-left" size="12" />
                    </Pagination.First>
                    <Pagination.Prev 
                      className="shadow"
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} 
                    >
                      <CsLineIcons icon="chevron-left" size="12" />
                    </Pagination.Prev>
                    
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Pagination.Item
                        key={i + 1}
                        className="shadow"
                        active={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}

                    <Pagination.Next 
                      className="shadow"
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} 
                    >
                      <CsLineIcons icon="chevron-right" size="12" />
                    </Pagination.Next>
                    <Pagination.Last
                      className="shadow"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <CsLineIcons icon="arrow-double-right" size="12" />
                    </Pagination.Last>
                  </Pagination>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Add Purchase (Add Stock) Modal */}
      <Modal show={showAddModal} onHide={() => { setFilePreviews([]); setShowAddModal(false); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">Add Purchase (Stock In)</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            bill_date: new Date().toISOString().split('T')[0],
            bill_number: '',
            vendor_name: '',
            category: '',
            tax: 0,
            discount: 0,
            paid_amount: 0,
            status: 'Completed',
            items: [{ item_name: '', item_quantity: '', unit: '', item_price: '' }],
            bill_files: [],
          }}
          validationSchema={addValidationSchema}
          onSubmit={async (values) => {
            setIsSubmitting(true);
            try {
              const subTotal = values.items.reduce((acc, curr) => acc + (Number(curr.item_quantity) || 0) * (Number(curr.item_price) || 0), 0);
              const totalAmount = subTotal + (Number(values.tax) || 0) - (Number(values.discount) || 0);
              const unpaidAmount = totalAmount - (Number(values.paid_amount) || 0);

              const formData = new FormData();
              formData.append('bill_date', values.bill_date);
              formData.append('bill_number', values.bill_number);
              formData.append('vendor_name', values.vendor_name);
              formData.append('category', values.category);
              formData.append('tax', values.tax || 0);
              formData.append('discount', values.discount || 0);
              formData.append('paid_amount', values.paid_amount || 0);
              formData.append('status', values.status || 'Completed');
              formData.append('sub_total', subTotal);
              formData.append('total_amount', totalAmount);
              formData.append('unpaid_amount', unpaidAmount);
              formData.append('items', JSON.stringify(values.items));

              if (values.bill_files && values.bill_files.length > 0) {
                Array.from(values.bill_files).forEach((file) => {
                  formData.append('bill_files', file);
                });
              }

              await axios.post(`${process.env.REACT_APP_API}/inventory/add`, formData, {
                headers: { 
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'multipart/form-data',
                },
              });

              toast.success('Inventory purchase recorded successfully!');
              setShowAddModal(false);
              fetchInventory();
              fetchStock();
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.message || 'Failed to add inventory entry');
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleSubmit, setFieldValue }) => {
            const subTotal = values.items.reduce((acc, curr) => acc + (Number(curr.item_quantity) || 0) * (Number(curr.item_price) || 0), 0);
            const totalAmount = subTotal + (Number(values.tax) || 0) - (Number(values.discount) || 0);
            const unpaidAmount = totalAmount - (Number(values.paid_amount) || 0);
            
            const availableUnits = Array.from(new Set([
              ...DEFAULT_UNITS,
              ...stock.map(s => s.unit?.trim()).filter(Boolean),
              ...inventoryList.flatMap(inv => inv.items?.map(it => it.unit?.trim()) || []).filter(Boolean),
              ...values.items.map(it => it.unit?.trim()).filter(Boolean)
            ]));

            return (
              <Form onSubmit={handleSubmit}>
                <Modal.Body className="px-4 py-3">
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Date *</Form.Label>
                        <Form.Control 
                          type="date" 
                          name="bill_date" 
                          value={values.bill_date} 
                          onChange={handleChange}
                          isInvalid={touched.bill_date && errors.bill_date}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Bill Number *</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="bill_number" 
                          placeholder="e.g. BILL-101" 
                          value={values.bill_number} 
                          onChange={handleChange}
                          isInvalid={touched.bill_number && errors.bill_number}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Vendor Name *</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="vendor_name" 
                          placeholder="Vendor Name" 
                          value={values.vendor_name} 
                          onChange={handleChange}
                          isInvalid={touched.vendor_name && errors.vendor_name}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Category *</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="category" 
                          placeholder="e.g. Vegetables, Dairy" 
                          value={values.category} 
                          onChange={handleChange}
                          isInvalid={touched.category && errors.category}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Attach Bill Image/PDF</Form.Label>
                        <input
                          type="file"
                          multiple
                          className="d-none"
                          id="bill-upload-modal"
                          onChange={(e) => {
                            const { files } = e.currentTarget;
                            setFieldValue('bill_files', files);
                            const p = Array.from(files).map((f) => ({ name: f.name, type: f.type }));
                            setFilePreviews(p);
                          }}
                        />
                        <label htmlFor="bill-upload-modal" className="w-100 d-block p-3 text-center border-dashed rounded-3 bg-light cursor-pointer">
                          <CsLineIcons icon="upload" size="20" className="mb-2 text-primary" />
                          <div className="fw-bold text-muted small">Upload Bills (Images or PDF)</div>
                        </label>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {filePreviews.map((f, i) => (
                            <div key={i} className="px-2.5 py-1 rounded bg-white shadow-sm border text-muted small d-inline-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                              <CsLineIcons icon={f.type.includes('pdf') ? 'file-text' : 'image'} size="12" />
                              <span>{f.name.substring(0, 20)}...</span>
                            </div>
                          ))}
                          {filePreviews.length > 0 && (
                            <Button 
                              variant="link" 
                              className="text-danger p-0 text-decoration-none small fw-bold d-inline-flex align-items-center gap-1 ms-2"
                              onClick={() => {
                                setFieldValue('bill_files', []);
                                setFilePreviews([]);
                              }}
                            >
                              <CsLineIcons icon="close" size="12" /> Clear
                            </Button>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">Purchase Items</h6>
                  
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <div>
                        {values.items.map((item, index) => (
                          <Row key={index} className="g-2 align-items-center mb-3 p-2 rounded border border-light" style={{ background: '#f8fafc' }}>
                            <Col xs={12} sm={4}>
                              <Form.Group>
                                <Form.Label className="small fw-bold d-block d-sm-none">Item Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name={`items[${index}].item_name`}
                                  placeholder="Item name"
                                  value={item.item_name}
                                  onChange={handleChange}
                                  isInvalid={touched.items?.[index]?.item_name && errors.items?.[index]?.item_name}
                                />
                              </Form.Group>
                            </Col>
                            <Col xs={4} sm={2}>
                              <Form.Group>
                                <Form.Label className="small fw-bold d-block d-sm-none">Qty</Form.Label>
                                <Form.Control
                                  type="number"
                                  name={`items[${index}].item_quantity`}
                                  placeholder="Qty"
                                  value={item.item_quantity}
                                  onChange={handleChange}
                                  isInvalid={touched.items?.[index]?.item_quantity && errors.items?.[index]?.item_quantity}
                                />
                              </Form.Group>
                            </Col>
                            <Col xs={4} sm={2}>
                              <Form.Group>
                                <Form.Label className="small fw-bold d-block d-sm-none">Unit</Form.Label>
                                <CreatableSelect
                                  isClearable
                                  menuPlacement="auto"
                                  menuPortalTarget={document.body}
                                  options={availableUnits.map((u) => ({ label: u, value: u }))}
                                  value={item.unit ? { label: item.unit, value: item.unit } : null}
                                  onChange={(selected) => {
                                    handleChange({
                                      target: {
                                        name: `items[${index}].unit`,
                                        value: selected ? selected.value : '',
                                      },
                                    });
                                  }}
                                  placeholder="Unit"
                                  classNamePrefix="react-select"
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      borderColor: touched.items?.[index]?.unit && errors.items?.[index]?.unit ? '#dc3545' : base.borderColor,
                                      minHeight: '38px',
                                      height: '38px',
                                    }),
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    menu: (base) => ({ ...base, zIndex: 9999 }),
                                  }}
                                  formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                />
                              </Form.Group>
                            </Col>
                            <Col xs={4} sm={3}>
                              <Form.Group>
                                <Form.Label className="small fw-bold d-block d-sm-none">Price</Form.Label>
                                <Form.Control
                                  type="number"
                                  name={`items[${index}].item_price`}
                                  placeholder="Price"
                                  value={item.item_price}
                                  onChange={handleChange}
                                  isInvalid={touched.items?.[index]?.item_price && errors.items?.[index]?.item_price}
                                />
                              </Form.Group>
                            </Col>
                            <Col xs={12} sm={1} className="text-end text-sm-center">
                              {values.items.length > 1 && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  className="border-0 w-100 w-sm-auto mt-2 mt-sm-0" 
                                  onClick={() => remove(index)}
                                >
                                  <CsLineIcons icon="bin" size="16" />
                                  <span className="d-inline d-sm-none ms-1">Remove Item</span>
                                </Button>
                              )}
                            </Col>
                          </Row>
                        ))}
                        <Button variant="outline-primary" size="sm" className="mt-2 rounded-pill" onClick={() => push({ item_name: '', item_quantity: '', unit: '', item_price: '' })}>
                          + Add Item
                        </Button>
                      </div>
                    )}
                  </FieldArray>

                  <div className="add-inventory-summary-hub mt-4">
                    <Row className="g-4">
                      <Col md={4}>
                        <div className="add-inventory-input-group-label">Sub Total</div>
                        <div className="h4 fw-bold text-muted">₹ {subTotal.toFixed(2)}</div>
                      </Col>
                      <Col md={4}>
                        <div className="add-inventory-input-group-label">Tax Amount</div>
                        <Form.Control type="number" className="add-inventory-modern-input" name="tax" value={values.tax} onChange={handleChange} />
                      </Col>
                      <Col md={4}>
                        <div className="add-inventory-input-group-label">Discount</div>
                        <Form.Control type="number" className="add-inventory-modern-input" name="discount" value={values.discount} onChange={handleChange} />
                      </Col>

                      <Col xs={12} md={12}>
                        <div className="add-inventory-total-display shadow-sm flex-column flex-md-row align-items-stretch align-items-md-center gap-3">
                          <div>
                            <div className="add-inventory-input-group-label mb-1">Updated Payable</div>
                            <div className="add-inventory-total-val">₹ {totalAmount.toFixed(2)}</div>
                          </div>
                          <div className="text-start text-md-end" style={{ minWidth: '200px' }}>
                            <div className="add-inventory-input-group-label">Revised Paid Amount</div>
                            <Form.Control
                              type="number"
                              className="add-inventory-modern-input text-md-center fw-bold text-primary"
                              style={{ fontSize: '1.25rem' }}
                              name="paid_amount"
                              value={values.paid_amount}
                              onChange={handleChange}
                              isInvalid={touched.paid_amount && errors.paid_amount}
                              placeholder="0.00"
                            />
                            {touched.paid_amount && errors.paid_amount && <div className="text-danger small mt-1">{errors.paid_amount}</div>}
                          </div>
                        </div>
                      </Col>

                      <Col xs={12} md={12} className="text-end pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2 w-100 justify-content-center justify-content-md-start">
                          <div className="sw-2 sh-2 rounded-circle bg-warning flex-shrink-0" />
                          <span className="fw-bold text-muted">Pending Balance: ₹ {unpaidAmount.toFixed(2)}</span>
                        </div>
                        <div className="d-flex flex-column flex-sm-row align-items-center gap-2 w-100 justify-content-center justify-content-md-end">
                          <Button 
                            type="submit" 
                            variant="primary" 
                            className="manage-menu-custom-btn-outline border-primary text-primary shadow-sm px-5 py-3 fw-bold d-flex align-items-center justify-content-center w-100 w-sm-auto order-1 order-sm-2" 
                            style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4' }}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="save" className="me-2" />} Update & Finalize Changes
                          </Button>
                          <Button 
                            variant="light" 
                            className="px-4 py-3 fw-bold rounded-pill shadow-sm w-100 w-sm-auto order-2 order-sm-1" 
                            onClick={() => setShowAddModal(false)} 
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Modal.Body>
              </Form>
            );
          }}
        </Formik>
      </Modal>

      {/* Log Usage (Use Stock) Modal */}
      <Modal show={showUseModal} onHide={() => setShowUseModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">Log Usage (Stock Out)</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            item_name: '',
            quantity_used: '',
            comment: '',
          }}
          validationSchema={useValidationSchema}
          onSubmit={async (values) => {
            setIsSubmitting(true);
            try {
              await axios.post(`${process.env.REACT_APP_API}/inventory/use`, values, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              });

              toast.success('Stock usage logged successfully!');
              setShowUseModal(false);
              fetchStock();
              fetchInventory();
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.message || 'Failed to log stock usage. Check available quantity.');
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleSubmit }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body className="px-4 py-3">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Select Item *</Form.Label>
                  <Form.Select 
                    name="item_name" 
                    value={values.item_name} 
                    onChange={handleChange}
                    isInvalid={touched.item_name && errors.item_name}
                  >
                    <option value="">-- Select Item in Stock --</option>
                    {stock.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item._id} (Available: {item.totalStock} {item.unit})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.item_name}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Quantity to Use *</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="quantity_used" 
                    placeholder="e.g. 5" 
                    value={values.quantity_used} 
                    onChange={handleChange}
                    isInvalid={touched.quantity_used && errors.quantity_used}
                  />
                  <Form.Control.Feedback type="invalid">{errors.quantity_used}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Notes / Comment</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={3}
                    name="comment" 
                    placeholder="e.g. Used for evening shift curry preparation" 
                    value={values.comment} 
                    onChange={handleChange}
                    isInvalid={touched.comment && errors.comment}
                  />
                  <Form.Control.Feedback type="invalid">{errors.comment}</Form.Control.Feedback>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="light" className="rounded-pill px-4" onClick={() => setShowUseModal(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="rounded-pill px-4 shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Log Usage'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => !deleting && setShowDeleteModal(false)} centered backdrop="static" contentClassName="inventory-delete-modal-content">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="d-flex align-items-center mb-3">
            <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
              <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
            </div>
            <div>
              <p className="mb-1 fw-bold text-dark">Permanently delete this record?</p>
              <p className="mb-0 text-muted small">This log will be cleared from your history and any stock added by this purchase will be reversed.</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDeleteModal(false)} 
            disabled={deleting}
            className="rounded-pill px-4 fw-bold border-2"
          >
            Cancel
          </Button>
          <Button 
            variant="outline-danger" 
            onClick={handleDelete} 
            disabled={deleting}
            className="rounded-pill px-4 fw-bold border-2"
          >
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <div className="d-flex align-items-center">
                <CsLineIcons icon="bin" size="14" className="me-2" />
                Delete
              </div>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Inventory;

import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Row, Modal, Spinner, Alert, Card, Collapse, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import TablePagination from './components/TablePagination';

const customStyles = `
    .border-dashed, .alert-light.border-dashed {
      border: 1.5px dashed #cbd5e1 !important;
      background-color: #fafafa !important;
      background: #fafafa !important;
      color: #64748b !important;
      font-weight: 600 !important;
      border-radius: 1rem !important;
    }
    .inventory-history-interactive-card {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03) !important;
      overflow: hidden;
      margin-bottom: 3rem;
    }
    .inventory-history-custom-btn-outline {
      background: #ffffff !important;
      border: 1.5px solid #23b3f4 !important;
      color: #23b3f4 !important;
      border-radius: 50px !important;
      padding: 0.5rem 1.25rem !important;
      font-weight: 700 !important;
      font-size: 0.85rem !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .inventory-history-custom-btn-outline.small {
      padding: 0.35rem 1rem !important;
      font-size: 0.75rem !important;
    }
    .inventory-history-custom-btn-outline:hover {
      background: #23b3f4 !important;
      color: #ffffff !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(35, 179, 244, 0.2) !important;
    }
    .inventory-history-section-title-wrapper {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .inventory-history-table-header-row {
      display: flex;
      padding: 0 1.5rem;
      margin-bottom: 1rem;
      background: #f8fafc;
      border-radius: 10px;
      padding: 1rem 1.5rem;
    }
    .inventory-history-table-header-col {
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .inventory-history-inventory-row-card {
      background: #ffffff !important;
      border-radius: 1rem !important;
      border: 1px solid #f1f5f9 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
      margin-bottom: 1rem;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      padding: 1.25rem 1.5rem !important;
    }
    .inventory-history-inventory-row-card:hover {
      transform: translateX(5px);
      border-color: #23b3f4 !important;
      box-shadow: 0 8px 20px rgba(35, 179, 244, 0.08) !important;
    }
    .inventory-history-col-val {
      font-weight: 600;
      color: #334155;
      font-size: 0.875rem;
    }
    .inventory-history-status-badge {
      font-size: 0.65rem !important;
      font-weight: 800 !important;
      text-transform: uppercase;
      padding: 0.45rem 1rem !important;
      border-radius: 50px !important;
    }
    .inventory-history-search-filter-hub {
      background: #ffffff;
      border-radius: 1rem;
      padding: 1rem;
      margin-bottom: 2rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    }
    .inventory-history-search-input-container {
      border-radius: 50px !important;
      border: 1.5px solid #e2e8f0 !important;
      background: #ffffff !important;
      height: 40px !important;
      overflow: hidden;
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
      width: 100%;
    }
    .inventory-history-search-input-container:focus-within {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    }
    .inventory-history-filter-pill-btn {
      width: 100%;
      display: flex;
      align-items: center;
      padding: 0.45rem 1.1rem;
      border-radius: 50px;
      border: 1.5px solid #23b3f4;
      background: #ffffff;
      color: #23b3f4;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.25s ease;
      outline: none;
    }
    .inventory-history-filter-pill-btn:hover,
    .inventory-history-filter-pill-btn.active {
      background: #23b3f4;
      color: #ffffff;
    }
    .inventory-history-filter-pill-btn.active {
      background: #23b3f4;
      color: #ffffff;
    }
    .inventory-history-pagesize-pill {
      display: flex;
      align-items: center;
      border-radius: 50px;
      border: 1.5px solid #e2e8f0;
      background: #ffffff;
      padding: 0.2rem 0.5rem;
      width: fit-content;
    }
    .inventory-history-filter-panel {
      background: #ffffff;
      border-radius: 1rem;
      padding: 1.5rem;
      border: 1px solid #f1f5f9;
      margin-top: 1rem;
    }
    .manage-menu-custom-btn-outline {
      border: 1.5px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #fff !important;
      transition: all 0.2s ease-in-out !important;
      font-weight: 700 !important;
      border-radius: 50px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center;
    }
    .manage-menu-custom-btn-outline:hover {
      background-color: #23b3f4 !important;
      color: #fff !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .manage-menu-custom-btn-outline svg {
      color: #23b3f4 !important;
      transition: all 0.2s ease-in-out !important;
    }
    .manage-menu-custom-btn-outline:hover svg {
      color: #fff !important;
    }
    @media (max-width: 991px) {
      .inventory-history-table-header-row { display: none !important; }
      .inventory-history-inventory-row-card { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .inventory-history-inventory-row-card > div { width: 100% !important; margin-bottom: 0.25rem; }
      .inventory-history-inventory-row-card .inventory-history-mobile-label { display: block !important; font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 0.15rem; }
    }
    @media (min-width: 992px) {
      .inventory-history-inventory-row-card .inventory-history-mobile-label { display: none !important; }
    }
`;

// Shared Sub-Components
const TableControls = ({ onSearch, showFilters, setShowFilters, activeFilterCount, pageIndex, pageSize, totalRecords, onPageSizeChange, isLoading }) => (
  <div className="inventory-history-search-filter-hub border-0 shadow-sm">

    {/* ── DESKTOP layout (md+): search + filter icon | showing text + page size ── */}
    <div className="d-none d-md-flex align-items-center gap-3">
      {/* Search bar */}
      <div className="inventory-history-search-input-container flex-grow-1">
        <ControlsSearch onSearch={onSearch} />
      </div>
      {/* Filter circle icon button */}
      <Button
        variant={showFilters ? 'primary' : 'outline-primary'}
        className="btn-icon btn-icon-only position-relative rounded-circle border-2 flex-shrink-0"
        style={{ width: '40px', height: '40px' }}
        onClick={() => setShowFilters(!showFilters)}
      >
        <CsLineIcons icon={showFilters ? 'close' : 'filter'} size="16" />
        {activeFilterCount > 0 && (
          <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle rounded-circle border border-2 border-white" style={{ fontSize: '0.6rem', padding: '0.3em 0.5em' }}>
            {activeFilterCount}
          </Badge>
        )}
      </Button>
      {/* Spacer */}
      <div className="flex-grow-1" />
      {/* Record count */}
      <span className="smaller text-muted fw-bold flex-shrink-0">
        {isLoading ? 'Processing...' : `Showing ${totalRecords > 0 ? pageIndex * pageSize + 1 : 0}–${Math.min((pageIndex + 1) * pageSize, totalRecords)} of ${totalRecords}`}
      </span>
      {/* Page size */}
      <div className="flex-shrink-0">
        <ControlsPageSize pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      </div>
    </div>

    {/* ── MOBILE layout (<md): search stacked, filter icon + page size inline below ── */}
    <div className="d-flex d-md-none flex-column gap-2">
      {/* Search bar */}
      <div className="inventory-history-search-input-container">
        <ControlsSearch onSearch={onSearch} />
      </div>
      {/* Filter icon & Page size side-by-side */}
      <div className="d-flex align-items-center gap-2">
        <Button
          variant={showFilters ? 'primary' : 'outline-primary'}
          className="btn-icon btn-icon-only position-relative rounded-circle border-2 flex-shrink-0"
          style={{ width: '40px', height: '40px' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <CsLineIcons icon={showFilters ? 'close' : 'filter'} size="16" />
          {activeFilterCount > 0 && (
            <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle rounded-circle border border-2 border-white" style={{ fontSize: '0.6rem', padding: '0.3em 0.5em' }}>
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        <div className="flex-shrink-0">
          <ControlsPageSize pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
        </div>
        {!isLoading && totalRecords > 0 && (
          <span className="ms-2 small text-muted fw-bold">of {totalRecords}</span>
        )}
      </div>
    </div>

  </div>
);

const RowCardList = ({ data, columns, actions }) => (
  <div className="inventory-list-wrapper">
    <div className="inventory-history-table-header-row">
      {columns.map((col, idx) => (
        <div key={idx} className="inventory-history-table-header-col" style={{ width: col.width || 'auto', flex: col.flex || 1 }}>
          {col.Header}
        </div>
      ))}
      <div className="inventory-history-table-header-col text-end" style={{ width: '120px' }}>
        Action
      </div>
    </div>
    {data.map((item, idx) => (
      <div key={idx} className="inventory-history-inventory-row-card shadow-sm">
        {columns.map((col, cidx) => (
          <div key={cidx} style={{ width: col.width || 'auto', flex: col.flex || 1 }}>
            <span className="inventory-history-mobile-label">{col.Header}</span>
            <div className="inventory-history-col-val">
              {col.Cell ? col.Cell({ value: item[col.accessor], row: { original: item }, cell: { value: item[col.accessor] } }) : item[col.accessor]}
            </div>
          </div>
        ))}
        <div className="text-md-end" style={{ width: '120px' }}>
          <span className="inventory-history-mobile-label">Action</span>
          <div className="d-flex gap-2 justify-content-md-end">{actions(item)}</div>
        </div>
      </div>
    ))}
  </div>
);

// --- Requested Section ---
const RequestedInventory = ({ brandColor, onDeleteClick, refreshKey }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ requestFromDate: '', requestToDate: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        search: searchTerm,
        request_from: filters.requestFromDate,
        request_to: filters.requestToDate,
      };
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Requested`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.success) {
        setData(
          res.data.data.map((item) => ({
            ...item,
            formatted_date: new Date(item.request_date).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
        );
        setTotalRecords(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 0);
      }
    } catch (err) {
      toast.error('Error fetching requested inventory');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchTerm, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const columns = [
    { Header: 'Requested Date', accessor: 'formatted_date', flex: 1.5 },
    {
      Header: 'Items',
      accessor: 'items',
      flex: 2,
      Cell: ({ cell }) => (
        <>
          {cell.value.map((it, i) => (
            <div key={i} className="small fw-bold text-muted">
              {it.item_name} <span className="text-primary">({it.item_quantity} {it.unit})</span>
            </div>
          ))}
        </>
      ),
    },
    {
      Header: 'Status',
      accessor: 'status',
      flex: 1,
      Cell: ({ cell }) => (
        <Badge bg="warning" text="dark" className="inventory-history-status-badge">
          {cell.value}
        </Badge>
      ),
    },
  ];

  return (
    <Card className="inventory-history-interactive-card border-0">
      <Card.Body className="p-4 p-lg-5">
        <div className="inventory-history-section-title-wrapper mb-4">
          <div className="sw-6 sh-6 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{ background: 'rgba(35, 179, 244, 0.12)', borderRadius: '1rem', width: '48px', height: '48px' }}>
            <CsLineIcons icon="boxes" size="24" style={{ color: brandColor }} />
          </div>
          <div>
            <h2 className="h4 mb-0 fw-bold">Requested Inventory</h2>
            <p className="text-muted small mb-0">Pending arrivals from vendors</p>
          </div>
        </div>
        <TableControls
          onSearch={(v) => { setSearchTerm(v); setPageIndex(0); }}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFilterCount={Object.values(filters).filter((x) => x !== '').length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRecords={totalRecords}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
          isLoading={loading}
        />
        <Collapse in={showFilters}>
          <div>
            <div className="inventory-history-filter-panel mb-4 shadow-sm">
              <Row className="g-3">
                <Col md="4">
                  <span className="text-uppercase small fw-bold text-muted d-block mb-1">From Date</span>
                  <Form.Control
                    type="date"
                    value={filters.requestFromDate}
                    onChange={(e) => setFilters({ ...filters, requestFromDate: e.target.value })}
                  />
                </Col>
                <Col md="4">
                  <span className="text-uppercase small fw-bold text-muted d-block mb-1">To Date</span>
                  <Form.Control
                    type="date"
                    value={filters.requestToDate}
                    onChange={(e) => setFilters({ ...filters, requestToDate: e.target.value })}
                  />
                </Col>
                <Col md="4" className="d-flex align-items-end">
                  <Button variant="light" size="sm" className="rounded-pill px-4 fw-bold" onClick={() => setFilters({ requestFromDate: '', requestToDate: '' })}>
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </Collapse>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : data.length === 0 ? (
          <Alert variant="light" className="text-center py-5 border-dashed rounded-4">No active requests.</Alert>
        ) : (
          <>
            <RowCardList
              data={data}
              columns={columns}
              actions={(d) => (
                <>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="btn-icon btn-icon-only rounded-circle border-2"
                    as={Link}
                    to={`/operations/edit-inventory/${d._id}`}
                  >
                    <CsLineIcons icon="edit-square" size="14" />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="btn-icon btn-icon-only rounded-circle border-2"
                    onClick={() => onDeleteClick(d)}
                  >
                    <CsLineIcons icon="bin" size="14" />
                  </Button>
                </>
              )}
            />
            <div className="mt-4">
              <TablePagination
                paginationProps={{
                  canPreviousPage: pageIndex > 0,
                  canNextPage: pageIndex < totalPages - 1,
                  pageCount: totalPages,
                  pageIndex,
                  gotoPage: setPageIndex,
                  nextPage: () => setPageIndex((p) => p + 1),
                  previousPage: () => setPageIndex((p) => p - 1),
                }}
              />
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

// --- Completed Section ---
const CompletedInventory = ({ history, refreshKey }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ requestFromDate: '', requestToDate: '', billFromDate: '', billToDate: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        search: searchTerm,
        request_from: filters.requestFromDate,
        request_to: filters.requestToDate,
        bill_from: filters.billFromDate,
        bill_to: filters.billToDate,
      };
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Completed`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.success) {
        setData(
          res.data.data.map((item) => ({
            ...item,
            formatted_request_date: new Date(item.request_date).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            formatted_bill_date: new Date(item.bill_date).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          }))
        );
        setTotalRecords(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 0);
      }
    } catch (err) {
      toast.error('Error fetching completed inventory');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchTerm, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const columns = [
    { Header: 'Requested Date', accessor: 'formatted_request_date', flex: 1.5 },
    { Header: 'Bill Date', accessor: 'formatted_bill_date', flex: 1.2 },
    { Header: 'Bill Number', accessor: 'bill_number', flex: 1 },
    { Header: 'Vendor Name', accessor: 'vendor_name', flex: 1.5 },
    {
      Header: 'Total Amount',
      accessor: 'total_amount',
      Cell: ({ value }) => <span className="fw-bold text-primary">₹{value}</span>,
      flex: 1,
    },
    {
      Header: 'Unpaid Amount',
      accessor: 'unpaid_amount',
      Cell: ({ value }) => <span className={value > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>₹{value}</span>,
      flex: 1,
    },
  ];

  return (
    <Card className="inventory-history-interactive-card border-0">
      <Card.Body className="p-4 p-lg-5">
        <div className="inventory-history-section-title-wrapper mb-4">
          <div className="sw-6 sh-6 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', borderRadius: '1rem', width: '48px', height: '48px' }}>
            <CsLineIcons icon="check-circle" size="24" style={{ color: '#10b981' }} />
          </div>
          <div>
            <h2 className="h4 mb-0 fw-bold">Completed Requests</h2>
            <p className="text-muted small mb-0">History of fulfilled orders</p>
          </div>
        </div>
        <TableControls
          onSearch={(v) => { setSearchTerm(v); setPageIndex(0); }}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFilterCount={Object.values(filters).filter((x) => x !== '').length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRecords={totalRecords}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
          isLoading={loading}
        />
        <Collapse in={showFilters}>
          <div>
            <div className="inventory-history-filter-panel mb-4 shadow-sm">
              <Row className="g-3">
                <Col md="3">
                  <span className="text-uppercase small fw-bold text-muted d-block mb-1">Req From</span>
                  <Form.Control
                    type="date"
                    value={filters.requestFromDate}
                    onChange={(e) => setFilters({ ...filters, requestFromDate: e.target.value })}
                  />
                </Col>
                <Col md="3">
                  <span className="text-uppercase small fw-bold text-muted d-block mb-1">Req To</span>
                  <Form.Control
                    type="date"
                    value={filters.requestToDate}
                    onChange={(e) => setFilters({ ...filters, requestToDate: e.target.value })}
                  />
                </Col>
                <Col md="3">
                  <span className="text-uppercase small fw-bold text-muted d-block mb-1">Bill From</span>
                  <Form.Control
                    type="date"
                    value={filters.billFromDate}
                    onChange={(e) => setFilters({ ...filters, billFromDate: e.target.value })}
                  />
                </Col>
                <Col md="3">
                  <span className="text-uppercase small fw-bold text-muted d-block mb-1">Bill To</span>
                  <Form.Control
                    type="date"
                    value={filters.billToDate}
                    onChange={(e) => setFilters({ ...filters, billToDate: e.target.value })}
                  />
                </Col>
                <Col md="12" className="text-end mt-3">
                  <Button variant="light" size="sm" className="rounded-pill px-4 fw-bold" onClick={() => setFilters({ requestFromDate: '', requestToDate: '', billFromDate: '', billToDate: '' })}>
                    Clear All
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </Collapse>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : data.length === 0 ? (
          <Alert variant="light" className="text-center py-5 border-dashed rounded-4">
            No records found.
          </Alert>
        ) : (
          <>
            <RowCardList
              data={data}
              columns={columns}
              actions={(d) => (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => history.push(`/operations/inventory-details/${d._id}`)}
                  className="btn-icon btn-icon-only rounded-circle border-2"
                >
                  <CsLineIcons icon="eye" size="14" />
                </Button>
              )}
            />
            <div className="mt-4">
              <TablePagination
                paginationProps={{
                  canPreviousPage: pageIndex > 0,
                  canNextPage: pageIndex < totalPages - 1,
                  pageCount: totalPages,
                  pageIndex,
                  gotoPage: setPageIndex,
                  nextPage: () => setPageIndex((p) => p + 1),
                  previousPage: () => setPageIndex((p) => p - 1),
                }}
              />
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

// --- Rejected Section ---
const RejectedInventory = ({ history, onShowRejectReason, refreshKey }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ requestFromDate: '', requestToDate: '' });

  const truncateWords = (text, limit = 8) => {
    if (!text) return '';
    const words = text.split(' ');
    return words.length > limit ? words.slice(0, limit).join(' ') : text;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        search: searchTerm,
        request_from: filters.requestFromDate,
        request_to: filters.requestToDate,
      };
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Rejected`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.success) {
        setData(
          res.data.data.map((item) => ({
            ...item,
            formatted_request_date: new Date(item.request_date).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          }))
        );
        setTotalRecords(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 0);
      }
    } catch (err) {
      toast.error('Error fetching rejected inventory');
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchTerm, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const columns = [
    { Header: 'Requested Date', accessor: 'formatted_request_date', flex: 1.5 },
    {
      Header: 'Items',
      accessor: 'items',
      Cell: ({ cell }) => (
        <div>
          {cell.value.slice(0, 2).map((item, i) => (
            <div key={i} className="text-truncate" style={{ maxWidth: '200px' }}>
              {item.item_name} - {item.item_quantity} {item.unit}
            </div>
          ))}
          {cell.value.length > 2 && <small className="text-muted">+{cell.value.length - 2} more items</small>}
        </div>
      ),
      flex: 2,
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ cell }) => (
        <Badge bg="danger" className="inventory-history-status-badge">
          {cell.value}
        </Badge>
      ),
      flex: 1,
    },
    {
      Header: 'Reject Reason',
      accessor: 'reject_reason',
      Cell: ({ cell }) => {
        const text = cell.value || '';
        const isLong = text.split(' ').length > 8;

        return (
          <div>
            <span>{truncateWords(text, 8)}</span>
            {isLong && (
              <>
                {'... '}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 font-weight-bold text-decoration-none"
                  onClick={() => onShowRejectReason(text)}
                >
                  More
                </Button>
              </>
            )}
          </div>
        );
      },
      flex: 2.5,
    },
  ];

  return (
    <Card className="inventory-history-interactive-card border-0">
      <Card.Body className="p-4 p-lg-5">
        <div className="inventory-history-section-title-wrapper mb-4">
          <div className="sw-6 sh-6 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{ background: 'rgba(239, 68, 68, 0.12)', borderRadius: '1rem', width: '48px', height: '48px' }}>
            <CsLineIcons icon="close-circle" size="24" style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h2 className="h4 mb-0 fw-bold">Rejected Requests</h2>
            <p className="text-muted small mb-0">Cancelled or invalid entries</p>
          </div>
        </div>
        <TableControls
          onSearch={(v) => { setSearchTerm(v); setPageIndex(0); }}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFilterCount={Object.values(filters).filter((x) => x !== '').length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRecords={totalRecords}
          onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
          isLoading={loading}
        />
        <Collapse in={showFilters}>
          <div>
            <div className="inventory-history-filter-panel mb-4 shadow-sm">
              <Row className="g-3">
                <Col md="4">
                  <span className="text-uppercase small fw-bold text-muted d-block mb-1">From Date</span>
                  <Form.Control
                    type="date"
                    value={filters.requestFromDate}
                    onChange={(e) => setFilters({ ...filters, requestFromDate: e.target.value })}
                  />
                </Col>
                <Col md="4">
                  <span className="text-uppercase small fw-bold text-muted d-block mb-1">To Date</span>
                  <Form.Control
                    type="date"
                    value={filters.requestToDate}
                    onChange={(e) => setFilters({ ...filters, requestToDate: e.target.value })}
                  />
                </Col>
                <Col md="4" className="d-flex align-items-end">
                  <Button variant="light" size="sm" className="rounded-pill px-4 fw-bold" onClick={() => setFilters({ requestFromDate: '', requestToDate: '' })}>
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </Collapse>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
          </div>
        ) : data.length === 0 ? (
          <Alert variant="light" className="text-center py-5 border-dashed rounded-4">
            No records found.
          </Alert>
        ) : (
          <>
            <RowCardList
              data={data}
              columns={columns}
              actions={(d) => (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => history.push(`/operations/inventory-details/${d._id}`)}
                  className="btn-icon btn-icon-only rounded-circle border-2"
                >
                  <CsLineIcons icon="eye" size="14" />
                </Button>
              )}
            />
            <div className="mt-4">
              <TablePagination
                paginationProps={{
                  canPreviousPage: pageIndex > 0,
                  canNextPage: pageIndex < totalPages - 1,
                  pageCount: totalPages,
                  pageIndex,
                  gotoPage: setPageIndex,
                  nextPage: () => setPageIndex((p) => p + 1),
                  previousPage: () => setPageIndex((p) => p - 1),
                }}
              />
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

// --- Main Component ---
const InventoryHistory = () => {
  const history = useHistory();
  const title = 'Manage Inventory';
  const brandColor = '#23b3f4';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/inventory-history', text: 'Operations' },
    { to: 'operations/inventory-history', title: 'Manage Inventory' },
  ];

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectInventoryModal, setRejectInventoryModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${selectedItem._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Inventory request deleted successfully!');
      setShowDeleteModal(false);
      setSelectedItem(null);
      triggerRefresh();
    } catch (err) {
      console.error('Error deleting inventory:', err);
      toast.error(err.response?.data?.message || 'Failed to delete inventory.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="inventory-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description="Manage inventory and pending requests." />
        <div className="container-fluid px-lg-5">
          <div className="page-title-container mb-4 pt-4">
            <Row className="g-3 align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>
                  {title}
                </h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="d-flex flex-column flex-md-row gap-2 mt-3 mt-md-0 justify-content-md-end">
                <Button as={Link} to="/operations/stock-management" className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2 w-100 w-md-auto">
                  <CsLineIcons icon="activity" size="18" className="me-2" /> Manage Stock
                </Button>
                <Button as={Link} to="/operations/add-inventory" className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2 w-100 w-md-auto">
                  <CsLineIcons icon="plus" size="18" className="me-2" /> Add Inventory
                </Button>
              </Col>
            </Row>
          </div>

          <RequestedInventory brandColor={brandColor} onDeleteClick={(item) => { setSelectedItem(item); setShowDeleteModal(true); }} refreshKey={refreshKey} />
          <CompletedInventory refreshKey={refreshKey} history={history} />
          <RejectedInventory refreshKey={refreshKey} history={history} onShowRejectReason={(reason) => { setSelectedRejectReason(reason); setShowRejectReasonModal(true); }} />

          <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
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
                  <p className="mb-0 fw-bold text-dark">Permanently delete this record?</p>
                  <p className="mb-1 text-muted small">This clears the inventory log from your historical logs.</p>
                  <p className="mb-0 text-success small fw-semibold">Don't worry, your physical stock quantities remain perfectly safe.</p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <Button 
                variant="light" 
                onClick={() => setShowDeleteModal(false)} 
                disabled={isDeleting}
                className="rounded-pill px-4 fw-bold inventory-history-custom-btn-outline border-0 text-muted"
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="rounded-pill px-4 fw-bold shadow-sm inventory-history-custom-btn-outline border-danger text-danger"
              >
                {isDeleting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Deleting...
                  </>
                ) : (
                  <div className="d-flex align-items-center">
                    <CsLineIcons icon="bin" size="16" className="me-2" stroke="currentColor" />
                    Delete
                  </div>
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showRejectReasonModal} onHide={() => setShowRejectReasonModal(false)} centered contentClassName="border-0 shadow-lg" style={{ backdropFilter: 'blur(5px)' }}>
            <div className="bg-white p-4 rounded-3">
              <Modal.Header closeButton className="border-0 p-0 mb-3">
                <Modal.Title className="fw-bold text-danger">Reject Reason</Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-0">
                <p className="fw-bold text-muted mb-0">{selectedRejectReason}</p>
              </Modal.Body>
              <Modal.Footer className="border-0 p-0 d-flex gap-2 justify-content-end mt-4">
                <Button variant="light" className="inventory-history-custom-btn-outline border-0 text-muted" onClick={() => setShowRejectReasonModal(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default InventoryHistory;

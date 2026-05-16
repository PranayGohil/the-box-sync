import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Row, Modal, Spinner, Alert, Card, Collapse, Form } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { AuthContext } from 'contexts/AuthContext';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import TablePagination from './components/TablePagination';



// Shared Sub-Components
const TableControls = ({ onSearch, showFilters, setShowFilters, activeFilterCount, pageIndex, pageSize, totalRecords, onPageSizeChange, isLoading }) => (
  <div className="inventory-history-search-filter-hub border-0 shadow-sm">
    <Row className="g-2 g-md-3 align-items-center">
      <Col xs md="6" lg="6">
        <div className="inventory-history-search-input-container">
          <ControlsSearch onSearch={onSearch} />
        </div>
      </Col>
      <Col xs="auto">
        <Button 
          variant={showFilters ? 'primary' : 'outline-primary'} 
          className="btn-icon btn-icon-only position-relative rounded-circle border-2" 
          style={{ width: '40px', height: '40px' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <CsLineIcons icon={showFilters ? 'close' : 'filter'} size="16" />
          {activeFilterCount > 0 && (
            <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle rounded-circle border border-2 border-white" style={{fontSize: '0.6rem', padding: '0.3em 0.5em'}}>
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </Col>
      <Col md className="text-md-end d-flex align-items-center justify-content-md-end gap-2 gap-md-3 mt-2 mt-md-0">
        <div className="d-none d-lg-block smaller text-muted fw-bold">
          {isLoading ? 'Processing...' : `Showing ${totalRecords > 0 ? pageIndex * pageSize + 1 : 0}-${Math.min((pageIndex + 1) * pageSize, totalRecords)} of ${totalRecords}`}
        </div>
        <div className="d-inline-block">
          <ControlsPageSize pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
        </div>
      </Col>
    </Row>
  </div>
);

const RowCardList = ({ data, columns, actions }) => (
  <div className="inventory-list-wrapper">
    <div className="inventory-history-table-header-row">
      {columns.map((col, idx) => <div key={idx} className="inventory-history-table-header-col" style={{ width: col.width || 'auto', flex: col.flex || 1 }}>{col.Header}</div>)}
      <div className="inventory-history-table-header-col text-end" style={{ width: '120px' }}>Action</div>
    </div>
    {data.map((item, idx) => (
      <div key={idx} className="inventory-history-inventory-row-card shadow-sm">
        {columns.map((col, cidx) => (
          <div key={cidx} style={{ width: col.width || 'auto', flex: col.flex || 1 }}>
            <span className="inventory-history-mobile-label">{col.Header}</span>
            <div className="inventory-history-col-val">{col.Cell ? col.Cell({ value: item[col.accessor], row: { original: item }, cell: { value: item[col.accessor] } }) : item[col.accessor]}</div>
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
const RequestedInventory = ({ brandColor, onRejectClick, refreshKey }) => {
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
      const params = { page: pageIndex + 1, limit: pageSize, search: searchTerm, request_from: filters.requestFromDate, request_to: filters.requestToDate };
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Requested`, { params, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data.success) {
        setData(res.data.data.map(item => ({ ...item, formatted_date: new Date(item.request_date).toLocaleString('en-IN') })));
        setTotalRecords(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 0);
      }
    } catch (err) { toast.error('Error fetching requests'); } finally { setLoading(false); }
  }, [pageIndex, pageSize, searchTerm, filters]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const columns = [
    { Header: 'Requested Date', accessor: 'formatted_date', flex: 1.5 },
    { Header: 'Items', accessor: 'items', flex: 2, Cell: ({ cell }) => cell.value.map((it, i) => <div key={i} className="small fw-bold text-muted">{it.item_name} <span className="text-primary">({it.item_quantity} {it.unit})</span></div>) },
    { Header: 'Status', accessor: 'status', flex: 1, Cell: ({ cell }) => <Badge bg="warning" text="dark" className="inventory-history-status-badge">{cell.value}</Badge> },
  ];

  return (
    <Card className="inventory-history-interactive-card border-0">
      <Card.Body className="p-4 p-lg-5">
        <div className="inventory-history-section-title-wrapper mb-4">
          <div className="sw-6 sh-6 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{background: 'rgba(35, 179, 244, 0.12)', borderRadius: '1rem'}}>
            <CsLineIcons icon="boxes" size="24" style={{color: brandColor}} />
          </div>
          <div>
            <h2 className="h4 mb-0 fw-bold">Requested Inventory</h2>
            <p className="text-muted small mb-0">Pending arrivals from vendors</p>
          </div>
        </div>
        <TableControls onSearch={(v) => { setSearchTerm(v); setPageIndex(0); }} showFilters={showFilters} setShowFilters={setShowFilters} activeFilterCount={Object.values(filters).filter(x => x !== '').length} pageIndex={pageIndex} pageSize={pageSize} totalRecords={totalRecords} onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }} isLoading={loading} />
        <Collapse in={showFilters}><div><div className="inventory-history-filter-panel mb-4 shadow-sm"><Row className="g-3"><Col md="4"><span className="text-uppercase small fw-bold text-muted d-block mb-1">From Date</span><Form.Control type="date" value={filters.requestFromDate} onChange={(e) => setFilters({ ...filters, requestFromDate: e.target.value })} /></Col><Col md="4"><span className="text-uppercase small fw-bold text-muted d-block mb-1">To Date</span><Form.Control type="date" value={filters.requestToDate} onChange={(e) => setFilters({ ...filters, requestToDate: e.target.value })} /></Col><Col md="4" className="d-flex align-items-end"><Button variant="light" size="sm" className="rounded-pill px-4 fw-bold" onClick={() => setFilters({ requestFromDate: '', requestToDate: '' })}>Clear Filters</Button></Col></Row></div></div></Collapse>
        {loading ? <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> : data.length === 0 ? <Alert variant="light" className="text-center py-5 border-dashed rounded-4">No active requests.</Alert> : (
          <>
            <RowCardList data={data} columns={columns} actions={(d) => <><Button variant="outline-success" size="sm" className="btn-icon btn-icon-only rounded-circle border-2" as={Link} to={`/operations/complete-inventory/${d._id}`}><CsLineIcons icon="check" size="14" /></Button><Button variant="outline-danger" size="sm" className="btn-icon btn-icon-only rounded-circle border-2" onClick={() => onRejectClick(d)}><CsLineIcons icon="close" size="14" /></Button></>} />
            <div className="mt-4"><TablePagination paginationProps={{ canPreviousPage: pageIndex > 0, canNextPage: pageIndex < totalPages - 1, pageCount: totalPages, pageIndex, gotoPage: setPageIndex, nextPage: () => setPageIndex(p => p + 1), previousPage: () => setPageIndex(p => p - 1) }} /></div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

// --- Completed Section ---
const CompletedInventory = ({ history, onDeleteClick, refreshKey }) => {
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
      const params = { page: pageIndex + 1, limit: pageSize, search: searchTerm, request_from: filters.requestFromDate, request_to: filters.requestToDate, bill_from: filters.billFromDate, bill_to: filters.billToDate };
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Completed`, { params, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data.success) {
        setData(res.data.data.map(item => ({ ...item, formatted_request_date: new Date(item.request_date).toLocaleString('en-IN') })));
        setTotalRecords(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 0);
      }
    } catch (err) { toast.error('Error fetching records'); } finally { setLoading(false); }
  }, [pageIndex, pageSize, searchTerm, filters]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const columns = [
    { Header: 'Requested Date', accessor: 'formatted_request_date', flex: 1.5 },
    { Header: 'Bill Number', accessor: 'bill_number', flex: 1 },
    { Header: 'Vendor', accessor: 'vendor_name', flex: 1.5 },
    { Header: 'Amount', accessor: 'total_amount', flex: 1, Cell: ({ cell }) => <span className="fw-bold text-primary">₹{cell.value}</span> },
    { Header: 'Unpaid', accessor: 'unpaid_amount', flex: 1, Cell: ({ cell }) => <span className="fw-bold text-danger">₹{cell.value}</span> },
  ];

  return (
    <Card className="inventory-history-interactive-card border-0">
      <Card.Body className="p-4 p-lg-5">
        <div className="inventory-history-section-title-wrapper mb-4">
          <div className="sw-6 sh-6 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{background: 'rgba(16, 185, 129, 0.12)', borderRadius: '1rem'}}>
            <CsLineIcons icon="check-circle" size="24" style={{color: '#10b981'}} />
          </div>
          <div>
            <h2 className="h4 mb-0 fw-bold">Completed Requests</h2>
            <p className="text-muted small mb-0">History of fulfilled orders</p>
          </div>
        </div>
        <TableControls onSearch={(v) => { setSearchTerm(v); setPageIndex(0); }} showFilters={showFilters} setShowFilters={setShowFilters} activeFilterCount={Object.values(filters).filter(x => x !== '').length} pageIndex={pageIndex} pageSize={pageSize} totalRecords={totalRecords} onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }} isLoading={loading} />
        <Collapse in={showFilters}><div><div className="inventory-history-filter-panel mb-4 shadow-sm"><Row className="g-3"><Col md="3"><span className="text-uppercase small fw-bold text-muted d-block mb-1">Req From</span><Form.Control type="date" value={filters.requestFromDate} onChange={(e) => setFilters({ ...filters, requestFromDate: e.target.value })} /></Col><Col md="3"><span className="text-uppercase small fw-bold text-muted d-block mb-1">Req To</span><Form.Control type="date" value={filters.requestToDate} onChange={(e) => setFilters({ ...filters, requestToDate: e.target.value })} /></Col><Col md="3"><span className="text-uppercase small fw-bold text-muted d-block mb-1">Bill From</span><Form.Control type="date" value={filters.billFromDate} onChange={(e) => setFilters({ ...filters, billFromDate: e.target.value })} /></Col><Col md="3"><span className="text-uppercase small fw-bold text-muted d-block mb-1">Bill To</span><Form.Control type="date" value={filters.billToDate} onChange={(e) => setFilters({ ...filters, billToDate: e.target.value })} /></Col><Col md="12" className="text-end mt-3"><Button variant="light" size="sm" className="rounded-pill px-4 fw-bold" onClick={() => setFilters({ requestFromDate: '', requestToDate: '', billFromDate: '', billToDate: '' })}>Clear All</Button></Col></Row></div></div></Collapse>
        {loading ? <div className="text-center py-5"><Spinner animation="border" variant="success" /></div> : data.length === 0 ? <Alert variant="light" className="text-center py-5 border-dashed rounded-4">No records found.</Alert> : (
          <>
            <RowCardList data={data} columns={columns} actions={(d) => <><Button variant="outline-primary" size="sm" onClick={() => history.push(`/operations/inventory-details/${d._id}`)} className="btn-icon btn-icon-only rounded-circle border-2"><CsLineIcons icon="eye" size="14" /></Button><Button variant="outline-warning" size="sm" onClick={() => history.push(`/operations/edit-inventory/${d._id}`)} className="btn-icon btn-icon-only rounded-circle border-2"><CsLineIcons icon="edit" size="14" /></Button><Button variant="outline-danger" size="sm" onClick={() => onDeleteClick(d)} className="btn-icon btn-icon-only rounded-circle border-2"><CsLineIcons icon="bin" size="14" /></Button></>} />
            <div className="mt-4"><TablePagination paginationProps={{ canPreviousPage: pageIndex > 0, canNextPage: pageIndex < totalPages - 1, pageCount: totalPages, pageIndex, gotoPage: setPageIndex, nextPage: () => setPageIndex(p => p + 1), previousPage: () => setPageIndex(p => p - 1) }} /></div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

// --- Rejected Section ---
const RejectedInventory = ({ history, onDeleteClick, refreshKey }) => {
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
      const params = { page: pageIndex + 1, limit: pageSize, search: searchTerm, request_from: filters.requestFromDate, request_to: filters.requestToDate, bill_from: filters.billFromDate, bill_to: filters.billToDate };
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Rejected`, { params, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data.success) {
        setData(res.data.data.map(item => ({ ...item, formatted_request_date: new Date(item.request_date).toLocaleString('en-IN') })));
        setTotalRecords(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 0);
      }
    } catch (err) { toast.error('Error fetching records'); } finally { setLoading(false); }
  }, [pageIndex, pageSize, searchTerm, filters]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const columns = [
    { Header: 'Requested Date', accessor: 'formatted_request_date', flex: 1.5 },
    { Header: 'Status', accessor: 'status', flex: 1, Cell: ({ cell }) => <Badge bg="danger" className="inventory-history-status-badge">{cell.value}</Badge> },
    { Header: 'Reason', accessor: 'reject_reason', flex: 2, Cell: ({ cell }) => <span className="text-muted italic">"{cell.value}"</span> },
  ];

  return (
    <Card className="inventory-history-interactive-card border-0">
      <Card.Body className="p-4 p-lg-5">
        <div className="inventory-history-section-title-wrapper mb-4">
          <div className="sw-6 sh-6 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{background: 'rgba(244, 63, 94, 0.12)', borderRadius: '1rem'}}>
            <CsLineIcons icon="close" size="24" style={{color: '#f43f5e'}} />
          </div>
          <div>
            <h2 className="h4 mb-0 fw-bold">Rejected Requests</h2>
            <p className="text-muted small mb-0">Cancelled or invalid entries</p>
          </div>
        </div>
        <TableControls onSearch={(v) => { setSearchTerm(v); setPageIndex(0); }} showFilters={showFilters} setShowFilters={setShowFilters} activeFilterCount={Object.values(filters).filter(x => x !== '').length} pageIndex={pageIndex} pageSize={pageSize} totalRecords={totalRecords} onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }} isLoading={loading} />
        <Collapse in={showFilters}><div><div className="inventory-history-filter-panel mb-4 shadow-sm"><Row className="g-3"><Col md="3"><span className="text-uppercase small fw-bold text-muted d-block mb-1">Req From</span><Form.Control type="date" value={filters.requestFromDate} onChange={(e) => setFilters({ ...filters, requestFromDate: e.target.value })} /></Col><Col md="3"><span className="text-uppercase small fw-bold text-muted d-block mb-1">Req To</span><Form.Control type="date" value={filters.requestToDate} onChange={(e) => setFilters({ ...filters, requestToDate: e.target.value })} /></Col><Col md="3"><span className="text-uppercase small fw-bold text-muted d-block mb-1">Bill From</span><Form.Control type="date" value={filters.billFromDate} onChange={(e) => setFilters({ ...filters, billFromDate: e.target.value })} /></Col><Col md="3"><span className="text-uppercase small fw-bold text-muted d-block mb-1">Bill To</span><Form.Control type="date" value={filters.billToDate} onChange={(e) => setFilters({ ...filters, billToDate: e.target.value })} /></Col><Col md="12" className="text-end mt-3"><Button variant="light" size="sm" className="rounded-pill px-4 fw-bold" onClick={() => setFilters({ requestFromDate: '', requestToDate: '', billFromDate: '', billToDate: '' })}>Clear All</Button></Col></Row></div></div></Collapse>
        {loading ? <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div> : data.length === 0 ? <Alert variant="light" className="text-center py-5 border-dashed rounded-4">No records found.</Alert> : (
          <>
            <RowCardList data={data} columns={columns} actions={(d) => <><Button variant="outline-primary" size="sm" onClick={() => history.push(`/operations/inventory-details/${d._id}`)} className="btn-icon btn-icon-only rounded-circle border-2"><CsLineIcons icon="eye" size="14" /></Button><Button variant="outline-danger" size="sm" onClick={() => onDeleteClick(d)} className="btn-icon btn-icon-only rounded-circle border-2"><CsLineIcons icon="bin" size="14" /></Button></>} />
            <div className="mt-4"><TablePagination paginationProps={{ canPreviousPage: pageIndex > 0, canNextPage: pageIndex < totalPages - 1, pageCount: totalPages, pageIndex, gotoPage: setPageIndex, nextPage: () => setPageIndex(p => p + 1), previousPage: () => setPageIndex(p => p - 1) }} /></div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

// --- Main Component ---
const InventoryHistory = () => {
  const history = useHistory();
  const { activePlans } = useContext(AuthContext);
  const title = 'Manage Inventory';
  const brandColor = '#23b3f4';
  const breadcrumbs = [ { to: '', text: 'Home' }, { to: 'operations/inventory-history', text: 'Operations' }, { to: 'operations/inventory-history', title: 'Manage Inventory' } ];

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectInventoryModal, setRejectInventoryModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handleReject = async () => {
    if (!selectedItem?._id) return;
    setRejecting(true);
    try {
      await axios.post(`${process.env.REACT_APP_API}/inventory/reject-request/${selectedItem._id}`, { reject_reason: rejectReason }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setRejectInventoryModal(false); setRejectReason(''); triggerRefresh();
      toast.success('Inventory rejected successfully!');
    } catch (err) { toast.error('Failed to reject'); } finally { setRejecting(false); }
  };

  const handleDelete = async () => {
    if (!selectedItem?._id) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${selectedItem._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setShowDeleteModal(false); triggerRefresh();
      toast.success('Deleted successfully!');
    } catch (err) { toast.error('Failed to delete'); } finally { setIsDeleting(false); }
  };

  return (
    <div className="inventory-history-inventory-container">
      
      <HtmlHead title={title} description="Manage your inventory hub." />
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="12" md="auto" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button as={Link} to="/operations/stock-management" className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2">
                <CsLineIcons icon="activity" size="18" className="me-2" /> Manage Stock
              </Button>
              <Button as={Link} to="/operations/add-inventory" className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2">
                <CsLineIcons icon="plus" size="18" className="me-2" /> Add Inventory
              </Button>
            </Col>
          </Row>
        </div>

        <RequestedInventory refreshKey={refreshKey} brandColor={brandColor} onRejectClick={(item) => { setSelectedItem(item); setRejectInventoryModal(true); }} />
        <CompletedInventory refreshKey={refreshKey} history={history} onDeleteClick={(item) => { setSelectedItem(item); setShowDeleteModal(true); }} />
        <RejectedInventory refreshKey={refreshKey} history={history} onDeleteClick={(item) => { setSelectedItem(item); setShowDeleteModal(true); }} />

        <Modal show={rejectInventoryModal} onHide={() => setRejectInventoryModal(false)} centered contentClassName="border-0 shadow-lg" style={{backdropFilter: 'blur(5px)'}}><div className="bg-white p-4 rounded-3"><Modal.Header closeButton className="border-0 p-0 mb-3"><Modal.Title className="fw-bold text-danger">Reject Request</Modal.Title></Modal.Header><Modal.Body className="p-0"><p className="fw-bold text-muted mb-3">Reason for rejection:</p><Form.Control as="textarea" rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." /></Modal.Body><Modal.Footer className="border-0 p-0 d-flex gap-2 justify-content-end mt-4"><Button variant="light" className="inventory-history-custom-btn-outline border-0 text-muted" onClick={() => setRejectInventoryModal(false)}>Cancel</Button><Button variant="danger" className="inventory-history-custom-btn-outline border-danger text-danger px-4" onClick={handleReject} disabled={rejecting}>{rejecting ? 'Processing...' : 'Confirm Reject'}</Button></Modal.Footer></div></Modal>
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered contentClassName="border-0 shadow-lg" style={{backdropFilter: 'blur(5px)'}}><div className="bg-white p-4 rounded-3"><Modal.Header closeButton className="border-0 p-0 mb-3"><Modal.Title className="fw-bold text-danger">Confirm Deletion</Modal.Title></Modal.Header><Modal.Body className="p-0"><p className="fw-bold text-muted mb-0">Permanently delete this record?</p></Modal.Body><Modal.Footer className="border-0 p-0 d-flex gap-2 justify-content-end mt-4"><Button variant="light" className="inventory-history-custom-btn-outline border-0 text-muted" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" className="inventory-history-custom-btn-outline border-danger text-danger px-4" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</Button></Modal.Footer></div></Modal>
      </div>
    </div>
  );
};

export default InventoryHistory;

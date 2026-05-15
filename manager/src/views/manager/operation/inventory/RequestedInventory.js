import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Card, Row, Modal, Spinner, Alert, Form, Collapse } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

const customStyles = `
    .inventory-container {
      background: #f9f9fb;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .page-card {
      background: #ffffff !important;
      border-radius: 2rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02) !important;
      overflow: hidden;
    }
    .section-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .modern-input {
      border-radius: 12px !important;
      padding: 0.8rem 1.25rem !important;
      border: 1.5px solid #f1f5f9 !important;
      font-weight: 600 !important;
      color: #334155 !important;
      transition: all 0.3s ease !important;
      background: #fcfdfe !important;
      height: 52px !important;
    }
`;

const RequestedInventory = () => {
  const title = 'Requested Inventory';
  const description = 'Requested inventory with modern table UI.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/requested-inventory', text: 'Operations' },
    { to: 'operations/requested-inventory', title: 'Requested Inventory' },
  ];

  const [data, setData] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    requestFromDate: '',
    requestToDate: '',
  });

  const [loading, setLoading] = useState({ data: true, deleting: false });
  const [error, setError] = useState('');

  const [deleteInventoryModal, setDeleteInventoryModal] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] = useState(null);

  // Ref to prevent infinite loops
  const fetchRef = useRef(false);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.requestFromDate) count++;
    if (filters.requestToDate) count++;
    if (searchTerm) count++;
    return count;
  };

  const fetchRequestedInventory = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, data: true }));
      setError('');

      const params = {
        page: pageIndex + 1,
        limit: pageSize,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filters.requestFromDate) {
        params.request_from = filters.requestFromDate;
      }

      if (filters.requestToDate) {
        params.request_to = filters.requestToDate;
      }

      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Requested`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.data.success) {
        const requestedInventory = res.data.data.map((item) => ({
          ...item,
          request_date_obj: new Date(item.request_date),
          formatted_date: new Date(item.request_date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        }));

        setData(requestedInventory);

        if (res.data.pagination) {
          setTotalRecords(res.data.pagination.total || 0);
          setTotalPages(res.data.pagination.totalPages || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching requested inventory:', err);
      setError('Failed to load requested inventory. Please try again.');
      toast.error('Failed to fetch requested inventory.');
    } finally {
      setLoading((prev) => ({ ...prev, data: false }));
      fetchRef.current = false;
    }
  }, [pageIndex, pageSize, searchTerm, filters]);

  useEffect(() => {
    if (!fetchRef.current) {
      fetchRef.current = true;
      fetchRequestedInventory();
    }
  }, [fetchRequestedInventory]);

  const handlePageChange = (newPageIndex) => {
    setPageIndex(newPageIndex);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setPageIndex(0);
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setPageIndex(0);
  };

  const handleClearFilters = () => {
    setFilters({
      requestFromDate: '',
      requestToDate: '',
    });
    setSearchTerm('');
    setPageIndex(0);
  };

  const deleteInventory = async () => {
    if (!inventoryToDelete) return;

    setLoading((prev) => ({ ...prev, deleting: true }));
    try {
      await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${inventoryToDelete._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      toast.success('Inventory request deleted successfully!');
      setDeleteInventoryModal(false);
      setInventoryToDelete(null);
      fetchRef.current = true;
      fetchRequestedInventory();
    } catch (err) {
      console.error('Error deleting inventory:', err);
      toast.error(err.response?.data?.message || 'Failed to delete inventory.');
    } finally {
      setLoading((prev) => ({ ...prev, deleting: false }));
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Requested Date',
        accessor: 'formatted_date',
        Cell: ({ cell }) => <span>{cell.value}</span>,
      },
      {
        Header: 'Items',
        accessor: 'items',
        Cell: ({ cell }) => (
          <>
            {cell.value.map((item, i) => (
              <div key={i} className="mb-1">
                {item.item_name} - {item.item_quantity} {item.unit}
              </div>
            ))}
          </>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ cell }) => (
          <Badge bg="warning" text="dark">
            {cell.value}
          </Badge>
        ),
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              title="Edit"
              as={Link}
              className="btn-icon btn-icon-only"
              to={`/operations/edit-inventory/${row.original._id}`}
            >
              <CsLineIcons icon="edit-square" />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              title="Delete"
              className="btn-icon btn-icon-only"
              onClick={() => {
                setInventoryToDelete(row.original);
                setDeleteInventoryModal(true);
              }}
              disabled={loading.deleting}
            >
              <CsLineIcons icon="bin" />
            </Button>
          </div>
        ),
      },
    ],
    [loading.deleting]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      manualPagination: true,
      manualSortBy: true,
      manualGlobalFilter: true,
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

  if (loading.data && pageIndex === 0 && !searchTerm) {
    return (
      <>
        <HtmlHead title={title} description={description} />
        <Row>
          <Col>
            <div className="page-title-container">
              <h1 className="mb-0 pb-0 display-4">{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </div>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Loading...</h5>
            </div>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <div className="inventory-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="container-fluid px-lg-5">
          <div className="page-title-container mb-4 mt-n3">
            <Row className="g-3 align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
                <Button as={Link} to="/operations/add-inventory" variant="outline-primary" className="rounded-pill px-4 fw-bold border-2 shadow-sm">
                  <CsLineIcons icon="plus" className="me-2" />
                  Add Request
                </Button>
              </Col>
            </Row>
          </div>

          {/* Search and controls - Always visible */}
          <Row className="mb-3">
            <Col sm="12" md="5" lg="3" xxl="2">
              <div className="d-flex gap-2">
                <div className="d-inline-block float-md-start me-1 mb-1 mb-md-0 search-input-container w-100 shadow bg-foreground">
                  <ControlsSearch onSearch={handleSearch} />
                </div>
                <Button
                  variant={`${showFilters ? 'secondary' : 'outline-secondary'}`}
                  size="sm"
                  className="btn-icon btn-icon-only position-relative"
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filters"
                >
                  <CsLineIcons icon={`${showFilters ? 'close' : 'filter'}`} />
                  {getActiveFilterCount() > 0 && (
                    <Badge bg="primary" className="position-absolute top-0 start-100 translate-middle">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </div>
            </Col>
            <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
              <div className="d-inline-block me-3">
                {loading.data ? (
                  <span className="text-muted">Loading...</span>
                ) : (
                  <>
                    <span className="text-muted me-2">
                      Showing {data.length > 0 ? pageIndex * pageSize + 1 : 0} to {Math.min((pageIndex + 1) * pageSize, totalRecords)} of {totalRecords} entries
                    </span>
                    <ControlsPageSize pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
                  </>
                )}
              </div>
            </Col>
          </Row>

          {/* Filter Section */}
          <Collapse in={showFilters}>
            <Card className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Filters</h5>
                  {getActiveFilterCount() > 0 && (
                    <Button variant="outline-danger" size="sm" onClick={handleClearFilters}>
                      <CsLineIcons icon="close" className="me-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="mt-2">
                  <Row>
                    {/* Request Date Range */}
                    <Col md={4} className="mb-3">
                      <Form.Label className="small text-muted fw-bold">Request Date Range</Form.Label>
                      <Row>
                        <Col md={6}>
                          <Form.Label className="small text-muted">From</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={filters.requestFromDate}
                            onChange={(e) => handleFilterChange('requestFromDate', e.target.value)}
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Label className="small text-muted">To</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={filters.requestToDate}
                            onChange={(e) => handleFilterChange('requestToDate', e.target.value)}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Collapse>

          {error ? (
            <Alert variant="danger" className="border-0 shadow-sm rounded-4 d-flex align-items-center gap-3 mb-4 p-3 bg-white">
              <div className="bg-danger text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <CsLineIcons icon="warning" size="20" />
              </div>
              <div>
                <div className="fw-bold text-dark">{error}</div>
                <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => { fetchRef.current = true; fetchRequestedInventory(); }}>Retry</Button>
              </div>
            </Alert>
          ) : loading.data ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : data.length === 0 ? (
            <Alert variant="light" className="text-center py-5 rounded-4 border-0 shadow-sm bg-white">
              <CsLineIcons icon="inbox" size="48" className="text-muted mb-3 opacity-20" />
              <h5 className="fw-bold text-muted">{searchTerm || getActiveFilterCount() > 0 ? 'No results found.' : 'No Inventory Requests Found'}</h5>
              {!searchTerm && getActiveFilterCount() === 0 && (
                <Link to="/operations/add-inventory" className="btn btn-primary rounded-pill px-4 fw-bold mt-3 shadow-sm">
                  <CsLineIcons icon="plus" className="me-2" /> Create First Request
                </Link>
              )}
            </Alert>
          ) : (
            <Card className="page-card border-0 shadow-sm overflow-hidden">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table className="react-table rows mb-0" tableInstance={tableInstance} />
                </div>
                <div className="p-4 bg-light border-top">
                  <TablePagination paginationProps={paginationProps} />
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Inventory Modal */}
      <Modal  show={deleteInventoryModal} onHide={() => setDeleteInventoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons icon="warning" className="text-danger me-2" />
            Delete Inventory Request?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Delete this requested inventory permanently?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteInventoryModal(false)} disabled={loading.deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteInventory} disabled={loading.deleting} style={{ minWidth: '100px' }}>
            {loading.deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Deleting overlay */}
      {loading.deleting && (
        <div
          className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999,
            backdropFilter: 'blur(2px)',
          }}
        >
          <Card className="shadow-lg border-0" style={{ minWidth: '200px' }}>
            <Card.Body className="text-center p-4">
              <Spinner animation="border" variant="danger" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
              <h5 className="mb-0">Deleting Inventory Request...</h5>
              <small className="text-muted">Please wait a moment</small>
            </Card.Body>
          </Card>
        </div>
      )}
    </>
  );
};

export default RequestedInventory;

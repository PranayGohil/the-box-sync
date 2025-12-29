import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Card, Row, Modal, Spinner, Alert } from 'react-bootstrap';
import { useTable, useGlobalFilter, useSortBy } from 'react-table';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import ControlsSearch from './components/ControlsSearch';
import ControlsPageSize from './components/ControlsPageSize';
import Table from './components/Table';
import TablePagination from './components/TablePagination';

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

  const [loading, setLoading] = useState({ data: true, deleting: false });
  const [error, setError] = useState('');

  const [deleteInventoryModal, setDeleteInventoryModal] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] = useState(null);

  // Ref to prevent infinite loops
  const fetchRef = useRef(false);

  const fetchRequestedInventory = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, data: true }));
      setError('');

      const params = {
        page: pageIndex + 1,
        limit: pageSize,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const res = await axios.get(
        `${process.env.REACT_APP_API}/inventory/get-by-status/Requested`,
        {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

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
      setLoading(prev => ({ ...prev, data: false }));
      fetchRef.current = false;
    }
  }, [pageIndex, pageSize, searchTerm]);

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

  const handleRefresh = () => {
    fetchRef.current = true;
    fetchRequestedInventory();
  };

  const deleteInventory = async () => {
    if (!inventoryToDelete) return;

    setLoading(prev => ({ ...prev, deleting: true }));
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}/inventory/delete/${inventoryToDelete._id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      toast.success('Inventory request deleted successfully!');
      setDeleteInventoryModal(false);
      setInventoryToDelete(null);
      fetchRef.current = true;
      fetchRequestedInventory();
    } catch (err) {
      console.error('Error deleting inventory:', err);
      toast.error(err.response?.data?.message || 'Failed to delete inventory.');
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Requested Date',
        accessor: 'formatted_date',
        headerClassName: 'text-muted text-small text-uppercase w-20',
        Cell: ({ cell }) => <div className="text-truncate" title={cell.value}>{cell.value}</div>,
      },
      {
        Header: 'Items',
        accessor: 'items',
        headerClassName: 'text-muted text-small text-uppercase w-40',
        Cell: ({ cell }) => (
          <div>
            {cell.value.slice(0, 3).map((item, i) => (
              <div key={i} className="text-truncate" style={{ maxWidth: '300px' }}>
                <Badge bg="info" className="me-2">
                  {item.item_quantity} {item.unit}
                </Badge>
                {item.item_name}
              </div>
            ))}
            {cell.value.length > 3 && (
              <small className="text-muted">+{cell.value.length - 3} more items</small>
            )}
          </div>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        headerClassName: 'text-muted text-small text-uppercase w-15 text-center',
        Cell: ({ cell }) => <Badge bg="warning">{cell.value}</Badge>,
      },
      {
        Header: 'Actions',
        headerClassName: 'text-muted text-small text-uppercase w-25 text-center',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <Link
              to={`/operations/edit-inventory/${row.original._id}`}
              className="btn btn-outline-primary btn-sm"
              title="Edit"
            >
              <CsLineIcons icon="edit-square" />
            </Link>
            <Button
              variant="outline-danger"
              size="sm"
              title="Delete"
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
              <h5>Loading Requested Inventory...</h5>
              <p className="text-muted">Please wait while we fetch inventory requests</p>
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
              <Col xs="12" md="5" className="text-md-end mt-2 mt-md-0">
                <Button
                  variant="outline-primary"
                  onClick={handleRefresh}
                  disabled={loading.data}
                  className="me-2"
                >
                  <CsLineIcons icon="refresh" className="me-2" />
                  Refresh
                </Button>
                <Link to="/operations/add-inventory" className="btn btn-primary">
                  <CsLineIcons icon="plus" className="me-2" />
                  Add Request
                </Link>
              </Col>
            </Row>
          </div>

          {/* Search and controls - Always visible */}
          <Row className="mb-3">
            <Col sm="12" md="5" lg="3" xxl="2">
              <div className="d-inline-block float-md-start me-1 mb-1 mb-md-0 search-input-container w-100 shadow bg-foreground">
                <ControlsSearch onSearch={handleSearch} />
              </div>
            </Col>
            <Col sm="12" md="7" lg="9" xxl="10" className="text-end">
              <div className="d-inline-block me-3">
                {loading.data ? (
                  <span className="text-muted">Loading...</span>
                ) : (
                  <>
                    <span className="text-muted me-2">
                      Showing {data.length > 0 ? pageIndex * pageSize + 1 : 0} to{' '}
                      {Math.min((pageIndex + 1) * pageSize, totalRecords)} of {totalRecords} entries
                    </span>
                    <ControlsPageSize pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
                  </>
                )}
              </div>
              <Badge bg="light" text="dark" className="p-2">
                <CsLineIcons icon="list" className="me-1" />
                {totalRecords} request{totalRecords !== 1 ? 's' : ''}
              </Badge>
            </Col>
          </Row>

          {error ? (
            <Alert variant="danger" className="my-4">
              <CsLineIcons icon="error" className="me-2" />
              {error}
              <Button
                variant="outline-danger"
                size="sm"
                className="ms-3"
                onClick={() => {
                  fetchRef.current = true;
                  fetchRequestedInventory();
                }}
              >
                Retry
              </Button>
            </Alert>
          ) : loading.data ? (
            <Row className="justify-content-center my-5">
              <Col xs={12} className="text-center">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p className="text-muted">Loading...</p>
              </Col>
            </Row>
          ) : data.length === 0 ? (
            <Alert variant="info" className="my-4">
              <div className="text-center py-4">
                <CsLineIcons icon="inbox" size="48" className="text-muted mb-3" />
                <h5>
                  {searchTerm ? `No results found for "${searchTerm}"` : 'No Inventory Requests Found'}
                </h5>
                {!searchTerm && (
                  <>
                    <p className="text-muted mb-4">Get started by creating your first inventory request</p>
                    <Link to="/operations/add-inventory" className="btn btn-primary">
                      <CsLineIcons icon="plus" className="me-2" />
                      Create First Request
                    </Link>
                  </>
                )}
              </div>
            </Alert>
          ) : (
            <>
              <Row>
                <Col xs="12">
                  <Table className="react-table rows" tableInstance={tableInstance} />
                </Col>
                <Col xs="12">
                  <TablePagination paginationProps={paginationProps} />
                </Col>
              </Row>
            </>
          )}
        </Col>
      </Row>

      {/* Delete Inventory Modal */}
      <Modal
        className="modal-close-out"
        show={deleteInventoryModal}
        onHide={() => setDeleteInventoryModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CsLineIcons icon="warning" className="text-danger me-2" />
            Delete Inventory Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the request for{' '}
            <strong>{inventoryToDelete?.items?.length || 0} items</strong>?
          </p>
          <Alert variant="warning" className="mt-3">
            <CsLineIcons icon="alert" className="me-2" />
            This action cannot be undone. All associated data will be permanently removed.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteInventoryModal(false)}
            disabled={loading.deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={deleteInventory}
            disabled={loading.deleting}
            style={{ minWidth: '100px' }}
          >
            {loading.deleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
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
              <Spinner
                animation="border"
                variant="danger"
                className="mb-3"
                style={{ width: '3rem', height: '3rem' }}
              />
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
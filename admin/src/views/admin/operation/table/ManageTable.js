import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Alert, Spinner, Badge, Collapse } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import BoxedVariationsStripe from './components/BoxedVariationsStripe';
import EditTableModal from './EditTableModal';
import EditTableAreaModal from './EditTableAreaModal';
import DeleteTableModal from './DeleteTableModal';

const ManageTable = () => {
  const title = 'Manage Tables';
  const description = 'Manage restaurant table areas and layouts with a premium responsive design.';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations', text: 'Operations' },
    { to: 'operations/manage-table', title: 'Manage Tables' },
  ];

  const [editTableModalShow, setEditTableModalShow] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editTableAreaModalShow, setEditTableAreaModalShow] = useState(false);
  const [selectedTableArea, setSelectedTableArea] = useState(null);
  const [deleteTableModalShow, setDeleteTableModalShow] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAreas, setExpandedAreas] = useState({});

  const fetchTableData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${process.env.REACT_APP_API}/table/get-all`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const transformedTables = res.data.data.map(({ _id, ...rest }) => ({
        ...rest,
        id: _id,
      }));
      setTableData(transformedTables);

      // Expand first area by default
      if (transformedTables.length > 0) {
        setExpandedAreas({ [transformedTables[0].id]: true });
      }
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError('Failed to fetch table data. Please try again.');
      toast.error('Failed to fetch table data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const toggleArea = (areaId) => {
    setExpandedAreas((prev) => ({
      ...prev,
      [areaId]: !prev[areaId],
    }));
  };

  if (loading) {
    return (
      <div className="container-fluid qsr-page-container">
        <HtmlHead title={title} description={description} />
        <div className="qsr-page-title-container">
          <h1 className="qsr-page-title">{title}</h1>
          <BreadcrumbList items={breadcrumbs} />
        </div>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Optimizing layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid qsr-page-container">
      <HtmlHead title={title} description={description} />

      {/* Header Section */}
      <div className="qsr-page-title-container text-start">
        <Row className="g-0 align-items-center">
          <Col xs="auto" className="me-auto text-start">
            <h1 className="qsr-page-title">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
            <Button href="/operations/add-table" className="px-4 py-2 rounded-pill d-flex align-items-center manage-table-custom-btn-outline">
              <CsLineIcons icon="plus" className="me-2" size="18" stroke="currentColor" />
              Add New Table
            </Button>
          </Col>
        </Row>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4 shadow-sm border-0 rounded-lg">
          <CsLineIcons icon="error" className="me-2" />
          {error}
        </Alert>
      )}

      {tableData.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: '15px' }}>
          <Card.Body>
            <div className="mb-3 text-muted opacity-20">
              <CsLineIcons icon="inbox" size={80} />
            </div>
            <h3 className="fw-bold">No Tables Configured</h3>
            <p className="text-muted mb-4">Start by adding your first restaurant area and table.</p>
            <Button variant="primary" href="/operations/add-table" className="rounded-pill px-4">
              Create First Table
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="area-sections">
          {tableData.map((areaGroup) => (
            <div key={areaGroup.id} className="mb-4">
              {/* Area Header */}
              <div
                className="d-flex justify-content-between align-items-center gap-2 gap-sm-3 mb-2 px-2 px-sm-3 py-3 bg-white shadow-sm cursor-pointer transition-all hover-light"
                style={{ borderRadius: '15px', border: '1px solid rgba(0,0,0,0.03)' }}
                onClick={() => toggleArea(areaGroup.id)}
              >
                <div className="d-flex align-items-center gap-2 gap-sm-3 min-width-0">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: expandedAreas[areaGroup.id] ? '#1ea8e7' : '#f3f4f6',
                      color: expandedAreas[areaGroup.id] ? '#fff' : '#6b7280',
                      transition: 'all 0.3s ease',
                      transform: expandedAreas[areaGroup.id] ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}
                  >
                    <CsLineIcons icon="chevron-down" size="16" />
                  </div>
                  <h2 className="h5 mb-0 fw-bold text-dark text-truncate" style={{ maxWidth: '150px' }}>
                    {areaGroup.area}
                  </h2>
                </div>
                <div className="d-flex align-items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Badge
                    bg="soft-primary"
                    className="rounded-pill px-2 px-sm-3 py-2 flex-shrink-0"
                    style={{
                      backgroundColor: 'rgba(30, 168, 231, 0.1)',
                      color: '#1ea8e7',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                    }}
                  >
                    {areaGroup.tables.length} {areaGroup.tables.length === 1 ? 'Table' : 'Tables'}
                  </Badge>
                  <Button
                    variant="light"
                    size="sm"
                    className="btn-icon btn-icon-only shadow-sm rounded-circle border-0"
                    onClick={() => {
                      setSelectedTableArea(areaGroup);
                      setEditTableAreaModalShow(true);
                    }}
                  >
                    <CsLineIcons icon="edit" size="15" />
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    className="btn-icon btn-icon-only shadow-sm rounded-circle border-0 text-primary"
                    onClick={() => {
                      window.location.href = `/operations/add-table?area=${encodeURIComponent(areaGroup.area)}`;
                    }}
                  >
                    <CsLineIcons icon="plus" size="15" />
                  </Button>
                </div>
              </div>

              {/* Tables Grid - Collapsible */}
              <Collapse in={expandedAreas[areaGroup.id]}>
                <div className="pt-2 pb-3 px-1">
                  <Row className="g-3">
                    {areaGroup.tables.map((table) => (
                      <Col key={table._id} xs="12" sm="6" lg="4" xxl="3">
                        <Card className="h-100 border-0 shadow-sm hover-elevate transition-all" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="d-flex align-items-center justify-content-center bg-light rounded-lg" style={{ width: '45px', height: '45px' }}>
                                <CsLineIcons icon="layout-5" size="24" className="text-primary" />
                              </div>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-muted"
                                  onClick={() => {
                                    setSelectedTable({ ...table, id: table._id });
                                    setEditTableModalShow(true);
                                  }}
                                >
                                  <CsLineIcons icon="edit" size="16" />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-danger"
                                  onClick={() => {
                                    setTableToDelete({ ...table, id: table._id, area: areaGroup.area });
                                    setDeleteTableModalShow(true);
                                  }}
                                >
                                  <CsLineIcons icon="bin" size="16" />
                                </Button>
                              </div>
                            </div>

                            <div className="mb-2">
                              <span className="text-muted small text-uppercase fw-bold manage-table-ls-1">Table Number</span>
                              <h4 className="fw-bold mb-0">#{table.table_no}</h4>
                            </div>

                            <div className="d-flex align-items-center mt-3 pt-3 border-top">
                              <div className="d-flex align-items-center gap-2">
                                <CsLineIcons icon="user" size="14" className="text-muted" />
                                <span className="text-muted small">Max Capacity:</span>
                                <span className="fw-bold small">{table.max_person} Person</span>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Collapse>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedTable && (
        <EditTableModal
          show={editTableModalShow}
          handleClose={() => {
            setEditTableModalShow(false);
            setSelectedTable(null);
          }}
          data={selectedTable}
          onUpdateSuccess={fetchTableData}
        />
      )}

      {selectedTableArea && (
        <EditTableAreaModal
          show={editTableAreaModalShow}
          handleClose={() => {
            setEditTableAreaModalShow(false);
            setSelectedTableArea(null);
          }}
          data={selectedTableArea}
          onUpdateSuccess={fetchTableData}
        />
      )}

      {tableToDelete && (
        <DeleteTableModal
          show={deleteTableModalShow}
          handleClose={() => {
            setDeleteTableModalShow(false);
            setTableToDelete(null);
          }}
          data={tableToDelete}
          onDeleteSuccess={fetchTableData}
        />
      )}
    </div>
  );
};

export default ManageTable;

import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { logWastage, getWastageLog, deleteWastageEntry, getCurrentStock } from 'api/inventory';
import { format } from 'date-fns';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import Select from 'react-select';



const WASTAGE_TYPES = [
  { value: 'expired', label: 'Expired' },
  { value: 'spillage', label: 'Spillage' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'overcook', label: 'Over-Cooked' },
  { value: 'theft', label: 'Theft / Missing' },
  { value: 'other', label: 'Other' },
];

const AdminWastageLog = () => {
  const history = useHistory();
  const title = 'Wastage Log';
  const description = 'Log and track wasted, expired, or damaged inventory items.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/wastage-log', text: 'Inventory' },
    { to: 'operations/wastage-log', title: 'Wastage Log' },
  ];

  const [logs, setLogs] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const sevenDaysAgo = format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd');
  const [fromDate, setFromDate] = useState(sevenDaysAgo);
  const [toDate, setToDate] = useState(today);

  const [form, setForm] = useState({ item_name: '', unit: '', quantity: '', wastage_type: '', reason: '' });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWastageLog({ from: fromDate, to: toDate, limit: 100 });
      setLogs(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load wastage logs');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const fetchStock = useCallback(async () => {
    try {
      const res = await getCurrentStock();
      setStockItems(res.data.data || []);
    } catch (err) {
      console.error('Failed to load stock items:', err);
    }
  }, []);

  useEffect(() => { fetchLogs(); fetchStock(); }, [fetchLogs, fetchStock]);

  const handleItemSelect = (itemName) => {
    const found = stockItems.find((s) => s._id === itemName);
    setForm((prev) => ({ ...prev, item_name: itemName, unit: found?.unit || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.wastage_type || !form.quantity || Number(form.quantity) <= 0) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const res = await logWastage(form);
      if (res.data.success) {
        toast.success('Wastage logged and stock deducted');
        setForm({ item_name: '', unit: '', quantity: '', wastage_type: '', reason: '' });
        fetchLogs();
        fetchStock();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log wastage');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id) => { setDeleteId(id); setShowModal(true); };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteWastageEntry(deleteId);
      toast.success('Wastage log deleted and stock restored');
      setShowModal(false);
      fetchLogs();
      fetchStock();
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const totalWasted = logs.reduce((s, l) => s + l.quantity, 0);
  const typeColors = { expired: 'danger', spillage: 'info', damaged: 'warning', overcook: 'secondary', theft: 'dark', other: 'light' };

  const customStyles = `
    .admin-wastage-log-wastage-container .btn {
      transition: all 0.2s ease-in-out !important;
    }
    .admin-wastage-log-wastage-container .btn:hover {
      transform: translateY(-2px) !important;
    }
    .admin-wastage-log-wastage-container .btn:not(.btn-sm) {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 10px 28px !important;
      height: 48px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      font-size: 0.95rem !important;
    }
    .admin-wastage-log-wastage-container .btn.btn-sm {
      border-radius: 50px !important;
      font-weight: 600 !important;
      padding: 6px 16px !important;
      height: 36px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-size: 0.85rem !important;
    }
    .admin-wastage-log-wastage-container .btn-primary {
      background-color: #23b3f4 !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
    }
    .admin-wastage-log-wastage-container .btn-primary:hover {
      background-color: #179edb !important;
      border-color: #179edb !important;
      box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-primary,
    .admin-wastage-log-wastage-container .manage-menu-custom-btn-outline {
      border: 1px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #ffffff !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-primary:hover,
    .admin-wastage-log-wastage-container .manage-menu-custom-btn-outline:hover {
      background-color: #23b3f4 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-primary:hover svg,
    .admin-wastage-log-wastage-container .manage-menu-custom-btn-outline:hover svg {
      stroke: #ffffff !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-success {
      border: 1px solid #10b981 !important;
      color: #10b981 !important;
      background-color: #ffffff !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-success:hover {
      background-color: #10b981 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25) !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-success:hover svg {
      stroke: #ffffff !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-danger {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background-color: #ffffff !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-danger:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-danger:hover svg {
      stroke: #ffffff !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-secondary {
      border: 1px solid #64748b !important;
      color: #64748b !important;
      background-color: #ffffff !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-secondary:hover {
      background-color: #64748b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
    }
    .admin-wastage-log-wastage-container .btn-outline-secondary:hover svg {
      stroke: #ffffff !important;
    }

    .modal-content {
      border-radius: 1.5rem !important;
      overflow: hidden !important;
    }
  `;

  return (
    <>
    <div className="admin-wastage-log-wastage-container pb-5">
      <style>{customStyles}</style>
      
      <HtmlHead title={title} description={description} />
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
            <Col xs="auto" className="d-none d-lg-block">
              <Button 
                onClick={() => history.goBack()} 
                className="manage-menu-custom-btn-outline shadow-sm px-4 py-2 d-flex align-items-center"
                style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4', fontWeight: '700' }}
              >
                <CsLineIcons icon="arrow-left" size="18" className="me-2" /> Back
              </Button>
            </Col>
          </Row>
          
          {/* Mobile Back Button - Below Breadcrumb */}
          <div className="mt-2 d-lg-none d-flex justify-content-start">
             <Button 
                onClick={() => history.goBack()} 
                className="manage-menu-custom-btn-outline shadow-sm px-4 py-2 d-flex align-items-center"
                style={{ borderRadius: '50px', border: '2px solid #23b3f4', color: '#23b3f4', fontWeight: '700' }}
              >
                <CsLineIcons icon="arrow-left" size="16" className="me-2" /> <span className="small">Back</span>
              </Button>
          </div>
        </div>

      <Row className="g-3">
        {/* Log Wastage Form */}
        <Col xs={12} lg={4}>
          <Card className="admin-wastage-log-page-card border-0 mb-4">
            <Card.Body className="p-4">
              <div className="admin-wastage-log-section-label"><CsLineIcons icon="plus" size="18" /> Log New Wastage</div>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <div className="admin-wastage-log-input-group-label">Item <span className="text-danger">*</span></div>
                  <div className="admin-wastage-log-select-modern">
                    <Select
                      classNamePrefix="react-select"
                      options={stockItems.map((s) => ({ value: s._id, label: `${s._id} (${s.totalStock} ${s.unit})` }))}
                      value={form.item_name ? { value: form.item_name, label: form.item_name } : null}
                      onChange={(opt) => handleItemSelect(opt ? opt.value : '')}
                      placeholder="Search and select item..."
                      menuPortalTarget={document.body}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      required
                    />
                  </div>
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col xs={8}>
                    <Form.Group>
                      <div className="admin-wastage-log-input-group-label">Quantity <span className="text-danger">*</span></div>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        className="admin-wastage-log-modern-input"
                        value={form.quantity}
                        onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={4}>
                    <Form.Group>
                      <div className="admin-wastage-log-input-group-label">Unit</div>
                      <Form.Control className="admin-wastage-log-modern-input text-center bg-light fw-bold" value={form.unit || '—'} readOnly />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <div className="admin-wastage-log-input-group-label">Wastage Type <span className="text-danger">*</span></div>
                  <div className="d-flex flex-wrap gap-2">
                    {WASTAGE_TYPES.map((t) => (
                      <div key={t.value}>
                        <input
                          type="radio"
                          className="btn-check"
                          name="wastage_type"
                          id={`type-${t.value}`}
                          value={t.value}
                          checked={form.wastage_type === t.value}
                          onChange={(e) => setForm((p) => ({ ...p, wastage_type: e.target.value }))}
                        />
                        <label 
                          className={`btn rounded-pill px-3 py-1 fw-bold small ${form.wastage_type === t.value ? 'btn-primary text-white shadow-sm' : 'btn-outline-light text-dark border-light-subtle'}`} 
                          htmlFor={`type-${t.value}`}
                        >
                          {t.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <div className="admin-wastage-log-input-group-label">Reason / Note</div>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    className="admin-wastage-log-modern-input"
                    style={{ height: 'auto' }}
                    value={form.reason}
                    onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="Describe why this is being wasted..."
                  />
                </Form.Group>

                <Button variant="danger" type="submit" className="w-100 manage-menu-custom-btn-outline border-danger text-danger shadow-sm py-3 d-flex align-items-center justify-content-center" style={{color: '#ef4444', borderColor: '#ef4444'}} disabled={submitting}>
                  {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="check-circle" size="20" className="me-2" />}
                  <span className="h6 mb-0 fw-bold">Log Wastage Entry</span>
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={8}>
          <Card className="admin-wastage-log-page-card border-0 overflow-hidden">
            <Card.Body className="p-0">
              <div className="p-4 bg-white border-bottom">
                <Row className="g-3 align-items-center">
                  <Col>
                    <div className="admin-wastage-log-section-label mb-0"><CsLineIcons icon="history" size="18" /> Wastage History</div>
                    <div className="text-muted small mt-1 fw-bold">Total Wasted: <span className="text-danger h6 mb-0">{totalWasted.toFixed(2)}</span> Units</div>
                  </Col>
                  <Col xs={12} md="auto">
                    <div className="d-flex flex-row flex-md-nowrap gap-2 justify-content-md-end align-items-end">
                      <div className="flex-grow-1" style={{ minWidth: '140px' }}>
                        <div className="admin-wastage-log-input-group-label small mb-1 text-truncate">From</div>
                        <Form.Control 
                          type="date" 
                          className="admin-wastage-log-modern-input w-100" 
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'%2364748b\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '10px center', backgroundSize: '14px 14px' }}
                          value={fromDate} 
                          onChange={(e) => setFromDate(e.target.value)} 
                        />
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: '140px' }}>
                        <div className="admin-wastage-log-input-group-label small mb-1 text-truncate">To</div>
                        <Form.Control 
                          type="date" 
                          className="admin-wastage-log-modern-input w-100" 
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'%2364748b\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '10px center', backgroundSize: '14px 14px' }}
                          value={toDate} 
                          onChange={(e) => setToDate(e.target.value)} 
                        />
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="admin-wastage-log-history-table-container">
                {loading ? (
                  <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-5">
                    <CsLineIcons icon="check-square" size="48" className="text-light mb-3" />
                    <p className="text-muted">No wastage records for this period.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive d-none d-lg-block">
                      <Table className="admin-wastage-log-custom-table mb-0">
                        <thead>
                          <tr>
                            <th className="ps-4">Date</th>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Type</th>
                            <th>Reason</th>
                            <th className="text-end pe-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => (
                            <tr key={log._id}>
                              <td className="small ps-4">{format(new Date(log.date), 'dd MMM')}</td>
                              <td className="fw-bold">{log.item_name}</td>
                              <td className="text-primary fw-bold">{log.quantity} <span className="text-muted small fw-normal">{log.unit}</span></td>
                              <td><Badge bg={typeColors[log.wastage_type] || 'secondary'} className="text-uppercase" style={{fontSize: '0.6rem'}}>{log.wastage_type}</Badge></td>
                              <td className="small text-muted">{log.reason || '—'}</td>
                              <td className="text-end pe-4">
                                <Button variant="outline-danger" size="sm" className="btn-icon btn-icon-only rounded-circle border-0" onClick={() => confirmDelete(log._id)}>
                                  <CsLineIcons icon="bin" size="14" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    <div className="d-lg-none p-3">
                      {logs.map((log) => (
                        <div key={log._id} className="admin-wastage-log-mobile-row-card p-3 mb-3 border border-light-subtle rounded-3 shadow-sm bg-white">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <div className="bg-light p-2 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{width: '40px', height: '40px', borderRadius: '10px'}}>
                                <CsLineIcons icon="box" size="18" className="text-danger" />
                              </div>
                              <div>
                                <div className="fw-bold text-dark small">{log.item_name}</div>
                                <div className="x-small text-muted fw-bold">{format(new Date(log.date), 'dd MMM yyyy')}</div>
                              </div>
                            </div>
                            <Button variant="outline-danger" size="sm" className="btn-icon btn-icon-only rounded-circle border-0 bg-light shadow-sm" onClick={() => confirmDelete(log._id)}>
                              <CsLineIcons icon="bin" size="14" />
                            </Button>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded-2">
                            <div>
                              <div className="x-small text-muted fw-bold text-uppercase" style={{fontSize: '0.55rem'}}>Quantity</div>
                              <div className="fw-bold text-danger">{log.quantity} {log.unit}</div>
                            </div>
                            <Badge bg={typeColors[log.wastage_type] || 'secondary'} className="text-uppercase px-3 py-2 rounded-pill" style={{fontSize: '0.6rem'}}>{log.wastage_type}</Badge>
                          </div>
                          {log.reason && (
                            <div className="mt-2 p-2 small text-muted fst-italic bg-light-subtle rounded-2" style={{fontSize: '0.75rem'}}>
                              "{log.reason}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirm Modal */}
      <Modal show={showModal} onHide={() => !deleting && setShowModal(false)} centered>
        <Modal.Header closeButton={!deleting}><Modal.Title>Delete Wastage Log</Modal.Title></Modal.Header>
        <Modal.Body>
          Are you sure? This will also <strong>restore the deducted stock</strong> back to inventory.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={deleting}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" /> : 'Delete & Restore Stock'}
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </div>
    </>
  );
};

export default AdminWastageLog;

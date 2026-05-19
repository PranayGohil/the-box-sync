import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Col, Row, Card, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getDailyLogHistory, updateDailyLog, createCorrectionRequest } from 'api/inventory';
import { format, subDays } from 'date-fns';

const STATUS_CONFIG = {
  manager_verified: { bg: 'success', label: 'Manager Verify', class: 'verified' },
  partial: { bg: 'warning', label: 'Partial', class: 'partial' },
  auto_generated: { bg: 'info', label: 'Auto Verified', class: 'auto' },
};

const DailyStockLogs = () => {
  const history = useHistory();
  const title = 'Stock Audit Logs';
  const brandColor = '#23b3f4';
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [showEdit, setShowEdit] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Correction request states
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionLog, setCorrectionLog] = useState(null);
  const [correctionNote, setCorrectionNote] = useState('');
  const [sendingCorrection, setSendingCorrection] = useState(false);

  const handleRequestCorrection = (log) => {
    setCorrectionLog(log);
    setCorrectionNote('');
    setShowCorrectionModal(true);
  };

  const handleCorrectionSubmit = async () => {
    if (!correctionNote.trim()) { toast.error('Please describe what needs to be corrected.'); return; }
    try {
      setSendingCorrection(true);
      await createCorrectionRequest({
        log_id: correctionLog._id,
        reason: correctionNote,
      });
      toast.success('Correction request sent to Admin. They will update the record.');
      setShowCorrectionModal(false);
      setCorrectionNote('');
    } catch (err) {
      toast.error('Failed to send correction request');
    } finally {
      setSendingCorrection(false);
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDailyLogHistory({ from: fromDate, to: toDate, limit: 100 });
      setLogs(res.data.data || []);
    } catch (err) {
      toast.error('Load failed');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const openEdit = (log) => {
    setEditLog(log);
    setEditItems(log.items.map((i) => ({ ...i })));
    setEditNotes(log.notes || '');
    setShowEdit(true);
  };

  const handleEditQty = (idx, val) => {
    setEditItems((prev) => { const u = [...prev]; u[idx] = { ...u[idx], quantity: parseFloat(val) || 0 }; return u; });
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await updateDailyLog(editLog._id, { items: editItems, notes: editNotes });
      toast.success('Audit finalized');
      setShowEdit(false);
      fetchLogs();
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const grouped = logs.reduce((acc, log) => {
    const dateKey = format(new Date(log.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = {};
    acc[dateKey][log.shift] = log;
    return acc;
  }, {});

  const customStyles = `
    .audit-logs-day-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 1.5rem !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02) !important;
      margin-bottom: 2.5rem !important;
      overflow: hidden !important;
    }
    .audit-logs-day-header {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
      border-bottom: 1px solid #e2e8f0 !important;
      padding: 1.5rem 2rem !important;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .audit-logs-log-row-card {
      padding: 1.25rem 2rem !important;
      border-bottom: 1px solid #f1f5f9 !important;
      transition: background-color 0.2s ease;
    }
    .audit-logs-log-row-card:last-child {
      border-bottom: none !important;
    }
    .audit-logs-log-row-card:hover {
      background-color: #fafbfd !important;
    }
    .audit-header-col {
      color: #64748b !important;
      font-size: 0.75rem !important;
      font-weight: 700 !important;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .audit-qty-val {
      font-size: 1.15rem !important;
      font-weight: 800 !important;
      letter-spacing: -0.02em;
    }
    .mobile-ribbon-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      margin-top: 0.5rem;
    }
    .mobile-ribbon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    .mobile-ribbon-item:not(:last-child) {
      border-right: 1px solid #e2e8f0;
    }
    .mobile-ribbon-label {
      font-size: 0.6rem;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-bottom: 0.15rem;
    }
    .mobile-ribbon-val {
      font-size: 0.85rem;
      font-weight: 800;
    }
    @media (max-width: 767.98px) {
      .audit-logs-day-header {
        flex-direction: column;
        align-items: flex-start !important;
        gap: 0.75rem;
        padding: 1.25rem 1.5rem !important;
      }
      .audit-logs-day-header .d-flex {
        width: 100%;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .audit-logs-log-row-card {
        padding: 1rem 1.25rem !important;
      }
    }
  `;

  return (
    <div className="admin-daily-stock-logs-stock-container pb-5">
      <style>{customStyles}</style>
      <HtmlHead title={title} />
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'operations/inventory', text: 'Inventory' }, { to: '', title: 'Logs' }]} />
            </Col>
            <Col xs="auto">
              <Button onClick={() => history.goBack()} className="manage-menu-custom-btn-outline shadow-sm border-0 px-3 py-2">
                <CsLineIcons icon="arrow-left" size="18" className="me-2" /> Back
              </Button>
            </Col>
          </Row>
        </div>

        <Card className="admin-daily-stock-logs-filter-bar border-0">
          <Row className="g-2 align-items-end">
            <Col md={3}><div><div className="admin-daily-stock-logs-log-header-text mb-1">From</div><Form.Control type="date" className="admin-daily-stock-logs-modern-input w-100" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div></Col>
            <Col md={3}><div><div className="admin-daily-stock-logs-log-header-text mb-1">To</div><Form.Control type="date" className="admin-daily-stock-logs-modern-input w-100" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div></Col>
            <Col md="auto"><Button variant="outline-primary" className="admin-daily-stock-logs-btn-pill-action border-2 px-3" onClick={fetchLogs} disabled={loading}>{loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}</Button></Col>
          </Row>
        </Card>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <Alert variant="light" className="admin-daily-stock-logs-day-log-card text-center py-5 border-0 shadow-none"><div className="text-muted">No records found.</div></Alert>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([dateKey, shifts]) => {
            const { opening, closing } = shifts;
            const allItems = [...new Set([...(opening?.items || []).map((i) => i.item_name), ...(closing?.items || []).map((i) => i.item_name)])];

            return (
              <div key={dateKey} className="audit-logs-day-card">
                <div className="audit-logs-day-header">
                  <div>
                    <div className="h5 fw-bold mb-1 text-dark d-flex align-items-center"><CsLineIcons icon="calendar" className="me-2 text-primary" size="20" />{format(new Date(dateKey), 'dd MMM yyyy')}</div>
                    <div className="text-muted small fw-bold" style={{letterSpacing: '0.05em'}}>{format(new Date(dateKey), 'EEEE').toUpperCase()} AUDIT</div>
                  </div>
                  <div className="d-flex gap-2">
                    {opening && <Badge bg={STATUS_CONFIG[opening.log_status]?.bg || 'secondary'} className="px-3 py-2 fw-bold" style={{ fontSize: '0.75rem' }}>Opening: {STATUS_CONFIG[opening.log_status]?.label}</Badge>}
                    {closing && <Badge bg={STATUS_CONFIG[closing.log_status]?.bg || 'secondary'} className="px-3 py-2 fw-bold" style={{ fontSize: '0.75rem' }}>Closing: {STATUS_CONFIG[closing.log_status]?.label}</Badge>}
                  </div>
                </div>

                <div className="p-4 bg-white">
                  <Row className="d-none d-lg-flex px-3 mb-3 mx-0 align-items-center">
                    <Col lg={4} className="audit-header-col ps-4">Ingredient</Col>
                    <Col lg={2} className="audit-header-col text-center">Opening</Col>
                    <Col lg={2} className="audit-header-col text-center">Closing</Col>
                    <Col lg={4} className="audit-header-col text-center">Reconciliation</Col>
                  </Row>

                  {allItems.slice(0, 15).map((name) => {
                    const oItem = opening?.items?.find((i) => i.item_name === name);
                    const cItem = closing?.items?.find((i) => i.item_name === name);
                    const openQty = oItem?.quantity;
                    const closeQty = cItem?.quantity;
                    const unit = oItem?.unit || cItem?.unit || '';
                    const diff = openQty !== undefined && closeQty !== undefined ? closeQty - openQty : null;

                    return (
                      <div key={name} className="audit-logs-log-row-card">
                        <Row className="g-0 align-items-center w-100">
                          {/* Desktop View Column Grid */}
                          <Col lg={4} className="d-none d-lg-flex align-items-center gap-3">
                            <div className="bg-light p-2 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{width: '40px', height: '40px', borderRadius: '10px'}}>
                              <CsLineIcons icon="box" size="18" className="text-primary" />
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{name}</div>
                              <div className="x-small text-muted fw-bold text-uppercase" style={{fontSize: '0.65rem', letterSpacing: '0.05em'}}>{unit}</div>
                            </div>
                          </Col>
                          
                          <Col lg={2} className="d-none d-lg-block text-center">
                            <div className="audit-qty-val text-primary">{openQty !== undefined ? openQty.toFixed(2) : <span className="text-muted fw-normal">—</span>}</div>
                          </Col>
                          
                          <Col lg={2} className="d-none d-lg-block text-center">
                            <div className="audit-qty-val text-success">{closeQty !== undefined ? closeQty.toFixed(2) : <span className="text-muted fw-normal">—</span>}</div>
                          </Col>
                          
                          <Col lg={4} className="d-none d-lg-flex justify-content-center">
                            {diff !== null ? (
                              <Badge bg={diff < 0 ? 'danger' : diff === 0 ? 'light' : 'success'} className={`rounded-pill shadow-sm px-3 py-2 fw-bold ${diff === 0 ? 'text-muted border' : ''}`} style={{fontSize: '0.75rem'}}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)} {unit}
                              </Badge>
                            ) : <span className="text-muted small">—</span>}
                          </Col>

                          {/* Mobile View Premium Ribbon Layout */}
                          <Col xs={12} className="d-lg-none">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <div className="bg-light p-2 rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{width: '32px', height: '32px'}}>
                                <CsLineIcons icon="box" size="14" className="text-primary" />
                              </div>
                              <div>
                                <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>{name}</div>
                                <div className="x-small text-muted fw-bold text-uppercase" style={{fontSize: '0.6rem'}}>{unit}</div>
                              </div>
                            </div>
                            
                            <div className="mobile-ribbon-bar">
                              <div className="mobile-ribbon-item">
                                <span className="mobile-ribbon-label">OPENING</span>
                                <span className="mobile-ribbon-val text-primary">{openQty !== undefined ? openQty.toFixed(2) : '—'}</span>
                              </div>
                              <div className="mobile-ribbon-item">
                                <span className="mobile-ribbon-label">CLOSING</span>
                                <span className="mobile-ribbon-val text-success">{closeQty !== undefined ? closeQty.toFixed(2) : '—'}</span>
                              </div>
                              <div className="mobile-ribbon-item">
                                <span className="mobile-ribbon-label">RECONCILE</span>
                                <span className="mobile-ribbon-val">
                                  {diff !== null ? (
                                    <Badge bg={diff < 0 ? 'danger' : diff === 0 ? 'light' : 'success'} className={`rounded-pill fw-bold ${diff === 0 ? 'text-muted border' : ''}`} style={{fontSize: '0.65rem', padding: '0.35rem 0.6rem'}}>
                                      {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                    </Badge>
                                  ) : <span className="text-muted">—</span>}
                                </span>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    );
                  })}

                  <div className="mt-4 pt-3 border-top px-3 d-flex gap-2">
                  {opening && opening.log_status !== 'manager_verified' && (
                    <Button variant="outline-primary" className="admin-daily-stock-logs-btn-pill-action border-2" onClick={() => openEdit(opening)}>
                      <CsLineIcons icon="edit" size="14" className="me-2" /> Adjust Opening
                    </Button>
                  )}
                  {opening && opening.log_status === 'manager_verified' && (
                    <Button variant="outline-warning" className="admin-daily-stock-logs-btn-pill-action border-2" onClick={() => handleRequestCorrection(opening)}>
                      <CsLineIcons icon="edit" size="14" className="me-2" /> Request Opening Correction
                    </Button>
                  )}
                  {closing && closing.log_status !== 'manager_verified' && (
                    <Button variant="outline-success" className="admin-daily-stock-logs-btn-pill-action border-2" onClick={() => openEdit(closing)}>
                      <CsLineIcons icon="edit" size="14" className="me-2" /> Adjust Closing
                    </Button>
                  )}
                  {closing && closing.log_status === 'manager_verified' && (
                    <Button variant="outline-warning" className="admin-daily-stock-logs-btn-pill-action border-2" onClick={() => handleRequestCorrection(closing)}>
                      <CsLineIcons icon="edit" size="14" className="me-2" /> Request Closing Correction
                    </Button>
                  )}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      <Modal show={showEdit} onHide={() => !saving && setShowEdit(false)} size="lg" centered className="admin-daily-stock-logs-modern-modal">
        <Modal.Header closeButton={!saving} className="border-0 pb-0 shadow-none"><Modal.Title className="fw-bold h4">Audit Reconciliation</Modal.Title></Modal.Header>
        <Modal.Body className="p-4 pt-3">
          <div className="rounded-4 p-3 mb-4 d-flex justify-content-between align-items-center shadow-sm border border-light" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'}}>
            <div><div className="admin-daily-stock-logs-log-header-text mb-1">Active Shift</div><div className="fw-bold text-primary h5 mb-0" style={{letterSpacing: '0.05em'}}>{editLog?.shift?.toUpperCase()}</div></div>
            <div className="text-end"><div className="admin-daily-stock-logs-log-header-text mb-1">Audit Date</div><div className="fw-bold text-dark h5 mb-0">{editLog && format(new Date(editLog.date), 'dd MMM yyyy')}</div></div>
          </div>
          
          <div style={{ maxHeight: '45vh', overflowY: 'auto' }} className="pe-2 custom-scrollbar">
            {editItems.map((item, idx) => (
              <div key={idx} className="admin-daily-stock-logs-audit-workstation-row">
                <div className="d-flex align-items-center gap-3" style={{flex: 1}}>
                   <div className="bg-light p-2 rounded-3"><CsLineIcons icon="box" size="14" className="text-muted" /></div>
                   <div className="fw-bold text-dark">{item.item_name} <span className="text-muted fw-bold small">({item.unit})</span></div>
                </div>
                <div style={{width: '120px'}}><Form.Control type="number" step="0.01" className="admin-daily-stock-logs-modern-input text-center" value={item.quantity} onChange={(e) => handleEditQty(idx, e.target.value)} /></div>
              </div>
            ))}
          </div>

          <Form.Group className="mt-4">
            <Form.Label className="admin-daily-stock-logs-log-header-text mb-2">Audit Notes & Comments</Form.Label>
            <Form.Control as="textarea" rows={2} className="admin-daily-stock-logs-modern-input" placeholder="Explain the reason for this manual adjustment..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4 justify-content-center">
          <Button variant="outline-secondary" className="admin-daily-stock-logs-btn-pill-action border-2 px-4" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</Button>
          <Button variant="outline-primary" className="admin-daily-stock-logs-btn-pill-action border-2 px-4" onClick={handleSaveEdit} disabled={saving}>{saving ? <Spinner animation="border" size="sm" /> : 'Save Changes'}</Button>
        </Modal.Footer>
      </Modal>

      {/* Correction Request Modal */}
      <Modal show={showCorrectionModal} onHide={() => !sendingCorrection && setShowCorrectionModal(false)} centered>
        <Modal.Header closeButton={!sendingCorrection}>
          <Modal.Title className="fw-bold">Request Stock Correction</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Alert variant="warning" className="py-2">
            <strong>Only Admin can modify verified daily stock logs.</strong> Describe the correction details below, and Admin will update the record.
          </Alert>
          <Form.Group className="mt-3">
            <Form.Label className="fw-semibold">Correction Reason / Details <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              placeholder="Explain what was recorded wrong and what the correct quantities are..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowCorrectionModal(false)} disabled={sendingCorrection}>Cancel</Button>
          <Button variant="warning" className="rounded-pill px-4 text-dark fw-bold" onClick={handleCorrectionSubmit} disabled={sendingCorrection}>
            {sendingCorrection ? <Spinner animation="border" size="sm" /> : 'Send to Admin'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DailyStockLogs;

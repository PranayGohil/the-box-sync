import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getTodayLog, saveOpeningStock, autoGenerateOpening, createCorrectionRequest, getRestaurantTimings } from 'api/inventory';
import { format } from 'date-fns';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  manager_verified: { bg: 'success', label: 'Opening: Manager Verify', icon: '✅' },
  auto_generated: { bg: 'warning', label: 'Opening: Auto Verify', icon: '⚡' },
  partial: { bg: 'info', label: 'Opening: Partial', icon: '📋' },
};

const customStyles = `
    .inventory-container {
      background: #f8fafc;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .page-card {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
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
      border: 1.5px solid #e2e8f0 !important;
      font-weight: 600 !important;
      color: #334155 !important;
      transition: all 0.3s ease !important;
      background: #fcfdfe !important;
      height: 48px !important;
    }
    .modern-input:focus {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
      background: #ffffff !important;
    }
    .stats-card {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0,0,0,0.05) !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02) !important;
      transition: all 0.3s ease;
    }
    .verify-badge {
      font-size: 0.78rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .table {
      border-collapse: separate !important;
      border-spacing: 0 10px !important;
    }
    .table thead th {
      border: none !important;
      background: transparent !important;
      color: #64748b !important;
      font-weight: 700 !important;
      font-size: 0.85rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      padding: 0.75rem 1.5rem !important;
    }
    .table tbody tr {
      transition: all 0.2s ease-in-out !important;
    }
    .table tbody tr:hover {
      transform: translateY(-2px);
    }
    .table tbody td {
      background: #ffffff !important;
      border-top: 1px solid #f1f5f9 !important;
      border-bottom: 1px solid #f1f5f9 !important;
      padding: 1.25rem 1.5rem !important;
      vertical-align: middle !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01) !important;
    }
    .table tbody tr td:first-child {
      border-left: 1px solid #f1f5f9 !important;
      border-top-left-radius: 1rem !important;
      border-bottom-left-radius: 1rem !important;
    }
    .table tbody tr td:last-child {
      border-right: 1px solid #f1f5f9 !important;
      border-top-right-radius: 1rem !important;
      border-bottom-right-radius: 1rem !important;
    }
    .inventory-container .btn {
      transition: all 0.2s ease-in-out !important;
    }
    .inventory-container .btn:hover {
      transform: translateY(-2px) !important;
    }
    .inventory-container .btn:not(.btn-sm) {
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
    .inventory-container .btn.btn-sm {
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
    .inventory-container .btn-primary {
      background-color: #23b3f4 !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
    }
    .inventory-container .btn-primary:hover {
      background-color: #179edb !important;
      border-color: #179edb !important;
      box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
    }
    .inventory-container .btn-outline-primary {
      border: 1px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #ffffff !important;
    }
    .inventory-container .btn-outline-primary:hover {
      background-color: #23b3f4 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .inventory-container .btn-outline-primary:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-container .btn-outline-danger {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background-color: #ffffff !important;
    }
    .inventory-container .btn-outline-danger:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
    .inventory-container .btn-outline-danger:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-container .btn-outline-warning {
      border: 1px solid #f59e0b !important;
      color: #f59e0b !important;
      background-color: #ffffff !important;
    }
    .inventory-container .btn-outline-warning:hover {
      background-color: #f59e0b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25) !important;
    }
    .inventory-container .btn-outline-warning:hover svg {
      stroke: #ffffff !important;
    }
    .inventory-container .btn-outline-secondary {
      border: 1px solid #64748b !important;
      color: #64748b !important;
      background-color: #ffffff !important;
    }
    .inventory-container .btn-outline-secondary:hover {
      background-color: #64748b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
    }
    .inventory-container .btn-outline-secondary:hover svg {
      stroke: #ffffff !important;
    }
    .modal-content {
      border-radius: 1.5rem !important;
      overflow: hidden !important;
    }
`;

const DailyOpeningStock = () => {
  const title = 'Opening Stock';
  const description = 'Record the opening stock at the start of the day.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/daily-opening-stock', text: 'Inventory' },
    { to: 'operations/daily-opening-stock', title: 'Opening Stock' },
  ];
  const history = useHistory();

  const today = format(new Date(), 'yyyy-MM-dd');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [opening, setOpening] = useState(null);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [openTime, setOpenTime] = useState(null); // e.g. "09:00"

  // Correction request modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [sendingCorrection, setSendingCorrection] = useState(false);

  // isLocked = manager has already verified → no more editing allowed
  const isLocked = opening && opening.log_status === 'manager_verified';
  // isAutoGenerated = system generated, manager can still verify/edit
  const isAutoGenerated = opening && opening.log_status === 'auto_generated';

  const fetchToday = useCallback(async () => {
    try {
      setLoading(true);
      const [res, timingsRes] = await Promise.all([getTodayLog(), getRestaurantTimings()]);
      const { opening: op, openingSuggestion, liveStock } = res.data;
      setOpening(op);
      setOpenTime(timingsRes.data?.open_time_from || null);

      if (op) {
        setItems(op.items.map((i) => ({ ...i, verified: true })));
        setNotes(op.notes || '');
      } else {
        const suggestion = openingSuggestion || liveStock.map((s) => ({ item_name: s._id, unit: s.unit, quantity: s.totalStock }));
        setItems(
          suggestion.map((i) => ({
            item_name: i.item_name || i._id,
            unit: i.unit || '',
            quantity: i.quantity !== undefined ? i.quantity : i.totalStock || 0,
            verified: false,
          }))
        );
        setNotes('');
      }
    } catch (err) {
      toast.error("Failed to load today's data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const handleQtyChange = (index, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: parseFloat(value) || 0, verified: true };
      return updated;
    });
  };

  const handleVerifyAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, verified: true })));
    toast.info('All items marked as verified');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      setSubmitting(true);
      const res = await saveOpeningStock({ items, notes, date: today });
      if (res.data.success) {
        toast.success('Opening stock verified and saved successfully!');
        history.push('/operations/inventory-history');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save opening stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      setSubmitting(true);
      await autoGenerateOpening();
      toast.success("Opening stock auto-generated from yesterday's closing");
      history.push('/operations/inventory-history');
    } catch (err) {
      toast.error('Failed to auto-generate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectionRequest = async () => {
    if (!correctionNote.trim()) {
      toast.error('Please describe what needs to be corrected.');
      return;
    }
    try {
      setSendingCorrection(true);
      await createCorrectionRequest({
        log_id: opening._id,
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

  const statusCfg = opening ? STATUS_CONFIG[opening.log_status] : null;

  return (
    <>
      <div className="inventory-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="container-fluid qsr-page-container">
          <div className="qsr-page-title-container">
            <Row className="g-3 align-items-center">
              <Col xs="12" md="7">
                <h1 className="qsr-page-title">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="d-flex justify-content-md-end align-items-center gap-2 mt-3 mt-md-0 flex-wrap">
                {/* Status badge — visible once a log exists */}
                {statusCfg && (
                  <span
                    className={`verify-badge bg-${statusCfg.bg === 'warning' ? 'warning' : statusCfg.bg === 'success' ? 'success' : 'info'}-subtle text-${
                      statusCfg.bg
                    }`}
                  >
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                )}
                <div className="bg-white border rounded-pill px-4 py-2 fw-bold text-dark shadow-sm d-flex align-items-center">
                  <CsLineIcons icon="calendar" size="15" className="me-2 text-primary" />
                  {format(new Date(), 'dd MMM yyyy')}
                </div>
                {/* Request Correction — only shown after manager has verified */}
                {isLocked && (
                  <>
                    <Button variant="outline-warning" className="rounded-pill fw-bold" size="sm" onClick={() => setShowCorrectionModal(true)}>
                      <CsLineIcons icon="edit" size="14" className="me-1" /> Request Correction
                    </Button>
                    <Button
                      variant="primary"
                      className="rounded-pill fw-bold"
                      size="sm"
                      onClick={() => history.push('/operations/inventory/daily-closing-stock')}
                    >
                      <CsLineIcons icon="login" size="14" className="me-1" /> Adjust Closing Stock
                    </Button>
                  </>
                )}
              </Col>
            </Row>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* ── Banner: Manager Verified ── */}
              {isLocked && (
                <Alert variant="success" className="d-flex align-items-start gap-3 mb-3">
                  <span style={{ fontSize: '1.4rem' }}>✅</span>
                  <div>
                    <strong>Opening stock verified and locked for today.</strong>
                    <span className="ms-2">
                      <Badge bg="success" className="px-3 py-2">
                        Opening: Manager Verify
                      </Badge>
                    </span>
                    {opening.recorded_by && (
                      <span className="ms-2 text-muted small">
                        by {opening.recorded_by} at {format(new Date(opening.createdAt), 'hh:mm a')}
                      </span>
                    )}
                    {opening.edited_by && <span className="ms-2 text-muted small">· Edited by Admin ({opening.edited_by})</span>}
                    <div className="mt-1 text-muted small">
                      To request a change, click <strong>"Request Correction"</strong> above. Only Admin can modify verified logs.
                    </div>
                  </div>
                </Alert>
              )}

              {/* ── Banner: Auto Verified (still editable) ── */}
              {isAutoGenerated && (
                <Alert variant="warning" className="d-flex align-items-start gap-3 mb-3">
                  <span style={{ fontSize: '1.4rem' }}>⚡</span>
                  <div className="flex-grow-1">
                    <strong>Opening stock has been auto-verified based on yesterday's closing stock.</strong>
                    <span className="ms-2">
                      <Badge bg="warning" text="dark" className="px-3 py-2">
                        Opening: Auto Verify
                      </Badge>
                    </span>
                    <div className="text-muted small mt-1">
                      Please physically count your stock. If quantities match, click <strong>"Verify &amp; Save"</strong>. Otherwise adjust below and save — it
                      will become <strong>Opening: Manager Verify</strong>.
                    </div>
                  </div>
                </Alert>
              )}

              {/* ── Banner: Not yet submitted ── */}
              {!opening && (
                <Alert variant="info" className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <strong>Opening stock not logged yet for today.</strong>
                    <span className="ms-2 text-muted small">
                      Quantities pre-filled from yesterday's closing stock.
                      {openTime && (
                        <>
                          {' '}
                          Auto-verification will trigger at <strong>{openTime}</strong> if not verified.
                        </>
                      )}
                    </span>
                  </div>
                  <Button variant="outline-secondary" size="sm" onClick={handleAutoGenerate} disabled={submitting}>
                    Auto-Generate &amp; Skip
                  </Button>
                </Alert>
              )}

              {/* ── Quick Verify Banner — only when not locked ── */}
              {!isLocked && items.length > 0 && (
                <Alert variant="light" className="border mb-3 py-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                      <strong>Quick Verify Mode:</strong> Change only items that differ. Tap "Verify All" if everything matches.
                    </span>
                    <Button variant="outline-success" size="sm" onClick={handleVerifyAll}>
                      ✅ Verify All
                    </Button>
                  </div>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Card className="page-card border-0 shadow-sm overflow-hidden mb-4">
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table hover className="mb-0 align-middle">
                        <thead className="bg-light">
                          <tr>
                            <th className="text-uppercase text-muted text-small ps-4 py-3">Item Name</th>
                            <th className="text-uppercase text-muted text-small py-3">Unit</th>
                            <th className="text-uppercase text-muted text-small py-3">Opening Quantity</th>
                            {!isLocked && <th className="text-uppercase text-muted text-small text-center py-3">Status</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center text-muted py-5">
                                No stock items found. Add inventory first.
                              </td>
                            </tr>
                          ) : (
                            items.map((item, idx) => (
                              <tr key={idx} className={!isLocked && item.verified ? 'bg-success-subtle' : ''}>
                                <td className="ps-4 py-3">
                                  <div className="fw-bold text-dark">{item.item_name}</div>
                                </td>
                                <td className="text-muted py-3">{item.unit || '—'}</td>
                                <td className="py-3" style={{ width: 180 }}>
                                  {isLocked ? (
                                    <div className="fw-bold fs-5">
                                      {item.quantity} <small className="text-muted fw-normal">{item.unit}</small>
                                    </div>
                                  ) : (
                                    <Form.Control
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.quantity}
                                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                                      className="modern-input"
                                      style={{ height: '42px !important', maxWidth: '140px' }}
                                    />
                                  )}
                                </td>
                                {!isLocked && (
                                  <td className="text-center py-3">
                                    {item.verified ? (
                                      <Badge pill bg="success" className="px-3">
                                        Verified
                                      </Badge>
                                    ) : (
                                      <Badge pill bg="warning" text="dark" className="px-3">
                                        Pending
                                      </Badge>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>

                {/* Submit — only shown when NOT manager_verified */}
                {!isLocked && (
                  <>
                    <Card className="mb-3">
                      <Card.Body>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Notes (optional)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any observations about opening stock..."
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                    <Button variant="primary" type="submit" disabled={submitting || items.length === 0}>
                      {submitting ? (
                        <Spinner animation="border" size="sm" />
                      ) : isAutoGenerated ? (
                        '✅ Verify & Save Opening Stock'
                      ) : opening ? (
                        'Verify & Save Opening Stock'
                      ) : (
                        'Save Opening Stock'
                      )}
                    </Button>
                  </>
                )}
              </Form>
            </>
          )}
        </div>
      </div>

      {/* Correction Request Modal — only reachable after manager_verified */}
      <Modal show={showCorrectionModal} onHide={() => !sendingCorrection && setShowCorrectionModal(false)} centered>
        <Modal.Header closeButton={!sendingCorrection}>
          <Modal.Title>Request Opening Stock Correction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="py-2">
            <strong>Opening stock is already locked (Opening: Manager Verify).</strong> Only Admin can modify it. Describe what needs to be corrected and Admin
            will update the record.
          </Alert>
          <Form.Group>
            <Form.Label>
              Correction Details <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              placeholder="e.g. Tomatoes quantity should be 5 kg not 8 kg. Miscounted at opening."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowCorrectionModal(false)} disabled={sendingCorrection}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleCorrectionRequest} disabled={sendingCorrection}>
            {sendingCorrection ? <Spinner animation="border" size="sm" /> : 'Send Request to Admin'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DailyOpeningStock;

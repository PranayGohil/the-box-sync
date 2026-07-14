import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getTodayLog, saveClosingStock, getWastageLog, createCorrectionRequest, getRestaurantTimings } from 'api/inventory';
import { format } from 'date-fns';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  manager_verified: { bg: 'success', label: 'Closing: Manager Verified', icon: '✅' },
  auto_generated: { bg: 'secondary', label: 'Closing: Auto Recorded', icon: '🤖' },
  partial: { bg: 'warning', label: 'Closing: Partial', icon: '📋' },
};

const customStyles = `
    .stock-container {
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
    .stats-card {
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: #ffffff !important;
    }
    .stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05) !important;
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
    .stock-container .btn {
      transition: all 0.2s ease-in-out !important;
    }
    .stock-container .btn:hover {
      transform: translateY(-2px) !important;
    }
    .stock-container .btn:not(.btn-sm) {
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
    .stock-container .btn.btn-sm {
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
    .stock-container .btn-primary {
      background-color: #23b3f4 !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
    }
    .stock-container .btn-primary:hover {
      background-color: #179edb !important;
      border-color: #179edb !important;
      box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
    }
    .stock-container .btn-outline-primary {
      border: 1px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #ffffff !important;
    }
    .stock-container .btn-outline-primary:hover {
      background-color: #23b3f4 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .stock-container .btn-outline-primary:hover svg {
      stroke: #ffffff !important;
    }
    .stock-container .btn-outline-danger {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background-color: #ffffff !important;
    }
    .stock-container .btn-outline-danger:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
    .stock-container .btn-outline-danger:hover svg {
      stroke: #ffffff !important;
    }
    .stock-container .btn-outline-warning {
      border: 1px solid #f59e0b !important;
      color: #f59e0b !important;
      background-color: #ffffff !important;
    }
    .stock-container .btn-outline-warning:hover {
      background-color: #f59e0b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25) !important;
    }
    .stock-container .btn-outline-warning:hover svg {
      stroke: #ffffff !important;
    }
    .stock-container .btn-outline-secondary {
      border: 1px solid #64748b !important;
      color: #64748b !important;
      background-color: #ffffff !important;
    }
    .stock-container .btn-outline-secondary:hover {
      background-color: #64748b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
    }
    .stock-container .btn-outline-secondary:hover svg {
      stroke: #ffffff !important;
    }
    .modal-content {
      border-radius: 1.5rem !important;
      overflow: hidden !important;
    }
`;

/**
 * Compute "closing_time + 60 min" as a display string.
 * Input: "HH:MM" string.
 */
const addOneHour = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const totalMins = h * 60 + m + 60;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  // Format as 12h
  const suffix = newH >= 12 ? 'PM' : 'AM';
  const display = `${newH % 12 || 12}:${String(newM).padStart(2, '0')} ${suffix}`;
  return display;
};

const DailyClosingStock = () => {
  const title = 'Closing Stock';
  const description = 'Record the closing stock at the end of the day.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/daily-closing-stock', text: 'Inventory' },
    { to: 'operations/daily-closing-stock', title: 'Closing Stock' },
  ];

  const today = format(new Date(), 'yyyy-MM-dd');
  const history = useHistory();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [opening, setOpening] = useState(null);
  const [closing, setClosing] = useState(null);
  const [liveStock, setLiveStock] = useState([]);
  const [todayWastage, setTodayWastage] = useState([]);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [closeTime, setCloseTime] = useState(null); // "HH:MM"

  // Correction request modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [sendingCorrection, setSendingCorrection] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [todayRes, wastageRes, timingsRes] = await Promise.all([getTodayLog(), getWastageLog({ from: today, to: today }), getRestaurantTimings()]);

      const { opening: op, closing: cl, liveStock: ls } = todayRes.data;
      setOpening(op);
      setClosing(cl);
      setLiveStock(ls || []);
      setTodayWastage(wastageRes.data.data || []);
      setCloseTime(timingsRes.data?.open_time_to || null);

      if (cl) {
        setItems(cl.items.map((i) => ({ ...i })));
        setNotes(cl.notes || '');
      } else {
        const stockMap = {};
        (ls || []).forEach((s) => {
          stockMap[s._id] = { unit: s.unit, qty: s.totalStock };
        });
        const baseItems = op
          ? op.items.map((i) => ({ item_name: i.item_name, unit: i.unit, quantity: stockMap[i.item_name]?.qty ?? i.quantity }))
          : (ls || []).map((s) => ({ item_name: s._id, unit: s.unit, quantity: s.totalStock }));
        setItems(baseItems);
        setNotes('');
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQtyChange = (index, value) => {
    setItems((prev) => {
      const u = [...prev];
      u[index] = { ...u[index], quantity: parseFloat(value) || 0 };
      return u;
    });
  };

  const isLocked = closing && closing.log_status === 'manager_verified';
  const isAutoGenerated = closing && closing.log_status === 'auto_generated';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    try {
      setSubmitting(true);
      const res = await saveClosingStock({ items, notes, date: today });
      if (res.data.success) {
        toast.success('Closing stock verified and saved successfully!');
        history.push('/operations/inventory-history');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save closing stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectionRequest = async () => {
    if (!correctionNote.trim()) {
      toast.error('Please describe what needs to be corrected.');
      return;
    }
    if (!closing?._id) {
      toast.error('No closing stock log found to request correction on.');
      return;
    }
    try {
      setSendingCorrection(true);
      await createCorrectionRequest({
        log_id: closing._id,
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

  const wastageSummary = todayWastage.reduce((acc, w) => {
    if (!acc[w.item_name]) acc[w.item_name] = 0;
    acc[w.item_name] += w.quantity;
    return acc;
  }, {});

  const totalWaste = todayWastage.reduce((s, w) => s + w.quantity, 0);
  const autoDeadline = addOneHour(closeTime);
  const statusCfg = closing ? STATUS_CONFIG[closing.log_status] : null;

  return (
    <>
      <div className="stock-container">
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
                {/* Status badge */}
                {statusCfg && (
                  <span
                    className={`verify-badge bg-${
                      statusCfg.bg === 'secondary' ? 'secondary' : statusCfg.bg === 'success' ? 'success' : 'warning'
                    }-subtle text-${statusCfg.bg}`}
                  >
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                )}
                <div className="bg-white border rounded-pill px-4 py-2 fw-bold text-dark shadow-sm d-flex align-items-center">
                  <CsLineIcons icon="calendar" size="15" className="me-2 text-primary" />
                  {format(new Date(), 'dd MMM yyyy')}
                </div>
                {/* Request Correction — only after manager_verified (fully locked) */}
                {isLocked && (
                  <Button variant="outline-warning" className="rounded-pill fw-bold" size="sm" onClick={() => setShowCorrectionModal(true)}>
                    <CsLineIcons icon="edit" size="14" className="me-1" /> Request Correction
                  </Button>
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
              {/* ── Banner: No opening stock ── */}
              {!opening && (
                <Alert variant="warning" className="mb-3">
                  <strong>Opening stock was not logged today.</strong>
                  <span className="ms-2 text-muted small">Closing is pre-filled from current live stock.</span>
                </Alert>
              )}

              {/* ── Banner: Closing submitted (Manager Verified — locked) ── */}
              {isLocked && (
                <Alert variant="success" className="d-flex align-items-start gap-3 mb-3">
                  <span style={{ fontSize: '1.4rem' }}>{statusCfg?.icon}</span>
                  <div>
                    <strong>Closing stock verified and locked for today.</strong>
                    <span className="ms-2">
                      <Badge bg={statusCfg?.bg} className="px-3 py-2">
                        {statusCfg?.label}
                      </Badge>
                    </span>
                    {closing.recorded_by && (
                      <span className="ms-2 text-muted small">
                        by {closing.recorded_by} at {format(new Date(closing.createdAt), 'hh:mm a')}
                      </span>
                    )}
                    {closing.edited_by && <span className="ms-2 text-muted small">· Edited by Admin ({closing.edited_by})</span>}
                    <div className="mt-1 text-muted small">
                      To make a correction, click <strong>"Request Correction"</strong> above. Only Admin can modify verified logs.
                    </div>
                  </div>
                </Alert>
              )}

              {/* ── Banner: Auto Recorded (still editable by manager) ── */}
              {isAutoGenerated && (
                <Alert variant="warning" className="d-flex align-items-start gap-3 mb-3">
                  <span style={{ fontSize: '1.4rem' }}>🤖</span>
                  <div className="flex-grow-1">
                    <strong>Closing stock was auto-recorded from live stock (no manager submission).</strong>
                    <span className="ms-2">
                      <Badge bg="warning" text="dark" className="px-3 py-2">
                        Closing: Auto Recorded
                      </Badge>
                    </span>
                    <div className="text-muted small mt-1">
                      You can adjust the quantities below and click <strong>"Verify &amp; Save Closing Stock"</strong> to confirm — it will become{' '}
                      <strong>Closing: Manager Verified</strong>.
                    </div>
                  </div>
                </Alert>
              )}

              {/* ── Banner: Auto-record deadline (only when closing not yet submitted) ── */}
              {!closing && autoDeadline && (
                <Alert variant="info" className="mb-3 py-2 d-flex align-items-center gap-2">
                  <CsLineIcons icon="clock" size="18" className="text-info flex-shrink-0" />
                  <div>
                    <strong>Auto-record deadline: {autoDeadline}</strong>
                    <span className="ms-2 text-muted small">
                      If closing stock is not submitted by <strong>{autoDeadline}</strong> (1 hour after restaurant closing time), the system will auto-record
                      current live stock as <em>Closing: Auto Recorded</em>.
                    </span>
                  </div>
                </Alert>
              )}

              {/* ── Stats row ── */}
              <Row className="mb-4 g-3">
                {[
                  { label: 'Opening Items', val: opening ? opening.items.length : '—', color: 'success', icon: 'login' },
                  { label: 'Wastage Logs', val: todayWastage.length, color: 'danger', icon: 'bin' },
                  { label: 'Units Wasted', val: totalWaste, color: 'warning', icon: 'shield' },
                  { label: 'Live Stock', val: liveStock.length, color: 'primary', icon: 'box' },
                ].map((stat, i) => (
                  <Col key={i} xs={6} md={3}>
                    <Card className="stats-card border-0 h-100">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className={`bg-${stat.color}-subtle text-${stat.color} rounded-circle d-flex align-items-center justify-content-center`}
                            style={{ width: '40px', height: '40px' }}
                          >
                            <CsLineIcons icon={stat.icon} size="18" />
                          </div>
                          <div>
                            <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                              {stat.label}
                            </div>
                            <div className={`h4 mb-0 fw-bold text-${stat.color}`}>{stat.val}</div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Form onSubmit={handleSubmit}>
                <Card className="page-card border-0 mb-4">
                  <Card.Body className="p-0">
                    <div className="p-4 border-bottom bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                      <div>
                        <div className="section-label mb-1">
                          <CsLineIcons icon="form-check" size="18" /> Closing Stock Quantities
                        </div>
                        <div className="text-muted small">
                          {closing
                            ? 'Submitted closing stock — read only. Use "Request Correction" to notify Admin.'
                            : 'Adjust physical counts below if they differ from system stock.'}
                        </div>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <Table hover className="mb-0 align-middle">
                        <thead className="bg-light text-muted small text-uppercase fw-bold">
                          <tr>
                            <th className="ps-4 py-3">Item</th>
                            <th className="py-3">Unit</th>
                            {opening && <th className="py-3">Opening</th>}
                            <th className="py-3 text-danger">Wasted</th>
                            <th className="py-3 pe-4" style={{ width: '180px' }}>
                              Closing Qty
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-muted py-5 fw-bold">
                                No stock items found.
                              </td>
                            </tr>
                          ) : (
                            items.map((item, idx) => {
                              const openQty = opening?.items?.find((o) => o.item_name === item.item_name)?.quantity;
                              const wastedQty = wastageSummary[item.item_name] || 0;
                              return (
                                <tr key={idx} className={wastedQty > 0 ? 'bg-danger-subtle' : ''}>
                                  <td className="ps-4">
                                    <div className="fw-bold text-dark">{item.item_name}</div>
                                  </td>
                                  <td>
                                    <Badge bg="light" text="dark" className="border">
                                      {item.unit || '—'}
                                    </Badge>
                                  </td>
                                  {opening && <td className="text-muted fw-bold">{openQty ?? '—'}</td>}
                                  <td>
                                    {wastedQty > 0 ? <div className="fw-bold text-danger">-{wastedQty}</div> : <span className="text-light-emphasis">—</span>}
                                  </td>
                                  <td className="pe-4">
                                    {isLocked ? (
                                      <div className="fw-bold fs-5 text-primary">{item.quantity}</div>
                                    ) : (
                                      <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="modern-input"
                                        value={item.quantity}
                                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                                      />
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>

                {/* Submit — shown when NOT manager_verified (includes auto_generated & no-closing states) */}
                {!isLocked && (
                  <div className="mb-5">
                    <Card className="page-card border-0 mb-4">
                      <Card.Body className="p-4">
                        <div className="section-label mb-3">
                          <CsLineIcons icon="note" size="18" /> Remarks
                        </div>
                        <Form.Group>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            className="modern-input"
                            style={{ height: 'auto' }}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any end-of-day observations or stock discrepancies..."
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                    <div className="text-end">
                      <Button
                        variant="primary"
                        type="submit"
                        size="lg"
                        className="rounded-pill px-5 fw-bold shadow-sm py-3"
                        disabled={submitting || items.length === 0}
                        style={{ minWidth: '250px' }}
                      >
                        {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="save" className="me-2" />}
                        {isAutoGenerated ? '✅ Verify & Save Closing Stock' : 'Save Final Closing Stock'}
                      </Button>
                    </div>
                  </div>
                )}
              </Form>
            </>
          )}
        </div>
      </div>

      {/* Correction Request Modal */}
      <Modal show={showCorrectionModal} onHide={() => !sendingCorrection && setShowCorrectionModal(false)} centered>
        <Modal.Header closeButton={!sendingCorrection}>
          <Modal.Title>Request Closing Stock Correction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="py-2">
            <strong>Closing stock is locked ({statusCfg?.label || 'Submitted'}).</strong> Only Admin can modify it. Describe the correction needed and Admin
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
              placeholder="e.g. Rice closing quantity should be 10 kg not 15 kg. Made an error while counting."
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

export default DailyClosingStock;

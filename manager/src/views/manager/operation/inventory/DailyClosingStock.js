import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getTodayLog, saveClosingStock, getWastageLog } from 'api/inventory';
import { format } from 'date-fns';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
    .stock-container {
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
    .stats-card {
      border-radius: 1.5rem !important;
      border: none !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important;
      transition: transform 0.3s ease;
    }
    .stats-card:hover {
      transform: translateY(-5px);
    }
    .modern-input {
      border-radius: 12px !important;
      padding: 0.6rem 1rem !important;
      border: 1.5px solid #f1f5f9 !important;
      font-weight: 700 !important;
      color: #334155 !important;
      transition: all 0.3s ease !important;
      background: #fcfdfe !important;
      height: 45px !important;
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
`;

const STATUS_BADGE = {
  manager_verified: { bg: 'success', label: 'Verified' },
  auto_generated: { bg: 'secondary', label: 'Auto' },
  partial: { bg: 'warning', label: 'Partial' },
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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [opening, setOpening] = useState(null);
  const [closing, setClosing] = useState(null);
  const [liveStock, setLiveStock] = useState([]);
  const [todayWastage, setTodayWastage] = useState([]);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');

  // Correction request modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [sendingCorrection, setSendingCorrection] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [todayRes, wastageRes] = await Promise.all([
        getTodayLog(),
        getWastageLog({ from: today, to: today }),
      ]);

      const { opening: op, closing: cl, liveStock: ls } = todayRes.data;
      setOpening(op);
      setClosing(cl);
      setLiveStock(ls || []);
      setTodayWastage(wastageRes.data.data || []);

      if (cl) {
        setItems(cl.items.map((i) => ({ ...i })));
        setNotes(cl.notes || '');
      } else {
        const stockMap = {};
        (ls || []).forEach((s) => { stockMap[s._id] = { unit: s.unit, qty: s.totalStock }; });
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleQtyChange = (index, value) => {
    setItems((prev) => { const u = [...prev]; u[index] = { ...u[index], quantity: parseFloat(value) || 0 }; return u; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Already submitted — manager cannot re-submit
    if (closing) return;
    try {
      setSubmitting(true);
      const res = await saveClosingStock({ items, notes, date: today });
      if (res.data.success) {
        toast.success('Closing stock saved successfully!');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save closing stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectionRequest = async () => {
    if (!correctionNote.trim()) { toast.error('Please describe what needs to be corrected.'); return; }
    try {
      setSendingCorrection(true);
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

  return (
    <>
      <div className="stock-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="container-fluid px-lg-5">
          <div className="page-title-container mb-3 mt-n3">
            <Row className="g-3 align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
                <div className="bg-white border rounded-pill px-4 py-2 fw-bold text-dark shadow-sm d-flex align-items-center">
                  <CsLineIcons icon="calendar" size="15" className="me-2 text-primary" />
                  {format(new Date(), 'dd MMM yyyy')}
                </div>
                {closing && (
                  <Button variant="outline-warning" className="rounded-pill fw-bold" size="sm" onClick={() => setShowCorrectionModal(true)}>
                    <CsLineIcons icon="edit" size="14" className="me-1" /> Correction
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
          {!opening && (
            <Alert variant="warning" className="mb-3">
              <strong>Opening stock was not logged today.</strong>
              <span className="ms-2 text-muted small">Closing is pre-filled from current live stock.</span>
            </Alert>
          )}

          {closing && (
            <Alert
              variant={closing.log_status === 'manager_verified' ? 'success' : 'secondary'}
              className="d-flex align-items-center gap-2 mb-3"
            >
              <span>✅</span>
              <div>
                <strong>Closing stock already submitted for today.</strong>
                <span className="ms-2">
                  <Badge bg={STATUS_BADGE[closing.log_status]?.bg}>{STATUS_BADGE[closing.log_status]?.label}</Badge>
                </span>
                {closing.recorded_by && (
                  <span className="ms-2 text-muted small">
                    by {closing.recorded_by} at {format(new Date(closing.createdAt), 'hh:mm a')}
                  </span>
                )}
                {closing.edited_by && (
                  <span className="ms-2 text-muted small">· Edited by Admin ({closing.edited_by})</span>
                )}
                <div className="mt-1 text-muted small">
                  To make a correction, use the <strong>"Request Correction"</strong> button above. Only Admin can modify submitted logs.
                </div>
              </div>
            </Alert>
          )}

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
                      <div className={`bg-${stat.color}-subtle text-${stat.color} rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '40px', height: '40px' }}>
                        <CsLineIcons icon={stat.icon} size="18" />
                      </div>
                      <div>
                        <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>{stat.label}</div>
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
                    <div className="section-label mb-1"><CsLineIcons icon="form-check" size="18" /> Closing Stock Quantities</div>
                    <div className="text-muted small">
                      {closing
                        ? 'Submitted closing stock — read only. Contact Admin for corrections.'
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
                        <th className="py-3 pe-4" style={{ width: '180px' }}>Closing Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-muted py-5 fw-bold">No stock items found.</td></tr>
                      ) : items.map((item, idx) => {
                        const openQty = opening?.items?.find((o) => o.item_name === item.item_name)?.quantity;
                        const wastedQty = wastageSummary[item.item_name] || 0;
                        return (
                          <tr key={idx} className={wastedQty > 0 ? 'bg-danger-subtle' : ''}>
                            <td className="ps-4">
                              <div className="fw-bold text-dark">{item.item_name}</div>
                            </td>
                            <td><Badge bg="light" text="dark" className="border">{item.unit || '—'}</Badge></td>
                            {opening && <td className="text-muted fw-bold">{openQty ?? '—'}</td>}
                            <td>
                              {wastedQty > 0 ? <div className="fw-bold text-danger">-{wastedQty}</div> : <span className="text-light-emphasis">—</span>}
                            </td>
                            <td className="pe-4">
                              {closing ? (
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
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            {/* Submit only if not yet done */}
            {!closing && (
              <div className="mb-5">
                <Card className="page-card border-0 mb-4">
                  <Card.Body className="p-4">
                    <div className="section-label mb-3"><CsLineIcons icon="note" size="18" /> Remarks</div>
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
                  <Button variant="primary" type="submit" size="lg" className="rounded-pill px-5 fw-bold shadow-sm py-3" disabled={submitting || items.length === 0} style={{ minWidth: '250px' }}>
                    {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="save" className="me-2" />}
                    Save Final Closing Stock
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
            <strong>Only Admin can modify submitted closing stock.</strong> Describe the correction needed and Admin will update the record.
          </Alert>
          <Form.Group>
            <Form.Label>Correction Details <span className="text-danger">*</span></Form.Label>
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
          <Button variant="outline-secondary" onClick={() => setShowCorrectionModal(false)} disabled={sendingCorrection}>Cancel</Button>
          <Button variant="warning" onClick={handleCorrectionRequest} disabled={sendingCorrection}>
            {sendingCorrection ? <Spinner animation="border" size="sm" /> : 'Send to Admin'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DailyClosingStock;

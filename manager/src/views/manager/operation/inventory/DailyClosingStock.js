import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getTodayLog, saveClosingStock, getWastageLog } from 'api/inventory';
import { format } from 'date-fns';

const STATUS_BADGE = {
  manager_verified: { bg: 'success', label: 'Manager Verified' },
  auto_generated: { bg: 'secondary', label: 'Auto Generated' },
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
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <Row className="g-0">
          <Col className="col-auto mb-3 mb-sm-0 me-auto">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="auto" className="d-flex align-items-end gap-2 mb-2">
            <Badge bg="light" text="dark" className="px-3 py-2 fs-6">
              {format(new Date(), 'dd MMM yyyy')}
            </Badge>
            {/* No Edit button — only correction request */}
            {closing && (
              <Button variant="outline-warning" size="sm" onClick={() => setShowCorrectionModal(true)}>
                Request Correction
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

          {/* Summary cards */}
          <Row className="mb-3 g-2">
            <Col md={3} sm={6}>
              <Card className="border-success text-center py-2">
                <Card.Body className="py-2">
                  <div className="text-muted small">Opening Stock Items</div>
                  <div className="h4 mb-0 text-success">{opening ? opening.items.length : '—'}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="border-danger text-center py-2">
                <Card.Body className="py-2">
                  <div className="text-muted small">Today's Wastage Entries</div>
                  <div className="h4 mb-0 text-danger">{todayWastage.length}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="border-warning text-center py-2">
                <Card.Body className="py-2">
                  <div className="text-muted small">Total Wasted Today</div>
                  <div className="h4 mb-0 text-warning">{totalWaste}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="border-primary text-center py-2">
                <Card.Body className="py-2">
                  <div className="text-muted small">Live Stock Items</div>
                  <div className="h4 mb-0 text-primary">{liveStock.length}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Form onSubmit={handleSubmit}>
            <Card className="mb-3">
              <Card.Header className="py-2">
                <h6 className="mb-0">Closing Stock Quantities</h6>
                <small className="text-muted">
                  {closing
                    ? 'Submitted closing stock — read only. Contact Admin for corrections.'
                    : 'Quantities pre-filled from current system stock. Adjust if your physical count differs.'}
                </small>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase text-muted text-small ps-3">Item</th>
                      <th className="text-uppercase text-muted text-small">Unit</th>
                      {opening && <th className="text-uppercase text-muted text-small">Opening</th>}
                      <th className="text-uppercase text-muted text-small text-danger">Wasted Today</th>
                      <th className="text-uppercase text-muted text-small">Closing Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={5} className="text-center text-muted py-4">No stock items found.</td></tr>
                    ) : items.map((item, idx) => {
                      const openQty = opening?.items?.find((o) => o.item_name === item.item_name)?.quantity;
                      const wastedQty = wastageSummary[item.item_name] || 0;
                      return (
                        <tr key={idx} className={wastedQty > 0 ? 'table-warning' : ''}>
                          <td className="align-middle fw-semibold ps-3">{item.item_name}</td>
                          <td className="align-middle text-muted">{item.unit || '—'}</td>
                          {opening && <td className="align-middle text-muted">{openQty ?? '—'}</td>}
                          <td className="align-middle">
                            {wastedQty > 0 ? <span className="text-danger fw-bold">-{wastedQty}</span> : <span className="text-muted">—</span>}
                          </td>
                          <td className="align-middle" style={{ width: 180 }}>
                            {closing ? (
                              <span className="fw-bold">{item.quantity}</span>
                            ) : (
                              <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => handleQtyChange(idx, e.target.value)}
                                size="sm"
                                style={{ maxWidth: 130 }}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Submit only if not yet done */}
            {!closing && (
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
                        placeholder="End of day observations..."
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
                <Button variant="primary" type="submit" disabled={submitting || items.length === 0}>
                  {submitting ? <Spinner animation="border" size="sm" /> : 'Save Closing Stock'}
                </Button>
              </>
            )}
          </Form>
        </>
      )}

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

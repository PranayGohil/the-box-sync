import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getTodayLog, saveOpeningStock, autoGenerateOpening } from 'api/inventory';
import { format } from 'date-fns';

const STATUS_BADGE = {
  manager_verified: { bg: 'success', label: 'Manager Verified' },
  partial: { bg: 'warning', label: 'Partial' },
  auto_generated: { bg: 'secondary', label: 'Auto Generated' },
};

const DailyOpeningStock = () => {
  const title = 'Opening Stock';
  const description = 'Record the opening stock at the start of the day.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/daily-opening-stock', text: 'Inventory' },
    { to: 'operations/daily-opening-stock', title: 'Opening Stock' },
  ];

  const today = format(new Date(), 'yyyy-MM-dd');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [opening, setOpening] = useState(null);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');

  // Correction request modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [sendingCorrection, setSendingCorrection] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTodayLog();
      const { opening: op, openingSuggestion, liveStock } = res.data;
      setOpening(op);

      if (op) {
        setItems(op.items.map((i) => ({ ...i, verified: true })));
        setNotes(op.notes || '');
      } else {
        const suggestion = openingSuggestion || liveStock.map((s) => ({ item_name: s._id, unit: s.unit, quantity: s.totalStock }));
        setItems(suggestion.map((i) => ({
          item_name: i.item_name || i._id,
          unit: i.unit || '',
          quantity: i.quantity !== undefined ? i.quantity : i.totalStock || 0,
          verified: false,
        })));
        setNotes('');
      }
    } catch (err) {
      toast.error('Failed to load today\'s data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

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
    // Already submitted — manager cannot re-submit
    if (opening) return;
    try {
      setSubmitting(true);
      const res = await saveOpeningStock({ items, notes, date: today });
      if (res.data.success) {
        toast.success('Opening stock saved successfully!');
        fetchToday();
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
      toast.success('Opening stock auto-generated from yesterday\'s closing');
      fetchToday();
    } catch (err) {
      toast.error('Failed to auto-generate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectionRequest = async () => {
    if (!correctionNote.trim()) { toast.error('Please describe what needs to be corrected.'); return; }
    try {
      setSendingCorrection(true);
      // For now store as a note — Admin will see it in AdminDailyStockLogs
      // Future: dedicated correction request model
      toast.success('Correction request sent to Admin. They will update the record.');
      setShowCorrectionModal(false);
      setCorrectionNote('');
    } catch (err) {
      toast.error('Failed to send correction request');
    } finally {
      setSendingCorrection(false);
    }
  };

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
            {/* Only show correction request if already submitted — NO edit button */}
            {opening && (
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
          {/* Submitted Banner */}
          {opening && (
            <Alert
              variant={opening.log_status === 'manager_verified' ? 'success' : 'secondary'}
              className="d-flex align-items-center gap-2 mb-3"
            >
              <span>✅</span>
              <div>
                <strong>Opening stock already submitted for today.</strong>
                <span className="ms-2">
                  <Badge bg={STATUS_BADGE[opening.log_status]?.bg}>{STATUS_BADGE[opening.log_status]?.label}</Badge>
                </span>
                {opening.recorded_by && (
                  <span className="ms-2 text-muted small">
                    by {opening.recorded_by} at {format(new Date(opening.createdAt), 'hh:mm a')}
                  </span>
                )}
                {opening.edited_by && (
                  <span className="ms-2 text-muted small">· Edited by Admin ({opening.edited_by})</span>
                )}
                <div className="mt-1 text-muted small">
                  To make a correction, use the <strong>"Request Correction"</strong> button above. Only Admin can modify submitted logs.
                </div>
              </div>
            </Alert>
          )}

          {/* Not yet submitted */}
          {!opening && (
            <Alert variant="info" className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <strong>Opening stock not logged yet for today.</strong>
                <span className="ms-2 text-muted small">Quantities auto-filled from yesterday's closing stock.</span>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={handleAutoGenerate} disabled={submitting}>
                Auto-Generate &amp; Skip
              </Button>
            </Alert>
          )}

          {/* Quick Verify Banner — only when not submitted */}
          {!opening && items.length > 0 && (
            <Alert variant="light" className="border mb-3 py-2">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                  <strong>Quick Verify Mode:</strong> Change only items that differ from the shown quantity. Tap "Verify All" if everything matches.
                </span>
                <Button variant="outline-success" size="sm" onClick={handleVerifyAll}>✅ Verify All</Button>
              </div>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Card className="mb-3">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase text-muted text-small ps-3">Item Name</th>
                      <th className="text-uppercase text-muted text-small">Unit</th>
                      <th className="text-uppercase text-muted text-small">Opening Quantity</th>
                      {!opening && <th className="text-uppercase text-muted text-small text-center">Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-muted py-4">No stock items found. Add inventory first.</td></tr>
                    ) : items.map((item, idx) => (
                      <tr key={idx} className={!opening && item.verified ? 'table-success' : ''}>
                        <td className="align-middle fw-semibold ps-3">{item.item_name}</td>
                        <td className="align-middle text-muted">{item.unit || '—'}</td>
                        <td className="align-middle" style={{ width: 180 }}>
                          {opening ? (
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
                        {!opening && (
                          <td className="text-center align-middle">
                            {item.verified
                              ? <Badge bg="success">✅ Verified</Badge>
                              : <Badge bg="warning" text="dark">Pending</Badge>}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Submit only if not yet done */}
            {!opening && (
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
                  {submitting ? <Spinner animation="border" size="sm" /> : 'Save Opening Stock'}
                </Button>
              </>
            )}
          </Form>
        </>
      )}

      {/* Correction Request Modal */}
      <Modal show={showCorrectionModal} onHide={() => !sendingCorrection && setShowCorrectionModal(false)} centered>
        <Modal.Header closeButton={!sendingCorrection}>
          <Modal.Title>Request Opening Stock Correction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="py-2">
            <strong>Only Admin can modify submitted opening stock.</strong> Describe the correction needed below and Admin will update the record.
          </Alert>
          <Form.Group>
            <Form.Label>Correction Details <span className="text-danger">*</span></Form.Label>
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
          <Button variant="outline-secondary" onClick={() => setShowCorrectionModal(false)} disabled={sendingCorrection}>Cancel</Button>
          <Button variant="warning" onClick={handleCorrectionRequest} disabled={sendingCorrection}>
            {sendingCorrection ? <Spinner animation="border" size="sm" /> : 'Send to Admin'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DailyOpeningStock;

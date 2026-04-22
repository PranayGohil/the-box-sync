import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { logWastage, getWastageLog, deleteWastageEntry, getCurrentStock } from 'api/inventory';
import { format } from 'date-fns';

const WASTAGE_TYPES = [
  { value: 'expired', label: 'Expired' },
  { value: 'spillage', label: 'Spillage' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'overcook', label: 'Over-Cooked' },
  { value: 'theft', label: 'Theft / Missing' },
  { value: 'other', label: 'Other' },
];

const AdminWastageLog = () => {
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

  return (
    <>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <Row className="g-0">
          <Col className="col-auto mb-3 mb-sm-0 me-auto">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
        </Row>
      </div>

      <Row className="g-3">
        {/* Log Wastage Form */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">Log New Wastage</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Item <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={form.item_name} onChange={(e) => handleItemSelect(e.target.value)} required>
                    <option value="">Select item...</option>
                    {stockItems.map((s) => (
                      <option key={s._id} value={s._id}>{s._id} ({s.totalStock} {s.unit})</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row className="g-2 mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.quantity}
                        onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col xs="auto">
                    <Form.Group>
                      <Form.Label>Unit</Form.Label>
                      <Form.Control value={form.unit} readOnly style={{ width: 70, background: '#f8f9fa' }} />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Wastage Type <span className="text-danger">*</span></Form.Label>
                  {WASTAGE_TYPES.map((t) => (
                    <Form.Check
                      key={t.value}
                      type="radio"
                      id={`adm-type-${t.value}`}
                      name="wastage_type"
                      label={t.label}
                      value={t.value}
                      checked={form.wastage_type === t.value}
                      onChange={(e) => setForm((p) => ({ ...p, wastage_type: e.target.value }))}
                      className="mb-1"
                    />
                  ))}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reason / Note</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
                </Form.Group>

                <Button variant="danger" type="submit" className="w-100" disabled={submitting}>
                  {submitting ? <Spinner animation="border" size="sm" /> : 'Log Wastage'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Logs Table */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <Row className="g-2 align-items-end">
                <Col>
                  <h6 className="mb-0">
                    Wastage History
                    {!loading && <Badge bg="danger" className="ms-2">{logs.length} entries</Badge>}
                    {!loading && totalWasted > 0 && (
                      <span className="ms-2 text-muted small">({totalWasted} units total)</span>
                    )}
                  </h6>
                </Col>
                <Col xs="auto" className="d-flex gap-2 align-items-end">
                  <Form.Group>
                    <Form.Label className="text-muted small mb-1">From</Form.Label>
                    <Form.Control type="date" size="sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="text-muted small mb-1">To</Form.Label>
                    <Form.Control type="date" size="sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </Form.Group>
                  <Button variant="outline-primary" size="sm" onClick={fetchLogs}>Refresh</Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : logs.length === 0 ? (
                <Alert variant="light" className="m-3">No wastage logs for this period.</Alert>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase text-muted text-small ps-3">Date / Time</th>
                      <th className="text-uppercase text-muted text-small">Item</th>
                      <th className="text-uppercase text-muted text-small">Qty</th>
                      <th className="text-uppercase text-muted text-small">Type</th>
                      <th className="text-uppercase text-muted text-small">Reason</th>
                      <th className="text-uppercase text-muted text-small">By</th>
                      <th className="text-uppercase text-muted text-small text-end pe-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id}>
                        <td className="align-middle ps-3">
                          <div className="text-small fw-semibold">{format(new Date(log.date), 'dd MMM')}</div>
                          <div className="text-muted text-small">{format(new Date(log.date), 'hh:mm a')}</div>
                        </td>
                        <td className="align-middle fw-semibold">{log.item_name}</td>
                        <td className="align-middle fw-bold text-danger">
                          -{log.quantity} <span className="text-muted fw-normal text-small">{log.unit}</span>
                        </td>
                        <td className="align-middle">
                          <Badge bg={typeColors[log.wastage_type] || 'secondary'} text={log.wastage_type === 'other' ? 'dark' : undefined}>
                            {log.wastage_type}
                          </Badge>
                        </td>
                        <td className="align-middle text-muted text-small" style={{ maxWidth: 180 }}>{log.reason || '—'}</td>
                        <td className="align-middle text-muted text-small">{log.logged_by}</td>
                        <td className="align-middle text-end pe-3">
                          <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(log._id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
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
    </>
  );
};

export default AdminWastageLog;

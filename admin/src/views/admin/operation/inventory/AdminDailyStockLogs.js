import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getDailyLogHistory, updateDailyLog, getCurrentStock } from 'api/inventory';
import { format, subDays } from 'date-fns';

const STATUS_CONFIG = {
  manager_verified: { bg: 'success', label: 'Manager Verified' },
  partial: { bg: 'warning', label: 'Partial' },
  auto_generated: { bg: 'secondary', label: 'Auto Generated' },
};

const AdminDailyStockLogs = () => {
  const title = 'Daily Stock Logs';
  const description = 'View and correct daily opening and closing stock records.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/daily-stock-logs', text: 'Inventory' },
    { to: 'operations/daily-stock-logs', title: 'Daily Stock Logs' },
  ];

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Live stock for reference
  const [liveStock, setLiveStock] = useState([]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDailyLogHistory({ from: fromDate, to: toDate, limit: 100 });
      setLogs(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const fetchLiveStock = useCallback(async () => {
    try {
      const res = await getCurrentStock();
      setLiveStock(res.data.data || []);
    } catch (err) {
      console.error('Failed to load live stock:', err);
    }
  }, []);

  useEffect(() => { fetchLogs(); fetchLiveStock(); }, [fetchLogs, fetchLiveStock]);

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
      toast.success('Log updated successfully');
      setShowEdit(false);
      fetchLogs();
    } catch (err) {
      toast.error('Failed to update log');
    } finally {
      setSaving(false);
    }
  };

  // Group logs by date
  const grouped = logs.reduce((acc, log) => {
    const dateKey = format(new Date(log.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = {};
    acc[dateKey][log.shift] = log;
    return acc;
  }, {});

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

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="text-muted small">From Date</Form.Label>
              <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="text-muted small">To Date</Form.Label>
              <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={fetchLogs} disabled={loading}>
                <CsLineIcons icon="sync" className="me-1" size="14" /> {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <Alert variant="light" className="text-center py-5">No daily stock logs found for this period.</Alert>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([dateKey, shifts]) => {
          const { opening, closing } = shifts;
          const allItems = [...new Set([
            ...(opening?.items || []).map((i) => i.item_name),
            ...(closing?.items || []).map((i) => i.item_name),
          ])];

          return (
            <Card key={dateKey} className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <CsLineIcons icon="calendar" className="me-2" size="16" />
                  {format(new Date(dateKey), 'EEEE, dd MMMM yyyy')}
                </h6>
                <div className="d-flex gap-2">
                  {opening && <Badge bg={STATUS_CONFIG[opening.log_status]?.bg}>Opening: {STATUS_CONFIG[opening.log_status]?.label}</Badge>}
                  {closing && <Badge bg={STATUS_CONFIG[closing.log_status]?.bg}>Closing: {STATUS_CONFIG[closing.log_status]?.label}</Badge>}
                  {!opening && <Badge bg="danger">No Opening</Badge>}
                  {!closing && <Badge bg="warning">No Closing</Badge>}
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 text-small">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase text-muted text-small ps-3">Item</th>
                      <th className="text-uppercase text-muted text-small">Unit</th>
                      <th className="text-uppercase text-muted text-small text-success">Opening Qty</th>
                      <th className="text-uppercase text-muted text-small text-primary">Closing Qty</th>
                      <th className="text-uppercase text-muted text-small">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItems.slice(0, 10).map((name) => {
                      const openQty = opening?.items?.find((i) => i.item_name === name)?.quantity;
                      const closeQty = closing?.items?.find((i) => i.item_name === name)?.quantity;
                      const diff = openQty !== undefined && closeQty !== undefined ? closeQty - openQty : null;
                      const unit = opening?.items?.find((i) => i.item_name === name)?.unit || closing?.items?.find((i) => i.item_name === name)?.unit || '';
                      return (
                        <tr key={name}>
                          <td className="align-middle fw-semibold ps-3">{name}</td>
                          <td className="align-middle text-muted">{unit}</td>
                          <td className="align-middle text-success fw-bold">{openQty ?? <span className="text-muted">—</span>}</td>
                          <td className="align-middle text-primary fw-bold">{closeQty ?? <span className="text-muted">—</span>}</td>
                          <td className="align-middle">
                            {diff !== null ? (
                              <span className={diff < 0 ? 'text-danger fw-bold' : diff === 0 ? 'text-muted' : 'text-success fw-bold'}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            ) : <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {allItems.length > 10 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-2 small">
                          +{allItems.length - 10} more items. Click Edit to view all.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
              <Card.Footer className="d-flex gap-2 py-2">
                {opening && (
                  <Button size="sm" variant="outline-success" onClick={() => openEdit(opening)}>
                    <CsLineIcons icon="edit" size="12" className="me-1" /> Edit Opening
                    {opening.edited_by && <span className="ms-1 text-muted">(edited by {opening.edited_by})</span>}
                  </Button>
                )}
                {closing && (
                  <Button size="sm" variant="outline-primary" onClick={() => openEdit(closing)}>
                    <CsLineIcons icon="edit" size="12" className="me-1" /> Edit Closing
                    {closing.edited_by && <span className="ms-1 text-muted">(edited by {closing.edited_by})</span>}
                  </Button>
                )}
              </Card.Footer>
            </Card>
          );
        })
      )}

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => !saving && setShowEdit(false)} size="lg" centered>
        <Modal.Header closeButton={!saving}>
          <Modal.Title>
            Edit {editLog?.shift?.charAt(0).toUpperCase() + editLog?.shift?.slice(1)} Stock —{' '}
            {editLog && format(new Date(editLog.date), 'dd MMM yyyy')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <Table responsive hover>
            <thead className="table-light">
              <tr>
                <th>Item</th>
                <th>Unit</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {editItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="align-middle fw-semibold">{item.item_name}</td>
                  <td className="align-middle text-muted">{item.unit || '—'}</td>
                  <td className="align-middle">
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleEditQty(idx, e.target.value)}
                      size="sm"
                      style={{ maxWidth: 130 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Form.Group className="mt-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control as="textarea" rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
            {saving ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminDailyStockLogs;

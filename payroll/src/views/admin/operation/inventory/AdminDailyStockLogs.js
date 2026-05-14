import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getDailyLogHistory, updateDailyLog } from 'api/inventory';
import { format, subDays } from 'date-fns';

const customStyles = `
    .logs-container {
      background: #f9f9fb;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .filter-bar {
      background: #ffffff !important;
      border-radius: 1rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      padding: 1rem 1.5rem !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.01) !important;
      max-width: 1200px;
      margin: 0 auto 1.5rem;
    }
    .day-log-card {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      padding: 1.25rem 1.5rem !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01) !important;
      max-width: 1200px;
      margin: 0 auto 1rem;
    }
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .log-row-card {
      background: #f8fafc !important;
      border-radius: 0.75rem !important;
      padding: 0.75rem 1rem !important;
      margin-bottom: 0.5rem;
      border: 1px solid #f1f5f9 !important;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
    }
    .log-row-card:hover {
      background: #ffffff !important;
      border-color: #23b3f4 !important;
    }
    .qty-display {
      font-weight: 800;
      font-size: 1rem;
    }
    .status-pill {
      padding: 0.35rem 0.75rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .status-pill.auto { background: #23b3f4; color: #ffffff; }
    .status-pill.verified { background: #10b981; color: #ffffff; }
    .status-pill.partial { background: #f59e0b; color: #ffffff; }
    
    .btn-pill-action {
      border-radius: 50px !important;
      padding: 0.45rem 1.25rem !important;
      font-weight: 700 !important;
      border-width: 2px !important;
      font-size: 0.75rem !important;
      transition: all 0.2s ease;
    }
    .btn-pill-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .modern-input {
      border-radius: 10px !important;
      border: 2px solid #f1f5f9 !important;
      padding: 0.5rem 0.75rem !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
      transition: all 0.2s ease;
    }
    .modern-input:focus {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
    }
    .modern-modal .modal-content {
      border-radius: 1.5rem !important;
      border: none !important;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important;
    }
    .log-header-text {
      font-size: 0.6rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .audit-workstation-row {
      background: #ffffff;
      border: 1.5px solid #f1f5f9;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
    }
    .audit-workstation-row:hover {
      border-color: #23b3f4;
      background: #fcfdfe;
    }

    @media (max-width: 991px) {
      .filter-bar { padding: 1rem !important; margin-bottom: 1.25rem; }
      .day-log-card { padding: 1rem !important; }
      .day-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .log-row-card { flex-direction: column; align-items: flex-start; padding: 1rem !important; }
      .mobile-qty-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        width: 100%;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid #f1f5f9;
      }
    }
`;

const STATUS_CONFIG = {
  manager_verified: { bg: 'success', label: 'Verified', class: 'verified' },
  partial: { bg: 'warning', label: 'Partial', class: 'partial' },
  auto_generated: { bg: 'info', label: 'Auto', class: 'auto' },
};

const AdminDailyStockLogs = () => {
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

  return (
    <div className="logs-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} />
      <div className="container px-3 px-lg-5 pt-3">
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <div><h2 className="fw-bold mb-0" style={{color: brandColor}}>{title}</h2><BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'operations/inventory', text: 'Inventory' }, { to: '', title: 'Logs' }]} /></div>
        </div>

        <Card className="filter-bar border-0">
          <Row className="g-2 align-items-end">
            <Col md={3}><div><div className="log-header-text mb-1">From</div><Form.Control type="date" className="modern-input w-100" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div></Col>
            <Col md={3}><div><div className="log-header-text mb-1">To</div><Form.Control type="date" className="modern-input w-100" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div></Col>
            <Col md="auto"><Button variant="outline-primary" className="btn-pill-action border-2 px-3" onClick={fetchLogs} disabled={loading}>{loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}</Button></Col>
          </Row>
        </Card>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <Alert variant="light" className="day-log-card text-center py-5 border-0 shadow-none"><div className="text-muted">No records found.</div></Alert>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([dateKey, shifts]) => {
            const { opening, closing } = shifts;
            const allItems = [...new Set([...(opening?.items || []).map((i) => i.item_name), ...(closing?.items || []).map((i) => i.item_name)])];

            return (
              <div key={dateKey} className="day-log-card border-0">
                <div className="day-header">
                  <div>
                    <div className="h6 fw-bold mb-1 text-dark"><CsLineIcons icon="calendar" className="me-2 text-primary" size="16" />{format(new Date(dateKey), 'dd MMM yyyy')}</div>
                    <div className="text-muted small fw-bold" style={{letterSpacing: '0.05em'}}>{format(new Date(dateKey), 'EEEE').toUpperCase()} AUDIT</div>
                  </div>
                  <div className="d-flex gap-2">
                    {opening && <Badge className={`status-pill ${STATUS_CONFIG[opening.log_status]?.class}`}>Opening: {STATUS_CONFIG[opening.log_status]?.label}</Badge>}
                    {closing && <Badge className={`status-pill ${STATUS_CONFIG[closing.log_status]?.class}`}>Closing: {STATUS_CONFIG[closing.log_status]?.label}</Badge>}
                  </div>
                </div>

                <div className="d-none d-lg-flex px-3 mb-2">
                  <div style={{flex: 2}} className="log-header-text">Ingredient</div>
                  <div style={{flex: 1}} className="log-header-text">Opening</div>
                  <div style={{flex: 1}} className="log-header-text">Closing</div>
                  <div style={{flex: 1}} className="log-header-text">Reconciliation</div>
                </div>

                {allItems.slice(0, 15).map((name) => {
                  const oItem = opening?.items?.find((i) => i.item_name === name);
                  const cItem = closing?.items?.find((i) => i.item_name === name);
                  const openQty = oItem?.quantity;
                  const closeQty = cItem?.quantity;
                  const unit = oItem?.unit || cItem?.unit || '';
                  const diff = openQty !== undefined && closeQty !== undefined ? closeQty - openQty : null;

                  return (
                    <div key={name} className="log-row-card">
                      <div style={{flex: 2}} className="d-flex align-items-center gap-2">
                        <div className="bg-light p-1 rounded-2 d-flex align-items-center justify-content-center shadow-sm" style={{width: '32px', height: '32px'}}><CsLineIcons icon="box" size="14" className="text-muted" /></div>
                        <div><div className="fw-bold text-dark small">{name}</div><div className="x-small text-muted fw-bold">{unit}</div></div>
                      </div>
                      <div className="d-none d-lg-block" style={{flex: 1}}><div className="qty-display text-primary">{openQty ?? <span className="text-muted small fw-normal">—</span>}</div></div>
                      <div className="d-none d-lg-block" style={{flex: 1}}><div className="qty-display text-success">{closeQty ?? <span className="text-muted small fw-normal">—</span>}</div></div>
                      <div className="d-none d-lg-block" style={{flex: 1}}>
                        {diff !== null ? (
                          <Badge bg={diff < 0 ? 'danger' : diff === 0 ? 'light' : 'success'} className={`status-pill ${diff === 0 ? 'text-muted border' : ''}`} style={{fontSize: '0.55rem'}}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                          </Badge>
                        ) : <span className="text-muted small">—</span>}
                      </div>

                      <div className="mobile-qty-grid d-lg-none">
                        <div><div className="log-header-text mb-1">Open</div><div className="fw-bold text-primary small">{openQty ?? '—'}</div></div>
                        <div><div className="log-header-text mb-1">Close</div><div className="fw-bold text-success small">{closeQty ?? '—'}</div></div>
                        <div><div className="log-header-text mb-1">Diff</div><div className={`fw-bold small ${diff < 0 ? 'text-danger' : 'text-muted'}`}>{diff !== null ? `${diff > 0 ? '+' : ''}${diff}` : '—'}</div></div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-2 d-flex gap-2">
                  {opening && <Button variant="outline-primary" className="btn-pill-action border-2 flex-grow-1 flex-lg-grow-0" onClick={() => openEdit(opening)}><CsLineIcons icon="edit" size="14" className="me-2" /> Adjust Opening</Button>}
                  {closing && <Button variant="outline-success" className="btn-pill-action border-2 flex-grow-1 flex-lg-grow-0" onClick={() => openEdit(closing)}><CsLineIcons icon="edit" size="14" className="me-2" /> Adjust Closing</Button>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal show={showEdit} onHide={() => !saving && setShowEdit(false)} size="lg" centered className="modern-modal">
        <Modal.Header closeButton={!saving} className="border-0 pb-0 shadow-none"><Modal.Title className="fw-bold h4">Audit Reconciliation</Modal.Title></Modal.Header>
        <Modal.Body className="p-4 pt-3">
          <div className="rounded-4 p-3 mb-4 d-flex justify-content-between align-items-center shadow-sm border border-light" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'}}>
            <div><div className="log-header-text mb-1">Active Shift</div><div className="fw-bold text-primary h5 mb-0" style={{letterSpacing: '0.05em'}}>{editLog?.shift?.toUpperCase()}</div></div>
            <div className="text-end"><div className="log-header-text mb-1">Audit Date</div><div className="fw-bold text-dark h5 mb-0">{editLog && format(new Date(editLog.date), 'dd MMM yyyy')}</div></div>
          </div>
          
          <div style={{ maxHeight: '45vh', overflowY: 'auto' }} className="pe-2 custom-scrollbar">
            {editItems.map((item, idx) => (
              <div key={idx} className="audit-workstation-row">
                <div className="d-flex align-items-center gap-3" style={{flex: 1}}>
                   <div className="bg-light p-2 rounded-3"><CsLineIcons icon="box" size="14" className="text-muted" /></div>
                   <div className="fw-bold text-dark">{item.item_name} <span className="text-muted fw-bold small">({item.unit})</span></div>
                </div>
                <div style={{width: '120px'}}><Form.Control type="number" step="0.01" className="modern-input text-center" value={item.quantity} onChange={(e) => handleEditQty(idx, e.target.value)} /></div>
              </div>
            ))}
          </div>

          <Form.Group className="mt-4">
            <Form.Label className="log-header-text mb-2">Audit Notes & Comments</Form.Label>
            <Form.Control as="textarea" rows={2} className="modern-input" placeholder="Explain the reason for this manual adjustment..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4 justify-content-center">
          <Button variant="outline-secondary" className="btn-pill-action border-2 px-4" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</Button>
          <Button variant="outline-primary" className="btn-pill-action border-2 px-4" onClick={handleSaveEdit} disabled={saving}>{saving ? <Spinner animation="border" size="sm" /> : 'Save Changes'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDailyStockLogs;

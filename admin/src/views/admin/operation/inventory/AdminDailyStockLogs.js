import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Col, Row, Card, Form, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getDailyLogHistory, updateDailyLog } from 'api/inventory';
import { format, subDays } from 'date-fns';



const STATUS_CONFIG = {
  manager_verified: { bg: 'success', label: 'Verified', class: 'verified' },
  partial: { bg: 'warning', label: 'Partial', class: 'partial' },
  auto_generated: { bg: 'info', label: 'Auto', class: 'auto' },
};

const AdminDailyStockLogs = () => {
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
    <div className="admin-daily-stock-logs-stock-container pb-5">
      
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
              <div key={dateKey} className="admin-daily-stock-logs-day-log-card border-0">
                <div className="admin-daily-stock-logs-day-header">
                  <div>
                    <div className="h6 fw-bold mb-1 text-dark"><CsLineIcons icon="calendar" className="me-2 text-primary" size="16" />{format(new Date(dateKey), 'dd MMM yyyy')}</div>
                    <div className="text-muted small fw-bold" style={{letterSpacing: '0.05em'}}>{format(new Date(dateKey), 'EEEE').toUpperCase()} AUDIT</div>
                  </div>
                  <div className="d-flex gap-2">
                    {opening && <Badge className={`admin-daily-stock-logs-status-pill ${STATUS_CONFIG[opening.log_status]?.class}`}>Opening: {STATUS_CONFIG[opening.log_status]?.label}</Badge>}
                    {closing && <Badge className={`admin-daily-stock-logs-status-pill ${STATUS_CONFIG[closing.log_status]?.class}`}>Closing: {STATUS_CONFIG[closing.log_status]?.label}</Badge>}
                  </div>
                </div>

                <div className="d-none d-lg-flex px-3 mb-2">
                  <div style={{flex: 2}} className="admin-daily-stock-logs-log-header-text">Ingredient</div>
                  <div style={{flex: 1}} className="admin-daily-stock-logs-log-header-text">Opening</div>
                  <div style={{flex: 1}} className="admin-daily-stock-logs-log-header-text">Closing</div>
                  <div style={{flex: 1}} className="admin-daily-stock-logs-log-header-text">Reconciliation</div>
                </div>

                {allItems.slice(0, 15).map((name) => {
                  const oItem = opening?.items?.find((i) => i.item_name === name);
                  const cItem = closing?.items?.find((i) => i.item_name === name);
                  const openQty = oItem?.quantity;
                  const closeQty = cItem?.quantity;
                  const unit = oItem?.unit || cItem?.unit || '';
                  const diff = openQty !== undefined && closeQty !== undefined ? closeQty - openQty : null;

                  return (
                    <div key={name} className="admin-daily-stock-logs-log-row-card py-3 border-bottom border-light">
                      <Row className="g-0 align-items-center w-100">
                        <Col xs={6} lg={4} className="d-flex align-items-center gap-2">
                          <div className="bg-light p-2 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{width: '40px', height: '40px', borderRadius: '10px'}}>
                            <CsLineIcons icon="box" size="18" className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-bold text-dark small">{name}</div>
                            <div className="x-small text-muted fw-bold text-uppercase" style={{fontSize: '0.6rem', letterSpacing: '0.05em'}}>{unit}</div>
                          </div>
                        </Col>
                        
                        <Col lg={2} className="d-none d-lg-block">
                          <div className="admin-daily-stock-logs-qty-display text-primary fw-bold">{openQty ?? <span className="text-muted small fw-normal">—</span>}</div>
                          <div className="x-small text-muted fw-bold">OPENING</div>
                        </Col>
                        
                        <Col lg={2} className="d-none d-lg-block">
                          <div className="admin-daily-stock-logs-qty-display text-success fw-bold">{closeQty ?? <span className="text-muted small fw-normal">—</span>}</div>
                          <div className="x-small text-muted fw-bold">CLOSING</div>
                        </Col>
                        
                        <Col xs={6} lg={4} className="text-end text-lg-start d-flex flex-column align-items-end align-items-lg-start">
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-lg-none text-end">
                               <div className="d-flex gap-2 align-items-center mb-1">
                                  <span className="x-small text-muted fw-bold">O: {openQty ?? '-'}</span>
                                  <span className="x-small text-muted fw-bold">C: {closeQty ?? '-'}</span>
                               </div>
                            </div>
                            {diff !== null ? (
                              <Badge bg={diff < 0 ? 'danger' : diff === 0 ? 'light' : 'success'} className={`admin-daily-stock-logs-status-pill rounded-pill shadow-sm ${diff === 0 ? 'text-muted border' : ''}`} style={{fontSize: '0.65rem', padding: '0.4rem 0.75rem'}}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)} {unit}
                              </Badge>
                            ) : <span className="text-muted small">—</span>}
                          </div>
                          <div className="x-small text-muted fw-bold d-lg-none mt-1">RECONCILIATION</div>
                        </Col>
                      </Row>
                    </div>
                  );
                })}

                <div className="mt-2 d-flex gap-2">
                  {opening && <Button variant="outline-primary" className="admin-daily-stock-logs-btn-pill-action border-2 flex-grow-1 flex-lg-grow-0" onClick={() => openEdit(opening)}><CsLineIcons icon="edit" size="14" className="me-2" /> Adjust Opening</Button>}
                  {closing && <Button variant="outline-success" className="admin-daily-stock-logs-btn-pill-action border-2 flex-grow-1 flex-lg-grow-0" onClick={() => openEdit(closing)}><CsLineIcons icon="edit" size="14" className="me-2" /> Adjust Closing</Button>}
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
    </div>
  );
};

export default AdminDailyStockLogs;

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Col, Row, Card, Table, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { logWastage, getWastageLog, getCurrentStock } from 'api/inventory';
import { format } from 'date-fns';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

import Select from 'react-select';

const customStyles = `
    .wastage-container {
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
      border-radius: 10px !important;
      padding: 0.4rem 0.8rem !important;
      border: 1.5px solid #f1f5f9 !important;
      font-weight: 600 !important;
      color: #334155 !important;
      transition: all 0.3s ease !important;
      background: #fcfdfe !important;
      height: 40px !important;
    }
    input[type="date"].modern-input {
      padding-right: 0.8rem !important;
      padding-left: 2.2rem !important;
      font-size: 0.85rem !important;
      letter-spacing: -0.5px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: 10px center !important;
      background-size: 14px 14px !important;
    }
    input[type="date"].modern-input::-webkit-calendar-picker-indicator {
      display: none !important;
      -webkit-appearance: none;
      opacity: 0;
    }
    .modern-input:focus {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
      background: #ffffff !important;
    }
    .input-group-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.5rem;
      padding-left: 0.25rem;
    }
    .select-modern .react-select__control {
      border-radius: 10px !important;
      border: 1.5px solid #f1f5f9 !important;
      min-height: 40px !important;
      background: #fcfdfe !important;
      font-weight: 600 !important;
    }
    .select-modern .react-select__control--is-focused {
      border-color: #23b3f4 !important;
      box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
      background: #ffffff !important;
    }
    .history-card {
      border-radius: 1.5rem !important;
      border: none !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important;
    }
    .type-pill {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      padding: 0.5em 1em;
      border-radius: 50px;
    }
`;

const WASTAGE_TYPES = [
  { value: 'expired', label: 'Expired' },
  { value: 'spillage', label: 'Spillage' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'overcook', label: 'Over-Cooked' },
  { value: 'theft', label: 'Theft / Missing' },
  { value: 'other', label: 'Other' },
];

const WastageLog = () => {
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

  // Filters — default to last 7 days to avoid timezone issues hiding today's logs
  const today = format(new Date(), 'yyyy-MM-dd');
  const sevenDaysAgo = format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd');
  const [fromDate, setFromDate] = useState(sevenDaysAgo);
  const [toDate, setToDate] = useState(today);

  // Form
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
      console.error(err);
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

  const totalWasted = logs.reduce((s, l) => s + l.quantity, 0);

  const typeColors = {
    expired: 'danger',
    spillage: 'info',
    damaged: 'warning',
    overcook: 'secondary',
    theft: 'dark',
    other: 'light',
  };

  return (
    <>
      <div className="wastage-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="container-fluid px-lg-5">
          <div className="page-title-container mb-3 mt-n3">
            <Row className="g-3 align-items-center">
              <Col xs="12" md="7">
                <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#23b3f4' }}>{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
            </Row>
          </div>

      <Row className="g-3">
        {/* Log Wastage Form */}
        <Col xs={12} lg={4}>
          <Card className="page-card border-0 mb-4">
            <Card.Body className="p-4">
              <div className="section-label"><CsLineIcons icon="plus" size="18" /> Log New Wastage</div>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <div className="input-group-label">Item <span className="text-danger">*</span></div>
                  <div className="select-modern">
                    <Select
                      classNamePrefix="react-select"
                      options={stockItems.map((s) => ({ value: s._id, label: `${s._id} (${s.totalStock} ${s.unit})` }))}
                      value={form.item_name ? { value: form.item_name, label: form.item_name } : null}
                      onChange={(opt) => handleItemSelect(opt ? opt.value : '')}
                      placeholder="Search and select item..."
                      menuPortalTarget={document.body}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                      required
                    />
                  </div>
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col xs={8}>
                    <Form.Group>
                      <div className="input-group-label">Quantity <span className="text-danger">*</span></div>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        className="modern-input"
                        value={form.quantity}
                        onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={4}>
                    <Form.Group>
                      <div className="input-group-label">Unit</div>
                      <Form.Control className="modern-input text-center bg-light fw-bold" value={form.unit || '—'} readOnly />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <div className="input-group-label">Wastage Type <span className="text-danger">*</span></div>
                  <div className="d-flex flex-wrap gap-2">
                    {WASTAGE_TYPES.map((t) => (
                      <div key={t.value}>
                        <input
                          type="radio"
                          className="btn-check"
                          name="wastage_type"
                          id={`type-${t.value}`}
                          value={t.value}
                          checked={form.wastage_type === t.value}
                          onChange={(e) => setForm((p) => ({ ...p, wastage_type: e.target.value }))}
                        />
                        <label 
                          className={`btn rounded-pill px-3 py-1 fw-bold small ${form.wastage_type === t.value ? 'btn-primary text-white shadow-sm' : 'btn-outline-light text-dark border-light-subtle'}`} 
                          htmlFor={`type-${t.value}`}
                        >
                          {t.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <div className="input-group-label">Reason / Note</div>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    className="modern-input"
                    style={{ height: 'auto' }}
                    value={form.reason}
                    onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="Describe why this is being wasted..."
                  />
                </Form.Group>

                <Button variant="danger" type="submit" className="w-100 rounded-pill fw-bold py-3 shadow-sm border-0" disabled={submitting}>
                  {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : <CsLineIcons icon="check-circle" className="me-2" />}
                  Log Wastage Entry
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={8}>
          <Card className="page-card border-0 overflow-hidden">
            <Card.Body className="p-0">
              <div className="p-4 bg-white border-bottom">
                <Row className="g-3 align-items-center">
                  <Col>
                    <div className="section-label mb-0"><CsLineIcons icon="history" size="18" /> Wastage History</div>
                  </Col>
                  <Col xs={12} md="auto">
                    <div className="d-flex flex-row flex-md-nowrap gap-2 justify-content-md-end align-items-end">
                      <div className="flex-grow-1" style={{ minWidth: '140px' }}>
                        <div className="input-group-label small mb-1 text-truncate">From</div>
                        <Form.Control 
                          type="date" 
                          className="modern-input w-100" 
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'%2364748b\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '10px center', backgroundSize: '14px 14px' }}
                          value={fromDate} 
                          onChange={(e) => setFromDate(e.target.value)} 
                        />
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: '140px' }}>
                        <div className="input-group-label small mb-1 text-truncate">To</div>
                        <Form.Control 
                          type="date" 
                          className="modern-input w-100" 
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'%2364748b\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '10px center', backgroundSize: '14px 14px' }}
                          value={toDate} 
                          onChange={(e) => setToDate(e.target.value)} 
                        />
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="p-0">
                {loading ? (
                  <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : logs.length === 0 ? (
                  <Alert variant="light" className="m-4 rounded-4 border-0 text-center py-5">
                    <CsLineIcons icon="info-circle" size="24" className="text-muted mb-2" />
                    <div className="fw-bold text-muted">No wastage records found for this period.</div>
                  </Alert>
                ) : (
                  <>
                    <div className="table-responsive d-none d-lg-block">
                      <Table hover className="mb-0 align-middle">
                        <thead className="bg-light text-muted small text-uppercase fw-bold">
                          <tr>
                            <th className="ps-4 py-3">Date / Time</th>
                            <th className="py-3">Item</th>
                            <th className="py-3">Qty</th>
                            <th className="py-3">Type</th>
                            <th className="py-3">Reason</th>
                            <th className="py-3 pe-4 text-end">By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => (
                            <tr key={log._id}>
                              <td className="ps-4">
                                <div className="fw-bold text-dark">{format(new Date(log.date), 'dd MMM')}</div>
                                <div className="text-muted small">{format(new Date(log.date), 'hh:mm a')}</div>
                              </td>
                              <td className="fw-bold text-primary">{log.item_name}</td>
                              <td>
                                <div className="fw-bold text-danger">-{log.quantity}</div>
                                <div className="text-muted small">{log.unit}</div>
                              </td>
                              <td>
                                <Badge className={`type-pill bg-${typeColors[log.wastage_type] || 'secondary'} text-uppercase`}>
                                  {log.wastage_type}
                                </Badge>
                              </td>
                              <td className="text-muted small" style={{ maxWidth: 200 }}>
                                {log.reason ? `"${log.reason}"` : <span className="text-light-emphasis">No note provided</span>}
                              </td>
                              <td className="pe-4 text-end">
                                <div className="fw-bold small">{log.logged_by}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    <div className="d-lg-none p-3">
                      {logs.map((log) => (
                        <div key={log._id} className="admin-wastage-log-mobile-row-card p-3 mb-3 border border-light-subtle rounded-3 shadow-sm bg-white">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <div className="bg-light p-2 rounded-xl d-flex align-items-center justify-content-center shadow-sm" style={{width: '40px', height: '40px', borderRadius: '10px'}}>
                                <CsLineIcons icon="box" size="18" className="text-danger" />
                              </div>
                              <div>
                                <div className="fw-bold text-dark small">{log.item_name}</div>
                                <div className="x-small text-muted fw-bold">{format(new Date(log.date), 'dd MMM yyyy')}</div>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded-2">
                            <div>
                              <div className="x-small text-muted fw-bold text-uppercase" style={{fontSize: '0.55rem'}}>Quantity</div>
                              <div className="fw-bold text-danger">{log.quantity} {log.unit}</div>
                            </div>
                            <Badge bg={typeColors[log.wastage_type] || 'secondary'} className="text-uppercase px-3 py-2 rounded-pill" style={{fontSize: '0.6rem'}}>{log.wastage_type}</Badge>
                          </div>
                          {log.reason && (
                            <div className="mt-2 p-2 small text-muted fst-italic bg-light-subtle rounded-2" style={{fontSize: '0.75rem'}}>
                              "{log.reason}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card.Body>
            {logs.length > 0 && (
              <Card.Footer className="bg-light-subtle border-0 py-3 px-4">
                <div className="d-flex align-items-center text-muted small">
                  <CsLineIcons icon="shield" size="14" className="me-2" />
                  Only administrators can modify or remove wastage history records.
                </div>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  </div>
    </>
  );
};

export default WastageLog;

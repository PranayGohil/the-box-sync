import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import { Badge, Button, Col, Row, Modal, Spinner, Alert, Card, Form, Table, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { AuthContext } from 'contexts/AuthContext';
import Select from 'react-select';
import { format } from 'date-fns';

// ── API Imports ──────────────────────────────────────────────────────────────
import {
  getCurrentStock,
  updateItemSettings,
  getDailyReport,
  getWastageLog,
  deleteWastageEntry,
  getCorrectionRequests,
  resolveCorrectionRequest,
  getAIInsights
} from 'api/inventory';

// ── Custom Shared Styles ─────────────────────────────────────────────────────
const customStyles = `
  .workstation-container {
    background: #f8fafc;
    min-height: 100vh;
    padding-bottom: 5rem;
  }
  .nav-pills-custom {
    border-bottom: 2px solid #f1f5f9 !important;
    gap: 0.5rem;
    margin-bottom: 2rem !important;
    padding-bottom: 0.75rem !important;
    display: flex;
    flex-wrap: wrap;
  }
  .nav-pills-custom .nav-link {
    border-radius: 50px !important;
    padding: 0.6rem 1.5rem !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    color: #64748b !important;
    background: #ffffff !important;
    border: 1.5px solid #e2e8f0 !important;
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    transition: all 0.2s ease-in-out !important;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .nav-pills-custom .nav-link:hover {
    color: #23b3f4 !important;
    border-color: #23b3f4 !important;
    background: #f0f9ff !important;
  }
  .nav-pills-custom .nav-link.active {
    color: #ffffff !important;
    background: #23b3f4 !important;
    border-color: #23b3f4 !important;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .nav-pills-custom .nav-link svg {
    stroke: currentColor;
    transition: stroke 0.2s ease;
  }
  .nav-pills-custom .nav-link:hover svg {
    stroke: #23b3f4;
  }
  .nav-pills-custom .nav-link.active svg {
    stroke: #ffffff;
  }
  .workstation-card {
    background: #ffffff !important;
    border-radius: 1.5rem !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01) !important;
    overflow: hidden;
  }
  .table-reconcile thead th {
    background: #f8fafc;
    color: #475569;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1rem 1.25rem;
    border-bottom: 2px solid #e2e8f0;
  }
  .table-reconcile tbody td {
    padding: 1rem 1.25rem;
    font-size: 0.875rem;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }
  .modern-input {
    border-radius: 10px !important;
    border: 1.5px solid #e2e8f0 !important;
    padding: 0.5rem 1rem !important;
    font-weight: 600 !important;
    height: 42px !important;
    background: #fcfdfe !important;
    transition: all 0.25s ease !important;
  }
  .modern-input:focus {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 3px rgba(35, 179, 244, 0.1) !important;
    background: #ffffff !important;
  }
  .stats-card-sub {
    border-radius: 1.25rem !important;
    border: 1px solid #f1f5f9 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
  }
  .select-modern .react-select__control {
    border-radius: 10px !important;
    border: 1.5px solid #e2e8f0 !important;
    min-height: 40px !important;
    background: #fcfdfe !important;
    font-weight: 600 !important;
  }
  .select-modern .react-select__control--is-focused {
    border-color: #23b3f4 !important;
    box-shadow: 0 0 0 3px rgba(35, 179, 244, 0.1) !important;
  }
  .inventory-history-status-badge {
    font-size: 0.65rem !important;
    font-weight: 800 !important;
    text-transform: uppercase;
    padding: 0.45rem 1rem !important;
    border-radius: 50px !important;
  }
  .chat-box {
    background: #ffffff;
    border-radius: 1.25rem;
    border: 1px solid #e2e8f0;
    height: 400px;
    overflow-y: auto;
    padding: 1.5rem;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }
  .chat-bubble-assistant {
    background: #f1f5f9;
    color: #1e293b;
    border-radius: 1rem 1rem 1rem 0;
    padding: 0.85rem 1.25rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    max-width: 85%;
    align-self: flex-start;
  }
  .chat-bubble-user {
    background: #23b3f4;
    color: #ffffff;
    border-radius: 1rem 1rem 0 1rem;
    padding: 0.85rem 1.25rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    max-width: 85%;
    align-self: flex-end;
  }
  .workstation-container .btn.prompt-btn {
    font-size: 0.78rem !important;
    font-weight: 700 !important;
    border-radius: 50px !important;
    padding: 0.45rem 1.25rem !important;
    border: 1.5px solid rgba(35, 179, 244, 0.3) !important;
    background: #ffffff !important;
    color: #23b3f4 !important;
    transition: all 0.2s ease !important;
    height: auto !important;
    display: inline-block !important;
  }
  .workstation-container .btn.prompt-btn:hover,
  .workstation-container .btn.prompt-btn:focus,
  .workstation-container .btn.prompt-btn:active {
    background: #23b3f4 !important;
    color: #ffffff !important;
    border-color: #23b3f4 !important;
    box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
  }
  .ai-card-glow {
    border-left: 4px solid #8b5cf6 !important;
  }
  .ai-badge {
    background: linear-gradient(135deg, #8b5cf6, #23b3f4) !important;
    color: #ffffff !important;
    font-weight: 800 !important;
    text-transform: uppercase;
    font-size: 0.65rem !important;
    padding: 0.35rem 0.75rem !important;
    border-radius: 50px !important;
  }
  .workstation-container .btn {
    transition: all 0.2s ease-in-out !important;
  }
  .workstation-container .btn:hover {
    transform: translateY(-2px) !important;
  }
  .workstation-container .btn:not(.btn-sm) {
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
  .workstation-container .btn.btn-sm {
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
  .workstation-container .btn-primary {
    background-color: #23b3f4 !important;
    border-color: #23b3f4 !important;
    box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
  }
  .workstation-container .btn-primary:hover {
    background-color: #179edb !important;
    border-color: #179edb !important;
    box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
  }
  .workstation-container .btn-outline-primary {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #ffffff !important;
  }
  .workstation-container .btn-outline-primary:hover {
    background-color: #23b3f4 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .workstation-container .btn-outline-primary:hover svg {
    stroke: #ffffff !important;
  }
  .workstation-container .btn-outline-warning {
    border: 1px solid #f59e0b !important;
    color: #f59e0b !important;
    background-color: #ffffff !important;
  }
  .workstation-container .btn-outline-warning:hover {
    background-color: #f59e0b !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25) !important;
  }
  .workstation-container .btn-outline-warning:hover svg {
    stroke: #ffffff !important;
  }
  .workstation-container .btn-outline-danger {
    border: 1px solid #ef4444 !important;
    color: #ef4444 !important;
    background-color: #ffffff !important;
  }
  .workstation-container .btn-outline-danger:hover {
    background-color: #ef4444 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
  }
  .workstation-container .btn-outline-danger:hover svg {
    stroke: #ffffff !important;
  }
  .workstation-container .btn-outline-secondary {
    border: 1px solid #64748b !important;
    color: #64748b !important;
    background-color: #ffffff !important;
  }
  .workstation-container .btn-outline-secondary:hover {
    background-color: #64748b !important;
    color: #ffffff !important;
    box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
  }
  .workstation-container .btn-outline-secondary:hover svg {
    stroke: #ffffff !important;
  }
`;

const typeColors = {
  expired: 'danger',
  spillage: 'info',
  damaged: 'warning',
  overcook: 'secondary',
  theft: 'dark',
  other: 'light',
};

// ── Component: Daily Tracker Tab ─────────────────────────────────────────────
const DailyTrackerTab = ({ brandColor }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [openingLog, setOpeningLog] = useState(null);
  const [closingLog, setClosingLog] = useState(null);

  const fetchDailyData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDailyReport({ from: selectedDate, to: selectedDate });
      setReport(res.data);

      const op = (res.data.openings || []).find((o) => o.shift === 'opening');
      const cl = (res.data.closings || []).find((c) => c.shift === 'closing');
      setOpeningLog(op || null);
      setClosingLog(cl || null);
    } catch (err) {
      toast.error('Failed to load daily report log');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  return (
    <Card className="workstation-card border-0 mb-4">
      <Card.Body className="p-4 p-lg-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-1">Daily Reconciliation Board</h4>
            <p className="text-muted small mb-0">Reconcile opening, received, used, wasted, and closing stock metrics</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Form.Control
              type="date"
              className="modern-input"
              style={{ width: '170px' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <Button variant="outline-primary" size="sm" className="rounded-pill p-2" onClick={fetchDailyData}>
              <CsLineIcons icon="refresh-horizontal" size="16" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            {/* Daily Shift Status Row */}
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Card className="stats-card-sub bg-light border-0">
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small fw-bold">MORNING SHIFT</div>
                      <h5 className="mb-0 fw-bold">Opening Stock</h5>
                    </div>
                    <div>
                      {openingLog ? (
                        <Badge bg={openingLog.log_status === 'manager_verified' ? 'success' : 'warning'} className="px-3 py-2 text-uppercase">
                          {openingLog.log_status === 'manager_verified' ? 'Verified by Manager' : 'Auto Generated'}
                        </Badge>
                      ) : (
                        <Badge bg="danger" className="px-3 py-2 text-uppercase">Pending</Badge>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="stats-card-sub bg-light border-0">
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small fw-bold">NIGHT SHIFT</div>
                      <h5 className="mb-0 fw-bold">Closing Stock</h5>
                    </div>
                    <div>
                      {closingLog ? (
                        <Badge bg={closingLog.log_status === 'manager_verified' ? 'success' : 'secondary'} className="px-3 py-2 text-uppercase">
                          {closingLog.log_status === 'manager_verified' ? 'Verified by Manager' : 'Auto Recorded'}
                        </Badge>
                      ) : (
                        <Badge bg="danger" className="px-3 py-2 text-uppercase">Pending</Badge>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="d-flex flex-wrap gap-2 mb-4">
              <Button as={Link} to="/operations/daily-stock-logs" variant="outline-primary" className="rounded-pill fw-bold py-2 px-3 small border-2" size="sm">
                <CsLineIcons icon="file-text" size="14" className="me-1" /> Adjust Log Details (Stock Audit)
              </Button>
            </div>

            {/* Reconciliation Sheet Grid */}
            <div className="table-responsive">
              <Table hover className="align-middle table-reconcile mb-0">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th className="text-center">Opening Stock</th>
                    <th className="text-center">Added Today</th>
                    <th className="text-center">Used Today</th>
                    <th className="text-center">Wasted Today</th>
                    <th className="text-center">Expected Closing</th>
                    <th className="text-center">Actual Closing</th>
                    <th className="text-end">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {(!report || !report.itemSummary || report.itemSummary.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-5 fw-bold">
                        No daily transactions or tracking logs recorded for this date.
                      </td>
                    </tr>
                  ) : (
                    report.itemSummary.map((item, idx) => {
                      const openingQty = item.opening;
                      const closingQty = item.closing;
                      const expected = openingQty !== null ? (openingQty + item.received - item.used - item.wasted) : null;
                      const variance = (closingQty !== null && expected !== null) ? (closingQty - expected) : null;

                      return (
                        <tr key={idx}>
                          <td>
                            <div className="fw-bold text-dark">{item.item_name}</div>
                            <span className="small text-muted text-uppercase">{item.unit || 'unit'}</span>
                          </td>
                          <td className="text-center font-monospace fw-bold text-secondary">
                            {openingQty !== null ? openingQty.toFixed(2) : <span className="text-muted fw-normal">—</span>}
                          </td>
                          <td className="text-center font-monospace fw-bold text-info">
                            {item.received > 0 ? `+${item.received.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-center font-monospace fw-bold text-primary">
                            {item.used > 0 ? `-${item.used.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-center font-monospace fw-bold text-danger">
                            {item.wasted > 0 ? `-${item.wasted.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-center font-monospace fw-bold text-dark">
                            {expected !== null ? expected.toFixed(2) : <span className="text-muted fw-normal">—</span>}
                          </td>
                          <td className="text-center font-monospace fw-bold text-success">
                            {closingQty !== null ? closingQty.toFixed(2) : <span className="text-muted fw-normal">—</span>}
                          </td>
                          <td className="text-end font-monospace">
                            {variance !== null ? (
                              <span className={`fw-bold ${variance < 0 ? 'text-danger' : variance > 0 ? 'text-warning' : 'text-success'}`}>
                                {variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)} {item.unit}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

// ── Component: Stock Control Tab ─────────────────────────────────────────────
const StockControlTab = ({ brandColor }) => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Threshold modal
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [thresholdItem, setThresholdItem] = useState(null);
  const [threshold, setThreshold] = useState('');
  const [trackingLevel, setTrackingLevel] = useState('auto');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await getCurrentStock();
      if (res.data.success) setStockData(res.data.data);
    } catch (err) {
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const openThresholdModal = (item) => {
    setThresholdItem(item);
    setThreshold(item.low_stock_threshold || 0);
    setTrackingLevel(item.tracking_level || 'auto');
    setShowThresholdModal(true);
  };

  const handleThresholdSave = async () => {
    try {
      setIsSubmitting(true);
      await updateItemSettings({
        item_name: thresholdItem._id,
        low_stock_threshold: threshold,
        tracking_level: trackingLevel,
      });
      toast.success('Item settings saved');
      setShowThresholdModal(false);
      fetchStock();
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lowStockCount = stockData.filter((s) => s.low_stock_threshold > 0 && s.totalStock < s.low_stock_threshold).length;

  return (
    <>
      <Card className="workstation-card border-0 mb-4">
        <Card.Body className="p-4 p-lg-5">
          <div className="mb-4">
            <h4 className="fw-bold mb-1">Live Stock Control</h4>
            <p className="text-muted small mb-0">Monitor active quantities, safetymins, and mark ingredients used</p>
          </div>

          {lowStockCount > 0 && (
            <Alert variant="warning" className="border-0 shadow-sm rounded-4 d-flex align-items-center gap-3 mb-4 p-3 bg-light-warning">
              <div className="bg-warning text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <CsLineIcons icon="warning-hexagon" size="20" />
              </div>
              <div>
                <div className="fw-bold text-dark">{lowStockCount} ingredient{lowStockCount > 1 ? 's are' : ' is'} below safety threshold!</div>
                <div className="text-muted small">Please order/purchase fresh inventory to avoid stockouts.</div>
              </div>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : stockData.length === 0 ? (
            <Alert variant="light" className="text-center py-5 border-dashed rounded-4">No tracking items found.</Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle table-reconcile mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Live Stock</th>
                    <th className="text-center">Safety Minimum</th>
                    <th className="text-center">Tracking level</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((item, idx) => {
                    const isBelow = item.low_stock_threshold > 0 && item.totalStock < item.low_stock_threshold;
                    return (
                      <tr key={idx} className={isBelow ? 'bg-danger-subtle' : ''}>
                        <td>
                          <div className="fw-bold text-dark">{item._id}</div>
                          {isBelow && <Badge bg="danger" className="text-uppercase small">Low Stock Alert</Badge>}
                        </td>
                        <td className="text-center font-monospace fw-bold fs-6">
                          <span className={item.totalStock <= 0 ? 'text-danger' : isBelow ? 'text-warning' : 'text-success'}>
                            {item.totalStock.toFixed(2)} <small className="text-muted">{item.unit}</small>
                          </span>
                        </td>
                        <td className="text-center fw-bold">
                          {item.low_stock_threshold > 0 ? (
                            <Badge bg="light" text="dark" className="border px-3 py-2">Min: {item.low_stock_threshold}</Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <Badge bg="secondary" className="text-uppercase">{item.tracking_level || 'auto'}</Badge>
                        </td>
                        <td className="text-end">
                          <Button variant="outline-secondary" size="sm" className="rounded-pill" onClick={() => openThresholdModal(item)}>
                            <CsLineIcons icon="gear" size="14" className="me-1" /> Configure
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Threshold Modal */}
      <Modal show={showThresholdModal} onHide={() => !isSubmitting && setShowThresholdModal(false)} centered>
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title className="fw-bold">Configure Item Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="fw-bold h5 mb-3">{thresholdItem?._id}</div>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Safety Minimum Level</Form.Label>
            <Form.Control
              type="number"
              className="modern-input"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="0 = no alert trigger"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-semibold">Tracking Frequency Strategy</Form.Label>
            <Form.Control as="select" className="modern-input Form-select" value={trackingLevel} onChange={(e) => setTrackingLevel(e.target.value)}>
              <option value="auto">Auto (System only)</option>
              <option value="daily_critical">Daily Critical (Required counting)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Form.Control>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowThresholdModal(false)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleThresholdSave} disabled={isSubmitting}>
            {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Save Settings'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// ── Component: Wastage Logs Tab (Admin can delete logs) ─────────────────────
const WastageLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWastageLog({ from: fromDate, to: toDate, limit: 100 });
      setLogs(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this wastage entry and restore its stock quantity?')) return;
    try {
      setDeletingId(id);
      await deleteWastageEntry(id);
      toast.success('Wastage entry removed and stock restored!');
      fetchLogs();
    } catch (err) {
      toast.error('Failed to delete wastage entry');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="workstation-card border-0 mb-4">
      <Card.Body className="p-0">
        <div className="p-4 border-bottom bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h5 className="fw-bold mb-1">Wastage History Logs</h5>
            <p className="text-muted small mb-0">Revert or review wasted quantities</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Form.Control type="date" className="modern-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Form.Control type="date" className="modern-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : logs.length === 0 ? (
          <Alert variant="light" className="text-center py-5 border-dashed m-4">No wastage logs found.</Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle table-reconcile mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Date/Time</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">{format(new Date(log.date), 'dd MMM')}</div>
                      <small className="text-muted">{format(new Date(log.date), 'hh:mm a')}</small>
                    </td>
                    <td className="fw-bold text-primary">{log.item_name}</td>
                    <td className="fw-bold text-danger">-{log.quantity.toFixed(2)} {log.unit}</td>
                    <td>
                      <Badge bg={typeColors[log.wastage_type] || 'secondary'} className="text-uppercase">{log.wastage_type}</Badge>
                    </td>
                    <td className="text-muted" style={{ maxWidth: '200px' }}>{log.reason || '—'}</td>
                    <td className="pe-4 text-end">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={deletingId === log._id}
                        onClick={() => handleDelete(log._id)}
                      >
                        {deletingId === log._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

// ── Component: Correction Requests Tab ───────────────────────────────────────
const CorrectionRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCorrectionRequests();
      setRequests((res.data.data || []).filter((r) => r.status === 'pending'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleResolve = async (reqId, status) => {
    try {
      setResolvingId(reqId);
      await resolveCorrectionRequest(reqId, { status });
      toast.success(`Request marked as ${status}`);
      fetchRequests();
    } catch (err) {
      toast.error('Failed to update request');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Card className="workstation-card border-0 mb-4">
      <Card.Body className="p-4">
        <h5 className="fw-bold mb-3">Pending Correction Requests</h5>
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
        ) : requests.length === 0 ? (
          <Alert variant="light" className="text-center py-4 border-dashed mb-0">No pending requests</Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle table-reconcile mb-0">
              <thead>
                <tr>
                  <th>Log Date</th>
                  <th>Shift</th>
                  <th>Reason for correction</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td className="fw-bold text-dark">{format(new Date(req.log_date), 'dd MMM yyyy')}</td>
                    <td><Badge bg={req.shift === 'opening' ? 'primary' : 'dark'} className="text-capitalize">{req.shift}</Badge></td>
                    <td className="text-muted">"{req.reason}"</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          as={Link}
                          to="/operations/daily-stock-logs"
                          disabled={resolvingId === req._id}
                        >
                          Adjust Log
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          disabled={resolvingId === req._id}
                          onClick={() => handleResolve(req._id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          disabled={resolvingId === req._id}
                          onClick={() => handleResolve(req._id, 'rejected')}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};


// ── Component: AI Co-pilot Tab ──────────────────────────────────────────────
const AICopilotTab = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am your AI Inventory Co-pilot. I can analyze counts, detect stockout risks, track waste anomalies, or draft supplier orders. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const fetchAIInsights = useCallback(async (customQuery = '') => {
    try {
      setLoading(true);
      const res = await getAIInsights({ customPrompt: customQuery });
      if (res.data.success) {
        setInsights(res.data);
        if (customQuery) {
          setMessages((prev) => [
            ...prev,
            { sender: 'assistant', text: res.data.conversationalSummary },
          ]);
        }
      }
    } catch (err) {
      toast.error("Failed to load AI Insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAIInsights();
  }, [fetchAIInsights]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const query = inputValue;
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputValue('');
    await fetchAIInsights(query);
  };

  const handleQuickPrompt = async (promptText) => {
    setMessages((prev) => [...prev, { sender: 'user', text: promptText }]);
    await fetchAIInsights(promptText);
  };

  return (
    <Row className="g-3">
      {/* Left Chat Column */}
      <Col lg={7}>
        <Card className="workstation-card border-0 mb-4 h-100">
          <Card.Body className="p-4 d-flex flex-column h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="fw-bold mb-1">
                  AI Co-pilot Chat <Badge className="ai-badge ms-2">Gemini Pro</Badge>
                </h5>
                <p className="text-muted small mb-0">Ask questions about inventory levels, order calculations, or trends.</p>
              </div>
            </div>

            {/* Chat Box */}
            <div className="chat-box d-flex flex-column mb-3 flex-grow-1" style={{ minHeight: '350px' }}>
              {messages.map((m, idx) => (
                <div key={idx} className={m.sender === 'user' ? 'chat-bubble-user align-self-end' : 'chat-bubble-assistant align-self-start'}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-bubble-assistant align-self-start d-flex align-items-center gap-2">
                  <Spinner animation="grow" size="sm" variant="primary" />
                  <span>AI Co-pilot is thinking...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button className="prompt-btn" size="sm" onClick={() => handleQuickPrompt("Generate Reorder Draft")}>
                📋 Draft Supplier Order
              </Button>
              <Button className="prompt-btn" size="sm" onClick={() => handleQuickPrompt("Identify ingredients at risk of stockout")}>
                ⚠️ Scan Stockout Risks
              </Button>
              <Button className="prompt-btn" size="sm" onClick={() => handleQuickPrompt("Wastage patterns and anomalies")}>
                🗑️ Wastage Analysis
              </Button>
            </div>

            {/* Chat Input */}
            <Form onSubmit={handleSendMessage} className="d-flex gap-2">
              <Form.Control
                type="text"
                className="modern-input"
                placeholder="Ask Co-pilot..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" variant="primary" className="rounded-pill px-4" disabled={loading || !inputValue.trim()}>
                Send
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      {/* Right Insights Column */}
      <Col lg={5}>
        <Row className="g-3">
          {/* Critical Warnings */}
          <Col xs={12}>
            <Card className="workstation-card border-0 mb-2 ai-card-glow shadow-sm">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-danger mb-2 d-flex align-items-center">
                  <CsLineIcons icon="warning-hexagon" className="me-2 text-danger" size="18" />
                  Critical Stock Warnings
                </h6>
                {insights?.alerts?.length === 0 ? (
                  <p className="text-muted small mb-0">No urgent shortages detected. All counts are safe.</p>
                ) : (
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {insights?.alerts?.map((a, idx) => (
                      <div key={idx} className="mb-2 pb-2 border-bottom last-border-0">
                        <div className="fw-bold small text-dark">{a.item_name}</div>
                        <div className="text-muted small">
                          Stock: <span className="text-danger fw-bold">{a.current_stock}</span> / Min: {a.safety_minimum} ({a.reason})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Wastage Anomalies */}
          <Col xs={12}>
            <Card className="workstation-card border-0 mb-2 ai-card-glow shadow-sm" style={{ borderLeftColor: '#f59e0b' }}>
              <Card.Body className="p-4">
                <h6 className="fw-semibold text-warning mb-2 d-flex align-items-center">
                  <CsLineIcons icon="bin" className="me-2 text-warning" size="18" />
                  High Wastage Anomalies
                </h6>
                {insights?.anomalies?.length === 0 ? (
                  <p className="text-muted small mb-0">Wastage ratios look healthy (&lt;20% of weekly usage).</p>
                ) : (
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {insights?.anomalies?.map((w, idx) => (
                      <div key={idx} className="mb-2 pb-2 border-bottom last-border-0">
                        <div className="fw-bold small text-dark">{w.item_name}</div>
                        <div className="text-muted small">
                          Wasted: <span className="text-warning fw-bold">{w.weekly_wasted} {w.unit}</span> / Wastage Rate: <span className="text-danger fw-bold">{w.wastage_rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Supplier Reorder Draft */}
          <Col xs={12}>
            <Card className="workstation-card border-0 shadow-sm">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-primary mb-2 d-flex align-items-center">
                  <CsLineIcons icon="file-text" className="me-2 text-primary" size="18" />
                  Supplier Purchase Order Draft
                </h6>
                <textarea
                  className="form-control font-monospace small bg-light p-3 border-0 rounded-3 mb-2"
                  rows={6}
                  readOnly
                  value={insights?.reorderDraftText || 'Loading reorder list...'}
                />
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100 rounded-pill fw-bold border-2"
                  disabled={!insights?.reorderList || insights.reorderList.length === 0}
                  onClick={() => {
                    navigator.clipboard.writeText(insights?.reorderDraftText);
                    toast.success("Purchase order copied to clipboard!");
                  }}
                >
                  Copy Order Text
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

// ── Components: Old requested list controllers local definitions ────────────
const RequestedInventory = ({ refreshKey, onRejectClick }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Requested`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, refreshKey]);

  return (
    <Card className="workstation-card border-0 mb-4">
      <Card.Body className="p-4">
        <h5 className="fw-bold mb-3">Requested Inventory</h5>
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
        ) : data.length === 0 ? (
          <Alert variant="light" className="text-center py-4 border-dashed mb-0">No active requests</Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle table-reconcile mb-0">
              <thead>
                <tr>
                  <th>Requested Date</th>
                  <th>Category</th>
                  <th>Items</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.request_date).toLocaleDateString('en-IN')}</td>
                    <td><Badge bg="light" text="dark" className="border">{item.category}</Badge></td>
                    <td>
                      {item.items.map((it, i) => (
                        <div key={i} className="small fw-semibold">
                          {it.item_name} <span className="text-primary">({it.item_quantity} {it.unit})</span>
                        </div>
                      ))}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button variant="outline-success" size="sm" as={Link} to={`/operations/complete-inventory/${item._id}`}>
                          Approve/Complete
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => onRejectClick(item)}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const CompletedInventory = ({ refreshKey, history, onDeleteClick }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompleted = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Completed`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted, refreshKey]);

  return (
    <Card className="workstation-card border-0 mb-4">
      <Card.Body className="p-4">
        <h5 className="fw-bold mb-3">Completed Requests</h5>
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" variant="success" /></div>
        ) : data.length === 0 ? (
          <Alert variant="light" className="text-center py-4 border-dashed mb-0">No records found</Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle table-reconcile mb-0">
              <thead>
                <tr>
                  <th>Fulfill Date</th>
                  <th>Bill Number</th>
                  <th>Vendor</th>
                  <th>Total Amount</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item._id}>
                    <td>{item.bill_date ? new Date(item.bill_date).toLocaleDateString('en-IN') : new Date(item.request_date).toLocaleDateString('en-IN')}</td>
                    <td className="fw-bold text-dark">{item.bill_number || '—'}</td>
                    <td>{item.vendor_name || '—'}</td>
                    <td className="fw-bold text-primary">₹{item.total_amount || 0}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button variant="outline-primary" size="sm" onClick={() => history.push(`/operations/inventory-details/${item._id}`)}>
                          View
                        </Button>
                        <Button variant="outline-warning" size="sm" onClick={() => history.push(`/operations/edit-inventory/${item._id}`)}>
                          Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => onDeleteClick(item)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const RejectedInventory = ({ refreshKey, history, onDeleteClick }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRejected = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get-by-status/Rejected`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRejected();
  }, [fetchRejected, refreshKey]);

  return (
    <Card className="workstation-card border-0 mb-4">
      <Card.Body className="p-4">
        <h5 className="fw-bold mb-3">Rejected Requests</h5>
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" variant="danger" /></div>
        ) : data.length === 0 ? (
          <Alert variant="light" className="text-center py-4 border-dashed mb-0">No records found</Alert>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle table-reconcile mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Reason</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item._id}>
                    <td>{new Date(item.request_date).toLocaleDateString('en-IN')}</td>
                    <td><Badge bg="danger" className="text-uppercase">{item.category}</Badge></td>
                    <td className="text-muted small">"{item.reject_reason || 'No reason provided'}"</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button variant="outline-primary" size="sm" onClick={() => history.push(`/operations/inventory-details/${item._id}`)}>
                          View
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => onDeleteClick(item)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

// ── Main Controller Workstation Component ─────────────────────────────────────
const InventoryHistory = () => {
  const history = useHistory();
  const brandColor = '#23b3f4';
  const title = 'Inventory Control Hub (Admin)';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/inventory-history', text: 'Operations' },
    { to: 'operations/inventory-history', title: 'Inventory Control Hub' }
  ];

  const [activeTab, setActiveTab] = useState('tracker');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingCorrectionCount, setPendingCorrectionCount] = useState(0);

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const fetchCorrectionCount = useCallback(async () => {
    try {
      const res = await getCorrectionRequests();
      const pending = (res.data.data || []).filter((r) => r.status === 'pending');
      setPendingCorrectionCount(pending.length);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCorrectionCount();
  }, [fetchCorrectionCount, refreshKey]);

  const handleDelete = async () => {
    if (!selectedItem?._id) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${selectedItem._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setShowDeleteModal(false);
      triggerRefresh();
      toast.success('Deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete request.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem?._id) return;
    setIsRejecting(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API}/inventory/reject-request/${selectedItem._id}`,
        { reject_reason: rejectReason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setShowRejectModal(false);
      setRejectReason('');
      triggerRefresh();
      toast.success('Inventory rejected successfully!');
    } catch (err) {
      toast.error('Failed to reject request.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="workstation-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} description="Unified Admin Daily Stock and Inventory tracker hub." />
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={breadcrumbs} />
            </Col>
          </Row>
        </div>

        {/* Tab pill navigation */}
        <Nav className="nav-pills-custom mb-4" variant="pills">
          <Nav.Item>
            <Nav.Link className={activeTab === 'tracker' ? 'active' : ''} onClick={() => setActiveTab('tracker')}>
              <CsLineIcons icon="calendar" size="16" className="me-2" /> Daily Stock Tracker
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className={activeTab === 'stock' ? 'active' : ''} onClick={() => setActiveTab('stock')}>
              <CsLineIcons icon="activity" size="16" className="me-2" /> Stock Control
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
              <CsLineIcons icon="boxes" size="16" className="me-2" /> Purchase Requests
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className={activeTab === 'wastage' ? 'active' : ''} onClick={() => setActiveTab('wastage')}>
              <CsLineIcons icon="bin" size="16" className="me-2" /> Wastage Log
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className={activeTab === 'corrections' ? 'active' : ''} onClick={() => setActiveTab('corrections')}>
              <CsLineIcons icon="warning-hexagon" size="16" className="me-2" /> Correction Requests
              {pendingCorrectionCount > 0 && (
                <Badge bg="danger" className="ms-2 rounded-circle" style={{ fontSize: '0.65rem' }}>{pendingCorrectionCount}</Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className={activeTab === 'ai' ? 'active' : ''} onClick={() => setActiveTab('ai')}>
              <CsLineIcons icon="message" size="16" className="me-2" /> AI Co-pilot
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Tab content renderer */}
        {activeTab === 'tracker' && <DailyTrackerTab brandColor={brandColor} />}
        {activeTab === 'stock' && <StockControlTab brandColor={brandColor} />}
        {activeTab === 'requests' && (
          <>
            <RequestedInventory
              refreshKey={refreshKey}
              brandColor={brandColor}
              onRejectClick={(item) => {
                setSelectedItem(item);
                setShowRejectModal(true);
              }}
            />
            <CompletedInventory
              refreshKey={refreshKey}
              history={history}
              onDeleteClick={(item) => {
                setSelectedItem(item);
                setShowDeleteModal(true);
              }}
            />
            <RejectedInventory
              refreshKey={refreshKey}
              history={history}
              onDeleteClick={(item) => {
                setSelectedItem(item);
                setShowDeleteModal(true);
              }}
            />
          </>
        )}
        {activeTab === 'wastage' && <WastageLogsTab />}
        {activeTab === 'corrections' && <CorrectionRequestsTab />}
        {activeTab === 'ai' && <AICopilotTab />}

        {/* Deletion Modal */}
        <Modal show={showDeleteModal} onHide={() => !isDeleting && setShowDeleteModal(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-4">
            <div className="d-flex align-items-center mb-3">
              <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
                <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
              </div>
              <div>
                <p className="mb-0 fw-bold text-dark">Permanently delete this record?</p>
                <p className="mb-1 text-muted small">This clears the inventory request log from history.</p>
                <p className="mb-0 text-success small fw-semibold">Your physical stock quantities remain perfectly safe.</p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" className="rounded-pill px-4 fw-bold border-0 text-muted" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Reject Request Modal */}
        <Modal show={showRejectModal} onHide={() => !isRejecting && setShowRejectModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold text-danger">Reject Request</Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-3">
            <Form.Group>
              <Form.Label className="fw-semibold">Reason for rejection:</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Describe why this request is being rejected..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" className="rounded-pill px-4 fw-bold border-0 text-muted" onClick={() => setShowRejectModal(false)} disabled={isRejecting}>
              Cancel
            </Button>
            <Button variant="danger" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default InventoryHistory;

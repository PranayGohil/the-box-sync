import React, { useState, useEffect } from 'react';
import { Button, Col, Row, Modal, Form, Spinner, Card, Table, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getCurrentStock, useInventoryStock, updateItemSettings } from 'api/inventory';

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
    .modern-input {
      border-radius: 12px !important;
      padding: 0.8rem 1.25rem !important;
      border: 1.5px solid #f1f5f9 !important;
      font-weight: 600 !important;
      color: #334155 !important;
      transition: all 0.3s ease !important;
      background: #fcfdfe !important;
      height: 52px !important;
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
    .stock-badge {
      font-size: 0.85rem;
      font-weight: 800;
      padding: 0.5rem 1rem;
      border-radius: 50px;
    }
    .track-pill {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.4rem 0.8rem;
      border-radius: 50px;
      border: 1px solid rgba(0,0,0,0.05);
    }
`;

const TRACKING_LEVELS = [
  { value: 'daily_critical', label: '🔴 Daily Critical', desc: 'Verified every day' },
  { value: 'weekly', label: '🟡 Weekly', desc: 'Verified once a week' },
  { value: 'monthly', label: '🟢 Monthly', desc: 'Verified once a month' },
  { value: 'auto', label: '⚪ Auto Only', desc: 'System tracks, no manual check' },
];

const StockManagement = () => {
  const title = 'Stock Management';
  const description = 'Monitor current stock levels, configure alert thresholds, and deduct stock.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/stock-management', text: 'Operations' },
    { to: 'operations/stock-management', title: 'Stock Management' },
  ];

  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use stock modal
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityUsed, setQuantityUsed] = useState('');
  const [useComment, setUseComment] = useState('');

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

  useEffect(() => { fetchStock(); }, []);

  const handleUseSubmit = async (e) => {
    e.preventDefault();
    if (!quantityUsed || Number(quantityUsed) <= 0) { toast.error('Please enter a valid quantity'); return; }
    try {
      setIsSubmitting(true);
      const res = await useInventoryStock({ item_name: selectedItem._id, quantity_used: quantityUsed, comment: useComment });
      if (res.data.success) {
        toast.success('Stock deducted successfully');
        setShowUseModal(false); setSelectedItem(null); setQuantityUsed(''); setUseComment('');
        fetchStock();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deduct stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openThresholdModal = (item) => {
    setThresholdItem(item);
    setThreshold(item.low_stock_threshold || 0);
    setTrackingLevel(item.tracking_level || 'auto');
    setShowThresholdModal(true);
  };

  const handleThresholdSave = async () => {
    try {
      setIsSubmitting(true);
      await updateItemSettings({ item_name: thresholdItem._id, low_stock_threshold: threshold, tracking_level: trackingLevel });
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
                <Button variant="outline-danger" className="rounded-pill fw-bold px-4" href="/operations/wastage-log">
                  <CsLineIcons icon="bin" size="14" className="me-2" /> Log Wastage
                </Button>
              </Col>
            </Row>
          </div>

      {lowStockCount > 0 && (
        <Alert variant="warning" className="border-0 shadow-sm rounded-4 d-flex align-items-center gap-3 mb-4 p-3 bg-white">
          <div className="bg-warning text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <CsLineIcons icon="warning-hexagon" size="20" />
          </div>
          <div>
            <div className="fw-bold text-dark">{lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} below threshold!</div>
            <div className="text-muted small">Please restock or verify critical inventory levels.</div>
          </div>
        </Alert>
      )}

      <Row>
        <Col xs={12}>
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : stockData.length === 0 ? (
            <Alert variant="light" className="text-center py-5 rounded-4 border-0 shadow-sm">
              <CsLineIcons icon="info-circle" size="30" className="text-muted mb-2" />
              <div className="fw-bold text-muted">No inventory data found.</div>
            </Alert>
          ) : (
            <Card className="page-card border-0 overflow-hidden">
              <Card.Body className="p-0">
                <div className="p-4 bg-white border-bottom">
                  <div className="section-label mb-0"><CsLineIcons icon="box" size="18" /> Inventory List</div>
                </div>
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="bg-light text-muted small text-uppercase fw-bold">
                      <tr>
                        <th className="ps-4 py-3">Item Name</th>
                        <th className="py-3">Current Stock</th>
                        <th className="py-3">Alert Threshold</th>
                        <th className="py-3">Tracking</th>
                        <th className="py-3 pe-4 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData.map((item, index) => {
                        const isBelowThreshold = item.low_stock_threshold > 0 && item.totalStock < item.low_stock_threshold;
                        return (
                          <tr key={index} className={isBelowThreshold ? 'bg-danger-subtle' : ''}>
                            <td className="ps-4">
                              <div className="fw-bold text-dark">
                                {isBelowThreshold && <span className="text-danger me-2">⚠️</span>}
                                {item._id}
                              </div>
                            </td>
                            <td>
                              <Badge className={`stock-badge bg-${item.totalStock <= 0 ? 'danger' : isBelowThreshold ? 'warning' : 'success'}-subtle text-${item.totalStock <= 0 ? 'danger' : isBelowThreshold ? 'warning' : 'success'}`}>
                                {item.totalStock} <small className="fw-normal">{item.unit}</small>
                              </Badge>
                            </td>
                            <td>
                              {item.low_stock_threshold > 0 ? (
                                <div className="d-flex align-items-center text-muted fw-bold small">
                                  <CsLineIcons icon="notification" size="12" className="me-1" />
                                  Min: {item.low_stock_threshold}
                                </div>
                              ) : <span className="text-light-emphasis small italic">Not set</span>}
                            </td>
                            <td>
                              <span className="track-pill bg-white text-muted">{item.tracking_level || 'auto'}</span>
                            </td>
                            <td className="pe-4 text-end">
                              <div className="d-flex gap-2 justify-content-end">
                                <Button size="sm" variant="light" className="rounded-pill border shadow-sm p-2" onClick={() => openThresholdModal(item)}>
                                  <CsLineIcons icon="gear" size="14" />
                                </Button>
                                <Button size="sm" variant="primary" className="rounded-pill px-3 fw-bold shadow-sm" disabled={item.totalStock <= 0} onClick={() => { setSelectedItem(item); setShowUseModal(true); }}>
                                  Mark Used
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  </div>

      {/* Use Stock Modal */}
      <Modal show={showUseModal} onHide={() => !isSubmitting && setShowUseModal(false)} centered contentClassName="rounded-4">
        <Modal.Header closeButton={!isSubmitting} className="border-0 pb-0"><Modal.Title className="fw-bold">Deduct Stock</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
          {selectedItem && (
            <Form onSubmit={handleUseSubmit}>
              <div className="mb-4 bg-light p-3 rounded-3 d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-bold">ITEM</div>
                  <div className="fw-bold h5 mb-0 text-primary">{selectedItem._id}</div>
                </div>
                <div className="text-end">
                  <div className="text-muted small fw-bold">AVAILABLE</div>
                  <div className="fw-bold h5 mb-0 text-success">{selectedItem.totalStock} {selectedItem.unit}</div>
                </div>
              </div>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small text-muted">QUANTITY TO DEDUCT ({selectedItem.unit})</Form.Label>
                <Form.Control type="number" step="0.01" min="0.01" max={selectedItem.totalStock} className="modern-input" value={quantityUsed} onChange={(e) => setQuantityUsed(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small text-muted">COMMENTS / REASON</Form.Label>
                <Form.Control as="textarea" rows={3} className="modern-input" style={{ height: 'auto' }} value={useComment} onChange={(e) => setUseComment(e.target.value)} placeholder="Why is this stock being deducted?" />
              </Form.Group>
              <div className="d-flex gap-2">
                <Button variant="light" className="w-100 rounded-pill fw-bold py-3" onClick={() => setShowUseModal(false)} disabled={isSubmitting}>Cancel</Button>
                <Button variant="primary" type="submit" className="w-100 rounded-pill fw-bold py-3 shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Confirm Deduction'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Threshold / Settings Modal */}
      <Modal show={showThresholdModal} onHide={() => !isSubmitting && setShowThresholdModal(false)} centered contentClassName="rounded-4">
        <Modal.Header closeButton={!isSubmitting} className="border-0 pb-0"><Modal.Title className="fw-bold">Item Settings — {thresholdItem?._id}</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">🔔 Low Stock Alert Threshold</Form.Label>
            <Form.Control type="number" min="0" step="0.01" className="modern-input" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            <small className="text-muted mt-2 d-block px-1">Warn when stock drops below this value. Set 0 to disable.</small>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-bold small text-muted text-uppercase mb-3">📊 Tracking Level</Form.Label>
            <div className="d-flex flex-column gap-2">
              {TRACKING_LEVELS.map((t) => (
                <div key={t.value} className={`border rounded-3 p-3 transition-all ${trackingLevel === t.value ? 'border-primary bg-primary-subtle' : 'bg-light'}`} style={{ cursor: 'pointer' }} onClick={() => setTrackingLevel(t.value)}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <input type="radio" className="form-check-input mt-0" name="tracking_level" checked={trackingLevel === t.value} readOnly />
                    <span className="fw-bold text-dark">{t.label}</span>
                  </div>
                  <div className="text-muted small ps-4">{t.desc}</div>
                </div>
              ))}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0">
          <Button variant="light" className="w-100 rounded-pill fw-bold py-3" onClick={() => setShowThresholdModal(false)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" className="w-100 rounded-pill fw-bold py-3 shadow-sm" onClick={handleThresholdSave} disabled={isSubmitting}>
            {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Save Settings'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StockManagement;

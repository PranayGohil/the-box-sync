import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Col, Row, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getCurrentStock, useInventoryStock, updateItemSettings } from 'api/inventory';

const customStyles = `
    .stock-container {
      background: #f8fafc;
      min-height: 100vh;
      padding-bottom: 5rem;
    }
    .page-card {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02) !important;
      overflow: hidden;
    }
    .modern-input {
      border-radius: 12px !important;
      padding: 0.8rem 1.25rem !important;
      border: 1.5px solid #e2e8f0 !important;
      font-weight: 600 !important;
      color: #334155 !important;
      transition: all 0.3s ease !important;
      background: #fcfdfe !important;
      height: 48px !important;
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
    .stock-management-item-header-row {
      display: flex;
      padding: 0 1rem;
      margin-bottom: 1rem;
      color: #94a3b8;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stock-management-item-row-card {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      padding: 1.25rem !important;
      margin-bottom: 1.25rem !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stock-management-item-row-card:hover {
      border-color: rgba(35, 179, 244, 0.4) !important;
      box-shadow: 0 10px 25px rgba(35, 179, 244, 0.06) !important;
      transform: translateY(-2px);
    }
    .stock-management-item-row-card.stock-management-low-stock {
      border-left: 4px solid #f43f5e !important;
      background: #fffafa !important;
    }
    .stock-management-stock-val {
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1.2;
    }
    .stock-management-unit-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .stock-management-status-pill {
      padding: 0.45rem 1rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .stock-management-status-pill.stock-management-auto { background: #f1f5f9; color: #64748b; }
    .stock-management-status-pill.stock-management-critical { background: #fff1f2; color: #f43f5e; }
    .stock-management-status-pill.active-min { background: #f0f9ff; color: #0ea5e9; }
    
    .stock-management-btn-pill-action {
      border-radius: 50px !important;
      padding: 0.45rem 1.25rem !important;
      font-weight: 700 !important;
      border-width: 2px !important;
      font-size: 0.75rem !important;
    }
    .stock-management-btn-icon-round {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #e2e8f0;
      color: #64748b;
      background: #ffffff;
      transition: all 0.2s ease;
    }
    .stock-management-btn-icon-round:hover {
      border-color: #23b3f4;
      color: #23b3f4;
      background: #f0f9ff;
    }
    .stock-management-alert-premium {
      border-radius: 1rem !important;
      padding: 1rem 1.5rem !important;
    }
    .stock-management-header-btn {
       border-radius: 50px !important;
       padding: 0.5rem 1.25rem !important;
       font-weight: 700 !important;
       font-size: 0.8rem !important;
    }
    .stock-management-info-label-xs {
      font-size: 0.6rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .ms-stock-management-auto {
      margin-left: auto !important;
    }

    .stock-container .btn {
      transition: all 0.2s ease-in-out !important;
    }
    .stock-container .btn:hover {
      transform: translateY(-2px) !important;
    }
    .stock-container .btn:not(.btn-sm) {
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
    .stock-container .btn.btn-sm {
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
    .stock-container .btn-primary {
      background-color: #23b3f4 !important;
      border-color: #23b3f4 !important;
      box-shadow: 0 4px 10px rgba(35, 179, 244, 0.15) !important;
    }
    .stock-container .btn-primary:hover {
      background-color: #179edb !important;
      border-color: #179edb !important;
      box-shadow: 0 6px 15px rgba(35, 179, 244, 0.25) !important;
    }
    .stock-container .btn-outline-primary,
    .manage-menu-custom-btn-outline {
      border: 1px solid #23b3f4 !important;
      color: #23b3f4 !important;
      background-color: #ffffff !important;
    }
    .stock-container .btn-outline-primary:hover,
    .manage-menu-custom-btn-outline:hover {
      background-color: #23b3f4 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
    }
    .stock-container .btn-outline-primary:hover svg,
    .manage-menu-custom-btn-outline:hover svg {
      stroke: #ffffff !important;
    }
    .stock-container .btn-outline-danger {
      border: 1px solid #ef4444 !important;
      color: #ef4444 !important;
      background-color: #ffffff !important;
    }
    .stock-container .btn-outline-danger:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
    .stock-container .btn-outline-danger:hover svg {
      stroke: #ffffff !important;
    }
    .stock-container .btn-outline-warning {
      border: 1px solid #f59e0b !important;
      color: #f59e0b !important;
      background-color: #ffffff !important;
    }
    .stock-container .btn-outline-warning:hover {
      background-color: #f59e0b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25) !important;
    }
    .stock-container .btn-outline-warning:hover svg {
      stroke: #ffffff !important;
    }
    .stock-container .btn-outline-secondary {
      border: 1px solid #64748b !important;
      color: #64748b !important;
      background-color: #ffffff !important;
    }
    .stock-container .btn-outline-secondary:hover {
      background-color: #64748b !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(100, 116, 139, 0.25) !important;
    }
    .stock-container .btn-outline-secondary:hover svg {
      stroke: #ffffff !important;
    }

    .modal-content {
      border-radius: 1.5rem !important;
      overflow: hidden !important;
    }
    @media (max-width: 991px) {
      .stock-management-main-workstation { padding: 1rem !important; }
      .stock-management-item-row-card { padding: 1.25rem !important; margin-bottom: 1rem; }
      .stock-management-mobile-info-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .stock-management-mobile-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.25rem;
        width: 100%;
      }
      .stock-management-mobile-actions .stock-management-btn-pill-action { flex: 1; }
    }
`;

const TRACKING_LEVELS = [
  { value: 'daily_critical', label: '🔴 Daily Critical', desc: 'Verified every day' },
  { value: 'weekly', label: '🟡 Weekly', desc: 'Verified once a week' },
  { value: 'monthly', label: '🟢 Monthly', desc: 'Verified once a month' },
  { value: 'auto', label: '⚪ Auto Only', desc: 'System tracks, no manual check' },
];

const StockManagement = () => {
  const history = useHistory();
  const title = 'Stock Control';
  const description = 'Monitor current stock levels, configure alert thresholds, and deduct stock.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/stock-management', text: 'Operations' },
    { to: 'operations/stock-management', title: 'Stock Control' },
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

  useEffect(() => {
    fetchStock();
  }, []);

  const handleUseSubmit = async (e) => {
    e.preventDefault();
    if (!quantityUsed || Number(quantityUsed) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    try {
      setIsSubmitting(true);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const res = await useInventoryStock({
        item_name: selectedItem._id,
        quantity_used: quantityUsed,
        comment: useComment,
      });
      if (res.data.success) {
        toast.success('Stock deducted successfully');
        setShowUseModal(false);
        setSelectedItem(null);
        setQuantityUsed('');
        setUseComment('');
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
      <div className="stock-container">
        <style>{customStyles}</style>
        <HtmlHead title={title} description={description} />
        <div className="container-fluid qsr-page-container">
          <div className="qsr-page-title-container">
            <Row className="g-0 align-items-center">
              <Col xs="auto" className="me-auto">
                <h1 className="qsr-page-title">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
              </Col>
              <Col xs="12" md="auto" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
                <Button onClick={() => history.goBack()} className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2">
                  <CsLineIcons icon="arrow-left" size="18" className="me-2" /> Back
                </Button>
                <Button href="/operations/daily-stock-logs" className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2">
                  <CsLineIcons icon="file-text" size="18" className="me-2" /> <span className="d-none d-sm-inline">Audit Logs</span>
                </Button>
                <Button
                  href="/operations/wastage-log"
                  className="manage-menu-custom-btn-outline border-danger text-danger shadow-sm border-0 px-4 py-2"
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                >
                  <CsLineIcons icon="bin" size="18" className="me-2" /> <span className="d-none d-sm-inline">Wastage</span>
                </Button>
              </Col>
            </Row>
          </div>

          {lowStockCount > 0 && (
            <Alert variant="warning" className="border-0 shadow-sm rounded-4 d-flex align-items-center gap-3 mb-4 p-3 bg-white">
              <div
                className="bg-warning text-white rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: '40px', height: '40px' }}
              >
                <CsLineIcons icon="warning-hexagon" size="20" />
              </div>
              <div>
                <div className="fw-bold text-dark">
                  {lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} below threshold!
                </div>
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
                <div className="stock-management-main-workstation">
                  <div className="stock-management-item-header-row d-none d-lg-flex">
                    <div style={{ flex: 2 }}>Item</div>
                    <div style={{ flex: 1 }}>In Stock</div>
                    <div style={{ flex: 1 }}>Safety Min</div>
                    <div style={{ flex: 1 }}>Tracking Strategy</div>
                    <div style={{ width: '180px' }} className="text-end">
                      Actions
                    </div>
                  </div>

                  {stockData.map((item, idx) => {
                    const isBelow = item.low_stock_threshold > 0 && item.totalStock < item.low_stock_threshold;
                    return (
                      <div key={idx} className={`stock-management-item-row-card ${isBelow ? 'stock-management-low-stock' : ''}`}>
                        <Row className="w-100 g-0 align-items-center">
                          <Col lg={4} className="d-flex align-items-center gap-3" style={{ flex: 2 }}>
                            <div
                              className={`p-2 rounded-xl d-flex align-items-center justify-content-center shadow-sm ${
                                isBelow ? 'bg-danger text-white' : 'bg-light text-muted'
                              }`}
                              style={{ width: '44px', height: '44px', borderRadius: '12px' }}
                            >
                              <CsLineIcons icon={isBelow ? 'warning-hexagon' : 'box'} size="20" />
                            </div>
                            <div>
                              <div className="fw-bold text-dark h6 mb-0">{item._id}</div>
                              {isBelow && (
                                <div className="text-danger mt-1" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                                  CRITICAL ALERT
                                </div>
                              )}
                            </div>
                            <div className="ms-stock-management-auto d-lg-none text-end">
                              <div
                                className={`stock-management-stock-val h5 mb-0 fw-bold ${
                                  item.totalStock <= 0 ? 'text-danger' : isBelow ? 'text-warning' : 'text-success'
                                }`}
                              >
                                {item.totalStock}
                              </div>
                              <div className="stock-management-unit-text small text-muted fw-bold">{item.unit}</div>
                            </div>
                          </Col>

                          <Col lg={2} className="d-none d-lg-block" style={{ flex: 1 }}>
                            <div className={`stock-management-stock-val ${item.totalStock <= 0 ? 'text-danger' : isBelow ? 'text-warning' : 'text-success'}`}>
                              {item.totalStock}
                            </div>
                            <div className="stock-management-unit-text">{item.unit}</div>
                          </Col>

                          <Col lg={2} className="d-none d-lg-block" style={{ flex: 1 }}>
                            {item.low_stock_threshold > 0 ? (
                              <span className={`stock-management-status-pill ${isBelow ? 'stock-management-critical' : 'active-min'}`}>
                                Min: {item.low_stock_threshold}
                              </span>
                            ) : (
                              <span className="text-muted small fw-bold">Not Set</span>
                            )}
                          </Col>

                          <Col lg={2} className="d-none d-lg-block" style={{ flex: 1 }}>
                            <span className="stock-management-status-pill stock-management-auto">{item.tracking_level || 'auto'}</span>
                          </Col>

                          <div className="stock-management-mobile-info-grid d-lg-none mt-3 p-3 bg-light rounded-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div className="stock-management-info-label-xs mb-0">Safety Min</div>
                              {item.low_stock_threshold > 0 ? (
                                <span className={`stock-management-status-pill ${isBelow ? 'stock-management-critical' : 'active-min'}`}>
                                  Min: {item.low_stock_threshold}
                                </span>
                              ) : (
                                <span className="text-muted small fw-bold">N/A</span>
                              )}
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="stock-management-info-label-xs mb-0">Tracking</div>
                              <span className="stock-management-status-pill stock-management-auto">{item.tracking_level || 'auto'}</span>
                            </div>
                          </div>

                          <Col
                            lg="auto"
                            style={{ width: '180px' }}
                            className="ms-stock-management-auto d-none d-lg-flex gap-2 justify-content-end align-items-center"
                          >
                            <button type="button" className="stock-management-btn-icon-round" title="Settings" onClick={() => openThresholdModal(item)}>
                              <CsLineIcons icon="gear" size="16" />
                            </button>
                            <Button
                              variant="outline-primary"
                              className="stock-management-btn-pill-action border-2 px-3 fw-bold"
                              disabled={item.totalStock <= 0}
                              onClick={() => {
                                setSelectedItem(item);
                                setShowUseModal(true);
                              }}
                            >
                              Mark Used
                            </Button>
                          </Col>

                          <div className="stock-management-mobile-actions d-lg-none">
                            <button type="button" className="stock-management-btn-icon-round" onClick={() => openThresholdModal(item)}>
                              <CsLineIcons icon="gear" size="18" />
                            </button>
                            <Button
                              variant="outline-primary"
                              className="stock-management-btn-pill-action border-2 flex-grow-1 fw-bold"
                              disabled={item.totalStock <= 0}
                              onClick={() => {
                                setSelectedItem(item);
                                setShowUseModal(true);
                              }}
                            >
                              Mark Used
                            </Button>
                          </div>
                        </Row>
                      </div>
                    );
                  })}
                </div>
              )}
            </Col>
          </Row>
        </div>
      </div>

      {/* Use Stock Modal */}
      <Modal
        show={showUseModal}
        onHide={() => !isSubmitting && setShowUseModal(false)}
        centered
        dialogClassName="modal-dialog-centered"
        contentClassName="border-0 shadow-lg"
        style={{ backdropFilter: 'blur(5px)' }}
      >
        <Modal.Header closeButton={!isSubmitting} className="border-0 bg-light p-4">
          <Modal.Title className="fw-bold d-flex align-items-center">
            <CsLineIcons icon="box" className="text-primary me-2" size="20" />
            Deduct Stock
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedItem && (
            <Form onSubmit={handleUseSubmit}>
              <div className="mb-4 bg-light p-3 rounded-4 d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-bold">ITEM</div>
                  <div className="fw-bold h5 mb-0 text-primary">{selectedItem._id}</div>
                </div>
                <div className="text-end">
                  <div className="text-muted small fw-bold">AVAILABLE</div>
                  <div className="fw-bold h5 mb-0 text-success">
                    {selectedItem.totalStock} {selectedItem.unit}
                  </div>
                </div>
              </div>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small text-muted">QUANTITY TO DEDUCT ({selectedItem.unit})</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedItem.totalStock}
                  className="modern-input"
                  value={quantityUsed}
                  onChange={(e) => setQuantityUsed(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small text-muted">COMMENTS / REASON</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  className="modern-input"
                  style={{ height: 'auto' }}
                  value={useComment}
                  onChange={(e) => setUseComment(e.target.value)}
                  placeholder="Why is this stock being deducted?"
                />
              </Form.Group>
              <div className="d-flex gap-3 justify-content-center">
                <Button
                  variant="secondary"
                  className="rounded-pill px-4 fw-bold shadow-sm flex-grow-1"
                  onClick={() => setShowUseModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" className="rounded-pill px-4 fw-bold shadow-sm flex-grow-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Deducting...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Threshold / Settings Modal */}
      <Modal
        show={showThresholdModal}
        onHide={() => !isSubmitting && setShowThresholdModal(false)}
        centered
        dialogClassName="modal-dialog-centered"
        contentClassName="border-0 shadow-lg"
        style={{ backdropFilter: 'blur(5px)' }}
      >
        <Modal.Header closeButton={!isSubmitting} className="border-0 bg-light p-4">
          <Modal.Title className="fw-bold d-flex align-items-center">
            <CsLineIcons icon="gear" className="text-primary me-2" size="20" />
            Item Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="h5 fw-bold mb-4 text-primary">{thresholdItem?._id}</div>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold small text-muted text-uppercase mb-2">Low Stock Alert Threshold</Form.Label>
            <Form.Control type="number" min="0" step="0.01" className="modern-input" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            <small className="text-muted mt-2 d-block px-1">Warn when stock drops below this value. Set 0 to disable.</small>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-bold small text-muted text-uppercase mb-3">Tracking Strategy</Form.Label>
            <div className="d-flex flex-column gap-2">
              {TRACKING_LEVELS.map((t) => (
                <div
                  key={t.value}
                  className={`border rounded-3 p-3 transition-all ${trackingLevel === t.value ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setTrackingLevel(t.value)}
                >
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
        <Modal.Footer className="border-0 p-4 pt-0 justify-content-center gap-3">
          <Button
            variant="secondary"
            className="rounded-pill px-4 fw-bold shadow-sm flex-grow-1"
            onClick={() => setShowThresholdModal(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm flex-grow-1" onClick={handleThresholdSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StockManagement;

import React, { useState, useEffect } from 'react';
import { Button, Col, Row, Modal, Form, Spinner, Card, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getCurrentStock, useInventoryStock, updateItemSettings } from 'api/inventory';

const customStyles = `
    .stock-container {
      background: #f9f9fb;
      min-height: 100vh;
    }
    .main-workstation {
      background: #ffffff !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01) !important;
      padding: 1.5rem !important;
      max-width: 1400px;
      margin: 0 auto;
    }
    .item-header-row {
      display: flex;
      padding: 0 1rem;
      margin-bottom: 1rem;
      color: #94a3b8;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .item-row-card {
      background: #ffffff !important;
      border-radius: 1rem !important;
      border: 1px solid #f1f5f9 !important;
      padding: 1rem 1.25rem !important;
      margin-bottom: 0.75rem;
      transition: all 0.2s ease;
    }
    .item-row-card:hover {
      border-color: rgba(35, 179, 244, 0.4) !important;
      background: #fcfdfe !important;
    }
    .item-row-card.low-stock {
      border-left: 4px solid #f43f5e !important;
      background: #fffafb !important;
    }
    .stock-val {
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1.2;
    }
    .unit-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .status-pill {
      padding: 0.35rem 0.75rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .status-pill.auto { background: #f1f5f9; color: #64748b; }
    .status-pill.critical { background: #fff1f2; color: #f43f5e; }
    .status-pill.active-min { background: #f0f9ff; color: #0ea5e9; }
    
    .btn-pill-action {
      border-radius: 50px !important;
      padding: 0.45rem 1.25rem !important;
      font-weight: 700 !important;
      border-width: 2px !important;
      font-size: 0.75rem !important;
    }
    .btn-icon-round {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #f1f5f9;
      color: #64748b;
      background: #ffffff;
    }
    .alert-premium {
      border-radius: 1rem !important;
      padding: 1rem 1.5rem !important;
    }
    .header-btn {
       border-radius: 50px !important;
       padding: 0.5rem 1.25rem !important;
       font-weight: 700 !important;
       font-size: 0.8rem !important;
    }
    .info-label-xs {
      font-size: 0.6rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    @media (max-width: 991px) {
      .main-workstation { padding: 1rem !important; }
      .item-row-card { padding: 1.25rem !important; margin-bottom: 1rem; }
      .mobile-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;
      }
      .mobile-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.25rem;
        width: 100%;
      }
      .mobile-actions .btn-pill-action { flex: 1; }
    }
`;

const TRACKING_LEVELS = [
  { value: 'daily_critical', label: '🔴 Daily Critical', desc: 'Verified every day' },
  { value: 'weekly', label: '🟡 Weekly', desc: 'Verified once a week' },
  { value: 'monthly', label: '🟢 Monthly', desc: 'Verified once a month' },
  { value: 'auto', label: '⚪ Auto Only', desc: 'System tracks' },
];

const StockManagement = () => {
  const title = 'Stock Control';
  const brandColor = '#23b3f4';
  
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityUsed, setQuantityUsed] = useState('');
  const [useComment, setUseComment] = useState('');

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
      toast.error('Failed to load stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, []);

  const handleUseSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await useInventoryStock({ item_name: selectedItem._id, quantity_used: quantityUsed, comment: useComment });
      if (res.data.success) {
        toast.success('Stock updated');
        setShowUseModal(false); setSelectedItem(null); setQuantityUsed(''); setUseComment('');
        fetchStock();
      }
    } catch (err) {
      toast.error('Update failed');
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
      toast.success('Threshold updated');
      setShowThresholdModal(false);
      fetchStock();
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lowStockCount = stockData.filter((s) => s.low_stock_threshold > 0 && s.totalStock < s.low_stock_threshold).length;

  return (
    <div className="stock-container">
      <style>{customStyles}</style>
      <HtmlHead title={title} />
      <div className="container px-lg-5">
        <div className="page-title-container mb-4 mt-n3">
          <Row className="g-3 align-items-center">
            <Col xs="12" md="7">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'operations/stock-management', text: 'Operations' }, { to: '', title: 'Stock Management' }]} />
            </Col>
            <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button variant="outline-primary" className="rounded-pill px-4 fw-bold border-2" href="/operations/daily-stock-logs">
                <CsLineIcons icon="file-text" size="14" className="me-1" /> <span className="d-none d-md-inline">Logs</span>
              </Button>
              <Button variant="outline-danger" className="rounded-pill px-4 fw-bold border-2" href="/operations/wastage-log">
                <CsLineIcons icon="bin" size="14" className="me-1" /> <span className="d-none d-md-inline">Wastage</span>
              </Button>
            </Col>
          </Row>
        </div>

        {lowStockCount > 0 && (
          <Alert variant="warning" className="alert-premium d-flex align-items-center gap-3 mb-4 shadow-sm border-0">
            <CsLineIcons icon="warning-hexagon" size="20" className="text-warning" />
            <div className="small fw-bold">{lowStockCount} items below threshold! <span className="fw-normal text-muted ms-1">Please restock.</span></div>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          <div className="main-workstation">
            <div className="item-header-row d-none d-lg-flex">
              <div style={{flex: 2}}>Item</div>
              <div style={{flex: 1}}>In Stock</div>
              <div style={{flex: 1}}>Safety Min</div>
              <div style={{flex: 1}}>Tracking</div>
              <div style={{width: '180px'}} className="text-end">Actions</div>
            </div>

            {stockData.map((item, idx) => {
              const isBelow = item.low_stock_threshold > 0 && item.totalStock < item.low_stock_threshold;
              return (
                <div key={idx} className={`item-row-card ${isBelow ? 'low-stock' : ''}`}>
                  <Row className="w-100 g-0 align-items-center">
                    <Col lg={4} className="d-flex align-items-center gap-3" style={{flex: 2}}>
                      <div className={`p-2 rounded-3 d-flex align-items-center justify-content-center ${isBelow ? 'bg-danger text-white' : 'bg-light text-muted'}`} style={{width: '36px', height: '36px'}}>
                         <CsLineIcons icon={isBelow ? 'warning-hexagon' : 'box'} size="16" />
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{item._id}</div>
                        {isBelow && <div className="text-danger" style={{fontSize: '0.65rem', fontWeight: 800}}>CRITICAL ALERT</div>}
                      </div>
                      <div className="ms-auto d-lg-none">
                         <div className={`stock-val text-end ${item.totalStock <= 0 ? 'text-danger' : isBelow ? 'text-warning' : 'text-success'}`}>{item.totalStock}</div>
                         <div className="unit-text text-end">{item.unit}</div>
                      </div>
                    </Col>
                    
                    <Col lg={2} className="d-none d-lg-block" style={{flex: 1}}>
                      <div className={`stock-val ${item.totalStock <= 0 ? 'text-danger' : isBelow ? 'text-warning' : 'text-success'}`}>{item.totalStock}</div>
                      <div className="unit-text">{item.unit}</div>
                    </Col>
                    
                    <Col lg={2} className="d-none d-lg-block" style={{flex: 1}}>
                      {item.low_stock_threshold > 0 ? (
                        <span className={`status-pill ${isBelow ? 'critical' : 'active-min'}`}>Min: {item.low_stock_threshold}</span>
                      ) : <span className="text-muted small fw-bold">Not Set</span>}
                    </Col>
                    
                    <Col lg={2} className="d-none d-lg-block" style={{flex: 1}}>
                       <span className="status-pill auto">{item.tracking_level || 'auto'}</span>
                    </Col>

                    <div className="mobile-info-grid d-lg-none">
                       <div><div className="info-label-xs">Safety Min</div>{item.low_stock_threshold > 0 ? <span className={`status-pill ${isBelow ? 'critical' : 'active-min'}`}>Min: {item.low_stock_threshold}</span> : <span className="text-muted small">N/A</span>}</div>
                       <div><div className="info-label-xs">Tracking</div><span className="status-pill auto">{item.tracking_level || 'auto'}</span></div>
                    </div>
                    
                    <Col lg="auto" style={{width: '180px'}} className="ms-auto d-none d-lg-flex gap-2 justify-content-end align-items-center">
                      <button type="button" className="btn-icon-round" title="Settings" onClick={() => openThresholdModal(item)}><CsLineIcons icon="gear" size="16" /></button>
                      <Button variant="outline-primary" className="btn-pill-action border-2" disabled={item.totalStock <= 0} onClick={() => { setSelectedItem(item); setShowUseModal(true); }}>Mark Used</Button>
                    </Col>

                    <div className="mobile-actions d-lg-none">
                       <button type="button" className="btn-icon-round" onClick={() => openThresholdModal(item)}><CsLineIcons icon="gear" size="18" /></button>
                       <Button variant="outline-primary" className="btn-pill-action border-2 flex-grow-1" disabled={item.totalStock <= 0} onClick={() => { setSelectedItem(item); setShowUseModal(true); }}>Mark Used</Button>
                    </div>
                  </Row>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal show={showUseModal} onHide={() => !isSubmitting && setShowUseModal(false)} centered className="modern-modal">
        <Modal.Header closeButton={!isSubmitting} className="border-0 pb-0"><Modal.Title className="fw-bold">Deduct Stock</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
          {selectedItem && (
            <Form onSubmit={handleUseSubmit}>
              <div className="bg-light rounded-4 p-3 mb-3 d-flex justify-content-between align-items-center">
                <div><div className="info-label-xs">Item</div><div className="fw-bold">{selectedItem._id}</div></div>
                <div className="text-end"><div className="info-label-xs">Available</div><div className="fw-bold text-primary">{selectedItem.totalStock} {selectedItem.unit}</div></div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Amount to Deduct ({selectedItem.unit})</Form.Label>
                <Form.Control type="number" step="0.01" className="modern-input" value={quantityUsed} onChange={(e) => setQuantityUsed(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted">Reason</Form.Label>
                <Form.Control as="textarea" rows={2} className="modern-input" placeholder="Optional comment..." value={useComment} onChange={(e) => setUseComment(e.target.value)} />
              </Form.Group>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" className="flex-grow-1 btn-pill-action border-2" onClick={() => setShowUseModal(false)} disabled={isSubmitting}>Cancel</Button>
                <Button variant="outline-primary" type="submit" className="flex-grow-1 btn-pill-action border-2" disabled={isSubmitting}>{isSubmitting ? <Spinner animation="border" size="sm" /> : 'Deduct'}</Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showThresholdModal} onHide={() => !isSubmitting && setShowThresholdModal(false)} centered className="modern-modal">
        <Modal.Header closeButton={!isSubmitting} className="border-0 pb-0"><Modal.Title className="fw-bold">Settings</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
          <div className="h5 fw-bold mb-4 text-primary">{thresholdItem?._id}</div>
          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold text-muted">Low Stock Threshold</Form.Label>
            <Form.Control type="number" min="0" step="0.01" className="modern-input" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted mb-2">Tracking Strategy</Form.Label>
            {TRACKING_LEVELS.map((t) => (
              <div key={t.value} className={`p-2 px-3 rounded-3 border-2 mb-2 cursor-pointer ${trackingLevel === t.value ? 'bg-primary border-primary text-white' : 'bg-white'}`} onClick={() => setTrackingLevel(t.value)}>
                <div className="d-flex align-items-center gap-2">
                  <Form.Check type="radio" checked={trackingLevel === t.value} readOnly />
                  <div><div className="fw-bold small">{t.label}</div><div className={`x-small ${trackingLevel === t.value ? 'text-white-50' : 'text-muted'}`}>{t.desc}</div></div>
                </div>
              </div>
            ))}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Button variant="outline-secondary" className="btn-pill-action border-2 flex-grow-1" onClick={() => setShowThresholdModal(false)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="outline-primary" className="btn-pill-action border-2 flex-grow-1" onClick={handleThresholdSave} disabled={isSubmitting}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StockManagement;

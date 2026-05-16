import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Col, Row, Modal, Form, Spinner, Card, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getCurrentStock, useInventoryStock, updateItemSettings } from 'api/inventory';



const TRACKING_LEVELS = [
  { value: 'daily_critical', label: '🔴 Daily Critical', desc: 'Verified every day' },
  { value: 'weekly', label: '🟡 Weekly', desc: 'Verified once a week' },
  { value: 'monthly', label: '🟢 Monthly', desc: 'Verified once a month' },
  { value: 'auto', label: '⚪ Auto Only', desc: 'System tracks' },
];

const StockManagement = () => {
  const history = useHistory();
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
    <div className="stock-management-stock-container pb-5">
      
      <HtmlHead title={title} />
      <div className="container-fluid px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>{title}</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'operations/stock-management', text: 'Operations' }, { to: '', title: 'Stock Management' }]} />
            </Col>
            <Col xs="12" md="auto" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button onClick={() => history.goBack()} className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2">
                <CsLineIcons icon="arrow-left" size="18" className="me-2" /> Back
              </Button>
              <Button href="/operations/daily-stock-logs" className="manage-menu-custom-btn-outline shadow-sm border-0 px-4 py-2">
                <CsLineIcons icon="file-text" size="18" className="me-2" /> <span className="d-none d-sm-inline">Audit Logs</span>
              </Button>
              <Button href="/operations/wastage-log" className="manage-menu-custom-btn-outline border-danger text-danger shadow-sm border-0 px-4 py-2" style={{color: '#ef4444', borderColor: '#ef4444'}}>
                <CsLineIcons icon="bin" size="18" className="me-2" /> <span className="d-none d-sm-inline">Wastage</span>
              </Button>
            </Col>
          </Row>
        </div>

        {lowStockCount > 0 && (
          <Alert variant="warning" className="stock-management-alert-premium d-flex align-items-center gap-3 mb-4 shadow-sm border-0">
            <CsLineIcons icon="warning-hexagon" size="20" className="text-warning" />
            <div className="small fw-bold">{lowStockCount} items below threshold! <span className="fw-normal text-muted ms-1">Please restock.</span></div>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          <div className="stock-management-main-workstation">
            <div className="stock-management-item-header-row d-none d-lg-flex">
              <div style={{flex: 2}}>Item</div>
              <div style={{flex: 1}}>In Stock</div>
              <div style={{flex: 1}}>Safety Min</div>
              <div style={{flex: 1}}>Tracking</div>
              <div style={{width: '180px'}} className="text-end">Actions</div>
            </div>

            {stockData.map((item, idx) => {
              const isBelow = item.low_stock_threshold > 0 && item.totalStock < item.low_stock_threshold;
              return (
                <div key={idx} className={`stock-management-item-row-card ${isBelow ? 'stock-management-low-stock' : ''}`}>
                  <Row className="w-100 g-0 align-items-center">
                    <Col lg={4} className="d-flex align-items-center gap-3" style={{flex: 2}}>
                      <div className={`p-2 rounded-xl d-flex align-items-center justify-content-center shadow-sm ${isBelow ? 'bg-danger text-white' : 'bg-light text-muted'}`} style={{width: '44px', height: '44px', borderRadius: '12px'}}>
                         <CsLineIcons icon={isBelow ? 'warning-hexagon' : 'box'} size="20" />
                      </div>
                      <div>
                        <div className="fw-bold text-dark h6 mb-0">{item._id}</div>
                        {isBelow && <div className="text-danger" style={{fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em'}}>CRITICAL ALERT</div>}
                      </div>
                      <div className="ms-stock-management-auto d-lg-none text-end">
                         <div className={`stock-management-stock-val h5 mb-0 fw-bold ${item.totalStock <= 0 ? 'text-danger' : isBelow ? 'text-warning' : 'text-success'}`}>{item.totalStock}</div>
                         <div className="stock-management-unit-text small text-muted fw-bold">{item.unit}</div>
                      </div>
                    </Col>
                    
                    <Col lg={2} className="d-none d-lg-block" style={{flex: 1}}>
                      <div className={`stock-management-stock-val ${item.totalStock <= 0 ? 'text-danger' : isBelow ? 'text-warning' : 'text-success'}`}>{item.totalStock}</div>
                      <div className="stock-management-unit-text">{item.unit}</div>
                    </Col>
                    
                    <Col lg={2} className="d-none d-lg-block" style={{flex: 1}}>
                      {item.low_stock_threshold > 0 ? (
                        <span className={`stock-management-status-pill ${isBelow ? 'stock-management-critical' : 'active-min'}`}>Min: {item.low_stock_threshold}</span>
                      ) : <span className="text-muted small fw-bold">Not Set</span>}
                    </Col>
                    
                    <Col lg={2} className="d-none d-lg-block" style={{flex: 1}}>
                       <span className="stock-management-status-pill stock-management-auto">{item.tracking_level || 'auto'}</span>
                    </Col>

                    <div className="stock-management-mobile-info-grid d-lg-none mt-3 p-3 bg-light rounded-3">
                       <div className="d-flex justify-content-between align-items-center mb-2">
                         <div className="stock-management-info-label-xs mb-0">Safety Min</div>
                         {item.low_stock_threshold > 0 ? <span className={`stock-management-status-pill ${isBelow ? 'stock-management-critical' : 'active-min'}`}>Min: {item.low_stock_threshold}</span> : <span className="text-muted small fw-bold">N/A</span>}
                       </div>
                       <div className="d-flex justify-content-between align-items-center">
                         <div className="stock-management-info-label-xs mb-0">Tracking</div>
                         <span className="stock-management-status-pill stock-management-auto">{item.tracking_level || 'auto'}</span>
                       </div>
                    </div>
                    
                    <Col lg="auto" style={{width: '180px'}} className="ms-stock-management-auto d-none d-lg-flex gap-2 justify-content-end align-items-center">
                      <button type="button" className="stock-management-btn-icon-round" title="Settings" onClick={() => openThresholdModal(item)}><CsLineIcons icon="gear" size="16" /></button>
                      <Button variant="outline-primary" className="stock-management-btn-pill-action border-2" disabled={item.totalStock <= 0} onClick={() => { setSelectedItem(item); setShowUseModal(true); }}>Mark Used</Button>
                    </Col>

                    <div className="stock-management-mobile-actions d-lg-none">
                       <button type="button" className="stock-management-btn-icon-round" onClick={() => openThresholdModal(item)}><CsLineIcons icon="gear" size="18" /></button>
                       <Button variant="outline-primary" className="stock-management-btn-pill-action border-2 flex-grow-1" disabled={item.totalStock <= 0} onClick={() => { setSelectedItem(item); setShowUseModal(true); }}>Mark Used</Button>
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
                <div><div className="stock-management-info-label-xs">Item</div><div className="fw-bold">{selectedItem._id}</div></div>
                <div className="text-end"><div className="stock-management-info-label-xs">Available</div><div className="fw-bold text-primary">{selectedItem.totalStock} {selectedItem.unit}</div></div>
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
                <Button variant="outline-secondary" className="flex-grow-1 stock-management-btn-pill-action border-2" onClick={() => setShowUseModal(false)} disabled={isSubmitting}>Cancel</Button>
                <Button variant="outline-primary" type="submit" className="flex-grow-1 stock-management-btn-pill-action border-2" disabled={isSubmitting}>{isSubmitting ? <Spinner animation="border" size="sm" /> : 'Deduct'}</Button>
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
          <Button variant="outline-secondary" className="stock-management-btn-pill-action border-2 flex-grow-1" onClick={() => setShowThresholdModal(false)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="outline-primary" className="stock-management-btn-pill-action border-2 flex-grow-1" onClick={handleThresholdSave} disabled={isSubmitting}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StockManagement;

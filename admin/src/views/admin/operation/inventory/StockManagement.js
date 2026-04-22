import React, { useState, useEffect } from 'react';
import { Button, Col, Row, Modal, Form, Spinner, Card, Table, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { getCurrentStock, useInventoryStock, updateItemSettings } from 'api/inventory';

const TRACKING_LEVELS = [
  { value: 'daily_critical', label: '🔴 Daily Critical', desc: 'Verified every day' },
  { value: 'weekly', label: '🟡 Weekly', desc: 'Verified once a week' },
  { value: 'monthly', label: '🟢 Monthly', desc: 'Verified once a month' },
  { value: 'auto', label: '⚪ Auto Only', desc: 'System tracks, no manual check' },
];

const StockManagement = () => {
  const title = 'Stock Management';
  const description = 'Monitor current stock, configure alert thresholds, and deduct stock.';
  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'operations/stock-management', text: 'Operations' },
    { to: 'operations/stock-management', title: 'Stock Management' },
  ];

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
      <HtmlHead title={title} description={description} />
      <div className="page-title-container">
        <Row className="g-0">
          <Col className="col-auto mb-3 mb-sm-0 me-auto">
            <h1 className="mb-0 pb-0 display-4">{title}</h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <Button variant="outline-danger" size="sm" href="/operations/wastage-log">
              <CsLineIcons icon="bin" size="14" className="me-1" /> Log Wastage
            </Button>
          </Col>
        </Row>
      </div>

      {lowStockCount > 0 && (
        <Alert variant="warning" className="d-flex align-items-center gap-2 mb-3">
          <CsLineIcons icon="warning-hexagon" size="20" />
          <strong>{lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} below the minimum stock threshold!</strong>
          <span className="ms-1 text-muted small">Items highlighted in red below.</span>
        </Alert>
      )}

      <Row>
        <Col sm="12">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center mb-5 mt-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : stockData.length === 0 ? (
            <Alert variant="info">No stock data found.</Alert>
          ) : (
            <Card>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase text-muted text-small ps-3">Item Name</th>
                      <th className="text-uppercase text-muted text-small">Current Stock</th>
                      <th className="text-uppercase text-muted text-small">Alert Threshold</th>
                      <th className="text-uppercase text-muted text-small">Track Level</th>
                      <th className="text-uppercase text-muted text-small text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.map((item, index) => {
                      const isBelowThreshold = item.low_stock_threshold > 0 && item.totalStock < item.low_stock_threshold;
                      return (
                        <tr key={index} className={isBelowThreshold ? 'table-danger' : ''}>
                          <td className="align-middle fw-bold ps-3">
                            {isBelowThreshold && <span className="me-1">⚠️</span>}
                            {item._id}
                          </td>
                          <td className="align-middle">
                            <span className={item.totalStock <= 0 ? 'text-danger fw-bold' : isBelowThreshold ? 'text-warning fw-bold' : 'text-success fw-bold'}>
                              {item.totalStock}
                            </span>{' '}
                            <span className="text-muted text-small">{item.unit}</span>
                          </td>
                          <td className="align-middle">
                            {item.low_stock_threshold > 0 ? (
                              <Badge bg={isBelowThreshold ? 'danger' : 'light'} text={isBelowThreshold ? undefined : 'dark'}>
                                Min: {item.low_stock_threshold}
                              </Badge>
                            ) : <span className="text-muted text-small">Not set</span>}
                          </td>
                          <td className="align-middle">
                            <span className="text-muted text-small">{item.tracking_level || 'auto'}</span>
                          </td>
                          <td className="text-end align-middle pe-3">
                            <div className="d-flex gap-1 justify-content-end">
                              <Button size="sm" variant="outline-secondary" title="Item Settings" onClick={() => openThresholdModal(item)}>
                                <CsLineIcons icon="gear" size="13" />
                              </Button>
                              <Button size="sm" variant="outline-warning" disabled={item.totalStock <= 0} onClick={() => { setSelectedItem(item); setShowUseModal(true); }}>
                                Mark Used
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Use Stock Modal */}
      <Modal show={showUseModal} onHide={() => !isSubmitting && setShowUseModal(false)} centered>
        <Modal.Header closeButton={!isSubmitting}><Modal.Title>Deduct Stock</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <Form onSubmit={handleUseSubmit}>
              <div className="mb-3"><strong>Item:</strong> {selectedItem._id}</div>
              <div className="mb-3"><strong>Available Stock:</strong> {selectedItem.totalStock} {selectedItem.unit}</div>
              <Form.Group className="mb-3">
                <Form.Label>Quantity to Deduct ({selectedItem.unit})</Form.Label>
                <Form.Control type="number" step="0.01" min="0.01" max={selectedItem.totalStock} value={quantityUsed} onChange={(e) => setQuantityUsed(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Comments / Reason</Form.Label>
                <Form.Control as="textarea" rows={2} value={useComment} onChange={(e) => setUseComment(e.target.value)} />
              </Form.Group>
              <div className="text-end">
                <Button variant="outline-secondary" className="me-2" onClick={() => setShowUseModal(false)} disabled={isSubmitting}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Confirm Deduction'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Threshold / Settings Modal */}
      <Modal show={showThresholdModal} onHide={() => !isSubmitting && setShowThresholdModal(false)} centered>
        <Modal.Header closeButton={!isSubmitting}><Modal.Title>Item Settings — {thresholdItem?._id}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">🔔 Low Stock Alert Threshold</Form.Label>
            <Form.Text className="d-block text-muted mb-2">Show warning badge when stock drops below this. Set 0 to disable.</Form.Text>
            <Form.Control type="number" min="0" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-semibold">📊 Tracking Level</Form.Label>
            <Form.Text className="d-block text-muted mb-2">Controls which items appear in the daily opening/closing checklist.</Form.Text>
            {TRACKING_LEVELS.map((t) => (
              <Form.Check key={t.value} type="radio" id={`adm-track-${t.value}`} name="adm_tracking_level"
                label={<>{t.label} <span className="text-muted small">— {t.desc}</span></>}
                value={t.value} checked={trackingLevel === t.value}
                onChange={(e) => setTrackingLevel(e.target.value)} className="mb-2"
              />
            ))}
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

export default StockManagement;

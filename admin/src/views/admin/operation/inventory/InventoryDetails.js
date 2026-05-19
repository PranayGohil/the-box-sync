import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Spinner, Button, Alert, Modal, Badge } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';



const InventoryDetails = () => {
  const { id } = useParams();
  const history = useHistory();
  const brandColor = '#23b3f4';
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API}/inventory/get/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setInventory(res.data);
      } catch (err) {
        toast.error('Failed to load details.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/inventory/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Inventory deleted successfully!');
      history.push('/operations/inventory-history');
    } catch (err) {
      toast.error('Failed to delete inventory.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!inventory)
    return (
      <Alert variant="danger" className="m-5">
        Data not found.
      </Alert>
    );

  return (
    <div className="inventory-details-details-container">
      
      <HtmlHead title="Inventory Details" />
      <div className="container px-lg-5">
        <div className="page-title-container mb-4 mt-5 mt-lg-0">
          <Row className="g-0 align-items-center">
            <Col xs="auto" className="me-auto">
              <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: brandColor }}>Inventory Details</h1>
              <BreadcrumbList items={[{ to: '', text: 'Home' }, { to: 'operations/inventory', text: 'Inventory' }, { to: '', title: 'Details' }]} />
            </Col>
            <Col xs="12" md="5" className="d-flex justify-content-md-end gap-2 mt-3 mt-md-0">
              <Button variant="outline-secondary" onClick={() => history.push('/operations/inventory-history')} className="rounded-pill px-4 fw-bold border-2">
                <CsLineIcons icon="arrow-left" size="14" className="me-2" /> Back
              </Button>
              <Button variant="outline-warning" onClick={() => history.push(`/operations/edit-inventory/${id}`)} className="rounded-pill px-4 fw-bold border-2">
                <CsLineIcons icon="edit" size="14" className="me-2" /> Edit
              </Button>
              <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)} className="rounded-pill px-4 fw-bold border-2">
                <CsLineIcons icon="bin" size="14" className="me-2" /> Delete
              </Button>
            </Col>
          </Row>
        </div>

        <div className="inventory-details-overview-bar">
          <div className="d-flex gap-5">
            <div>
              <div className="inventory-details-info-label">Bill Date</div>
              <div className="inventory-details-info-val">{new Date(inventory.bill_date).toLocaleDateString('en-IN')}</div>
            </div>
            <div>
              <div className="inventory-details-info-label">Requested On</div>
              <div className="inventory-details-info-val">
                {new Date(inventory.request_date).toLocaleDateString('en-IN')} at{' '}
                {new Date(inventory.request_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <Badge bg={inventory.status === 'Completed' ? 'success' : inventory.status === 'Rejected' ? 'danger' : 'warning'} className="inventory-details-status-badge shadow-sm">
            {inventory.status}
          </Badge>
        </div>

        {inventory.reject_reason && (
          <Alert variant="danger" className="rounded-4 p-4 border-0 shadow-sm mb-4">
            <div className="fw-bold mb-1">
              <CsLineIcons icon="error" size="18" className="me-2" /> Rejection Reason
            </div>
            <div className="text-dark">{inventory.reject_reason}</div>
          </Alert>
        )}

        <Card className="inventory-details-section-card border-0">
          <div className="section-label">
            <CsLineIcons icon="file-text" size="18" /> Purchase Information
          </div>
          <Row className="g-4">
            <Col xs={12} md={4}>
              <div>
                <div className="inventory-details-info-label">Bill Number</div>
                <div className="h5 fw-bold mb-0">{inventory.bill_number || 'N/A'}</div>
              </div>
            </Col>
            <Col xs={6} md={4}>
              <div>
                <div className="inventory-details-info-label">Category</div>
                <div className="h5 fw-bold mb-0">{inventory.category || 'N/A'}</div>
              </div>
            </Col>
            <Col xs={6} md={4}>
              <div>
                <div className="inventory-details-info-label">Vendor Name</div>
                <div className="h5 fw-bold mb-0">{inventory.vendor_name || 'N/A'}</div>
              </div>
            </Col>
          </Row>
        </Card>

        <Card className="inventory-details-section-card border-0">
          <div className="section-label">
            <CsLineIcons icon="shopping-basket" size="18" /> Item Manifest
          </div>
          <div className="inventory-details-item-header-row d-none d-lg-flex">
            <div style={{ width: '60px' }}>#</div>
            <div style={{ flex: 2 }}>Description</div>
            <div style={{ flex: 1 }}>Quantity</div>
            <div style={{ flex: 1 }}>Unit Price</div>
            <div style={{ flex: 1 }} className="text-end">
              Subtotal
            </div>
          </div>
          {inventory.items.map((item, index) => (
            <div key={index} className="inventory-details-item-row-card">
              <div style={{ width: '60px' }} className="fw-bold text-muted">
                <span className="inventory-details-mobile-label">#</span>
                {index + 1}
              </div>
              <div style={{ flex: 2 }} className="fw-bold text-dark">
                <span className="inventory-details-mobile-label">Description</span>
                {item.item_name}
              </div>
              <div style={{ flex: 1 }} className="fw-bold">
                <span className="inventory-details-mobile-label">Quantity</span>
                {item.item_quantity} {item.unit}
              </div>
              <div style={{ flex: 1 }} className="text-muted">
                <span className="inventory-details-mobile-label">Unit Price</span>
                ₹ {item.item_price || '0.00'}
              </div>
              <div style={{ flex: 1 }} className="text-md-end fw-bold text-primary">
                <span className="inventory-details-mobile-label">Subtotal</span>
                ₹ {(item.item_quantity * (item.item_price || 0)).toFixed(2)}
              </div>
            </div>
          ))}

          <div className="inventory-details-summary-hub mt-5">
            <Row className="g-4">
              <Col xs={12} md={4}>
                <div>
                  <div className="inventory-details-info-label">Net Subtotal</div>
                  <div className="h5 fw-bold text-muted">₹ {Number(inventory.sub_total || 0).toFixed(2)}</div>
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div>
                  <div className="inventory-details-info-label">Tax (GST/VAT)</div>
                  <div className="h5 fw-bold text-muted">₹ {Number(inventory.tax || 0).toFixed(2)}</div>
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div>
                  <div className="inventory-details-info-label">Discount Applied</div>
                  <div className="h5 fw-bold text-success">- ₹ {Number(inventory.discount || 0).toFixed(2)}</div>
                </div>
              </Col>

              <Col md={12}>
                <div className="inventory-details-total-display shadow-sm">
                  <div>
                    <div className="inventory-details-info-label mb-1">Total Grand Amount</div>
                    <div className="inventory-details-total-val">₹ {Number(inventory.total_amount || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-md-end">
                    <div>
                      <div className="inventory-details-info-label">Amount Paid</div>
                      <div className="h3 fw-bold text-success mb-0">₹ {Number(inventory.paid_amount || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={12} className="text-end pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <div className={`sw-2 sh-2 rounded-circle bg-${Number(inventory.unpaid_amount || 0) > 0 ? 'warning' : 'success'}`} />{' '}
                  <span className="fw-bold text-muted">
                    Balance {Number(inventory.unpaid_amount || 0) > 0 ? 'Due' : 'Cleared'}: ₹ {Number(inventory.unpaid_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-muted small">This record is synchronized with global financial ledgers.</div>
              </Col>
            </Row>
          </div>
        </Card>

        {inventory.bill_files?.length > 0 && (
          <Card className="inventory-details-section-card border-0">
            <div className="section-label">
              <CsLineIcons icon="file-text" size="18" /> Supporting Documents
            </div>
            <Row className="g-3">
              {inventory.bill_files.map((file, idx) => {
                const fileUrl = `${process.env.REACT_APP_UPLOAD_DIR}${file}`;
                const isPdf = file.toLowerCase().endsWith('.pdf');
                return (
                  <Col key={idx} xs={12} md={3}>
                    <div className="inventory-details-file-card">
                      <div
                        className="mb-3 d-flex justify-content-center align-items-center"
                        style={{ height: '100px', background: '#f8fafc', borderRadius: '12px' }}
                      >
                        {isPdf ? (
                          <CsLineIcons icon="file-text" size="48" className="text-danger" />
                        ) : (
                          <img src={fileUrl} alt="Bill" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                        )}
                      </div>
                      <div className="text-truncate small fw-bold text-muted mb-2">{file}</div>
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="text-decoration-none">
                        <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold border-2">
                          <CsLineIcons icon="download" size="12" className="me-1" /> View
                        </Button>
                      </a>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="d-flex align-items-center mb-3">
            <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
              <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
            </div>
            <div>
              <p className="mb-0 fw-bold text-dark">Permanently delete this record?</p>
              <p className="mb-1 text-muted small">This clears the inventory log from your historical logs.</p>
              <p className="mb-0 text-success small fw-semibold">Don't worry, your physical stock quantities remain perfectly safe.</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="light" 
            onClick={() => setShowDeleteModal(false)} 
            disabled={deleting}
            className="rounded-pill px-4 fw-bold inventory-details-btn-action text-muted border-0"
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            disabled={deleting}
            className="rounded-pill px-4 fw-bold shadow-sm inventory-details-btn-action text-danger border-danger"
          >
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <div className="d-flex align-items-center">
                <CsLineIcons icon="bin" size="16" className="me-2" stroke="currentColor" />
                Delete
              </div>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryDetails;
